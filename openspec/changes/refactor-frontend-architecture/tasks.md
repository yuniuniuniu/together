# Tasks: Frontend Architecture Refactor

## 1. Infrastructure Setup

- [ ] 1.1 Install Tailwind CSS as dev dependency and create `tailwind.config.ts`
- [ ] 1.2 Create `postcss.config.js` for Tailwind processing
- [ ] 1.3 Migrate color/theme config from `index.html` to `tailwind.config.ts`
- [ ] 1.4 Create `src/index.css` with Tailwind directives
- [ ] 1.5 Update `index.html` to remove inline Tailwind config
- [ ] 1.6 Create directory structure: `features/`, `shared/`

## 2. Type Definitions

- [ ] 2.1 Create `shared/types/index.ts` with core business types (User, Space, Memory, Milestone)
- [ ] 2.2 Create `shared/types/ui.ts` with UI-related types (MoodType, MilestoneType)

## 3. Context Setup

- [ ] 3.1 Create `shared/context/AuthContext.tsx` with user state and auth methods
- [ ] 3.2 Create `shared/context/SpaceContext.tsx` with space/partner state
- [ ] 3.3 Wrap App with context providers in `App.tsx`

## 4. Shared UI Components

- [ ] 4.1 Create `shared/components/layout/PageLayout.tsx` (compound component)
- [ ] 4.2 Create `shared/components/layout/Header.tsx` (extracted from pages)
- [ ] 4.3 Create `shared/components/layout/BottomNav.tsx` (extracted from Dashboard)
- [ ] 4.4 Refactor `MobileWrapper` from `App.tsx` to `shared/components/layout/`
- [ ] 4.5 Create `shared/components/form/Input.tsx` (styled form input)
- [ ] 4.6 Move and enhance `components/Button.tsx` to `shared/components/form/`
- [ ] 4.7 Create `shared/components/feedback/BottomSheet.tsx`
- [ ] 4.8 Create `shared/components/feedback/Modal.tsx`
- [ ] 4.9 Create `shared/components/display/Avatar.tsx`
- [ ] 4.10 Create `shared/components/display/Card.tsx`

## 5. Shared Hooks

- [ ] 5.1 Create `shared/hooks/useApi.ts` (generic data fetching hook)
- [ ] 5.2 Create `shared/hooks/useLocalStorage.ts` (persist state locally)

## 6. Feature Modules Setup

- [ ] 6.1 Create `features/auth/` structure with types, hooks, components
- [ ] 6.2 Create `features/auth/hooks/useAuth.ts`
- [ ] 6.3 Create `features/memory/` structure
- [ ] 6.4 Create `features/memory/hooks/useMemories.ts`
- [ ] 6.5 Extract `VoiceRecorder`, `LocationPicker`, `StickerPicker` from NewMemory to `features/memory/components/`
- [ ] 6.6 Create `features/space/` structure
- [ ] 6.7 Create `features/milestone/` structure

## 7. Page Migration (Phase 1 - Core Pages)

- [ ] 7.1 Refactor `Login.tsx` to use shared components and auth feature
- [ ] 7.2 Refactor `Dashboard.tsx` to use shared layout and space feature
- [ ] 7.3 Refactor `Settings.tsx` to use shared components

## 8. Page Migration (Phase 2 - Memory Flow)

- [ ] 8.1 Refactor `NewMemory.tsx` - extract overlay components
- [ ] 8.2 Refactor `MemoryDetail.tsx`
- [ ] 8.3 Refactor `MemoryTimeline.tsx`
- [ ] 8.4 Refactor `MemoryMap.tsx`
- [ ] 8.5 Refactor `SelectRecordType.tsx`

## 9. Page Migration (Phase 3 - Setup Flow)

- [ ] 9.1 Refactor `ProfileSetup.tsx`
- [ ] 9.2 Refactor `DateSelection.tsx`
- [ ] 9.3 Refactor `CreateSpace.tsx`
- [ ] 9.4 Refactor `JoinSpace.tsx`
- [ ] 9.5 Refactor `ConfirmPartner.tsx`
- [ ] 9.6 Refactor `Celebration.tsx`

## 10. Page Migration (Phase 4 - Remaining)

- [ ] 10.1 Refactor `Sanctuary.tsx`
- [ ] 10.2 Refactor `NewMilestone.tsx`
- [ ] 10.3 Refactor `Notifications.tsx`
- [ ] 10.4 Refactor `Unbinding.tsx`

## 11. Cleanup

- [ ] 11.1 Remove unused code from old component locations
- [ ] 11.2 Update import paths throughout the codebase
- [ ] 11.3 Verify all pages render correctly
- [ ] 11.4 Update `openspec/project.md` with new architecture conventions
