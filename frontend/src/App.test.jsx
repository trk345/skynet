import { describe, test, expect, vi} from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

// Mock all page components
vi.mock('./pages/Home.jsx', () => ({
  default: () => <div data-testid="home-page">Home Page</div>,
}));
vi.mock('./pages/Contact.jsx', () => ({
  default: () => <div data-testid="contact-page">Contact Page</div>,
}));
vi.mock('./pages/PropertyForm.jsx', () => ({
  default: () => <div data-testid="property-form-page">Property Form Page</div>,
}));
vi.mock('./pages/PropertyDetails.jsx', () => ({
  default: () => <div data-testid="property-details-page">Property Details Page</div>,
}));
vi.mock('./pages/AdminLogin.jsx', () => ({
  default: () => <div data-testid="admin-login-page">Admin Login Page</div>,
}));
vi.mock('./pages/UserSignup.jsx', () => ({
  default: () => <div data-testid="user-signup-page">User Sign Up Page</div>,
}));
vi.mock('./pages/UserLogin.jsx', () => ({
  default: () => <div data-testid="user-login-page">User Login Page</div>,
}));
vi.mock('./pages/AdminDashboard.jsx', () => ({
  default: () => <div data-testid="admin-dashboard-page">Admin Dashboard Page</div>,
}));
vi.mock('./pages/AdminUserManagement.jsx', () => ({
  default: () => <div data-testid="user-management-page">User Management Page</div>,
}));
vi.mock('./pages/AdminRoomManagement.jsx', () => ({
  default: () => <div data-testid="room-management-page">Room Management Page</div>,
}));
vi.mock('./pages/AdminBookingManagement.jsx', () => ({
  default: () => <div data-testid="booking-management-page">Booking Management Page</div>,
}));
vi.mock('./pages/AdminVendorRequests.jsx', () => ({
  default: () => <div data-testid="vendor-request-page">Vendor Request Page</div>,
}));
vi.mock('./pages/UserDashboard.jsx', () => ({
  default: () => <div data-testid="user-dashboard-page">User Dashboard Page</div>,
}));
vi.mock('./components/AuthSuccess.jsx', () => ({
  default: () => <div data-testid="auth-success-page">Auth Success Page</div>,
}));

// Mock ToastContainer
vi.mock('react-toastify', () => ({
  ToastContainer: () => <div data-testid="toast-container">Toast Container</div>,
}));

describe('App Component', () => {
  function renderWithRouter(route) {
    return render(
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    );
  }

  test('renders ToastContainer', () => {
    renderWithRouter('/');
    expect(screen.getByTestId('toast-container')).toBeInTheDocument();
  });

  test('renders Home page on default route', () => {
    renderWithRouter('/');
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  test('renders Contact page', () => {
    renderWithRouter('/contact');
    expect(screen.getByTestId('contact-page')).toBeInTheDocument();
  });

  test('renders PropertyForm for create property route', () => {
    renderWithRouter('/create-property');
    expect(screen.getByTestId('property-form-page')).toBeInTheDocument();
  });

  test('renders PropertyForm for edit property route', () => {
    renderWithRouter('/edit-property/123');
    expect(screen.getByTestId('property-form-page')).toBeInTheDocument();
  });

  test('renders PropertyDetails page', () => {
    renderWithRouter('/property/123');
    expect(screen.getByTestId('property-details-page')).toBeInTheDocument();
  });

  test('renders UserSignUpPage', () => {
    renderWithRouter('/signup');
    expect(screen.getByTestId('user-signup-page')).toBeInTheDocument();
  });

  test('renders UserLoginPage', () => {
    renderWithRouter('/login');
    expect(screen.getByTestId('user-login-page')).toBeInTheDocument();
  });

  test('renders AdminLoginPage', () => {
    renderWithRouter('/admin/login');
    expect(screen.getByTestId('admin-login-page')).toBeInTheDocument();
  });

  test('renders AdminDashboard', () => {
    renderWithRouter('/admin/dashboard');
    expect(screen.getByTestId('admin-dashboard-page')).toBeInTheDocument();
  });

  test('renders UserManagementPage', () => {
    renderWithRouter('/admin/users');
    expect(screen.getByTestId('user-management-page')).toBeInTheDocument();
  });

  test('renders RoomManagementPage', () => {
    renderWithRouter('/admin/rooms');
    expect(screen.getByTestId('room-management-page')).toBeInTheDocument();
  });

  test('renders BookingManagementPage', () => {
    renderWithRouter('/admin/bookings');
    expect(screen.getByTestId('booking-management-page')).toBeInTheDocument();
  });

  test('renders VendorRequestPage', () => {
    renderWithRouter('/admin/requests');
    expect(screen.getByTestId('vendor-request-page')).toBeInTheDocument();
  });

  test('renders AuthSuccess', () => {
    renderWithRouter('/auth-success');
    expect(screen.getByTestId('auth-success-page')).toBeInTheDocument();
  });

  test('renders UserDashboard', () => {
    renderWithRouter('/user-dashboard');
    expect(screen.getByTestId('user-dashboard-page')).toBeInTheDocument();
  });
});