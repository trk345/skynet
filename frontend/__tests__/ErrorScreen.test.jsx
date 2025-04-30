import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, BrowserRouter } from 'react-router-dom';
import ErrorScreen from '../src/components/ErrorScreen';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Link: ({ to, className, children }) => (
      <a href={to} className={className} data-testid="link">
        {children}
      </a>
    )
  };
});

describe('ErrorScreen Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it('renders with default props', () => {
    render(
      <BrowserRouter>
        <ErrorScreen />
      </BrowserRouter>
    );

    // Check if the error title is present
    expect(screen.getByText('Error')).toBeInTheDocument();
    
    // Check if the default error message is present
    expect(screen.getByText('Something went wrong...')).toBeInTheDocument();
    
    // Check if the link with default home url is present
    const link = screen.getByTestId('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
    
    // Check if the button text is correct
    expect(screen.getByText('Return to Home')).toBeInTheDocument();
  });

  it('renders with custom error message', () => {
    const customMessage = 'Custom error message';
    
    render(
      <BrowserRouter>
        <ErrorScreen message={customMessage} />
      </BrowserRouter>
    );

    // Check if the custom error message is present
    expect(screen.getByText(customMessage)).toBeInTheDocument();
    
    // Verify the default link is still used
    const link = screen.getByTestId('link');
    expect(link).toHaveAttribute('href', '/');
  });

  it('renders with custom home link', () => {
    const customLink = '/dashboard';
    
    render(
      <BrowserRouter>
        <ErrorScreen homeLink={customLink} />
      </BrowserRouter>
    );

    // Check if the default error message is present
    expect(screen.getByText('Something went wrong...')).toBeInTheDocument();
    
    // Verify the custom link is used
    const link = screen.getByTestId('link');
    expect(link).toHaveAttribute('href', customLink);
  });

  it('renders with both custom message and custom link', () => {
    const customMessage = 'Page not found';
    const customLink = '/login';
    
    render(
      <BrowserRouter>
        <ErrorScreen message={customMessage} homeLink={customLink} />
      </BrowserRouter>
    );

    // Check if the custom error message is present
    expect(screen.getByText(customMessage)).toBeInTheDocument();
    
    // Verify the custom link is used
    const link = screen.getByTestId('link');
    expect(link).toHaveAttribute('href', customLink);
  });

  it('renders correctly with MemoryRouter', () => {
    render(
      <MemoryRouter>
        <ErrorScreen />
      </MemoryRouter>
    );
    
    // Check that the component renders properly with MemoryRouter
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByTestId('link')).toBeInTheDocument();
  });

  it('has the correct styling applied', () => {
    const { container } = render(
      <BrowserRouter>
        <ErrorScreen />
      </BrowserRouter>
    );
    
    // Check for the main container styling
    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass('min-h-screen', 'flex', 'justify-center', 'items-center', 'bg-gray-50');
    
    // Check for the inner content box styling
    const contentBox = mainContainer.firstChild;
    expect(contentBox).toHaveClass('text-center', 'text-red-600', 'p-6', 'bg-white', 'shadow-md', 'rounded-lg');
    
    // Check for the link button styling
    const linkButton = screen.getByTestId('link');
    expect(linkButton).toHaveClass('mt-4', 'inline-block', 'px-4', 'py-2', 'bg-blue-600', 'text-white', 'rounded', 'hover:bg-blue-700');
  });
});