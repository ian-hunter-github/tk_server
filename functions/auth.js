const express = require('express');
const serverless = require('serverless-http');
const authRoutes = require('../routes/auth');
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes); // Mount auth routes on /api/auth
exports.handler = serverless(app);
