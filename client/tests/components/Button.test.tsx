import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/shared/components/form/Button';

describe('Button', () => {
  describe('rendering', () => {
    it('should render children', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('should render as a button element', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('should have primary styles by default', () => {
      render(<Button>Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary');
    });

    it('should have secondary styles when variant is secondary', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-white');
      expect(button).toHaveClass('border');
    });

    it('should have ghost styles when variant is ghost', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-transparent');
    });

    it('should have danger styles when variant is danger', () => {
      render(<Button variant="danger">Danger</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-500');
    });
  });

  describe('sizes', () => {
    it('should have medium size by default', () => {
      render(<Button>Medium</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('py-4', 'px-6');
    });

    it('should have small size when size is sm', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('py-2', 'px-4');
    });

    it('should have large size when size is lg', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('py-5', 'px-8');
    });
  });

  describe('fullWidth', () => {
    it('should not be full width by default', () => {
      render(<Button>Normal</Button>);
      const button = screen.getByRole('button');
      expect(button).not.toHaveClass('w-full');
    });

    it('should be full width when fullWidth is true', () => {
      render(<Button fullWidth>Full Width</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
    });
  });

  describe('icon', () => {
    it('should render icon on the right by default', () => {
      const { container } = render(<Button icon="arrow_forward">Next</Button>);
      const button = screen.getByRole('button');
      const icon = container.querySelector('.material-symbols-outlined');

      expect(icon).toBeInTheDocument();
      expect(icon).toHaveTextContent('arrow_forward');

      // Icon should be after the text
      expect(button.lastChild).toBe(icon);
    });

    it('should render icon on the left when iconPosition is left', () => {
      const { container } = render(
        <Button icon="arrow_back" iconPosition="left">Back</Button>
      );
      const button = screen.getByRole('button');
      const icon = container.querySelector('.material-symbols-outlined');

      expect(icon).toBeInTheDocument();
      // Icon should be before the text
      expect(button.firstChild).toBe(icon);
    });

    it('should not render icon when not provided', () => {
      const { container } = render(<Button>No Icon</Button>);
      const icon = container.querySelector('.material-symbols-outlined');
      expect(icon).not.toBeInTheDocument();
    });
  });

  describe('click handling', () => {
    it('should call onClick when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click me</Button>);

      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick} disabled>Disabled</Button>);

      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('disabled state', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should not be disabled by default', () => {
      render(<Button>Enabled</Button>);
      expect(screen.getByRole('button')).not.toBeDisabled();
    });
  });

  describe('custom className', () => {
    it('should apply custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });
  });

  describe('HTML button attributes', () => {
    it('should pass through type attribute', () => {
      render(<Button type="submit">Submit</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('should pass through other HTML attributes', () => {
      render(<Button data-testid="test-button" aria-label="Test">Test</Button>);
      expect(screen.getByTestId('test-button')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Test');
    });
  });
});
