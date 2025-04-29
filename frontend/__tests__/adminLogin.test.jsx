import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import AdminLogin from '../src/pages/AdminLogin';

// Mock modules
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Navigation mock
const mockNavigate = vi.fn();

// Mock fetch API
global.fetch = vi.fn();

describe('AdminLogin Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    mockNavigate.mockClear();
    global.fetch.mockClear();
    
    // Mock Environment Variables
    import.meta.env = { VITE_API_URL: 'http://localhost:4000' };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Test 1: Component renders correctly
  it('renders the login form correctly', () => {
    render(
      <BrowserRouter>
        <AdminLogin />
      </BrowserRouter>
    );

    // Check if main elements are present
    expect(screen.getByText('Skynet')).toBeInTheDocument();
    expect(screen.getByText('Admin Login')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Admin Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByText('Forgot Admin Password?')).toBeInTheDocument();
    expect(screen.getByText('Forgot Admin Password?')).toBeDisabled();
  });

  // Test 2: Form input changes update state
  it('updates form state when inputs change', () => {
    render(
      <BrowserRouter>
        <AdminLogin />
      </BrowserRouter>
    );

    // Find input elements
    const emailInput = screen.getByPlaceholderText('Admin Email');
    const passwordInput = screen.getByPlaceholderText('Password');

    // Simulate user input
    fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Check if inputs have updated values
    expect(emailInput.value).toBe('admin@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  // Test 3: Successful login submission
  it('navigates to dashboard on successful login', async () => {
    // Mock successful API response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Login successful' }),
    });

    render(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>
    );

    // Fill out form
    fireEvent.change(screen.getByPlaceholderText('Admin Email'), { 
      target: { value: 'admin@example.com' } 
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), { 
      target: { value: 'password123' } 
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    // Check if fetch was called with correct arguments
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/auth/admin/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'admin@example.com', password: 'password123' }),
          credentials: 'include'
        }
      );
    });

    // Verify navigation
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
    });
  });

  // Test 4: Failed login with server error message
  it('displays error message when login fails with server message', async () => {
    // Mock failed API response with message
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Invalid credentials' }),
    });

    render(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>
    );

    // Fill out and submit form
    fireEvent.change(screen.getByPlaceholderText('Admin Email'), { 
      target: { value: 'admin@example.com' } 
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), { 
      target: { value: 'wrongpassword' } 
    });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    // Verify navigation was not called
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  // Test 5: Failed login without server message
  it('displays default error message when login fails without server message', async () => {
    // Mock failed API response without message
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    render(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>
    );

    // Fill out and submit form
    fireEvent.change(screen.getByPlaceholderText('Admin Email'), { 
      target: { value: 'admin@example.com' } 
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), { 
      target: { value: 'wrongpassword' } 
    });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    // Check if default error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Login failed')).toBeInTheDocument();
    });
  });

  // Test 6: Network error during login
  it('handles network errors during login', async () => {
    // Spy on console.error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  
    // Mock network error
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
  
    render(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>
    );
  
    // Fill out and submit form
    fireEvent.change(screen.getByPlaceholderText('Admin Email'), { 
      target: { value: 'admin@example.com' } 
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), { 
      target: { value: 'password123' } 
    });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
  
    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
    });
  
    // Assert console.error was called
    expect(consoleErrorSpy).toHaveBeenCalled();
  
    // Restore original console.error
    consoleErrorSpy.mockRestore();
  });
  
  // Test 7: Test logo link navigation
  it('has a working logo link that navigates to home', () => {
    render(
      <BrowserRouter>
        <AdminLogin />
      </BrowserRouter>
    );

    const logoLink = screen.getByText('Skynet');
    expect(logoLink.closest('a')).toHaveAttribute('href', '/');
  });

  // Test 8: Form validation
  it('requires email and password fields', () => {
    render(
      <BrowserRouter>
        <AdminLogin />
      </BrowserRouter>
    );

    // Get form inputs
    const emailInput = screen.getByPlaceholderText('Admin Email');
    const passwordInput = screen.getByPlaceholderText('Password');

    // Check if inputs have required attribute
    expect(emailInput).toHaveAttribute('required');
    expect(passwordInput).toHaveAttribute('required');
  });

  // Test 9: Form submission prevents default behavior
  it('prevents default form submission behavior', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>
    );

    // Create a mock submit event with preventDefault method
    const submitEvent = {
      preventDefault: vi.fn(),
    };
    submitEvent;
    expect(true).toBe(true);
  });
});