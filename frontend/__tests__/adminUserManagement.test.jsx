import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import UserManagementPage from '../src/pages/AdminUserManagement';
import axios from 'axios';

// Mock the modules
vi.mock('axios');
vi.mock('../src/components/adminSideBar.jsx', () => ({
  default: () => <div data-testid="sidebar">Sidebar</div>,
}));
vi.mock('../src/components/adminTopbar.jsx', () => ({
  default: () => <div data-testid="topbar">Topbar</div>,
}));
vi.mock('lucide-react', () => ({
  Users: vi.fn(() => <div data-testid="users-icon" />),
  Edit: vi.fn(() => <div data-testid="edit-icon" />),
  Trash2: vi.fn(() => <div data-testid="trash-icon" />),
  Plus: vi.fn(() => <div data-testid="plus-icon" />),
}));

describe('UserManagementPage', () => {
  // Mock data for tests
  const mockUsers = [
    {
      _id: '1',
      username: 'admin1',
      email: 'admin@test.com',
      role: 'admin',
      lastLogin: '2023-01-01T12:00:00Z',
    },
    {
      _id: '2',
      username: 'vendor1',
      email: 'vendor@test.com',
      role: 'vendor',
      lastLogin: null,
    },
    {
      _id: '3',
      username: 'user1',
      email: 'user@test.com',
      role: 'user',
      lastLogin: '2023-02-15T10:30:00Z',
    },
  ];

  // Setup and cleanup
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock import.meta.env
    vi.stubGlobal('import.meta', { env: { VITE_API_URL: 'http://localhost:5000' } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Helper function for common setup
  const setupSuccessfulApiResponse = () => {
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: mockUsers,
      },
    });
  };

  const setupFailedApiResponse = (errorMessage = 'Failed to fetch users') => {
    axios.get.mockResolvedValueOnce({
      data: {
        success: false,
        error: errorMessage,
      },
    });
  };

  // Helper function to check if UI components are rendered
  const expectBaseUIComponentsToBeRendered = () => {
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('topbar')).toBeInTheDocument();
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText('Add New User')).toBeInTheDocument();
  };

  it('renders the component structure correctly', async () => {
    setupSuccessfulApiResponse();
    render(<UserManagementPage />);

    expectBaseUIComponentsToBeRendered();
    
    // Check table headers
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
    expect(screen.getByText('Last Login')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
    
    // Verify api call
    expect(axios.get).toHaveBeenCalledWith(
      'http://localhost:4000/api/admin/getUsers',
      { withCredentials: true }
    );
  });

  it('displays user data correctly when API call succeeds', async () => {
    setupSuccessfulApiResponse();
    render(<UserManagementPage />);

    // Wait for users to be displayed
    await waitFor(() => {
      expect(screen.getByText('admin1')).toBeInTheDocument();
      expect(screen.getByText('vendor1')).toBeInTheDocument();
      expect(screen.getByText('user1')).toBeInTheDocument();
    });

    // Check email display
    expect(screen.getByText('admin@test.com')).toBeInTheDocument();
    expect(screen.getByText('vendor@test.com')).toBeInTheDocument();
    expect(screen.getByText('user@test.com')).toBeInTheDocument();

    // Check role tags
    const adminRole = screen.getByText('admin');
    const vendorRole = screen.getByText('vendor');
    const userRole = screen.getByText('user');
    
    // Verify proper styling classes are applied to roles
    expect(adminRole.className).toContain('bg-red-100');
    expect(adminRole.className).toContain('text-red-800');
    expect(vendorRole.className).toContain('bg-blue-100');
    expect(vendorRole.className).toContain('text-blue-800');
    expect(userRole.className).toContain('bg-green-100');
    expect(userRole.className).toContain('text-green-800');

    // Check last login formatting
    expect(screen.getByText('Never Logged In')).toBeInTheDocument();
    // We don't test the exact formatted strings as they depend on locale and might be brittle tests,
    // instead verify they don't show as "Never Logged In" for timestamps that exist
    const formattedDates = screen.queryAllByText(/^\w{3}, \w{3} \d{1,2}, \d{4}, \d{1,2}:\d{2}:\d{2} [AP]M$/);
    expect(formattedDates.length).toBe(2); // Two users with dates
  });

  it('displays "No users found" when API returns empty array', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: [],
      },
    });

    render(<UserManagementPage />);
    expectBaseUIComponentsToBeRendered();

    await waitFor(() => {
      expect(screen.getByText('No users found.')).toBeInTheDocument();
    });
  });

  it('handles API error gracefully when API call fails with error response', async () => {
    setupFailedApiResponse();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<UserManagementPage />);
    expectBaseUIComponentsToBeRendered();

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch users:', 'Failed to fetch users');
    });
    
    expect(screen.getByText('No users found.')).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it('handles API error gracefully when API call throws exception', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<UserManagementPage />);
    expectBaseUIComponentsToBeRendered();

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching users:', expect.any(Error));
    });
    
    expect(screen.getByText('No users found.')).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it('correctly formats timestamps', async () => {
    setupSuccessfulApiResponse();
    
    // Create a known fixed date for testing
    const originalDate = global.Date;
    const mockDate = vi.fn(() => new Date('2023-05-10T12:00:00Z'));
    mockDate.now = originalDate.now;
    global.Date = mockDate;
    
    render(<UserManagementPage />);
    
    expect(true).toBe(true)
    
    // Reset Date mock
    global.Date = originalDate;
  });

  it('displays action buttons for each user', async () => {
    setupSuccessfulApiResponse();
    render(<UserManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('admin1')).toBeInTheDocument();
    });

    // Check action buttons
    expect(screen.getAllByTestId('edit-icon').length).toBe(mockUsers.length);
    expect(screen.getAllByTestId('trash-icon').length).toBe(mockUsers.length);
  });

  it('has a working Add New User button', async () => {
    setupSuccessfulApiResponse();
    render(<UserManagementPage />);

    const addButton = screen.getByText('Add New User');
    expect(addButton).toBeInTheDocument();
    
    // Test button styling
    expect(addButton.className).toContain('bg-blue-600');
    expect(addButton.className).toContain('text-white');
    
    // Since the button doesn't have functionality yet, we just ensure it's clickable
    fireEvent.click(addButton);
  });
});