import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { dbPrepare } from '../src/db/index.js';
import { v4 as uuid } from 'uuid';

describe('Notifications Routes', () => {
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

  describe('GET /api/notifications', () => {
    it('should list notifications for user', async () => {
      // Create some notifications directly in DB
      dbPrepare(`
        INSERT INTO notifications (id, user_id, type, title, message)
        VALUES (?, ?, ?, ?, ?)
      `).run(uuid(), userId, 'system', 'Welcome', 'Welcome to Sanctuary!');

      dbPrepare(`
        INSERT INTO notifications (id, user_id, type, title, message)
        VALUES (?, ?, ?, ?, ?)
      `).run(uuid(), userId, 'milestone_reminder', 'Anniversary', 'Your anniversary is coming up!');

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(2);
    });

    it('should return empty array if no notifications', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });

    it('should not return other users notifications', async () => {
      // Create notification for different user
      const otherUserId = uuid();
      dbPrepare(`
        INSERT INTO users (id, phone, nickname) VALUES (?, ?, ?)
      `).run(otherUserId, '+9999999999', 'Other');

      dbPrepare(`
        INSERT INTO notifications (id, user_id, type, title, message)
        VALUES (?, ?, ?, ?, ?)
      `).run(uuid(), otherUserId, 'system', 'Private', 'For other user');

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(0);
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const notificationId = uuid();
      dbPrepare(`
        INSERT INTO notifications (id, user_id, type, title, message, read)
        VALUES (?, ?, ?, ?, ?, 0)
      `).run(notificationId, userId, 'system', 'Test', 'Test notification');

      const response = await request(app)
        .put(`/api/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.read).toBe(true);
    });

    it('should return 404 for non-existent notification', async () => {
      const response = await request(app)
        .put('/api/notifications/non-existent/read')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('should not allow marking other users notification as read', async () => {
      const otherUserId = uuid();
      dbPrepare(`
        INSERT INTO users (id, phone, nickname) VALUES (?, ?, ?)
      `).run(otherUserId, '+9999999999', 'Other');

      const notificationId = uuid();
      dbPrepare(`
        INSERT INTO notifications (id, user_id, type, title, message)
        VALUES (?, ?, ?, ?, ?)
      `).run(notificationId, otherUserId, 'system', 'Private', 'For other user');

      const response = await request(app)
        .put(`/api/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });
});
