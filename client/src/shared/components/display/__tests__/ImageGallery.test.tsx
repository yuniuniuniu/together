import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageGallery } from '../ImageGallery';

describe('ImageGallery', () => {
  const mockImages = ['img1.jpg', 'img2.jpg', 'img3.jpg'];

  it('renders all images in grid', () => {
    render(<ImageGallery images={mockImages} />);

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(3);
  });

  it('uses correct grid layout for different image counts', () => {
    const { container, rerender } = render(<ImageGallery images={['img1.jpg']} />);
    expect(container.firstChild).toHaveClass('grid-cols-1');

    rerender(<ImageGallery images={['img1.jpg', 'img2.jpg']} />);
    expect(container.firstChild).toHaveClass('grid-cols-2');

    rerender(<ImageGallery images={mockImages} />);
    expect(container.firstChild).toHaveClass('grid-cols-3');
  });

  it('opens viewer when image is clicked', () => {
    render(<ImageGallery images={mockImages} />);

    const images = screen.getAllByRole('img');
    fireEvent.click(images[1]);

    // Viewer should open showing 2/3
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('filters out video files', () => {
    const mixedMedia = ['img1.jpg', 'video.mp4', 'img2.jpg'];
    render(<ImageGallery images={mixedMedia} />);

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
  });
});
