const express = require('express');
const serverless = require('serverless-http');
const aiRoutes = require('../routes/ai');
const app = express();
app.use(express.json());
app.use('/api/ai', aiRoutes);
exports.handler = serverless(app);
