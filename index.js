const express = require('express');
const cors = require('cors');
require('dotenv').config();

const projectRoutes = require('./routes/projects');
const authRoutes = require('./routes/auth');
const aiRoutes = require('./routes/ai');

const app = express();
const port = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/ai', aiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
