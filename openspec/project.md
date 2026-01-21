# Project Context

## Purpose
Sanctuary is a private, encrypted space for couples to share memories, track anniversaries, and journal together. It's a mobile-first web application designed to help partners document and celebrate their relationship journey.

## Tech Stack
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **Routing**: React Router DOM 7 (HashRouter for client-side routing)
- **Styling**: Tailwind CSS v4 (CSS-based configuration with `@theme` in `index.css`)
- **Target**: ES2022, modern browsers
- **Module System**: ESNext modules

## Project Conventions

### Code Style
- No enforced linter/formatter configuration
- TypeScript with `React.FC` type annotations for components
- Functional components with hooks
- Path aliases: `@/*` maps to project root
- Tailwind utility classes for styling (no CSS modules)

### Architecture Patterns

#### Directory Structure (Feature-Based)
```
├── features/                    # Domain-specific modules
│   ├── auth/                    # Authentication module
│   │   ├── hooks/               # useAuth
│   │   ├── types.ts
│   │   └── index.ts
│   ├── memory/                  # Memory/journal module
│   │   ├── components/          # VoiceRecorder, LocationPicker, StickerPicker
│   │   ├── hooks/               # useMemories
│   │   ├── types.ts
│   │   └── index.ts
│   ├── milestone/               # Milestone tracking module
│   │   ├── hooks/               # useMilestones
│   │   ├── types.ts
│   │   └── index.ts
│   └── space/                   # Couple space management
│       ├── hooks/               # useSpace
│       ├── types.ts
│       └── index.ts
├── shared/                      # Cross-cutting concerns
│   ├── api/                     # API client
│   │   └── client.ts            # Backend API communication
│   ├── components/              # Reusable UI components
│   │   ├── layout/              # MobileWrapper, Header, BottomNav, PageLayout
│   │   ├── form/                # Button, Input
│   │   ├── feedback/            # BottomSheet, Modal
│   │   └── display/             # Avatar, Card
│   ├── context/                 # React Contexts (AuthContext, SpaceContext)
│   ├── hooks/                   # Shared hooks (useApi, useLocalStorage)
│   └── types/                   # Shared TypeScript types (index.ts, ui.ts)
├── pages/                       # Route entry points
├── components/                  # Legacy components (being migrated)
├── App.tsx                      # Root component with providers and routing
└── index.tsx                    # Entry point
```

#### State Management
- **React Context** for global state: `AuthContext`, `SpaceContext`
- **Custom Hooks** wrap context access: `useAuth()`, `useSpace()`
- Local component state for UI-specific state

#### Component Patterns
- **Compound Components** for complex layouts (e.g., `PageLayout.Header`, `PageLayout.Content`)
- **Props interfaces** extend HTML element attributes where appropriate
- Preserve exact existing UI when refactoring (no visual changes)

#### Data Fetching
- Custom hooks with `useApi` for consistent loading/error states
- Feature-specific hooks: `useMemories()`, `useMilestones()`

### Routing
- HashRouter with route definitions in `App.tsx`
- All pages wrapped in `MobileWrapper` (max-width 430px)

### Styling
- Tailwind CSS v4 with `@theme` configuration in `index.css`
- Custom colors, shadows, fonts, and animations defined in theme
- Custom CSS classes for complex effects (`.bottom-sheet`, `.glass-panel`, etc.)

### Testing Strategy
- **Backend**: Vitest test suite with 62 tests across 6 test files covering all API endpoints
- **Frontend**: No automated testing currently in place

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

### Tech Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: SQLite with sql.js (pure JavaScript implementation)
- **Authentication**: JWT tokens
- **Testing**: Vitest with supertest

### Backend Directory Structure
```
├── server/
│   ├── src/
│   │   ├── index.ts            # Entry point
│   │   ├── app.ts              # Express configuration
│   │   ├── db/                 # Database layer (schema.sql, index.ts, seed.ts)
│   │   ├── routes/             # API route handlers (auth, spaces, memories, milestones, notifications, reactions)
│   │   ├── services/           # Business logic (*Service.ts files)
│   │   └── middleware/         # Express middleware (auth, validate, errorHandler)
│   └── tests/                  # Vitest test files
```

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

### Development
- Backend runs on port 3001
- Frontend connects via `VITE_API_URL` environment variable
- Database file stored at `server/data/sanctuary.db`

## External Dependencies
- **Local Backend**: Express.js API server (port 3001) with SQLite
- **Gemini API**: Google's AI API (requires `GEMINI_API_KEY`)
- **Google Images CDN**: External image hosting (lh3.googleusercontent.com)

## Key Files
- `index.css` - Tailwind theme configuration and custom styles
- `App.tsx` - Root component with context providers and routing
- `shared/types/index.ts` - Core business types (User, Space, Memory, Milestone)
- `shared/context/` - Global state management
- `shared/api/client.ts` - API client for backend communication
- `server/src/app.ts` - Express application setup
- `server/src/db/schema.sql` - Database schema definition
