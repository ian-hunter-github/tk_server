const express = require('express');
const serverless = require('serverless-http');
const projectRoutes = require('../routes/projects');
const app = express();
app.use(express.json());
app.use('/api/projects', projectRoutes);
exports.handler = serverless(app);
