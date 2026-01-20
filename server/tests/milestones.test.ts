import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Milestones Routes', () => {
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

  describe('POST /api/milestones', () => {
    it('should create a new milestone', async () => {
      const response = await request(app)
        .post('/api/milestones')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'First Anniversary',
          description: 'One year together!',
          date: '2025-02-14',
          type: 'anniversary',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.title).toBe('First Anniversary');
      expect(response.body.data.type).toBe('anniversary');
    });

    it('should reject without title', async () => {
      const response = await request(app)
        .post('/api/milestones')
        .set('Authorization', `Bearer ${token}`)
        .send({ date: '2025-02-14', type: 'anniversary' });

      expect(response.status).toBe(400);
    });

    it('should reject without date', async () => {
      const response = await request(app)
        .post('/api/milestones')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Test', type: 'anniversary' });

      expect(response.status).toBe(400);
    });

    it('should reject without type', async () => {
      const response = await request(app)
        .post('/api/milestones')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Test', date: '2025-02-14' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/milestones', () => {
    it('should list milestones', async () => {
      // Create some milestones
      await request(app)
        .post('/api/milestones')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Milestone 1', date: '2025-01-01', type: 'custom' });

      await request(app)
        .post('/api/milestones')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Milestone 2', date: '2025-02-01', type: 'custom' });

      const response = await request(app)
        .get('/api/milestones')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(2);
    });
  });

  describe('GET /api/milestones/:id', () => {
    it('should get milestone by id', async () => {
      const createResponse = await request(app)
        .post('/api/milestones')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Test milestone', date: '2025-02-14', type: 'anniversary' });

      const milestoneId = createResponse.body.data.id;

      const response = await request(app)
        .get(`/api/milestones/${milestoneId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(milestoneId);
      expect(response.body.data.title).toBe('Test milestone');
    });

    it('should return 404 for non-existent milestone', async () => {
      const response = await request(app)
        .get('/api/milestones/non-existent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/milestones/:id', () => {
    it('should update milestone', async () => {
      const createResponse = await request(app)
        .post('/api/milestones')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Original title', date: '2025-02-14', type: 'custom' });

      const milestoneId = createResponse.body.data.id;

      const response = await request(app)
        .put(`/api/milestones/${milestoneId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated title', description: 'Added description' });

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Updated title');
      expect(response.body.data.description).toBe('Added description');
    });
  });

  describe('DELETE /api/milestones/:id', () => {
    it('should delete milestone', async () => {
      const createResponse = await request(app)
        .post('/api/milestones')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'To be deleted', date: '2025-02-14', type: 'custom' });

      const milestoneId = createResponse.body.data.id;

      const response = await request(app)
        .delete(`/api/milestones/${milestoneId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify deletion
      const getResponse = await request(app)
        .get(`/api/milestones/${milestoneId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(getResponse.status).toBe(404);
    });
  });
});
