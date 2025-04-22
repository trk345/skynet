import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import Navbar from './Navbar';

// Mock modules
vi.mock('axios');
vi.mock('lucide-react', () => ({
  Menu: () => <div data-testid="menu-icon">Menu Icon</div>
}));
vi.mock('./Notifications', () => ({
  default: () => <div data-testid="notifications-component">Notifications</div>
}));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});

describe('Navbar Component', () => {
  const mockUser = {
    username: 'testuser',
    role: 'user'
  };

  const mockVendor = {
    username: 'testvendor',
    role: 'vendor'
  };

  const mockPendingUser = {
    username: 'pendinguser',
    role: 'user',
    pendingStatus: 'pending'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Set up mock environment variables
    vi.stubEnv('VITE_API_URL', 'http://localhost:5000');
  });

  afterEach(() => {
    cleanup(); // Add cleanup to remove the rendered components after each test
  });

  test('renders navbar with logo and home link', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Skynet')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  test('shows login link when user is not logged in', async () => {
    axios.get.mockRejectedValueOnce(new Error('Not authenticated'));

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.queryByText('Logout')).not.toBeInTheDocument();
    });
  });

  test('shows user greeting and dropdown menu when logged in', async () => {
    axios.get.mockResolvedValueOnce({
      data: { user: mockUser }
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Hello, testuser')).toBeInTheDocument();
      expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
    });

    // Click menu icon to open dropdown
    fireEvent.click(screen.getByTestId('menu-icon'));
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  test('displays dashboard link for users and vendors', async () => {
    axios.get.mockResolvedValueOnce({
      data: { user: mockUser }
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  test('displays create property link for vendors', async () => {
    axios.get.mockResolvedValueOnce({
      data: { user: mockVendor }
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Create Property')).toBeInTheDocument();
    });
  });

  test('does not display create property link for regular users', async () => {
    axios.get.mockResolvedValueOnce({
      data: { user: mockUser }
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Create Property')).not.toBeInTheDocument();
    });
  });

  test('shows processing request message for pending users', async () => {
    axios.get.mockResolvedValueOnce({
      data: { user: mockPendingUser }
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Processing Request...')).toBeInTheDocument();
      expect(screen.queryByText('Contact')).not.toBeInTheDocument();
    });
  });

  test('closes dropdown when clicking outside', async () => {
    axios.get.mockResolvedValueOnce({
      data: { user: mockUser }
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
    });

    // Open dropdown
    fireEvent.click(screen.getByTestId('menu-icon'));
    expect(screen.getByText('Logout')).toBeInTheDocument();

    // Click outside the dropdown
    fireEvent.click(document.body);
    await waitFor(() => {
      expect(screen.queryByText('Logout')).not.toBeInTheDocument();
    });
  });

  test('handles logout correctly', async () => {
    const user = userEvent.setup();
    axios.get.mockResolvedValueOnce({
      data: { user: mockUser }
    });
    axios.post.mockResolvedValueOnce({});

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Hello, testuser')).toBeInTheDocument();
    });

    // Open dropdown and click logout
    fireEvent.click(screen.getByTestId('menu-icon'));
    await user.click(screen.getByText('Logout'));

    // Verify axios logout call
    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:5000/api/auth/logout', 
      {}, 
      { withCredentials: true }
    );
  });

  test('handles API error during user fetch', async () => {
    console.error = vi.fn();
    axios.get.mockRejectedValueOnce({ 
      response: { data: 'Auth failed' }
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
      expect(screen.getByText('Login')).toBeInTheDocument();
    });
  });

  test('handles API error during logout', async () => {
    console.error = vi.fn();
    const user = userEvent.setup();
    
    // First mock auth check success
    axios.get.mockResolvedValueOnce({
      data: { user: mockUser }
    });
    
    // Then mock logout failure
    axios.post.mockRejectedValueOnce({
      response: { data: 'Logout failed' }
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Hello, testuser')).toBeInTheDocument();
    });

    // Open dropdown and click logout
    fireEvent.click(screen.getByTestId('menu-icon'));
    await user.click(screen.getByText('Logout'));

    // Verify error was logged
    expect(console.error).toHaveBeenCalled();
  });

  test('renders notifications component when logged in', async () => {
    axios.get.mockResolvedValueOnce({
      data: { user: mockUser }
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('notifications-component')).toBeInTheDocument();
    });
  });

  test('does not render notifications when not logged in', async () => {
    axios.get.mockRejectedValueOnce(new Error('Not authenticated'));

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('notifications-component')).not.toBeInTheDocument();
    });
  });
});