import { useState, useEffect } from 'react';
import { Building, Edit, Trash, Plus, Eye, ChevronDown, Search, Filter, Star, MessageCircle } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import axios from 'axios';
import { Link } from 'react-router-dom';

const VendorDashboard = () => {
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

  useEffect(() => {
    const fetchVendorProperties = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get("http://localhost:4000/api/vendor/getProperties", 
          { withCredentials: true }
        );
        
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
        const response = await axios.delete(`http://localhost:4000/api/vendor/deleteProperty/${id}`, 
          { withCredentials: true }
        );
        
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Navbar />
      
      {/* Dashboard Header */}
      <div className="bg-blue-600 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-white">Vendor Dashboard</h1>
          <p className="text-blue-100 mt-2">Manage your properties and customer feedback</p>
        </div>
      </div>
      
      {/* Stats Section */}
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
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
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
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading properties...</p>
          </div>
        ) : sortedProperties.length === 0 ? (
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {sortedProperties.map((property) => (
              <div key={property._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                {/* Property Image/Icon */}
                <div className="bg-gray-100 h-48 flex items-center justify-center">
                  {property.imageUrl ? (
                    <img 
                      src={property.imageUrl} 
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
            ))}</div>
            )}
          </div>
        
        
        {/* Reviews Section Link */}
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
        {/* Footer */}
          <Footer />
      </div>
        );
  
};

export default VendorDashboard;