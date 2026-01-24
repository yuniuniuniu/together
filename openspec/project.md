# Project Context

## Purpose
Sanctuary is a private, encrypted space for couples to share memories, track anniversaries, and journal together. It's a mobile-first web application designed to help partners document and celebrate their relationship journey.

## Tech Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **Routing**: React Router DOM 7 (HashRouter for client-side routing)
- **Data Fetching**: TanStack React Query 5
- **Styling**: Tailwind CSS v4 (CSS-based configuration with `@theme` in `index.css`)
- **Maps**: Leaflet + React-Leaflet, AMap (Gaode Maps)
- **Auth**: Firebase Authentication
- **Target**: ES2022, modern browsers
- **Module System**: ESNext modules

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: SQLite (sql.js) or Firestore (configurable via adapter pattern)
- **Authentication**: Firebase Admin SDK + JWT
- **File Storage**: Cloudflare R2 (S3-compatible)
- **Email**: Nodemailer
- **Testing**: Vitest + Supertest

## Project Structure (Monorepo)

```
together/
├── client/                      # Frontend application
│   ├── src/
│   │   ├── App.tsx              # Root component with providers and routing
│   │   ├── index.tsx            # Entry point
│   │   ├── index.css            # Tailwind theme and custom styles
│   │   ├── pages/               # Route entry points (24 pages)
│   │   ├── components/          # Legacy components (being migrated)
│   │   ├── features/            # Domain-specific modules
│   │   │   ├── auth/            # Authentication module
│   │   │   ├── memory/          # Memory/journal module
│   │   │   ├── milestone/       # Milestone tracking module
│   │   │   └── space/           # Couple space management
│   │   └── shared/              # Cross-cutting concerns
│   │       ├── api/             # API client (client.ts)
│   │       ├── components/      # Reusable UI components
│   │       │   ├── auth/        # ProtectedRoute
│   │       │   ├── display/     # Avatar, Card, ImageViewer
│   │       │   ├── feedback/    # BottomSheet, Modal, Toast
│   │       │   ├── form/        # Button, Input
│   │       │   └── layout/      # BottomNav, Header, MobileWrapper, PageLayout
│   │       ├── config/          # Firebase configuration
│   │       ├── context/         # React Contexts (Auth, Space, Notification)
│   │       ├── hooks/           # Shared hooks (useApi, useLocalStorage, query hooks)
│   │       └── types/           # TypeScript types
│   ├── tests/                   # Frontend tests
│   ├── index.html
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   ├── tsconfig.json
│   └── package.json
├── server/                      # Backend application
│   ├── src/
│   │   ├── index.ts             # Entry point
│   │   ├── app.ts               # Express configuration
│   │   ├── config/              # Firebase Admin configuration
│   │   ├── db/                  # Database layer
│   │   │   ├── adapter.ts       # Database adapter interface
│   │   │   ├── sqlite-adapter.ts
│   │   │   ├── firestore-adapter.ts
│   │   │   └── schema.sql
│   │   ├── routes/              # API route handlers
│   │   ├── services/            # Business logic
│   │   │   ├── authService.ts
│   │   │   ├── emailService.ts
│   │   │   ├── fileService.ts
│   │   │   ├── memoryService.ts
│   │   │   ├── milestoneService.ts
│   │   │   ├── notificationService.ts
│   │   │   ├── r2Service.ts     # Cloudflare R2 file storage
│   │   │   ├── reactionService.ts
│   │   │   ├── reminderService.ts
│   │   │   └── spaceService.ts
│   │   └── middleware/          # Express middleware
│   ├── tests/                   # Backend tests
│   └── package.json
├── package.json                 # Workspace root configuration
├── scripts/                     # Utility scripts
│   └── reset-data.sh
└── openspec/                    # Specification documents
```

## Project Conventions

### Code Style
- No enforced linter/formatter configuration
- TypeScript with `React.FC` type annotations for components
- Functional components with hooks
- Path aliases: `@/*` maps to `client/src/`
- Tailwind utility classes for styling (no CSS modules)

### Architecture Patterns

#### State Management
- **React Context** for global state: `AuthContext`, `SpaceContext`
- **Custom Hooks** wrap context access: `useAuth()`, `useSpace()`
- Local component state for UI-specific state

#### Component Patterns
- **Compound Components** for complex layouts (e.g., `PageLayout.Header`, `PageLayout.Content`)
- **Props interfaces** extend HTML element attributes where appropriate
- Preserve exact existing UI when refactoring (no visual changes)

#### Data Fetching
- **TanStack React Query** for server state management
- Query hooks: `useMemoriesQuery()`, `useMilestonesQuery()` with caching and background refetching
- Legacy `useApi` hook for simpler cases with loading/error states
- Feature-specific hooks: `useMemories()`, `useMilestones()`

### Routing
- HashRouter with route definitions in `App.tsx`
- All pages wrapped in `MobileWrapper` (max-width 430px)

### Styling
- Tailwind CSS v4 with `@theme` configuration in `index.css`
- Custom colors, shadows, fonts, and animations defined in theme
- Custom CSS classes for complex effects (`.bottom-sheet`, `.glass-panel`, etc.)

### Testing Strategy
- **Backend**: Vitest test suite covering all API endpoints
- **Frontend**: Vitest + Testing Library for component and integration tests

### Git Workflow
- Feature branch workflow with pull requests
- No strict commit message conventions

## Domain Context
- **Couples App**: Two users share a "space" together
- **Memories**: Photo/journal entries documenting moments together
- **Milestones**: Special events and anniversaries to track
- **Sanctuary**: The shared private space between partners
- **Binding/Unbinding**: Process of connecting or disconnecting partner accounts

Key user flows:
1. Login → Profile Setup → Date Selection → Create Space → Dashboard
2. Join existing space via invite → Confirm Partner → Celebration
3. Record memories, milestones, view timeline/map

## Important Constraints
- Mobile-first design (430px max width)
- Dark mode support required
- Privacy-focused (encrypted data mentioned in description)
- Uses Google Material Symbols for icons
- **UI/UX must not change during refactoring** - preserve all visual and interaction details

## Backend Architecture

### Database Layer
- **Adapter Pattern**: Supports multiple database backends via `DatabaseAdapter` interface
  - `sqlite-adapter.ts`: SQLite with sql.js (pure JavaScript, local development)
  - `firestore-adapter.ts`: Google Firestore (production, cloud-native)
- Database selection via environment variable or configuration

### API Conventions
- All endpoints prefixed with `/api`
- Response format: `{ success: boolean, data?: T, message?: string }`
- Authentication via `Authorization: Bearer <token>` header
- Pagination: `?page=1&pageSize=20`

### API Endpoints
- **Auth**: `/api/auth/send-code`, `/api/auth/verify`, `/api/auth/me`, `/api/auth/profile`
- **Spaces**: `/api/spaces`, `/api/spaces/my`, `/api/spaces/join`, `/api/spaces/:id`
- **Memories**: `/api/memories` (CRUD with pagination)
- **Milestones**: `/api/milestones` (CRUD)
- **Notifications**: `/api/notifications`, `/api/notifications/:id/read`
- **Reactions**: `/api/reactions` (like/unlike memories)
- **Upload**: `/api/upload` (file upload to R2)

### Development
- Backend runs on port 3005
- Frontend runs on port 3000
- Frontend connects via `VITE_API_URL` environment variable
- SQLite database stored at `server/data/sanctuary.db` (local dev)

## External Dependencies
- **Firebase**: Authentication (frontend + backend via Admin SDK), Firestore (optional database)
- **Cloudflare R2**: S3-compatible object storage for file uploads (images, audio)
- **AMap (Gaode Maps)**: Chinese map service for memory location display
- **Leaflet**: Open-source map library (fallback/international)
- **Gemini API**: Google's AI API for AI features (requires `GEMINI_API_KEY`)
- **Nodemailer**: Email service for verification codes and notifications

## Key Files
- `client/src/index.css` - Tailwind theme configuration and custom styles
- `client/src/App.tsx` - Root component with context providers and routing
- `client/src/shared/types/index.ts` - Core business types (User, Space, Memory, Milestone)
- `client/src/shared/context/` - Global state management (Auth, Space, Notification)
- `client/src/shared/api/client.ts` - API client for backend communication
- `client/src/shared/config/firebase.ts` - Firebase client configuration
- `client/src/shared/hooks/useMemoriesQuery.ts` - React Query hook for memories
- `server/src/app.ts` - Express application setup
- `server/src/db/adapter.ts` - Database adapter interface
- `server/src/db/schema.sql` - SQLite database schema
- `server/src/config/firebase-admin.ts` - Firebase Admin SDK configuration
- `server/src/services/r2Service.ts` - Cloudflare R2 file storage service

## NPM Scripts
- `npm run dev` - Start frontend dev server (port 3000)
- `npm run dev:server` - Start backend dev server (port 3005)
- `npm run dev:all` - Start both frontend and backend concurrently
- `npm run build` - Build frontend for production
- `npm run build:server` - Build backend for production
- `npm run test` - Run all tests (client + server)
- `npm run test:client` - Run frontend tests only
- `npm run test:server` - Run backend tests only

## Environment Variables

### Client (.env)
- `VITE_API_URL` - Backend API URL
- `VITE_FIREBASE_*` - Firebase configuration (apiKey, authDomain, projectId, etc.)
- `GEMINI_API_KEY` - Google Gemini API key

### Server (.env)
- `PORT` - Server port (default: 3005)
- `JWT_SECRET` - JWT signing secret
- `FIREBASE_*` - Firebase Admin SDK credentials
- `R2_*` - Cloudflare R2 configuration (accountId, accessKeyId, secretAccessKey, bucket)
- `SMTP_*` - Email service configuration
