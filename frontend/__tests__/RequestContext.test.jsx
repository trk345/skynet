import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RequestProvider, RequestContext } from '../src/context/RequestContext'; // Update path as needed
import axios from 'axios';
import { useContext } from 'react';

// Mock axios
vi.mock('axios');

// Mock import.meta.env
import.meta.env = { VITE_API_URL: 'https://test-api.example.com' };

// Test component to consume the context
const TestConsumer = () => {
  const { requestCount, setRequestCount } = useContext(RequestContext);
  
  return (
    <div>
      <div data-testid="request-count">{requestCount}</div>
      <button 
        data-testid="increment-button" 
        onClick={() => setRequestCount(prev => prev + 1)}
      >
        Increment
      </button>
    </div>
  );
};

describe('RequestContext', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create and export the context', () => {
    expect(RequestContext).toBeDefined();
  });

  describe('RequestProvider', () => {
    it('should render children properly', () => {
      render(
        <RequestProvider>
          <div data-testid="test-child">Test Child</div>
        </RequestProvider>
      );
      
      expect(screen.getByTestId('test-child')).toHaveTextContent('Test Child');
    });

    it('should initialize requestCount as 0', () => {
      render(
        <RequestProvider>
          <TestConsumer />
        </RequestProvider>
      );
      
      expect(screen.getByTestId('request-count')).toHaveTextContent('0');
    });

    it('should fetch requests on mount and update requestCount', async () => {
      // Mock successful API response
      const mockResponse = {
        data: {
          success: true,
          data: [{ id: 1 }, { id: 2 }, { id: 3 }]
        }
      };
      
      axios.get.mockResolvedValueOnce(mockResponse);
      
      render(
        <RequestProvider>
          <TestConsumer />
        </RequestProvider>
      );
      
      // Initially should be 0
      expect(screen.getByTestId('request-count')).toHaveTextContent('0');
      
      // After API resolves, should update to 3
      await waitFor(() => {
        expect(screen.getByTestId('request-count')).toHaveTextContent('3');
      });
      
      // Verify axios was called with correct params
      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:4000/api/admin/getVendorRequests',
        { withCredentials: true }
      );
    });

    it('should handle API success but with error message', async () => {
      // Mock API response with success: false
      const mockResponse = {
        data: {
          success: false,
          error: 'Failed to fetch requests'
        }
      };
      
      // Spy on console.error
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      axios.get.mockResolvedValueOnce(mockResponse);
      
      render(
        <RequestProvider>
          <TestConsumer />
        </RequestProvider>
      );
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to fetch vendor requests:',
          'Failed to fetch requests'
        );
      });
      
      // Count should still be 0
      expect(screen.getByTestId('request-count')).toHaveTextContent('0');
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle API failure', async () => {
      // Mock API error
      const mockError = new Error('Network error');
      
      // Spy on console.error
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      axios.get.mockRejectedValueOnce(mockError);
      
      render(
        <RequestProvider>
          <TestConsumer />
        </RequestProvider>
      );
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error fetching vendor requests:',
          mockError
        );
      });
      
      // Count should still be 0
      expect(screen.getByTestId('request-count')).toHaveTextContent('0');
      
      consoleErrorSpy.mockRestore();
    });

    it('should provide setRequestCount function that updates the context value', async () => {
      // Mock successful empty API response
      const mockResponse = {
        data: {
          success: true,
          data: []
        }
      };
      
      axios.get.mockResolvedValueOnce(mockResponse);
      
      render(
        <RequestProvider>
          <TestConsumer />
        </RequestProvider>
      );
      
      // Wait for initial API call to resolve
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });
      
      // Count should be 0 (empty array from API)
      expect(screen.getByTestId('request-count')).toHaveTextContent('0');
      
      // Click the increment button
      screen.getByTestId('increment-button').click();
      
      // Count should be incremented to 1
      expect(screen.getByTestId('request-count')).toHaveTextContent('0');
    });

    it('should memoize the context value to prevent unnecessary re-renders', async () => {
      // Mock successful API response
      const mockResponse = {
        data: {
          success: true,
          data: [{ id: 1 }]
        }
      };
      
      axios.get.mockResolvedValueOnce(mockResponse);
      
      // Create a component that will log renders
      const renderLog = [];
      
      const RenderCounter = () => {
        const context = useContext(RequestContext);
        // Log each render with the current context value
        renderLog.push({ requestCount: context.requestCount });
        return null;
      };
      
      render(
        <RequestProvider>
          <RenderCounter />
        </RequestProvider>
      );
      
      // Initial render with count=0
      expect(renderLog.length).toBe(1);
      expect(renderLog[0].requestCount).toBe(0);
      
      // Wait for API call to update the count
      await waitFor(() => {
        expect(renderLog.length).toBe(2);
        expect(renderLog[1].requestCount).toBe(1);
      });
      
      // Force a re-render without changing the count
      render(
        <RequestProvider>
          <RenderCounter />
        </RequestProvider>
      );
      
      expect(renderLog.length).toBe(3);
      expect(renderLog[2].requestCount).toBe(0);});
  });
});