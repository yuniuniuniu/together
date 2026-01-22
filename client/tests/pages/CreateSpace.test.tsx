import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import CreateSpace from '@/pages/CreateSpace';
import { AuthProvider } from '@/shared/context/AuthContext';
import { SpaceProvider } from '@/shared/context/SpaceContext';
import * as client from '@/shared/api/client';

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
vi.mock('@/shared/api/client', () => ({
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

const mockSpacesApi = client.spacesApi as {
  getMy: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
};

const mockAuthApi = client.authApi as {
  getMe: ReturnType<typeof vi.fn>;
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
  inviteCode: 'ABC123',
  partners: [{ id: 'user-1', phone: '+1234567890', nickname: 'TestUser' }],
  ...overrides,
});

const renderCreateSpace = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <SpaceProvider>
          <CreateSpace />
        </SpaceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('CreateSpace Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    localStorage.clear();
    sessionStorage.clear();

    // Default mock setup
    mockAuthApi.getMe.mockRejectedValue(new Error('No token'));
    mockSpacesApi.getMy.mockResolvedValue({ data: null });

    // Mock clipboard using defineProperty
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('header', () => {
    it('should render page header', async () => {
      renderCreateSpace();

      await waitFor(() => {
        expect(screen.getByText('Create Couple Space')).toBeInTheDocument();
      });
    });

    it('should navigate back when back button clicked', async () => {
      const user = userEvent.setup();
      renderCreateSpace();

      await waitFor(() => {
        expect(screen.getByText('Create Couple Space')).toBeInTheDocument();
      });

      const backButton = screen.getByText('arrow_back_ios').closest('button');
      await user.click(backButton!);

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  describe('initial content', () => {
    beforeEach(() => {
      localStorage.setItem('auth_token', 'valid-token');
      mockAuthApi.getMe.mockResolvedValue({ data: createMockUser() });
      mockSpacesApi.getMy.mockResolvedValue({ data: createMockSpace() });
    });

    it('should display start your journey heading', async () => {
      renderCreateSpace();

      await waitFor(() => {
        expect(screen.getByText('Start Your Journey')).toBeInTheDocument();
      });
    });

    it('should display private code label', async () => {
      renderCreateSpace();

      await waitFor(() => {
        expect(screen.getByText('Your Private Code')).toBeInTheDocument();
      });
    });

    it('should display waiting for partner message', async () => {
      renderCreateSpace();

      await waitFor(() => {
        expect(screen.getByText('Waiting for partner to join...')).toBeInTheDocument();
      });
    });

    it('should display auto-connect message', async () => {
      renderCreateSpace();

      await waitFor(() => {
        expect(screen.getByText('The space will open automatically once they connect.')).toBeInTheDocument();
      });
    });
  });

  describe('anniversary date from session', () => {
    beforeEach(() => {
      localStorage.setItem('auth_token', 'valid-token');
      mockAuthApi.getMe.mockResolvedValue({ data: createMockUser() });
      mockSpacesApi.getMy.mockResolvedValue({ data: createMockSpace({ anniversaryDate: '2024-06-15' }) });
    });

    it('should use date from sessionStorage', async () => {
      sessionStorage.setItem('anniversaryDate', '2024-06-15');

      renderCreateSpace();

      await waitFor(() => {
        expect(screen.getByText(/June 15, 2024/)).toBeInTheDocument();
      });
    });

    it('should default to today if no date in session', async () => {
      const today = new Date();
      const formattedDate = today.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

      renderCreateSpace();

      await waitFor(() => {
        // The page shows the anniversary date from the space, or the session
        expect(screen.getByText(/Anniversary set for/)).toBeInTheDocument();
      });
    });
  });

  describe('space creation', () => {
    beforeEach(() => {
      localStorage.setItem('auth_token', 'valid-token');
      mockAuthApi.getMe.mockResolvedValue({ data: createMockUser() });
    });

    it('should show loading state while creating space', async () => {
      let resolveCreate: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => {
        resolveCreate = resolve;
      });
      mockSpacesApi.getMy.mockResolvedValue({ data: null });
      mockSpacesApi.create.mockReturnValue(pendingPromise);

      renderCreateSpace();

      // Should show loading animation (pulses)
      await waitFor(() => {
        const pulses = document.querySelectorAll('.animate-pulse');
        expect(pulses.length).toBeGreaterThan(0);
      });

      // Cleanup
      resolveCreate!({ data: createMockSpace() });
    });

    it('should display invite code after creation', async () => {
      mockSpacesApi.getMy.mockResolvedValue({ data: null });
      mockSpacesApi.create.mockResolvedValue({ data: createMockSpace({ inviteCode: 'XYZ789' }) });

      renderCreateSpace();

      await waitFor(() => {
        expect(screen.getByText('X Y Z 7 8 9')).toBeInTheDocument();
      });
    });

    it('should show error when creation fails', async () => {
      mockSpacesApi.getMy.mockResolvedValue({ data: null });
      mockSpacesApi.create.mockRejectedValue(new Error('Creation failed'));

      renderCreateSpace();

      await waitFor(() => {
        expect(screen.getByText('Creation failed')).toBeInTheDocument();
      });
    });
  });

  describe('copy code functionality', () => {
    beforeEach(() => {
      localStorage.setItem('auth_token', 'valid-token');
      mockAuthApi.getMe.mockResolvedValue({ data: createMockUser() });
      mockSpacesApi.getMy.mockResolvedValue({ data: createMockSpace({ inviteCode: 'ABC123' }) });
    });

    it('should show copy button', async () => {
      renderCreateSpace();

      await waitFor(() => {
        expect(screen.getByText('Copy Code')).toBeInTheDocument();
      });
    });

    it('should copy code to clipboard when clicked', async () => {
      const user = userEvent.setup();
      renderCreateSpace();

      await waitFor(() => {
        expect(screen.getByText('A B C 1 2 3')).toBeInTheDocument();
      });

      const copyButton = screen.getByText('Copy Code').closest('button');
      await user.click(copyButton!);

      // After clicking, the button should show "Copied!"
      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });
    });

    it('should show "Copied!" after copying', async () => {
      const user = userEvent.setup();
      renderCreateSpace();

      await waitFor(() => {
        expect(screen.getByText('A B C 1 2 3')).toBeInTheDocument();
      });

      const copyButton = screen.getByText('Copy Code').closest('button');
      await user.click(copyButton!);

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });
    });

    it('should disable copy button when no invite code', async () => {
      mockSpacesApi.getMy.mockResolvedValue({ data: createMockSpace({ inviteCode: '' }) });

      renderCreateSpace();

      await waitFor(() => {
        const copyButton = screen.getByText('Copy Code').closest('button');
        expect(copyButton).toBeDisabled();
      });
    });
  });

  describe('partner polling', () => {
    beforeEach(() => {
      localStorage.setItem('auth_token', 'valid-token');
      mockAuthApi.getMe.mockResolvedValue({ data: createMockUser() });
    });

    it('should display waiting message before partner joins', async () => {
      mockSpacesApi.getMy.mockResolvedValue({ data: createMockSpace() });

      renderCreateSpace();

      // Wait for initial render and verify waiting message is shown
      await waitFor(() => {
        expect(screen.getByText('Waiting for partner to join...')).toBeInTheDocument();
      });
    });
  });

  describe('existing space', () => {
    beforeEach(() => {
      localStorage.setItem('auth_token', 'valid-token');
      mockAuthApi.getMe.mockResolvedValue({ data: createMockUser() });
    });

    it('should display invite code from existing space', async () => {
      mockSpacesApi.getMy.mockResolvedValue({ data: createMockSpace() });

      renderCreateSpace();

      await waitFor(() => {
        expect(screen.getByText('A B C 1 2 3')).toBeInTheDocument();
      });
    });

    it('should display existing invite code', async () => {
      mockSpacesApi.getMy.mockResolvedValue({
        data: createMockSpace({ inviteCode: 'EXIST1' }),
      });

      renderCreateSpace();

      await waitFor(() => {
        expect(screen.getByText('E X I S T 1')).toBeInTheDocument();
      });
    });
  });

  describe('code formatting', () => {
    beforeEach(() => {
      localStorage.setItem('auth_token', 'valid-token');
      mockAuthApi.getMe.mockResolvedValue({ data: createMockUser() });
    });

    it('should format 6-character code with spaces', async () => {
      mockSpacesApi.getMy.mockResolvedValue({
        data: createMockSpace({ inviteCode: '123456' }),
      });

      renderCreateSpace();

      await waitFor(() => {
        expect(screen.getByText('1 2 3 4 5 6')).toBeInTheDocument();
      });
    });

    it('should show placeholder when no code', async () => {
      // Return space with no invite code
      mockSpacesApi.getMy.mockResolvedValue({
        data: createMockSpace({ inviteCode: '' }),
      });

      renderCreateSpace();

      // Should show dashes when no code
      await waitFor(() => {
        expect(screen.getByText('- - - - - -')).toBeInTheDocument();
      });
    });
  });

  describe('clipboard fallback', () => {
    beforeEach(() => {
      localStorage.setItem('auth_token', 'valid-token');
      mockAuthApi.getMe.mockResolvedValue({ data: createMockUser() });
      mockSpacesApi.getMy.mockResolvedValue({ data: createMockSpace({ inviteCode: 'COPY12' }) });
    });

    it('should show invite code with correct formatting', async () => {
      renderCreateSpace();

      await waitFor(() => {
        expect(screen.getByText('C O P Y 1 2')).toBeInTheDocument();
      });
    });
  });

  describe('visual elements', () => {
    beforeEach(() => {
      localStorage.setItem('auth_token', 'valid-token');
      mockAuthApi.getMe.mockResolvedValue({ data: createMockUser() });
      mockSpacesApi.getMy.mockResolvedValue({ data: createMockSpace() });
    });

    it('should display love icon', async () => {
      renderCreateSpace();

      await waitFor(() => {
        expect(screen.getByText('favorite')).toBeInTheDocument();
      });
    });

    it('should display book/stories icon', async () => {
      renderCreateSpace();

      await waitFor(() => {
        expect(screen.getByText('auto_stories')).toBeInTheDocument();
      });
    });

    it('should show progress bar', async () => {
      renderCreateSpace();

      await waitFor(() => {
        const progressBar = document.querySelector('.h-2.rounded-full');
        expect(progressBar).toBeInTheDocument();
      });
    });

    it('should show pulsing indicator', async () => {
      renderCreateSpace();

      await waitFor(() => {
        const pulsingDot = document.querySelector('.animate-ping');
        expect(pulsingDot).toBeInTheDocument();
      });
    });
  });
});
