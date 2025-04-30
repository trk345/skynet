import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminDashboard from '../src/pages/AdminDashboard'; 

// Mock the components that AdminDashboard depends on
vi.mock('../src/components/adminSideBar.jsx', () => ({
  default: vi.fn(() => <div data-testid="sidebar">Sidebar</div>)
}));

vi.mock('../src/components/adminTopbar.jsx', () => ({
  default: vi.fn(() => <div data-testid="topbar">Topbar</div>)
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Plus: vi.fn(() => <div data-testid="plus-icon">Plus Icon</div>)
}));

describe('AdminDashboard Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it('renders the component with all major sections', () => {
    render(<AdminDashboard />);
    
    // Verify main structural elements
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('topbar')).toBeInTheDocument();
    
    // Verify statistics cards are rendered
    expect(screen.getByText('Total Bookings')).toBeInTheDocument();
    expect(screen.getByText('Available Rooms')).toBeInTheDocument();
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('Active Users')).toBeInTheDocument();
    
    // Verify the values in statistics cards
    expect(screen.getByText('1,234')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('$52,389')).toBeInTheDocument();
    expect(screen.getByText('892')).toBeInTheDocument();
    
    // Verify percentage indicators
    expect(screen.getByText('+12% from last month')).toBeInTheDocument();
    expect(screen.getByText('-3% from last month')).toBeInTheDocument();
    expect(screen.getByText('+8% from last month')).toBeInTheDocument();
    expect(screen.getByText('+5% from last month')).toBeInTheDocument();
  });

  it('renders the recent bookings section with correct data', () => {
    render(<AdminDashboard />);
    
    // Verify section title
    expect(screen.getByText('Recent Bookings')).toBeInTheDocument();
    
    // Verify table headers
    const tableHeaders = ['ID', 'Room', 'Guest', 'Check In', 'Check Out', 'Status'];
    tableHeaders.forEach(header => {
      expect(screen.getAllByText(header)[0]).toBeInTheDocument();
    });
    
    // Verify sample booking data
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('2024-02-15')).toBeInTheDocument();
    expect(screen.getByText('2024-02-16')).toBeInTheDocument();
    expect(screen.getByText('2024-02-18')).toBeInTheDocument();
    expect(screen.getByText('2024-02-17')).toBeInTheDocument();
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders the room status section with correct data', () => {
    render(<AdminDashboard />);
    
    // Verify section title
    expect(screen.getByText('Room Status')).toBeInTheDocument();
    
    // Verify room data
    expect(screen.getAllByText('Deluxe Suite').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Standard Room').length).toBeGreaterThan(0);
    expect(screen.getByText('Family Room')).toBeInTheDocument();
    expect(screen.getByText('Occupied')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText('Maintenance')).toBeInTheDocument();
    expect(screen.getByText('$200/night')).toBeInTheDocument();
    expect(screen.getByText('$100/night')).toBeInTheDocument();
    expect(screen.getByText('$150/night')).toBeInTheDocument();
  });

  it('renders add buttons for bookings and rooms', () => {
    render(<AdminDashboard />);
    
    const addButtons = screen.getAllByText(/Add/);
    expect(addButtons.length).toBe(2);
    expect(screen.getByText('Add Booking')).toBeInTheDocument();
    expect(screen.getByText('Add Room')).toBeInTheDocument();
    
    // Verify plus icons
    const plusIcons = screen.getAllByTestId('plus-icon');
    expect(plusIcons.length).toBe(2);
  });

  it('applies the correct status classes for bookings', () => {
    render(<AdminDashboard />);
    
    // Get the status cells
    const confirmedStatus = screen.getByText('Confirmed').closest('span');
    const pendingStatus = screen.getByText('Pending').closest('span');
    
    // Check for the appropriate classes
    expect(confirmedStatus).toHaveClass('bg-green-100');
    expect(confirmedStatus).toHaveClass('text-green-800');
    expect(pendingStatus).toHaveClass('bg-yellow-100');
    expect(pendingStatus).toHaveClass('text-yellow-800');
  });

  it('applies the correct status classes for rooms', () => {
    render(<AdminDashboard />);
    
    // Get the status cells
    const availableStatus = screen.getByText('Available').closest('span');
    const occupiedStatus = screen.getByText('Occupied').closest('span');
    const maintenanceStatus = screen.getByText('Maintenance').closest('span');
    
    // Check for the appropriate classes
    expect(availableStatus).toHaveClass('bg-green-100');
    expect(availableStatus).toHaveClass('text-green-800');
    expect(occupiedStatus).toHaveClass('bg-blue-100');
    expect(occupiedStatus).toHaveClass('text-blue-800');
    expect(maintenanceStatus).toHaveClass('bg-red-100');
    expect(maintenanceStatus).toHaveClass('text-red-800');
  });

  it('correctly calls the getStatusClass function for different statuses', () => {
    render(<AdminDashboard />);
    
    // This test indirectly verifies that getStatusClass works correctly
    // by checking that the appropriate classes are applied to the status elements
    
    // Available status
    const availableStatus = screen.getByText('Available').closest('span');
    expect(availableStatus).toHaveClass('bg-green-100');
    expect(availableStatus).toHaveClass('text-green-800');
    
    // Occupied status
    const occupiedStatus = screen.getByText('Occupied').closest('span');
    expect(occupiedStatus).toHaveClass('bg-blue-100');
    expect(occupiedStatus).toHaveClass('text-blue-800');
    
    // Maintenance status (default case)
    const maintenanceStatus = screen.getByText('Maintenance').closest('span');
    expect(maintenanceStatus).toHaveClass('bg-red-100');
    expect(maintenanceStatus).toHaveClass('text-red-800');
  });
});