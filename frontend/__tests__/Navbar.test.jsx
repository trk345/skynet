import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import Navbar from '../src/components/Navbar';

// Mock axios
vi.mock('axios');

// Mock the Notifications component
vi.mock('../src/components/Notifications', () => ({
  default: () => <div data-testid="notifications">Notifications</div>
}));

// Mock environment variables
vi.mock('import.meta', () => ({
  env: {
    VITE_API_URL: 'http://localhost:4000'
  }
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('Navbar Component', () => {
  async function renderNavbarWithMockUser(userData) {
    axios.get.mockResolvedValueOnce({ data: { user: userData } });
  
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );
  
    // Wait for the auth check to complete
    await waitFor(() => {
      expect(screen.getByText(`Hello, ${userData.username}`)).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.queryByText('Login')).not.toBeInTheDocument();
    });
  }
  // Reset mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders navbar with login link when not logged in', async () => {
    // Mock axios to simulate not logged in
    axios.get.mockRejectedValueOnce(new Error('Not authenticated'));

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    // Check that the app name is displayed
    expect(screen.getByText('Skynet')).toBeInTheDocument();
    
    // Check navigation links
    expect(screen.getByText('Home')).toBeInTheDocument();
    
    // Wait for the auth check to complete and verify login link is shown
    await waitFor(() => {
      expect(screen.getByText('Login')).toBeInTheDocument();
    });
    
    // User dashboard should not be present
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  test('renders user navbar when logged in as regular user', async () => {
    // Mock successful login as regular user
    await renderNavbarWithMockUser({ username: 'testuser', role: 'user' });
    expect(screen.queryByText('Create Property')).not.toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByTestId('notifications')).toBeInTheDocument();
  });

  test('renders vendor navbar when logged in as vendor', async () => {
    // Mock successful login as vendor
    await renderNavbarWithMockUser({ username: 'vendoruser', role: 'vendor' });
    expect(screen.getByText('Create Property')).toBeInTheDocument();
  });

  test('shows processing message when user has pending status', async () => {
    // Mock user with pending status
    axios.get.mockResolvedValueOnce({
      data: {
        user: {
          username: 'pendinguser',
          role: 'user',
          pendingStatus: 'pending'
        }
      }
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    // Wait for the auth check to complete
    await waitFor(() => {
      // Processing message should be displayed
      expect(screen.getByText('Processing Request...')).toBeInTheDocument();
      
      // Contact link should not be visible
      expect(screen.queryByText('Contact')).not.toBeInTheDocument();
    });
  });

  test('toggles dropdown menu when menu button is clicked', async () => {
    // Mock successful login
    axios.get.mockResolvedValueOnce({
      data: {
        user: {
          username: 'testuser',
          role: 'user'
        }
      }
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    // Wait for the auth check to complete
    await waitFor(() => {
      expect(screen.getByText('Hello, testuser')).toBeInTheDocument();
    });

    // Menu should be closed initially
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();

    // Click the menu button
    const menuButton = screen.getByLabelText('Toggle menu');
    fireEvent.click(menuButton);

    // Dropdown should now be visible
    expect(screen.getByText('Logout')).toBeInTheDocument();

    // Click the menu button again
    fireEvent.click(menuButton);

    // Dropdown should be hidden
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  test('closes dropdown when clicking outside', async () => {
    // Mock successful login
    axios.get.mockResolvedValueOnce({
      data: {
        user: {
          username: 'testuser',
          role: 'user'
        }
      }
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    // Wait for the auth check to complete
    await waitFor(() => {
      expect(screen.getByText('Hello, testuser')).toBeInTheDocument();
    });

    // Open the dropdown
    const menuButton = screen.getByLabelText('Toggle menu');
    fireEvent.click(menuButton);

    // Dropdown should be visible
    expect(screen.getByText('Logout')).toBeInTheDocument();

    // Click outside (on the document body)
    fireEvent.click(document.body);

    // Dropdown should now be hidden
    await waitFor(() => {
      expect(screen.queryByText('Logout')).not.toBeInTheDocument();
    });
  });

  test('logs out user when logout button is clicked', async () => {
    // Mock successful login
    axios.get.mockResolvedValueOnce({
      data: {
        user: {
          username: 'testuser',
          role: 'user'
        }
      }
    });

    // Mock successful logout
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    // Wait for the auth check to complete
    await waitFor(() => {
      expect(screen.getByText('Hello, testuser')).toBeInTheDocument();
    });

    // Open the dropdown
    const menuButton = screen.getByLabelText('Toggle menu');
    fireEvent.click(menuButton);

    // Click the logout button
    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    // Verify logout API was called
    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:4000/api/auth/logout',
      {},
      { withCredentials: true }
    );

    // Wait for navigation to happen
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  test('handles errors during user data fetch', async () => {
    // Mock console.error to prevent actual console errors
    const originalConsoleError = console.error;
    console.error = vi.fn();

    // Mock failed user data fetch
    axios.get.mockRejectedValueOnce({
      response: { data: 'Authentication failed' }
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    // Wait for the auth check to complete
    await waitFor(() => {
      // Should show login link since auth failed
      expect(screen.getByText('Login')).toBeInTheDocument();
      
      // Error should be logged
      expect(console.error).toHaveBeenCalledWith(
        'Auth error:',
        'Authentication failed'
      );
    });

    // Restore console.error
    console.error = originalConsoleError;
  });

  test('handles errors during logout', async () => {
    // Mock console.error to prevent actual console errors
    const originalConsoleError = console.error;
    console.error = vi.fn();

    // Mock successful login
    axios.get.mockResolvedValueOnce({
      data: {
        user: {
          username: 'testuser',
          role: 'user'
        }
      }
    });

    // Mock failed logout
    axios.post.mockRejectedValueOnce({
      response: { data: 'Logout failed' }
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    // Wait for the auth check to complete
    await waitFor(() => {
      expect(screen.getByText('Hello, testuser')).toBeInTheDocument();
    });

    // Open the dropdown
    const menuButton = screen.getByLabelText('Toggle menu');
    fireEvent.click(menuButton);

    // Click the logout button
    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    // Verify error handling
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        'Logout failed:',
        'Logout failed'
      );
    });

    // Restore console.error
    console.error = originalConsoleError;
  });

  test('navigation links point to correct routes', async () => {
    // Mock successful login as vendor to get all links
    axios.get.mockResolvedValueOnce({
      data: {
        user: {
          username: 'vendoruser',
          role: 'vendor'
        }
      }
    });

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    // Wait for the auth check to complete
    await waitFor(() => {
      // Check the home link
      const homeLink = screen.getByText('Home');
      expect(homeLink.closest('a')).toHaveAttribute('href', '/');

      // Check the dashboard link
      const dashboardLink = screen.getByText('Dashboard');
      expect(dashboardLink.closest('a')).toHaveAttribute('href', '/user-dashboard');

      // Check the create property link for vendors
      const createPropertyLink = screen.getByText('Create Property');
      expect(createPropertyLink.closest('a')).toHaveAttribute('href', '/create-property');
    });
  });

  test('displays fallback username when user object has no username', async () => {
    // Mock user with no username
    axios.get.mockResolvedValueOnce({
      data: {
        user: {
          role: 'user'
          // No username provided
        }
      }
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    // Wait for the auth check to complete
    await waitFor(() => {
      // Should show fallback username
      expect(screen.getByText('Hello, User')).toBeInTheDocument();
    });
  });
});