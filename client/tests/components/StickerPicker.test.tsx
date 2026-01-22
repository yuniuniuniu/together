import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StickerPicker } from '@/features/memory/components/StickerPicker';

// Mock STICKER_CATEGORIES
vi.mock('@/shared/types/ui', () => ({
  STICKER_CATEGORIES: [
    {
      id: 'love',
      label: 'Love',
      icons: ['favorite', 'heart_broken', 'favorite_border'],
    },
    {
      id: 'happy',
      label: 'Happy',
      icons: ['mood', 'sentiment_very_satisfied', 'celebration'],
    },
    {
      id: 'travel',
      label: 'Travel',
      icons: ['flight', 'beach_access', 'landscape'],
    },
  ],
}));

describe('StickerPicker', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSelect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('visibility', () => {
    it('should render when isOpen is true', () => {
      render(<StickerPicker {...defaultProps} />);
      expect(screen.getByPlaceholderText('Search stickers...')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<StickerPicker {...defaultProps} isOpen={false} />);
      expect(screen.queryByPlaceholderText('Search stickers...')).not.toBeInTheDocument();
    });
  });

  describe('categories', () => {
    it('should display all category tabs', () => {
      render(<StickerPicker {...defaultProps} />);

      expect(screen.getByText('Love')).toBeInTheDocument();
      expect(screen.getByText('Happy')).toBeInTheDocument();
      expect(screen.getByText('Travel')).toBeInTheDocument();
    });

    it('should have Love category active by default', () => {
      render(<StickerPicker {...defaultProps} />);

      const loveTab = screen.getByText('Love');
      expect(loveTab).toHaveClass('text-accent');
    });

    it('should switch category on tab click', async () => {
      const user = userEvent.setup();
      render(<StickerPicker {...defaultProps} />);

      await user.click(screen.getByText('Happy'));

      const happyTab = screen.getByText('Happy');
      expect(happyTab).toHaveClass('text-accent');
    });

    it('should display stickers from active category', () => {
      render(<StickerPicker {...defaultProps} />);

      // Love category icons
      expect(screen.getByText('favorite')).toBeInTheDocument();
      expect(screen.getByText('heart_broken')).toBeInTheDocument();
      expect(screen.getByText('favorite_border')).toBeInTheDocument();
    });

    it('should display different stickers when category changes', async () => {
      const user = userEvent.setup();
      render(<StickerPicker {...defaultProps} />);

      await user.click(screen.getByText('Travel'));

      expect(screen.getByText('flight')).toBeInTheDocument();
      expect(screen.getByText('beach_access')).toBeInTheDocument();
      expect(screen.getByText('landscape')).toBeInTheDocument();
    });
  });

  describe('sticker selection', () => {
    it('should call onSelect when sticker is clicked', async () => {
      const onSelect = vi.fn();
      const user = userEvent.setup();

      render(<StickerPicker {...defaultProps} onSelect={onSelect} />);

      await user.click(screen.getByText('favorite'));

      expect(onSelect).toHaveBeenCalledWith('favorite');
    });

    it('should not throw when onSelect is not provided', async () => {
      const user = userEvent.setup();

      render(<StickerPicker {...defaultProps} onSelect={undefined} />);

      // Should not throw
      await user.click(screen.getByText('favorite'));
    });
  });

  describe('closing', () => {
    it('should call onClose when overlay is clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      const { container } = render(<StickerPicker {...defaultProps} onClose={onClose} />);

      // Click on the overlay
      const overlay = container.querySelector('.backdrop-blur-\\[2px\\]');
      await user.click(overlay!);

      expect(onClose).toHaveBeenCalled();
    });

    it('should call onClose when drag handle is clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      const { container } = render(<StickerPicker {...defaultProps} onClose={onClose} />);

      // Click on the drag handle area
      const dragHandle = container.querySelector('.cursor-grab');
      await user.click(dragHandle!);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('should render search input', () => {
      render(<StickerPicker {...defaultProps} />);
      expect(screen.getByPlaceholderText('Search stickers...')).toBeInTheDocument();
    });

    it('should have search icon', () => {
      render(<StickerPicker {...defaultProps} />);
      expect(screen.getByText('search')).toBeInTheDocument();
    });
  });

  describe('sticker grid', () => {
    it('should render stickers in a grid', () => {
      const { container } = render(<StickerPicker {...defaultProps} />);

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('grid-cols-4');
    });
  });
});
