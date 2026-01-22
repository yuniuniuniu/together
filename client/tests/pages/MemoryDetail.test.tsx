import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import MemoryDetail from '@/pages/MemoryDetail';
import { AuthProvider } from '@/shared/context/AuthContext';
import { SpaceProvider } from '@/shared/context/SpaceContext';
import { ToastProvider } from '@/shared/components/feedback/Toast';
import * as client from '@/shared/api/client';

// Mock react-router-dom navigate and useParams
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: 'memory-123' }),
  };
});

// Mock the API client
vi.mock('@/shared/api/client', () => ({
  memoriesApi: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  reactionsApi: {
    list: vi.fn(),
    getMine: vi.fn(),
    toggle: vi.fn(),
  },
  spacesApi: {
    getMy: vi.fn(),
    create: vi.fn(),
    join: vi.fn(),
    delete: vi.fn(),
  },
  authApi: {
    getMe: vi.fn(),
    sendCode: vi.fn(),
    verify: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

const mockMemoriesApi = client.memoriesApi as {
  getById: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

const mockReactionsApi = client.reactionsApi as {
  list: ReturnType<typeof vi.fn>;
  getMine: ReturnType<typeof vi.fn>;
  toggle: ReturnType<typeof vi.fn>;
};

const mockSpacesApi = client.spacesApi as {
  getMy: ReturnType<typeof vi.fn>;
};

const mockAuthApi = client.authApi as {
  getMe: ReturnType<typeof vi.fn>;
};

const createMockMemory = (overrides = {}) => ({
  id: 'memory-123',
  spaceId: 'space-1',
  content: 'A beautiful day together at the beach',
  mood: 'Happy',
  photos: [],
  stickers: [],
  createdAt: '2024-06-15T10:00:00.000Z',
  createdBy: 'user-1',
  ...overrides,
});

const createMockUser = (overrides = {}) => ({
  id: 'user-1',
  phone: '+1234567890',
  nickname: 'TestUser',
  avatar: null,
  ...overrides,
});

const createMockSpace = (overrides = {}) => ({
  id: 'space-1',
  createdAt: '2024-01-01T00:00:00.000Z',
  anniversaryDate: '2024-01-01',
  inviteCode: '123456',
  partners: [
    { id: 'user-1', phone: '+1234567890', nickname: 'TestUser' },
    { id: 'user-2', phone: '+0987654321', nickname: 'Partner' },
  ],
  ...overrides,
});

const renderMemoryDetail = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <SpaceProvider>
          <ToastProvider>
            <MemoryDetail />
          </ToastProvider>
        </SpaceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('MemoryDetail Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    localStorage.clear();

    // Default mock setup
    mockAuthApi.getMe.mockRejectedValue(new Error('No token'));
    mockSpacesApi.getMy.mockResolvedValue({ data: null });
  });

  describe('loading state', () => {
    it('should show loading spinner while fetching memory', async () => {
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockMemoriesApi.getById.mockReturnValue(pendingPromise);

      renderMemoryDetail();

      expect(screen.getByText('Loading memory...')).toBeInTheDocument();

      // Cleanup
      resolvePromise!({ data: createMockMemory() });
    });
  });

  describe('error state', () => {
    it('should show error message when memory fetch fails', async () => {
      mockMemoriesApi.getById.mockRejectedValue(new Error('Network error'));

      renderMemoryDetail();

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should show "Memory not found" when no memory returned', async () => {
      mockMemoriesApi.getById.mockResolvedValue({ data: null });
      mockReactionsApi.list.mockResolvedValue({ data: [] });
      mockReactionsApi.getMine.mockResolvedValue({ data: null });

      renderMemoryDetail();

      await waitFor(() => {
        expect(screen.getByText('Memory not found')).toBeInTheDocument();
      });
    });

    it('should show Go Back button on error', async () => {
      mockMemoriesApi.getById.mockRejectedValue(new Error('Failed'));

      renderMemoryDetail();

      await waitFor(() => {
        expect(screen.getByText('Go Back')).toBeInTheDocument();
      });
    });

    it('should navigate back when Go Back clicked', async () => {
      const user = userEvent.setup();
      mockMemoriesApi.getById.mockRejectedValue(new Error('Failed'));

      renderMemoryDetail();

      await waitFor(() => {
        expect(screen.getByText('Go Back')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Go Back'));
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  describe('memory display', () => {
    beforeEach(() => {
      mockReactionsApi.list.mockResolvedValue({ data: [] });
      mockReactionsApi.getMine.mockResolvedValue({ data: null });
    });

    it('should display memory content', async () => {
      mockMemoriesApi.getById.mockResolvedValue({
        data: createMockMemory({ content: 'Our wonderful adventure!' }),
      });

      renderMemoryDetail();

      await waitFor(() => {
        expect(screen.getByText('"Our wonderful adventure!"')).toBeInTheDocument();
      });
    });

    it('should display memory date', async () => {
      mockMemoriesApi.getById.mockResolvedValue({
        data: createMockMemory({ createdAt: '2024-06-15T10:00:00.000Z' }),
      });

      renderMemoryDetail();

      await waitFor(() => {
        expect(screen.getByText('Jun 15, 2024')).toBeInTheDocument();
      });
    });

    it('should display memory mood icon', async () => {
      mockMemoriesApi.getById.mockResolvedValue({
        data: createMockMemory({ mood: 'Happy' }),
      });

      renderMemoryDetail();

      await waitFor(() => {
        expect(screen.getByText('sentiment_very_satisfied')).toBeInTheDocument();
      });
    });

    it('should display mood tag', async () => {
      mockMemoriesApi.getById.mockResolvedValue({
        data: createMockMemory({ mood: 'Excited' }),
      });

      renderMemoryDetail();

      await waitFor(() => {
        expect(screen.getByText('Excited')).toBeInTheDocument();
      });
    });

    it('should display photos when available', async () => {
      mockMemoriesApi.getById.mockResolvedValue({
        data: createMockMemory({
          photos: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
        }),
      });

      renderMemoryDetail();

      await waitFor(() => {
        const images = document.querySelectorAll('img');
        expect(images.length).toBe(2);
      });
    });

    it('should display location when available', async () => {
      mockMemoriesApi.getById.mockResolvedValue({
        data: createMockMemory({
          location: { name: 'Central Park', address: 'New York' },
        }),
      });

      renderMemoryDetail();

      await waitFor(() => {
        expect(screen.getByText('Central Park')).toBeInTheDocument();
      });
    });

    it('should display voice note indicator when available', async () => {
      mockMemoriesApi.getById.mockResolvedValue({
        data: createMockMemory({ voiceNote: 'https://example.com/voice.mp3' }),
      });

      renderMemoryDetail();

      await waitFor(() => {
        expect(screen.getByText('Voice Note')).toBeInTheDocument();
      });
    });
  });

  describe('reactions', () => {
    beforeEach(() => {
      mockMemoriesApi.getById.mockResolvedValue({ data: createMockMemory() });
    });

    it('should display like count', async () => {
      mockReactionsApi.list.mockResolvedValue({ data: [{ id: '1' }, { id: '2' }] });
      mockReactionsApi.getMine.mockResolvedValue({ data: null });

      renderMemoryDetail();

      await waitFor(() => {
        expect(screen.getByText('2 Loves')).toBeInTheDocument();
      });
    });

    it('should display "Love this" when no likes', async () => {
      mockReactionsApi.list.mockResolvedValue({ data: [] });
      mockReactionsApi.getMine.mockResolvedValue({ data: null });

      renderMemoryDetail();

      await waitFor(() => {
        expect(screen.getByText('Love this')).toBeInTheDocument();
      });
    });

    it('should display "1 Love" for single like', async () => {
      mockReactionsApi.list.mockResolvedValue({ data: [{ id: '1' }] });
      mockReactionsApi.getMine.mockResolvedValue({ data: null });

      renderMemoryDetail();

      await waitFor(() => {
        expect(screen.getByText('1 Love')).toBeInTheDocument();
      });
    });

    it('should toggle like when button clicked', async () => {
      const user = userEvent.setup();
      mockReactionsApi.list.mockResolvedValue({ data: [] });
      mockReactionsApi.getMine.mockResolvedValue({ data: null });
      mockReactionsApi.toggle.mockResolvedValue({ action: 'added' });

      renderMemoryDetail();

      await waitFor(() => {
        expect(screen.getByText('Love this')).toBeInTheDocument();
      });

      const likeButton = screen.getByText('Love this').closest('button');
      await user.click(likeButton!);

      expect(mockReactionsApi.toggle).toHaveBeenCalledWith('memory-123');
    });

    it('should update like count after toggling', async () => {
      const user = userEvent.setup();
      mockReactionsApi.list.mockResolvedValue({ data: [] });
      mockReactionsApi.getMine.mockResolvedValue({ data: null });
      mockReactionsApi.toggle.mockResolvedValue({ action: 'added' });

      renderMemoryDetail();

      await waitFor(() => {
        expect(screen.getByText('Love this')).toBeInTheDocument();
      });

      const likeButton = screen.getByText('Love this').closest('button');
      await user.click(likeButton!);

      await waitFor(() => {
        expect(screen.getByText('1 Love')).toBeInTheDocument();
      });
    });
  });

  describe('navigation', () => {
    beforeEach(() => {
      mockMemoriesApi.getById.mockResolvedValue({ data: createMockMemory() });
      mockReactionsApi.list.mockResolvedValue({ data: [] });
      mockReactionsApi.getMine.mockResolvedValue({ data: null });
    });

    it('should navigate back when back button clicked', async () => {
      const user = userEvent.setup();
      renderMemoryDetail();

      await waitFor(() => {
        expect(screen.getByText('Memory')).toBeInTheDocument();
      });

      const backButton = screen.getByText('arrow_back').closest('button');
      await user.click(backButton!);

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  describe('own memory actions', () => {
    beforeEach(() => {
      localStorage.setItem('auth_token', 'valid-token');
      mockAuthApi.getMe.mockResolvedValue({ data: createMockUser() });
      mockSpacesApi.getMy.mockResolvedValue({ data: createMockSpace() });
      mockReactionsApi.list.mockResolvedValue({ data: [] });
      mockReactionsApi.getMine.mockResolvedValue({ data: null });
    });

    it('should show edit button for own memory', async () => {
      mockMemoriesApi.getById.mockResolvedValue({
        data: createMockMemory({ createdBy: 'user-1' }),
      });

      renderMemoryDetail();

      await waitFor(() => {
        expect(screen.getByText('Your Memory')).toBeInTheDocument();
      });

      // Should show floating edit button
      const editButtons = screen.getAllByText('edit');
      expect(editButtons.length).toBeGreaterThan(0);
    });

    it('should navigate to edit page when edit clicked', async () => {
      const user = userEvent.setup();
      mockMemoriesApi.getById.mockResolvedValue({
        data: createMockMemory({ createdBy: 'user-1' }),
      });

      renderMemoryDetail();

      await waitFor(() => {
        expect(screen.getByText('Your Memory')).toBeInTheDocument();
      });

      // Click the floating edit button
      const floatingEditButton = document.querySelector('.absolute.bottom-6 button');
      await user.click(floatingEditButton!);

      expect(mockNavigate).toHaveBeenCalledWith('/memory/memory-123/edit');
    });

    it('should show menu for own memory', async () => {
      const user = userEvent.setup();
      mockMemoriesApi.getById.mockResolvedValue({
        data: createMockMemory({ createdBy: 'user-1' }),
      });

      renderMemoryDetail();

      await waitFor(() => {
        expect(screen.getByText('Your Memory')).toBeInTheDocument();
      });

      // Click menu button
      const menuButton = screen.getByText('more_horiz').closest('button');
      await user.click(menuButton!);

      await waitFor(() => {
        expect(screen.getByText('Edit Memory')).toBeInTheDocument();
        expect(screen.getByText('Delete Memory')).toBeInTheDocument();
      });
    });

    it('should delete memory when confirmed', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      mockMemoriesApi.getById.mockResolvedValue({
        data: createMockMemory({ createdBy: 'user-1' }),
      });
      mockMemoriesApi.delete.mockResolvedValue({});

      renderMemoryDetail();

      await waitFor(() => {
        expect(screen.getByText('Your Memory')).toBeInTheDocument();
      });

      // Open menu
      const menuButton = screen.getByText('more_horiz').closest('button');
      await user.click(menuButton!);

      await waitFor(() => {
        expect(screen.getByText('Delete Memory')).toBeInTheDocument();
      });

      // Click delete
      const deleteButton = screen.getByText('Delete Memory').closest('button');
      await user.click(deleteButton!);

      expect(confirmSpy).toHaveBeenCalled();
      expect(mockMemoriesApi.delete).toHaveBeenCalledWith('memory-123');

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/memories');
      });

      confirmSpy.mockRestore();
    });

    it('should not delete memory when cancelled', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      mockMemoriesApi.getById.mockResolvedValue({
        data: createMockMemory({ createdBy: 'user-1' }),
      });

      renderMemoryDetail();

      await waitFor(() => {
        expect(screen.getByText('Your Memory')).toBeInTheDocument();
      });

      // Open menu
      const menuButton = screen.getByText('more_horiz').closest('button');
      await user.click(menuButton!);

      await waitFor(() => {
        expect(screen.getByText('Delete Memory')).toBeInTheDocument();
      });

      // Click delete
      const deleteButton = screen.getByText('Delete Memory').closest('button');
      await user.click(deleteButton!);

      expect(confirmSpy).toHaveBeenCalled();
      expect(mockMemoriesApi.delete).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });
  });

  describe('partner memory display', () => {
    beforeEach(() => {
      localStorage.setItem('auth_token', 'valid-token');
      mockAuthApi.getMe.mockResolvedValue({ data: createMockUser() });
      mockSpacesApi.getMy.mockResolvedValue({ data: createMockSpace() });
      mockReactionsApi.list.mockResolvedValue({ data: [] });
      mockReactionsApi.getMine.mockResolvedValue({ data: null });
    });

    it('should show partner label for partner memory', async () => {
      mockMemoriesApi.getById.mockResolvedValue({
        data: createMockMemory({ createdBy: 'user-2' }),
      });

      renderMemoryDetail();

      await waitFor(() => {
        expect(screen.getByText("Partner's Memory")).toBeInTheDocument();
      });
    });

    it('should not show edit button for partner memory', async () => {
      mockMemoriesApi.getById.mockResolvedValue({
        data: createMockMemory({ createdBy: 'user-2' }),
      });

      renderMemoryDetail();

      await waitFor(() => {
        expect(screen.getByText("Partner's Memory")).toBeInTheDocument();
      });

      // Should not have floating edit button
      const floatingEditButton = document.querySelector('.absolute.bottom-6 button');
      expect(floatingEditButton).toBeNull();
    });

    it('should not show menu options for partner memory', async () => {
      const user = userEvent.setup();
      mockMemoriesApi.getById.mockResolvedValue({
        data: createMockMemory({ createdBy: 'user-2' }),
      });

      renderMemoryDetail();

      await waitFor(() => {
        expect(screen.getByText("Partner's Memory")).toBeInTheDocument();
      });

      // Click menu button
      const menuButton = screen.getByText('more_horiz').closest('button');
      await user.click(menuButton!);

      // Menu should not appear (or be empty)
      await waitFor(() => {
        expect(screen.queryByText('Edit Memory')).not.toBeInTheDocument();
        expect(screen.queryByText('Delete Memory')).not.toBeInTheDocument();
      });
    });
  });

  describe('day number calculation', () => {
    beforeEach(() => {
      localStorage.setItem('auth_token', 'valid-token');
      mockAuthApi.getMe.mockResolvedValue({ data: createMockUser() });
      mockReactionsApi.list.mockResolvedValue({ data: [] });
      mockReactionsApi.getMine.mockResolvedValue({ data: null });
    });

    it('should display day number when anniversary is set', async () => {
      mockSpacesApi.getMy.mockResolvedValue({
        data: createMockSpace({ anniversaryDate: '2024-01-01' }),
      });
      mockMemoriesApi.getById.mockResolvedValue({
        data: createMockMemory({ createdAt: '2024-01-10T10:00:00.000Z' }),
      });

      renderMemoryDetail();

      await waitFor(() => {
        expect(screen.getByText('Day 10')).toBeInTheDocument();
      });
    });
  });

  describe('word count display', () => {
    beforeEach(() => {
      mockReactionsApi.list.mockResolvedValue({ data: [] });
      mockReactionsApi.getMine.mockResolvedValue({ data: null });
    });

    it('should display word count when available', async () => {
      mockMemoriesApi.getById.mockResolvedValue({
        data: createMockMemory({ wordCount: 42 }),
      });

      renderMemoryDetail();

      await waitFor(() => {
        expect(screen.getByText('42 words')).toBeInTheDocument();
      });
    });
  });
});
