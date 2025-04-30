import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import axios from 'axios';
import Notifications from '../src/components/Notifications';

// Mock axios
vi.mock('axios');

// Mock environment variables
vi.mock('import.meta', () => ({
  env: {
    VITE_API_URL: 'http://test-api.com'
  }
}));

describe('Notifications Component', () => {
  const mockNotifications = [
    { _id: '1', message: 'Test notification 1', createdAt: '2023-01-01T10:00:00Z' },
    { _id: '2', message: 'Test notification 2', createdAt: '2023-01-01T11:30:00Z' }
  ];

  beforeEach(() => {
    // Reset and setup axios mocks before each test
    vi.resetAllMocks();
    
    // Mock the unread count endpoint
    axios.get.mockImplementation((url) => {
      if (url.includes('/unread-count')) {
        return Promise.resolve({ data: { unreadCount: 3 } });
      }
      if (url.includes('/notifications')) {
        return Promise.resolve({ data: mockNotifications });
      }
      return Promise.reject(new Error('Not found'));
    });

    // Mock the mark-as-read endpoint
    axios.put.mockResolvedValue({ data: { success: true } });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders the notification bell icon', async () => {
    await act(async () => {
      render(<Notifications />);
    });
    
    const bellButton = screen.getByRole('button');
    expect(bellButton).toBeInTheDocument();
    expect(bellButton.textContent).toContain('🔔');
  });

  it('fetches and displays unread count on load', async () => {
    await act(async () => {
      render(<Notifications />);
    });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:4000/api/user/notifications/unread-count',
        { withCredentials: true }
      );
    });

    const unreadBadge = screen.getByText('3');
    expect(unreadBadge).toBeInTheDocument();
  });

  it('opens dropdown and fetches notifications when clicked', async () => {
    await act(async () => {
      render(<Notifications />);
    });

    const bellButton = screen.getByRole('button');
    
    await act(async () => {
      fireEvent.click(bellButton);
    });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:4000/api/user/notifications',
        { withCredentials: true }
      );
    });

    // Verify that mark-as-read API was called
    expect(axios.put).toHaveBeenCalledWith(
      'http://localhost:4000/api/user/notifications/mark-as-read',
      {},
      { withCredentials: true }
    );

    // Check dropdown content
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Test notification 1')).toBeInTheDocument();
    expect(screen.getByText('Test notification 2')).toBeInTheDocument();
  });

  it('closes dropdown when clicking again', async () => {
    await act(async () => {
      render(<Notifications />);
    });

    const bellButton = screen.getByRole('button');
    
    // Open dropdown
    await act(async () => {
      fireEvent.click(bellButton);
    });
    
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    
    // Close dropdown
    await act(async () => {
      fireEvent.click(bellButton);
    });
    
    expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
  });

  it('formats time correctly', async () => {
    await act(async () => {
      render(<Notifications />);
    });

    const bellButton = screen.getByRole('button');
    
    await act(async () => {
      fireEvent.click(bellButton);
    });

    // The exact time format will depend on the locale of the testing environment
    // Here we're checking if any time strings are rendered
    const timeElements = screen.getAllByText(/\d{1,2}:\d{2}/);
    expect(timeElements.length).toBeGreaterThan(0);
  });

  it('displays "No new notifications" when notifications array is empty', async () => {
    // Override the notifications API response for this test only
    axios.get.mockImplementation((url) => {
      if (url.includes('/unread-count')) {
        return Promise.resolve({ data: { unreadCount: 0 } });
      }
      if (url.includes('/notifications')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject(new Error('Not found'));
    });

    await act(async () => {
      render(<Notifications />);
    });

    const bellButton = screen.getByRole('button');
    
    await act(async () => {
      fireEvent.click(bellButton);
    });

    expect(screen.getByText('No new notifications')).toBeInTheDocument();
  });

  it('handles error when fetching unread count', async () => {
    // Mock console.error to prevent error logs in test output
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Override the unread count API to reject
    axios.get.mockImplementation((url) => {
      if (url.includes('/unread-count')) {
        return Promise.reject(new Error('API error'));
      }
      return Promise.resolve({ data: {} });
    });

    await act(async () => {
      render(<Notifications />);
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching unread count', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  it('handles error when fetching notifications', async () => {
    // Mock console.error to prevent error logs in test output
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // First call for unread count succeeds, second call for notifications fails
    axios.get.mockImplementationOnce(() => Promise.resolve({ data: { unreadCount: 1 } }))
      .mockImplementationOnce(() => Promise.reject(new Error('API error')));

    await act(async () => {
      render(<Notifications />);
    });

    const bellButton = screen.getByRole('button');
    
    await act(async () => {
      fireEvent.click(bellButton);
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching notifications', expect.any(Error));
    });

    // Should still show the notifications heading but with empty state
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('No new notifications')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it('handles error when marking notifications as read', async () => {
    // Mock console.error to prevent error logs in test output
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Override mark-as-read to reject
    axios.put.mockRejectedValueOnce(new Error('API error'));

    await act(async () => {
      render(<Notifications />);
    });

    const bellButton = screen.getByRole('button');
    
    await act(async () => {
      fireEvent.click(bellButton);
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error marking notifications as read', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  it('handles non-array response from notifications API', async () => {
    // Override the notifications API to return a non-array
    axios.get.mockImplementation((url) => {
      if (url.includes('/unread-count')) {
        return Promise.resolve({ data: { unreadCount: 1 } });
      }
      if (url.includes('/notifications')) {
        return Promise.resolve({ data: "not an array" });
      }
      return Promise.reject(new Error('Not found'));
    });

    await act(async () => {
      render(<Notifications />);
    });

    const bellButton = screen.getByRole('button');
    
    await act(async () => {
      fireEvent.click(bellButton);
    });

    expect(screen.getByText('No new notifications')).toBeInTheDocument();
  });
});