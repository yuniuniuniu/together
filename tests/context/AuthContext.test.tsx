import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../shared/context/AuthContext';
import * as client from '../../shared/api/client';

// Mock the API client
vi.mock('../../shared/api/client', () => ({
  authApi: {
    sendCode: vi.fn(),
    verify: vi.fn(),
    getMe: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

const mockAuthApi = client.authApi as {
  sendCode: ReturnType<typeof vi.fn>;
  verify: ReturnType<typeof vi.fn>;
  getMe: ReturnType<typeof vi.fn>;
  updateProfile: ReturnType<typeof vi.fn>;
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');
    });
  });

  describe('initial state', () => {
    it('should start with no user when no token exists', async () => {
      mockAuthApi.getMe.mockRejectedValue(new Error('No token'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should restore session from token', async () => {
      const mockUser = { id: '1', phone: '+1234567890', nickname: 'Test' };
      localStorage.setItem('auth_token', 'valid-token');
      mockAuthApi.getMe.mockResolvedValue({ data: mockUser });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should clear invalid token on failed session restore', async () => {
      localStorage.setItem('auth_token', 'invalid-token');
      mockAuthApi.getMe.mockRejectedValue(new Error('Invalid token'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('sendCode', () => {
    it('should call API and return code', async () => {
      mockAuthApi.getMe.mockRejectedValue(new Error('No token'));
      mockAuthApi.sendCode.mockResolvedValue({ data: { code: '123456' } });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let code: string;
      await act(async () => {
        code = await result.current.sendCode('+1234567890');
      });

      expect(mockAuthApi.sendCode).toHaveBeenCalledWith('+1234567890');
      expect(code!).toBe('123456');
    });

    it('should throw error on API failure', async () => {
      mockAuthApi.getMe.mockRejectedValue(new Error('No token'));
      mockAuthApi.sendCode.mockRejectedValue(new Error('Invalid phone'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.sendCode('invalid');
        })
      ).rejects.toThrow('Invalid phone');
    });
  });

  describe('login', () => {
    it('should authenticate user and store token', async () => {
      const mockUser = { id: '1', phone: '+1234567890', nickname: 'Test' };
      mockAuthApi.getMe.mockRejectedValue(new Error('No token'));
      mockAuthApi.verify.mockResolvedValue({
        data: { user: mockUser, token: 'new-token' },
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login('+1234567890', '123456');
      });

      expect(mockAuthApi.verify).toHaveBeenCalledWith('+1234567890', '123456');
      expect(localStorage.getItem('auth_token')).toBe('new-token');
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle login failure', async () => {
      mockAuthApi.getMe.mockRejectedValue(new Error('No token'));
      mockAuthApi.verify.mockRejectedValue(new Error('Invalid code'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.login('+1234567890', 'wrong');
        })
      ).rejects.toThrow('Invalid code');

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear user and token', async () => {
      const mockUser = { id: '1', phone: '+1234567890', nickname: 'Test' };
      localStorage.setItem('auth_token', 'valid-token');
      mockAuthApi.getMe.mockResolvedValue({ data: mockUser });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const mockUser = { id: '1', phone: '+1234567890', nickname: 'Test' };
      const updatedUser = { ...mockUser, nickname: 'Updated Name' };
      localStorage.setItem('auth_token', 'valid-token');
      mockAuthApi.getMe.mockResolvedValue({ data: mockUser });
      mockAuthApi.updateProfile.mockResolvedValue({ data: updatedUser });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.updateProfile({ nickname: 'Updated Name' });
      });

      expect(mockAuthApi.updateProfile).toHaveBeenCalledWith({ nickname: 'Updated Name' });
      expect(result.current.user?.nickname).toBe('Updated Name');
    });
  });

  describe('setUser', () => {
    it('should manually set user', async () => {
      mockAuthApi.getMe.mockRejectedValue(new Error('No token'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const mockUser = { id: '1', phone: '+1234567890', nickname: 'Manual' };

      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should clear user when set to null', async () => {
      const mockUser = { id: '1', phone: '+1234567890', nickname: 'Test' };
      localStorage.setItem('auth_token', 'valid-token');
      mockAuthApi.getMe.mockResolvedValue({ data: mockUser });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      act(() => {
        result.current.setUser(null);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});
