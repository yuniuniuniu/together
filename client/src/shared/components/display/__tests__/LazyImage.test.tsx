import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { LazyImage } from '@/shared/components/display/LazyImage';

describe('LazyImage', () => {
  it('renders placeholder initially', () => {
    render(<LazyImage src="test.jpg" alt="Test" />);
    const placeholder = screen.getByTestId('lazy-image-placeholder');
    expect(placeholder).toBeInTheDocument();
  });

  it('loads and displays image when src is provided', async () => {
    render(<LazyImage src="test.jpg" alt="Test" />);
    const img = screen.getByAltText('Test');
    expect(img).toBeInTheDocument();

    // Simulate image load
    await act(async () => {
      img.dispatchEvent(new Event('load'));
    });

    await waitFor(() => {
      expect(screen.queryByTestId('lazy-image-placeholder')).not.toBeInTheDocument();
    });
  });

  it('shows loading state during image load', () => {
    render(<LazyImage src="test.jpg" alt="Test" showLoadingIndicator />);
    expect(screen.getByTestId('lazy-image-loading')).toBeInTheDocument();
  });

  it('shows error state when image fails to load', async () => {
    render(<LazyImage src="invalid.jpg" alt="Test" />);
    const img = screen.getByAltText('Test');

    // Simulate image error
    await act(async () => {
      img.dispatchEvent(new Event('error'));
    });

    await waitFor(() => {
      expect(screen.getByText('broken_image')).toBeInTheDocument();
    });
  });

  it('calls onLoad callback when image loads', async () => {
    const onLoad = vi.fn();
    render(<LazyImage src="test.jpg" alt="Test" onLoad={onLoad} />);
    const img = screen.getByAltText('Test');

    // Simulate image load
    await act(async () => {
      img.dispatchEvent(new Event('load'));
    });

    await waitFor(() => {
      expect(onLoad).toHaveBeenCalledTimes(1);
    });
  });

  it('uses eager loading when priority is true', () => {
    render(<LazyImage src="test.jpg" alt="Test" priority />);
    const img = screen.getByAltText('Test');
    expect(img).toHaveAttribute('loading', 'eager');
  });

  it('uses lazy loading by default', () => {
    render(<LazyImage src="test.jpg" alt="Test" />);
    const img = screen.getByAltText('Test');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('applies custom className to container', () => {
    const { container } = render(
      <LazyImage src="test.jpg" alt="Test" className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('applies custom placeholderClassName to placeholder', () => {
    render(
      <LazyImage
        src="test.jpg"
        alt="Test"
        placeholderClassName="custom-placeholder"
      />
    );
    const placeholder = screen.getByTestId('lazy-image-placeholder');
    expect(placeholder).toHaveClass('custom-placeholder');
  });
});
