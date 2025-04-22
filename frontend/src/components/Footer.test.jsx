import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from './Footer';

describe('Footer Component', () => {
  test('renders footer with copyright text', () => {
    render(<Footer />);
    
    // Check that the footer element exists
    const footerElement = screen.getByRole('contentinfo');
    expect(footerElement).toBeInTheDocument();
    expect(footerElement).toHaveClass('bg-gray-800');
    expect(footerElement).toHaveClass('text-white');
    
    // Check the copyright text
    const copyrightText = screen.getByText(/2025 Skynet. All rights reserved./i);
    expect(copyrightText).toBeInTheDocument();
    
    // Verify container styling
    const containerDiv = footerElement.querySelector('.container');
    expect(containerDiv).toBeInTheDocument();
    expect(containerDiv).toHaveClass('mx-auto');
    expect(containerDiv).toHaveClass('px-4');
    expect(containerDiv).toHaveClass('text-center');
  });
});