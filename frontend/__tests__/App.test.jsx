import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App';

// Mock all page components
vi.mock('../src/pages/Home.jsx', () => ({
  Home: () => <div data-testid="home">Home Page</div>
}));
vi.mock('../src/pages/Contact.jsx', () => ({
  default: () => <div data-testid="contact">Contact Page</div>
}));
vi.mock('../src/pages/PropertyForm.jsx', () => ({
  default: () => <div data-testid="property-form">Property Form</div>
}));
vi.mock('../src/pages/PropertyDetails.jsx', () => ({
  PropertyDetails: () => <div data-testid="property-details">Property Details</div>
}));
vi.mock('../src/pages/AdminLogin.jsx', () => ({
  default: () => <div data-testid="admin-login">Admin Login</div>
}));
vi.mock('../src/pages/UserSignup.jsx', () => ({
  default: () => <div data-testid="user-signup">User Signup</div>
}));
vi.mock('../src/pages/UserLogin.jsx', () => ({
  default: () => <div data-testid="user-login">User Login</div>
}));
vi.mock('../src/pages/AdminDashboard.jsx', () => ({
  default: () => <div data-testid="admin-dashboard">Admin Dashboard</div>
}));
vi.mock('../src/pages/AdminUserManagement.jsx', () => ({
  default: () => <div data-testid="user-management">User Management</div>
}));
vi.mock('../src/pages/AdminRoomManagement.jsx', () => ({
  default: () => <div data-testid="room-management">Room Management</div>
}));
vi.mock('../src/pages/AdminBookingManagement.jsx', () => ({
  default: () => <div data-testid="booking-management">Booking Management</div>
}));
vi.mock('../src/pages/AdminVendorRequests.jsx', () => ({
  default: () => <div data-testid="vendor-requests">Vendor Requests</div>
}));
vi.mock('../src/pages/UserDashboard.jsx', () => ({
  default: () => <div data-testid="user-dashboard">User Dashboard</div>
}));
vi.mock('../src/components/AuthSuccess.jsx', () => ({
  default: () => <div data-testid="auth-success">Auth Success</div>
}));
vi.mock('react-toastify', () => ({
  ToastContainer: () => <div data-testid="toast-container">Toast Container</div>
}));

// Helper function to render the App with a specific route
const renderWithRoute = (route) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>
  );
};

describe('App Component', () => {
  // Clear all mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Home page on default route', () => {
    renderWithRoute('/');
    expect(screen.getByTestId('home')).toBeInTheDocument();
    expect(screen.getByTestId('toast-container')).toBeInTheDocument();
  });

  it('renders the Contact page', () => {
    renderWithRoute('/contact');
    expect(screen.getByTestId('contact')).toBeInTheDocument();
  });

  it('renders the PropertyForm page for creating property', () => {
    renderWithRoute('/create-property');
    expect(screen.getByTestId('property-form')).toBeInTheDocument();
  });

  it('renders the PropertyDetails page', () => {
    renderWithRoute('/property/123');
    expect(screen.getByTestId('property-details')).toBeInTheDocument();
  });

  it('renders the PropertyForm page for editing property', () => {
    renderWithRoute('/edit-property/123');
    expect(screen.getByTestId('property-form')).toBeInTheDocument();
  });

  it('renders the UserSignUpPage', () => {
    renderWithRoute('/signup');
    expect(screen.getByTestId('user-signup')).toBeInTheDocument();
  });

  it('renders the UserLoginPage', () => {
    renderWithRoute('/login');
    expect(screen.getByTestId('user-login')).toBeInTheDocument();
  });

  it('renders the AdminLoginPage', () => {
    renderWithRoute('/admin/login');
    expect(screen.getByTestId('admin-login')).toBeInTheDocument();
  });

  it('renders the AdminDashboard', () => {
    renderWithRoute('/admin/dashboard');
    expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
  });

  it('renders the UserManagementPage', () => {
    renderWithRoute('/admin/users');
    expect(screen.getByTestId('user-management')).toBeInTheDocument();
  });

  it('renders the RoomManagementPage', () => {
    renderWithRoute('/admin/rooms');
    expect(screen.getByTestId('room-management')).toBeInTheDocument();
  });

  it('renders the BookingManagementPage', () => {
    renderWithRoute('/admin/bookings');
    expect(screen.getByTestId('booking-management')).toBeInTheDocument();
  });

  it('renders the VendorRequestPage', () => {
    renderWithRoute('/admin/requests');
    expect(screen.getByTestId('vendor-requests')).toBeInTheDocument();
  });

  it('renders the AuthSuccess component', () => {
    renderWithRoute('/auth-success');
    expect(screen.getByTestId('auth-success')).toBeInTheDocument();
  });

  it('renders the UserDashboard', () => {
    renderWithRoute('/user-dashboard');
    expect(screen.getByTestId('user-dashboard')).toBeInTheDocument();
  });

  it('renders the ToastContainer globally', () => {
    renderWithRoute('/');
    expect(screen.getByTestId('toast-container')).toBeInTheDocument();
  });

});