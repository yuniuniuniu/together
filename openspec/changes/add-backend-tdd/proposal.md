# Proposal: TDD Backend Implementation

## Summary
Implement a Node.js/Express backend with SQLite database using Test-Driven Development (TDD) to enable local frontend-backend integration. This will replace the mock data currently used in the frontend contexts and hooks.

## Motivation
The frontend has been refactored with proper contexts and hooks, but all API calls are currently mocked with TODO comments. Implementing a real backend will:
- Enable full end-to-end development and testing
- Provide persistent data storage
- Allow local development without external dependencies
- Establish patterns for production backend implementation

## Approach
- **TDD Methodology**: Write tests first, then implement to make tests pass
- **TypeScript**: Shared types between frontend and backend
- **Express.js**: Lightweight, well-known HTTP framework
- **SQLite + better-sqlite3**: Simple, file-based database for local development
- **Vitest**: Fast, Vite-native testing framework

## API Endpoints Required

Based on frontend analysis:

### Authentication
- `POST /api/auth/send-code` - Send SMS verification code
- `POST /api/auth/verify` - Verify code and login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Spaces
- `POST /api/spaces` - Create a new space
- `GET /api/spaces/:id` - Get space by ID
- `POST /api/spaces/join` - Join space via invite code
- `DELETE /api/spaces/:id` - Unbind/delete space

### Memories
- `GET /api/memories` - List memories (paginated)
- `POST /api/memories` - Create memory
- `GET /api/memories/:id` - Get memory by ID
- `PUT /api/memories/:id` - Update memory
- `DELETE /api/memories/:id` - Delete memory

### Milestones
- `GET /api/milestones` - List milestones
- `POST /api/milestones` - Create milestone
- `GET /api/milestones/:id` - Get milestone by ID
- `PUT /api/milestones/:id` - Update milestone
- `DELETE /api/milestones/:id` - Delete milestone

### Notifications
- `GET /api/notifications` - List notifications
- `PUT /api/notifications/:id/read` - Mark as read

## Scope

### In Scope
- Backend API implementation with Express.js
- SQLite database with better-sqlite3
- JWT-based authentication (simulated SMS)
- Full CRUD for all entities
- Vitest test suite
- Frontend integration (update contexts/hooks)
- CORS configuration for local development
- API client utility for frontend

### Out of Scope
- Real SMS verification service
- Production deployment configuration
- File upload/storage (photos will remain URLs)
- Real-time features (WebSockets)
- Rate limiting and advanced security

## Risks
- **Database migrations**: SQLite schema changes require careful handling
- **Type synchronization**: Must keep frontend/backend types in sync

## Alternatives Considered
- **In-memory only**: Rejected - no persistence between sessions
- **PostgreSQL**: Rejected - overkill for local development
- **tRPC**: Rejected - adds complexity, Express is simpler

## Success Criteria
- All tests pass with `npm run test:backend`
- Frontend can login, create space, and CRUD memories/milestones
- Data persists between server restarts
- TypeScript types shared between frontend and backend
