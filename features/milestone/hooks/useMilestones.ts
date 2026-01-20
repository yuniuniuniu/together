import { useState, useCallback } from 'react';
import type { Milestone } from '../types';
import { milestonesApi } from '../../../shared/api/client';

export function useMilestones() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMilestones = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await milestonesApi.list();
      const formatted: Milestone[] = response.data.map(m => ({
        ...m,
        date: new Date(m.date),
        createdAt: new Date(m.createdAt),
      }));
      setMilestones(formatted);
      return formatted;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch milestones'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addMilestone = useCallback(async (input: {
    title: string;
    description?: string;
    date: string;
    type: string;
    icon?: string;
    photos?: string[];
  }) => {
    setIsLoading(true);
    try {
      const response = await milestonesApi.create(input);
      const milestone: Milestone = {
        ...response.data,
        date: new Date(response.data.date),
        createdAt: new Date(response.data.createdAt),
      };
      setMilestones(prev => [...prev, milestone].sort((a, b) => a.date.getTime() - b.date.getTime()));
      return milestone;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeMilestone = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      await milestonesApi.delete(id);
      setMilestones(prev => prev.filter(m => m.id !== id));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateMilestone = useCallback(async (id: string, updates: Partial<{
    title: string;
    description?: string;
    date: string;
    type: string;
    icon?: string;
    photos?: string[];
  }>) => {
    setIsLoading(true);
    try {
      const response = await milestonesApi.update(id, updates);
      const milestone: Milestone = {
        ...response.data,
        date: new Date(response.data.date),
        createdAt: new Date(response.data.createdAt),
      };
      setMilestones(prev =>
        prev.map(m => (m.id === id ? milestone : m))
          .sort((a, b) => a.date.getTime() - b.date.getTime())
      );
      return milestone;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    milestones,
    isLoading,
    error,
    refresh: fetchMilestones,
    addMilestone,
    removeMilestone,
    updateMilestone,
  };
}
