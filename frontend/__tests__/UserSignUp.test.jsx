import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, BrowserRouter } from 'react-router-dom';
import UserSignup from '../src/pages/UserSignup'; // adjust path if needed

// Mocks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  globalThis.fetch = vi.fn();
  vi.stubGlobal('import.meta', { 
    env: { VITE_API_URL: 'http://localhost:4000' }
  });
});


// Mock icons
vi.mock('lucide-react', () => ({
  User: () => <div data-testid="user-icon" />,
  Mail: () => <div data-testid="mail-icon" />,
  Lock: () => <div data-testid="lock-icon" />,
  Chrome: () => <div data-testid="chrome-icon" />,
}));

describe('UserSignup Component', () => {
  const fillAndSubmitForm = () => {
    render(
      <MemoryRouter>
        <UserSignup />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm Password'), { target: { value: 'password123' } });

    fireEvent.click(screen.getByText('Sign Up'));
  };
  
  beforeEach(() => {
    vi.stubGlobal('import.meta', {
      env: { VITE_API_URL: 'http://localhost:4000' },
    });

    vi.clearAllMocks();
    globalThis.fetch = vi.fn();
    globalThis.window.location.href = '';
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('renders signup form with all elements', () => {
    render(
      <MemoryRouter>
        <UserSignup />
      </MemoryRouter>
    );

    expect(screen.getByText('Create Account')).toBeInTheDocument();

    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm Password')).toBeInTheDocument();

    expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
    expect(screen.getAllByTestId('lock-icon')).toHaveLength(2); // Two lock icons

    expect(screen.getByText('Sign Up')).toBeInTheDocument();
    expect(screen.getByText('Sign up with Google')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Continue as Guest')).toBeInTheDocument();
  });

  test('allows updating form inputs', () => {
    render(
      <MemoryRouter>
        <UserSignup />
      </MemoryRouter>
    );

    const usernameInput = screen.getByPlaceholderText('Username');
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    expect(usernameInput.value).toBe('testuser');
    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
    expect(confirmPasswordInput.value).toBe('password123');
  });
  
  test('handles successful signup and redirects', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { id: '123', username: 'testuser' } }),
    });

    fillAndSubmitForm();

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/auth/signup',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
          }),
        })
      );

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('handles signup error with server message', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Email already exists' }),
    });

    fillAndSubmitForm();

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  test('handles signup error with default message', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    fillAndSubmitForm();

    await waitFor(() => {
      expect(screen.getByText('Signup failed')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  test('handles network error during signup', async () => {
    globalThis.fetch.mockRejectedValueOnce(new Error('Network error'));

    fillAndSubmitForm();

    await waitFor(() => {
      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
      expect(console.error).toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  test('redirects to Google OAuth when clicking Google signup button', () => {
    delete window.location;
    window.location = { href: '' };

    render(
      <MemoryRouter>
        <UserSignup />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Sign up with Google'));
    expect(window.location.href).toBe('http://localhost:4000/auth/google');
  });

  test('prevents default form submission behavior', () => {
    render(
      <MemoryRouter>
        <UserSignup />
      </MemoryRouter>
    );

    const form = screen.getByPlaceholderText('Username').closest('form');

    const submitEvent = new Event('submit', {
      bubbles: true,
      cancelable: true,
    });

    const preventDefaultSpy = vi.spyOn(submitEvent, 'preventDefault');

    form.dispatchEvent(submitEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should display error message when passwords do not match', async () => {
    render(
      <BrowserRouter>
        <UserSignup />
      </BrowserRouter>
    );

    // Fill in form fields
    fireEvent.change(screen.getByPlaceholderText('Username'), {
      target: { name: 'username', value: 'testuser' }
    });
    
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { name: 'email', value: 'test@example.com' }
    });
    
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { name: 'password', value: 'password123' }
    });
    
    fireEvent.change(screen.getByPlaceholderText('Confirm Password'), {
      target: { name: 'confirmPassword', value: 'differentpassword' }
    });

    // Submit the form
    const buttons = screen.getAllByRole('button', { name: /sign up/i });
    fireEvent.submit(buttons[0]);

    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });

    // Verify that fetch was not called (since validation failed)
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
