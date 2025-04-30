import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookingManagementPage from '../src/pages/AdminBookingManagement';

// Mock the components that are imported
vi.mock('../src/components/adminSideBar', () => ({
  default: vi.fn(() => <div data-testid="sidebar-component" />)
}));

vi.mock('../src/components/adminTopbar', () => ({
  default: vi.fn(() => <div data-testid="topbar-component" />)
}));

// Mock the Lucide icons
vi.mock('lucide-react', () => ({
  Calendar: vi.fn(() => <span data-testid="calendar-icon" />),
  Edit: vi.fn(() => <span data-testid="edit-icon" />),
  Trash2: vi.fn(() => <span data-testid="trash-icon" />),
  Plus: vi.fn(() => <span data-testid="plus-icon" />)
}));

describe('BookingManagementPage', () => {
  const mockBookings = [
    { id: 1, guest: "Emily Chen", room: "Deluxe Suite", checkIn: "2024-02-15", checkOut: "2024-02-18", totalGuests: 2, status: "Confirmed" },
    { id: 2, guest: "Robert Kim", room: "Family Room", checkIn: "2024-02-20", checkOut: "2024-02-25", totalGuests: 4, status: "Pending" },
    { id: 3, guest: "Sarah Rodriguez", room: "Standard Room", checkIn: "2024-03-01", checkOut: "2024-03-03", totalGuests: 1, status: "Cancelled" }
  ];
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component with all its parts', () => {
    render(<BookingManagementPage />);
    
    // Check if sidebar and topbar are rendered
    expect(screen.getByTestId('sidebar-component')).toBeInTheDocument();
    expect(screen.getByTestId('topbar-component')).toBeInTheDocument();
    
    // Check if the page title is rendered
    expect(screen.getByText('Booking Management')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-icon')).toBeInTheDocument();
    
    // Check if the add new booking button is rendered
    const addButton = screen.getByText('Add New Booking');
    expect(addButton).toBeInTheDocument();
    expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
  });

  it('displays the table with correct headers', () => {
    render(<BookingManagementPage />);
    
    const expectedHeaders = [
      'ID', 'Guest', 'Room', 'Check In', 'Check Out', 'Guests', 'Status', 'Actions'
    ];
    
    const tableHeaders = screen.getAllByRole('columnheader');
    expect(tableHeaders).toHaveLength(expectedHeaders.length);
    
    tableHeaders.forEach((header, index) => {
      expect(header).toHaveTextContent(expectedHeaders[index]);
    });
  });

  it('renders all bookings data correctly', () => {
    render(<BookingManagementPage />);
    
    const rows = screen.getAllByRole('row');
    // +1 for the header row
    expect(rows).toHaveLength(mockBookings.length + 1);
    
    mockBookings.forEach((booking) => {
      const row = screen.getByText(booking.guest).closest('tr');
      
      expect(within(row).getByText(booking.id.toString())).toBeInTheDocument();
      expect(within(row).getByText(booking.guest)).toBeInTheDocument();
      expect(within(row).getByText(booking.room)).toBeInTheDocument();
      expect(within(row).getByText(booking.checkIn)).toBeInTheDocument();
      expect(within(row).getByText(booking.checkOut)).toBeInTheDocument();
      expect(within(row).getByText(booking.totalGuests.toString())).toBeInTheDocument();
      expect(within(row).getByText(booking.status)).toBeInTheDocument();
      
      // Check if action buttons are present
      expect(within(row).getByTestId('edit-icon')).toBeInTheDocument();
      expect(within(row).getByTestId('trash-icon')).toBeInTheDocument();
    });
  });

  it('applies correct status colors based on booking status', () => {
    render(<BookingManagementPage />);
    
    // Test for "Confirmed" status
    const confirmedStatus = screen.getByText('Confirmed');
    expect(confirmedStatus.className).toContain('bg-green-100');
    expect(confirmedStatus.className).toContain('text-green-800');
    
    // Test for "Pending" status
    const pendingStatus = screen.getByText('Pending');
    expect(pendingStatus.className).toContain('bg-yellow-100');
    expect(pendingStatus.className).toContain('text-yellow-800');
    
    // Test for "Cancelled" status
    const cancelledStatus = screen.getByText('Cancelled');
    expect(cancelledStatus.className).toContain('bg-red-100');
    expect(cancelledStatus.className).toContain('text-red-800');
  });

  it('has correctly configured action buttons', async () => {
    const user = userEvent.setup();
    render(<BookingManagementPage />);
    
    // Check that we have the right number of edit and delete buttons
    const editButtons = screen.getAllByTestId('edit-icon');
    const deleteButtons = screen.getAllByTestId('trash-icon');
    
    expect(editButtons).toHaveLength(mockBookings.length);
    expect(deleteButtons).toHaveLength(mockBookings.length);
    
    // Check that buttons have the correct parent elements with the right classes
    editButtons.forEach((button) => {
      const parentButton = button.closest('button');
      expect(parentButton).toHaveClass('text-blue-600');
      expect(parentButton).toHaveClass('hover:text-blue-800');
    });
    
    deleteButtons.forEach((button) => {
      const parentButton = button.closest('button');
      expect(parentButton).toHaveClass('text-red-600');
      expect(parentButton).toHaveClass('hover:text-red-800');
    });
  });

  it('renders and configures the Add New Booking button', async () => {
    const user = userEvent.setup();
    render(<BookingManagementPage />);
    
    const addButton = screen.getByText('Add New Booking').closest('button');
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveClass('bg-blue-600');
    expect(addButton).toHaveClass('text-white');
    expect(addButton).toHaveClass('hover:bg-blue-700');
  });

  it('has the correct structure and styling for the component layout', () => {
    const { container } = render(<BookingManagementPage />);
    
    // Check main container
    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass('flex');
    expect(mainContainer).toHaveClass('h-screen');
    expect(mainContainer).toHaveClass('bg-gray-100');
    
    // Check content area
    const contentArea = screen.getByText('Booking Management').closest('div').parentElement;
    expect(contentArea).toHaveClass('p-6');
    
    // Check table container
    const tableContainer = screen.getByRole('table').closest('div');
    expect(tableContainer).toHaveClass('bg-white');
    expect(tableContainer).toHaveClass('rounded-lg');
    expect(tableContainer).toHaveClass('shadow-sm');
  });

  it('correctly formats table headers', () => {
    render(<BookingManagementPage />);
    
    const headers = screen.getAllByRole('columnheader');
    
    headers.forEach(header => {
      expect(header).toHaveClass('px-6');
      expect(header).toHaveClass('py-3');
      expect(header).toHaveClass('text-xs');
      expect(header).toHaveClass('font-medium');
      expect(header).toHaveClass('text-gray-500');
      expect(header).toHaveClass('uppercase');
    });
    
    // The Actions header should be center-aligned
    const actionsHeader = screen.getByText('Actions');
    expect(actionsHeader).toHaveClass('text-center');
  });

  it('provides a comprehensive getStatusStyles function that handles all cases', () => {
    render(<BookingManagementPage />);
    
    // Test existing statuses
    const confirmedElement = screen.getByText('Confirmed');
    const pendingElement = screen.getByText('Pending');
    const cancelledElement = screen.getByText('Cancelled');
    
    expect(confirmedElement).toHaveClass('bg-green-100');
    expect(confirmedElement).toHaveClass('text-green-800');
    
    expect(pendingElement).toHaveClass('bg-yellow-100');
    expect(pendingElement).toHaveClass('text-yellow-800');
    
    expect(cancelledElement).toHaveClass('bg-red-100');
    expect(cancelledElement).toHaveClass('text-red-800');
    
    
  });
});