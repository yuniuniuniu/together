import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EnhancedImageViewer } from '../EnhancedImageViewer';

describe('EnhancedImageViewer', () => {
  const mockImages = ['img1.jpg', 'img2.jpg', 'img3.jpg'];

  it('does not render when closed', () => {
    const { container } = render(
      <EnhancedImageViewer
        images={mockImages}
        initialIndex={0}
        isOpen={false}
        onClose={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders when open with initial index', () => {
    render(
      <EnhancedImageViewer
        images={mockImages}
        initialIndex={1}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();

    render(
      <EnhancedImageViewer
        images={mockImages}
        initialIndex={0}
        isOpen={true}
        onClose={onClose}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('closes on Escape key', () => {
    const onClose = vi.fn();

    render(
      <EnhancedImageViewer
        images={mockImages}
        initialIndex={0}
        isOpen={true}
        onClose={onClose}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onClose).toHaveBeenCalled();
  });
});
