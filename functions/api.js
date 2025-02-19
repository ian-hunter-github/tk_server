const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const authRoutes = require('../routes/auth');
const projectRoutes = require('../routes/projects');
const aiRoutes = require('../routes/ai');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/ai', aiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Export handler for serverless
exports.handler = serverless(app);
