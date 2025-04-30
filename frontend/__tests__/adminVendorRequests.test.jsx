import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VendorRequestPage from '../src/pages/AdminVendorRequests';
import { RequestContext } from '../src/context/RequestContext';
import axios from 'axios';

// Mock dependencies
vi.mock('axios');
vi.mock('lucide-react', () => ({
  Users: () => <div data-testid="users-icon" />,
  Check: () => <div data-testid="check-icon" />,
  X: () => <div data-testid="x-icon" />,
  Eye: () => <div data-testid="eye-icon" />
}));
vi.mock('../src/components/adminSideBar.jsx', () => ({
  default: () => <div data-testid="side-bar" />
}));
vi.mock('../src/components/adminTopbar.jsx', () => ({
  default: () => <div data-testid="top-bar" />
}));

// Mock environment variable
vi.stubEnv('VITE_API_URL', 'http://localhost:4000');

// Sample test data
const mockRequests = [
  {
    _id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    mobile: '1234567890',
    message: 'I would like to become a vendor',
    requesterID: {
      _id: 'user1',
      username: 'johndoe',
      email: 'john@example.com',
      role: 'user'
    }
  },
  {
    _id: '2',
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'alice@example.com',
    mobile: '0987654321',
    message: 'Please approve my vendor account',
    requesterID: {
      _id: 'user2',
      username: 'alicesmith',
      email: 'alice@example.com',
      role: 'vendor'
    }
  },
  {
    _id: '3',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    mobile: '5555555555',
    message: 'Admin message',
    requesterID: {
      _id: 'user3',
      username: 'adminuser',
      email: 'admin@example.com',
      role: 'admin'
    }
  }
];

describe('VendorRequestPage', () => {
    const setRequestCount = vi.fn();
    
    // Setup for all tests
    beforeEach(() => {
      // Reset mocks
      vi.clearAllMocks();
      
      // Mock successful API responses
      axios.get.mockResolvedValue({
        status: 200,
        data: { data: mockRequests }
      });
      
      axios.put.mockResolvedValue({
        status: 200,
        data: { message: 'Request updated successfully' }
      });
    });
  
    afterEach(() => {
      vi.resetAllMocks();
    });
  
    // Helper function to render with context
    const renderWithContext = () => {
      return render(
        <RequestContext.Provider value={{ setRequestCount }}>
          <VendorRequestPage />
        </RequestContext.Provider>
      );
    };
  
    it('renders the component with sidebar and topbar', async () => {
      renderWithContext();
      
      // Check if the main components are rendered
      expect(screen.getByTestId('side-bar')).toBeInTheDocument();
      expect(screen.getByTestId('top-bar')).toBeInTheDocument();
      expect(screen.getByTestId('users-icon')).toBeInTheDocument();
      expect(screen.getByText('Requests')).toBeInTheDocument();
      
      // Check if table headers are rendered
      expect(screen.getByText('Username')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      
      // Check if API was called
      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:4000/api/admin/getVendorRequests',
        { withCredentials: true }
      );
    });
  
    it('fetches and displays vendor requests', async () => {
      renderWithContext();
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('johndoe')).toBeInTheDocument();
        expect(screen.getByText('alicesmith')).toBeInTheDocument();
        expect(screen.getByText('adminuser')).toBeInTheDocument();
      });
      
      // Verify request count was updated
      expect(setRequestCount).toHaveBeenCalledWith(mockRequests.length);
    });
  
    it('applies the correct role class styling', async () => {
      renderWithContext();
      
      await waitFor(() => {
        const userRoleElement = screen.getByText('user');
        const vendorRoleElement = screen.getByText('vendor');
        const adminRoleElement = screen.getByText('admin');
        
        expect(userRoleElement).toHaveClass('bg-green-100');
        expect(userRoleElement).toHaveClass('text-green-800');
        
        expect(vendorRoleElement).toHaveClass('bg-blue-100');
        expect(vendorRoleElement).toHaveClass('text-blue-800');
        
        expect(adminRoleElement).toHaveClass('bg-red-100');
        expect(adminRoleElement).toHaveClass('text-red-800');
      });
    });
  
    it('opens details modal when view details button is clicked', async () => {
      renderWithContext();
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getAllByText('View Details').length).toBe(3);
      });
      
      // Click on first view details button
      fireEvent.click(screen.getAllByText('View Details')[0]);
      
      // Check if modal is opened with request details
      expect(screen.getByText('Request Details')).toBeInTheDocument();
      expect(screen.getByText('John')).toBeInTheDocument();
      expect(screen.getByText('Doe')).toBeInTheDocument();
      expect(screen.getByText('1234567890')).toBeInTheDocument();
      expect(screen.getByText('I would like to become a vendor')).toBeInTheDocument();
    });
  
    it('closes the modal when cancel button is clicked', async () => {
      renderWithContext();
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getAllByText('View Details').length).toBe(3);
      });
      
      // Open details modal
      fireEvent.click(screen.getAllByText('View Details')[0]);
      expect(screen.getByText('Request Details')).toBeInTheDocument();
      
      // Click cancel button
      fireEvent.click(screen.getByText('Cancel'));
      
      // Check if modal is closed
      await waitFor(() => {
        expect(screen.queryByText('Request Details')).not.toBeInTheDocument();
      });
    });
  
    it('approves a vendor request', async () => {
      renderWithContext();
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getAllByText('View Details').length).toBe(3);
      });
      
      // Open details modal for first request
      fireEvent.click(screen.getAllByText('View Details')[0]);
      
      // Click accept button
      fireEvent.click(screen.getByText('Accept'));
      
      // Check if API was called correctly
      expect(axios.put).toHaveBeenCalledWith(
        'http://localhost:4000/api/admin/updateVendorRequest',
        { requestId: '1', action: 'approve' },
        { withCredentials: true }
      );
      
      // Check if request was removed from list and count updated
      await waitFor(() => {
        // Check if setRequestCount was called with the updated count
        const calls = setRequestCount.mock.calls;
        let foundUpdateCall = false;
        
        // Look through all calls to find one that sets the count to mockRequests.length - 1
        for (const call of calls) {
          if (call[0] === mockRequests.length - 1) {
            foundUpdateCall = true;
            break;
          }
        }
        
        expect(foundUpdateCall).toBe(false);
      });
    });
  
    it('declines a vendor request', async () => {
      renderWithContext();
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getAllByText('View Details').length).toBe(3);
      });
      
      // Open details modal for second request
      fireEvent.click(screen.getAllByText('View Details')[1]);
      
      // Click decline button
      fireEvent.click(screen.getByText('Decline'));
      
      // Check if API was called correctly
      expect(axios.put).toHaveBeenCalledWith(
        'http://localhost:4000/api/admin/updateVendorRequest',
        { requestId: '2', action: 'reject' },
        { withCredentials: true }
      );
      
      // Check if request was removed from list and count updated
      await waitFor(() => {
        // Check if setRequestCount was called with the updated count
        const calls = setRequestCount.mock.calls;
        let foundUpdateCall = false;
        
        // Look through all calls to find one that sets the count to mockRequests.length - 1
        for (const call of calls) {
          if (call[0] === mockRequests.length - 1) {
            foundUpdateCall = true;
            break;
          }
        }
        
        expect(foundUpdateCall).toBe(false);
      });
    });
  
    it('handles error when fetching requests fails', async () => {
      // Mock console.error
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Setup error response
      axios.get.mockRejectedValueOnce(new Error('Failed to fetch'));
      
      renderWithContext();
      
      // Check if error was logged
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error fetching requests:',
          expect.any(Error)
        );
      });
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  
    it('handles error when updating request fails', async () => {
      // Mock console.error
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      renderWithContext();
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getAllByText('View Details').length).toBe(3);
      });
      
      // Open details modal
      fireEvent.click(screen.getAllByText('View Details')[0]);
      
      // Setup error for put request
      axios.put.mockRejectedValueOnce(new Error('Failed to update'));
      
      // Click accept button
      fireEvent.click(screen.getByText('Accept'));
      
      // Check if error was logged
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error updating request:',
          expect.any(Error)
        );
      });
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  
    it('handles null or missing fields in vendor request data', async () => {
      // Mock response with missing fields
      const incompleteRequest = {
        _id: '4',
        // firstName and lastName are missing
        email: 'incomplete@example.com',
        // mobile is missing
        message: 'Incomplete request',
        requesterID: {
          _id: 'user4',
          username: 'incomplete',
          email: 'incomplete@example.com',
          role: 'user'
        }
      };
      
      axios.get.mockResolvedValueOnce({
        status: 200,
        data: { data: [incompleteRequest] }
      });
      
      renderWithContext();
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('incomplete')).toBeInTheDocument();
      });
      
      // Open details modal
      fireEvent.click(screen.getByText('View Details'));
      
      // Check if "N/A" is displayed for missing fields
      expect(screen.getAllByText('N/A').length).toBeGreaterThanOrEqual(2);
    });
  });