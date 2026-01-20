# Frontend Architecture Specification

## ADDED Requirements

### Requirement: Directory Structure
The project SHALL organize code using a feature-based directory structure with the following top-level folders:
- `features/` - Domain-specific modules (auth, memory, milestone, space, settings)
- `shared/` - Cross-cutting concerns (components, hooks, types, utils)
- `pages/` - Route entry points that compose features

Each feature module SHALL contain its own `components/`, `hooks/`, and `types.ts` as needed.

#### Scenario: Developer adds a new memory-related component
- **WHEN** a developer creates a component specific to the memory feature
- **THEN** the component SHALL be placed in `features/memory/components/`

#### Scenario: Developer creates a reusable UI component
- **WHEN** a developer creates a component that is not specific to any feature
- **THEN** the component SHALL be placed in `shared/components/` under the appropriate category (layout, form, feedback, display)

---

### Requirement: State Management with React Context
The application SHALL use React Context for global state management. The following contexts SHALL be implemented:
- `AuthContext` - User authentication state and methods
- `SpaceContext` - Couple space data and partner information

Custom hooks SHALL wrap context access to provide a clean API.

#### Scenario: Component needs current user data
- **WHEN** a component needs to access the current user
- **THEN** it SHALL use the `useAuth()` hook which returns `{ user, isAuthenticated, isLoading, login, logout }`

#### Scenario: Component needs space/partner data
- **WHEN** a component needs to access the couple's space data
- **THEN** it SHALL use the `useSpace()` hook which returns `{ space, partner, daysCount, anniversaryDate }`

---

### Requirement: Shared UI Components
The application SHALL provide a set of reusable UI components in `shared/components/`:

**Layout Components:**
- `PageLayout` - Compound component for page structure with Header, Content, and FloatingBar slots
- `Header` - Page header with back button, title, and action slots
- `BottomNav` - Bottom navigation bar for main sections
- `MobileWrapper` - Container that constrains content to mobile viewport

**Form Components:**
- `Input` - Styled text input with label support
- `Button` - Button component with variants (primary, secondary, ghost)

**Feedback Components:**
- `BottomSheet` - Slide-up modal panel
- `Modal` - Centered modal dialog

**Display Components:**
- `Avatar` - User profile image with fallback
- `Card` - Content container with shadow and border radius

#### Scenario: Page uses standard layout
- **WHEN** a page needs header, content area, and floating action bar
- **THEN** it SHALL use `PageLayout` composition:
```tsx
<PageLayout>
  <PageLayout.Header title="Page Title" onBack={() => navigate(-1)} />
  <PageLayout.Content>{/* content */}</PageLayout.Content>
  <PageLayout.FloatingBar>{/* actions */}</PageLayout.FloatingBar>
</PageLayout>
```

#### Scenario: Form uses styled input
- **WHEN** a form needs a text input field
- **THEN** it SHALL use the `Input` component with appropriate props (label, placeholder, type)

---

### Requirement: Custom Hooks for API Calls
API calls SHALL be encapsulated in custom hooks within feature modules. A generic `useApi` hook SHALL be provided in `shared/hooks/` for consistent loading and error state handling.

#### Scenario: Feature needs to fetch data
- **WHEN** a feature needs to fetch data from an API
- **THEN** it SHALL create a custom hook (e.g., `useMemories()`) that uses `useApi` internally

#### Scenario: Hook handles loading state
- **WHEN** an API call is in progress
- **THEN** the hook SHALL return `{ isLoading: true, data: null, error: null }`

#### Scenario: Hook handles error state
- **WHEN** an API call fails
- **THEN** the hook SHALL return `{ isLoading: false, data: null, error: Error }`

---

### Requirement: TypeScript Type Definitions
Core business entities SHALL be defined as TypeScript interfaces in `shared/types/index.ts`:
- `User` - User profile information
- `Space` - Couple's shared space
- `Memory` - Memory entry with content, photos, mood, location
- `Milestone` - Important date or event
- `Partner` - Partner relationship data

#### Scenario: Component uses typed props
- **WHEN** a component accepts business data as props
- **THEN** it SHALL use the defined types from `shared/types/`

---

### Requirement: Tailwind Configuration
Tailwind CSS SHALL be configured via `tailwind.config.ts` (not inline in HTML). All custom colors, fonts, shadows, and animations currently in `index.html` SHALL be migrated to the config file.

#### Scenario: Developer adds a new custom color
- **WHEN** a developer needs to add a new theme color
- **THEN** they SHALL add it to `tailwind.config.ts` under `theme.extend.colors`

#### Scenario: Build includes only used styles
- **WHEN** the application is built for production
- **THEN** Tailwind SHALL purge unused styles based on the `content` configuration
