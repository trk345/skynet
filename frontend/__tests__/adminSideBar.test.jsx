// frontend/__tests__/adminSideBar.test.jsx
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import AdminSideBar from '../src/components/AdminSideBar'; // Adjust path as needed
import { renderWithRouter } from './testUtils';

// Setup mocks
vi.mock('axios');
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/admin/dashboard' })
  };
});

describe('AdminSideBar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders correctly with all navigation links', () => {
    renderWithRouter(<AdminSideBar />);
    
    // Check main elements
    expect(screen.getByText('Skynet')).toBeInTheDocument();
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    
    // Check navigation links
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Rooms')).toBeInTheDocument();
    expect(screen.getByText('Bookings')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  test('logout button calls logout API and navigates to login', async () => {
    // Setup mocks
    axios.post.mockResolvedValueOnce({});
    const user = userEvent.setup();
    
    renderWithRouter(<AdminSideBar />);
    
    // Click logout button
    const logoutButton = screen.getByText('Logout');
    await user.click(logoutButton);
    
    // Assert API call and navigation
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/logout'),
      {},
      { withCredentials: true }
    );
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('handles logout API error gracefully', async () => {
    // Setup mocks for error case
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    axios.post.mockRejectedValueOnce(new Error('Logout failed'));
    
    const user = userEvent.setup();
    renderWithRouter(<AdminSideBar />);
    
    // Click logout button
    const logoutButton = screen.getByText('Logout');
    await user.click(logoutButton);
    
    // Assert error handling
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(consoleErrorSpy.mock.calls[0][0]).toBe("Logout failed:");
    
    consoleErrorSpy.mockRestore();
  });

  test('handles specific API error response', async () => {
    // Mock a specific API error response
    const errorResponse = {
      response: {
        data: 'Session expired'
      }
    };
    axios.post.mockRejectedValueOnce(errorResponse);
    
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    
    renderWithRouter(<AdminSideBar />);
    
    // Click logout button
    const logoutButton = screen.getByText('Logout');
    await user.click(logoutButton);
    
    // Assert specific error handling
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(consoleErrorSpy.mock.calls[0][0]).toBe("Logout failed:");
    expect(consoleErrorSpy.mock.calls[0][1]).toBe("Session expired");
    
    consoleErrorSpy.mockRestore();
  });

});