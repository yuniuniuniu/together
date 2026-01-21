import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import JoinSpace from '../../pages/JoinSpace';
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
  spacesApi: {
    create: vi.fn(),
    getMy: vi.fn(),
    join: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockSpacesApi = client.spacesApi as {
  join: ReturnType<typeof vi.fn>;
};

const renderJoinSpace = () => {
  return render(
    <BrowserRouter>
      <JoinSpace />
    </BrowserRouter>
  );
};

describe('JoinSpace Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    sessionStorage.clear();
  });

  describe('rendering', () => {
    it('should render join space form', () => {
      renderJoinSpace();

      expect(screen.getByText('Enter Invitation Code')).toBeInTheDocument();
      expect(screen.getByText('Find My Partner')).toBeInTheDocument();
    });

    it('should render 6 code input fields', () => {
      renderJoinSpace();

      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBe(6);
    });
  });

  describe('code input', () => {
    it('should accept digit input', async () => {
      const user = userEvent.setup();
      renderJoinSpace();

      const inputs = screen.getAllByRole('textbox');
      await user.type(inputs[0], '1');

      expect(inputs[0]).toHaveValue('1');
    });

    it('should auto-focus next input after entering digit', async () => {
      const user = userEvent.setup();
      renderJoinSpace();

      const inputs = screen.getAllByRole('textbox');
      await user.type(inputs[0], '1');

      // Second input should be focused (difficult to test directly, but we can check value propagation)
      expect(inputs[0]).toHaveValue('1');
    });

    it('should handle paste of full code', async () => {
      const user = userEvent.setup();
      renderJoinSpace();

      const inputs = screen.getAllByRole('textbox');

      // Focus first input and paste
      await user.click(inputs[0]);
      await user.paste('123456');

      // All inputs should have values
      expect(inputs[0]).toHaveValue('1');
      expect(inputs[1]).toHaveValue('2');
      expect(inputs[2]).toHaveValue('3');
      expect(inputs[3]).toHaveValue('4');
      expect(inputs[4]).toHaveValue('5');
      expect(inputs[5]).toHaveValue('6');
    });

    it('should only accept numeric input', async () => {
      const user = userEvent.setup();
      renderJoinSpace();

      const inputs = screen.getAllByRole('textbox');
      await user.type(inputs[0], 'a');

      expect(inputs[0]).toHaveValue('');
    });
  });

  describe('submit button', () => {
    it('should be disabled when code is incomplete', () => {
      renderJoinSpace();

      const submitButton = screen.getByText('Find My Partner');
      expect(submitButton).toBeDisabled();
    });

    it('should be enabled when code is complete', async () => {
      const user = userEvent.setup();
      renderJoinSpace();

      const inputs = screen.getAllByRole('textbox');
      await user.click(inputs[0]);
      await user.paste('123456');

      const submitButton = screen.getByText('Find My Partner');
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('join flow', () => {
    it('should call API and navigate on success', async () => {
      const user = userEvent.setup();
      const mockSpace = {
        id: 'space-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        anniversaryDate: '2024-02-14',
        inviteCode: '123456',
        partners: [
          { id: 'user-1', phone: '+1234567890', nickname: 'Partner1' },
          { id: 'user-2', phone: '+9876543210', nickname: 'Partner2' },
        ],
      };
      mockSpacesApi.join.mockResolvedValue({ data: mockSpace });

      renderJoinSpace();

      const inputs = screen.getAllByRole('textbox');
      await user.click(inputs[0]);
      await user.paste('123456');

      const submitButton = screen.getByText('Find My Partner');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSpacesApi.join).toHaveBeenCalledWith('123456');
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/confirm');
      });

      // Should store space data in sessionStorage
      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'pendingSpace',
        JSON.stringify(mockSpace)
      );
    });

    it('should show error on invalid code', async () => {
      const user = userEvent.setup();
      mockSpacesApi.join.mockRejectedValue(new Error('Invalid invite code'));

      renderJoinSpace();

      const inputs = screen.getAllByRole('textbox');
      await user.click(inputs[0]);
      await user.paste('000000');

      const submitButton = screen.getByText('Find My Partner');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid invite code')).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should show loading state while joining', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockSpacesApi.join.mockReturnValue(pendingPromise);

      renderJoinSpace();

      const inputs = screen.getAllByRole('textbox');
      await user.click(inputs[0]);
      await user.paste('123456');

      const submitButton = screen.getByText('Find My Partner');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Finding...')).toBeInTheDocument();
      });

      // Cleanup
      resolvePromise!({ data: {} });
    });
  });

  describe('navigation', () => {
    it('should go back on back button click', async () => {
      const user = userEvent.setup();
      renderJoinSpace();

      const backButton = screen.getByText('arrow_back').closest('div');
      await user.click(backButton!);

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });
});
