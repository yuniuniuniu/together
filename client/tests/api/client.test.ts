import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient, authApi, spacesApi, memoriesApi, milestonesApi, reactionsApi } from '@/shared/api/client';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('apiClient', () => {
    it('should make request with correct headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: 'test' }),
      });

      await apiClient('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should include auth token when present', async () => {
      localStorage.setItem('auth_token', 'test-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: 'test' }),
      });

      await apiClient('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ success: false, message: 'Test error' }),
      });

      await expect(apiClient('/test')).rejects.toThrow('Test error');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient('/test')).rejects.toThrow('Network error');
    });
  });

  describe('authApi', () => {
    describe('sendCode', () => {
      it('should call correct endpoint', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { code: '123456' } }),
        });

        await authApi.sendCode('test@example.com');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/send-code'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ email: 'test@example.com' }),
          })
        );
      });
    });

    describe('verify', () => {
      it('should call correct endpoint with credentials', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { user: { id: '1' }, token: 'token' },
          }),
        });

        await authApi.verify('test@example.com', '123456');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/verify'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ email: 'test@example.com', code: '123456' }),
          })
        );
      });
    });

    describe('getMe', () => {
      it('should call correct endpoint', async () => {
        localStorage.setItem('auth_token', 'test-token');
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { id: '1' } }),
        });

        await authApi.getMe();

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/me'),
          expect.any(Object)
        );
      });
    });

    describe('updateProfile', () => {
      it('should call correct endpoint with updates', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { id: '1', nickname: 'New' } }),
        });

        await authApi.updateProfile({ nickname: 'New' });

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/profile'),
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({ nickname: 'New' }),
          })
        );
      });
    });
  });

  describe('spacesApi', () => {
    describe('create', () => {
      it('should call correct endpoint', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { id: 'space-1' } }),
        });

        await spacesApi.create('2024-02-14');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/spaces'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ anniversaryDate: '2024-02-14' }),
          })
        );
      });
    });

    describe('join', () => {
      it('should call correct endpoint with invite code', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { id: 'space-1' } }),
        });

        await spacesApi.join('123456');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/spaces/join'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ inviteCode: '123456' }),
          })
        );
      });
    });

    describe('getMy', () => {
      it('should call correct endpoint', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: null }),
        });

        await spacesApi.getMy();

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/spaces/my'),
          expect.any(Object)
        );
      });
    });

    describe('delete', () => {
      it('should call correct endpoint', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

        await spacesApi.delete('space-1');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/spaces/space-1'),
          expect.objectContaining({ method: 'DELETE' })
        );
      });
    });
  });

  describe('memoriesApi', () => {
    describe('create', () => {
      it('should call correct endpoint with memory data', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { id: 'mem-1' } }),
        });

        await memoriesApi.create({
          content: 'Test memory',
          mood: 'Happy',
        });

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/memories'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ content: 'Test memory', mood: 'Happy' }),
          })
        );
      });
    });

    describe('list', () => {
      it('should call correct endpoint with pagination', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { data: [], total: 0, page: 1, pageSize: 20, hasMore: false },
          }),
        });

        await memoriesApi.list(2, 10);

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/memories?page=2&pageSize=10'),
          expect.any(Object)
        );
      });
    });

    describe('update', () => {
      it('should call correct endpoint with updates', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { id: 'mem-1' } }),
        });

        await memoriesApi.update('mem-1', { content: 'Updated' });

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/memories/mem-1'),
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({ content: 'Updated' }),
          })
        );
      });
    });

    describe('delete', () => {
      it('should call correct endpoint', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

        await memoriesApi.delete('mem-1');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/memories/mem-1'),
          expect.objectContaining({ method: 'DELETE' })
        );
      });
    });
  });

  describe('milestonesApi', () => {
    describe('create', () => {
      it('should call correct endpoint', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { id: 'mile-1' } }),
        });

        await milestonesApi.create({
          title: 'First Anniversary',
          date: '2024-02-14',
          type: 'anniversary',
        });

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/milestones'),
          expect.objectContaining({
            method: 'POST',
          })
        );
      });
    });

    describe('list', () => {
      it('should call correct endpoint', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: [] }),
        });

        await milestonesApi.list();

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/milestones'),
          expect.any(Object)
        );
      });
    });
  });

  describe('reactionsApi', () => {
    describe('toggle', () => {
      it('should call correct endpoint', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, action: 'added', data: { id: 'r-1' } }),
        });

        await reactionsApi.toggle('mem-1', 'love');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/reactions/mem-1'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ type: 'love' }),
          })
        );
      });
    });

    describe('list', () => {
      it('should call correct endpoint', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: [] }),
        });

        await reactionsApi.list('mem-1');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/reactions/mem-1'),
          expect.any(Object)
        );
      });
    });

    describe('getMine', () => {
      it('should call correct endpoint', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: null }),
        });

        await reactionsApi.getMine('mem-1');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/reactions/mem-1/me'),
          expect.any(Object)
        );
      });
    });
  });
});
