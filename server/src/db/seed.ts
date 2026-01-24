import { dbPrepare } from './index.js';
import { v4 as uuid } from 'uuid';

export function seedDatabase(): void {
  // Create test users
  const user1Id = uuid();
  const user2Id = uuid();

  dbPrepare(`
    INSERT INTO users (id, phone, nickname, avatar) VALUES (?, ?, ?, ?)
  `).run(user1Id, '+1234567890', 'Alice', null);

  dbPrepare(`
    INSERT INTO users (id, phone, nickname, avatar) VALUES (?, ?, ?, ?)
  `).run(user2Id, '+0987654321', 'Bob', null);

  // Create a space
  const spaceId = uuid();
  const inviteCode = 'TEST123';

  dbPrepare(`
    INSERT INTO spaces (id, anniversary_date, invite_code) VALUES (?, ?, ?)
  `).run(spaceId, '2024-02-14', inviteCode);

  // Add both users to the space
  dbPrepare(`
    INSERT INTO space_members (space_id, user_id)
    VALUES (?, ?)
  `).run(spaceId, user1Id);

  dbPrepare(`
    INSERT INTO space_members (space_id, user_id)
    VALUES (?, ?)
  `).run(spaceId, user2Id);

  // Create sample memories
  const memoryId = uuid();
  dbPrepare(`
    INSERT INTO memories (id, space_id, content, mood, photos, created_by, word_count)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    memoryId,
    spaceId,
    'Our first date was magical!',
    'happy',
    JSON.stringify([]),
    user1Id,
    5
  );

  // Create sample milestone
  const milestoneId = uuid();
  dbPrepare(`
    INSERT INTO milestones (id, space_id, title, description, date, type, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    milestoneId,
    spaceId,
    'First Anniversary',
    'One year together!',
    '2025-02-14',
    'anniversary',
    user1Id
  );

  console.log('Database seeded successfully');
  console.log('Test users:', { user1Id, user2Id });
  console.log('Test space:', { spaceId, inviteCode });
}
