import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from '@/shared/components/feedback/Toast';

// Test component that uses the toast hook
const TestComponent = () => {
  const { showToast, hideToast, toasts } = useToast();

  return (
    <div>
      <button onClick={() => showToast('Success message', 'success')}>
        Show Success
      </button>
      <button onClick={() => showToast('Error message', 'error')}>
        Show Error
      </button>
      <button onClick={() => showToast('Warning message', 'warning')}>
        Show Warning
      </button>
      <button onClick={() => showToast('Info message', 'info')}>
        Show Info
      </button>
      <button onClick={() => showToast('No auto hide', 'info', 0)}>
        Show Persistent
      </button>
      {toasts.length > 0 && (
        <button onClick={() => hideToast(toasts[0].id)}>Hide First</button>
      )}
      <div data-testid="toast-count">{toasts.length}</div>
    </div>
  );
};

describe('Toast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithProvider = () => {
    return render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
  };

  describe('useToast hook', () => {
    it('should throw error when used outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useToast must be used within a ToastProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('showToast', () => {
    it('should show success toast', async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await user.click(screen.getByText('Show Success'));

      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByText('check_circle')).toBeInTheDocument();
    });

    it('should show error toast', async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await user.click(screen.getByText('Show Error'));

      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.getByText('error')).toBeInTheDocument();
    });

    it('should show warning toast', async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await user.click(screen.getByText('Show Warning'));

      expect(screen.getByText('Warning message')).toBeInTheDocument();
      expect(screen.getByText('warning')).toBeInTheDocument();
    });

    it('should show info toast', async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await user.click(screen.getByText('Show Info'));

      expect(screen.getByText('Info message')).toBeInTheDocument();
      expect(screen.getByText('info')).toBeInTheDocument();
    });

    it('should show multiple toasts', async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await user.click(screen.getByText('Show Success'));
      await user.click(screen.getByText('Show Error'));

      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.getByTestId('toast-count')).toHaveTextContent('2');
    });
  });

  describe('auto dismiss', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should auto dismiss toast after duration', async () => {
      renderWithProvider();

      // Use act to trigger state updates
      await act(async () => {
        screen.getByText('Show Success').click();
      });

      expect(screen.getByText('Success message')).toBeInTheDocument();

      // Advance time by 3000ms (default duration)
      await act(async () => {
        vi.advanceTimersByTime(3100);
      });

      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
    });

    it('should not auto dismiss toast with duration 0', async () => {
      renderWithProvider();

      await act(async () => {
        screen.getByText('Show Persistent').click();
      });

      expect(screen.getByText('No auto hide')).toBeInTheDocument();

      // Advance time by a long time
      await act(async () => {
        vi.advanceTimersByTime(10000);
      });

      // Toast should still be there
      expect(screen.getByText('No auto hide')).toBeInTheDocument();
    });
  });

  describe('hideToast', () => {
    it('should hide toast manually', async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await user.click(screen.getByText('Show Persistent'));

      expect(screen.getByText('No auto hide')).toBeInTheDocument();

      await user.click(screen.getByText('Hide First'));

      await waitFor(() => {
        expect(screen.queryByText('No auto hide')).not.toBeInTheDocument();
      });
    });
  });

  describe('toast dismissal via close button', () => {
    it('should dismiss toast when close button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await user.click(screen.getByText('Show Persistent'));

      const closeButton = screen.getByText('close');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('No auto hide')).not.toBeInTheDocument();
      });
    });
  });

  describe('toast styles', () => {
    it('should have success styles for success toast', async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await user.click(screen.getByText('Show Success'));

      const toast = screen.getByRole('alert');
      expect(toast).toHaveClass('bg-green-50');
    });

    it('should have error styles for error toast', async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await user.click(screen.getByText('Show Error'));

      const toast = screen.getByRole('alert');
      expect(toast).toHaveClass('bg-red-50');
    });

    it('should have warning styles for warning toast', async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await user.click(screen.getByText('Show Warning'));

      const toast = screen.getByRole('alert');
      expect(toast).toHaveClass('bg-amber-50');
    });

    it('should have info styles for info toast', async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await user.click(screen.getByText('Show Info'));

      const toast = screen.getByRole('alert');
      expect(toast).toHaveClass('bg-blue-50');
    });
  });

  describe('accessibility', () => {
    it('should have role="alert"', async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await user.click(screen.getByText('Show Success'));

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
