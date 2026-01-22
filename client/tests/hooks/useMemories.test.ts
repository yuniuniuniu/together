import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMemories } from '@/features/memory/hooks/useMemories';
import { memoriesApi } from '@/shared/api/client';

// Mock the API client
vi.mock('@/shared/api/client', () => ({
  memoriesApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockMemoriesApi = vi.mocked(memoriesApi);

describe('useMemories', () => {
  const mockMemory = {
    id: 'memory-1',
    spaceId: 'space-1',
    content: 'Test memory',
    mood: 'Happy',
    photos: ['photo1.jpg'],
    location: null,
    voiceNote: null,
    stickers: [],
    createdAt: '2024-01-15T10:30:00.000Z',
    createdBy: 'user-1',
    wordCount: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have empty memories array initially', () => {
      const { result } = renderHook(() => useMemories());

      expect(result.current.memories).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.hasMore).toBe(false);
      expect(result.current.total).toBe(0);
    });
  });

  describe('fetchMemories / refresh', () => {
    it('should fetch memories and update state', async () => {
      mockMemoriesApi.list.mockResolvedValue({
        data: {
          data: [mockMemory],
          hasMore: true,
          total: 10,
        },
      } as any);

      const { result } = renderHook(() => useMemories());

      await act(async () => {
        await result.current.refresh();
      });

      expect(mockMemoriesApi.list).toHaveBeenCalledWith(1, 20);
      expect(result.current.memories).toHaveLength(1);
      expect(result.current.memories[0].id).toBe('memory-1');
      expect(result.current.memories[0].createdAt).toBeInstanceOf(Date);
      expect(result.current.hasMore).toBe(true);
      expect(result.current.total).toBe(10);
      expect(result.current.isLoading).toBe(false);
    });

    it('should set loading state during fetch', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockMemoriesApi.list.mockReturnValue(promise as any);

      const { result } = renderHook(() => useMemories());

      act(() => {
        result.current.refresh();
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise!({
          data: { data: [], hasMore: false, total: 0 },
        });
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should handle fetch error', async () => {
      const networkError = new Error('Network error');
      mockMemoriesApi.list.mockRejectedValue(networkError);

      const { result } = renderHook(() => useMemories());

      // The hook catches the error, sets state, then re-throws
      // We verify by checking that it throws and that loading is reset
      let caughtError: Error | undefined;
      await act(async () => {
        try {
          await result.current.refresh();
        } catch (err) {
          caughtError = err as Error;
        }
      });

      // Verify the error was thrown
      expect(caughtError).toBe(networkError);
      // Verify loading state is reset after error
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle non-Error thrown values', async () => {
      mockMemoriesApi.list.mockRejectedValue('string error');

      const { result } = renderHook(() => useMemories());

      let caughtError: unknown;
      await act(async () => {
        try {
          await result.current.refresh();
        } catch (err) {
          caughtError = err;
        }
      });

      // Verify the original error was re-thrown
      expect(caughtError).toBe('string error');
      // Loading should be reset
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('loadMore', () => {
    it('should append memories when loading more pages', async () => {
      const memory2 = { ...mockMemory, id: 'memory-2' };

      mockMemoriesApi.list
        .mockResolvedValueOnce({
          data: { data: [mockMemory], hasMore: true, total: 2 },
        } as any)
        .mockResolvedValueOnce({
          data: { data: [memory2], hasMore: false, total: 2 },
        } as any);

      const { result } = renderHook(() => useMemories());

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.memories).toHaveLength(1);

      await act(async () => {
        await result.current.loadMore(2);
      });

      expect(result.current.memories).toHaveLength(2);
      expect(result.current.memories[0].id).toBe('memory-1');
      expect(result.current.memories[1].id).toBe('memory-2');
    });

    it('should replace memories when loading page 1', async () => {
      const memory2 = { ...mockMemory, id: 'memory-2' };

      mockMemoriesApi.list
        .mockResolvedValueOnce({
          data: { data: [mockMemory], hasMore: false, total: 1 },
        } as any)
        .mockResolvedValueOnce({
          data: { data: [memory2], hasMore: false, total: 1 },
        } as any);

      const { result } = renderHook(() => useMemories());

      await act(async () => {
        await result.current.refresh();
      });

      await act(async () => {
        await result.current.loadMore(1);
      });

      expect(result.current.memories).toHaveLength(1);
      expect(result.current.memories[0].id).toBe('memory-2');
    });
  });

  describe('addMemory', () => {
    it('should add memory and prepend to list', async () => {
      const newMemory = {
        ...mockMemory,
        id: 'new-memory',
        content: 'New memory',
      };

      mockMemoriesApi.create.mockResolvedValue({
        data: newMemory,
      } as any);

      const { result } = renderHook(() => useMemories());

      const input = {
        content: 'New memory',
        mood: 'Happy',
        photos: ['photo1.jpg'],
      };

      let addedMemory: any;
      await act(async () => {
        addedMemory = await result.current.addMemory(input);
      });

      expect(mockMemoriesApi.create).toHaveBeenCalledWith(input);
      expect(addedMemory.id).toBe('new-memory');
      expect(result.current.memories[0].id).toBe('new-memory');
      expect(result.current.total).toBe(1);
    });

    it('should convert createdAt to Date', async () => {
      mockMemoriesApi.create.mockResolvedValue({
        data: mockMemory,
      } as any);

      const { result } = renderHook(() => useMemories());

      await act(async () => {
        await result.current.addMemory({ content: 'Test' });
      });

      expect(result.current.memories[0].createdAt).toBeInstanceOf(Date);
    });
  });

  describe('removeMemory', () => {
    it('should remove memory from list', async () => {
      mockMemoriesApi.list.mockResolvedValue({
        data: { data: [mockMemory], hasMore: false, total: 1 },
      } as any);
      mockMemoriesApi.delete.mockResolvedValue({} as any);

      const { result } = renderHook(() => useMemories());

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.memories).toHaveLength(1);
      expect(result.current.total).toBe(1);

      await act(async () => {
        await result.current.removeMemory('memory-1');
      });

      expect(mockMemoriesApi.delete).toHaveBeenCalledWith('memory-1');
      expect(result.current.memories).toHaveLength(0);
      expect(result.current.total).toBe(0);
    });

    it('should not affect other memories', async () => {
      const memory2 = { ...mockMemory, id: 'memory-2' };
      mockMemoriesApi.list.mockResolvedValue({
        data: { data: [mockMemory, memory2], hasMore: false, total: 2 },
      } as any);
      mockMemoriesApi.delete.mockResolvedValue({} as any);

      const { result } = renderHook(() => useMemories());

      await act(async () => {
        await result.current.refresh();
      });

      await act(async () => {
        await result.current.removeMemory('memory-1');
      });

      expect(result.current.memories).toHaveLength(1);
      expect(result.current.memories[0].id).toBe('memory-2');
    });
  });

  describe('updateMemory', () => {
    it('should update memory in list', async () => {
      const updatedMemory = { ...mockMemory, content: 'Updated content' };

      mockMemoriesApi.list.mockResolvedValue({
        data: { data: [mockMemory], hasMore: false, total: 1 },
      } as any);
      mockMemoriesApi.update.mockResolvedValue({
        data: updatedMemory,
      } as any);

      const { result } = renderHook(() => useMemories());

      await act(async () => {
        await result.current.refresh();
      });

      let updated: any;
      await act(async () => {
        updated = await result.current.updateMemory('memory-1', {
          content: 'Updated content',
        });
      });

      expect(mockMemoriesApi.update).toHaveBeenCalledWith('memory-1', {
        content: 'Updated content',
      });
      expect(updated.content).toBe('Updated content');
      expect(result.current.memories[0].content).toBe('Updated content');
    });

    it('should preserve other memories when updating', async () => {
      const memory2 = { ...mockMemory, id: 'memory-2', content: 'Memory 2' };
      const updatedMemory = { ...mockMemory, content: 'Updated' };

      mockMemoriesApi.list.mockResolvedValue({
        data: { data: [mockMemory, memory2], hasMore: false, total: 2 },
      } as any);
      mockMemoriesApi.update.mockResolvedValue({
        data: updatedMemory,
      } as any);

      const { result } = renderHook(() => useMemories());

      await act(async () => {
        await result.current.refresh();
      });

      await act(async () => {
        await result.current.updateMemory('memory-1', { content: 'Updated' });
      });

      expect(result.current.memories).toHaveLength(2);
      expect(result.current.memories[0].content).toBe('Updated');
      expect(result.current.memories[1].content).toBe('Memory 2');
    });
  });
});
