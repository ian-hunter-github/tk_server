const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// POST /auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ 
      message: 'Check your email to confirm registration!',
      data 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /auth/signin
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /auth/signout
router.post('/signout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ message: 'Signed out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /auth/session
router.get('/session', async (req, res) => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ session });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
