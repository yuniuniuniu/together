import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../pages/Login';
import { AuthProvider } from '../../shared/context/AuthContext';
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

      expect(screen.getByPlaceholderText('+1 (000) 000-0000')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('6-digit code')).toBeInTheDocument();
      expect(screen.getByText('Get SMS Code')).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByLabelText(/Terms of Service/)).toBeInTheDocument();
    });
  });

  describe('phone input', () => {
    it('should update phone value on input', async () => {
      const user = userEvent.setup();
      renderLogin();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('+1 (000) 000-0000')).toBeInTheDocument();
      });

      const phoneInput = screen.getByPlaceholderText('+1 (000) 000-0000');
      await user.type(phoneInput, '+1234567890');

      expect(phoneInput).toHaveValue('+1234567890');
    });
  });

  describe('send code', () => {
    it('should show error when phone is empty', async () => {
      const user = userEvent.setup();
      renderLogin();

      await waitFor(() => {
        expect(screen.getByText('Get SMS Code')).toBeInTheDocument();
      });

      // Button should be disabled when phone is empty
      const sendCodeButton = screen.getByText('Get SMS Code');
      expect(sendCodeButton).toBeDisabled();
    });

    it('should call sendCode and auto-fill code on success', async () => {
      const user = userEvent.setup();
      mockAuthApi.sendCode.mockResolvedValue({ data: { code: '123456' } });

      renderLogin();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('+1 (000) 000-0000')).toBeInTheDocument();
      });

      const phoneInput = screen.getByPlaceholderText('+1 (000) 000-0000');
      await user.type(phoneInput, '+1234567890');

      const sendCodeButton = screen.getByText('Get SMS Code');
      await user.click(sendCodeButton);

      await waitFor(() => {
        expect(mockAuthApi.sendCode).toHaveBeenCalledWith('+1234567890');
      });

      // Code should be auto-filled
      const codeInput = screen.getByPlaceholderText('6-digit code');
      await waitFor(() => {
        expect(codeInput).toHaveValue('123456');
      });
    });

    it('should show error on send code failure', async () => {
      const user = userEvent.setup();
      mockAuthApi.sendCode.mockRejectedValue(new Error('Invalid phone number'));

      renderLogin();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('+1 (000) 000-0000')).toBeInTheDocument();
      });

      const phoneInput = screen.getByPlaceholderText('+1 (000) 000-0000');
      await user.type(phoneInput, 'invalid');

      const sendCodeButton = screen.getByText('Get SMS Code');
      await user.click(sendCodeButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid phone number')).toBeInTheDocument();
      });
    });

    it('should change button text to Resend after code is sent', async () => {
      const user = userEvent.setup();
      mockAuthApi.sendCode.mockResolvedValue({ data: { code: '123456' } });

      renderLogin();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('+1 (000) 000-0000')).toBeInTheDocument();
      });

      const phoneInput = screen.getByPlaceholderText('+1 (000) 000-0000');
      await user.type(phoneInput, '+1234567890');

      const sendCodeButton = screen.getByText('Get SMS Code');
      await user.click(sendCodeButton);

      await waitFor(() => {
        expect(screen.getByText('Resend')).toBeInTheDocument();
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
      mockAuthApi.sendCode.mockResolvedValue({ data: { code: '123456' } });

      renderLogin();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('+1 (000) 000-0000')).toBeInTheDocument();
      });

      // Fill phone and code
      const phoneInput = screen.getByPlaceholderText('+1 (000) 000-0000');
      await user.type(phoneInput, '+1234567890');

      const codeInput = screen.getByPlaceholderText('6-digit code');
      await user.type(codeInput, '123456');

      // Don't check terms - button should still be disabled
      const signInButton = screen.getByText('Sign In');
      expect(signInButton).toBeDisabled();
    });

    it('should call login and navigate on success', async () => {
      const user = userEvent.setup();
      mockAuthApi.sendCode.mockResolvedValue({ data: { code: '123456' } });
      mockAuthApi.verify.mockResolvedValue({
        data: {
          user: { id: '1', phone: '+1234567890', nickname: 'Test' },
          token: 'test-token',
        },
      });

      renderLogin();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('+1 (000) 000-0000')).toBeInTheDocument();
      });

      // Fill phone
      const phoneInput = screen.getByPlaceholderText('+1 (000) 000-0000');
      await user.type(phoneInput, '+1234567890');

      // Send code
      const sendCodeButton = screen.getByText('Get SMS Code');
      await user.click(sendCodeButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('6-digit code')).toHaveValue('123456');
      });

      // Accept terms
      const termsCheckbox = screen.getByLabelText(/Terms of Service/);
      await user.click(termsCheckbox);

      // Sign in
      const signInButton = screen.getByText('Sign In');
      await user.click(signInButton);

      await waitFor(() => {
        expect(mockAuthApi.verify).toHaveBeenCalledWith('+1234567890', '123456');
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/setup/profile');
      });
    });

    it('should show error on login failure', async () => {
      const user = userEvent.setup();
      mockAuthApi.sendCode.mockResolvedValue({ data: { code: '123456' } });
      mockAuthApi.verify.mockRejectedValue(new Error('Invalid verification code'));

      renderLogin();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('+1 (000) 000-0000')).toBeInTheDocument();
      });

      // Fill phone and code
      const phoneInput = screen.getByPlaceholderText('+1 (000) 000-0000');
      await user.type(phoneInput, '+1234567890');

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
});
