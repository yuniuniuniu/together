import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from 'react';
import type { Space, User, Partner } from '../types';
import { spacesApi } from '../api/client';
import { useAuth } from './AuthContext';

interface SpaceState {
  space: Space | null;
  partner: Partner | null;
  isLoading: boolean;
}

interface SpaceContextValue extends SpaceState {
  daysCount: number;
  anniversaryDate: Date | null;
  setSpace: (space: Space | null) => void;
  setPartner: (partner: Partner | null) => void;
  updateSpace: (updates: Partial<Space>) => void;
  createSpace: (anniversaryDate: Date) => Promise<void>;
  joinSpace: (inviteCode: string) => Promise<void>;
  unbind: () => Promise<void>;
  requestUnbind: () => Promise<UnbindRequest | null>;
  cancelUnbind: () => Promise<void>;
  getUnbindStatus: () => Promise<UnbindRequest | null>;
  refreshSpace: () => Promise<void>;
}

const SpaceContext = createContext<SpaceContextValue | null>(null);

interface SpaceProviderProps {
  children: ReactNode;
}

interface UnbindRequest {
  id: string;
  spaceId: string;
  requestedBy: string;
  requestedAt: string;
  expiresAt: string;
  status: 'pending' | 'cancelled' | 'completed';
}

export function SpaceProvider({ children }: SpaceProviderProps) {
  const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth();
  const [state, setState] = useState<SpaceState>({
    space: null,
    partner: null,
    isLoading: true, // Start with loading true until we know auth status
  });

  // Fetch user's space when authenticated
  useEffect(() => {
    // Wait for auth to finish loading before making decisions
    if (isAuthLoading) {
      return;
    }
    
    if (isAuthenticated) {
      refreshSpace();
    } else {
      setState({ space: null, partner: null, isLoading: false });
    }
  }, [isAuthenticated, isAuthLoading]);

  const refreshSpace = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await spacesApi.getMy();
      if (response.data) {
        const spaceData = response.data;
        const space: Space = {
          id: spaceData.id,
          createdAt: new Date(spaceData.createdAt),
          anniversaryDate: new Date(spaceData.anniversaryDate),
          partners: spaceData.partners as [User, User],
          inviteCode: spaceData.inviteCode,
        };
        // Find partner (the other user in the space)
        const partnerUser = spaceData.partners.find(p => p.id !== user?.id);
        setState({
          space,
          partner: partnerUser ? { user: partnerUser } : null,
          isLoading: false,
        });
      } else {
        setState({ space: null, partner: null, isLoading: false });
      }
    } catch {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [user?.id]);

  const daysCount = useMemo(() => {
    if (!state.space?.anniversaryDate) return 0;
    const now = new Date();
    const anniversary = new Date(state.space.anniversaryDate);
    const diffTime = Math.abs(now.getTime() - anniversary.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [state.space?.anniversaryDate]);

  const anniversaryDate = useMemo(() => {
    return state.space?.anniversaryDate ? new Date(state.space.anniversaryDate) : null;
  }, [state.space?.anniversaryDate]);

  const setSpace = useCallback((space: Space | null) => {
    setState(prev => ({ ...prev, space }));
  }, []);

  const setPartner = useCallback((partner: Partner | null) => {
    setState(prev => ({ ...prev, partner }));
  }, []);

  const updateSpace = useCallback((updates: Partial<Space>) => {
    setState(prev => ({
      ...prev,
      space: prev.space ? { ...prev.space, ...updates } : null,
    }));
  }, []);

  const createSpace = useCallback(async (anniversaryDate: Date) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await spacesApi.create(anniversaryDate.toISOString().split('T')[0]);
      const spaceData = response.data;
      const space: Space = {
        id: spaceData.id,
        createdAt: new Date(spaceData.createdAt),
        anniversaryDate: new Date(spaceData.anniversaryDate),
        partners: spaceData.partners as [User, User],
        inviteCode: spaceData.inviteCode,
      };
      setState(prev => ({
        ...prev,
        space,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const joinSpace = useCallback(async (inviteCode: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await spacesApi.join(inviteCode);
      const spaceData = response.data;
      const space: Space = {
        id: spaceData.id,
        createdAt: new Date(spaceData.createdAt),
        anniversaryDate: new Date(spaceData.anniversaryDate),
        partners: spaceData.partners as [User, User],
        inviteCode: spaceData.inviteCode,
      };
      const partnerUser = spaceData.partners.find(p => p.id !== user?.id);
      setState({
        space,
        partner: partnerUser ? { user: partnerUser } : null,
        isLoading: false,
      });
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [user?.id]);

  const unbind = useCallback(async () => {
    if (!state.space) return;
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      await spacesApi.delete(state.space.id);
      setState({
        space: null,
        partner: null,
        isLoading: false,
      });
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [state.space]);

  const requestUnbind = useCallback(async (): Promise<UnbindRequest | null> => {
    if (!state.space) return null;
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await spacesApi.requestUnbind(state.space.id);
      return response.data;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.space]);

  const cancelUnbind = useCallback(async (): Promise<void> => {
    if (!state.space) return;
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      await spacesApi.cancelUnbind(state.space.id);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.space]);

  const getUnbindStatus = useCallback(async (): Promise<UnbindRequest | null> => {
    if (!state.space) return null;
    const response = await spacesApi.getUnbindStatus(state.space.id);
    return response.data;
  }, [state.space]);

  const value = useMemo<SpaceContextValue>(() => ({
    ...state,
    daysCount,
    anniversaryDate,
    setSpace,
    setPartner,
    updateSpace,
    createSpace,
    joinSpace,
    unbind,
    requestUnbind,
    cancelUnbind,
    getUnbindStatus,
    refreshSpace,
  }), [state, daysCount, anniversaryDate, setSpace, setPartner, updateSpace, createSpace, joinSpace, unbind, requestUnbind, cancelUnbind, getUnbindStatus, refreshSpace]);

  return (
    <SpaceContext.Provider value={value}>
      {children}
    </SpaceContext.Provider>
  );
}

export function useSpace(): SpaceContextValue {
  const context = useContext(SpaceContext);
  if (!context) {
    throw new Error('useSpace must be used within a SpaceProvider');
  }
  return context;
}

export { SpaceContext };
