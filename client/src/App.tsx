import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './shared/context/AuthContext';
import { SpaceProvider } from './shared/context/SpaceContext';
import { NotificationProvider } from './shared/context/NotificationContext';
import { ToastProvider } from './shared/components/feedback/Toast';
import { MobileWrapper } from './shared/components/layout/MobileWrapper';
import { ProtectedRoute, PublicOnlyRoute } from './shared/components/auth/ProtectedRoute';
import { AndroidBackHandler } from './shared/components/native/AndroidBackHandler';

// Pages
import Login from './pages/Login';
import Sanctuary from './pages/Sanctuary';
import JoinSpace from './pages/JoinSpace';
import ConfirmPartner from './pages/ConfirmPartner';
import Celebration from './pages/Celebration';
import ProfileSetup from './pages/ProfileSetup';
import DateSelection from './pages/DateSelection';
import CreateSpace from './pages/CreateSpace';
import Dashboard from './pages/Dashboard';
import NewMemory from './pages/NewMemory';
import MemoryDetail from './pages/MemoryDetail';
import Settings from './pages/Settings';
import Unbinding from './pages/Unbinding';
import SelectRecordType from './pages/SelectRecordType';
import NewMilestone from './pages/NewMilestone';
import EditMemory from './pages/EditMemory';
import MemoryMap from './pages/MemoryMap';
import MemoryTimeline from './pages/MemoryTimeline';
import MilestoneTimeline from './pages/MilestoneTimeline';
import MilestoneDetail from './pages/MilestoneDetail';
import EditMilestone from './pages/EditMilestone';
import Notifications from './pages/Notifications';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

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
            <MobileWrapper>
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
                <Route path="/memories" element={<ProtectedRoute requireSpace><MemoryTimeline /></ProtectedRoute>} />
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