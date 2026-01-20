import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Memories Routes', () => {
  let token: string;
  let spaceId: string;

  beforeEach(async () => {
    // Create authenticated user and space
    const sendResponse = await request(app)
      .post('/api/auth/send-code')
      .send({ phone: '+1234567890' });

    const verifyResponse = await request(app)
      .post('/api/auth/verify')
      .send({ phone: '+1234567890', code: sendResponse.body.data.code });

    token = verifyResponse.body.data.token;

    const spaceResponse = await request(app)
      .post('/api/spaces')
      .set('Authorization', `Bearer ${token}`)
      .send({ anniversaryDate: '2024-02-14' });

    spaceId = spaceResponse.body.data.id;
  });

  describe('POST /api/memories', () => {
    it('should create a new memory', async () => {
      const response = await request(app)
        .post('/api/memories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Our first date was magical!',
          mood: 'happy',
          photos: ['https://example.com/photo1.jpg'],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.content).toBe('Our first date was magical!');
      expect(response.body.data.mood).toBe('happy');
    });

    it('should reject without content', async () => {
      const response = await request(app)
        .post('/api/memories')
        .set('Authorization', `Bearer ${token}`)
        .send({ mood: 'happy' });

      expect(response.status).toBe(400);
    });

    it('should reject without authentication', async () => {
      const response = await request(app)
        .post('/api/memories')
        .send({ content: 'Test' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/memories', () => {
    it('should list memories with pagination', async () => {
      // Create some memories
      await request(app)
        .post('/api/memories')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Memory 1' });

      await request(app)
        .post('/api/memories')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Memory 2' });

      const response = await request(app)
        .get('/api/memories')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(2);
      expect(response.body.total).toBe(2);
      expect(response.body.page).toBe(1);
    });

    it('should paginate results', async () => {
      // Create 5 memories
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/memories')
          .set('Authorization', `Bearer ${token}`)
          .send({ content: `Memory ${i + 1}` });
      }

      const response = await request(app)
        .get('/api/memories?page=1&pageSize=2')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.total).toBe(5);
      expect(response.body.hasMore).toBe(true);
    });
  });

  describe('GET /api/memories/:id', () => {
    it('should get memory by id', async () => {
      const createResponse = await request(app)
        .post('/api/memories')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Test memory' });

      const memoryId = createResponse.body.data.id;

      const response = await request(app)
        .get(`/api/memories/${memoryId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(memoryId);
      expect(response.body.data.content).toBe('Test memory');
    });

    it('should return 404 for non-existent memory', async () => {
      const response = await request(app)
        .get('/api/memories/non-existent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/memories/:id', () => {
    it('should update memory', async () => {
      const createResponse = await request(app)
        .post('/api/memories')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Original content' });

      const memoryId = createResponse.body.data.id;

      const response = await request(app)
        .put(`/api/memories/${memoryId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Updated content', mood: 'excited' });

      expect(response.status).toBe(200);
      expect(response.body.data.content).toBe('Updated content');
      expect(response.body.data.mood).toBe('excited');
    });
  });

  describe('DELETE /api/memories/:id', () => {
    it('should delete memory', async () => {
      const createResponse = await request(app)
        .post('/api/memories')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'To be deleted' });

      const memoryId = createResponse.body.data.id;

      const response = await request(app)
        .delete(`/api/memories/${memoryId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify deletion
      const getResponse = await request(app)
        .get(`/api/memories/${memoryId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(getResponse.status).toBe(404);
    });
  });
});
