import { useState, useEffect } from 'react';
import { Search, MapPin, Users, Building, ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import axios from 'axios';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

const PropertyImageGallery = ({ images = [] }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // If no images, return default icon
  if (!images || images.length === 0) {
    return (
      <div className="relative h-56 bg-gray-200 flex items-center justify-center">
        <Building className="text-blue-600 opacity-70" size={100} />
      </div>
    );
  }

  const handleNext = (e) => {
    // Stop event propagation to prevent link navigation
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) => 
      prevIndex === images.length - 1 ? images.length - 1 : prevIndex + 1
    );
  };

  const handlePrev = (e) => {
    // Stop event propagation to prevent link navigation
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? 0 : prevIndex - 1
    );
  };

  return (
    <div className="relative h-56 w-full overflow-hidden">
      {/* Main Image */}
      <img 
        src={`http://localhost:4000/${images[currentImageIndex]}`} 
        alt={`Property image ${currentImageIndex + 1}`}
        className="w-full h-full object-cover absolute top-0 left-0"
      />

      {/* Navigation Arrows - Only show if more than one image */}
      {images.length > 1 && (
        <>
          {/* Previous Button */}
          {currentImageIndex > 0 && (
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 
              bg-white/50 hover:bg-white/70 rounded-full p-1 
              transition-all duration-300 z-10 cursor-pointer"
          >
            <ChevronLeft className="text-gray-800" size={24} />
          </button>
          )}

          {/* Next Button */}
          {currentImageIndex < images.length -1 && (
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 
              bg-white/50 hover:bg-white/70 rounded-full p-1 
              transition-all duration-300 z-10 cursor-pointer"
          >
            <ChevronRight className="text-gray-800" size={24} />
          </button>
          )}

        </>
      )}

      {/* Image Counter */}
      {images.length > 1 && (
        <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
          {currentImageIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
};


const Home = () => {
  const [searchParams, setSearchParams] = useState({
    type: '',
    location: '',
    price: '',
    maxGuests: '',
    checkIn: '',
    checkOut: '',
    averageRating: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleSearch = async () => {
    try {
      // Send the search parameters to the backend
      const response = await axios.get("http://localhost:4000/api/auth/getProperties", {
        withCredentials: true,
        params: { ...searchParams } // send all search params
      });
  
      if (response.data.success) {
        setProperties(response.data.data); // Set the filtered properties
      } else {
        console.log("Failed to fetch properties:", response.data.error);
      }
    } catch (error) {
      console.log("Error fetching properties:", error);
    }
  };

  const [properties, setProperties] = useState([]);

  useEffect(() => {
    const getProperties = async () => {
      try {
        const response = await axios.get("http://localhost:4000/api/auth/getProperties", { 
          withCredentials: true,
          params: { ...searchParams } // Send the current search params on load
        });
  
        if (response.data.success) {
          setProperties(response.data.data);
        } else {
          console.log("Failed to fetch properties:", response.data.error);
        }
      } catch (error) {
        console.log("Error fetching properties:", error);
      }
    };
  
    getProperties();
  }, [searchParams]); // Add searchParams as a dependency to fetch properties whenever search params change

  return (
    <>
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Navbar></Navbar>
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-800">Find Your Perfect Room</h1>
        <p className="text-xl text-gray-600 mb-8">Discover and book rooms effortlessly across various locations</p>
        {/* Search Container */}
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Type */}
            <select
              name="type"
              value={searchParams.type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Property Type</option>
              <option value="standard-room">Standard Room</option>
              <option value="luxury-room">Luxury Room</option>
              <option value="business-suite">Business Suite</option>
              <option value="apartment">Apartment</option>
              <option value="villa">Villa</option>
            </select>

            {/* Location */}
            <input
              type="text"
              name="location"
              placeholder="Location"
              value={searchParams.location}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Price */}
            <input
              type="number"
              name="price"
              placeholder="Max Price"
              value={searchParams.price}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Guests */}
            <input
              type="number"
              name="maxGuests"
              value={searchParams.maxGuests}
              onChange={handleInputChange}
              placeholder="Max Guests"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Check-in */}
            <input
              type="date"
              name="checkIn"
              value={searchParams.checkIn}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Check-out */}
            <input
              type="date"
              name="checkOut"
              value={searchParams.checkOut}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Average Rating */}
            <input
              type="number"
              step="1"
              name="averageRating"
              placeholder="Min Rating"
              value={searchParams.averageRating}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Search Button */}
          <button 
            onClick={handleSearch}
            className="mt-4 w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition duration-300"
          >
            <Search className="inline-block mr-2" size={20} /> Search Rooms
          </button>
        </div>
      </div>
          
      {/* Featured Rooms Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Featured Properties</h2>
        {properties.length === 0 ? (
          <div className="text-center text-gray-500">
            <p className="text-xl">No properties available at the moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {properties.map((property) => (
              <Link 
                key={property._id} 
                to={`/property/${property._id}`} 
                className="group"
              >
                <div className="bg-white shadow-lg rounded-xl overflow-hidden transition-all duration-300 transform hover:scale-105 hover:shadow-xl relative">
                  {/* Status Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <span 
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        property.status === "available"
                          ? 'bg-green-500 text-white' 
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {property.status}
                    </span>
                  </div>

                  {/* Placeholder Image */}
                  <PropertyImageGallery images={property.images} />
                  
                  {/* Property Details */}
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition">
                        {property.name}
                      </h3>
                      <span className="text-green-600 font-semibold text-lg">
                        ${property.price}/night
                      </span>
                    </div>
                    
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="mr-2 text-blue-500" size={20} />
                      <span>{property.location || 'Unknown Location'}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600 mb-4">
                      <Users className="mr-2 text-blue-500" size={20} />
                      <span>
                        Max {property.maxGuests || 2} Guests
                      </span>
                    </div>

                    {/* Rating and Reviews */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, index) => (
                          <svg 
                            key={index} 
                            className={`w-5 h-5 ${
                              index < Math.floor(property.averageRating || 0) 
                                ? 'text-yellow-400' 
                                : 'text-gray-300'
                            }`}
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="ml-2 text-gray-600 text-sm">
                          ({property.reviewCount || 0})
                        </span>
                      </div>

                      {/* Optional Amenities Section */}
                      {property.amenities && Object.values(property.amenities).some(Boolean) && (
                        <div className="flex items-center space-x-0.5 opacity-70">
                          {(() => {
                            const activeAmenities = Object.entries(property.amenities)
                              .filter(([isAvailable]) => isAvailable)
                              .slice(0, 2)
                              .map(([amenity]) => amenity);

                            const totalAdditionalAmenities = Object.values(property.amenities)
                              .filter(isAvailable => isAvailable).length - activeAmenities.length;

                            return (
                              <>
                                {activeAmenities.map((amenity) => (
                                  <span 
                                    key={amenity} 
                                    className="bg-gray-100 text-gray-700 px-1 py-1 rounded-full text-xs"
                                  >
                                    {amenity}
                                  </span>
                                ))}
                                {totalAdditionalAmenities > 0 && (
                                  <span className="text-xs text-gray-500">
                                    + {totalAdditionalAmenities} more
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
          
          {/* View All Properties Button
          {properties.length > 0 && (
            <div className="text-center mt-12">
              <Link 
                to="/properties" 
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition duration-300 inline-block"
              >
                View All Properties
              </Link>
            </div>
          )} */}
        </section>    

    </div>
      {/* Footer */}
      <Footer></Footer>
    </>
  );
};

PropertyImageGallery.propTypes = {
  images: PropTypes.arrayOf(PropTypes.string), // Assuming the images are an array of strings (URLs)
};

export default Home;
