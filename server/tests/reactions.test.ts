import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Reactions Routes', () => {
  let token: string;
  let token2: string;
  let memoryId: string;

  beforeEach(async () => {
    // Create first authenticated user and space
    const sendResponse = await request(app)
      .post('/api/auth/send-code')
      .send({ phone: '+1234567890' });

    const verifyResponse = await request(app)
      .post('/api/auth/verify')
      .send({ phone: '+1234567890', code: sendResponse.body.data.code });

    token = verifyResponse.body.data.token;

    // Create space
    const spaceResponse = await request(app)
      .post('/api/spaces')
      .set('Authorization', `Bearer ${token}`)
      .send({ anniversaryDate: '2024-02-14' });

    const inviteCode = spaceResponse.body.data.inviteCode;

    // Create second user and join space
    const sendResponse2 = await request(app)
      .post('/api/auth/send-code')
      .send({ phone: '+9876543210' });

    const verifyResponse2 = await request(app)
      .post('/api/auth/verify')
      .send({ phone: '+9876543210', code: sendResponse2.body.data.code });

    token2 = verifyResponse2.body.data.token;

    await request(app)
      .post('/api/spaces/join')
      .set('Authorization', `Bearer ${token2}`)
      .send({ inviteCode });

    // Create a memory
    const memoryResponse = await request(app)
      .post('/api/memories')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Test memory for reactions' });

    memoryId = memoryResponse.body.data.id;
  });

  describe('POST /api/reactions/:memoryId', () => {
    it('should add a reaction to a memory', async () => {
      const response = await request(app)
        .post(`/api/reactions/${memoryId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'love' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.action).toBe('added');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.type).toBe('love');
    });

    it('should toggle (remove) reaction when called again', async () => {
      // First add reaction
      await request(app)
        .post(`/api/reactions/${memoryId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'love' });

      // Then toggle to remove
      const response = await request(app)
        .post(`/api/reactions/${memoryId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'love' });

      expect(response.status).toBe(200);
      expect(response.body.action).toBe('removed');
      expect(response.body.data).toBeNull();
    });

    it('should allow partner to react to memory', async () => {
      const response = await request(app)
        .post(`/api/reactions/${memoryId}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ type: 'love' });

      expect(response.status).toBe(200);
      expect(response.body.action).toBe('added');
    });

    it('should default to love type if not specified', async () => {
      const response = await request(app)
        .post(`/api/reactions/${memoryId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.data.type).toBe('love');
    });

    it('should reject without authentication', async () => {
      const response = await request(app)
        .post(`/api/reactions/${memoryId}`)
        .send({ type: 'love' });

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent memory', async () => {
      const response = await request(app)
        .post('/api/reactions/non-existent-id')
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'love' });

      expect(response.status).toBe(404);
    });

    it('should reject reaction from user not in space', async () => {
      // Create third user not in space
      const sendResponse3 = await request(app)
        .post('/api/auth/send-code')
        .send({ phone: '+5555555555' });

      const verifyResponse3 = await request(app)
        .post('/api/auth/verify')
        .send({ phone: '+5555555555', code: sendResponse3.body.data.code });

      const token3 = verifyResponse3.body.data.token;

      const response = await request(app)
        .post(`/api/reactions/${memoryId}`)
        .set('Authorization', `Bearer ${token3}`)
        .send({ type: 'love' });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/reactions/:memoryId', () => {
    it('should list all reactions for a memory', async () => {
      // Add reactions from both users
      await request(app)
        .post(`/api/reactions/${memoryId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'love' });

      await request(app)
        .post(`/api/reactions/${memoryId}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ type: 'love' });

      const response = await request(app)
        .get(`/api/reactions/${memoryId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(2);
    });

    it('should return empty array if no reactions', async () => {
      const response = await request(app)
        .get(`/api/reactions/${memoryId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });

    it('should reject without authentication', async () => {
      const response = await request(app)
        .get(`/api/reactions/${memoryId}`);

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent memory', async () => {
      const response = await request(app)
        .get('/api/reactions/non-existent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/reactions/:memoryId/me', () => {
    it('should return current user reaction', async () => {
      // Add reaction
      await request(app)
        .post(`/api/reactions/${memoryId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'love' });

      const response = await request(app)
        .get(`/api/reactions/${memoryId}/me`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.type).toBe('love');
    });

    it('should return null if user has not reacted', async () => {
      const response = await request(app)
        .get(`/api/reactions/${memoryId}/me`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeNull();
    });

    it('should not return other user reactions', async () => {
      // User 1 adds reaction
      await request(app)
        .post(`/api/reactions/${memoryId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'love' });

      // User 2 checks their reaction (should be null)
      const response = await request(app)
        .get(`/api/reactions/${memoryId}/me`)
        .set('Authorization', `Bearer ${token2}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeNull();
    });

    it('should reject without authentication', async () => {
      const response = await request(app)
        .get(`/api/reactions/${memoryId}/me`);

      expect(response.status).toBe(401);
    });
  });
});
