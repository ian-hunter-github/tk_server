const express = require('express');
const router = express.Router();
const ai = require('../services/ai');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

// POST /ai/generate-criteria
// Generate criteria suggestions based on project concept
router.post('/generate-criteria', async (req, res) => {
  try {
    const { concept } = req.body;
    if (!concept) {
      return res.status(400).json({ error: 'Project concept is required' });
    }

    const criteria = await ai.generateCriteria(concept);
    res.json(criteria);
  } catch (error) {
    console.error('Generate Criteria Error:', error);
    res.status(500).json({ error: 'Failed to generate criteria suggestions' });
  }
});

// POST /ai/evaluate-alternative
// Evaluate an alternative against given criteria
router.post('/evaluate-alternative', async (req, res) => {
  try {
    const { alternative, criteria } = req.body;
    if (!alternative || !criteria) {
      return res.status(400).json({ error: 'Alternative and criteria are required' });
    }

    const evaluation = await ai.evaluateAlternative(alternative, criteria);
    res.json(evaluation);
  } catch (error) {
    console.error('Evaluate Alternative Error:', error);
    res.status(500).json({ error: 'Failed to evaluate alternative' });
  }
});

// POST /ai/predict-scores
// Predict scores for new criteria based on existing evaluations
router.post('/predict-scores', async (req, res) => {
  try {
    const { alternative, newCriteria, existingCriteria } = req.body;
    if (!alternative || !newCriteria || !existingCriteria) {
      return res.status(400).json({ 
        error: 'Alternative, new criteria, and existing criteria are required' 
      });
    }

    const predictions = await ai.predictScores(alternative, newCriteria, existingCriteria);
    res.json(predictions);
  } catch (error) {
    console.error('Predict Scores Error:', error);
    res.status(500).json({ error: 'Failed to predict scores' });
  }
});

module.exports = router;
