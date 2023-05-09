const request = require('supertest');
const db = require('../models/index');
const app = require('../app');

describe('Todo Application', () => {
  let agent;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    const server = app.listen(5000, () => {});
    agent = request.agent(server);
  });

  test('Creates a sport and responds with json at /todos POST endpoint', async () => {
    const response = await agent.post('/createSport').send({
      title: 'Buy milk',
    });
    expect(response.statusCode).toBe(302);
  });
});
