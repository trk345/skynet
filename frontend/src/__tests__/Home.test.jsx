import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { Home, PropertyImageGallery } from '../pages/Home';
import axios from 'axios';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock the modules
vi.mock('axios');
vi.mock('../components/Navbar.jsx', () => ({
  default: () => <div data-testid="navbar">Navbar</div>
}));
vi.mock('../components/Footer.jsx', () => ({
  default: () => <div data-testid="footer">Footer</div>
}));
vi.mock('../src/vite', () => ({
  env: {
    VITE_API_URL: 'http://localhost:4000'
  }
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  School: () => <div>School</div>,
  MapPin: () => <div>MapPin</div>,
  Users: () => <div>Users</div>,
  Building: () => <div>Building</div>,
  ChevronLeft: () => <div>ChevronLeft</div>,
  ChevronRight: () => <div>ChevronRight</div>
}));

// Mock react-router-dom Link component
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Link: ({ to, children, className }) => (
      <a href={to} className={className} data-testid="mock-link">
        {children}
      </a>
    )
  };
});

// Mock environment variables for Vite
beforeEach(() => {
  vi.stubGlobal('import.meta', {
    env: {
      VITE_API_URL: 'http://localhost:4000'
    }
  });
});

const mockProperties = [
  {
    _id: '1',
    name: 'Test Property',
    description: 'Test Description',
    address: 'Test Address',
    price: 100,
    type: 'Standard Room',
    location: 'Test Location',
    maxGuests: 2,
    averageRating: 4,
    reviewCount: 10,
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: '',
    availability: {
        startDate: null,
        endDate: null,
    },
    mobile: '01234567891',
    email: 'test@gmail.com',
    status: 'available',
    images: ['image1.jpg', 'image2.jpg'],
    amenities: {
      wifi: true,
      parking: true,
      breakfast: false,
      tv: false,
      kitchen: false,
      airConditioning: true,
      heating: false,
      workspace: true
    },
  },
  {
    _id: '2',
    name: 'Luxury Test Property',
    address:'Luxury Test Address',
    description: 'Luxury Test Description',
    bedrooms: 2,
    mobile: '01234567892',
    email: 'test2@gmail.com',
    bathrooms: 2,
    price: 200,
    type: 'Luxury Room',
    location: 'Premium Location',
    maxGuests: 4,
    averageRating: 5,
    reviewCount: 20,
    status: 'booked',
    images: [],
    amenities: {
        wifi: true,
        parking: true,
        breakfast: false,
        tv: false,
        kitchen: false,
        airConditioning: true,
        heating: false,
        workspace: true    },
  },
];

// PropertyImageGallery Tests
describe('PropertyImageGallery Component', () => {
  it('renders default icon when no images are provided', () => {
    render(<PropertyImageGallery />);
    expect(screen.getByText('Building')).toBeDefined();
  });

  it('renders image when images are provided', () => {
    render(<PropertyImageGallery images={['image1.jpg']} />);
    const image = screen.getByAltText('Property 1');
    expect(image).toBeDefined();
    expect(image.src).toContain('http://localhost:4000/image1.jpg');
  });

  it('does not show navigation arrows with a single image', () => {
    render(<PropertyImageGallery images={['image1.jpg']} />);
    expect(screen.queryByText('ChevronLeft')).toBeNull();
    expect(screen.queryByText('ChevronRight')).toBeNull();
  });

  it('shows navigation arrows and counter with multiple images', () => {
    render(<PropertyImageGallery images={['image1.jpg', 'image2.jpg']} />);
    expect(screen.getByText('ChevronRight')).toBeDefined();
    expect(screen.getByText('1 / 2')).toBeDefined();
  });

  it('navigates to next image when next button is clicked', () => {
    render(<PropertyImageGallery images={['image1.jpg', 'image2.jpg']} />);
    
    const nextButton = screen.getByText('ChevronRight').closest('button');
    fireEvent.click(nextButton);
    
    expect(screen.getByAltText('Property 2')).toBeDefined();
    expect(screen.getByText('2 / 2')).toBeDefined();
    expect(screen.queryByText('ChevronRight')).toBeNull(); // Next button should be gone at the end
  });

  it('navigates to previous image when previous button is clicked', () => {
    render(<PropertyImageGallery images={['image1.jpg', 'image2.jpg']} />);
    
    // First navigate to second image
    const nextButton = screen.getByText('ChevronRight').closest('button');
    fireEvent.click(nextButton);
    
    // Then go back
    const prevButton = screen.getByText('ChevronLeft').closest('button');
    fireEvent.click(prevButton);
    
    expect(screen.getByAltText('Property 1')).toBeDefined();
    expect(screen.getByText('1 / 2')).toBeDefined();
    expect(screen.queryByText('ChevronLeft')).toBeNull(); // Prev button should be gone at the start
  });

  it('prevents event propagation when clicking navigation buttons', () => {
    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    };
    
    render(<PropertyImageGallery images={['image1.jpg', 'image2.jpg']} />);
    
    const nextButton = screen.getByText('ChevronRight').closest('button');
    // This is a mock version of the event, but we're mostly checking component functionality
    fireEvent.click(nextButton, mockEvent);
    
    expect(screen.getByAltText('Property 2')).toBeDefined();
  });
});

describe('Home Component', () => {
  beforeEach(() => {
    axios.get.mockReset();
  });

  test('renders the home page with navbar and footer', () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, data: [] } });
    
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByText('Find Your Perfect Room')).toBeInTheDocument();
  });

  test('renders the search form with all fields', () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, data: [] } });
    
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    
    expect(screen.getByPlaceholderText('Location')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Max Price')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Max Guests')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Min Rating')).toBeInTheDocument();
    expect(screen.getByText('Select Property Type')).toBeInTheDocument();
  });

  test('updates search params when inputs change', () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, data: [] } });
    
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    
    const locationInput = screen.getByPlaceholderText('Location');
    fireEvent.change(locationInput, { target: { value: 'New York' } });
    
    expect(locationInput.value).toBe('New York');
  });

  test('fetches properties on component mount', async () => {
    axios.get.mockResolvedValueOnce({ 
      data: { 
        success: true, 
        data: [] 
      } 
    });
    
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:4000/api/auth/getProperties',
        {
          withCredentials: true,
          params: {
            averageRating: "",
            checkIn: "",
            checkOut: "",
            location: "",
            maxGuests: "",
            price: "",
            type: ""
          }
        }
      );
    });
  });
  
  test('displays no properties message when none are available', async () => {
    axios.get.mockResolvedValueOnce({ 
      data: { 
        success: true, 
        data: [] 
      } 
    });
    
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('No properties available at the moment')).toBeInTheDocument();
    });
  });

  test('displays properties when they are available', async () => {
    const mockProperties = [
      {
        _id: '1',
        name: 'Test Property',
        price: 100,
        type: 'Standard Room',
        location: 'Test Location',
        maxGuests: 2,
        averageRating: 4,
        reviewCount: 10,
        status: 'available',
        images: ['image1.jpg'],
        amenities: { wifi: true, parking: false }
      }
    ];
    
    axios.get.mockResolvedValueOnce({ 
      data: { 
        success: true, 
        data: mockProperties 
      } 
    });
    
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      // For elements that may appear multiple times, use more specific queries
      
      // Find the property card container first (can add a test-id in the real component)
      const propertyCards = screen.getAllByRole('link');
      expect(propertyCards.length).toBeGreaterThan(0);
      const propertyCard = propertyCards[0];
      
      // Now test within this context
      expect(within(propertyCard).getByText('Test Property')).toBeInTheDocument();
      expect(within(propertyCard).getByText('$100/night')).toBeInTheDocument();
      
      // For the type that appears in both the select and the card, use the title attribute
      expect(screen.getByTitle('Standard Room')).toBeInTheDocument();
      
      expect(within(propertyCard).getByText('Test Location')).toBeInTheDocument();
      expect(within(propertyCard).getByText('Max 2 Guests')).toBeInTheDocument();
      expect(within(propertyCard).getByText('(10)')).toBeInTheDocument();
    });
  });

  test('renders correct status badge for property', async () => {
    const mockProperties = [
      {
        _id: '1',
        name: 'Available Property',
        price: 100,
        status: 'available',
        images: []
      },
      {
        _id: '2',
        name: 'Unavailable Property',
        price: 100,
        status: 'unavailable',
        images: []
      }
    ];
    
    axios.get.mockResolvedValueOnce({ 
      data: { 
        success: true, 
        data: mockProperties 
      } 
    });
    
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      const availableBadge = screen.getByText('available');
      const unavailableBadge = screen.getByText('unavailable');
      
      expect(availableBadge).toBeInTheDocument();
      expect(unavailableBadge).toBeInTheDocument();
      
      // Check that they have the correct classes
      expect(availableBadge.className).toContain('bg-green-500');
      expect(unavailableBadge.className).toContain('bg-red-500');
    });
  });

  test('renders amenities correctly when they exist', async () => {
    const mockProperties = [
      {
        _id: '1',
        name: 'Property with Amenities',
        price: 100,
        status: 'available',
        images: [],
        amenities: { wifi: true, parking: true, pool: true }
      }
    ];
    
    axios.get.mockResolvedValueOnce({ 
      data: { 
        success: true, 
        data: mockProperties 
      } 
    });
    
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('wifi')).toBeInTheDocument();
      expect(screen.getByText('parking')).toBeInTheDocument();
      expect(screen.getByText('+ 1 more')).toBeInTheDocument();
    });
  });

  test('fetches new properties when search params change', async () => {
    axios.get.mockResolvedValueOnce({ 
      data: { 
        success: true, 
        data: [] 
      } 
    });
    
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    
    // First call is on component mount
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(1);
    });
    
    // Reset mock to track the next call
    axios.get.mockReset();
    axios.get.mockResolvedValueOnce({ 
      data: { 
        success: true, 
        data: [] 
      } 
    });
    
    // Change search params
    const locationInput = screen.getByPlaceholderText('Location');
    fireEvent.change(locationInput, { target: { value: 'New York' } });
    
    // Should trigger a new API call
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:4000/api/auth/getProperties',
        expect.objectContaining({
          params: expect.objectContaining({
            location: 'New York'
          })
        })
      );
    });
  });
  
  test('handles API error gracefully', async () => {
    console.log = vi.fn(); // Mock console.log to test error logging
    
    axios.get.mockRejectedValueOnce(new Error('API error'));
    
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith(
        'Error fetching properties:',
        expect.any(Error)
      );
    });
  });
});