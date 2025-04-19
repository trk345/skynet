import Home from './pages/Home.jsx'
import Contact from './pages/Contact.jsx'
import CreateProperty from './pages/PropertyForm.jsx'
import EditProperty from './pages/PropertyForm.jsx'
import PropertyDetails from './pages/PropertyDetails.jsx'
import AdminLoginPage from './pages/AdminLogin.jsx'
import UserSignUpPage from './pages/UserSignup.jsx'
import UserLoginPage from './pages/UserLogin.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import UserManagementPage from './pages/AdminUserManagement.jsx'
import RoomManagementPage from './pages/AdminRoomManagement.jsx'
import BookingManagementPage from './pages/AdminBookingManagement.jsx'
import VendorRequestPage from './pages/AdminVendorRequests.jsx'
import UserDashboard from './pages/UserDashboard.jsx'
import AuthSuccess from './components/AuthSuccess.jsx'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create-property" element={<CreateProperty />} />
        <Route path="/property/:id" element={<PropertyDetails />} />
        <Route path="/edit-property/:id" element={<EditProperty />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/signup" element={<UserSignUpPage />} />
        <Route path="/login" element={<UserLoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManagementPage />} />
        <Route path="/admin/rooms" element={<RoomManagementPage />} />
        <Route path="/admin/bookings" element={<BookingManagementPage />} />
        <Route path="/admin/requests" element={<VendorRequestPage />} />
        <Route path="/auth-success" element={<AuthSuccess />} />
        <Route path="/user-dashboard" element={<UserDashboard />} />
      </Routes>

      {/* Toasts will render globally from here */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </>
  );
}

export default App;
