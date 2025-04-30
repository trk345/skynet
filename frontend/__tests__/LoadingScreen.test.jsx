import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingScreen from '../src/components/LoadingScreen';

describe('LoadingScreen Component', () => {
  it('renders with default message', () => {
    const { container } = render(<LoadingScreen />);
    
    // Check if the default loading message is present
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Check if the spinner element exists
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    const customMessage = 'Fetching data...';
    
    render(<LoadingScreen message={customMessage} />);
    
    // Check if the custom message is rendered
    expect(screen.getByText(customMessage)).toBeInTheDocument();
    
    // Ensure default message is not present
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('has the correct structure and styling', () => {
    const { container } = render(<LoadingScreen />);
    
    // Check main container
    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass(
      'min-h-screen',
      'flex',
      'justify-center',
      'items-center',
      'bg-gray-50'
    );
    
    // Check inner container
    const innerContainer = mainContainer.firstChild;
    expect(innerContainer).toHaveClass('text-center');
    
    // Check spinner element
    const spinner = innerContainer.firstChild;
    expect(spinner).toHaveClass(
      'animate-spin',
      'rounded-full',
      'h-12',
      'w-12',
      'border-b-2',
      'border-blue-600',
      'mx-auto',
      'mb-4'
    );
    
    // Check message paragraph
    const messageParagraph = innerContainer.lastChild;
    expect(messageParagraph).toHaveClass('text-gray-600');
  });

  it('preserves empty message when passed explicitly', () => {
    const { container } = render(<LoadingScreen message="" />);
    
    // Find the paragraph element with the message class
    const messageParagraph = container.querySelector('p.text-gray-600');
    expect(messageParagraph).toBeInTheDocument();
    expect(messageParagraph.textContent).toBe('');
  });

  it('handles non-string message prop gracefully', () => {
    render(<LoadingScreen message={123} />);
    
    // Should convert number to string
    expect(screen.getByText('123')).toBeInTheDocument();
  });
  
  it('renders consistently in repeated instances', () => {
    const { unmount } = render(<LoadingScreen />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Unmount and remount to test consistency
    unmount();
    render(<LoadingScreen />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});