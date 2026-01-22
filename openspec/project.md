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

## Project Structure (Monorepo)

```
together/
├── client/                      # Frontend application
│   ├── src/
│   │   ├── App.tsx              # Root component with providers and routing
│   │   ├── index.tsx            # Entry point
│   │   ├── index.css            # Tailwind theme and custom styles
│   │   ├── pages/               # Route entry points
│   │   ├── components/          # Legacy components (being migrated)
│   │   ├── features/            # Domain-specific modules
│   │   │   ├── auth/            # Authentication module
│   │   │   ├── memory/          # Memory/journal module
│   │   │   ├── milestone/       # Milestone tracking module
│   │   │   └── space/           # Couple space management
│   │   └── shared/              # Cross-cutting concerns
│   │       ├── api/             # API client (client.ts)
│   │       ├── components/      # Reusable UI components
│   │       ├── context/         # React Contexts
│   │       ├── hooks/           # Shared hooks
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
│   │   ├── db/                  # Database layer
│   │   ├── routes/              # API route handlers
│   │   ├── services/            # Business logic
│   │   └── middleware/          # Express middleware
│   ├── tests/                   # Backend tests
│   └── package.json
├── package.json                 # Workspace root configuration
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

### Tech Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: SQLite with sql.js (pure JavaScript implementation)
- **Authentication**: JWT tokens
- **Testing**: Vitest with supertest

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
- Backend runs on port 3005
- Frontend runs on port 3000
- Frontend connects via `VITE_API_URL` environment variable
- Database file stored at `server/data/sanctuary.db`

## External Dependencies
- **Local Backend**: Express.js API server (port 3005) with SQLite
- **Gemini API**: Google's AI API (requires `GEMINI_API_KEY`)
- **Google Images CDN**: External image hosting (lh3.googleusercontent.com)

## Key Files
- `client/src/index.css` - Tailwind theme configuration and custom styles
- `client/src/App.tsx` - Root component with context providers and routing
- `client/src/shared/types/index.ts` - Core business types (User, Space, Memory, Milestone)
- `client/src/shared/context/` - Global state management
- `client/src/shared/api/client.ts` - API client for backend communication
- `server/src/app.ts` - Express application setup
- `server/src/db/schema.sql` - Database schema definition

## NPM Scripts
- `npm run dev` - Start frontend dev server
- `npm run dev:server` - Start backend dev server
- `npm run dev:all` - Start both frontend and backend
- `npm run test` - Run all tests
- `npm run test:client` - Run frontend tests only
- `npm run test:server` - Run backend tests only
