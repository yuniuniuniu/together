import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/shared/context/AuthContext';
import { SpaceProvider } from '@/shared/context/SpaceContext';
import { NotificationProvider } from '@/shared/context/NotificationContext';

interface WrapperProps {
  children: React.ReactNode;
}

// Provider wrapper for all tests
const AllProviders: React.FC<WrapperProps> = ({ children }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SpaceProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </SpaceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

// Custom render function that includes all providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options });

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };

// Mock API responses helper
export const mockApiResponse = <T,>(data: T, success = true) => {
  return Promise.resolve({
    ok: success,
    json: () => Promise.resolve({ success, data }),
  });
};

export const mockApiError = (message: string, status = 400) => {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ success: false, message }),
  });
};

// Helper to create mock user
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  phone: '+1234567890',
  nickname: 'Test User',
  avatar: undefined,
  ...overrides,
});

// Helper to create mock space
export const createMockSpace = (overrides = {}) => ({
  id: 'test-space-id',
  createdAt: '2024-01-01T00:00:00.000Z',
  anniversaryDate: '2024-02-14',
  inviteCode: '123456',
  partners: [
    createMockUser(),
    createMockUser({ id: 'partner-id', phone: '+9876543210', nickname: 'Partner' }),
  ],
  ...overrides,
});

// Helper to create mock memory
export const createMockMemory = (overrides = {}) => ({
  id: 'test-memory-id',
  spaceId: 'test-space-id',
  content: 'Test memory content',
  mood: 'Happy',
  photos: [],
  location: undefined,
  voiceNote: undefined,
  stickers: [],
  createdAt: '2024-01-15T10:30:00.000Z',
  createdBy: 'test-user-id',
  wordCount: 3,
  ...overrides,
});

// Helper to create mock milestone
export const createMockMilestone = (overrides = {}) => ({
  id: 'test-milestone-id',
  spaceId: 'test-space-id',
  title: 'Test Milestone',
  description: 'A test milestone',
  date: '2024-02-14',
  type: 'anniversary',
  icon: undefined,
  photos: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  createdBy: 'test-user-id',
  ...overrides,
});

// Helper to create mock notification
export const createMockNotification = (overrides = {}) => ({
  id: 'test-notification-id',
  userId: 'test-user-id',
  type: 'memory',
  title: 'Test Notification',
  message: 'This is a test notification',
  createdAt: new Date().toISOString(),
  read: false,
  actionUrl: '/memory/123',
  ...overrides,
});
