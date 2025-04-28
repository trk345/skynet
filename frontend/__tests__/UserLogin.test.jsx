import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserLogin from '../src/pages/UserLogin'; 
import { MemoryRouter } from 'react-router-dom';

// Mock the router's useNavigate function
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Mail: () => <div data-testid="mail-icon" />,
  Lock: () => <div data-testid="lock-icon" />,
  Chrome: () => <div data-testid="chrome-icon" />
}));

describe('UserLogin Component', () => {
  async function renderLoginAndSubmit({ fetchMock, expectedErrorText }) {
    global.fetch.mockImplementationOnce(fetchMock);
  
    render(
      <MemoryRouter>
        <UserLogin />
      </MemoryRouter>
    );
  
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByText('Login');
  
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
  
    await waitFor(() => {
      const errorElement = screen.getByText(expectedErrorText);
      expect(errorElement).toBeInTheDocument();
    });
  }
  // Set up environment variable
  beforeEach(() => {
    vi.stubGlobal('import.meta', { 
      env: { VITE_API_URL: 'http://localhost:4000' } 
    });
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock fetch
    global.fetch = vi.fn();
    global.window.location.href = '';
    
    // Reset console error spy after each test
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('renders login form with all elements', () => {
    render(
      <MemoryRouter>
        <UserLogin />
      </MemoryRouter>
    );

    // Check for title
    expect(screen.getByText('User Login')).toBeInTheDocument();
    
    // Check for form inputs
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    
    // Check for icons
    expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
    expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
    
    // Check for buttons
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Login with Google')).toBeInTheDocument();
    
    // Check for links
    expect(screen.getByText('Admin Login')).toBeInTheDocument();
    expect(screen.getByText('Forgot Password?')).toBeInTheDocument();
    expect(screen.getByText('Create an Account')).toBeInTheDocument();
    expect(screen.getByText('Continue as Guest')).toBeInTheDocument();
  });

  test('allows updating form inputs', () => {
    render(
      <MemoryRouter>
        <UserLogin />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  test('handles successful login and redirects', async () => {
    // Mock successful fetch response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { id: '123', name: 'Test User' } })
    });
    
    render(
      <MemoryRouter>
        <UserLogin />
      </MemoryRouter>
    );
    
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByText('Login');
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      // Verify fetch was called with the right arguments
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
          credentials: 'include'
        }
      );
      
      // Verify navigation occurred
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('handles login error with server message', async () => {
    // Mock failed fetch response with specific error message
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Invalid credentials' })
    });
    
    render(
      <MemoryRouter>
        <UserLogin />
      </MemoryRouter>
    );
    
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByText('Login');
    
    // Ensure no error message is displayed initially
    expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument();
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong-password' } });
    fireEvent.click(submitButton);
    
    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  test('handles login error with default message when no server message', async () => {
    await renderLoginAndSubmit({
      fetchMock: () => Promise.resolve({
        ok: false,
        json: async () => ({})
      }),
      expectedErrorText: 'Login failed'
    });
  });
  

  
  test('handles network error during login', async () => {
    console.error = vi.fn();
    
    await renderLoginAndSubmit({
      fetchMock: () => Promise.reject(new Error('Network error')),
      expectedErrorText: 'Something went wrong. Please try again.'
    });

    expect(console.error).toHaveBeenCalled();
  })

  test('redirects to Google OAuth when clicking Google login button', () => {
    // Mock window.location
    const locationAssignMock = vi.fn();
    delete window.location;
    window.location = { href: '' };
    
    render(
      <MemoryRouter>
        <UserLogin />
      </MemoryRouter>
    );
    
    const googleButton = screen.getByText('Login with Google');
    fireEvent.click(googleButton);
    
    expect(window.location.href).toBe('http://localhost:4000/auth/google');
  });

  test('prevents default form submission behavior', () => {
    render(
      <MemoryRouter>
        <UserLogin />
      </MemoryRouter>
    );
  
    const form = screen.getByPlaceholderText('Email').closest('form');
  
    const submitEvent = new Event('submit', {
      bubbles: true,
      cancelable: true,
    });
  
    const preventDefaultSpy = vi.spyOn(submitEvent, 'preventDefault');
  
    form.dispatchEvent(submitEvent);
  
    expect(preventDefaultSpy).toHaveBeenCalled();
  });
  
});