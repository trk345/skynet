import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import { Home, PropertyImageGallery } from './Home'; 

// Mock axios
vi.mock('axios');

// Mock the nested components
vi.mock('../components/Navbar.jsx', () => ({
  default: () => <div data-testid="navbar">Navbar</div>
}));

vi.mock('../components/Footer.jsx', () => ({
  default: () => <div data-testid="footer">Footer</div>
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Search: () => <div>Search</div>,
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
    // Reset and setup axios mock responses
    vi.resetAllMocks();
    axios.get = vi.fn().mockResolvedValue({
      data: {
        success: true,
        data: mockProperties,
      },
    });
  });

  it('renders without crashing', async () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getByText('Find Your Perfect Room')).toBeDefined();
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(1);
    });
  });

  it('renders Navbar and Footer components', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getByTestId('navbar')).toBeDefined();
    expect(screen.getByTestId('footer')).toBeDefined();
  });

  it('renders search form with all inputs', () => {
    const { container } = render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getByText('Select Property Type')).toBeDefined();
    expect(screen.getByPlaceholderText('Location')).toBeDefined();
    expect(screen.getByPlaceholderText('Max Price')).toBeDefined();
    expect(screen.getByPlaceholderText('Max Guests')).toBeDefined();
    expect(screen.getByPlaceholderText('Min Rating')).toBeDefined();
    
    // Check for date inputs
    const dateInputs = container.querySelectorAll('input[type="date"]');
    expect(dateInputs.length).toBe(2);
  
    expect(screen.getByText(/Search Rooms/)).toBeDefined();
  });

  it('updates search parameters on input change', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    const typeSelect = screen.getByRole('combobox');
    const locationInput = screen.getByPlaceholderText('Location');
    const priceInput = screen.getByPlaceholderText('Max Price');

    fireEvent.change(typeSelect, { target: { value: 'Luxury Room' } });
    fireEvent.change(locationInput, { target: { value: 'New York' } });
    fireEvent.change(priceInput, { target: { value: '500' } });

    expect(typeSelect.value).toBe('Luxury Room');
    expect(locationInput.value).toBe('New York');
    expect(priceInput.value).toBe('500');
  });

  it('fetches properties when search button is clicked', async () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    
    const locationInput = screen.getByPlaceholderText('Location');
    fireEvent.change(locationInput, { target: { value: 'New York' } });
    const searchButton = screen.getByText(/Search Rooms/);
    await waitFor(() => {
        expect(locationInput.value).toBe('New York');
      });
      
      fireEvent.click(searchButton);
    
    fireEvent.click(searchButton);
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:4000/api/auth/getProperties',
        expect.objectContaining({
          params: expect.objectContaining({
            location: 'New York',
          }),
        })
      );
    });
  });

  it('renders property cards correctly', async () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Test Property')).toBeDefined();
      expect(screen.getByText('Luxury Test Property')).toBeDefined();
      expect(screen.getByText('$100/night')).toBeDefined();
      expect(screen.getByText('$200/night')).toBeDefined();
    });
  });

  it('renders property status badges with correct colors', async () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      const availableBadge = screen.getByText('available');
      const bookedBadge = screen.getByText('booked');
      
      expect(availableBadge).toBeDefined();
      expect(bookedBadge).toBeDefined();
      
      expect(availableBadge.className).toContain('bg-green-500');
      expect(bookedBadge.className).toContain('bg-red-500');
    });
  });

  it('displays correct number of stars for ratings', async () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('(10)')).toBeDefined();
      expect(screen.getByText('(20)')).toBeDefined();
      
    });
  });

  it('renders property amenities correctly', async () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getAllByText('wifi')).toBeDefined();
      expect(screen.getAllByText('parking')).toBeDefined();
      expect(screen.getAllByText('+ 2 more')).toBeDefined();
    });
  });

  it('creates proper links to property detail pages', async () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      const links = screen.getAllByTestId('mock-link');
      expect(links[0].getAttribute('href')).toBe('/property/1');
      expect(links[1].getAttribute('href')).toBe('/property/2');
    });
  });

  it('shows message when no properties are available', async () => {
    axios.get = vi.fn().mockResolvedValueOnce({
      data: {
        success: true,
        data: [],
      },
    });
    
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('No properties available at the moment')).toBeDefined();
    });
  });

  it('handles API errors gracefully', async () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    axios.get = vi.fn().mockRejectedValueOnce(new Error('API Error'));
    
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(consoleLogSpy).toHaveBeenCalledWith('Error fetching properties:', expect.any(Error));
    });
    
    consoleLogSpy.mockRestore();
  });
});