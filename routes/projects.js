const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /projects - List all projects for the authenticated user
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        criteria (
          must_have,
          want
        ),
        form_schema:form_schemas (
          schema
        )
      `)
      .eq('created_by', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /projects/:id - Retrieve a single project
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        criteria (
          must_have,
          want
        ),
        form_schema:form_schemas (
          schema
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return res.status(404).json({ error: 'Project not found' });
      }
      throw error;
    }
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /projects - Create a new project
router.post('/', async (req, res) => {
  try {
    const { name, description, criteria } = req.body;
    
    // Start a transaction
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert([{ 
        name, 
        description,
        created_by: req.user.id 
      }])
      .select()
      .single();

    if (projectError) throw projectError;

    // If criteria is provided, save it
    if (criteria) {
      const { error: criteriaError } = await supabase
        .from('criteria')
        .insert([{
          project_id: project.id,
          must_have: criteria.mustHave,
          want: criteria.want
        }]);

      if (criteriaError) throw criteriaError;

      // Fetch the project with criteria
      const { data: fullProject, error: fetchError } = await supabase
        .from('projects')
        .select(`
          *,
          criteria (
            must_have,
            want
          )
        `)
        .eq('id', project.id)
        .single();

      if (fetchError) throw fetchError;
      res.status(201).json(fullProject);
    } else {
      res.status(201).json(project);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /projects/:id/criteria - Define decision criteria
router.post('/:id/criteria', async (req, res) => {
  try {
    const { id } = req.params;
    const { mustHave, want } = req.body;
    
    // Validate at least one Must-Have criteria
    if (!mustHave || !Array.isArray(mustHave) || mustHave.length === 0) {
      return res.status(400).json({ error: 'At least one Must-Have criteria is required' });
    }

    const { data, error } = await supabase
      .from('criteria')
      .insert([{
        project_id: id,
        must_have: mustHave,
        want: want || []
      }])
      .select();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /projects/:id/form-schema - Define input schema
router.post('/:id/form-schema', async (req, res) => {
  try {
    const { id } = req.params;
    const { schema } = req.body;

    const { data, error } = await supabase
      .from('form_schemas')
      .insert([{
        project_id: id,
        schema
      }])
      .select();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /projects/:id/evaluate - Submit alternatives
router.post('/:id/evaluate', async (req, res) => {
  try {
    const { id } = req.params;
    const { alternative } = req.body;

    // Get project criteria
    const { data: criteria, error: criteriaError } = await supabase
      .from('criteria')
      .select('*')
      .eq('project_id', id)
      .single();

    if (criteriaError) throw criteriaError;

    // Validate against Must-Have criteria
    const failedMustHave = criteria.must_have.some(criterion => !alternative[criterion.id]);
    
    let score = 0;
    if (!failedMustHave) {
      // Calculate score based on Want criteria
      score = criteria.want.reduce((total, criterion) => {
        return total + (alternative[criterion.id] * criterion.weight);
      }, 0);
    }

    const { data, error } = await supabase
      .from('alternatives')
      .insert([{
        project_id: id,
        data: alternative,
        disqualified: failedMustHave,
        score: failedMustHave ? 0 : score
      }])
      .select();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /projects/:id/ai-evaluate - Submit alternatives for AI-powered scoring
router.post('/:id/ai-evaluate', async (req, res) => {
  try {
    const { id } = req.params;
    const { alternative } = req.body;

    // TODO: Implement AI scoring logic
    res.status(501).json({ message: 'AI evaluation not implemented yet' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /projects/:id/results - Retrieve evaluations
router.get('/:id/results', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('alternatives')
      .select('*')
      .eq('project_id', id)
      .order('score', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /projects/:id/results/:itemId - Remove an entry
router.delete('/:id/results/:itemId', async (req, res) => {
  try {
    const { id, itemId } = req.params;
    
    const { error } = await supabase
      .from('alternatives')
      .delete()
      .eq('project_id', id)
      .eq('id', itemId);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
