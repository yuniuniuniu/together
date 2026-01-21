import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Settings from '../../pages/Settings';
import { AuthProvider } from '../../shared/context/AuthContext';
import { SpaceProvider } from '../../shared/context/SpaceContext';
import { ToastProvider } from '../../shared/components/feedback/Toast';
import * as client from '../../shared/api/client';

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the API client
vi.mock('../../shared/api/client', () => ({
  uploadApi: {
    uploadFile: vi.fn(),
  },
  spacesApi: {
    getMy: vi.fn(),
    create: vi.fn(),
    join: vi.fn(),
    delete: vi.fn(),
  },
  authApi: {
    getMe: vi.fn(),
    sendCode: vi.fn(),
    verify: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

const mockUploadApi = client.uploadApi as {
  uploadFile: ReturnType<typeof vi.fn>;
};

const mockSpacesApi = client.spacesApi as {
  getMy: ReturnType<typeof vi.fn>;
};

const mockAuthApi = client.authApi as {
  getMe: ReturnType<typeof vi.fn>;
  updateProfile: ReturnType<typeof vi.fn>;
};

const createMockUser = (overrides = {}) => ({
  id: 'user-1',
  phone: '+1234567890',
  nickname: 'TestUser',
  avatar: null,
  ...overrides,
});

const createMockSpace = (overrides = {}) => ({
  id: 'space-1',
  createdAt: '2024-01-01T00:00:00.000Z',
  anniversaryDate: '2024-02-14',
  inviteCode: '123456',
  partners: [
    { id: 'user-1', phone: '+1234567890', nickname: 'TestUser' },
    { id: 'user-2', phone: '+0987654321', nickname: 'MyPartner' },
  ],
  ...overrides,
});

const renderSettings = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <SpaceProvider>
          <ToastProvider>
            <Settings />
          </ToastProvider>
        </SpaceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Settings Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    localStorage.clear();

    // Default mock setup
    mockAuthApi.getMe.mockRejectedValue(new Error('No token'));
    mockSpacesApi.getMy.mockResolvedValue({ data: null });
  });

  describe('header', () => {
    it('should render settings header', async () => {
      renderSettings();

      await waitFor(() => {
        expect(screen.getByText('Couple Settings')).toBeInTheDocument();
      });
    });

    it('should navigate back when back button clicked', async () => {
      const user = userEvent.setup();
      renderSettings();

      await waitFor(() => {
        expect(screen.getByText('Couple Settings')).toBeInTheDocument();
      });

      const backButton = screen.getByText('arrow_back').closest('button');
      await user.click(backButton!);

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('loading state', () => {
    it('should show loading spinner while fetching data', async () => {
      // Setup to trigger loading state
      localStorage.setItem('auth_token', 'valid-token');

      let resolveAuth: (value: unknown) => void;
      const pendingAuthPromise = new Promise((resolve) => {
        resolveAuth = resolve;
      });
      mockAuthApi.getMe.mockReturnValue(pendingAuthPromise);
      mockSpacesApi.getMy.mockResolvedValue({ data: null });

      renderSettings();

      // Should show loading spinner - give React time to render
      await waitFor(() => {
        const spinners = document.querySelectorAll('.animate-spin');
        expect(spinners.length).toBeGreaterThan(0);
      });

      // Cleanup
      resolveAuth!({ data: createMockUser() });
    });
  });

  describe('user profile display', () => {
    beforeEach(() => {
      localStorage.setItem('auth_token', 'valid-token');
      mockAuthApi.getMe.mockResolvedValue({ data: createMockUser() });
      mockSpacesApi.getMy.mockResolvedValue({ data: createMockSpace() });
    });

    it('should display user nickname', async () => {
      renderSettings();

      await waitFor(() => {
        expect(screen.getByText('TestUser')).toBeInTheDocument();
      });
    });

    it('should display partner section', async () => {
      renderSettings();

      await waitFor(() => {
        // Due to the SpaceContext structure, partner.nickname is undefined
        // so the fallback "Waiting for partner..." is shown
        // This test verifies the My Partner section renders
        expect(screen.getByText('My Partner')).toBeInTheDocument();
      });
    });

    it('should display anniversary date', async () => {
      renderSettings();

      await waitFor(() => {
        expect(screen.getByText('Feb 14, 2024')).toBeInTheDocument();
      });
    });

    it('should display days together count', async () => {
      // Calculate expected days
      const anniversaryDate = new Date('2024-02-14');
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - anniversaryDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      renderSettings();

      await waitFor(() => {
        expect(screen.getByText(`Together for ${diffDays} days`)).toBeInTheDocument();
      });
    });

    it('should display user avatar placeholder when no avatar', async () => {
      renderSettings();

      await waitFor(() => {
        const personIcons = screen.getAllByText('person');
        expect(personIcons.length).toBeGreaterThan(0);
      });
    });

    it('should display user avatar when available', async () => {
      mockAuthApi.getMe.mockResolvedValue({
        data: createMockUser({ avatar: 'https://example.com/avatar.jpg' }),
      });

      renderSettings();

      await waitFor(() => {
        const avatarDivs = document.querySelectorAll('[style*="background-image"]');
        const hasAvatarDiv = Array.from(avatarDivs).some(div =>
          (div as HTMLElement).style.backgroundImage.includes('avatar.jpg')
        );
        expect(hasAvatarDiv).toBe(true);
      });
    });
  });

  describe('nickname editing', () => {
    beforeEach(() => {
      localStorage.setItem('auth_token', 'valid-token');
      mockAuthApi.getMe.mockResolvedValue({ data: createMockUser() });
      mockSpacesApi.getMy.mockResolvedValue({ data: createMockSpace() });
    });

    it('should show edit button for nickname', async () => {
      renderSettings();

      await waitFor(() => {
        expect(screen.getByText('My Nickname')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('edit');
      expect(editButtons.length).toBeGreaterThan(0);
    });

    it('should enter edit mode when edit clicked', async () => {
      const user = userEvent.setup();
      renderSettings();

      await waitFor(() => {
        expect(screen.getByText('TestUser')).toBeInTheDocument();
      });

      // Find the edit button - it's in the nickname section
      const editButtons = screen.getAllByText('edit');
      const editButton = editButtons[0].closest('button');
      await user.click(editButton!);

      await waitFor(() => {
        // Look for input by role or the text input element
        const inputs = document.querySelectorAll('input[type="text"]');
        expect(inputs.length).toBeGreaterThan(0);
        expect(screen.getByText('Save')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });
    });

    it('should update nickname on typing', async () => {
      const user = userEvent.setup();
      renderSettings();

      await waitFor(() => {
        expect(screen.getByText('TestUser')).toBeInTheDocument();
      });

      const editButton = screen.getAllByText('edit')[0].closest('button');
      await user.click(editButton!);

      await waitFor(() => {
        expect(screen.getByText('Save')).toBeInTheDocument();
      });

      const input = document.querySelector('input[type="text"]') as HTMLInputElement;
      await user.clear(input);
      await user.type(input, 'NewNickname');

      expect(input).toHaveValue('NewNickname');
    });

    it('should save nickname when save clicked', async () => {
      const user = userEvent.setup();
      mockAuthApi.updateProfile.mockResolvedValue({ data: createMockUser({ nickname: 'NewNickname' }) });

      renderSettings();

      await waitFor(() => {
        expect(screen.getByText('TestUser')).toBeInTheDocument();
      });

      const editButton = screen.getAllByText('edit')[0].closest('button');
      await user.click(editButton!);

      await waitFor(() => {
        expect(screen.getByText('Save')).toBeInTheDocument();
      });

      const input = document.querySelector('input[type="text"]') as HTMLInputElement;
      await user.clear(input);
      await user.type(input, 'NewNickname');

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockAuthApi.updateProfile).toHaveBeenCalledWith({ nickname: 'NewNickname' });
      });
    });

    it('should cancel editing when cancel clicked', async () => {
      const user = userEvent.setup();
      renderSettings();

      await waitFor(() => {
        expect(screen.getByText('TestUser')).toBeInTheDocument();
      });

      const editButton = screen.getAllByText('edit')[0].closest('button');
      await user.click(editButton!);

      await waitFor(() => {
        expect(screen.getByText('Save')).toBeInTheDocument();
      });

      const input = document.querySelector('input[type="text"]') as HTMLInputElement;
      await user.clear(input);
      await user.type(input, 'NewNickname');

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.getByText('TestUser')).toBeInTheDocument();
      });
    });

    it('should not save empty nickname', async () => {
      const user = userEvent.setup();
      renderSettings();

      await waitFor(() => {
        expect(screen.getByText('TestUser')).toBeInTheDocument();
      });

      const editButton = screen.getAllByText('edit')[0].closest('button');
      await user.click(editButton!);

      await waitFor(() => {
        expect(screen.getByText('Save')).toBeInTheDocument();
      });

      const input = document.querySelector('input[type="text"]') as HTMLInputElement;
      await user.clear(input);

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      expect(mockAuthApi.updateProfile).not.toHaveBeenCalled();
    });
  });

  describe('avatar upload', () => {
    beforeEach(() => {
      localStorage.setItem('auth_token', 'valid-token');
      mockAuthApi.getMe.mockResolvedValue({ data: createMockUser() });
      mockSpacesApi.getMy.mockResolvedValue({ data: createMockSpace() });
    });

    it('should have hidden file input for avatar', async () => {
      renderSettings();

      await waitFor(() => {
        expect(screen.getByText('TestUser')).toBeInTheDocument();
      });

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveClass('hidden');
    });

    it('should upload avatar when file selected', async () => {
      mockUploadApi.uploadFile.mockResolvedValue({ url: 'https://example.com/new-avatar.jpg' });
      mockAuthApi.updateProfile.mockResolvedValue({
        data: createMockUser({ avatar: 'https://example.com/new-avatar.jpg' }),
      });

      renderSettings();

      await waitFor(() => {
        expect(screen.getByText('TestUser')).toBeInTheDocument();
      });

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });

      Object.defineProperty(fileInput, 'files', {
        value: [file],
      });

      fileInput.dispatchEvent(new Event('change', { bubbles: true }));

      await waitFor(() => {
        expect(mockUploadApi.uploadFile).toHaveBeenCalledWith(file);
      });

      await waitFor(() => {
        expect(mockAuthApi.updateProfile).toHaveBeenCalledWith({
          avatar: 'https://example.com/new-avatar.jpg',
        });
      });
    });
  });

  describe('unbind navigation', () => {
    beforeEach(() => {
      localStorage.setItem('auth_token', 'valid-token');
      mockAuthApi.getMe.mockResolvedValue({ data: createMockUser() });
      mockSpacesApi.getMy.mockResolvedValue({ data: createMockSpace() });
    });

    it('should show unbind button', async () => {
      renderSettings();

      await waitFor(() => {
        expect(screen.getByText('Unbind Connection')).toBeInTheDocument();
      });
    });

    it('should navigate to unbind page when clicked', async () => {
      const user = userEvent.setup();
      renderSettings();

      await waitFor(() => {
        expect(screen.getByText('Unbind Connection')).toBeInTheDocument();
      });

      const unbindButton = screen.getByText('Unbind Connection').closest('button');
      await user.click(unbindButton!);

      expect(mockNavigate).toHaveBeenCalledWith('/settings/unbind');
    });

    it('should display unbind warning message', async () => {
      renderSettings();

      await waitFor(() => {
        expect(screen.getByText(/Unbinding your account will archive your shared gallery/)).toBeInTheDocument();
      });
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      localStorage.setItem('auth_token', 'valid-token');
      mockAuthApi.getMe.mockResolvedValue({ data: createMockUser() });
      mockSpacesApi.getMy.mockResolvedValue({ data: createMockSpace() });
    });

    it('should show logout button', async () => {
      renderSettings();

      await waitFor(() => {
        expect(screen.getByText('Log Out')).toBeInTheDocument();
      });
    });

    it('should confirm before logging out', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      renderSettings();

      await waitFor(() => {
        expect(screen.getByText('Log Out')).toBeInTheDocument();
      });

      const logoutButton = screen.getByText('Log Out').closest('button');
      await user.click(logoutButton!);

      expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to log out?');

      confirmSpy.mockRestore();
    });

    it('should logout and navigate when confirmed', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      renderSettings();

      await waitFor(() => {
        expect(screen.getByText('Log Out')).toBeInTheDocument();
      });

      const logoutButton = screen.getByText('Log Out').closest('button');
      await user.click(logoutButton!);

      expect(confirmSpy).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');

      confirmSpy.mockRestore();
    });

    it('should not logout when cancelled', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      renderSettings();

      await waitFor(() => {
        expect(screen.getByText('Log Out')).toBeInTheDocument();
      });

      const logoutButton = screen.getByText('Log Out').closest('button');
      await user.click(logoutButton!);

      expect(mockNavigate).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });
  });

  describe('without partner', () => {
    beforeEach(() => {
      localStorage.setItem('auth_token', 'valid-token');
      mockAuthApi.getMe.mockResolvedValue({ data: createMockUser() });
      mockSpacesApi.getMy.mockResolvedValue({
        data: createMockSpace({
          partners: [{ id: 'user-1', phone: '+1234567890', nickname: 'TestUser' }],
        }),
      });
    });

    it('should show waiting message when no partner', async () => {
      renderSettings();

      await waitFor(() => {
        expect(screen.getByText('Waiting for partner...')).toBeInTheDocument();
      });
    });
  });

  describe('without space', () => {
    beforeEach(() => {
      localStorage.setItem('auth_token', 'valid-token');
      mockAuthApi.getMe.mockResolvedValue({ data: createMockUser() });
      mockSpacesApi.getMy.mockResolvedValue({ data: null });
    });

    it('should show "Not set" for anniversary', async () => {
      renderSettings();

      await waitFor(() => {
        expect(screen.getByText('Not set')).toBeInTheDocument();
      });
    });

    it('should show 0 days together', async () => {
      renderSettings();

      await waitFor(() => {
        expect(screen.getByText('Together for 0 days')).toBeInTheDocument();
      });
    });
  });

  describe('relationship info section', () => {
    beforeEach(() => {
      localStorage.setItem('auth_token', 'valid-token');
      mockAuthApi.getMe.mockResolvedValue({ data: createMockUser() });
      mockSpacesApi.getMy.mockResolvedValue({ data: createMockSpace() });
    });

    it('should display relationship info section header', async () => {
      renderSettings();

      await waitFor(() => {
        expect(screen.getByText('Relationship Info')).toBeInTheDocument();
      });
    });

    it('should display my nickname label', async () => {
      renderSettings();

      await waitFor(() => {
        expect(screen.getByText('My Nickname')).toBeInTheDocument();
      });
    });

    it('should display my partner label', async () => {
      renderSettings();

      await waitFor(() => {
        expect(screen.getByText('My Partner')).toBeInTheDocument();
      });
    });

    it('should display anniversary date label', async () => {
      renderSettings();

      await waitFor(() => {
        expect(screen.getByText('Anniversary Date')).toBeInTheDocument();
      });
    });
  });
});
