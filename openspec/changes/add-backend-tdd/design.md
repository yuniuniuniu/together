# Design: TDD Backend Implementation

## Architecture Overview

```
├── server/                      # Backend root
│   ├── src/
│   │   ├── index.ts            # Entry point, server bootstrap
│   │   ├── app.ts              # Express app configuration
│   │   ├── db/
│   │   │   ├── index.ts        # Database connection
│   │   │   ├── schema.sql      # SQLite schema
│   │   │   └── seed.ts         # Development seed data
│   │   ├── routes/
│   │   │   ├── auth.ts         # Authentication routes
│   │   │   ├── spaces.ts       # Space routes
│   │   │   ├── memories.ts     # Memory routes
│   │   │   ├── milestones.ts   # Milestone routes
│   │   │   └── notifications.ts # Notification routes
│   │   ├── middleware/
│   │   │   ├── auth.ts         # JWT authentication
│   │   │   ├── errorHandler.ts # Global error handling
│   │   │   └── validate.ts     # Request validation
│   │   ├── services/
│   │   │   ├── authService.ts
│   │   │   ├── spaceService.ts
│   │   │   ├── memoryService.ts
│   │   │   ├── milestoneService.ts
│   │   │   └── notificationService.ts
│   │   └── types/
│   │       └── index.ts        # Re-export shared types
│   ├── tests/
│   │   ├── auth.test.ts
│   │   ├── spaces.test.ts
│   │   ├── memories.test.ts
│   │   ├── milestones.test.ts
│   │   └── setup.ts            # Test setup/teardown
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
├── shared/
│   └── types/                  # Shared types (already exists)
│       └── index.ts
```

## Database Schema

```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE,
  nickname TEXT NOT NULL,
  avatar TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Verification codes (simulated SMS)
CREATE TABLE verification_codes (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  used INTEGER DEFAULT 0
);

-- Sessions (JWT tracking)
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  token TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL
);

-- Spaces (couple's shared space)
CREATE TABLE spaces (
  id TEXT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  anniversary_date DATE NOT NULL,
  invite_code TEXT UNIQUE
);

-- Space members (junction table)
CREATE TABLE space_members (
  space_id TEXT NOT NULL REFERENCES spaces(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  pet_name TEXT,
  partner_pet_name TEXT,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (space_id, user_id)
);

-- Memories
CREATE TABLE memories (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL REFERENCES spaces(id),
  content TEXT NOT NULL,
  mood TEXT,
  photos TEXT, -- JSON array
  location TEXT, -- JSON object
  voice_note TEXT,
  stickers TEXT, -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT NOT NULL REFERENCES users(id),
  word_count INTEGER
);

-- Milestones
CREATE TABLE milestones (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL REFERENCES spaces(id),
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  type TEXT NOT NULL,
  icon TEXT,
  photos TEXT, -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT NOT NULL REFERENCES users(id)
);

-- Notifications
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  read INTEGER DEFAULT 0,
  action_url TEXT
);
```

## API Design

### Authentication Flow

```
1. User enters phone number
2. POST /api/auth/send-code { phone: "+1234567890" }
   - Server generates 6-digit code
   - Stores in verification_codes table (expires in 5 min)
   - Returns { success: true, message: "Code sent" }
   - (In dev mode, code is returned in response for testing)

3. User enters verification code
4. POST /api/auth/verify { phone: "+1234567890", code: "123456" }
   - Server validates code
   - Creates/finds user
   - Generates JWT token
   - Returns { user, token }

5. Subsequent requests include Authorization: Bearer <token>
```

### Response Format

All API responses follow the `ApiResponse<T>` format:

```typescript
// Success
{
  success: true,
  data: T,
  message?: string
}

// Error
{
  success: false,
  message: string,
  error?: {
    code: string,
    details?: unknown
  }
}
```

### Paginated Responses

For list endpoints, use `PaginatedResponse<T>`:

```typescript
{
  success: true,
  data: T[],
  total: number,
  page: number,
  pageSize: number,
  hasMore: boolean
}
```

## TDD Approach

### Test Structure

Each feature follows Red-Green-Refactor:

1. **Red**: Write failing test for expected behavior
2. **Green**: Write minimum code to pass test
3. **Refactor**: Clean up while keeping tests green

### Test Example (Auth)

```typescript
// auth.test.ts
describe('POST /api/auth/send-code', () => {
  it('should generate and store verification code', async () => {
    const response = await request(app)
      .post('/api/auth/send-code')
      .send({ phone: '+1234567890' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('should reject invalid phone format', async () => {
    const response = await request(app)
      .post('/api/auth/send-code')
      .send({ phone: 'invalid' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
```

## Frontend Integration

### API Client

Create `shared/api/client.ts`:

```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3005/api';

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('auth_token');

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  return response.json();
}
```

### Context Updates

Update `AuthContext.tsx` login method:

```typescript
const login = useCallback(async (phone: string, code: string) => {
  setState(prev => ({ ...prev, isLoading: true }));
  try {
    const response = await apiClient<{ user: User; token: string }>(
      '/auth/verify',
      {
        method: 'POST',
        body: JSON.stringify({ phone, code }),
      }
    );

    if (response.success) {
      localStorage.setItem('auth_token', response.data.token);
      setState({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    }
  } catch (error) {
    setState(prev => ({ ...prev, isLoading: false }));
    throw error;
  }
}, []);
```

## Development Workflow

### Running Backend

```bash
cd server
npm install
npm run dev     # Start with hot reload
npm run test    # Run tests
npm run test:watch # Run tests in watch mode
```

### Running Full Stack

```bash
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend
npm run dev
```

### Environment Variables

Frontend `.env`:
```
VITE_API_URL=http://localhost:3005/api
```

Backend `.env`:
```
PORT=3005
JWT_SECRET=dev-secret-key
NODE_ENV=development
```

## Error Handling

### Backend Error Types

```typescript
class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

// Usage
throw new AppError(404, 'SPACE_NOT_FOUND', 'Space does not exist');
```

### Error Middleware

```typescript
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: { code: err.code }
    });
  }

  // Unexpected errors
  console.error(err);
  return res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
}
```
