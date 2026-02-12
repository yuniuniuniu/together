import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './shared/context/AuthContext';
import { SpaceProvider } from './shared/context/SpaceContext';
import { NotificationProvider } from './shared/context/NotificationContext';
import { ToastProvider } from './shared/components/feedback/Toast';
import { MobileWrapper } from './shared/components/layout/MobileWrapper';
import { ProtectedRoute, PublicOnlyRoute } from './shared/components/auth/ProtectedRoute';
import { AndroidBackHandler } from './shared/components/native/AndroidBackHandler';
import { WidgetSync } from './shared/components/native/WidgetSync';

// Eagerly loaded pages (critical path: login + dashboard)
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Lazy loaded pages
const Sanctuary = lazy(() => import('./pages/Sanctuary'));
const JoinSpace = lazy(() => import('./pages/JoinSpace'));
const ConfirmPartner = lazy(() => import('./pages/ConfirmPartner'));
const Celebration = lazy(() => import('./pages/Celebration'));
const ProfileSetup = lazy(() => import('./pages/ProfileSetup'));
const DateSelection = lazy(() => import('./pages/DateSelection'));
const CreateSpace = lazy(() => import('./pages/CreateSpace'));
const NewMemory = lazy(() => import('./pages/NewMemory'));
const MemoryDetail = lazy(() => import('./pages/MemoryDetail'));
const Settings = lazy(() => import('./pages/Settings'));
const Unbinding = lazy(() => import('./pages/Unbinding'));
const SelectRecordType = lazy(() => import('./pages/SelectRecordType'));
const NewMilestone = lazy(() => import('./pages/NewMilestone'));
const EditMemory = lazy(() => import('./pages/EditMemory'));
const MemoryMap = lazy(() => import('./pages/MemoryMap'));
const MemoryTimeline = lazy(() => import('./pages/MemoryTimeline'));
const MemoryHome = lazy(() => import('./pages/MemoryHome'));
const MilestoneTimeline = lazy(() => import('./pages/MilestoneTimeline'));
const MilestoneDetail = lazy(() => import('./pages/MilestoneDetail'));
const EditMilestone = lazy(() => import('./pages/EditMilestone'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 5000,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SpaceProvider>
          <NotificationProvider>
          <ToastProvider>
          <HashRouter>
            <AndroidBackHandler />
            <WidgetSync />
            <MobileWrapper>
              <Suspense fallback={<div className="flex-1 flex items-center justify-center min-h-screen bg-background-light"><div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>}>
              <Routes>
                {/* Public routes - redirect to dashboard if logged in */}
                <Route path="/" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />

                {/* Auth flow - protected but no space required */}
                <Route path="/sanctuary" element={<ProtectedRoute><Sanctuary /></ProtectedRoute>} />
                <Route path="/join" element={<ProtectedRoute><JoinSpace /></ProtectedRoute>} />
                <Route path="/confirm" element={<ProtectedRoute><ConfirmPartner /></ProtectedRoute>} />
                <Route path="/celebration" element={<ProtectedRoute><Celebration /></ProtectedRoute>} />
                <Route path="/setup/profile" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />
                <Route path="/setup/date" element={<ProtectedRoute><DateSelection /></ProtectedRoute>} />
                <Route path="/setup/create" element={<ProtectedRoute><CreateSpace /></ProtectedRoute>} />

                {/* Main app routes - protected */}
                <Route path="/dashboard" element={<ProtectedRoute requireSpace><Dashboard /></ProtectedRoute>} />
                <Route path="/record-type" element={<ProtectedRoute requireSpace><SelectRecordType /></ProtectedRoute>} />
                <Route path="/milestone/new" element={<ProtectedRoute requireSpace><NewMilestone /></ProtectedRoute>} />
                <Route path="/milestone/:id" element={<ProtectedRoute requireSpace><MilestoneDetail /></ProtectedRoute>} />
                <Route path="/milestone/:id/edit" element={<ProtectedRoute requireSpace><EditMilestone /></ProtectedRoute>} />
                <Route path="/milestones" element={<ProtectedRoute requireSpace><MilestoneTimeline /></ProtectedRoute>} />
                <Route path="/memory/map" element={<ProtectedRoute requireSpace><MemoryMap /></ProtectedRoute>} />
                <Route path="/memory/timeline" element={<ProtectedRoute requireSpace><MemoryTimeline /></ProtectedRoute>} />
                <Route path="/memories" element={<ProtectedRoute requireSpace><MemoryHome /></ProtectedRoute>} />
                <Route path="/memory/new" element={<ProtectedRoute requireSpace><NewMemory /></ProtectedRoute>} />
                <Route path="/memory/:id" element={<ProtectedRoute requireSpace><MemoryDetail /></ProtectedRoute>} />
                <Route path="/memory/:id/edit" element={<ProtectedRoute requireSpace><EditMemory /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute requireSpace><Settings /></ProtectedRoute>} />
                <Route path="/settings/unbind" element={<ProtectedRoute requireSpace><Unbinding /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute requireSpace><Notifications /></ProtectedRoute>} />

                {/* Legal pages - public */}
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
              </Routes>
              </Suspense>
            </MobileWrapper>
          </HashRouter>
          </ToastProvider>
          </NotificationProvider>
        </SpaceProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;