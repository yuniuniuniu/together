import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import MemoryTimeline from '../../pages/MemoryTimeline';
import { AuthProvider } from '../../shared/context/AuthContext';
import { ToastProvider } from '../../shared/components/feedback/Toast';
import * as client from '../../shared/api/client';

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the API client
vi.mock('../../shared/api/client', () => ({
  memoriesApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  reactionsApi: {
    list: vi.fn(),
    toggle: vi.fn(),
    getMine: vi.fn(),
  },
  authApi: {
    getMe: vi.fn(),
    sendCode: vi.fn(),
    verify: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

const mockMemoriesApi = client.memoriesApi as {
  list: ReturnType<typeof vi.fn>;
};

const mockReactionsApi = client.reactionsApi as {
  list: ReturnType<typeof vi.fn>;
  toggle: ReturnType<typeof vi.fn>;
  getMine: ReturnType<typeof vi.fn>;
};

const mockAuthApi = client.authApi as {
  getMe: ReturnType<typeof vi.fn>;
};

const createMockMemory = (overrides = {}) => ({
  id: 'memory-1',
  spaceId: 'space-1',
  content: 'A beautiful day together',
  mood: 'Happy',
  photos: [],
  stickers: [],
  createdAt: new Date().toISOString(),
  createdBy: 'user-1',
  ...overrides,
});

const renderMemoryTimeline = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <MemoryTimeline />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('MemoryTimeline Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockAuthApi.getMe.mockRejectedValue(new Error('No token'));
    mockReactionsApi.list.mockResolvedValue({ data: [] });
    mockReactionsApi.getMine.mockResolvedValue({ data: null });
  });

  describe('loading state', () => {
    it('should show loading spinner while fetching memories', async () => {
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockMemoriesApi.list.mockReturnValue(pendingPromise);

      renderMemoryTimeline();

      expect(screen.getByText('Loading memories...')).toBeInTheDocument();

      // Cleanup
      resolvePromise!({ data: { data: [] } });
    });
  });

  describe('empty state', () => {
    it('should show empty state when no memories', async () => {
      mockMemoriesApi.list.mockResolvedValue({
        data: { data: [], total: 0, page: 1, pageSize: 20, hasMore: false },
      });

      renderMemoryTimeline();

      await waitFor(() => {
        expect(screen.getByText("Our story hasn't started yet")).toBeInTheDocument();
      });

      expect(screen.getByText('Create Story')).toBeInTheDocument();
    });

    it('should navigate to record type on create button click', async () => {
      const user = userEvent.setup();
      mockMemoriesApi.list.mockResolvedValue({
        data: { data: [], total: 0, page: 1, pageSize: 20, hasMore: false },
      });

      renderMemoryTimeline();

      await waitFor(() => {
        expect(screen.getByText('Create Story')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Create Story').closest('button');
      await user.click(createButton!);

      expect(mockNavigate).toHaveBeenCalledWith('/record-type');
    });
  });

  describe('memories display', () => {
    it('should display memories when loaded', async () => {
      const mockMemory = createMockMemory({
        content: 'Our first date was amazing!',
        mood: 'Excited',
      });
      mockMemoriesApi.list.mockResolvedValue({
        data: { data: [mockMemory], total: 1, page: 1, pageSize: 20, hasMore: false },
      });

      renderMemoryTimeline();

      await waitFor(() => {
        expect(screen.getByText('"Our first date was amazing!"')).toBeInTheDocument();
      });
    });

    it('should display memory count', async () => {
      const memories = [
        createMockMemory({ id: 'mem-1', content: 'Memory 1' }),
        createMockMemory({ id: 'mem-2', content: 'Memory 2' }),
      ];
      mockMemoriesApi.list.mockResolvedValue({
        data: { data: memories, total: 2, page: 1, pageSize: 20, hasMore: false },
      });

      renderMemoryTimeline();

      await waitFor(() => {
        expect(screen.getByText('2 Memories Collected')).toBeInTheDocument();
      });
    });

    it('should display "1 Memory" for single memory', async () => {
      mockMemoriesApi.list.mockResolvedValue({
        data: { data: [createMockMemory()], total: 1, page: 1, pageSize: 20, hasMore: false },
      });

      renderMemoryTimeline();

      await waitFor(() => {
        expect(screen.getByText('1 Memory Collected')).toBeInTheDocument();
      });
    });

    it('should display mood in memory card', async () => {
      const mockMemory = createMockMemory({ mood: 'Happy' });
      mockMemoriesApi.list.mockResolvedValue({
        data: { data: [mockMemory], total: 1, page: 1, pageSize: 20, hasMore: false },
      });

      renderMemoryTimeline();

      await waitFor(() => {
        expect(screen.getByText(/Happy/)).toBeInTheDocument();
      });
    });

    it('should display memory photo when present', async () => {
      const mockMemory = createMockMemory({
        photos: ['https://example.com/photo.jpg'],
      });
      mockMemoriesApi.list.mockResolvedValue({
        data: { data: [mockMemory], total: 1, page: 1, pageSize: 20, hasMore: false },
      });

      renderMemoryTimeline();

      await waitFor(() => {
        const img = screen.getByAltText('Memory');
        expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
      });
    });

    it('should navigate to memory detail on card click', async () => {
      const user = userEvent.setup();
      const mockMemory = createMockMemory({ id: 'mem-123' });
      mockMemoriesApi.list.mockResolvedValue({
        data: { data: [mockMemory], total: 1, page: 1, pageSize: 20, hasMore: false },
      });

      renderMemoryTimeline();

      await waitFor(() => {
        expect(screen.getByText(`"${mockMemory.content}"`)).toBeInTheDocument();
      });

      const memoryCard = screen.getByText(`"${mockMemory.content}"`).closest('div[class*="cursor-pointer"]');
      await user.click(memoryCard!);

      expect(mockNavigate).toHaveBeenCalledWith('/memory/mem-123');
    });
  });

  describe('error state', () => {
    it('should show error message on API failure', async () => {
      mockMemoriesApi.list.mockRejectedValue(new Error('Failed to load memories'));

      renderMemoryTimeline();

      await waitFor(() => {
        expect(screen.getByText('Failed to load memories')).toBeInTheDocument();
      });
    });
  });

  describe('like functionality', () => {
    it('should display like count when reactions exist', async () => {
      const mockMemory = createMockMemory({ id: 'mem-1' });
      mockMemoriesApi.list.mockResolvedValue({
        data: { data: [mockMemory], total: 1, page: 1, pageSize: 20, hasMore: false },
      });
      mockReactionsApi.list.mockResolvedValue({
        data: [{ id: 'r-1', type: 'love', userId: 'user-2' }],
      });
      mockReactionsApi.getMine.mockResolvedValue({ data: null });

      renderMemoryTimeline();

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    });

    it('should show filled heart when user has liked', async () => {
      const mockMemory = createMockMemory({ id: 'mem-1' });
      mockMemoriesApi.list.mockResolvedValue({
        data: { data: [mockMemory], total: 1, page: 1, pageSize: 20, hasMore: false },
      });
      mockReactionsApi.list.mockResolvedValue({
        data: [{ id: 'r-1', type: 'love', userId: 'user-1' }],
      });
      mockReactionsApi.getMine.mockResolvedValue({
        data: { id: 'r-1', type: 'love' },
      });

      renderMemoryTimeline();

      await waitFor(() => {
        // Check for heart button with active class
        const heartButtons = screen.getAllByText('favorite');
        const likeButton = heartButtons.find(el => el.closest('button'));
        expect(likeButton?.closest('button')).toHaveClass('text-wine');
      });
    });

    it('should toggle like on click', async () => {
      const user = userEvent.setup();
      const mockMemory = createMockMemory({ id: 'mem-1' });
      mockMemoriesApi.list.mockResolvedValue({
        data: { data: [mockMemory], total: 1, page: 1, pageSize: 20, hasMore: false },
      });
      mockReactionsApi.list.mockResolvedValue({ data: [] });
      mockReactionsApi.getMine.mockResolvedValue({ data: null });
      mockReactionsApi.toggle.mockResolvedValue({ action: 'added', data: { id: 'r-1' } });

      renderMemoryTimeline();

      await waitFor(() => {
        expect(screen.getByText(`"${mockMemory.content}"`)).toBeInTheDocument();
      });

      // Find and click the like button
      const heartIcons = screen.getAllByText('favorite');
      const likeButton = heartIcons.find(el => el.closest('button'))?.closest('button');
      await user.click(likeButton!);

      expect(mockReactionsApi.toggle).toHaveBeenCalledWith('mem-1');
    });

    it('should update like count after toggling', async () => {
      const user = userEvent.setup();
      const mockMemory = createMockMemory({ id: 'mem-1' });
      mockMemoriesApi.list.mockResolvedValue({
        data: { data: [mockMemory], total: 1, page: 1, pageSize: 20, hasMore: false },
      });
      mockReactionsApi.list.mockResolvedValue({ data: [] });
      mockReactionsApi.getMine.mockResolvedValue({ data: null });
      mockReactionsApi.toggle.mockResolvedValue({ action: 'added', data: { id: 'r-1' } });

      renderMemoryTimeline();

      await waitFor(() => {
        expect(screen.getByText(`"${mockMemory.content}"`)).toBeInTheDocument();
      });

      // Find and click the like button
      const heartIcons = screen.getAllByText('favorite');
      const likeButton = heartIcons.find(el => el.closest('button'))?.closest('button');
      await user.click(likeButton!);

      // After clicking, count should appear
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    });
  });

  describe('navigation', () => {
    it('should render navigation tabs', async () => {
      mockMemoriesApi.list.mockResolvedValue({
        data: { data: [], total: 0, page: 1, pageSize: 20, hasMore: false },
      });

      renderMemoryTimeline();

      await waitFor(() => {
        expect(screen.getByText('Timeline')).toBeInTheDocument();
        expect(screen.getByText('Map')).toBeInTheDocument();
      });
    });

    it('should navigate to map view', async () => {
      const user = userEvent.setup();
      mockMemoriesApi.list.mockResolvedValue({
        data: { data: [], total: 0, page: 1, pageSize: 20, hasMore: false },
      });

      renderMemoryTimeline();

      await waitFor(() => {
        expect(screen.getByText('Map')).toBeInTheDocument();
      });

      const mapButton = screen.getByText('Map').closest('button');
      await user.click(mapButton!);

      expect(mockNavigate).toHaveBeenCalledWith('/memory/map');
    });

    it('should navigate to dashboard from bottom nav', async () => {
      const user = userEvent.setup();
      mockMemoriesApi.list.mockResolvedValue({
        data: { data: [], total: 0, page: 1, pageSize: 20, hasMore: false },
      });

      renderMemoryTimeline();

      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
      });

      const homeButton = screen.getByText('Home').closest('button');
      await user.click(homeButton!);

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('should navigate to settings from bottom nav', async () => {
      const user = userEvent.setup();
      mockMemoriesApi.list.mockResolvedValue({
        data: { data: [], total: 0, page: 1, pageSize: 20, hasMore: false },
      });

      renderMemoryTimeline();

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      const settingsButton = screen.getByText('Settings').closest('button');
      await user.click(settingsButton!);

      expect(mockNavigate).toHaveBeenCalledWith('/settings');
    });
  });

  describe('FAB button', () => {
    it('should show FAB when memories exist', async () => {
      mockMemoriesApi.list.mockResolvedValue({
        data: { data: [createMockMemory()], total: 1, page: 1, pageSize: 20, hasMore: false },
      });

      renderMemoryTimeline();

      await waitFor(() => {
        // FAB has edit icon
        const editIcons = screen.getAllByText('edit');
        expect(editIcons.length).toBeGreaterThan(0);
      });
    });

    it('should navigate to record type on FAB click', async () => {
      const user = userEvent.setup();
      mockMemoriesApi.list.mockResolvedValue({
        data: { data: [createMockMemory()], total: 1, page: 1, pageSize: 20, hasMore: false },
      });

      renderMemoryTimeline();

      await waitFor(() => {
        const editIcons = screen.getAllByText('edit');
        expect(editIcons.length).toBeGreaterThan(0);
      });

      // Find FAB button
      const fabButton = screen.getByText('edit').closest('button');
      await user.click(fabButton!);

      expect(mockNavigate).toHaveBeenCalledWith('/record-type');
    });
  });

  describe('date formatting', () => {
    it('should display "Today" for today\'s memories', async () => {
      const todayMemory = createMockMemory({
        createdAt: new Date().toISOString(),
      });
      mockMemoriesApi.list.mockResolvedValue({
        data: { data: [todayMemory], total: 1, page: 1, pageSize: 20, hasMore: false },
      });

      renderMemoryTimeline();

      await waitFor(() => {
        expect(screen.getByText('Today')).toBeInTheDocument();
      });
    });

    it('should display "Yesterday" for yesterday\'s memories', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayMemory = createMockMemory({
        createdAt: yesterday.toISOString(),
      });
      mockMemoriesApi.list.mockResolvedValue({
        data: { data: [yesterdayMemory], total: 1, page: 1, pageSize: 20, hasMore: false },
      });

      renderMemoryTimeline();

      await waitFor(() => {
        expect(screen.getByText('Yesterday')).toBeInTheDocument();
      });
    });
  });

  describe('indicators', () => {
    it('should show voice note indicator when present', async () => {
      const mockMemory = createMockMemory({
        voiceNote: 'voice-note-url',
      });
      mockMemoriesApi.list.mockResolvedValue({
        data: { data: [mockMemory], total: 1, page: 1, pageSize: 20, hasMore: false },
      });

      renderMemoryTimeline();

      await waitFor(() => {
        const micIcons = screen.getAllByText('mic');
        expect(micIcons.length).toBeGreaterThan(0);
      });
    });

    it('should show location indicator when present', async () => {
      const mockMemory = createMockMemory({
        location: { name: 'Coffee Shop' },
      });
      mockMemoriesApi.list.mockResolvedValue({
        data: { data: [mockMemory], total: 1, page: 1, pageSize: 20, hasMore: false },
      });

      renderMemoryTimeline();

      await waitFor(() => {
        const locationIcons = screen.getAllByText('location_on');
        expect(locationIcons.length).toBeGreaterThan(0);
      });
    });
  });
});
