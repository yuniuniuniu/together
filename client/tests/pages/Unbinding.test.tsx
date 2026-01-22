import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Unbinding from '@/pages/Unbinding';

const mockNavigate = vi.fn();
const mockUseSpace = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/shared/context/SpaceContext', () => ({
  useSpace: () => mockUseSpace(),
}));

describe('Unbinding Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('shows start button when no pending request', async () => {
    const requestUnbind = vi.fn().mockResolvedValue(null);
    const cancelUnbind = vi.fn().mockResolvedValue(undefined);
    const getUnbindStatus = vi.fn().mockResolvedValue(null);

    mockUseSpace.mockReturnValue({
      space: { id: 'space-1' },
      requestUnbind,
      cancelUnbind,
      getUnbindStatus,
      isLoading: false,
    });

    render(<Unbinding />);

    await waitFor(() => {
      expect(screen.getByText('Start Unbinding')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('Start Unbinding'));

    expect(requestUnbind).toHaveBeenCalledTimes(1);
  });

  it('shows pending status and cancel option', async () => {
    const cancelUnbind = vi.fn().mockResolvedValue(undefined);
    const getUnbindStatus = vi.fn().mockResolvedValue({
      id: 'request-1',
      spaceId: 'space-1',
      requestedBy: 'user-1',
      requestedAt: '2024-01-02T10:00:00.000Z',
      expiresAt: '2024-01-09T10:00:00.000Z',
      status: 'pending',
    });

    mockUseSpace.mockReturnValue({
      space: { id: 'space-1' },
      requestUnbind: vi.fn(),
      cancelUnbind,
      getUnbindStatus,
      isLoading: false,
    });

    render(<Unbinding />);

    await waitFor(() => {
      expect(screen.getByText('Unbind request active')).toBeInTheDocument();
    });

    expect(screen.getByText('Cancel Unbind Request')).toBeInTheDocument();
  });

  it('calls cancel when pending and cancel is clicked', async () => {
    const cancelUnbind = vi.fn().mockResolvedValue(undefined);
    const getUnbindStatus = vi.fn().mockResolvedValue({
      id: 'request-1',
      spaceId: 'space-1',
      requestedBy: 'user-1',
      requestedAt: '2024-01-02T10:00:00.000Z',
      expiresAt: '2024-01-09T10:00:00.000Z',
      status: 'pending',
    });

    mockUseSpace.mockReturnValue({
      space: { id: 'space-1' },
      requestUnbind: vi.fn(),
      cancelUnbind,
      getUnbindStatus,
      isLoading: false,
    });

    render(<Unbinding />);

    await waitFor(() => {
      expect(screen.getByText('Cancel Unbind Request')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('Cancel Unbind Request'));

    expect(cancelUnbind).toHaveBeenCalledTimes(1);
  });
});
