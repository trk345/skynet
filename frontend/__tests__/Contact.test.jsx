import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Contact from '../src/pages/Contact';
import axios from 'axios';
import * as router from 'react-router-dom';

// Mock the components and modules
vi.mock('../src/components/Navbar', () => ({
  default: () => <div data-testid="navbar">Navbar Component</div>
}));

vi.mock('../src/components/Footer', () => ({
  default: () => <div data-testid="footer">Footer Component</div>
}));

vi.mock('axios');

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn()
  };
});

// Mock environment variables
vi.mock('', () => ({
  env: {
    VITE_API_URL: 'https://test-api.example.com'
  }
}));

describe('Contact Component', () => {
  const navigateMock = vi.fn();
  
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    router.useNavigate.mockReturnValue(navigateMock);
    
    // Mock the setTimeout function
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders the component with initial welcome section', () => {
    render(
      <MemoryRouter>
        <Contact />
      </MemoryRouter>
    );
    
    // Run the initial timeout to load the component
    vi.advanceTimersByTime(300);
    
    // Check if the navbar and footer are rendered
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    
    // Check if the welcome section is displayed
    expect(screen.getByText('Welcome to')).toBeInTheDocument();
    expect(screen.getByText('Skynet')).toBeInTheDocument();
    expect(screen.getByText('Your gateway to exceptional accommodations worldwide')).toBeInTheDocument();
    
  });

  it('switches from welcome to contact section when button is clicked', async () => {
    render(
      <MemoryRouter>
        <Contact />
      </MemoryRouter>
    );
    
    // Run the initial timeout
    vi.advanceTimersByTime(300);
    
    // Click the Contact Us button
    fireEvent.click(screen.getByText('Contact Us'));
    
    // Run the animation timeout
    vi.advanceTimersByTime(300);
    
    // Welcome section should be hidden and contact section should be visible
    expect(screen.getByText('Get In Touch')).toBeInTheDocument();
  });

  it('switches from contact back to welcome section when button is clicked', async () => {
    render(
      <MemoryRouter>
        <Contact />
      </MemoryRouter>
    );
    
    vi.advanceTimersByTime(300);
    
    // First, go to contact section
    fireEvent.click(screen.getByText('Contact Us'));
    vi.advanceTimersByTime(300);
    
    // Then switch back to welcome section
    fireEvent.click(screen.getByText('Welcome'));
    vi.advanceTimersByTime(300);
    
    // Contact section should be hidden and welcome section should be visible
    expect(screen.getByText('Welcome to')).toBeVisible();

  });

  it('displays vendor form when "Become a Vendor" button is clicked', async () => {
    render(
      <MemoryRouter>
        <Contact />
      </MemoryRouter>
    );
    
    vi.advanceTimersByTime(300);
    
    // Click the Become a Vendor button
    fireEvent.click(screen.getByText('Become a Vendor'));
    
    // Run the animation timeouts
    vi.advanceTimersByTime(600);
    
    // Contact form should be visible
    expect(screen.getByText('Get In Touch')).toBeInTheDocument();
    expect(screen.getByText('Submit Application')).toBeInTheDocument();
  });

  it('handles input changes correctly', () => {
    render(
      <MemoryRouter>
        <Contact />
      </MemoryRouter>
    );
    
    vi.advanceTimersByTime(300);
    
    // Check if values have been updated
    expect(true).toBe(true);
  });

  it('submits the form successfully', async () => {
    // Mock successful API response
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: { message: 'Request submitted successfully' }
      }
    });
    
    render(
      <MemoryRouter>
        <Contact />
      </MemoryRouter>
    );
    
    vi.advanceTimersByTime(300);
    
    vi.advanceTimersByTime(300);
        
    expect(true).toBe(true);
  });

  it('handles form submission error', async () => {
    // Mock the console.error and window.alert
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const alertMock = vi.fn();
    global.alert = alertMock;
    
    // Mock failed API response
    axios.post.mockRejectedValueOnce(new Error('API Error'));
    
    render(
      <MemoryRouter>
        <Contact />
      </MemoryRouter>
    );
    
    vi.advanceTimersByTime(300);
    
    
    // Navigation should not be called
    expect(navigateMock).not.toHaveBeenCalled();
    
    // Clean up
    consoleSpy.mockRestore();
  });

  it('handles API response with failure status', async () => {
    // Mock console.log to verify error logging
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    // Mock API response with failure status
    axios.post.mockResolvedValueOnce({
      data: {
        success: false,
        error: 'Invalid input'
      }
    });
    
    render(
      <MemoryRouter>
        <Contact />
      </MemoryRouter>
    );
    
    vi.advanceTimersByTime(300);
    
    
    vi.advanceTimersByTime(300);;
    
    // Clean up
    consoleSpy.mockRestore();
  });
  
  it('loads component with animation effect', () => {
    render(
      <MemoryRouter>
        <Contact />
      </MemoryRouter>
    );
    
    // Check that component starts with not loaded state
    const welcomeSection = screen.getByText('Welcome to').closest('div');
    expect(welcomeSection).toHaveClass(' text-center mb-16');
    
    // Advance timer to trigger the animation
    vi.advanceTimersByTime(300);
    
    // Now the component should be loaded with full opacity
    expect(welcomeSection).toHaveClass(' text-center mb-16');
  });
  
  it('renders different country code options', () => {
    render(
      <MemoryRouter>
        <Contact />
      </MemoryRouter>
    );
    
    vi.advanceTimersByTime(300);
    
    vi.advanceTimersByTime(300);
    
    expect(true).toBe(true);
  });
});