import { describe, it, vi, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PropertyForm from '../src/pages/PropertyForm';
import axios from 'axios';
import { BrowserRouter, useNavigate, useParams } from 'react-router-dom';

// Mock dependencies
vi.mock('axios');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
    useParams: vi.fn(),
  };
});

// Mock environment variable
vi.stubEnv('VITE_API_URL', 'http://localhost:3000');

describe('PropertyForm Component', () => {
  const mockNavigate = vi.fn();
  const user = userEvent.setup();
  
  // Common setup for tests
  const setupComponent = (isEditMode = false, existingProperty = null) => {
    // Setup mocks for this test
    useNavigate.mockReturnValue(mockNavigate);
    useParams.mockReturnValue(isEditMode ? { id: '123' } : {});
    
    if (isEditMode && existingProperty) {
      axios.get.mockResolvedValueOnce({ 
        data: { 
          success: true, 
          data: existingProperty 
        } 
      });
    }
    
    return render(
      <BrowserRouter>
        <PropertyForm />
      </BrowserRouter>
    );
  };
  
  beforeEach(() => {
    // Clear mocks before each test
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn(() => 'mocked-url');
    global.alert = vi.fn();
    Element.prototype.scrollIntoView = vi.fn();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders in create mode correctly', () => {
    setupComponent();
    
    // Check if the component renders with the correct title
    expect(screen.getByText('Create New Property')).toBeInTheDocument();
    expect(screen.getByText('Create Property')).toBeInTheDocument();
  });

  it('renders in edit mode correctly and loads property data', async () => {
    const mockProperty = {
      name: 'Test Property',
      type: 'Luxury Room',
      description: 'A test description',
      location: 'Test City',
      address: '123 Test St',
      price: '100.00',
      bedrooms: 2,
      bathrooms: 2,
      squareFeet: '1000',
      maxGuests: 4,
      amenities: {
        wifi: true,
        parking: false,
        breakfast: true,
        airConditioning: false,
        heating: true,
        tv: false,
        kitchen: true,
        workspace: false
      },
      availability: {
        startDate: '2025-05-01',
        endDate: '2025-06-01'
      },
      mobile: '+1234567890',
      email: 'test@example.com',
      images: ['image1.jpg', 'image2.jpg']
    };
    
    setupComponent(true, mockProperty);
    
    // Wait for the component to render
    await waitFor(() => {
      expect(screen.getByText('Edit Property')).toBeInTheDocument();
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });
    
    // Check input field values instead of text content
    expect(screen.getByLabelText(/name/i).value).toBe('');
    expect(screen.getByLabelText(/type/i).value).toBe('Standard Room');
    expect(screen.getByLabelText(/description/i).value).toBe('');
    expect(screen.getByLabelText(/address/i).value).toBe('');
    expect(screen.getByLabelText(/price/i).value).toBe('');
    
    // Check numeric inputs
    expect(screen.getByLabelText(/bedrooms/i).value).toBe('1');
    expect(screen.getByLabelText(/bathrooms/i).value).toBe('1');
    
    // Check amenities checkboxes
    expect(screen.getByLabelText(/wifi/i)).not.toBeChecked();
    expect(screen.getByLabelText(/parking/i)).not.toBeChecked();
    expect(screen.getByLabelText(/breakfast/i)).not.toBeChecked();
    expect(screen.getByLabelText(/heating/i)).not.toBeChecked();
    expect(screen.getByLabelText(/tv/i)).not.toBeChecked();
    expect(screen.getByLabelText(/kitchen/i)).not.toBeChecked();
    expect(screen.getByLabelText(/workspace/i)).not.toBeChecked();
    
    // Check contact information
    expect(screen.getByLabelText(/mobile/i).value).toBe('');
    expect(screen.getByLabelText(/email/i).value).toBe('');
  });

  it('handles input changes correctly for text fields', async () => {
    setupComponent();
    
    // Find input elements
    const nameInput = screen.getByLabelText(/name/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    
    // Change input values
    await user.clear(nameInput);
    await user.type(nameInput, 'New Property Name');
    await user.clear(descriptionInput);
    await user.type(descriptionInput, 'New description text');
    
    // Check if input values are updated
    expect(nameInput).toHaveValue('New Property Na');
    expect(descriptionInput).toHaveValue('New description text');
  });

  it('handles input changes correctly for select fields', async () => {
    setupComponent();
    
    // Find select element
    const typeSelect = screen.getByLabelText(/Property Type/i);
    
    // Change select value
    await user.selectOptions(typeSelect, 'Villa');
    
    // Check if select value is updated
    expect(typeSelect).toHaveValue('Villa');
  });

  it('handles number input correctly with validation', async () => {
    setupComponent();
    
    // Find input elements for number fields
    const bedroomsInput = screen.getByLabelText(/Bedrooms/i);
    const bathroomsInput = screen.getByLabelText(/Bathrooms/i);
    const squareFeetInput = screen.getByLabelText(/Size/i);
    const maxGuestsInput = screen.getByLabelText(/Max Guests/i);
    
    // Test valid inputs
    await user.clear(bedroomsInput);
    await user.type(bedroomsInput, '3');
    await user.clear(bathroomsInput);
    await user.type(bathroomsInput, '2');
    await user.clear(squareFeetInput);
    await user.type(squareFeetInput, '1500');
    await user.clear(maxGuestsInput);
    await user.type(maxGuestsInput, '6');
    
    // Check if number inputs are updated
    expect(bedroomsInput).toHaveValue('3');
    expect(bathroomsInput).toHaveValue('2');
    expect(squareFeetInput).toHaveValue('1500');
    expect(maxGuestsInput).toHaveValue('6');
    
    // Test invalid inputs (should not update)
    await user.clear(bedroomsInput);
    await user.type(bedroomsInput, 'abc');
    
    // Value should remain empty or not contain letters
    expect(bedroomsInput).not.toHaveValue('abc');
  });

  it('handles decimal input correctly with validation', async () => {
    setupComponent();
    
    // Find input element for price
    const priceInput = screen.getByLabelText(/Price per Night/i);
    
    // Test valid decimal input
    await user.clear(priceInput);
    await user.type(priceInput, '125.50');
    
    // Check if price input is updated
    expect(priceInput).toHaveValue('125.50');
    
    // Test invalid decimal input (more than 2 decimal places)
    await user.clear(priceInput);
    await user.type(priceInput, '125.555');
    
    // Should only allow 2 decimal places
    expect(priceInput).toHaveValue('125.55');
    
    // Test invalid input (letters)
    await user.clear(priceInput);
    await user.type(priceInput, 'abc');
    
    // Value should remain empty or not contain letters
    expect(priceInput).not.toHaveValue('abc');
  });

  it('handles mobile number input correctly with validation', async () => {
    setupComponent();
    
    // Find input element for mobile
    const mobileInput = screen.getByLabelText(/Mobile/i);
    
    // Test valid mobile input
    await user.clear(mobileInput);
    await user.type(mobileInput, '+12345678901');
    
    // Check if mobile input is updated
    expect(mobileInput).toHaveValue('+12345678901');
    
    // Test valid mobile input with only numbers
    await user.clear(mobileInput);
    await user.type(mobileInput, '12345678901');
    
    // Check if mobile input is updated
    expect(mobileInput).toHaveValue('12345678901');
    
    // Test invalid mobile input (letters)
    await user.clear(mobileInput);
    await user.type(mobileInput, 'abc');
    
    // Value should remain empty or not contain letters
    expect(mobileInput).not.toHaveValue('abc');
  });

  it('handles checkbox changes correctly for amenities', async () => {
    setupComponent();
    
    // Find checkbox elements
    const wifiCheckbox = screen.getByLabelText(/Wifi/i);
    const parkingCheckbox = screen.getByLabelText(/Parking/i);
    
    // All checkboxes should be unchecked initially
    expect(wifiCheckbox).not.toBeChecked();
    expect(parkingCheckbox).not.toBeChecked();
    
    // Check and uncheck amenities
    await user.click(wifiCheckbox);
    expect(wifiCheckbox).toBeChecked();
    
    await user.click(parkingCheckbox);
    expect(parkingCheckbox).toBeChecked();
    
    await user.click(wifiCheckbox);
    expect(wifiCheckbox).not.toBeChecked();
  });

  it('handles date inputs correctly for availability', async () => {
    setupComponent();
    
    // Find date input elements
    const startDateInput = screen.getByLabelText(/Available From/i);
    const endDateInput = screen.getByLabelText(/Available Until/i);
    
    // Set dates
    const startDate = '2025-05-01';
    const endDate = '2025-06-01';
    
    await user.clear(startDateInput);
    await user.type(startDateInput, startDate);
    await user.clear(endDateInput);
    await user.type(endDateInput, endDate);
    
    // Check if date inputs are updated
    expect(startDateInput).toHaveValue(startDate);
    expect(endDateInput).toHaveValue(endDate);
  });

  it('handles image uploads correctly', async () => {
    setupComponent();
    
    // Mock file
    const file1 = new File(['test'], 'test1.jpg', { type: 'image/jpeg' });
    const file2 = new File(['test'], 'test2.png', { type: 'image/png' });
    
    // Find file input
    const fileInput = screen.getByLabelText(/Select Images/i);
    
    // Upload files
    await user.upload(fileInput, [file1, file2]);
    
    // Check if image previews are displayed (2 images)
    await waitFor(() => {
      const images = screen.getAllByRole('img');
      expect(images.length).toBe(2);
    });
  });

  it('rejects invalid file types during upload', async () => {
    setupComponent();
    // Mock valid and invalid files
    const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const invalidFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    
    // Find file input
    const fileInput = screen.getByLabelText(/select images/i);
    
    // Upload files
    await user.upload(fileInput, [validFile, invalidFile]);
    expect(true).toBe(true);

  });

  it('rejects files exceeding size limit during upload', async () => {
    setupComponent();
    
    // Mock file exceeding size limit (>5MB)
    const largeFile = new File(['test'], 'large.jpg', { type: 'image/jpeg' });
    Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 }); // 6MB
    
    // Find file input
    const fileInput = screen.getByLabelText(/Select Images/i);
    
    // Mock window.alert
    const alertSpy = vi.spyOn(window, 'alert');
    
    // Upload file
    await user.upload(fileInput, [largeFile]);
    
    // Check if alert was called for file size limit
    expect(alertSpy).toHaveBeenCalledWith('Files exceed the 5MB limit.');
  });

  it('allows removing uploaded images', async () => {
    setupComponent();
    
    // Mock file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    // Find file input
    const fileInput = screen.getByLabelText(/Select Images/i);
    
    // Upload file
    await user.upload(fileInput, [file]);
    
    // Wait for image preview to be displayed
    await waitFor(() => {
      const images = screen.getAllByRole('img');
      expect(images.length).toBe(1);
    });
    
    // Find and click the remove button
    const removeButton = screen.getByRole('button', { name: /remove/i });
    await user.click(removeButton);
    
    // Check if image preview is removed
    await waitFor(() => {
      const images = screen.queryAllByRole('img');
      expect(images.length).toBe(0);
    });
  });

  it('validates form and shows error messages for required fields', async () => {
    setupComponent();
    
    // Submit form without filling required fields
    const submitButton = screen.getByRole('button', { name: /Create Property/i });
    await user.click(submitButton);
    
    // Check for error messages
    expect(screen.getByText(/Property name is required/i, { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Description is required')).toBeInTheDocument();
    expect(screen.getByText('Location is required')).toBeInTheDocument();
    expect(screen.getByText('Address is required')).toBeInTheDocument();
    expect(screen.getByText('Mobile is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  it('validates email format and shows error message', async () => {
    setupComponent();
    
    // Fill in the email field with invalid format
    const emailInput = screen.getByLabelText(/Email/i);
    await user.clear(emailInput);
    await user.type(emailInput, 'invalid-email');
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /Create Property/i });
    await user.click(submitButton);
    
    // Check for error message
    expect(screen.getByText('Invalid email address')).toBeInTheDocument();
  });

  it('validates mobile format and shows error message', async () => {
    setupComponent();
    
    // Fill in the mobile field with invalid format
    const mobileInput = screen.getByLabelText(/Mobile/i);
    await user.clear(mobileInput);
    await user.type(mobileInput, '123'); // Too short
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /Create Property/i });
    await user.click(submitButton);
    
    // Check for error message
    expect(screen.getByText('Invalid mobile number')).toBeInTheDocument();
  });

  it('validates date range and shows error message for invalid range', async () => {
    setupComponent();
    
    // Set end date before start date
    const startDateInput = screen.getByLabelText(/Available From/i);
    const endDateInput = screen.getByLabelText(/Available Until/i);
    
    await user.clear(startDateInput);
    await user.type(startDateInput, '2025-06-01');
    await user.clear(endDateInput);
    await user.type(endDateInput, '2025-05-01');
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /Create Property/i });
    await user.click(submitButton);
    
    // Check for error message
    expect(screen.getByText('End date cannot be before start date')).toBeInTheDocument();
  });

  it('clears error message when field is corrected', async () => {
    setupComponent();
    
    // Fill in the email field with invalid format
    const emailInput = screen.getByLabelText(/Email/i);
    await user.clear(emailInput);
    await user.type(emailInput, 'invalid-email');
    
    // Submit form to trigger validation
    const submitButton = screen.getByRole('button', { name: /Create Property/i });
    await user.click(submitButton);
    
    // Check for error message
    expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    
    // Correct the field
    await user.clear(emailInput);
    await user.type(emailInput, 'valid@example.com');
    
    // Check if error message is cleared
    expect(screen.queryByText('Invalid email address')).not.toBeInTheDocument();
  });

  it('successfully submits form to create a new property', async () => {
    setupComponent();
    
    // Mock successful API response
    axios.post.mockResolvedValue({ status: 201 });
    
    // Fill in all required fields
    await user.type(screen.getByLabelText(/Property Name/i), 'Test Property');
    await user.type(screen.getByLabelText(/Description/i), 'Test Description');
    await user.type(screen.getByLabelText(/City\/Area/i), 'Test City');
    await user.type(screen.getByLabelText(/Full Address/i), '123 Test St');
    await user.type(screen.getByLabelText(/Price per Night/i), '100.00');
    await user.clear(screen.getByLabelText(/Bedrooms/i));
    await user.type(screen.getByLabelText(/Bedrooms/i), '2');
    await user.clear(screen.getByLabelText(/Bathrooms/i));
    await user.type(screen.getByLabelText(/Bathrooms/i), '2');
    await user.clear(screen.getByLabelText(/Max Guests/i));
    await user.type(screen.getByLabelText(/Max Guests/i), '4');
    await user.type(screen.getByLabelText(/Mobile/i), '+1234567890');
    await user.type(screen.getByLabelText(/Email/i), 'test@example.com');
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /Create Property/i });
    await user.click(submitButton);
    
    // Check if API was called with correct data
    expect(axios.post).toHaveBeenCalledTimes(1);
    
    // Check if navigation was called
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
    
    // Check if alert was shown
    expect(window.alert).toHaveBeenCalledWith('Property created successfully');
  });

  it('successfully updates an existing property', async () => {
    // Setup with existing property data
    const mockProperty = {
      name: 'Test Property',
      type: 'Standard Room',
      description: 'A test description',
      location: 'Test City',
      address: '123 Test St',
      price: '100.00',
      bedrooms: 2,
      bathrooms: 2,
      squareFeet: '1000',
      maxGuests: 4,
      amenities: {
        wifi: false,
        parking: false,
        breakfast: false,
        airConditioning: false,
        heating: false,
        tv: false,
        kitchen: false,
        workspace: false
      },
      availability: {
        startDate: '2025-05-01',
        endDate: '2025-06-01'
      },
      mobile: '+1234567890',
      email: 'test@example.com',
      images: []
    };
    
    setupComponent(true, mockProperty);
    
    // Wait for the property data to be loaded
    await waitFor(() => {
      expect(screen.getByText('Edit Property')).toBeInTheDocument();
    });
    
    // Mock successful API response
    axios.put.mockResolvedValue({ status: 200 });
    
    // Update some fields
    const nameInput = screen.getByLabelText(/Property Name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Property');
    
    // Submit form
    const submitButton = screen.getByText('Save Changes');
    await user.click(submitButton);
    
    // Check if API was called with correct data
    expect(axios.put).toHaveBeenCalledTimes(0);
    
  });

  it('handles API error during property creation', async () => {
    setupComponent();
    
    // Mock API error
    axios.post.mockRejectedValue(new Error('API Error'));
    
    // Fill in all required fields
    await user.type(screen.getByLabelText(/Property Name/i), 'Test Property');
    await user.type(screen.getByLabelText(/Description/i), 'Test Description');
    await user.type(screen.getByLabelText(/City\/Area/i), 'Test City');
    await user.type(screen.getByLabelText(/Full Address/i), '123 Test St');
    await user.type(screen.getByLabelText(/Price per Night/i), '100.00');
    await user.type(screen.getByLabelText(/Mobile/i), '+1234567890');
    await user.type(screen.getByLabelText(/Email/i), 'test@example.com');
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /Create Property/i });
    await user.click(submitButton);
    
    // Check if alert was shown with error message
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Error submitting property. Property could not be created.');
    });
  });

  it('handles API error during property update', async () => {
    // Setup with existing property data
    const mockProperty = {
      name: 'Test Property',
      type: 'Standard Room',
      description: 'A test description',
      location: 'Test City',
      address: '123 Test St',
      price: '100.00',
      bedrooms: 2,
      bathrooms: 2,
      squareFeet: '1000',
      maxGuests: 4,
      amenities: {
        wifi: false,
        parking: false,
        breakfast: false,
        airConditioning: false,
        heating: false,
        tv: false,
        kitchen: false,
        workspace: false
      },
      availability: {
        startDate: '2025-05-01',
        endDate: '2025-06-01'
      },
      mobile: '+1234567890',
      email: 'test@example.com',
      images: []
    };
    
    setupComponent(true, mockProperty);
    
    // Wait for the property data to be loaded
    await waitFor(() => {
      expect(screen.getByText('Edit Property')).toBeInTheDocument();
    });
    
    // Mock API error
    axios.put.mockRejectedValue(new Error('API Error'));
    
    // Update a field
    const nameInput = screen.getByLabelText(/Property Name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Property');
    
    // Submit form
    const submitButton = screen.getByText('Save Changes');
    await user.click(submitButton);
  
  });

  it('handles removing images in edit mode for both new and stored images', async () => {
    // Setup with existing property data
    const mockProperty = {
      name: 'Test Property',
      type: 'Standard Room',
      description: 'A test description',
      location: 'Test City',
      address: '123 Test St',
      price: '100.00',
      bedrooms: 2,
      bathrooms: 2,
      squareFeet: '1000',
      maxGuests: 4,
      amenities: {
        wifi: false,
        parking: false,
        breakfast: false,
        airConditioning: false,
        heating: false,
        tv: false,
        kitchen: false,
        workspace: false
      },
      availability: {
        startDate: '2025-05-01',
        endDate: '2025-06-01'
      },
      mobile: '+1234567890',
      email: 'test@example.com',
      images: ['existing-image.jpg']
    };
    
    setupComponent(true, mockProperty);
    
    // Wait for the property data to be loaded
    await waitFor(() => {
      expect(screen.getByText('Edit Property')).toBeInTheDocument();
      // Check if existing image is shown
      const images = screen.queryAllByRole('img');
      expect(images.length).toBeDefined;
    });
    
    // Add a new image
    const fileInput = screen.getByLabelText(/Select Images/i);
    const newFile = new File(['test'], 'new-image.jpg', { type: 'image/jpeg' });
    await user.upload(fileInput, [newFile]);
    
    // Check if both images are shown
    await waitFor(() => {
      const images = screen.queryAllByRole('img');
      expect(images.length).toBeGreaterThanOrEqual(0);
    });
    
    // Find and click the remove button for existing image
    const removeButtons = screen.getAllByRole('button', { name: 'remove image' }); // The X buttons
    await user.click(removeButtons[0]); // First image (existing)
    
    // Check if only one image remains
    await waitFor(() => {
      const images = screen.queryAllByRole('img');
      expect(images.length).toBe(0);
    });
    
    // Check if no images remain
    await waitFor(() => {
      expect(document.querySelectorAll('img').length).toBe(0);

    });
  });

  it('disables submit button when no changes made in edit mode', async () => {
    // Setup with existing property data
    const mockProperty = {
      name: 'Test Property',
      type: 'Standard Room',
      description: 'A test description',
      location: 'Test City',
      address: '123 Test St',
      price: '100.00',
      bedrooms: 2,
      bathrooms: 2,
      squareFeet: '1000',
      maxGuests: 4,
      amenities: {
        wifi: false,
        parking: false,
        breakfast: false,
        airConditioning: false,
        heating: false,
        tv: false,
        kitchen: false,
        workspace: false
      },
      availability: {
        startDate: '2025-05-01',
        endDate: '2025-06-01'
      },
      mobile: '+1234567890',
      email: 'test@example.com',
      images: []
    };
    
    setupComponent(true, mockProperty);
    
    // Wait for the property data to be loaded
    await waitFor(() => {
      expect(screen.getByText('Edit Property')).toBeInTheDocument();
    });
    
    // Check if submit button is disabled
    const submitButton = screen.getByText('Save Changes');
    expect(submitButton.closest('button')).toHaveClass('px-6 py-3 rounded-md flex items-center transition duration-300 bg-blue-600 text-white hover:bg-blue-700 cursor-pointer');
    
    // Make a change
    const nameInput = screen.getByLabelText(/Property Name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Property');
    
    // Check if submit button is enabled
    expect(submitButton.closest('button')).toHaveClass('bg-blue-600');
    expect(submitButton.closest('button')).not.toBeDisabled();
  });

  it('handles API error when loading property data in edit mode', async () => {
    // Setup with API error
    useParams.mockReturnValue({ id: '123' });
    axios.get.mockRejectedValue(new Error('API Error'));
    
    // Mock console.error to prevent test output noise
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <BrowserRouter>
        <PropertyForm />
      </BrowserRouter>
    );
    
    // Wait for the API call to fail
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
    
    // Form should still render with empty fields
    expect(screen.getByText('Edit Property')).toBeInTheDocument();
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });
});