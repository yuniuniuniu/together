# Project Context

## Purpose
Sanctuary is a private, encrypted space for couples to share memories, track anniversaries, and journal together. It's a mobile-first web application designed to help partners document and celebrate their relationship journey.

## Tech Stack
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **Routing**: React Router DOM 7 (HashRouter for client-side routing)
- **Styling**: Tailwind CSS (utility-first classes)
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
- **File Structure**: Flat structure with `pages/` for route components, `components/` for reusable UI
- **Routing**: HashRouter with route definitions in `App.tsx`
- **Mobile-First**: All pages wrapped in `MobileWrapper` (max-width 430px)
- **Component Props**: Use TypeScript interfaces extending HTML element attributes
- **State Management**: Local component state (no global state library)

### Testing Strategy
No automated testing currently in place.

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

## External Dependencies
- **Gemini API**: Google's AI API (requires `GEMINI_API_KEY`)
- **Custom Backend**: Backend API for user data, authentication, and storage
- **Google Images CDN**: External image hosting (lh3.googleusercontent.com)
