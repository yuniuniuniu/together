import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { NotificationProvider, useNotifications } from '@/shared/context/NotificationContext';
import { notificationsApi } from '@/shared/api/client';

// Mock the API client
vi.mock('@/shared/api/client', () => ({
  notificationsApi: {
    list: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}));

// Mock the auth context
vi.mock('@/shared/context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-1', phone: '+1234567890', nickname: 'Test' },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    updateProfile: vi.fn(),
  })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { useAuth } from '@/shared/context/AuthContext';
const mockUseAuth = vi.mocked(useAuth);
const mockNotificationsApi = vi.mocked(notificationsApi);

describe('NotificationContext', () => {
  const mockNotifications = [
    {
      id: 'notif-1',
      userId: 'user-1',
      type: 'memory',
      title: 'New Memory',
      message: 'Partner added a new memory',
      createdAt: '2024-01-15T10:00:00.000Z',
      read: false,
      actionUrl: '/memory/123',
    },
    {
      id: 'notif-2',
      userId: 'user-1',
      type: 'milestone',
      title: 'Anniversary Coming',
      message: 'Your anniversary is in 3 days',
      createdAt: '2024-01-14T10:00:00.000Z',
      read: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });

    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', phone: '+1234567890', nickname: 'Test' },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn(),
    });

    mockNotificationsApi.list.mockResolvedValue({ data: mockNotifications } as any);
    mockNotificationsApi.markAsRead.mockResolvedValue({} as any);
    mockNotificationsApi.markAllAsRead.mockResolvedValue({} as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <NotificationProvider>{children}</NotificationProvider>
  );

  describe('useNotifications hook', () => {
    it('should throw error when used outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useNotifications());
      }).toThrow('useNotifications must be used within a NotificationProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('markAsRead', () => {
    it('should call markAsRead API', async () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      // Wait for initial load
      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      await act(async () => {
        await result.current.markAsRead('notif-1');
      });

      expect(mockNotificationsApi.markAsRead).toHaveBeenCalledWith('notif-1');
    });
  });

  describe('markAllAsRead', () => {
    it('should call markAllAsRead API', async () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      // Wait for initial load
      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      await act(async () => {
        await result.current.markAllAsRead();
      });

      expect(mockNotificationsApi.markAllAsRead).toHaveBeenCalled();
    });
  });

  describe('not authenticated', () => {
    it('should not fetch notifications when not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        updateProfile: vi.fn(),
      });

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      expect(mockNotificationsApi.list).not.toHaveBeenCalled();
      expect(result.current.notifications).toEqual([]);
    });
  });
});
