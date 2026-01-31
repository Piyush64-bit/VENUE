import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../../components/ui/Input';
import { describe, it, expect, vi } from 'vitest';

describe('Input Component', () => {
  it('renders with label', () => {
    render(<Input label="Email Address" placeholder="test@example.com" />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(<Input label="Email" error="Invalid email" />);
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveClass('border-red-500');
  });

  it('handles user input', () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} placeholder="Type here" />);
    
    const input = screen.getByPlaceholderText('Type here');
    fireEvent.change(input, { target: { value: 'Hello' } });
    
    expect(handleChange).toHaveBeenCalled();
    expect(input.value).toBe('Hello');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
