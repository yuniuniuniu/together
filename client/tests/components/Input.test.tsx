import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/shared/components/form/Input';

describe('Input', () => {
  describe('rendering', () => {
    it('should render input element', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render with placeholder', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });
  });

  describe('label', () => {
    it('should render label when provided', () => {
      render(<Input label="Email" />);
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('should not render label when not provided', () => {
      render(<Input />);
      expect(screen.queryByRole('label')).not.toBeInTheDocument();
    });

    it('should have uppercase styling on label', () => {
      render(<Input label="Email" />);
      const label = screen.getByText('Email');
      expect(label).toHaveClass('uppercase');
    });
  });

  describe('error', () => {
    it('should render error message when provided', () => {
      render(<Input error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should not render error when not provided', () => {
      const { container } = render(<Input />);
      const errorElement = container.querySelector('.text-red-500');
      expect(errorElement).not.toBeInTheDocument();
    });

    it('should have red text for error message', () => {
      render(<Input error="Error" />);
      const error = screen.getByText('Error');
      expect(error).toHaveClass('text-red-500');
    });
  });

  describe('rightAction', () => {
    it('should render rightAction when provided', () => {
      render(
        <Input rightAction={<button>Action</button>} />
      );
      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('should not render rightAction when not provided', () => {
      render(<Input />);
      expect(screen.queryByText('Action')).not.toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('should have underline variant by default', () => {
      const { container } = render(<Input />);
      const wrapper = container.querySelector('.border-b');
      expect(wrapper).toBeInTheDocument();
    });

    it('should have bordered variant when specified', () => {
      const { container } = render(<Input variant="bordered" />);
      // The input wrapper should not have border-b for underline style
      const wrapper = container.querySelector('.flex.items-center');
      expect(wrapper).not.toHaveClass('border-b');
    });
  });

  describe('input interactions', () => {
    it('should update value on change', async () => {
      const user = userEvent.setup();
      render(<Input />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Hello');

      expect(input).toHaveValue('Hello');
    });

    it('should call onChange handler', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();

      render(<Input onChange={handleChange} />);

      await user.type(screen.getByRole('textbox'), 'a');
      expect(handleChange).toHaveBeenCalled();
    });

    it('should call onFocus handler', async () => {
      const handleFocus = vi.fn();
      const user = userEvent.setup();

      render(<Input onFocus={handleFocus} />);

      await user.click(screen.getByRole('textbox'));
      expect(handleFocus).toHaveBeenCalled();
    });

    it('should call onBlur handler', async () => {
      const handleBlur = vi.fn();
      const user = userEvent.setup();

      render(<Input onBlur={handleBlur} />);

      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.tab();

      expect(handleBlur).toHaveBeenCalled();
    });
  });

  describe('disabled state', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Input disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('should not be disabled by default', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).not.toBeDisabled();
    });
  });

  describe('input types', () => {
    it('should support text type', () => {
      render(<Input type="text" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');
    });

    it('should support email type', () => {
      render(<Input type="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
    });

    it('should support password type', () => {
      render(<Input type="password" />);
      // Password inputs don't have textbox role
      const input = document.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
    });

    it('should support number type', () => {
      render(<Input type="number" />);
      const input = document.querySelector('input[type="number"]');
      expect(input).toBeInTheDocument();
    });
  });

  describe('custom className', () => {
    it('should apply custom className to input', () => {
      render(<Input className="custom-input" />);
      expect(screen.getByRole('textbox')).toHaveClass('custom-input');
    });
  });

  describe('HTML input attributes', () => {
    it('should pass through required attribute', () => {
      render(<Input required />);
      expect(screen.getByRole('textbox')).toBeRequired();
    });

    it('should pass through maxLength attribute', () => {
      render(<Input maxLength={10} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('maxLength', '10');
    });

    it('should pass through name attribute', () => {
      render(<Input name="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('name', 'email');
    });

    it('should pass through id attribute', () => {
      render(<Input id="email-input" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'email-input');
    });

    it('should pass through autoComplete attribute', () => {
      render(<Input autoComplete="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('autoComplete', 'email');
    });
  });

  describe('controlled input', () => {
    it('should work as controlled input', () => {
      const { rerender } = render(<Input value="initial" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('initial');

      rerender(<Input value="updated" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('updated');
    });
  });

  describe('label and input association', () => {
    it('should have label associated with input', () => {
      render(<Input label="Username" />);
      const label = screen.getByText('Username');
      expect(label.tagName.toLowerCase()).toBe('label');
    });
  });
});
