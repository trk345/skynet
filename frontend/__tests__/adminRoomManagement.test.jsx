import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import RoomManagementPage from '../src/pages/AdminRoomManagement';

// Mock the components that are imported
vi.mock('../src/components/adminSideBar', () => ({
  default: vi.fn(() => <div data-testid="sidebar-component" />)
}));

vi.mock('../src/components/adminTopbar', () => ({
  default: vi.fn(() => <div data-testid="topbar-component" />)
}));

// Mock the Lucide icons
vi.mock('lucide-react', () => ({
  Home: vi.fn(() => <span data-testid="home-icon" />),
  Edit: vi.fn(() => <span data-testid="edit-icon" />),
  Trash2: vi.fn(() => <span data-testid="trash-icon" />),
  Plus: vi.fn(() => <span data-testid="plus-icon" />)
}));

describe('RoomManagementPage', () => {
  const mockRooms = [
    { id: 1, name: "Deluxe Suite", type: "Suite", capacity: 2, price: "$200/night", status: "Available" },
    { id: 2, name: "Family Room", type: "Family", capacity: 4, price: "$250/night", status: "Occupied" },
    { id: 3, name: "Standard Room", type: "Standard", capacity: 2, price: "$100/night", status: "Maintenance" }
  ];
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component with all structural elements', () => {
    render(<RoomManagementPage />);
    
    // Check if sidebar and topbar are rendered
    expect(screen.getByTestId('sidebar-component')).toBeInTheDocument();
    expect(screen.getByTestId('topbar-component')).toBeInTheDocument();
    
    // Check if the page title is rendered
    expect(screen.getByText('Room Management')).toBeInTheDocument();
    expect(screen.getByTestId('home-icon')).toBeInTheDocument();
    
    // Check if the add new room button is rendered
    const addButton = screen.getByText('Add New Room');
    expect(addButton).toBeInTheDocument();
    expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
  });

  it('displays the table with correct column headers', () => {
    render(<RoomManagementPage />);
    
    const expectedHeaders = [
      'ID', 'Room Name', 'Type', 'Capacity', 'Price', 'Status', 'Actions'
    ];
    
    const tableHeaders = screen.getAllByRole('columnheader');
    expect(tableHeaders).toHaveLength(expectedHeaders.length);
    
    tableHeaders.forEach((header, index) => {
      expect(header).toHaveTextContent(expectedHeaders[index]);
    });
  });

  it('renders all room data correctly', () => {
    render(<RoomManagementPage />);
    
    const rows = screen.getAllByRole('row');
    // +1 for the header row
    expect(rows).toHaveLength(mockRooms.length + 1);
    
    mockRooms.forEach((room) => {
      const row = screen.getByText(room.name).closest('tr');
      
      expect(within(row).getByText(room.id.toString())).toBeInTheDocument();
      expect(within(row).getByText(room.name)).toBeInTheDocument();
      expect(within(row).getByText(room.type)).toBeInTheDocument();
      expect(within(row).getByText(`${room.capacity} persons`)).toBeInTheDocument();
      expect(within(row).getByText(room.price)).toBeInTheDocument();
      expect(within(row).getByText(room.status)).toBeInTheDocument();
      
      // Check if action buttons are present
      expect(within(row).getByTestId('edit-icon')).toBeInTheDocument();
      expect(within(row).getByTestId('trash-icon')).toBeInTheDocument();
    });
  });

  it('applies correct status colors based on room status', () => {
    render(<RoomManagementPage />);
    
    // Test for "Available" status
    const availableStatus = screen.getByText('Available');
    expect(availableStatus.className).toContain('bg-green-100');
    expect(availableStatus.className).toContain('text-green-800');
    
    // Test for "Occupied" status
    const occupiedStatus = screen.getByText('Occupied');
    expect(occupiedStatus.className).toContain('bg-blue-100');
    expect(occupiedStatus.className).toContain('text-blue-800');
    
    // Test for "Maintenance" status (default case)
    const maintenanceStatus = screen.getByText('Maintenance');
    expect(maintenanceStatus.className).toContain('bg-red-100');
    expect(maintenanceStatus.className).toContain('text-red-800');
  });

  it('has correctly styled action buttons', () => {
    render(<RoomManagementPage />);
    
    // Check edit buttons styling
    const editButtons = screen.getAllByTestId('edit-icon');
    editButtons.forEach((button) => {
      const parentButton = button.closest('button');
      expect(parentButton).toHaveClass('text-blue-600');
      expect(parentButton).toHaveClass('hover:text-blue-800');
    });
    
    // Check delete buttons styling
    const deleteButtons = screen.getAllByTestId('trash-icon');
    deleteButtons.forEach((button) => {
      const parentButton = button.closest('button');
      expect(parentButton).toHaveClass('text-red-600');
      expect(parentButton).toHaveClass('hover:text-red-800');
    });
  });

  it('has correct styling for the Add New Room button', () => {
    render(<RoomManagementPage />);
    
    const addButton = screen.getByText('Add New Room').closest('button');
    expect(addButton).toHaveClass('bg-blue-600');
    expect(addButton).toHaveClass('text-white');
    expect(addButton).toHaveClass('hover:bg-blue-700');
    expect(addButton).toHaveClass('rounded-md');
  });

  it('correctly formats the table structure with appropriate styling', () => {
    const { container } = render(<RoomManagementPage />);
    
    // Check main container structure
    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass('flex');
    expect(mainContainer).toHaveClass('h-screen');
    expect(mainContainer).toHaveClass('bg-gray-100');
    
    // Check table container styling
    const table = screen.getByRole('table');
    expect(table).toHaveClass('w-full');
    
    const tableContainer = table.parentElement;
    expect(tableContainer).toHaveClass('bg-white');
    expect(tableContainer).toHaveClass('rounded-lg');
    expect(tableContainer).toHaveClass('shadow-sm');
    
    // Check that the table has dividers between rows
    const tableBody = table.querySelector('tbody');
    expect(tableBody).toHaveClass('divide-y');
    expect(tableBody).toHaveClass('divide-gray-200');
  });

  it('tests getStatusClass function for all status cases', () => {
    render(<RoomManagementPage />);
    
    // The function has been tested implicitly through the rendered elements
    // for "Available", "Occupied", and the default case "Maintenance"
    
    // Available case - already tested in 'applies correct status colors' test
    const availableStatus = screen.getByText('Available');
    expect(availableStatus.className).toContain('bg-green-100');
    expect(availableStatus.className).toContain('text-green-800');
    
    // Occupied case - already tested in 'applies correct status colors' test
    const occupiedStatus = screen.getByText('Occupied');
    expect(occupiedStatus.className).toContain('bg-blue-100');
    expect(occupiedStatus.className).toContain('text-blue-800');
    
    // Default case - already tested in 'applies correct status colors' test
    const maintenanceStatus = screen.getByText('Maintenance');
    expect(maintenanceStatus.className).toContain('bg-red-100');
    expect(maintenanceStatus.className).toContain('text-red-800');
  });
});