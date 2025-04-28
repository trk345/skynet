// frontend/__tests__/Footer.test.jsx
import { describe, test, expect } from 'vitest';
import { screen } from '@testing-library/react';
import Footer from '../src/components/Footer'; // Adjust path as needed
import { render } from '@testing-library/react';

describe('Footer Component', () => {
  test('renders correctly with copyright information', () => {
    render(<Footer />);
    
    // Check for copyright text
    const copyrightText = screen.getByText(/© 2025 Skynet. All rights reserved./i);
    expect(copyrightText).toBeInTheDocument();
  });

  test('has the correct styling classes', () => {
    render(<Footer />);
    
    // Check that footer has correct styling classes
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveClass('bg-gray-800');
    expect(footer).toHaveClass('text-white');
  });
});