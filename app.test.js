const request = require('supertest');
const app = require('./app');

test('GET / returns welcome message', async () => {
  const res = await request(app).get('/');
  expect(res.statusCode).toBe(200);
  expect(res.body.message).toBe('Hello from my DevOps app!');
});

test('GET /health returns ok', async () => {
  const res = await request(app).get('/health');
  expect(res.statusCode).toBe(200);
  expect(res.body.status).toBe('ok');
});

test('POST /todos creates a todo', async () => {
  const res = await request(app)
    .post('/todos')
    .send({ text: 'Learn DevOps' });
  expect(res.statusCode).toBe(201);
  expect(res.body.text).toBe('Learn DevOps');
});