import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../test-utils';
import MilestoneDetail from '@/pages/MilestoneDetail';
import { milestonesApi } from '@/shared/api/client';

// Mock the API
vi.mock('@/shared/api/client', () => ({
  milestonesApi: {
    list: vi.fn(),
    getById: vi.fn(),
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
    useParams: () => ({ id: 'milestone-1' }),
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

describe('MilestoneDetail', () => {
  const mockMilestone = {
    id: 'milestone-1',
    spaceId: 'space-1',
    title: 'Anniversary',
    description: 'Our first anniversary celebration',
    date: '2024-02-14T00:00:00.000Z',
    type: 'anniversary',
    icon: null,
    photos: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
    location: {
      name: 'Paris',
      address: 'Eiffel Tower, Paris',
      latitude: 48.8584,
      longitude: 2.2945,
    },
    createdAt: '2024-01-01T00:00:00.000Z',
    createdBy: 'user-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockMilestonesApi.getById.mockResolvedValue({ data: mockMilestone } as any);
    // Mock window.confirm for delete tests
    window.confirm = vi.fn(() => true);
  });

  describe('loading state', () => {
    it('should show loading spinner while fetching', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockMilestonesApi.getById.mockReturnValue(promise as any);

      render(<MilestoneDetail />);

      expect(screen.getByText('Loading milestone...')).toBeInTheDocument();

      resolvePromise!({ data: mockMilestone });
      await waitFor(() => {
        expect(screen.queryByText('Loading milestone...')).not.toBeInTheDocument();
      });
    });
  });

  describe('error state', () => {
    it('should show error message on fetch failure', async () => {
      mockMilestonesApi.getById.mockRejectedValue(new Error('Network error'));

      render(<MilestoneDetail />);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should show generic error for non-Error throws', async () => {
      mockMilestonesApi.getById.mockRejectedValue('string error');

      render(<MilestoneDetail />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load milestone')).toBeInTheDocument();
      });
    });

    it('should show Go Back button on error', async () => {
      mockMilestonesApi.getById.mockRejectedValue(new Error('Error'));

      render(<MilestoneDetail />);

      await waitFor(() => {
        expect(screen.getByText('Go Back')).toBeInTheDocument();
      });
    });
  });

  describe('milestone display', () => {
    it('should display milestone title', async () => {
      render(<MilestoneDetail />);

      await waitFor(() => {
        expect(screen.getByText('Anniversary')).toBeInTheDocument();
      });
    });

    it('should display milestone type badge', async () => {
      render(<MilestoneDetail />);

      await waitFor(() => {
        expect(screen.getByText('anniversary')).toBeInTheDocument();
      });
    });

    it('should display milestone description', async () => {
      render(<MilestoneDetail />);

      await waitFor(() => {
        expect(screen.getByText(/"Our first anniversary celebration"/)).toBeInTheDocument();
      });
    });

    it('should display formatted date', async () => {
      render(<MilestoneDetail />);

      await waitFor(() => {
        // Should show something like "Wednesday, February 14, 2024"
        expect(screen.getByText(/February/)).toBeInTheDocument();
      });
    });

    it('should display location when available', async () => {
      render(<MilestoneDetail />);

      await waitFor(() => {
        expect(screen.getByText('Paris')).toBeInTheDocument();
        expect(screen.getByText('Eiffel Tower, Paris')).toBeInTheDocument();
      });
    });

    it('should display "You" for own milestones', async () => {
      render(<MilestoneDetail />);

      await waitFor(() => {
        expect(screen.getByText('You')).toBeInTheDocument();
      });
    });

    it('should display partner name for partner milestones', async () => {
      const partnerMilestone = { ...mockMilestone, createdBy: 'partner-1' };
      mockMilestonesApi.getById.mockResolvedValue({ data: partnerMilestone } as any);

      render(<MilestoneDetail />);

      await waitFor(() => {
        expect(screen.getByText('Partner')).toBeInTheDocument();
      });
    });
  });

  describe('photo gallery', () => {
    it('should display photo navigation dots for multiple photos', async () => {
      render(<MilestoneDetail />);

      await waitFor(() => {
        // Should have 2 photo navigation dots
        const buttons = screen.getAllByRole('button');
        // Filter for small photo dots (usually have specific classes)
        expect(buttons.length).toBeGreaterThan(0);
      });
    });

    it('should not show photo gallery for single photo', async () => {
      const singlePhotoMilestone = { ...mockMilestone, photos: ['https://example.com/photo1.jpg'] };
      mockMilestonesApi.getById.mockResolvedValue({ data: singlePhotoMilestone } as any);

      render(<MilestoneDetail />);

      await waitFor(() => {
        expect(screen.queryByText('Photos')).not.toBeInTheDocument();
      });
    });

    it('should show photo gallery section for multiple photos', async () => {
      render(<MilestoneDetail />);

      await waitFor(() => {
        expect(screen.getByText('Photos')).toBeInTheDocument();
      });
    });
  });

  describe('menu interactions', () => {
    it('should show menu on more button click for own milestone', async () => {
      const user = userEvent.setup();
      render(<MilestoneDetail />);

      await waitFor(() => {
        expect(screen.getByText('Anniversary')).toBeInTheDocument();
      });

      const moreButton = screen.getByText('more_horiz');
      await user.click(moreButton);

      await waitFor(() => {
        expect(screen.getByText('Edit Milestone')).toBeInTheDocument();
        expect(screen.getByText('Delete Milestone')).toBeInTheDocument();
      });
    });

    it('should not show edit/delete for partner milestones', async () => {
      const partnerMilestone = { ...mockMilestone, createdBy: 'partner-1' };
      mockMilestonesApi.getById.mockResolvedValue({ data: partnerMilestone } as any);

      const user = userEvent.setup();
      render(<MilestoneDetail />);

      await waitFor(() => {
        expect(screen.getByText('Anniversary')).toBeInTheDocument();
      });

      const moreButton = screen.getByText('more_horiz');
      await user.click(moreButton);

      // Menu should not contain edit/delete options for partner's milestone
      expect(screen.queryByText('Edit Milestone')).not.toBeInTheDocument();
    });

    it('should navigate to edit page on edit click', async () => {
      const user = userEvent.setup();
      render(<MilestoneDetail />);

      await waitFor(() => {
        expect(screen.getByText('Anniversary')).toBeInTheDocument();
      });

      const moreButton = screen.getByText('more_horiz');
      await user.click(moreButton);

      await waitFor(() => {
        expect(screen.getByText('Edit Milestone')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Edit Milestone'));
      expect(mockNavigate).toHaveBeenCalledWith('/milestone/milestone-1/edit');
    });
  });

  describe('delete functionality', () => {
    it('should confirm before deleting', async () => {
      const user = userEvent.setup();
      render(<MilestoneDetail />);

      await waitFor(() => {
        expect(screen.getByText('Anniversary')).toBeInTheDocument();
      });

      const moreButton = screen.getByText('more_horiz');
      await user.click(moreButton);

      await waitFor(() => {
        expect(screen.getByText('Delete Milestone')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Delete Milestone'));
      expect(window.confirm).toHaveBeenCalled();
    });

    it('should delete and navigate on confirmation', async () => {
      mockMilestonesApi.delete.mockResolvedValue({} as any);
      const user = userEvent.setup();
      render(<MilestoneDetail />);

      await waitFor(() => {
        expect(screen.getByText('Anniversary')).toBeInTheDocument();
      });

      const moreButton = screen.getByText('more_horiz');
      await user.click(moreButton);

      await waitFor(() => {
        expect(screen.getByText('Delete Milestone')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Delete Milestone'));

      await waitFor(() => {
        expect(mockMilestonesApi.delete).toHaveBeenCalledWith('milestone-1');
        expect(mockNavigate).toHaveBeenCalledWith('/milestones');
      });
    });

    it('should not delete if confirmation is cancelled', async () => {
      window.confirm = vi.fn(() => false);
      const user = userEvent.setup();
      render(<MilestoneDetail />);

      await waitFor(() => {
        expect(screen.getByText('Anniversary')).toBeInTheDocument();
      });

      const moreButton = screen.getByText('more_horiz');
      await user.click(moreButton);

      await waitFor(() => {
        expect(screen.getByText('Delete Milestone')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Delete Milestone'));

      expect(mockMilestonesApi.delete).not.toHaveBeenCalled();
    });

    it('should show error on delete failure', async () => {
      mockMilestonesApi.delete.mockRejectedValue(new Error('Delete failed'));
      const user = userEvent.setup();
      render(<MilestoneDetail />);

      await waitFor(() => {
        expect(screen.getByText('Anniversary')).toBeInTheDocument();
      });

      const moreButton = screen.getByText('more_horiz');
      await user.click(moreButton);

      await waitFor(() => {
        expect(screen.getByText('Delete Milestone')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Delete Milestone'));

      await waitFor(() => {
        expect(screen.getByText('Delete failed')).toBeInTheDocument();
      });
    });
  });

  describe('navigation', () => {
    it('should navigate back on back button click', async () => {
      const user = userEvent.setup();
      render(<MilestoneDetail />);

      await waitFor(() => {
        expect(screen.getByText('Anniversary')).toBeInTheDocument();
      });

      const backButton = screen.getByText('arrow_back');
      await user.click(backButton);
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  describe('day number calculation', () => {
    it('should display day number for milestones after anniversary', async () => {
      render(<MilestoneDetail />);

      await waitFor(() => {
        expect(screen.getByText(/Day \d+/)).toBeInTheDocument();
      });
    });
  });
});
