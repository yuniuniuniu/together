import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMilestones } from '@/features/milestone/hooks/useMilestones';
import { milestonesApi } from '@/shared/api/client';

// Mock the API client
vi.mock('@/shared/api/client', () => ({
  milestonesApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockMilestonesApi = vi.mocked(milestonesApi);

describe('useMilestones', () => {
  const mockMilestone = {
    id: 'milestone-1',
    spaceId: 'space-1',
    title: 'Anniversary',
    description: 'First anniversary',
    date: '2024-02-14T00:00:00.000Z',
    type: 'anniversary',
    icon: '💕',
    photos: [],
    createdAt: '2024-01-01T00:00:00.000Z',
    createdBy: 'user-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have empty milestones array initially', () => {
      const { result } = renderHook(() => useMilestones());

      expect(result.current.milestones).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('fetchMilestones / refresh', () => {
    it('should fetch milestones and update state', async () => {
      mockMilestonesApi.list.mockResolvedValue({
        data: [mockMilestone],
      } as any);

      const { result } = renderHook(() => useMilestones());

      await act(async () => {
        await result.current.refresh();
      });

      expect(mockMilestonesApi.list).toHaveBeenCalled();
      expect(result.current.milestones).toHaveLength(1);
      expect(result.current.milestones[0].id).toBe('milestone-1');
      expect(result.current.milestones[0].date).toBeInstanceOf(Date);
      expect(result.current.milestones[0].createdAt).toBeInstanceOf(Date);
      expect(result.current.isLoading).toBe(false);
    });

    it('should set loading state during fetch', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockMilestonesApi.list.mockReturnValue(promise as any);

      const { result } = renderHook(() => useMilestones());

      act(() => {
        result.current.refresh();
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise!({ data: [] });
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should handle fetch error', async () => {
      const networkError = new Error('Network error');
      mockMilestonesApi.list.mockRejectedValue(networkError);

      const { result } = renderHook(() => useMilestones());

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
      mockMilestonesApi.list.mockRejectedValue('string error');

      const { result } = renderHook(() => useMilestones());

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

  describe('addMilestone', () => {
    it('should add milestone and sort by date', async () => {
      const newMilestone = {
        ...mockMilestone,
        id: 'new-milestone',
        title: 'New Event',
        date: '2024-03-01T00:00:00.000Z',
      };

      mockMilestonesApi.create.mockResolvedValue({
        data: newMilestone,
      } as any);

      const { result } = renderHook(() => useMilestones());

      const input = {
        title: 'New Event',
        date: '2024-03-01',
        type: 'event',
      };

      let addedMilestone: any;
      await act(async () => {
        addedMilestone = await result.current.addMilestone(input);
      });

      expect(mockMilestonesApi.create).toHaveBeenCalledWith(input);
      expect(addedMilestone.id).toBe('new-milestone');
      expect(result.current.milestones).toHaveLength(1);
    });

    it('should sort milestones by date after adding', async () => {
      const earlierMilestone = {
        ...mockMilestone,
        id: 'earlier',
        date: '2024-01-01T00:00:00.000Z',
      };
      const laterMilestone = {
        ...mockMilestone,
        id: 'later',
        date: '2024-12-01T00:00:00.000Z',
      };

      mockMilestonesApi.list.mockResolvedValue({
        data: [laterMilestone],
      } as any);
      mockMilestonesApi.create.mockResolvedValue({
        data: earlierMilestone,
      } as any);

      const { result } = renderHook(() => useMilestones());

      await act(async () => {
        await result.current.refresh();
      });

      await act(async () => {
        await result.current.addMilestone({
          title: 'Earlier',
          date: '2024-01-01',
          type: 'event',
        });
      });

      expect(result.current.milestones[0].id).toBe('earlier');
      expect(result.current.milestones[1].id).toBe('later');
    });

    it('should convert date and createdAt to Date objects', async () => {
      mockMilestonesApi.create.mockResolvedValue({
        data: mockMilestone,
      } as any);

      const { result } = renderHook(() => useMilestones());

      await act(async () => {
        await result.current.addMilestone({
          title: 'Test',
          date: '2024-02-14',
          type: 'anniversary',
        });
      });

      expect(result.current.milestones[0].date).toBeInstanceOf(Date);
      expect(result.current.milestones[0].createdAt).toBeInstanceOf(Date);
    });
  });

  describe('removeMilestone', () => {
    it('should remove milestone from list', async () => {
      mockMilestonesApi.list.mockResolvedValue({
        data: [mockMilestone],
      } as any);
      mockMilestonesApi.delete.mockResolvedValue({} as any);

      const { result } = renderHook(() => useMilestones());

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.milestones).toHaveLength(1);

      await act(async () => {
        await result.current.removeMilestone('milestone-1');
      });

      expect(mockMilestonesApi.delete).toHaveBeenCalledWith('milestone-1');
      expect(result.current.milestones).toHaveLength(0);
    });

    it('should not affect other milestones', async () => {
      const milestone2 = { ...mockMilestone, id: 'milestone-2' };
      mockMilestonesApi.list.mockResolvedValue({
        data: [mockMilestone, milestone2],
      } as any);
      mockMilestonesApi.delete.mockResolvedValue({} as any);

      const { result } = renderHook(() => useMilestones());

      await act(async () => {
        await result.current.refresh();
      });

      await act(async () => {
        await result.current.removeMilestone('milestone-1');
      });

      expect(result.current.milestones).toHaveLength(1);
      expect(result.current.milestones[0].id).toBe('milestone-2');
    });
  });

  describe('updateMilestone', () => {
    it('should update milestone in list', async () => {
      const updatedMilestone = {
        ...mockMilestone,
        title: 'Updated Title',
      };

      mockMilestonesApi.list.mockResolvedValue({
        data: [mockMilestone],
      } as any);
      mockMilestonesApi.update.mockResolvedValue({
        data: updatedMilestone,
      } as any);

      const { result } = renderHook(() => useMilestones());

      await act(async () => {
        await result.current.refresh();
      });

      let updated: any;
      await act(async () => {
        updated = await result.current.updateMilestone('milestone-1', {
          title: 'Updated Title',
        });
      });

      expect(mockMilestonesApi.update).toHaveBeenCalledWith('milestone-1', {
        title: 'Updated Title',
      });
      expect(updated.title).toBe('Updated Title');
      expect(result.current.milestones[0].title).toBe('Updated Title');
    });

    it('should re-sort after updating date', async () => {
      const milestone1 = {
        ...mockMilestone,
        id: 'milestone-1',
        date: '2024-01-01T00:00:00.000Z',
      };
      const milestone2 = {
        ...mockMilestone,
        id: 'milestone-2',
        date: '2024-06-01T00:00:00.000Z',
      };
      const updatedMilestone1 = {
        ...milestone1,
        date: '2024-12-01T00:00:00.000Z',
      };

      mockMilestonesApi.list.mockResolvedValue({
        data: [milestone1, milestone2],
      } as any);
      mockMilestonesApi.update.mockResolvedValue({
        data: updatedMilestone1,
      } as any);

      const { result } = renderHook(() => useMilestones());

      await act(async () => {
        await result.current.refresh();
      });

      // Initially milestone-1 should be first (earlier date)
      expect(result.current.milestones[0].id).toBe('milestone-1');

      await act(async () => {
        await result.current.updateMilestone('milestone-1', {
          date: '2024-12-01',
        });
      });

      // After update, milestone-2 should be first (earlier date now)
      expect(result.current.milestones[0].id).toBe('milestone-2');
      expect(result.current.milestones[1].id).toBe('milestone-1');
    });

    it('should preserve other milestones when updating', async () => {
      const milestone2 = {
        ...mockMilestone,
        id: 'milestone-2',
        title: 'Milestone 2',
        date: '2024-06-01T00:00:00.000Z',
      };
      const updatedMilestone = { ...mockMilestone, title: 'Updated' };

      mockMilestonesApi.list.mockResolvedValue({
        data: [mockMilestone, milestone2],
      } as any);
      mockMilestonesApi.update.mockResolvedValue({
        data: updatedMilestone,
      } as any);

      const { result } = renderHook(() => useMilestones());

      await act(async () => {
        await result.current.refresh();
      });

      await act(async () => {
        await result.current.updateMilestone('milestone-1', { title: 'Updated' });
      });

      expect(result.current.milestones).toHaveLength(2);
      expect(result.current.milestones[0].title).toBe('Updated');
      expect(result.current.milestones[1].title).toBe('Milestone 2');
    });
  });
});
