import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import UserDashboard from '../src/pages/UserDashboard';
import axios from 'axios';
import { toast } from 'react-toastify';

// Mock modules
vi.mock('axios');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));
vi.mock('../src/components/Navbar.jsx', () => ({
  default: () => <div data-testid="navbar-mock">Navbar</div>
}));
vi.mock('../src/components/Footer.jsx', () => ({
  default: () => <div data-testid="footer-mock">Footer</div>
}));

describe('UserDashboard Component', () => {
  // Test data
  const mockUser = {
    _id: 'user123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'vendor'
  };

  const mockProperties = [
    {
      _id: 'prop1',
      name: 'Beach House',
      type: 'Villa',
      price: '200',
      location: 'Miami',
      maxGuests: 4,
      status: 'available',
      createdAt: '2023-01-01T00:00:00.000Z',
      averageRating: 4.5,
      reviews: [{ user: 'John', comment: 'Great place to stay!' }],
      images: ['image1.jpg']
    },
    {
      _id: 'prop2',
      name: 'Mountain Cabin',
      type: 'Cabin',
      price: '150',
      location: 'Denver',
      maxGuests: 2,
      status: 'available',
      createdAt: '2023-02-01T00:00:00.000Z',
      averageRating: 4.0,
      reviews: [],
      images: []
    }
  ];

  const mockBookings = [
    {
      _id: 'booking1',
      propertyId: {
        _id: 'prop1',
        name: 'Beach House',
        location: 'Miami',
        images: ['image1.jpg']
      },
      status: 'confirmed',
      guests: 2,
      checkIn: '2025-05-01T14:00:00.000Z',
      checkOut: '2025-05-05T10:00:00.000Z',
      totalAmount: 800
    },
    {
      _id: 'booking2',
      propertyId: {
        _id: 'prop2',
        name: 'Mountain Cabin',
        location: 'Denver',
        images: []
      },
      status: 'pending',
      guests: 1,
      checkIn: '2024-01-01T14:00:00.000Z',
      checkOut: '2024-01-05T10:00:00.000Z',
      totalAmount: 600
    }
  ];

  // Helper function for common rendering with default mocks
  const renderUserDashboard = (customMocks = {}) => {
    // Default API responses
    const defaultMocks = {
      user: mockUser,
      properties: mockProperties,
      bookings: mockBookings,
      deletePropertySuccess: true,
      cancelBookingSuccess: true
    };

    // Merge custom mocks with defaults
    const mocks = { ...defaultMocks, ...customMocks };

    // Setup axios mocks
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ data: { user: mocks.user } });
      }
      if (url.includes('/api/vendor/getProperties')) {
        return Promise.resolve({ 
          data: { 
            success: mocks.properties !== null, 
            data: mocks.properties || [],
            error: mocks.propertiesError
          } 
        });
      }
      if (url.includes('/api/user/getBookings')) {
        return Promise.resolve({ 
          data: { 
            success: mocks.bookings !== null, 
            data: mocks.bookings || [],
            error: mocks.bookingsError
          } 
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    axios.delete.mockImplementation((url) => {
      if (url.includes('/api/vendor/deleteProperty')) {
        return Promise.resolve({ 
          data: { 
            success: mocks.deletePropertySuccess,
            error: mocks.deletePropertySuccess ? null : 'Delete failed'
          } 
        });
      }
      if (url.includes('/api/user/properties/bookings')) {
        return Promise.resolve({ 
          data: { 
            success: mocks.cancelBookingSuccess,
            error: mocks.cancelBookingSuccess ? null : 'Cancellation failed'
          } 
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    return render(
      <BrowserRouter>
        <UserDashboard />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    // Mock confirm
    window.confirm = vi.fn(() => true);
    
    // Mock environment variables
    vi.stubEnv('VITE_API_URL', 'http://localhost:5000');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('User and Role Detection', () => {
    it('renders vendor dashboard for vendor users', async () => {
      renderUserDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('Vendor Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Manage your properties and customer feedback')).toBeInTheDocument();
      });
    });

    it('renders user dashboard for non-vendor users', async () => {
      renderUserDashboard({ user: { ...mockUser, role: 'user' } });
      
      await waitFor(() => {
        expect(screen.getByText('User Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Manage your bookings')).toBeInTheDocument();
        expect(screen.queryByText('My Properties')).not.toBeInTheDocument();
      });
    });
  });

  describe('Properties Management', () => {
    it('renders property cards when properties are loaded', async () => {
      renderUserDashboard();
      
      await waitFor(() => {
        // Fix: Use expect.any(HTMLElement) instead of toBeInTheDocument() for array results
        const elements = screen.getAllByText('Beach House');
        expect(elements.length).toBeGreaterThan(0);
        expect(elements[0]).toBeInTheDocument();
        
        const cabinElements = screen.getAllByText('Mountain Cabin');
        expect(cabinElements.length).toBeGreaterThan(0);
        expect(cabinElements[0]).toBeInTheDocument();
      });
    });

    it('shows empty state when no properties are found', async () => {
      renderUserDashboard({ properties: [] });
      
      await waitFor(() => {
        expect(screen.getByText('No Properties Found')).toBeInTheDocument();
        expect(screen.getByText("You haven't added any properties yet or none match your search.")).toBeInTheDocument();
      });
    });

    it('handles property deletion success', async () => {
      renderUserDashboard();
      
      await waitFor(() => {
        const elements = screen.getAllByText('Beach House');
        expect(elements.length).toBeGreaterThan(0);
        expect(elements[0]).toBeInTheDocument();
      });

      const deleteButtons = await screen.findAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalled();
      expect(axios.delete).toHaveBeenCalledWith(
        'http://localhost:5000/api/vendor/deleteProperty/prop2',
        { withCredentials: true }
      );
    });

    it('shows error when property deletion fails', async () => {
      const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
      renderUserDashboard({ deletePropertySuccess: false });
      
      await waitFor(() => {
        const elements = screen.getAllByText('Beach House');
        expect(elements.length).toBeGreaterThan(0);
        expect(elements[0]).toBeInTheDocument();
      });

      const deleteButtons = await screen.findAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith('Failed to delete property: Delete failed');
      });

      alertMock.mockRestore();
    });

    it('shows error when properties fetch fails', async () => {
      const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
      renderUserDashboard({ 
        properties: null,
        propertiesError: 'Failed to fetch'
      });
      
      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith('Failed to fetch properties. Please try again later');
      });

      alertMock.mockRestore();
    });
  });

  describe('Properties Filtering and Sorting', () => {
    it('filters properties by search query', async () => {
      renderUserDashboard();
      
      await waitFor(() => {
        const beachElements = screen.getAllByText('Beach House');
        expect(beachElements.length).toBeGreaterThan(0);
        expect(beachElements[0]).toBeInTheDocument();
        
        const cabinElements = screen.getAllByText('Mountain Cabin');
        expect(cabinElements.length).toBeGreaterThan(0);
        expect(cabinElements[0]).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search properties...');
      fireEvent.change(searchInput, { target: { value: 'Beach' } });

      await waitFor(() => {
        const beachElements = screen.getAllByText('Beach House');
        expect(beachElements.length).toBeGreaterThan(0);
        expect(beachElements[0]).toBeInTheDocument();
      });
    });

    it('sorts properties by name', async () => {
      renderUserDashboard();
      
      await waitFor(() => {
        const elements = screen.getAllByText('Beach House');
        expect(elements.length).toBeGreaterThan(0);
        expect(elements[0]).toBeInTheDocument();
      });

      const sortButton = screen.getByText('Sort');
      fireEvent.click(sortButton);

      const nameAZOption = screen.getByText('Name (A-Z)');
      fireEvent.click(nameAZOption);

      // Check if sorting applied - can verify by checking properties in DOM
      const propertyCards = screen.getAllByText(/Beach House|Mountain Cabin/);
      expect(propertyCards[0].textContent).toBe('Beach House');
    });
  });

  describe('Bookings Management', () => {
    it('displays bookings and filters them', async () => {
      renderUserDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('My Bookings')).toBeInTheDocument();
        // Default filter is 'upcoming'
        const elements = screen.getAllByText('Beach House');
        expect(elements.length).toBeGreaterThan(0);
        expect(elements[0]).toBeInTheDocument();
      });

      // Switch to past bookings
      const pastButton = screen.getByText('Past');
      fireEvent.click(pastButton);

      await waitFor(() => {
        const cabinElements = screen.getAllByText('Mountain Cabin');
        expect(cabinElements.length).toBeGreaterThan(0);
        expect(cabinElements[0]).toBeInTheDocument();
      });
    });

    it('shows empty state when no bookings found', async () => {
      renderUserDashboard({ bookings: [] });
      
      await waitFor(() => {
        expect(screen.getByText('No Bookings Found')).toBeInTheDocument();
        expect(screen.getByText("You don't have any upcoming bookings.")).toBeInTheDocument();
      });
    });

    it('handles booking cancellation success', async () => {
        renderUserDashboard();
        
        await waitFor(() => {
          const elements = screen.getAllByText('Beach House');
          expect(elements.length).toBeGreaterThan(0);
          expect(elements[0]).toBeInTheDocument();
        });
  
        // Mock axios.delete to ensure it calls toast.success correctly
        axios.delete.mockImplementationOnce((url, options) => {
          expect(url).toBe('http://localhost:5000/api/user/properties/bookings/booking1');
          expect(options).toEqual({ withCredentials: true });
          return Promise.resolve({ 
            data: { 
              success: true
            } 
          });
        });
  
        const cancelButtons = await screen.findAllByText('Cancel Booking');
        fireEvent.click(cancelButtons[0]);
  
        expect(window.confirm).toHaveBeenCalled();
        
        // Wait for the toast to be called after the async operation completes
        await waitFor(() => {
          expect(toast.success).toHaveBeenCalledWith('Booking cancelled successfully.');
        });
    });
  
      it('handles booking cancellation error', async () => {
        axios.delete.mockImplementationOnce(() => 
          Promise.reject({ response: { data: { message: 'Cannot cancel' } } })
        );
        
        renderUserDashboard();
        
        await waitFor(() => {
          const elements = screen.getAllByText('Beach House');
          expect(elements.length).toBeGreaterThan(0);
          expect(elements[0]).toBeInTheDocument();
        });
  
        const cancelButtons = await screen.findAllByText('Cancel Booking');
        fireEvent.click(cancelButtons[0]);
  
        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith('Cannot cancel');
        });
    });
  });
});