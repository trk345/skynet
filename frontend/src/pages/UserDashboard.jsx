import { useState, useEffect, useMemo } from 'react';
import { X, CalendarDays, Building, Edit, Trash, Plus, Eye, ChevronDown, Search, Filter, Star, MessageCircle } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeListings: 0,
    averageRating: 0,
    totalReviews: 0,
  });

  // Fetch user data from backend on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
          withCredentials: true,
        });
        if (response.data) {
          setUser(response.data.user);
        }
      } catch (error) {
        setUser(null);
        console.error("Auth error:", error.response?.data || error.message);
      }
    };
    
    fetchUser();
  }, []);
  

  useEffect(() => {
    const fetchVendorProperties = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/vendor/getProperties`, {
          withCredentials: true,
        });
        
        if (response.data.success) {
          console.log("Fetched Vendor Properties:", response.data.data);
          const propertiesData = response.data.data;
          setProperties(propertiesData);
          
          // Calculate total reviews and average rating
          const totalReviews = propertiesData.reduce((sum, p) => sum + (p.reviews?.length || 0), 0);
          
          // Calculate average rating across all properties
          let ratingSum = 0;
          let ratedProperties = 0;
          
          propertiesData.forEach(property => {
            if (property.rating && property.rating > 0) {
              ratingSum += property.rating;
              ratedProperties++;
            }
          });
          
          const avgRating = ratedProperties > 0 ? (ratingSum / ratedProperties).toFixed(1) : 0;
          
          // Update stats
          setStats({
            totalProperties: propertiesData.length,
            activeListings: propertiesData.filter(p => p.status === 'active').length,
            averageRating: avgRating,
            totalReviews: totalReviews,
          });
        } else {
          console.log("Failed to fetch properties:", response.data.error);
          alert("Failed to fetch properties. Please try again later");
        }
      } catch (error) {
        console.log("Error fetching properties:", error);
        alert("There was an error when trying to fetch properties. Please try again later");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVendorProperties();
  }, []);

  const handleDeleteProperty = async (id) => {
    if (window.confirm("Are you sure you want to delete this property?")) {
      try {
        const response = await axios.delete(`${import.meta.env.VITE_API_URL}/api/vendor/deleteProperty/${id}`, {
          withCredentials: true,
        });
        
        if (response.data.success) {
          setProperties(prev => prev.filter(property => property._id !== id));
          alert("Property deleted successfully!");
        } else {
          alert("Failed to delete property: " + response.data.error);
        }
      } catch (error) {
        console.error("Error deleting property:", error);
        alert("An error occurred while deleting the property.");
      }
    }
  };

  const filteredProperties = properties.filter(property => 
    property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedProperties = [...filteredProperties].sort((a, b) => {
    if (sortOption === 'name-asc') return a.name.localeCompare(b.name);
    if (sortOption === 'name-desc') return b.name.localeCompare(a.name);
    if (sortOption === 'price-asc') return parseFloat(a.price) - parseFloat(b.price);
    if (sortOption === 'price-desc') return parseFloat(b.price) - parseFloat(a.price);
    if (sortOption === 'rating-desc') return (b.rating || 0) - (a.rating || 0);
    if (sortOption === 'reviews-desc') return (b.reviews?.length || 0) - (a.reviews?.length || 0);
    // Default: newest first (assuming there's a createdAt field)
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  // Helper function to render stars
  const renderStars = (rating) => {
    const ratingValue = parseFloat(rating) || 0;
    return (
      <div className="flex items-center">
         {[1, 2, 3, 4, 5].map((star) => (
           <Star 
             key={star} 
             size={16} 
             className={`${star <= ratingValue ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} 
           />
         ))}
         <span className="ml-1 text-gray-600">{ratingValue.toFixed(1)}</span>
       </div>
     );
  };

  // State for the bookings section
  const [bookingFilter, setBookingFilter] = useState('upcoming');
  const [bookings, setBookings] = useState([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);

  // Function to get status colors based on booking status
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date to display in a readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Format time to display in a readable format
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  // Function to handle viewing booking details
  const handleViewBooking = (booking) => {
    // Navigate to booking details page
    navigate(`/property/${booking.propertyId._id}`);
  };

  // Filter bookings based on the selected filter
  const filteredBookings = useMemo(() => {
    if (!bookings.length) return [];
    
    const now = new Date();
    
    return bookings.filter(booking => {
      const checkInDate = new Date(booking.checkIn);
      const checkOutDate = new Date(booking.checkOut);
      
      switch (bookingFilter) {
        case 'upcoming':
          return checkInDate > now;
        case 'current':
          return checkInDate <= now && checkOutDate >= now;
        case 'past':
          return checkOutDate < now;
        default:
          return true;
      }
    });
  }, [bookings, bookingFilter]);

  // Fetch bookings 
  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoadingBookings(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/getBookings`, {
          withCredentials: true,
        });

        if (response.data.success) {
          setBookings(response.data.data);
        } else {
          console.error('Failed to fetch bookings:', response.data.message);
          // Optionally show an error toast/notification
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
        // Optionally show an error toast/notification
      } finally {
        setIsLoadingBookings(false);
      }
    };
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    const isConfirmed = window.confirm("Are you sure you want to cancel your booking?");

    if (!isConfirmed) {
        return; // If user cancels, exit the function
    }

    try {
        const response = await axios.delete(`${import.meta.env.VITE_API_URL}/api/user/properties/bookings/${bookingId}`, {
          withCredentials: true,
        });

        if (response.data.success) {
            toast.success("Booking cancelled successfully.");
            window.location.reload(); // or update the UI more gracefully
        } else {
            toast.error("Failed to cancel booking.");
        }
    } catch (error) {
        console.error("Error cancelling booking:", error);
        toast.error(error.response?.data?.message || "An error occurred while cancelling booking.");
    }
};

  // Function to render the appropriate content based on loading state and available properties
  const renderPropertyContent = () => {
    if (isLoading) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading properties...</p>
        </div>
      );
    } else if (sortedProperties.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Building size={60} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-gray-700">No Properties Found</h3>
          <p className="text-gray-600 mb-6">You haven&apos;t added any properties yet or none match your search.</p>
          <Link 
            to="/create-property" 
            className="inline-flex items-center justify-center bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition duration-300"
          >
            <Plus size={18} className="mr-2" /> Add Your First Property
          </Link>
        </div>
      );
    } else {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {sortedProperties.map((property) => (
            <div key={property._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
              {/* Property Image/Icon */}
              <div className="bg-gray-100 h-48 flex items-center justify-center">
                {property.images ? (
                  <img 
                    src={`${import.meta.env.VITE_API_URL}/${property.images[0]}`}
                    alt={property.name}
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <Building className="text-blue-600" size={80} />
                )}
              </div>
              
              {/* Property Details */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold text-gray-800">{property.name}</h3>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                    {property.status || 'Active'}
                  </span>
                </div>

                <span className="truncate max-w-[150px] block" title={property.type}>
                  {property.type || 'Unknown Type'}
                </span>
                
                <p className="text-gray-600 mb-1">
                  <span className="font-medium">Price:</span> ${property.price}/night
                </p>
                <p className="text-gray-600 mb-1">
                  <span className="font-medium">Location:</span> {property.location || 'Not specified'}
                </p>
                <p className="text-gray-600 mb-4">
                  <span className="font-medium">Guests:</span> {property.maxGuests || 'Not specified'}
                </p>
                
                {/* Ratings and Reviews */}
                <div className="mb-4">
                  <div className="flex items-center mb-1">
                    {renderStars(property.rating || 0)}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <MessageCircle size={16} className="mr-1" /> 
                    {property.reviews?.length || 0} {property.reviews?.length === 1 ? 'review' : 'reviews'}
                  </div>
                </div>
                
                {/* Latest Review Preview (if available) */}
                {property.reviews && property.reviews.length > 0 && (
                  <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
                    <p className="text-gray-700 italic">&quot;{property.reviews[0].comment?.substring(0, 60)}...&quot;</p>
                    <p className="text-gray-500 text-xs mt-1">— {property.reviews[0].user || 'Anonymous'}</p>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex justify-between mt-4">
                  <Link 
                    to={`/property/${property._id}`}
                    className="bg-blue-50 text-blue-600 py-2 px-4 rounded hover:bg-blue-100 transition duration-300"
                  >
                    <Eye size={16} className="inline mr-1" /> View
                  </Link>
                  <Link 
                    to={`/edit-property/${property._id}`}
                    className="bg-yellow-50 text-yellow-600 py-2 px-4 rounded hover:bg-yellow-100 transition duration-300"
                  >
                    <Edit size={16} className="inline mr-1" /> Edit
                  </Link>
                  <button 
                    type="button"
                    onClick={() => handleDeleteProperty(property._id)}
                    className="bg-red-50 text-red-600 py-2 px-4 rounded hover:bg-red-100 transition duration-300 cursor-pointer"
                  >
                    <Trash size={16} className="inline mr-1" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }
  };

  // Function to render booking content based on loading state and available bookings
  const renderBookingContent = () => {
    if (isLoadingBookings) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      );
    } else if (filteredBookings.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <CalendarDays size={60} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-gray-700">No Bookings Found</h3>
          <p className="text-gray-600 mb-6">
            {bookingFilter === 'upcoming' && "You don't have any upcoming bookings."}
            {bookingFilter === 'current' && "You don't have any current bookings."}
            {bookingFilter === 'past' && "You don't have any past bookings."}
          </p>
        </div>
      );
    } else {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {filteredBookings.map((booking) => (
            <div key={booking._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
              {/* Property Image/Icon */}
              <div className="bg-gray-100 h-48 flex items-center justify-center">
                {booking.propertyId.images ? (
                  <img 
                    src={`${import.meta.env.VITE_API_URL}/${booking.propertyId.images[0]}`}
                    alt={booking.propertyId.name}
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <Building className="text-blue-600" size={80} />
                )}
              </div>
              
              {/* Booking Details */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold text-gray-800">{booking.propertyId.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-1">
                  <span className="font-medium">Location:</span> {booking.propertyId.location || 'Not specified'}
                </p>
                <p className="text-gray-600 mb-1">
                  <span className="font-medium">Guests:</span> {booking.guests}
                </p>
                <p className="text-gray-600 mb-1">
                  <span className="font-medium">Check-in:</span> {formatDate(booking.checkIn)} ({formatTime(booking.checkIn)})
                </p>
                <p className="text-gray-600 mb-1">
                  <span className="font-medium">Check-out:</span> {formatDate(booking.checkOut)} ({formatTime(booking.checkOut)})
                </p>
                <p className="text-gray-600 mb-4">
                  <span className="font-medium">Total Amount:</span> ${booking.totalAmount}
                </p>
                
                {/* Action Buttons */}
                <div className="flex justify-between mt-4">
                  <button 
                    type="button"
                    onClick={() => handleViewBooking(booking)}
                    className="bg-blue-50 text-blue-600 py-2 px-4 rounded hover:bg-blue-100 transition duration-300 cursor-pointer"
                  >
                    <Eye size={16} className="inline mr-1" /> View Details
                  </button>
                  {(bookingFilter === 'upcoming' || bookingFilter === 'current') && (
                    <button 
                      type="button"
                      onClick={() => handleCancelBooking(booking._id)}
                      className="bg-red-50 text-red-600 py-2 px-4 rounded hover:bg-red-100 transition duration-300 cursor-pointer"
                    >
                      <X size={16} className="inline mr-1" /> Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }
  };
  
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <Navbar />
      <main className="flex-grow">
        {/* Dashboard Header */}
        <div className="bg-blue-600 py-8">
          <div className="container mx-auto px-4">
            {user?.role === "vendor" ? (
              <>
                <h1 className="text-3xl font-bold text-white">Vendor Dashboard</h1>
                <p className="text-blue-100 mt-2">Manage your properties and customer feedback</p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-white">User Dashboard</h1>
                <p className="text-blue-100 mt-2">Manage your bookings</p>
              </>
            )}
          </div>
        </div>
        
        {/* Stats Section */}
        {user?.role === "vendor" && (
        <div className="container mx-auto px-4 -mt-6">
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <h3 className="text-lg font-semibold text-blue-800">{stats.totalProperties}</h3>
                <p className="text-gray-600 text-sm">Total Properties</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <h3 className="text-lg font-semibold text-green-800">{stats.activeListings}</h3>
                <p className="text-gray-600 text-sm">Active Listings</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <div className="flex justify-center">
                  {renderStars(stats.averageRating)}
                </div>
                <p className="text-gray-600 text-sm">Average Rating</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <h3 className="text-lg font-semibold text-purple-800">{stats.totalReviews}</h3>
                <p className="text-gray-600 text-sm">Total Reviews</p>
              </div>
            </div>
          </div>
        </div>
        )}
        
        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {user?.role === "vendor" && (
            <>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">My Properties</h2>
                <Link 
                  to="/create-property" 
                  className="flex items-center justify-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-300"
                >
                  <Plus size={18} className="mr-2" /> Add New Property
                </Link>
              </div>
              
              {/* Search and Filter */}
              <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-grow">
                    <Search className="absolute top-3 left-3 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search properties..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setFilterOpen(!filterOpen)}
                      className="flex items-center justify-center bg-gray-100 py-2 px-4 rounded-md hover:bg-gray-200 transition duration-300"
                    >
                      <Filter size={18} className="mr-2" /> Sort 
                      <ChevronDown size={16} className="ml-2" />
                    </button>
                    
                    {filterOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                        <div className="py-1">
                          <button 
                            type="button"
                            onClick={() => {setSortOption('newest'); setFilterOpen(false);}}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Newest First
                          </button>
                          <button 
                            type="button"
                            onClick={() => {setSortOption('name-asc'); setFilterOpen(false);}}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Name (A-Z)
                          </button>
                          <button 
                            type="button"
                            onClick={() => {setSortOption('name-desc'); setFilterOpen(false);}}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Name (Z-A)
                          </button>
                          <button 
                            type="button"
                            onClick={() => {setSortOption('price-asc'); setFilterOpen(false);}}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Price (Low to High)
                          </button>
                          <button 
                            type="button"
                            onClick={() => {setSortOption('price-desc'); setFilterOpen(false);}}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Price (High to Low)
                          </button>
                          <button 
                            type="button"
                            onClick={() => {setSortOption('rating-desc'); setFilterOpen(false);}}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Highest Rated
                          </button>
                          <button 
                            type="button"
                            onClick={() => {setSortOption('reviews-desc'); setFilterOpen(false);}}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Most Reviewed
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Properties List */}
              {renderPropertyContent()}
            </>
          )}

          {/* My Bookings Section */}
          <div className="mt-12 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">My Bookings</h2>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setBookingFilter('upcoming')}
                  className={`py-2 px-4 rounded-md transition duration-300 cursor-pointer ${
                    bookingFilter === 'upcoming' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Upcoming
                </button>
                <button
                  type="button"
                  onClick={() => setBookingFilter('current')}
                  className={`py-2 px-4 rounded-md transition duration-300 cursor-pointer ${
                    bookingFilter === 'current' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Current
                </button>
                <button
                  type="button"
                  onClick={() => setBookingFilter('past')}
                  className={`py-2 px-4 rounded-md transition duration-300 cursor-pointer ${
                    bookingFilter === 'past' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Past
                </button>
              </div>
            </div>
            
            {/* Bookings Cards */}
            {renderBookingContent()}
          </div>
            
        </div>
          
          
          {/* Reviews Section Link */}
          {user?.role === "vendor" && (
          <div className="mt-12 mb-8 bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Customer Reviews</h2>
                <p className="text-gray-600 mt-1">View and respond to all your property reviews in one place</p>
              </div>
              <Link 
                to="/vendor-reviews" 
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-300"
              >
                Manage Reviews
              </Link>
            </div>
          </div>
          )}
      </main>
      {/* Footer */}
        <Footer />
    </div>
  ); 
};

export default UserDashboard;