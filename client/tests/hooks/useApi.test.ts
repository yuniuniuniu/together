import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useApi, useMutation } from '@/shared/hooks/useApi';

describe('useApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const fetcher = vi.fn();
      const { result } = renderHook(() => useApi(fetcher));

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('execute', () => {
    it('should fetch data successfully', async () => {
      const mockData = { id: 1, name: 'Test' };
      const fetcher = vi.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() => useApi(fetcher));

      let returnedData: any;
      await act(async () => {
        returnedData = await result.current.execute();
      });

      expect(fetcher).toHaveBeenCalled();
      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(returnedData).toEqual(mockData);
    });

    it('should set loading state during fetch', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      const fetcher = vi.fn().mockReturnValue(promise);
      const { result } = renderHook(() => useApi(fetcher));

      act(() => {
        result.current.execute();
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise!({ data: 'test' });
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should handle fetch error', async () => {
      const error = new Error('Network error');
      const fetcher = vi.fn().mockRejectedValue(error);

      const { result } = renderHook(() => useApi(fetcher));

      let returnedData: any;
      await act(async () => {
        returnedData = await result.current.execute();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toEqual(error);
      expect(result.current.isLoading).toBe(false);
      expect(returnedData).toBeNull();
    });

    it('should convert non-Error to Error', async () => {
      const fetcher = vi.fn().mockRejectedValue('string error');

      const { result } = renderHook(() => useApi(fetcher));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('string error');
    });

    it('should call onSuccess callback', async () => {
      const mockData = { id: 1 };
      const fetcher = vi.fn().mockResolvedValue(mockData);
      const onSuccess = vi.fn();

      const { result } = renderHook(() =>
        useApi(fetcher, { onSuccess })
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(onSuccess).toHaveBeenCalledWith(mockData);
    });

    it('should call onError callback', async () => {
      const error = new Error('Test error');
      const fetcher = vi.fn().mockRejectedValue(error);
      const onError = vi.fn();

      const { result } = renderHook(() =>
        useApi(fetcher, { onError })
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(onError).toHaveBeenCalledWith(error);
    });

    it('should clear previous error on new execute', async () => {
      const fetcher = vi.fn()
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce({ data: 'success' });

      const { result } = renderHook(() => useApi(fetcher));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.error).not.toBeNull();

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.data).toEqual({ data: 'success' });
    });
  });

  describe('reset', () => {
    it('should reset state to initial values', async () => {
      const mockData = { id: 1 };
      const fetcher = vi.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() => useApi(fetcher));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toEqual(mockData);

      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('setData', () => {
    it('should manually set data', () => {
      const fetcher = vi.fn();
      const { result } = renderHook(() => useApi<{ id: number }>(fetcher));

      act(() => {
        result.current.setData({ id: 42 });
      });

      expect(result.current.data).toEqual({ id: 42 });
    });

    it('should set data to null', async () => {
      const fetcher = vi.fn().mockResolvedValue({ id: 1 });
      const { result } = renderHook(() => useApi(fetcher));

      await act(async () => {
        await result.current.execute();
      });

      act(() => {
        result.current.setData(null);
      });

      expect(result.current.data).toBeNull();
    });
  });
});

describe('useMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const mutator = vi.fn();
      const { result } = renderHook(() => useMutation(mutator));

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('mutate', () => {
    it('should mutate data successfully', async () => {
      const mockResponse = { id: 1, created: true };
      const mutator = vi.fn().mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useMutation(mutator));

      let returnedData: any;
      await act(async () => {
        returnedData = await result.current.mutate({ name: 'test' });
      });

      expect(mutator).toHaveBeenCalledWith({ name: 'test' });
      expect(result.current.data).toEqual(mockResponse);
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(returnedData).toEqual(mockResponse);
    });

    it('should set loading state during mutation', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      const mutator = vi.fn().mockReturnValue(promise);
      const { result } = renderHook(() => useMutation(mutator));

      act(() => {
        result.current.mutate(undefined);
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise!({ success: true });
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should handle mutation error', async () => {
      const error = new Error('Mutation failed');
      const mutator = vi.fn().mockRejectedValue(error);

      const { result } = renderHook(() => useMutation(mutator));

      let returnedData: any;
      await act(async () => {
        returnedData = await result.current.mutate({});
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toEqual(error);
      expect(result.current.isLoading).toBe(false);
      expect(returnedData).toBeNull();
    });

    it('should convert non-Error to Error', async () => {
      const mutator = vi.fn().mockRejectedValue('string error');

      const { result } = renderHook(() => useMutation(mutator));

      await act(async () => {
        await result.current.mutate({});
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('string error');
    });

    it('should call onSuccess callback', async () => {
      const mockResponse = { id: 1 };
      const mutator = vi.fn().mockResolvedValue(mockResponse);
      const onSuccess = vi.fn();

      const { result } = renderHook(() =>
        useMutation(mutator, { onSuccess })
      );

      await act(async () => {
        await result.current.mutate({});
      });

      expect(onSuccess).toHaveBeenCalledWith(mockResponse);
    });

    it('should call onError callback', async () => {
      const error = new Error('Test error');
      const mutator = vi.fn().mockRejectedValue(error);
      const onError = vi.fn();

      const { result } = renderHook(() =>
        useMutation(mutator, { onError })
      );

      await act(async () => {
        await result.current.mutate({});
      });

      expect(onError).toHaveBeenCalledWith(error);
    });

    it('should pass typed parameters to mutator', async () => {
      interface CreateUserParams {
        name: string;
        email: string;
      }

      const mutator = vi.fn().mockResolvedValue({ id: 1 });

      const { result } = renderHook(() =>
        useMutation<{ id: number }, CreateUserParams>(mutator)
      );

      await act(async () => {
        await result.current.mutate({ name: 'John', email: 'john@example.com' });
      });

      expect(mutator).toHaveBeenCalledWith({
        name: 'John',
        email: 'john@example.com',
      });
    });
  });

  describe('reset', () => {
    it('should reset state to initial values', async () => {
      const mockResponse = { id: 1 };
      const mutator = vi.fn().mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useMutation(mutator));

      await act(async () => {
        await result.current.mutate({});
      });

      expect(result.current.data).toEqual(mockResponse);

      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('void params', () => {
    it('should work with void params', async () => {
      const mutator = vi.fn().mockResolvedValue({ success: true });

      const { result } = renderHook(() =>
        useMutation<{ success: boolean }, void>(mutator)
      );

      await act(async () => {
        await result.current.mutate();
      });

      expect(mutator).toHaveBeenCalled();
      expect(result.current.data).toEqual({ success: true });
    });
  });
});
