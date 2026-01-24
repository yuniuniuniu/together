import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Hook for persisting form draft state to sessionStorage.
 * 
 * Features:
 * - Automatically saves state changes to sessionStorage
 * - Restores state on mount
 * - Debounced saves to reduce write frequency
 * - Clear draft when form is submitted
 * 
 * @param key - Unique key for the draft (e.g., 'new-memory-draft')
 * @param initialState - Initial state object
 * @param debounceMs - Debounce time for saves (default: 500ms)
 */
export function useFormDraft<T extends object>(
  key: string,
  initialState: T,
  debounceMs = 500
): {
  state: T;
  updateField: <K extends keyof T>(field: K, value: T[K]) => void;
  updateFields: (updates: Partial<T>) => void;
  clearDraft: () => void;
  hasDraft: boolean;
} {
  // Check if there's an existing draft
  const getInitialState = (): T => {
    if (typeof window === 'undefined') return initialState;
    
    try {
      const stored = sessionStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with initialState to handle any new fields
        return { ...initialState, ...parsed };
      }
    } catch (error) {
      console.warn(`Error reading draft "${key}":`, error);
    }
    return initialState;
  };

  const [state, setState] = useState<T>(getInitialState);
  const [hasDraft, setHasDraft] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(key) !== null;
  });
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  // Save to sessionStorage with debounce
  useEffect(() => {
    // Skip saving on initial mount to avoid overwriting with default values
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      try {
        // Check if state has any meaningful data before saving
        const hasData = Object.values(state).some(value => {
          if (Array.isArray(value)) return value.length > 0;
          if (typeof value === 'string') return value.trim().length > 0;
          if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
          return value !== null && value !== undefined;
        });

        if (hasData) {
          sessionStorage.setItem(key, JSON.stringify(state));
          setHasDraft(true);
        } else {
          // Clear draft if all fields are empty
          sessionStorage.removeItem(key);
          setHasDraft(false);
        }
      } catch (error) {
        console.warn(`Error saving draft "${key}":`, error);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [key, state, debounceMs]);

  // Update a single field
  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setState(prev => ({ ...prev, [field]: value }));
  }, []);

  // Update multiple fields at once
  const updateFields = useCallback((updates: Partial<T>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Clear the draft (call this after successful save)
  const clearDraft = useCallback(() => {
    try {
      sessionStorage.removeItem(key);
      setHasDraft(false);
      setState(initialState);
    } catch (error) {
      console.warn(`Error clearing draft "${key}":`, error);
    }
  }, [key, initialState]);

  return {
    state,
    updateField,
    updateFields,
    clearDraft,
    hasDraft,
  };
}
