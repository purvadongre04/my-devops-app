const express = require('express');
const app = express();
app.use(express.json());

// Home route
app.get('/', (req, res) => {
  res.json({ message: 'Hello from my DevOps app!', status: 'running' });
});

// Health check route (used by Jenkins monitoring)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Simple todo routes
let todos = [];
app.get('/todos', (req, res) => res.json(todos));
app.post('/todos', (req, res) => {
  const todo = { id: todos.length + 1, text: req.body.text };
  todos.push(todo);
  res.status(201).json(todo);
});

module.exports = app;