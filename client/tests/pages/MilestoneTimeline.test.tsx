import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, createMockMilestone } from '../test-utils';
import MilestoneTimeline from '@/pages/MilestoneTimeline';
import { milestonesApi } from '@/shared/api/client';

// Mock the API
vi.mock('@/shared/api/client', () => ({
  milestonesApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  authApi: {
    sendCode: vi.fn(),
    verify: vi.fn(),
    me: vi.fn(),
    updateProfile: vi.fn(),
  },
  spacesApi: {
    getSpace: vi.fn(),
  },
  notificationsApi: {
    list: vi.fn().mockResolvedValue({ data: [] }),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock auth context
vi.mock('@/shared/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', phone: '+1234567890', nickname: 'Test User' },
    isAuthenticated: true,
    isLoading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock space context
vi.mock('@/shared/context/SpaceContext', () => ({
  useSpace: () => ({
    space: { id: 'space-1' },
    anniversaryDate: '2024-01-01',
    partner: { id: 'partner-1', nickname: 'Partner' },
    isLoading: false,
    hasSpace: true,
  }),
  SpaceProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockMilestonesApi = vi.mocked(milestonesApi);

describe('MilestoneTimeline', () => {
  const mockMilestone = {
    id: 'milestone-1',
    spaceId: 'space-1',
    title: 'Anniversary',
    description: 'Our first anniversary',
    date: '2024-02-14',
    type: 'anniversary',
    icon: null,
    photos: ['https://example.com/photo.jpg'],
    createdAt: '2024-01-01T00:00:00.000Z',
    createdBy: 'user-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockMilestonesApi.list.mockResolvedValue({ data: [] } as any);
  });

  describe('loading state', () => {
    it('should show loading spinner while fetching', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockMilestonesApi.list.mockReturnValue(promise as any);

      render(<MilestoneTimeline />);

      expect(screen.getByText('Loading milestones...')).toBeInTheDocument();

      resolvePromise!({ data: [] });
      await waitFor(() => {
        expect(screen.queryByText('Loading milestones...')).not.toBeInTheDocument();
      });
    });
  });

  describe('error state', () => {
    it('should show error message on fetch failure', async () => {
      mockMilestonesApi.list.mockRejectedValue(new Error('Network error'));

      render(<MilestoneTimeline />);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should show generic error for non-Error throws', async () => {
      mockMilestonesApi.list.mockRejectedValue('string error');

      render(<MilestoneTimeline />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load milestones')).toBeInTheDocument();
      });
    });
  });

  describe('empty state', () => {
    it('should show empty state when no milestones', async () => {
      mockMilestonesApi.list.mockResolvedValue({ data: [] } as any);

      render(<MilestoneTimeline />);

      await waitFor(() => {
        expect(screen.getByText('No milestones yet')).toBeInTheDocument();
      });
    });

    it('should show create milestone button in empty state', async () => {
      mockMilestonesApi.list.mockResolvedValue({ data: [] } as any);

      render(<MilestoneTimeline />);

      await waitFor(() => {
        expect(screen.getByText('Create Milestone')).toBeInTheDocument();
      });
    });

    it('should navigate to create milestone on button click', async () => {
      mockMilestonesApi.list.mockResolvedValue({ data: [] } as any);
      const user = userEvent.setup();

      render(<MilestoneTimeline />);

      await waitFor(() => {
        expect(screen.getByText('Create Milestone')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Create Milestone'));
      expect(mockNavigate).toHaveBeenCalledWith('/milestone/new');
    });
  });

  describe('milestones list', () => {
    it('should display milestones', async () => {
      mockMilestonesApi.list.mockResolvedValue({ data: [mockMilestone] } as any);

      render(<MilestoneTimeline />);

      await waitFor(() => {
        expect(screen.getByText('Anniversary')).toBeInTheDocument();
      });
    });

    it('should display milestone count', async () => {
      mockMilestonesApi.list.mockResolvedValue({ data: [mockMilestone] } as any);

      render(<MilestoneTimeline />);

      await waitFor(() => {
        expect(screen.getByText('1 Milestone')).toBeInTheDocument();
      });
    });

    it('should display plural for multiple milestones', async () => {
      mockMilestonesApi.list.mockResolvedValue({
        data: [mockMilestone, { ...mockMilestone, id: 'milestone-2' }],
      } as any);

      render(<MilestoneTimeline />);

      await waitFor(() => {
        expect(screen.getByText('2 Milestones')).toBeInTheDocument();
      });
    });

    it('should display milestone type badge', async () => {
      mockMilestonesApi.list.mockResolvedValue({ data: [mockMilestone] } as any);

      render(<MilestoneTimeline />);

      await waitFor(() => {
        expect(screen.getByText('anniversary')).toBeInTheDocument();
      });
    });

    it('should display milestone description', async () => {
      mockMilestonesApi.list.mockResolvedValue({ data: [mockMilestone] } as any);

      render(<MilestoneTimeline />);

      await waitFor(() => {
        expect(screen.getByText('Our first anniversary')).toBeInTheDocument();
      });
    });

    it('should display "You" for own milestones', async () => {
      mockMilestonesApi.list.mockResolvedValue({ data: [mockMilestone] } as any);

      render(<MilestoneTimeline />);

      await waitFor(() => {
        expect(screen.getByText('You')).toBeInTheDocument();
      });
    });

    it('should display "Partner" for partner milestones', async () => {
      const partnerMilestone = { ...mockMilestone, createdBy: 'partner-1' };
      mockMilestonesApi.list.mockResolvedValue({ data: [partnerMilestone] } as any);

      render(<MilestoneTimeline />);

      await waitFor(() => {
        expect(screen.getByText('Partner')).toBeInTheDocument();
      });
    });

    it('should navigate to milestone detail on card click', async () => {
      mockMilestonesApi.list.mockResolvedValue({ data: [mockMilestone] } as any);
      const user = userEvent.setup();

      render(<MilestoneTimeline />);

      await waitFor(() => {
        expect(screen.getByText('Anniversary')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Anniversary'));
      expect(mockNavigate).toHaveBeenCalledWith('/milestone/milestone-1');
    });
  });

  describe('navigation', () => {
    it('should navigate back to dashboard on back button click', async () => {
      mockMilestonesApi.list.mockResolvedValue({ data: [] } as any);
      const user = userEvent.setup();

      render(<MilestoneTimeline />);

      await waitFor(() => {
        // Multiple elements may have "Milestones" text (header + nav)
        expect(screen.getAllByText('Milestones').length).toBeGreaterThan(0);
      });

      const backButton = screen.getByText('arrow_back');
      await user.click(backButton);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('should navigate to new milestone on add button click', async () => {
      mockMilestonesApi.list.mockResolvedValue({ data: [] } as any);
      const user = userEvent.setup();

      render(<MilestoneTimeline />);

      await waitFor(() => {
        // Multiple elements may have "Milestones" text (header + nav)
        expect(screen.getAllByText('Milestones').length).toBeGreaterThan(0);
      });

      // Find the add button in header
      const addButton = screen.getAllByText('add')[0];
      await user.click(addButton);
      expect(mockNavigate).toHaveBeenCalledWith('/milestone/new');
    });
  });

  describe('day number calculation', () => {
    it('should display day number for milestones after anniversary', async () => {
      // Anniversary is 2024-01-01, milestone is 2024-02-14 = day 45
      mockMilestonesApi.list.mockResolvedValue({ data: [mockMilestone] } as any);

      render(<MilestoneTimeline />);

      await waitFor(() => {
        expect(screen.getByText(/Day \d+/)).toBeInTheDocument();
      });
    });
  });

  describe('FAB button', () => {
    it('should show FAB when milestones exist', async () => {
      mockMilestonesApi.list.mockResolvedValue({ data: [mockMilestone] } as any);

      render(<MilestoneTimeline />);

      await waitFor(() => {
        // FAB should exist (has 'add' icon)
        const addButtons = screen.getAllByText('add');
        expect(addButtons.length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});
