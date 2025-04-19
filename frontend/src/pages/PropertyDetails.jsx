import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from 'axios';
import { X, ChevronLeft, ChevronRight, Maximize2, MapPin, Users, Wifi, Car, Coffee, Wind, Thermometer, Tv, ChefHat, Briefcase, Star, Phone, Mail } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';

function PropertyImageGallery({ images = [] }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleNext = () => {
        setCurrentImageIndex((prev) => 
            prev === images.length - 1 ? images.length - 1 : prev + 1
        );
    };

    const handlePrev = () => {
        setCurrentImageIndex((prev) => 
            prev === 0 ? 0 : prev - 1
        );
    };

    if (!images || images.length === 0) {
        return (
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 h-64 flex items-center justify-center rounded-lg">
                <p className="text-gray-500 text-xl">No images available</p>
            </div>
        );
    }

    return (
        <div className="relative group">
            {/* Main Image Container */}
            <div className="relative w-full h-[500px] overflow-hidden rounded-lg">
                {/* Main Image */}
                <img 
                    src={`${import.meta.env.VITE_API_URL}/${images[currentImageIndex]}`} 
                    alt={`Property ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300"
                />

                {/* Navigation Arrows */}
                {images.length > 1 && (
                    <>  
                    {currentImageIndex > 0 && (
                        <button 
                            type="button"
                            onClick={handlePrev}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/70 cursor-pointer hover:bg-white/90 p-2 rounded-full shadow-md transition-all duration-300 opacity-0 group-hover:opacity-100"
                        >
                            <ChevronLeft className="text-gray-800" />
                        </button>
                    )}
                    
                    {currentImageIndex < (images.length -1) && (
                        <button 
                            type="button"
                            onClick={handleNext}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/70 cursor-pointer hover:bg-white/90 p-2 rounded-full shadow-md transition-all duration-300 opacity-0 group-hover:opacity-100"
                        >
                            <ChevronRight className="text-gray-800" />
                        </button>
                    )}
                    </>
                )}

                {/* Expand Button */}
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="absolute top-4 right-4 bg-white/70 cursor-pointer hover:bg-white/90 p-2 rounded-full shadow-md transition-all duration-300"
                >
                    <Maximize2 className="text-gray-800" />
                </button>

                {/* Image Count */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-1 rounded-full">
                    {currentImageIndex + 1} / {images.length}
                </div>
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
                <div className="mt-4 flex space-x-2 overflow-x-auto pb-2">
                    {images.map((image, index) => (
                        <button 
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 ${
                                index === currentImageIndex 
                                    ? 'border-blue-500' 
                                    : 'border-transparent hover:border-gray-300'
                            }`}
                        >
                            <img 
                                src={`${import.meta.env.VITE_API_URL}/${image}`} 
                                alt={`Thumbnail ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* Full Screen Modal */}
            {isModalOpen && (
            <div 
                className="fixed inset-0 z-50 bg-gray-900/95 flex items-center justify-center p-8"
                onClick={() => setIsModalOpen(false)}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                        setIsModalOpen(false);
                    }
                }}
                tabIndex={0} // Allows div to capture key events
            >
                <div 
                    className="relative w-[90%] h-[90%] max-w-[1200px] flex items-center justify-center"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                        if (e.key === "ArrowLeft" && images.length > 1 && currentImageIndex > 0) {
                            handlePrev();
                        } else if (e.key === "ArrowRight" && images.length > 1 && currentImageIndex < images.length - 1) {
                            handleNext();
                        }
                    }}
                    tabIndex={0} // Allows this div to capture key events
                >
                    {/* Previous Image Button */}
                    {images.length > 1 && currentImageIndex>0 && (
                        
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                handlePrev();
                            }}
                            className="absolute left-0 z-10 bg-white/20 cursor-pointer hover:bg-white/40 p-4 rounded-full transition-all duration-300 text-white"
                        >
                            <ChevronLeft size={24} />
                        </button>
                    )}

                    {/* Image Container */}
                    <div className="relative w-full h-full flex items-center justify-center p-8">
                        <img 
                            src={`${import.meta.env.VITE_API_URL}/${images[currentImageIndex]}`} 
                            alt={`Full screen view ${currentImageIndex + 1}`}
                            className="max-w-full max-h-full object-contain"
                        />
                    </div>

                    {/* Next Image Button */}
                    {images.length > 1 && currentImageIndex < images.length -1 && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleNext();
                            }}
                            className="absolute right-0 z-10 bg-white/20 cursor-pointer hover:bg-white/40 p-4 rounded-full transition-all duration-300 text-white"
                        >
                            <ChevronRight size={24} />
                        </button>
                    )}

                    {/* Close Button */}
                    <button 
                        onClick={() => setIsModalOpen(false)}
                        className="absolute top-0 right-0 m-4 text-white bg-white/20 cursor-pointer hover:bg-white/40 p-2 rounded-full transition-all duration-300"
                    >
                        <X size={24} />
                    </button>

                    {/* Image Counter */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 mb-4 text-white bg-black/50 px-4 py-2 rounded-lg">
                        {currentImageIndex + 1} / {images.length}
                    </div>
                </div>
            </div>
            )}

        </div>
    );
}

const PropertyDetails = () => {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [bookingDates, setBookingDates] = useState({
    checkIn: null,
    checkOut: null,
    guests: 1
  });  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitError, setSubmitError] = useState("");

  // Fetch user data from backend on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/me`, { withCredentials: true });

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
    const getProperty = async() => {
        try {
            setLoading(true);
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/getProperty/${id}`, { withCredentials: true });
            if (!response.data.success) {
                setError(response.data.error || "Failed to fetch property details");
            } else {
                setProperty(response.data.data);
            }
        } catch (error) {
            setError("An error occurred while fetching property details");
            console.log("Error fetching property:", error);
        } finally {
            setLoading(false);
        }
    };
    
    getProperty();
}, [id]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setBookingDates(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleBooking = async () => {
    
        // Validate that all necessary fields are filled out
        if (!bookingDates.checkIn || !bookingDates.checkOut || bookingDates.guests < 1) {
            alert("Please fill out all the details correctly.");
            return;
        }
    
        const checkInDate = new Date(bookingDates.checkIn);
        const checkOutDate = new Date(bookingDates.checkOut);
    
        // Check if check-in is before check-out and dates are valid
        if (checkInDate >= checkOutDate) {
            alert("Check-out date must be later than check-in date.");
            return;
        }
    
        // Calculate the number of nights
        const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    
        if (nights <= 0) {
            alert("Invalid date range. Please select valid dates.");
            return;
        }
    
        // Check if the number of guests is valid
        if (bookingDates.guests <= 0) {
            alert("Number of guests must be at least 1.");
            return;
        }
    
        // Prepare the booking details
        const bookingDetails = {
            propertyId: property._id,
            checkIn: bookingDates.checkIn,
            checkOut: bookingDates.checkOut,
            guests: bookingDates.guests,
            totalAmount: property.price * nights,
        };
    
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/user/book-property`, bookingDetails, { withCredentials: true });
    
            if (response.data.success) {
                alert(`Booking successful! Total: $${response.data.totalAmount}`);
                window.location.reload();  // Refresh the page
            } else {
                alert(`Booking failed: ${response.data.message}`);
            }
        } catch (error) {
            console.error("Booking error:", error);
            
            // Try to extract the backend error message
            const message =
                error.response?.data?.message ||
                "An error occurred while processing your booking. Please try again.";
            
            alert(message);
        }
    };

    const handleSubmitReview = async () => {
        if (!user) {
          setSubmitError("You must be logged in to submit a review.");
          return;
        }
      
        if (rating === 0 || comment.trim() === "") {
          setSubmitError("Please provide both a rating and a comment.");
          return;
        }
      
        try {
          await axios.post(
            `${import.meta.env.VITE_API_URL}/api/user/properties/reviews/${id}`,
            { rating, comment },
            { withCredentials: true }
            );              
      
          window.location.reload(); // Refresh the page to reflect updated data
        } catch (err) {
          console.error("Error submitting review:", err);
          setSubmitError("Failed to submit review. Please try again later.");
        }
      };


      const handleUnbook = async (bookingId) => {
        const isConfirmed = window.confirm("Are you sure you want to cancel your booking?");
    
        if (!isConfirmed) {
            return; // If user cancels, exit the function
        }
    
        try {
            const response = await axios.delete(`${import.meta.env.VITE_API_URL}/api/user/properties/bookings/${bookingId}`, { withCredentials: true });
    
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
    


    const renderInteractiveStars = () => {
    return (
        <div className="flex space-x-1 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
            <svg
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            xmlns="http://www.w3.org/2000/svg"
            className={`w-6 h-6 cursor-pointer ${
                (hoverRating || rating) >= star ? "text-yellow-400" : "text-gray-300"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
            >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.538 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.783.57-1.838-.197-1.538-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.075 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
            </svg>
        ))}
        </div>
    );
    };

    if (loading) return (
        <div className="min-h-screen flex justify-center items-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading property details...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex justify-center items-center bg-gray-50">
            <div className="text-center text-red-600 p-6 bg-white shadow-md rounded-lg">
                <h2 className="text-xl font-bold mb-2">Error</h2>
                <p>{error}</p>
                <Link to="/" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Return to Home
                </Link>
            </div>
        </div>
    );

    if (!property) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'Not specified';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Star 
                    key={i} 
                    size={18} 
                    className={i <= rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"} 
                />
            );
        }
        return stars;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            
            <div className="container mx-auto px-4 py-8">
                {/* Property Header */}
                <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
                    <div className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">{property.name}</h1>
                                <div className="flex items-center text-gray-600 mb-4">
                                    <MapPin size={18} className="mr-1" />
                                    <span>{property.location} - {property.address}</span>
                                </div>
                                <div className="flex items-center space-x-4 mb-2">
                                    <div className="flex items-center">
                                        {renderStars(property.averageRating)}
                                        <span className="ml-2 text-gray-600">
                                        {property.averageRating !== undefined && property.reviewCount !== undefined ? (
                                            <span className="ml-2 text-gray-600">
                                                {property.averageRating.toFixed(1)} ({property.reviewCount} reviews)
                                            </span>
                                            ) : (
                                            <span className="ml-2 text-gray-600">No reviews yet</span>
                                        )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-bold text-blue-600">${property.price}<span className="text-sm text-gray-600">/night</span></p>
                                <p className="text-green-600 font-semibold mt-2">{property.status}</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Property Images */}
                    <div className="p-6 border-t border-gray-200">
                        <PropertyImageGallery images={property.images} />
                    </div>
                    
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Property Details */}
                    <div className="lg:col-span-2">
                        {/* Quick Info */}
                        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">Property Overview</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="text-center">
                                    <div className="text-lg font-bold text-gray-800">{property.bedrooms}</div>
                                    <div className="text-sm text-gray-600">Bedrooms</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-gray-800">{property.bathrooms}</div>
                                    <div className="text-sm text-gray-600">Bathrooms</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-gray-800">{property.squareFeet || 'Not Specified'}</div>
                                    <div className="text-sm text-gray-600">Square Feet</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-gray-800">{property.maxGuests}</div>
                                    <div className="text-sm text-gray-600">Max Guests</div>
                                </div>
                            </div>
                            
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Description</h3>
                            <p className="text-gray-600 mb-6">{property.description}</p>
                            
                            <h3 className="text-xl font-semibold text-gray-800 mb-3">Property Type</h3>
                            <p className="text-gray-600 mb-6">{property.type}</p>
                            
                            <h3 className="text-xl font-semibold text-gray-800 mb-3">Availability</h3>
                            <div className="flex space-x-6 mb-6">
                                <div>
                                    <span className="block text-gray-600 mb-1">From:</span>
                                    <span className="font-medium">{formatDate(property.availability?.startDate)}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-600 mb-1">To:</span>
                                    <span className="font-medium">{formatDate(property.availability?.endDate)}</span>
                                </div>
                            </div>
                            
                            <h3 className="text-xl font-semibold text-gray-800 mb-3">Contact</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center">
                                    <Phone size={18} className="text-gray-600 mr-2" />
                                    <span>{property.mobile}</span>
                                </div>
                                <div className="flex items-center">
                                    <Mail size={18} className="text-gray-600 mr-2" />
                                    <span>{property.email}</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Amenities */}
                        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">Amenities</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {property.amenities.wifi && (
                                    <div className="flex items-center">
                                        <Wifi size={18} className="text-blue-600 mr-2" />
                                        <span>WiFi</span>
                                    </div>
                                )}
                                {property.amenities.parking && (
                                    <div className="flex items-center">
                                        <Car size={18} className="text-blue-600 mr-2" />
                                        <span>Parking</span>
                                    </div>
                                )}
                                {property.amenities.breakfast && (
                                    <div className="flex items-center">
                                        <Coffee size={18} className="text-blue-600 mr-2" />
                                        <span>Breakfast</span>
                                    </div>
                                )}
                                {property.amenities.airConditioning && (
                                    <div className="flex items-center">
                                        <Wind size={18} className="text-blue-600 mr-2" />
                                        <span>Air Conditioning</span>
                                    </div>
                                )}
                                {property.amenities.heating && (
                                    <div className="flex items-center">
                                        <Thermometer size={18} className="text-blue-600 mr-2" />
                                        <span>Heating</span>
                                    </div>
                                )}
                                {property.amenities.tv && (
                                    <div className="flex items-center">
                                        <Tv size={18} className="text-blue-600 mr-2" />
                                        <span>TV</span>
                                    </div>
                                )}
                                {property.amenities.kitchen && (
                                    <div className="flex items-center">
                                        <ChefHat size={18} className="text-blue-600 mr-2" />
                                        <span>Kitchen</span>
                                    </div>
                                )}
                                {property.amenities.workspace && (
                                    <div className="flex items-center">
                                        <Briefcase size={18} className="text-blue-600 mr-2" />
                                        <span>Workspace</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Reviews */}
                        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">
                            Reviews ({property.reviewCount})
                        </h2>

                        {/* Check if user has already reviewed */}
                        {user && !property.reviews.some((review) => review.userId === user._id) ? (
                            <div className="bg-gray-50 p-4 rounded-lg border mb-6">
                            <h3 className="text-lg font-semibold mb-2 text-gray-700">Leave a Review</h3>
                            {renderInteractiveStars()}
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows={3}
                                placeholder="Write your comment here..."
                                className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm mb-2"
                            ></textarea>
                            {submitError && <p className="text-red-500 text-sm mb-2">{submitError}</p>}
                            <button
                                onClick={handleSubmitReview}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                            >
                                Submit Review
                            </button>
                            </div>
                        ) : (
                            user && (
                            <div className="text-gray-600 mb-4">
                                <p>You have already reviewed this property.</p>
                            </div>
                            )
                        )}

                        {/* Reviews by Others */}
                        {property.reviews && property.reviews.length > 0 ? (
                            <div className="space-y-6">
                            {property.reviews.map((review, index) => (
                                <div key={index} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                    <h4 className="font-semibold">
                                        {review.username || 'Anonymous'}
                                    </h4>
                                    <div className="flex mt-1">
                                        {renderStars(review.rating)}
                                    </div>
                                    </div>
                                    <span className="text-sm text-gray-500">
                                    {formatDate(review.createdAt)}
                                    </span>
                                </div>
                                <p className="text-gray-600 mt-2">{review.comment}</p>
                                </div>
                            ))}
                            </div>
                        ) : (
                            <p className="text-gray-600">No reviews yet.</p>
                        )}
                        </div>

                        {/* Booked Dates */}
                        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">
                            Booked Dates
                        </h2>

                        {property.bookedDates && property.bookedDates.length > 0 ? (
                            <ul className="space-y-4 text-gray-700 text-sm">
                            {property.bookedDates.map((date, index) => (
                                <li key={index} className="flex items-center justify-between py-2 px-4 bg-gray-100 rounded-md shadow-sm">
                                <span className="text-gray-900 font-medium">
                                    {formatDate(date.checkIn)} — {formatDate(date.checkOut)}
                                </span>

                                {/* Show "Unbook" if current user booked this */}
                                {user && date.userId === user._id && (
                                    <button
                                    onClick={() => handleUnbook(date._id)}
                                    className="bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-md hover:bg-red-600 transition duration-200"
                                    >
                                    Unbook
                                    </button>
                                )}
                                </li>
                            ))}
                            </ul>
                        ) : (
                            <p className="text-gray-600 text-lg">This property has not been booked yet.</p>
                        )}
                        </div>

                    </div>

                    
                    {/* Booking Form */}
                    {property?.status === "available" && user?._id !== property?.userID ? (
                    <div className="lg:col-span-1">
                        <div className="bg-white shadow-md rounded-lg p-6 sticky top-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">Book Now</h2>
                            <div className="space-y-4">
                                {/* Check In */}
                                <div>
                                <label className="block text-gray-700 mb-2">Check In</label>
                                <DatePicker
                                    selected={bookingDates.checkIn}
                                    onChange={(date) => setBookingDates({ ...bookingDates, checkIn: date })}
                                    minDate={new Date()} // ✅ Today or future only
                                    maxDate={property.availability?.endDate ? new Date(property.availability.endDate) : null}
                                    excludeDateIntervals={
                                        property.bookedDates?.map(({ checkIn, checkOut }) => ({
                                        start: new Date(checkIn),
                                        end: new Date(checkOut),
                                        })) || []
                                    }
                                    placeholderText="Select check-in date"
                                    className="w-full pl-3 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                </div>

                                {/* Check Out */}
                                <div>
                                <label className="block text-gray-700 mb-2">Check Out</label>
                                <DatePicker
                                    selected={bookingDates.checkOut}
                                    onChange={(date) => setBookingDates({ ...bookingDates, checkOut: date })}
                                    minDate={
                                        bookingDates.checkIn
                                        ? new Date(bookingDates.checkIn.getTime() + 24 * 60 * 60 * 1000)
                                        : new Date()
                                    }
                                    maxDate={property.availability?.endDate ? new Date(property.availability.endDate) : null}
                                    excludeDateIntervals={
                                        property.bookedDates?.map(({ checkIn, checkOut }) => ({
                                        start: new Date(checkIn),
                                        end: new Date(checkOut),
                                        })) || []
                                    }
                                    placeholderText="Select check-out date"
                                    className="w-full pl-3 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                </div>
                                
                                <div>
                                    <label className="block text-gray-700 mb-2">Guests</label>
                                    <div className="relative">
                                        <Users className="absolute top-3 left-3 text-gray-400" size={18} />
                                        <input
                                            type="number"
                                            name="guests"
                                            min="1"
                                            max={property.maxGuests}
                                            value={bookingDates.guests}
                                            onChange={handleInputChange}
                                            className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                
                                <div className="pt-4 border-t border-gray-200">
                                    <div className="flex justify-between mb-2">
                                        <span>Price per night</span>
                                        <span className="font-semibold">${property.price}</span>
                                    </div>
                                    
                                    {bookingDates.checkIn && bookingDates.checkOut && (
                                        <>
                                            <div className="flex justify-between mb-2">
                                                <span>Nights</span>
                                                <span>
                                                    {Math.ceil((new Date(bookingDates.checkOut) - new Date(bookingDates.checkIn)) / (1000 * 60 * 60 * 24))}
                                                </span>
                                            </div>
                                            <div className="flex justify-between font-bold text-lg mb-4 pt-2 border-t border-gray-200">
                                                <span>Total</span>
                                                <span className="text-blue-600">
                                                    ${property.price * Math.ceil((new Date(bookingDates.checkOut) - new Date(bookingDates.checkIn)) / (1000 * 60 * 60 * 24))}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                    
                                    <button
                                        type="button"
                                        onClick={handleBooking}
                                        disabled={!bookingDates.checkIn || !bookingDates.checkOut || property.status !== 'available' || user === null}
                                        className={`w-full py-3 rounded-md text-white font-semibold cursor-pointer ${
                                            property.status === 'available' && bookingDates.checkIn && bookingDates.checkOut && user !== null
                                                ? 'bg-blue-600 hover:bg-blue-700 transition duration-300'
                                                : 'bg-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        {/* {property.status === 'available' ? 'Book Now' : 'Currently Unavailable'} */}
                                        {user !== null ? 'Book Now' : 'Please log in to book'}
                                    </button>
                                    
                                    {/* {property.status !== 'available' && (
                                        <p className="text-red-500 text-sm mt-2 text-center">
                                            This property is currently {property.status}
                                        </p>
                                    )} */}
                                </div>
                            </div>
                        </div>
                    </div>
                    ) : user?._id === property?.userID ? (
                        <p className="text-gray-600 text-sm mt-2 text-center italic">
                          You cannot book your own property.
                        </p>
                      ) : (
                        <p className="text-red-500 text-sm mt-2 text-center">
                          This property is currently {property?.status}
                        </p>
                    )}
                </div>
            </div>
            
            <Footer />
        </div>
    );
};

PropertyImageGallery.propTypes = {
    images: PropTypes.arrayOf(PropTypes.string), // Assuming the images are an array of strings (URLs)
};

export default PropertyDetails;