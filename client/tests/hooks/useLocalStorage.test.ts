import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '@/shared/hooks/useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should return initial value when localStorage is empty', () => {
      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'initial')
      );

      expect(result.current[0]).toBe('initial');
    });

    it('should return stored value when localStorage has data', () => {
      localStorage.setItem('test-key', JSON.stringify('stored-value'));

      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'initial')
      );

      expect(result.current[0]).toBe('stored-value');
    });

    it('should handle complex objects', () => {
      const complexObject = { name: 'test', nested: { value: 123 } };
      localStorage.setItem('complex-key', JSON.stringify(complexObject));

      const { result } = renderHook(() =>
        useLocalStorage('complex-key', {})
      );

      expect(result.current[0]).toEqual(complexObject);
    });

    it('should handle arrays', () => {
      const array = [1, 2, 3, 'four'];
      localStorage.setItem('array-key', JSON.stringify(array));

      const { result } = renderHook(() =>
        useLocalStorage('array-key', [])
      );

      expect(result.current[0]).toEqual(array);
    });

    it('should return initial value when localStorage has invalid JSON', () => {
      localStorage.setItem('invalid-key', 'not-json');
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() =>
        useLocalStorage('invalid-key', 'fallback')
      );

      expect(result.current[0]).toBe('fallback');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('setValue', () => {
    it('should update state and localStorage with direct value', () => {
      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'initial')
      );

      act(() => {
        result.current[1]('new-value');
      });

      expect(result.current[0]).toBe('new-value');
      expect(JSON.parse(localStorage.getItem('test-key')!)).toBe('new-value');
    });

    it('should update state and localStorage with function', () => {
      const { result } = renderHook(() =>
        useLocalStorage('counter', 0)
      );

      act(() => {
        result.current[1]((prev) => prev + 1);
      });

      expect(result.current[0]).toBe(1);
      expect(JSON.parse(localStorage.getItem('counter')!)).toBe(1);
    });

    it('should handle multiple updates', () => {
      const { result } = renderHook(() =>
        useLocalStorage('counter', 0)
      );

      act(() => {
        result.current[1]((prev) => prev + 1);
      });
      act(() => {
        result.current[1]((prev) => prev + 1);
      });
      act(() => {
        result.current[1]((prev) => prev + 1);
      });

      expect(result.current[0]).toBe(3);
    });

    it('should handle object updates', () => {
      const { result } = renderHook(() =>
        useLocalStorage('user', { name: 'John', age: 25 })
      );

      act(() => {
        result.current[1]((prev) => ({ ...prev, age: 26 }));
      });

      expect(result.current[0]).toEqual({ name: 'John', age: 26 });
    });

    it('should handle null values', () => {
      const { result } = renderHook(() =>
        useLocalStorage<string | null>('nullable', 'initial')
      );

      act(() => {
        result.current[1](null);
      });

      expect(result.current[0]).toBeNull();
    });
  });

  describe('removeValue', () => {
    it('should reset state to initial value after removeValue', () => {
      localStorage.setItem('test-key', JSON.stringify('stored'));

      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'initial')
      );

      expect(result.current[0]).toBe('stored');

      act(() => {
        result.current[2](); // removeValue
      });

      // State should reset to initial value
      expect(result.current[0]).toBe('initial');
      // Note: The hook's useEffect syncs state to localStorage, so after reset
      // the initial value gets written back to localStorage
      expect(JSON.parse(localStorage.getItem('test-key')!)).toBe('initial');
    });

    it('should handle remove when key does not exist', () => {
      const { result } = renderHook(() =>
        useLocalStorage('non-existent', 'default')
      );

      act(() => {
        result.current[2]();
      });

      expect(result.current[0]).toBe('default');
    });
  });

  describe('key changes', () => {
    it('should persist across re-renders', () => {
      const { result, rerender } = renderHook(() =>
        useLocalStorage('persistent-key', 'initial')
      );

      act(() => {
        result.current[1]('updated');
      });

      rerender();

      expect(result.current[0]).toBe('updated');
    });
  });

  describe('error handling', () => {
    it('should handle localStorage.setItem errors', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage full');
      });

      const { result } = renderHook(() =>
        useLocalStorage('error-key', 'initial')
      );

      act(() => {
        result.current[1]('new-value');
      });

      // State should still update even if localStorage fails
      expect(result.current[0]).toBe('new-value');
      expect(consoleSpy).toHaveBeenCalled();

      localStorage.setItem = originalSetItem;
      consoleSpy.mockRestore();
    });

    it('should handle localStorage.removeItem errors', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = vi.fn(() => {
        throw new Error('Cannot remove');
      });

      const { result } = renderHook(() =>
        useLocalStorage('remove-error-key', 'initial')
      );

      act(() => {
        result.current[2]();
      });

      expect(consoleSpy).toHaveBeenCalled();

      localStorage.removeItem = originalRemoveItem;
      consoleSpy.mockRestore();
    });
  });

  describe('type safety', () => {
    it('should work with boolean values', () => {
      const { result } = renderHook(() =>
        useLocalStorage('bool-key', false)
      );

      act(() => {
        result.current[1](true);
      });

      expect(result.current[0]).toBe(true);
    });

    it('should work with number values', () => {
      const { result } = renderHook(() =>
        useLocalStorage('number-key', 0)
      );

      act(() => {
        result.current[1](42);
      });

      expect(result.current[0]).toBe(42);
    });

    it('should work with array values', () => {
      const { result } = renderHook(() =>
        useLocalStorage<string[]>('array-key', [])
      );

      act(() => {
        result.current[1](['a', 'b', 'c']);
      });

      expect(result.current[0]).toEqual(['a', 'b', 'c']);
    });
  });
});
