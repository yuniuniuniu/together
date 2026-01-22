import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '@/shared/components/feedback/Modal';

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    children: <div>Modal Content</div>,
  };

  describe('visibility', () => {
    it('should render when isOpen is true', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<Modal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
    });
  });

  describe('close button', () => {
    it('should show close button by default', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByText('close')).toBeInTheDocument();
    });

    it('should hide close button when showCloseButton is false', () => {
      render(<Modal {...defaultProps} showCloseButton={false} />);
      expect(screen.queryByText('close')).not.toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      render(<Modal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByText('close'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('overlay', () => {
    it('should call onClose when overlay is clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      const { container } = render(<Modal {...defaultProps} onClose={onClose} />);

      // Find the overlay (first absolute div)
      const overlay = container.querySelector('.absolute.inset-0');
      expect(overlay).toBeInTheDocument();

      await user.click(overlay!);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not close when clicking modal content', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      render(<Modal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByText('Modal Content'));
      expect(onClose).not.toHaveBeenCalled();
    });

    it('should apply custom overlay class', () => {
      const { container } = render(
        <Modal {...defaultProps} overlayClassName="custom-overlay" />
      );

      const overlay = container.querySelector('.custom-overlay');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('content', () => {
    it('should render children', () => {
      render(
        <Modal {...defaultProps}>
          <h1>Title</h1>
          <p>Description</p>
        </Modal>
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('should apply custom className to modal', () => {
      const { container } = render(
        <Modal {...defaultProps} className="custom-modal" />
      );

      const modal = container.querySelector('.custom-modal');
      expect(modal).toBeInTheDocument();
    });
  });

  describe('z-index', () => {
    it('should have high z-index for stacking', () => {
      const { container } = render(<Modal {...defaultProps} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('z-50');
    });
  });

  describe('accessibility', () => {
    it('should center modal on screen', () => {
      const { container } = render(<Modal {...defaultProps} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex', 'items-center', 'justify-center');
    });
  });
});
