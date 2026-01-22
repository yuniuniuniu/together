import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, createMockNotification } from '../test-utils';
import Notifications from '@/pages/Notifications';
import { useNotifications } from '@/shared/context/NotificationContext';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the notification context
vi.mock('@/shared/context/NotificationContext', () => ({
  useNotifications: vi.fn(),
  NotificationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock the toast
const mockShowToast = vi.fn();
vi.mock('@/shared/components/feedback/Toast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockUseNotifications = vi.mocked(useNotifications);

describe('Notifications', () => {
  const mockNotifications = [
    {
      id: 'notif-1',
      userId: 'user-1',
      type: 'memory',
      title: 'New Memory',
      message: 'Partner added a new memory',
      createdAt: new Date().toISOString(), // Today
      read: false,
      actionUrl: '/memory/123',
    },
    {
      id: 'notif-2',
      userId: 'user-1',
      type: 'milestone',
      title: 'Anniversary Coming',
      message: 'Your anniversary is in 3 days',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
      read: true,
    },
  ];

  const mockMarkAsRead = vi.fn();
  const mockMarkAllAsRead = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNotifications.mockReturnValue({
      notifications: mockNotifications,
      unreadCount: 1,
      isLoading: false,
      error: null,
      refresh: vi.fn(),
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
    });
  });

  describe('loading state', () => {
    it('should show loading spinner while fetching', () => {
      mockUseNotifications.mockReturnValue({
        notifications: [],
        unreadCount: 0,
        isLoading: true,
        error: null,
        refresh: vi.fn(),
        markAsRead: mockMarkAsRead,
        markAllAsRead: mockMarkAllAsRead,
      });

      render(<Notifications />);

      expect(screen.getByText('Loading notifications...')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should show error message on fetch failure', () => {
      mockUseNotifications.mockReturnValue({
        notifications: [],
        unreadCount: 0,
        isLoading: false,
        error: 'Failed to load notifications',
        refresh: vi.fn(),
        markAsRead: mockMarkAsRead,
        markAllAsRead: mockMarkAllAsRead,
      });

      render(<Notifications />);

      expect(screen.getByText('Failed to load notifications')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should show empty state when no notifications', () => {
      mockUseNotifications.mockReturnValue({
        notifications: [],
        unreadCount: 0,
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        markAsRead: mockMarkAsRead,
        markAllAsRead: mockMarkAllAsRead,
      });

      render(<Notifications />);

      expect(screen.getByText('Your space is quiet for now')).toBeInTheDocument();
    });
  });

  describe('notifications list', () => {
    it('should display notifications', () => {
      render(<Notifications />);

      expect(screen.getByText('New Memory')).toBeInTheDocument();
      expect(screen.getByText('Anniversary Coming')).toBeInTheDocument();
    });

    it('should display notification messages', () => {
      render(<Notifications />);

      expect(screen.getByText('Partner added a new memory')).toBeInTheDocument();
      expect(screen.getByText('Your anniversary is in 3 days')).toBeInTheDocument();
    });

    it('should display notification types', () => {
      render(<Notifications />);

      expect(screen.getByText('memory')).toBeInTheDocument();
      expect(screen.getByText('milestone')).toBeInTheDocument();
    });

    it('should show unread indicator for unread notifications', () => {
      render(<Notifications />);

      // The unread notification should have a dot indicator
      // Check that the component renders the unread count
      expect(screen.getByText('1 New')).toBeInTheDocument();
    });

    it('should separate today and earlier notifications', () => {
      render(<Notifications />);

      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('Earlier')).toBeInTheDocument();
    });
  });

  describe('mark as read', () => {
    it('should mark notification as read on click', async () => {
      const user = userEvent.setup();
      render(<Notifications />);

      await user.click(screen.getByText('New Memory'));

      expect(mockMarkAsRead).toHaveBeenCalledWith('notif-1');
    });

    it('should not mark already read notification', async () => {
      // Set all notifications as read
      mockUseNotifications.mockReturnValue({
        notifications: [{ ...mockNotifications[1] }], // Only the read one
        unreadCount: 0,
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        markAsRead: mockMarkAsRead,
        markAllAsRead: mockMarkAllAsRead,
      });

      const user = userEvent.setup();
      render(<Notifications />);

      await user.click(screen.getByText('Anniversary Coming'));

      // Should not call markAsRead for already read notification
      expect(mockMarkAsRead).not.toHaveBeenCalled();
    });

    it('should navigate to action URL on click', async () => {
      const user = userEvent.setup();
      render(<Notifications />);

      await user.click(screen.getByText('New Memory'));

      expect(mockNavigate).toHaveBeenCalledWith('/memory/123');
    });
  });

  describe('mark all as read', () => {
    it('should show Read All button when there are unread notifications', () => {
      render(<Notifications />);

      expect(screen.getByText('Read All')).toBeInTheDocument();
    });

    it('should not show Read All button when all are read', () => {
      mockUseNotifications.mockReturnValue({
        notifications: [{ ...mockNotifications[1] }],
        unreadCount: 0,
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        markAsRead: mockMarkAsRead,
        markAllAsRead: mockMarkAllAsRead,
      });

      render(<Notifications />);

      expect(screen.queryByText('Read All')).not.toBeInTheDocument();
    });

    it('should mark all as read on button click', async () => {
      const user = userEvent.setup();
      render(<Notifications />);

      await user.click(screen.getByText('Read All'));

      expect(mockMarkAllAsRead).toHaveBeenCalled();
    });

    it('should show success toast after marking all as read', async () => {
      mockMarkAllAsRead.mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<Notifications />);

      await user.click(screen.getByText('Read All'));

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('All notifications marked as read', 'success');
      });
    });

    it('should show error toast on failure', async () => {
      mockMarkAllAsRead.mockRejectedValue(new Error('Failed'));
      const user = userEvent.setup();
      render(<Notifications />);

      await user.click(screen.getByText('Read All'));

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Failed to mark all as read', 'error');
      });
    });
  });

  describe('navigation', () => {
    it('should navigate back on back button click', async () => {
      const user = userEvent.setup();
      render(<Notifications />);

      const backButton = screen.getByText('arrow_back');
      await user.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  describe('time formatting', () => {
    it('should format recent time as minutes ago', () => {
      const recentNotification = {
        ...mockNotifications[0],
        createdAt: new Date(Date.now() - 5 * 60000).toISOString(), // 5 minutes ago
      };

      mockUseNotifications.mockReturnValue({
        notifications: [recentNotification],
        unreadCount: 1,
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        markAsRead: mockMarkAsRead,
        markAllAsRead: mockMarkAllAsRead,
      });

      render(<Notifications />);

      expect(screen.getByText('5m ago')).toBeInTheDocument();
    });

    it('should format hours ago correctly', () => {
      const hourOldNotification = {
        ...mockNotifications[0],
        createdAt: new Date(Date.now() - 2 * 3600000).toISOString(), // 2 hours ago
      };

      mockUseNotifications.mockReturnValue({
        notifications: [hourOldNotification],
        unreadCount: 1,
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        markAsRead: mockMarkAsRead,
        markAllAsRead: mockMarkAllAsRead,
      });

      render(<Notifications />);

      expect(screen.getByText('2h ago')).toBeInTheDocument();
    });
  });

  describe('notification icons', () => {
    it('should display correct icon for memory type', () => {
      render(<Notifications />);

      expect(screen.getByText('photo_library')).toBeInTheDocument();
    });

    it('should display correct icon for milestone type', () => {
      render(<Notifications />);

      expect(screen.getByText('celebration')).toBeInTheDocument();
    });
  });
});
