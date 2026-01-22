import { getDatabase } from '../db/database.js';
import { createNotification } from './notificationService.js';
import { finalizeExpiredUnbindRequests } from './spaceService.js';

// Check for upcoming anniversaries and milestones
export async function checkUpcomingReminders(): Promise<void> {
  const db = getDatabase();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const inThreeDays = new Date(today);
  inThreeDays.setDate(inThreeDays.getDate() + 3);

  const inOneWeek = new Date(today);
  inOneWeek.setDate(inOneWeek.getDate() + 7);

  // Get all spaces with members
  // We need to iterate through all spaces - this is simplified for small scale
  // For production, you'd want pagination or a more efficient query

  try {
    // Check anniversary reminders for each space
    await checkAnniversaryReminders(db, today, tomorrow, inThreeDays, inOneWeek);

    // Check milestone reminders
    await checkMilestoneReminders(db, today, tomorrow, inThreeDays, inOneWeek);

    // Process expired unbind requests
    await finalizeExpiredUnbindRequests();
  } catch (error) {
    console.error('[Reminder] Error checking reminders:', error);
  }
}

async function checkAnniversaryReminders(
  db: ReturnType<typeof getDatabase>,
  today: Date,
  tomorrow: Date,
  inThreeDays: Date,
  inOneWeek: Date
): Promise<void> {
  // Get all space members to find spaces
  // This is a simplified approach - in production you'd have a getAllSpaces method
  const spaces = await getAllSpacesWithMembers(db);

  for (const space of spaces) {
    const anniversaryDate = new Date(space.anniversary_date);
    const thisYearAnniversary = new Date(
      today.getFullYear(),
      anniversaryDate.getMonth(),
      anniversaryDate.getDate()
    );

    // If anniversary already passed this year, check next year
    if (thisYearAnniversary < today) {
      thisYearAnniversary.setFullYear(thisYearAnniversary.getFullYear() + 1);
    }

    const daysUntil = Math.ceil(
      (thisYearAnniversary.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Check specific day triggers: 7 days, 3 days, 1 day, today
    let reminderKey = '';
    let title = '';
    let message = '';

    if (daysUntil === 7) {
      reminderKey = `anniversary-7-${thisYearAnniversary.toISOString().split('T')[0]}`;
      title = 'Anniversary in 1 week!';
      message = 'Your special day is coming up. Time to plan something memorable!';
    } else if (daysUntil === 3) {
      reminderKey = `anniversary-3-${thisYearAnniversary.toISOString().split('T')[0]}`;
      title = 'Anniversary in 3 days!';
      message = "Don't forget - your anniversary is almost here!";
    } else if (daysUntil === 1) {
      reminderKey = `anniversary-1-${thisYearAnniversary.toISOString().split('T')[0]}`;
      title = 'Anniversary Tomorrow!';
      message = 'Get ready to celebrate your love story!';
    } else if (daysUntil === 0) {
      reminderKey = `anniversary-0-${thisYearAnniversary.toISOString().split('T')[0]}`;
      const years = today.getFullYear() - anniversaryDate.getFullYear();
      title = `Happy ${years > 0 ? years + ' Year ' : ''}Anniversary!`;
      message = 'Today marks another beautiful chapter in your journey together.';
    }

    if (reminderKey && title) {
      // Send reminder to all space members
      for (const member of space.members) {
        // Check if we already sent this reminder (using title as simple dedup)
        const existingNotifications = await db.listNotificationsByUserId(member.user_id);
        const alreadySent = existingNotifications.some(
          n => n.type === 'reminder' && n.title === title &&
            new Date(n.created_at).toDateString() === today.toDateString()
        );

        if (!alreadySent) {
          await createNotification(
            member.user_id,
            'reminder',
            title,
            message,
            '/dashboard'
          );
        }
      }
    }
  }
}

async function checkMilestoneReminders(
  db: ReturnType<typeof getDatabase>,
  today: Date,
  tomorrow: Date,
  inThreeDays: Date,
  inOneWeek: Date
): Promise<void> {
  const spaces = await getAllSpacesWithMembers(db);

  for (const space of spaces) {
    const milestones = await db.listMilestonesBySpaceId(space.id);

    for (const milestone of milestones) {
      const milestoneDate = new Date(milestone.date);
      milestoneDate.setHours(0, 0, 0, 0);

      // Only check future milestones or today
      if (milestoneDate < today) continue;

      const daysUntil = Math.ceil(
        (milestoneDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      let title = '';
      let message = '';

      if (daysUntil === 3) {
        title = `"${milestone.title}" in 3 days!`;
        message = `Your milestone is coming up on ${milestoneDate.toLocaleDateString()}`;
      } else if (daysUntil === 1) {
        title = `"${milestone.title}" is Tomorrow!`;
        message = 'Get ready for your special milestone!';
      } else if (daysUntil === 0) {
        title = `Today: ${milestone.title}`;
        message = "It's here! Make the most of this special moment.";
      }

      if (title) {
        for (const member of space.members) {
          // Simple dedup check
          const existingNotifications = await db.listNotificationsByUserId(member.user_id);
          const alreadySent = existingNotifications.some(
            n => n.type === 'reminder' && n.title === title &&
              new Date(n.created_at).toDateString() === today.toDateString()
          );

          if (!alreadySent) {
            await createNotification(
              member.user_id,
              'reminder',
              title,
              message,
              `/milestone/${milestone.id}`
            );
          }
        }
      }
    }
  }
}

// Helper function to get all spaces with their members
async function getAllSpacesWithMembers(db: ReturnType<typeof getDatabase>): Promise<
  Array<{
    id: string;
    anniversary_date: string;
    members: Array<{ user_id: string }>;
  }>
> {
  const result: Array<{
    id: string;
    anniversary_date: string;
    members: Array<{ user_id: string }>;
  }> = [];

  try {
    const spaces = await db.getAllSpaces();
    for (const space of spaces) {
      const members = await db.getSpaceMembersBySpaceId(space.id);
      result.push({
        id: space.id,
        anniversary_date: space.anniversary_date,
        members: members.map(m => ({ user_id: m.user_id })),
      });
    }
  } catch (error) {
    console.error('[Reminder] Error fetching spaces:', error);
  }

  return result;
}

// Start the reminder checker (runs every hour)
let reminderInterval: NodeJS.Timeout | null = null;

export function startReminderChecker(): void {
  // Run immediately on start
  checkUpcomingReminders();

  // Then run every hour
  reminderInterval = setInterval(() => {
    checkUpcomingReminders();
  }, 60 * 60 * 1000); // 1 hour

  console.log('[Reminder] Reminder checker started (runs every hour)');
}

export function stopReminderChecker(): void {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
    console.log('[Reminder] Reminder checker stopped');
  }
}
