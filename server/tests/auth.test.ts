import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { dbPrepare } from '../src/db/index.js';

describe('Auth Routes', () => {
  describe('POST /api/auth/send-code', () => {
    it('should generate and store verification code', async () => {
      const response = await request(app)
        .post('/api/auth/send-code')
        .send({ phone: '+1234567890' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.code).toBeDefined(); // Dev mode returns code

      // Verify code was stored in database
      const stored = dbPrepare(
        'SELECT * FROM verification_codes WHERE phone = ?'
      ).get('+1234567890');
      expect(stored).toBeDefined();
    });

    it('should reject invalid phone format', async () => {
      const response = await request(app)
        .post('/api/auth/send-code')
        .send({ phone: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject missing phone', async () => {
      const response = await request(app)
        .post('/api/auth/send-code')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/verify', () => {
    it('should verify code and return user with token', async () => {
      // First send code
      const sendResponse = await request(app)
        .post('/api/auth/send-code')
        .send({ phone: '+1234567890' });

      const code = sendResponse.body.data.code;

      // Then verify
      const response = await request(app)
        .post('/api/auth/verify')
        .send({ phone: '+1234567890', code });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.phone).toBe('+1234567890');
    });

    it('should reject invalid code', async () => {
      // First send code
      await request(app)
        .post('/api/auth/send-code')
        .send({ phone: '+1234567890' });

      // Then verify with wrong code
      const response = await request(app)
        .post('/api/auth/verify')
        .send({ phone: '+1234567890', code: '000000' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject expired code', async () => {
      // Insert expired code directly
      dbPrepare(`
        INSERT INTO verification_codes (id, phone, code, expires_at)
        VALUES (?, ?, ?, datetime('now', '-10 minutes'))
      `).run('test-id', '+1234567890', '123456');

      const response = await request(app)
        .post('/api/auth/verify')
        .send({ phone: '+1234567890', code: '123456' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should create new user if not exists', async () => {
      const sendResponse = await request(app)
        .post('/api/auth/send-code')
        .send({ phone: '+9999999999' });

      const code = sendResponse.body.data.code;

      const response = await request(app)
        .post('/api/auth/verify')
        .send({ phone: '+9999999999', code });

      expect(response.status).toBe(200);
      expect(response.body.data.user.phone).toBe('+9999999999');

      // Verify user was created in database
      const user = dbPrepare('SELECT * FROM users WHERE phone = ?').get('+9999999999');
      expect(user).toBeDefined();
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user when authenticated', async () => {
      // Login first
      const sendResponse = await request(app)
        .post('/api/auth/send-code')
        .send({ phone: '+1234567890' });

      const verifyResponse = await request(app)
        .post('/api/auth/verify')
        .send({ phone: '+1234567890', code: sendResponse.body.data.code });

      const token = verifyResponse.body.data.token;

      // Get current user
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.phone).toBe('+1234567890');
    });

    it('should reject without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update user profile', async () => {
      // Login first
      const sendResponse = await request(app)
        .post('/api/auth/send-code')
        .send({ phone: '+1234567890' });

      const verifyResponse = await request(app)
        .post('/api/auth/verify')
        .send({ phone: '+1234567890', code: sendResponse.body.data.code });

      const token = verifyResponse.body.data.token;

      // Update profile
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ nickname: 'New Name', avatar: 'https://example.com/avatar.jpg' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.nickname).toBe('New Name');
      expect(response.body.data.avatar).toBe('https://example.com/avatar.jpg');
    });

    it('should reject without authentication', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .send({ nickname: 'New Name' });

      expect(response.status).toBe(401);
    });
  });
});
