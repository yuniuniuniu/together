import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Spaces Routes', () => {
  let token: string;
  let userId: string;

  beforeEach(async () => {
    // Create authenticated user
    const sendResponse = await request(app)
      .post('/api/auth/send-code')
      .send({ phone: '+1234567890' });

    const verifyResponse = await request(app)
      .post('/api/auth/verify')
      .send({ phone: '+1234567890', code: sendResponse.body.data.code });

    token = verifyResponse.body.data.token;
    userId = verifyResponse.body.data.user.id;
  });

  describe('POST /api/spaces', () => {
    it('should create a new space', async () => {
      const response = await request(app)
        .post('/api/spaces')
        .set('Authorization', `Bearer ${token}`)
        .send({ anniversaryDate: '2024-02-14' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.inviteCode).toBeDefined();
      expect(response.body.data.anniversaryDate).toBe('2024-02-14');
    });

    it('should reject without authentication', async () => {
      const response = await request(app)
        .post('/api/spaces')
        .send({ anniversaryDate: '2024-02-14' });

      expect(response.status).toBe(401);
    });

    it('should reject without anniversary date', async () => {
      const response = await request(app)
        .post('/api/spaces')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/spaces/:id', () => {
    it('should get space by id', async () => {
      // Create space first
      const createResponse = await request(app)
        .post('/api/spaces')
        .set('Authorization', `Bearer ${token}`)
        .send({ anniversaryDate: '2024-02-14' });

      const spaceId = createResponse.body.data.id;

      const response = await request(app)
        .get(`/api/spaces/${spaceId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(spaceId);
      expect(response.body.data.partners).toBeDefined();
    });

    it('should return 404 for non-existent space', async () => {
      const response = await request(app)
        .get('/api/spaces/non-existent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/spaces/join', () => {
    it('should join space via invite code', async () => {
      // Create space with first user
      const createResponse = await request(app)
        .post('/api/spaces')
        .set('Authorization', `Bearer ${token}`)
        .send({ anniversaryDate: '2024-02-14' });

      const inviteCode = createResponse.body.data.inviteCode;

      // Create second user
      const sendResponse2 = await request(app)
        .post('/api/auth/send-code')
        .send({ phone: '+9876543210' });

      const verifyResponse2 = await request(app)
        .post('/api/auth/verify')
        .send({ phone: '+9876543210', code: sendResponse2.body.data.code });

      const token2 = verifyResponse2.body.data.token;

      // Join space
      const response = await request(app)
        .post('/api/spaces/join')
        .set('Authorization', `Bearer ${token2}`)
        .send({ inviteCode });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(createResponse.body.data.id);
    });

    it('should reject invalid invite code', async () => {
      const response = await request(app)
        .post('/api/spaces/join')
        .set('Authorization', `Bearer ${token}`)
        .send({ inviteCode: 'INVALID' });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/spaces/my', () => {
    it('should get current user space', async () => {
      // Create space first
      await request(app)
        .post('/api/spaces')
        .set('Authorization', `Bearer ${token}`)
        .send({ anniversaryDate: '2024-02-14' });

      const response = await request(app)
        .get('/api/spaces/my')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should return null if user has no space', async () => {
      const response = await request(app)
        .get('/api/spaces/my')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeNull();
    });
  });

  describe('DELETE /api/spaces/:id', () => {
    it('should delete space (unbind)', async () => {
      // Create space
      const createResponse = await request(app)
        .post('/api/spaces')
        .set('Authorization', `Bearer ${token}`)
        .send({ anniversaryDate: '2024-02-14' });

      const spaceId = createResponse.body.data.id;

      const response = await request(app)
        .delete(`/api/spaces/${spaceId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify space is deleted
      const getResponse = await request(app)
        .get(`/api/spaces/${spaceId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(getResponse.status).toBe(404);
    });

    it('should reject deleting space user is not member of', async () => {
      // Create space with first user
      const createResponse = await request(app)
        .post('/api/spaces')
        .set('Authorization', `Bearer ${token}`)
        .send({ anniversaryDate: '2024-02-14' });

      const spaceId = createResponse.body.data.id;

      // Create second user
      const sendResponse2 = await request(app)
        .post('/api/auth/send-code')
        .send({ phone: '+9876543210' });

      const verifyResponse2 = await request(app)
        .post('/api/auth/verify')
        .send({ phone: '+9876543210', code: sendResponse2.body.data.code });

      const token2 = verifyResponse2.body.data.token;

      // Try to delete space (not a member)
      const response = await request(app)
        .delete(`/api/spaces/${spaceId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(response.status).toBe(403);
    });
  });
});
