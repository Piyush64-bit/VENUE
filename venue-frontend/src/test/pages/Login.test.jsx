import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../pages/Login';
import { AuthProvider } from '../../context/AuthContext';
import { describe, it, expect, vi } from 'vitest';

// Mock the API and other hooks if necessary
vi.mock('../../api/axios', () => ({
  default: {
    post: vi.fn(),
  },
}));

const MockLogin = () => (
  <BrowserRouter>
    <AuthProvider>
      <Login />
    </AuthProvider>
  </BrowserRouter>
);

describe('Login Page', () => {
  it('renders login form', () => {
    render(<MockLogin />);
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<MockLogin />);
    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    render(<MockLogin />);
    
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Here we would check if login API was called, but since we need to mock AuthContext fully
    // this is a partial integration test verifying UI behavior.
    
    // Check loading state (button disabled)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled();
    });
  });
});
