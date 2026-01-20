import { useState, useCallback } from 'react';
import type { Memory } from '../types';
import { memoriesApi } from '../../../shared/api/client';

export function useMemories() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchMemories = useCallback(async (page = 1, pageSize = 20) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await memoriesApi.list(page, pageSize);
      const data = response.data;
      const formatted: Memory[] = data.data.map(m => ({
        ...m,
        createdAt: new Date(m.createdAt),
      }));

      if (page === 1) {
        setMemories(formatted);
      } else {
        setMemories(prev => [...prev, ...formatted]);
      }
      setHasMore(data.hasMore);
      setTotal(data.total);
      return formatted;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch memories'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addMemory = useCallback(async (input: {
    content: string;
    mood?: string;
    photos?: string[];
    location?: { name: string; address?: string; latitude?: number; longitude?: number };
    voiceNote?: string;
    stickers?: string[];
  }) => {
    setIsLoading(true);
    try {
      const response = await memoriesApi.create(input);
      const memory: Memory = {
        ...response.data,
        createdAt: new Date(response.data.createdAt),
      };
      setMemories(prev => [memory, ...prev]);
      setTotal(prev => prev + 1);
      return memory;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeMemory = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      await memoriesApi.delete(id);
      setMemories(prev => prev.filter(m => m.id !== id));
      setTotal(prev => prev - 1);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateMemory = useCallback(async (id: string, updates: Partial<{
    content: string;
    mood?: string;
    photos?: string[];
    location?: { name: string; address?: string; latitude?: number; longitude?: number };
    voiceNote?: string;
    stickers?: string[];
  }>) => {
    setIsLoading(true);
    try {
      const response = await memoriesApi.update(id, updates);
      const memory: Memory = {
        ...response.data,
        createdAt: new Date(response.data.createdAt),
      };
      setMemories(prev =>
        prev.map(m => (m.id === id ? memory : m))
      );
      return memory;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    memories,
    isLoading,
    error,
    hasMore,
    total,
    refresh: () => fetchMemories(1),
    loadMore: (page: number) => fetchMemories(page),
    addMemory,
    removeMemory,
    updateMemory,
  };
}
