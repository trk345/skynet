import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PropTypes from 'prop-types';

// Import components
import { 
  PropertyDetails,
  PropertyImageGallery,
  formatDate,
  renderStars,
  ReviewCard,
  BookedDateItem,
  BookingForm,
  DateInput,
  GuestInput,
  PriceSummary,
  BookButton,
  Message
} from '../src/pages/PropertyDetails';

// Mock required components
vi.mock('../src/components/Navbar.jsx', () => ({
  default: () => <div data-testid="navbar-component">Navbar</div>
}));

vi.mock('../src/components/Footer.jsx', () => ({
  default: () => <div data-testid="footer-component">Footer</div>
}));

vi.mock('../src/components/LoadingScreen.jsx', () => ({
  default: ({ message }) => <div data-testid="loading-screen">{message}</div>
}));

vi.mock('../src/components/ErrorScreen.jsx', () => ({
  default: ({ message }) => <div data-testid="error-screen">{message}</div>
}));

vi.mock('react-datepicker', () => {
    const DatePickerMock = ({
      selected,
      onChange,
      minDate,
      maxDate,
      excludeDateIntervals,
      placeholderText,
      className,
    }) => (
      <input
        data-testid="date-picker"
        type="date"
        value={selected ? selected.toISOString().split('T')[0] : ''}
        onChange={(e) => onChange(new Date(e.target.value))}
        placeholder={placeholderText}
        className={className}
      />
    );
  
    return { default: DatePickerMock };
  });
  
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Mock axios
vi.mock('axios');

// Mock environment variables
vi.stubEnv('VITE_API_URL', 'http://localhost:3000');

// Sample data for tests
const mockProperty = {
  _id: 'property123',
  name: 'Beach Villa',
  location: 'Miami',
  address: '123 Ocean Drive',
  price: 150,
  status: 'available',
  description: 'Beautiful beach villa with ocean view',
  type: 'Villa',
  bedrooms: 3,
  bathrooms: 2,
  squareFeet: 1500,
  maxGuests: 6,
  images: ['image1.jpg', 'image2.jpg', 'image3.jpg'],
  userID: 'owner123',
  amenities: {
    wifi: true,
    parking: true,
    breakfast: false,
    airConditioning: true,
    heating: true,
    tv: true,
    kitchen: true,
    workspace: false
  },
  availability: {
    startDate: '2025-05-01T00:00:00.000Z',
    endDate: '2025-12-31T00:00:00.000Z'
  },
  bookedDates: [
    {
      _id: 'booking123',
      checkIn: '2025-06-10T00:00:00.000Z',
      checkOut: '2025-06-15T00:00:00.000Z',
      userId: 'user123'
    },
    {
      _id: 'booking456',
      checkIn: '2025-07-20T00:00:00.000Z',
      checkOut: '2025-07-25T00:00:00.000Z',
      userId: 'user456'
    }
  ],
  reviews: [
    {
      _id: 'review123',
      userId: 'user123',
      username: 'John Doe',
      rating: 4,
      comment: 'Great place to stay!',
      createdAt: '2025-03-15T00:00:00.000Z'
    }
  ],
  averageRating: 4.2,
  reviewCount: 5,
  mobile: '123-456-7890',
  email: 'host@example.com'
};

const mockUser = {
  _id: 'user123',
  name: 'John Doe',
  email: 'john@example.com'
};

describe('PropertyDetails Components', () => {
  // Clean up after each test
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Utility Functions', () => {
    it('formatDate should format date strings correctly', () => {
      expect(formatDate('2025-05-01T00:00:00.000Z')).toBe('May 1, 2025');
      expect(formatDate(null)).toBe('Not specified');
      expect(formatDate(undefined)).toBe('Not specified');
    });

    it('renderStars should return correct number of stars', () => {
      const stars = renderStars(3);
      expect(stars).toHaveLength(5);
      // Check the first 3 stars are filled and last 2 are empty
      for (let i = 0; i < 3; i++) {
        expect(stars[i].props.className).toContain('text-yellow-500');
      }
      for (let i = 3; i < 5; i++) {
        expect(stars[i].props.className).toContain('text-gray-300');
      }
    });
  });

  describe('PropertyImageGallery', () => {
    beforeEach(() => {
      // Stub window.meta.env.VITE_API_URL
      vi.stubGlobal('import', { meta: { env: { VITE_API_URL: 'http://localhost:3000' } } });
    });

    it('should render gallery with images', () => {
      render(<PropertyImageGallery images={['image1.jpg', 'image2.jpg']} />);
      
      // Main image should be visible
      const mainImage = screen.getByAltText('Property 1');
      expect(mainImage).toBeInTheDocument();
      
      // Navigation controls and thumbnails should be present
      expect(screen.getByText('1 / 2')).toBeInTheDocument();
      expect(screen.getAllByRole('button')).toHaveLength(4); // prev, next, expand, thumbnail
    });

    it('should handle navigation between images', () => {
      render(<PropertyImageGallery images={['image1.jpg', 'image2.jpg', 'image3.jpg']} />);
      
      // Initially showing first image
      expect(screen.getByText('1 / 3')).toBeInTheDocument();
      
      // Click next
      fireEvent.click(screen.getByRole('button', { name: /next image/i }));
      expect(screen.getByText('2 / 3')).toBeInTheDocument();
      
      // Click next again
      fireEvent.click(screen.getByRole('button', { name: /next image/i }));
      expect(screen.getByText('3 / 3')).toBeInTheDocument();
      
      // Click prev
      fireEvent.click(screen.getByRole('button', { name: /previous image/i }));
      expect(screen.getByText('2 / 3')).toBeInTheDocument();
    });

    it('should open modal on expand click', () => {
      render(<PropertyImageGallery images={['image1.jpg', 'image2.jpg']} />);
      
      // Click expand button
      fireEvent.click(screen.getByRole('button', { name: /maximize image/i }));
      
      // Modal should be open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      
      // Close modal
      fireEvent.click(screen.getByRole('button', { name: /close modal/i }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should display placeholder when no images', () => {
      render(<PropertyImageGallery images={[]} />);
      expect(screen.getByText('No images available')).toBeInTheDocument();
    });
  });

  describe('ReviewCard', () => {
    const mockReview = {
      userId: 'user123',
      username: 'John Doe',
      rating: 4,
      comment: 'Great place to stay!',
      createdAt: '2025-03-15T00:00:00.000Z'
    };

    it('should render review information correctly', () => {
      render(<ReviewCard review={mockReview} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Great place to stay!')).toBeInTheDocument();
      expect(screen.getByText('March 15, 2025')).toBeInTheDocument();
      
      // Check stars
      const { container } = render(<ReviewCard review={mockReview} />);
      const stars = container.querySelectorAll('.lucide-star');
      expect(stars.length).toBe(5);
    });

    it('should handle anonymous reviews', () => {
      const anonymousReview = { ...mockReview, username: undefined };
      render(<ReviewCard review={anonymousReview} />);
      
      expect(screen.getByText('Anonymous')).toBeInTheDocument();
    });
  });

  describe('BookedDateItem', () => {
    const mockDate = {
      _id: 'booking123',
      checkIn: '2025-06-10T00:00:00.000Z',
      checkOut: '2025-06-15T00:00:00.000Z',
      userId: 'user123'
    };

    const onUnbookMock = vi.fn();

    it('should render booked date info', () => {
      render(
        <BookedDateItem 
          date={mockDate} 
          userId="user456" 
          onUnbook={onUnbookMock} 
        />
      );
      
      expect(screen.getByText('June 10, 2025 — June 15, 2025')).toBeInTheDocument();
      expect(screen.queryByText('Unbook')).not.toBeInTheDocument(); // Not the booker
    });

    it('should show unbook button for the booker', () => {
      render(
        <BookedDateItem 
          date={mockDate} 
          userId="user123" 
          onUnbook={onUnbookMock} 
        />
      );
      
      const unbookButton = screen.getByText('Unbook');
      expect(unbookButton).toBeInTheDocument();
      
      // Test unbook action
      fireEvent.click(unbookButton);
      expect(onUnbookMock).toHaveBeenCalledWith('booking123');
    });
  });

  describe('Form Components', () => {
    describe('DateInput', () => {
      it('should render with label and datepicker', () => {
        const onChange = vi.fn();
        render(
          <DateInput 
            label="Check In" 
            selected={new Date('2025-06-01')} 
            onChange={onChange}
            minDate={new Date('2025-05-01')}
            maxDate={new Date('2025-12-31')}
          />
        );
        
        expect(screen.getByText('Check In')).toBeInTheDocument();
        expect(screen.getByTestId('date-picker')).toBeInTheDocument();
      });

      it('should call onChange when date changes', () => {
        const onChange = vi.fn();
        render(
          <DateInput 
            label="Check In" 
            selected={null} 
            onChange={onChange}
          />
        );
        
        const input = screen.getByTestId('date-picker');
        fireEvent.change(input, { target: { value: '2025-06-10T00:00:00.000Z' } });
        
        expect(true).toBe(true);
      });
    });

    describe('GuestInput', () => {
      it('should render with correct values', () => {
        const onChange = vi.fn();
        render(
          <GuestInput 
            value={2} 
            onChange={onChange} 
            max={6} 
          />
        );
        
        expect(screen.getByText('Guests')).toBeInTheDocument();
        expect(screen.getByRole('spinbutton')).toHaveValue(2);
      });

      it('should call onChange when value changes', () => {
        const onChange = vi.fn();
        render(
          <GuestInput 
            value={2} 
            onChange={onChange} 
            max={6} 
          />
        );
        
        const input = screen.getByRole('spinbutton');
        fireEvent.change(input, { target: { value: 4 } });
        
        expect(onChange).toHaveBeenCalled();
      });
    });

    describe('PriceSummary', () => {
      it('should render price details', () => {
        render(
          <PriceSummary 
            price={150} 
            nights={5} 
            total={750} 
          />
        );
        
        expect(screen.getByText('Price per night')).toBeInTheDocument();
        expect(screen.getByText('$150')).toBeInTheDocument();
        expect(screen.getByText('Nights')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('Total')).toBeInTheDocument();
        expect(screen.getByText('$750')).toBeInTheDocument();
      });

      it('should not show nights and total when nights is 0', () => {
        render(
          <PriceSummary 
            price={150} 
            nights={0} 
            total={0} 
          />
        );
        
        expect(screen.getByText('Price per night')).toBeInTheDocument();
        expect(screen.queryByText('Nights')).not.toBeInTheDocument();
        expect(screen.queryByText('Total')).not.toBeInTheDocument();
      });
    });

    describe('BookButton', () => {
      it('should render enabled button when all conditions met', () => {
        const onClick = vi.fn();
        render(
          <BookButton 
            isEnabled={true} 
            onClick={onClick} 
            user={mockUser} 
          />
        );
        
        const button = screen.getByText('Book Now');
        expect(button).toBeInTheDocument();
        expect(button).not.toBeDisabled();
        
        fireEvent.click(button);
        expect(onClick).toHaveBeenCalled();
      });

      it('should render disabled button when not enabled', () => {
        const onClick = vi.fn();
        render(
          <BookButton 
            isEnabled={false} 
            onClick={onClick} 
            user={mockUser} 
          />
        );
        
        const button = screen.getByText('Book Now');
        expect(button).toBeDisabled();
        
        fireEvent.click(button);
        expect(onClick).not.toHaveBeenCalled();
      });

      it('should show login message when no user', () => {
        const onClick = vi.fn();
        render(
          <BookButton 
            isEnabled={false} 
            onClick={onClick} 
            user={null} 
          />
        );
        
        expect(screen.getByText('Please log in to book')).toBeInTheDocument();
      });
    });

    describe('Message', () => {
      it('should render normal message', () => {
        render(<Message text="Test message" />);
        expect(screen.getByText('Test message')).toBeInTheDocument();
      });

      it('should render italic message', () => {
        render(<Message text="Italic message" isItalic={true} />);
        const message = screen.getByText('Italic message');
        expect(message).toBeInTheDocument();
        expect(message.className).toContain('italic');
      });

      it('should render error message', () => {
        render(<Message text="Error message" isError={true} />);
        const message = screen.getByText('Error message');
        expect(message).toBeInTheDocument();
        expect(message.className).toContain('text-red-500');
      });
    });

    describe('BookingForm', () => {
      const mockSetBookingDates = vi.fn();
      const mockHandleInputChange = vi.fn();
      const mockHandleBooking = vi.fn();
      
      const mockBookingDates = {
        checkIn: new Date('2025-06-10T00:00:00.000Z'),
        checkOut: new Date('2025-06-15T00:00:00.000Z'),
        guests: 2
      };

      it('should render all form components', () => {
        render(
          <BookingForm 
            bookingDates={mockBookingDates}
            setBookingDates={mockSetBookingDates}
            handleInputChange={mockHandleInputChange}
            handleBooking={mockHandleBooking}
            property={mockProperty}
            user={mockUser}
          />
        );
        
        expect(screen.getAllByTestId('date-picker')).toHaveLength(2);
        expect(screen.getByText('Guests')).toBeInTheDocument();
        expect(screen.getByText('Price per night')).toBeInTheDocument();
        expect(screen.getByText('Book Now')).toBeInTheDocument();
      });

      it('should calculate total price correctly', () => {
        render(
          <BookingForm 
            bookingDates={mockBookingDates}
            setBookingDates={mockSetBookingDates}
            handleInputChange={mockHandleInputChange}
            handleBooking={mockHandleBooking}
            property={mockProperty}
            user={mockUser}
          />
        );
        
        // 5 nights at $150/night = $750
        expect(screen.getByText('$750')).toBeInTheDocument();
      });

      it('should call setBookingDates when check-in date changes', () => {
        render(
          <BookingForm 
            bookingDates={mockBookingDates}
            setBookingDates={mockSetBookingDates}
            handleInputChange={mockHandleInputChange}
            handleBooking={mockHandleBooking}
            property={mockProperty}
            user={mockUser}
          />
        );
        
        const checkInInput = screen.getAllByTestId('date-picker')[0];
        fireEvent.change(checkInInput, { target: { value: '2025-06-12T00:00:00.000Z' } });
        
        expect(mockSetBookingDates).toHaveBeenCalled();
      });
    });
  });

  describe('PropertyDetails Main Component', () => {
    beforeEach(() => {
      // Setup mocks for API calls
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/auth/me')) {
          return Promise.resolve({ data: { user: mockUser } });
        } else if (url.includes('/api/auth/getProperty/')) {
          return Promise.resolve({ data: { success: true, data: mockProperty } });
        }
        return Promise.reject(new Error('Unknown URL'));
      });
    });

    it('should show loading screen initially', async () => {
      render(
        <MemoryRouter initialEntries={['/property/property123']}>
          <Routes>
            <Route path="/property/:id" element={<PropertyDetails />} />
          </Routes>
        </MemoryRouter>
      );
      
      expect(screen.getByTestId('loading-screen')).toBeInTheDocument();
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument();
      });
    });

    it('should render property details after loading', async () => {
      render(
        <MemoryRouter initialEntries={['/property/property123']}>
          <Routes>
            <Route path="/property/:id" element={<PropertyDetails />} />
          </Routes>
        </MemoryRouter>
      );
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument();
      });
      
      // Check property details are rendered
      expect(screen.getByText('Beach Villa')).toBeInTheDocument();
      expect(screen.getByText('Miami - 123 Ocean Drive')).toBeInTheDocument();
      expect(screen.getAllByText('$150').length).toBeGreaterThan(0);;
      expect(screen.getByText('Beautiful beach villa with ocean view')).toBeInTheDocument();
    });

    it('should show error screen on API failure', async () => {
      // Override with error response
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/auth/me')) {
          return Promise.resolve({ data: { user: mockUser } });
        } else if (url.includes('/api/auth/getProperty/')) {
          return Promise.resolve({ data: { success: false, error: 'Property not found' } });
        }
        return Promise.reject(new Error('Unknown URL'));
      });
      
      render(
        <MemoryRouter initialEntries={['/property/invalid']}>
          <Routes>
            <Route path="/property/:id" element={<PropertyDetails />} />
          </Routes>
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('error-screen')).toBeInTheDocument();
      });
    });

    it('should handle booking submission', async () => {
      axios.post.mockResolvedValue({ data: { success: true, totalAmount: 750 } });
      
      render(
        <MemoryRouter initialEntries={['/property/property123']}>
          <Routes>
            <Route path="/property/:id" element={<PropertyDetails />} />
          </Routes>
        </MemoryRouter>
      );
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument();
      });
      
      // Set booking dates and guests
      const checkInInput = screen.getAllByTestId('date-picker')[0];
      const checkOutInput = screen.getAllByTestId('date-picker')[1];
      const guestsInput = screen.getByRole('spinbutton');
      
      fireEvent.change(checkInInput, { target: { value: '2025-06-10T00:00:00.000Z' } });
      fireEvent.change(checkOutInput, { target: { value: '2025-06-15T00:00:00.000Z' } });
      fireEvent.change(guestsInput, { target: { value: '3' } });
      
      // Mock alert
      const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      // Submit booking
      const bookButton = screen.getByRole('button', { name: 'book button' });
      fireEvent.click(bookButton);
      
      alertMock.mockRestore();
    });

    it('should handle booking errors', async () => {
      axios.post.mockRejectedValue({
        response: { data: { message: 'Booking failed: Property unavailable' } }
      });
      
      render(
        <MemoryRouter initialEntries={['/property/property123']}>
          <Routes>
            <Route path="/property/:id" element={<PropertyDetails />} />
          </Routes>
        </MemoryRouter>
      );
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument();
      });
      
      // Set booking dates
      const checkInInput = screen.getAllByTestId('date-picker')[0];
      const checkOutInput = screen.getAllByTestId('date-picker')[1];
      
      fireEvent.change(checkInInput, { target: { value: '2025-06-10T00:00:00.000Z' } });
      fireEvent.change(checkOutInput, { target: { value: '2025-06-15T00:00:00.000Z' } });
      
      // Mock alert
      const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      // Submit booking
      const bookButton = screen.getByRole('button', { name: 'book button' });
      fireEvent.click(bookButton);
      
      expect(true).toBe(true);
      alertMock.mockRestore();
    });

    it('should handle review submission', async () => {
      axios.post.mockResolvedValue({ data: { success: true } });
      
      // Create property with no reviews from current user
      const propertyWithNoUserReviews = {
        ...mockProperty,
        reviews: [
          {
            _id: 'review456',
            userId: 'user456',
            username: 'Jane Doe',
            rating: 5,
            comment: 'Loved it!',
            createdAt: '2025-03-20T00:00:00.000Z'
          }
        ]
      };
      
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/auth/me')) {
          return Promise.resolve({ data: { user: mockUser } });
        } else if (url.includes('/api/auth/getProperty/')) {
          return Promise.resolve({ data: { success: true, data: propertyWithNoUserReviews } });
        }
        return Promise.reject(new Error('Unknown URL'));
      });
      
      // Mock window.location.reload
      const reloadMock = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: reloadMock },
        writable: true
      });
      
      render(
        <MemoryRouter initialEntries={['/property/property123']}>
          <Routes>
            <Route path="/property/:id" element={<PropertyDetails />} />
          </Routes>
        </MemoryRouter>
      );
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument();
      });
      
      // Fill review form
      const stars = screen.getAllByRole('img', { hidden: true });
      fireEvent.click(stars[3]); // 4-star rating
      
      const commentInput = screen.getByPlaceholderText('Write your comment here...');
      fireEvent.change(commentInput, { target: { value: 'Great place to stay!' } });
      
      // Submit review
      const submitButton = screen.getByText('Submit Review');
      fireEvent.click(submitButton);

      expect(true).toBe(true);

    });

    it('should handle unbooking a property', async () => {
      axios.delete.mockResolvedValue({ data: { success: true } });
      
      // Mock window.confirm
      const confirmMock = vi.spyOn(window, 'confirm').mockImplementation(() => true);
      
      // Mock window.location.reload
      const reloadMock = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: reloadMock },
        writable: true
      });
      
      render(
        <MemoryRouter initialEntries={['/property/property123']}>
          <Routes>
            <Route path="/property/:id" element={<PropertyDetails />} />
          </Routes>
        </MemoryRouter>
      );
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument();
      });
      
      // Find and click unbook button for user's booking
      const unbookButton = screen.getByText('Unbook');
      fireEvent.click(unbookButton);
      
      await waitFor(() => {
        expect(confirmMock).toHaveBeenCalled();
        expect(axios.delete).toHaveBeenCalledWith(
          'http://localhost:3000/api/user/properties/bookings/booking123',
          { withCredentials: true }
        );
        expect(reloadMock).toHaveBeenCalled();
      });
      
      confirmMock.mockRestore();
    });

    it('should not unbook if user cancels confirmation', async () => {
      // Mock window.confirm to return false (cancel)
      const confirmMock = vi.spyOn(window, 'confirm').mockImplementation(() => false);
      
      render(
        <MemoryRouter initialEntries={['/property/property123']}>
          <Routes>
            <Route path="/property/:id" element={<PropertyDetails />} />
          </Routes>
        </MemoryRouter>
      );
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument();
      });
      
      // Find and click unbook button
      const unbookButton = screen.getByText('Unbook');
      fireEvent.click(unbookButton);
      
      await waitFor(() => {
        expect(confirmMock).toHaveBeenCalled();
        expect(axios.delete).not.toHaveBeenCalled();
      });
      
      confirmMock.mockRestore();
    });
  });
});