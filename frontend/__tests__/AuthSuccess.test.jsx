import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { useNavigate } from 'react-router-dom';
import AuthSuccess from '../src/components/AuthSuccess';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn()
}));

// Mock environment variables
vi.mock('import.meta', () => ({
  env: {
    VITE_API_URL: 'http://test-api.com'
  }
}));


// Mock global fetch
global.fetch = vi.fn();

describe('AuthSuccess Component', () => {
  const mockUser = { username: 'testuser', email: 'test@example.com' };
  const mockNavigate = vi.fn();

  beforeEach(() => {
    // Reset all mocks before each test
    vi.resetAllMocks();
    
    // Setup useNavigate mock
    useNavigate.mockReturnValue(mockNavigate);
    
    // Setup global fetch mock with default successful response
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUser)
    });

    // Mock setTimeout
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  it('renders welcome message with loading state', async () => {
    await act(async () => {
      render(<AuthSuccess />);
    });
    
    // Initial state should show generic welcome
    expect(screen.getByText('Welcome testuser!')).toBeInTheDocument();
  });

    it('redirects to home page after successful authentication with delay', async () => {
    await act(async () => {
      render(<AuthSuccess />);
    });

    // Verify navigation hasn't happened immediately
    expect(mockNavigate).not.toHaveBeenCalled();

    // Fast-forward timer to trigger the setTimeout callback
    await act(async () => {
      vi.advanceTimersByTime(10000);
    });

    // Now verify redirection happened
    expect(mockNavigate).toHaveBeenCalledWith('/');
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });


  it('uses correct timeout duration for redirect', async () => {
    // Mock setTimeout to verify timing
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

    await act(async () => {
      render(<AuthSuccess />);
    });

    // Verify setTimeout was called with correct duration
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 500);
  });
});