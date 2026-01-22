import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from '@/pages/Login';
import { AuthProvider } from '@/shared/context/AuthContext';
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
};

const renderLogin = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockAuthApi.getMe.mockRejectedValue(new Error('No token'));
  });

  describe('rendering', () => {
    it('should render login form elements', async () => {
      renderLogin();

      await waitFor(() => {
        expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      });

      expect(screen.getByPlaceholderText('hello@example.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('6-digit code')).toBeInTheDocument();
      expect(screen.getByText('Get Code')).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByLabelText(/Terms of Service/)).toBeInTheDocument();
    });
  });

  describe('email input', () => {
    it('should update email value on input', async () => {
      const user = userEvent.setup();
      renderLogin();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('hello@example.com')).toBeInTheDocument();
      });

      const emailInput = screen.getByPlaceholderText('hello@example.com');
      await user.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });
  });

  describe('send code', () => {
    it('should disable button when email is empty', async () => {
      renderLogin();

      await waitFor(() => {
        expect(screen.getByText('Get Code')).toBeInTheDocument();
      });

      // Button should be disabled when email is empty
      const sendCodeButton = screen.getByText('Get Code');
      expect(sendCodeButton).toBeDisabled();
    });

    it('should call sendCode on button click', async () => {
      const user = userEvent.setup();
      mockAuthApi.sendCode.mockResolvedValue({ data: {} });

      renderLogin();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('hello@example.com')).toBeInTheDocument();
      });

      const emailInput = screen.getByPlaceholderText('hello@example.com');
      await user.type(emailInput, 'test@example.com');

      const sendCodeButton = screen.getByText('Get Code');
      await user.click(sendCodeButton);

      await waitFor(() => {
        expect(mockAuthApi.sendCode).toHaveBeenCalledWith('test@example.com');
      });
    });

    it('should show error on send code failure', async () => {
      const user = userEvent.setup();
      mockAuthApi.sendCode.mockRejectedValue(new Error('Failed to send code'));

      renderLogin();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('hello@example.com')).toBeInTheDocument();
      });

      const emailInput = screen.getByPlaceholderText('hello@example.com');
      await user.type(emailInput, 'test@example.com');

      const sendCodeButton = screen.getByText('Get Code');
      await user.click(sendCodeButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to send code')).toBeInTheDocument();
      });
    });

    it('should show countdown after code is sent', async () => {
      const user = userEvent.setup();
      mockAuthApi.sendCode.mockResolvedValue({ data: {} });

      renderLogin();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('hello@example.com')).toBeInTheDocument();
      });

      const emailInput = screen.getByPlaceholderText('hello@example.com');
      await user.type(emailInput, 'test@example.com');

      const sendCodeButton = screen.getByText('Get Code');
      await user.click(sendCodeButton);

      await waitFor(() => {
        // Should show countdown
        expect(screen.getByText(/\d+s/)).toBeInTheDocument();
      });
    });
  });

  describe('login', () => {
    it('should disable sign in button when form is incomplete', async () => {
      renderLogin();

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument();
      });

      const signInButton = screen.getByText('Sign In');
      expect(signInButton).toBeDisabled();
    });

    it('should show error when terms not accepted', async () => {
      const user = userEvent.setup();

      renderLogin();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('hello@example.com')).toBeInTheDocument();
      });

      // Fill email and code
      const emailInput = screen.getByPlaceholderText('hello@example.com');
      await user.type(emailInput, 'test@example.com');

      const codeInput = screen.getByPlaceholderText('6-digit code');
      await user.type(codeInput, '123456');

      // Don't check terms - button should still be disabled
      const signInButton = screen.getByText('Sign In');
      expect(signInButton).toBeDisabled();
    });

    it('should call login and navigate on success', async () => {
      const user = userEvent.setup();
      mockAuthApi.sendCode.mockResolvedValue({ data: {} });
      mockAuthApi.verify.mockResolvedValue({
        data: {
          user: { id: '1', email: 'test@example.com', nickname: 'Test' },
          token: 'test-token',
        },
      });

      renderLogin();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('hello@example.com')).toBeInTheDocument();
      });

      // Fill email
      const emailInput = screen.getByPlaceholderText('hello@example.com');
      await user.type(emailInput, 'test@example.com');

      // Fill code
      const codeInput = screen.getByPlaceholderText('6-digit code');
      await user.type(codeInput, '123456');

      // Accept terms
      const termsCheckbox = screen.getByLabelText(/Terms of Service/);
      await user.click(termsCheckbox);

      // Sign in
      const signInButton = screen.getByText('Sign In');
      await user.click(signInButton);

      await waitFor(() => {
        expect(mockAuthApi.verify).toHaveBeenCalledWith('test@example.com', '123456');
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/setup/profile');
      });
    });

    it('should show error on login failure', async () => {
      const user = userEvent.setup();
      mockAuthApi.verify.mockRejectedValue(new Error('Invalid verification code'));

      renderLogin();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('hello@example.com')).toBeInTheDocument();
      });

      // Fill email and code
      const emailInput = screen.getByPlaceholderText('hello@example.com');
      await user.type(emailInput, 'test@example.com');

      const codeInput = screen.getByPlaceholderText('6-digit code');
      await user.type(codeInput, '123456');

      // Accept terms
      const termsCheckbox = screen.getByLabelText(/Terms of Service/);
      await user.click(termsCheckbox);

      // Sign in
      const signInButton = screen.getByText('Sign In');
      await user.click(signInButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid verification code')).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('terms checkbox', () => {
    it('should toggle terms acceptance', async () => {
      const user = userEvent.setup();
      renderLogin();

      await waitFor(() => {
        expect(screen.getByLabelText(/Terms of Service/)).toBeInTheDocument();
      });

      const termsCheckbox = screen.getByLabelText(/Terms of Service/);
      expect(termsCheckbox).not.toBeChecked();

      await user.click(termsCheckbox);
      expect(termsCheckbox).toBeChecked();

      await user.click(termsCheckbox);
      expect(termsCheckbox).not.toBeChecked();
    });
  });

  describe('email validation', () => {
    it('should show error for invalid email format', async () => {
      const user = userEvent.setup();
      renderLogin();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('hello@example.com')).toBeInTheDocument();
      });

      const emailInput = screen.getByPlaceholderText('hello@example.com');
      await user.type(emailInput, 'invalid-email');

      const sendCodeButton = screen.getByText('Get Code');
      await user.click(sendCodeButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });
  });
});
