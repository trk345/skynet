import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { RequestContext } from "../src/context/RequestContext";
import AdminTopBar from "../src/components/adminTopbar";
import axios from 'axios';

// Mock axios
vi.mock('axios');

// Mock environment variables
vi.mock('import.meta', () => ({
  env: {
    VITE_API_URL: 'http://localhost:5000'
  }
}));

describe('AdminTopBar Component', () => {
  const mockUser = {
    username: 'TestAdmin'
  };
  
  const mockRequestCount = 5;
  
  // Setup for each test
  beforeEach(() => {
    // Reset all axios mocks before each test
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  // Helper function to render with context
  const renderWithContext = (requestCount = 0) => {
    return render(
      <RequestContext.Provider value={{ requestCount }}>
        <BrowserRouter>
          <AdminTopBar />
        </BrowserRouter>
      </RequestContext.Provider>
    );
  };
  
  it('renders without crashing', () => {
    axios.get.mockResolvedValueOnce({ data: { user: mockUser } });
    renderWithContext();
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });
  
  it('fetches and displays user data on mount', async () => {
    axios.get.mockResolvedValueOnce({ data: { user: mockUser } });
    
    renderWithContext();
    
    // Verify API call
    expect(axios.get).toHaveBeenCalledWith(
      'http://localhost:4000/api/auth/me',
      { withCredentials: true }
    );
    
    // Wait for user data to appear
    await waitFor(() => {
      expect(screen.getByText('TestAdmin')).toBeInTheDocument();
    });
  });
  
  it('renders search input correctly', () => {
    axios.get.mockResolvedValueOnce({ data: { user: mockUser } });
    renderWithContext();
    
    const searchInput = screen.getByPlaceholderText('Search...');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput.tagName).toBe('INPUT');
  });
  
  it('renders requests link correctly', () => {
    axios.get.mockResolvedValueOnce({ data: { user: mockUser } });
    renderWithContext();
    
    const requestsLink = screen.getByText('Requests');
    expect(requestsLink).toBeInTheDocument();
    expect(requestsLink.tagName).toBe('A');
    expect(requestsLink).toHaveAttribute('href', '/admin/requests');
  });
  
  it('displays request count badge when count > 0', () => {
    axios.get.mockResolvedValueOnce({ data: { user: mockUser } });
    renderWithContext(mockRequestCount);
    
    const requestCountBadge = screen.getByText('5');
    expect(requestCountBadge).toBeInTheDocument();
    expect(requestCountBadge.classList.contains('bg-red-500')).toBe(true);
  });
  
  it('does not display request count badge when count is 0', () => {
    axios.get.mockResolvedValueOnce({ data: { user: mockUser } });
    renderWithContext(0);
    
    const requestCountBadges = screen.queryByText('0');
    expect(requestCountBadges).not.toBeInTheDocument();
  });
  
  it('renders user avatar placeholder', async () => {
    axios.get.mockResolvedValueOnce({ data: { user: mockUser } });
    renderWithContext();
    
    await waitFor(() => {
      // Check for the avatar div
      const avatarElement = document.querySelector('.w-8.h-8.bg-blue-500.rounded-full');
      expect(avatarElement).toBeInTheDocument();
    });
  });
  
  it('handles user interaction with search input', async () => {
    axios.get.mockResolvedValueOnce({ data: { user: mockUser } });
    renderWithContext();
    
    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText('Search...');
    
    await user.type(searchInput, 'test query');
    expect(searchInput.value).toBe('test query');
  });
  
  it('handles focus on search input', async () => {
    axios.get.mockResolvedValueOnce({ data: { user: mockUser } });
    renderWithContext();
    
    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText('Search...');
    
    await user.click(searchInput);
    expect(document.activeElement).toBe(searchInput);
  });
});