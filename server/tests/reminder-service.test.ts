import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { dbPrepare } from '../src/db/index.js';
import { checkUpcomingReminders } from '../src/services/reminderService.js';

describe('Reminder Service', () => {
  let userAToken: string;
  let userAId: string;
  let userBToken: string;
  let userBId: string;
  let spaceId: string;

  // Helper to get notifications for a user
  async function getNotifications(token: string) {
    const response = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`);
    return response.body.data || [];
  }

  // Helper to clear notifications
  function clearNotifications() {
    dbPrepare('DELETE FROM notifications').run();
  }

  // Helper to update space anniversary date
  function updateAnniversaryDate(spaceId: string, date: string) {
    dbPrepare('UPDATE spaces SET anniversary_date = ? WHERE id = ?').run(date, spaceId);
  }

  // Helper to format date as YYYY-MM-DD
  function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  beforeEach(async () => {
    // Create User A
    const sendA = await request(app)
      .post('/api/auth/send-code')
      .send({ phone: '+1111111111' });
    const verifyA = await request(app)
      .post('/api/auth/verify')
      .send({ phone: '+1111111111', code: sendA.body.data.code });
    userAToken = verifyA.body.data.token;
    userAId = verifyA.body.data.user.id;

    // Create space
    const spaceResponse = await request(app)
      .post('/api/spaces')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ anniversaryDate: '2024-02-14' });
    spaceId = spaceResponse.body.data.id;
    const inviteCode = spaceResponse.body.data.inviteCode;

    // Create User B
    const sendB = await request(app)
      .post('/api/auth/send-code')
      .send({ phone: '+2222222222' });
    const verifyB = await request(app)
      .post('/api/auth/verify')
      .send({ phone: '+2222222222', code: sendB.body.data.code });
    userBToken = verifyB.body.data.token;
    userBId = verifyB.body.data.user.id;

    // User B joins space
    await request(app)
      .post('/api/spaces/join')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ inviteCode });

    // Clear all notifications
    clearNotifications();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Anniversary Reminders', () => {
    it('should send reminder 7 days before anniversary', async () => {
      // Set anniversary to 7 days from now
      const today = new Date();
      const anniversaryThisYear = new Date(today);
      anniversaryThisYear.setDate(today.getDate() + 7);
      updateAnniversaryDate(spaceId, formatDate(anniversaryThisYear));

      // Run reminder check
      await checkUpcomingReminders();

      // Both users should receive reminder
      const notificationsA = await getNotifications(userAToken);
      const notificationsB = await getNotifications(userBToken);

      expect(notificationsA.length).toBe(1);
      expect(notificationsA[0].type).toBe('reminder');
      expect(notificationsA[0].title).toContain('1 week');

      expect(notificationsB.length).toBe(1);
      expect(notificationsB[0].type).toBe('reminder');
    });

    it('should send reminder 3 days before anniversary', async () => {
      const today = new Date();
      const anniversaryThisYear = new Date(today);
      anniversaryThisYear.setDate(today.getDate() + 3);
      updateAnniversaryDate(spaceId, formatDate(anniversaryThisYear));

      await checkUpcomingReminders();

      const notifications = await getNotifications(userAToken);

      expect(notifications.length).toBe(1);
      expect(notifications[0].title).toContain('3 days');
    });

    it('should send reminder 1 day before anniversary', async () => {
      const today = new Date();
      const anniversaryThisYear = new Date(today);
      anniversaryThisYear.setDate(today.getDate() + 1);
      updateAnniversaryDate(spaceId, formatDate(anniversaryThisYear));

      await checkUpcomingReminders();

      const notifications = await getNotifications(userAToken);

      expect(notifications.length).toBe(1);
      expect(notifications[0].title).toContain('Tomorrow');
    });

    it('should send reminder on anniversary day', async () => {
      const today = new Date();
      updateAnniversaryDate(spaceId, formatDate(today));

      await checkUpcomingReminders();

      const notifications = await getNotifications(userAToken);

      expect(notifications.length).toBe(1);
      expect(notifications[0].title).toContain('Anniversary');
    });

    it('should not duplicate reminders on same day', async () => {
      const today = new Date();
      const anniversaryThisYear = new Date(today);
      anniversaryThisYear.setDate(today.getDate() + 7);
      updateAnniversaryDate(spaceId, formatDate(anniversaryThisYear));

      // Run reminder check twice
      await checkUpcomingReminders();
      await checkUpcomingReminders();

      const notifications = await getNotifications(userAToken);

      // Should still only have 1 notification (deduplication)
      expect(notifications.length).toBe(1);
    });

    it('should not send reminder for dates not matching trigger days', async () => {
      const today = new Date();
      const anniversaryThisYear = new Date(today);
      anniversaryThisYear.setDate(today.getDate() + 5); // 5 days is not a trigger
      updateAnniversaryDate(spaceId, formatDate(anniversaryThisYear));

      await checkUpcomingReminders();

      const notifications = await getNotifications(userAToken);
      expect(notifications.length).toBe(0);
    });
  });

  describe('Milestone Reminders', () => {
    it('should send reminder 3 days before milestone', async () => {
      // Create milestone 3 days from now
      const milestoneDate = new Date();
      milestoneDate.setDate(milestoneDate.getDate() + 3);

      await request(app)
        .post('/api/milestones')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: 'Special Event',
          date: formatDate(milestoneDate),
          type: 'custom',
        });

      // Clear milestone creation notification
      clearNotifications();

      await checkUpcomingReminders();

      const notifications = await getNotifications(userAToken);

      expect(notifications.length).toBe(1);
      expect(notifications[0].type).toBe('reminder');
      expect(notifications[0].title).toContain('Special Event');
      expect(notifications[0].title).toContain('3 days');
    });

    it('should send reminder 1 day before milestone', async () => {
      const milestoneDate = new Date();
      milestoneDate.setDate(milestoneDate.getDate() + 1);

      await request(app)
        .post('/api/milestones')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: 'Tomorrow Event',
          date: formatDate(milestoneDate),
          type: 'custom',
        });

      clearNotifications();
      await checkUpcomingReminders();

      const notifications = await getNotifications(userAToken);

      expect(notifications.length).toBe(1);
      expect(notifications[0].title).toContain('Tomorrow');
    });

    it('should send reminder on milestone day', async () => {
      const today = new Date();

      await request(app)
        .post('/api/milestones')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: 'Today Event',
          date: formatDate(today),
          type: 'custom',
        });

      clearNotifications();
      await checkUpcomingReminders();

      const notifications = await getNotifications(userAToken);

      expect(notifications.length).toBe(1);
      expect(notifications[0].title).toContain('Today');
    });

    it('should not send reminder for past milestones', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      await request(app)
        .post('/api/milestones')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: 'Past Event',
          date: formatDate(pastDate),
          type: 'custom',
        });

      clearNotifications();
      await checkUpcomingReminders();

      const notifications = await getNotifications(userAToken);
      expect(notifications.length).toBe(0);
    });

    it('should send reminders to both partners', async () => {
      const milestoneDate = new Date();
      milestoneDate.setDate(milestoneDate.getDate() + 3);

      await request(app)
        .post('/api/milestones')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: 'Shared Event',
          date: formatDate(milestoneDate),
          type: 'custom',
        });

      clearNotifications();
      await checkUpcomingReminders();

      const notificationsA = await getNotifications(userAToken);
      const notificationsB = await getNotifications(userBToken);

      expect(notificationsA.length).toBe(1);
      expect(notificationsB.length).toBe(1);
    });
  });
});
