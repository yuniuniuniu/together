import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/shared/context/AuthContext';
import { SpaceProvider } from '@/shared/context/SpaceContext';
import { ProtectedRoute } from '@/shared/components/auth/ProtectedRoute';
import * as client from '@/shared/api/client';

vi.mock('@/shared/api/client', () => ({
  authApi: {
    sendCode: vi.fn(),
    verify: vi.fn(),
    getMe: vi.fn(),
    updateProfile: vi.fn(),
  },
  spacesApi: {
    create: vi.fn(),
    getMy: vi.fn(),
    getById: vi.fn(),
    join: vi.fn(),
    delete: vi.fn(),
    requestUnbind: vi.fn(),
    cancelUnbind: vi.fn(),
    getUnbindStatus: vi.fn(),
  },
}));

const mockAuthApi = client.authApi as {
  getMe: ReturnType<typeof vi.fn>;
};

const mockSpacesApi = client.spacesApi as {
  getMy: ReturnType<typeof vi.fn>;
};

const renderRoute = (requireSpace = false) =>
  render(
    <MemoryRouter initialEntries={['/protected']}>
      <AuthProvider>
        <SpaceProvider>
          <Routes>
            <Route path="/" element={<div>Login Page</div>} />
            <Route path="/sanctuary" element={<div>Sanctuary Page</div>} />
            <Route
              path="/protected"
              element={
                <ProtectedRoute requireSpace={requireSpace}>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </SpaceProvider>
      </AuthProvider>
    </MemoryRouter>
  );

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('redirects to login when not authenticated', async () => {
    mockAuthApi.getMe.mockRejectedValue(new Error('No token'));

    renderRoute();

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  it('redirects to sanctuary when requireSpace and no space', async () => {
    localStorage.setItem('auth_token', 'token');
    mockAuthApi.getMe.mockResolvedValue({
      data: { id: 'user-1', phone: '+123', nickname: 'User' },
    });
    mockSpacesApi.getMy.mockResolvedValue({ data: null });

    renderRoute(true);

    await waitFor(() => {
      expect(screen.getByText('Sanctuary Page')).toBeInTheDocument();
    });
  });

  it('renders protected content when requireSpace and space exists', async () => {
    localStorage.setItem('auth_token', 'token');
    mockAuthApi.getMe.mockResolvedValue({
      data: { id: 'user-1', phone: '+123', nickname: 'User' },
    });
    mockSpacesApi.getMy.mockResolvedValue({
      data: {
        id: 'space-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        anniversaryDate: '2024-02-14',
        inviteCode: 'ABC123',
        partners: [
          { id: 'user-1', phone: '+123', nickname: 'User' },
          { id: 'user-2', phone: '+456', nickname: 'Partner' },
        ],
      },
    });

    renderRoute(true);

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });
});
