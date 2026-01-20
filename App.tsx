import React from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';

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
import MemoryMap from './pages/MemoryMap';
import MemoryTimeline from './pages/MemoryTimeline';
import Notifications from './pages/Notifications';

const MobileWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen w-full flex justify-center bg-gray-100/50">
      <div className="w-full max-w-[430px] min-h-screen bg-background-light shadow-2xl overflow-hidden relative flex flex-col">
        {children}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <MobileWrapper>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/sanctuary" element={<Sanctuary />} />
          <Route path="/join" element={<JoinSpace />} />
          <Route path="/confirm" element={<ConfirmPartner />} />
          <Route path="/celebration" element={<Celebration />} />
          
          <Route path="/setup/profile" element={<ProfileSetup />} />
          <Route path="/setup/date" element={<DateSelection />} />
          <Route path="/setup/create" element={<CreateSpace />} />
          
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/record-type" element={<SelectRecordType />} />
          <Route path="/milestone/new" element={<NewMilestone />} />
          <Route path="/memory/map" element={<MemoryMap />} />
          <Route path="/memory/timeline" element={<MemoryTimeline />} />
          <Route path="/memory/new" element={<NewMemory />} />
          <Route path="/memory/detail" element={<MemoryDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/unbind" element={<Unbinding />} />
          <Route path="/notifications" element={<Notifications />} />
        </Routes>
      </MobileWrapper>
    </HashRouter>
  );
};

export default App;