import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from 'axios';
import { X, ChevronLeft, ChevronRight, Maximize2, MapPin, Calendar, Users, Wifi, Car, Coffee, Wind, Thermometer, Tv, ChefHat, Briefcase, Star, Phone, Mail } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';


function PropertyImageGallery({ images }) {
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
                    src={`http://localhost:4000/${images[currentImageIndex]}`} 
                    alt={`Property image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300"
                />

                {/* Navigation Arrows */}
                {images.length > 1 && (
                    <>  
                    {currentImageIndex > 0 && (
                        <button 
                            onClick={handlePrev}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/70 cursor-pointer hover:bg-white/90 p-2 rounded-full shadow-md transition-all duration-300 opacity-0 group-hover:opacity-100"
                        >
                            <ChevronLeft className="text-gray-800" />
                        </button>
                    )}
                    
                    {currentImageIndex < (images.length -1) && (
                        <button 
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
                                src={`http://localhost:4000/${image}`} 
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
            >
                <div 
                    className="relative w-[90%] h-[90%] max-w-[1200px] flex items-center justify-center"
                    onClick={(e) => e.stopPropagation()}
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
                            src={`http://localhost:4000/${images[currentImageIndex]}`} 
                            alt={`Full screen image ${currentImageIndex + 1}`}
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
  const [bookingDates, setBookingDates] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1
  });

  useEffect(() => {
    const getProperty = async() => {
        try {
            setLoading(true);
            const response = await axios.get(`http://localhost:4000/api/auth/getProperty/${id}`, { withCredentials: true });
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

    const handleBooking = () => {
        console.log('Booking with details:', bookingDates);
        // Add booking functionality here
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
                                            {property.averageRating.toFixed(1)} ({property.reviewCount} reviews)
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
                                    <div className="text-lg font-bold text-gray-800">{property.squareFeet || 'N/A'}</div>
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
                            
                            {property.reviews && property.reviews.length > 0 ? (
                                <div className="space-y-6">
                                    {property.reviews.map((review, index) => (
                                        <div key={index} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-semibold">
                                                        {review.user?.name || 'Anonymous'}
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
                    </div>
                    
                    {/* Booking Form */}
                    {property.status === "available" ? (
                    <div className="lg:col-span-1">
                        <div className="bg-white shadow-md rounded-lg p-6 sticky top-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">Book Now</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-gray-700 mb-2">Check In</label>
                                    <div className="relative">
                                        <Calendar className="absolute top-3 left-3 text-gray-400" size={18} />
                                        <input
                                            type="date"
                                            name="checkIn"
                                            value={bookingDates.checkIn}
                                            onChange={handleInputChange}
                                            min={property.availability?.startDate ? new Date(property.availability.startDate).toISOString().split('T')[0] : ''}
                                            max={property.availability?.endDate ? new Date(property.availability.endDate).toISOString().split('T')[0] : ''}
                                            className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-gray-700 mb-2">Check Out</label>
                                    <div className="relative">
                                        <Calendar className="absolute top-3 left-3 text-gray-400" size={18} />
                                        <input
                                            type="date"
                                            name="checkOut"
                                            value={bookingDates.checkOut}
                                            onChange={handleInputChange}
                                            min={bookingDates.checkIn || (property.availability?.startDate ? new Date(property.availability.startDate).toISOString().split('T')[0] : '')}
                                            max={property.availability?.endDate ? new Date(property.availability.endDate).toISOString().split('T')[0] : ''}
                                            className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
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
                                        disabled={!bookingDates.checkIn || !bookingDates.checkOut || property.status !== 'available'}
                                        className={`w-full py-3 rounded-md text-white font-semibold ${
                                            property.status === 'available' && bookingDates.checkIn && bookingDates.checkOut
                                                ? 'bg-blue-600 hover:bg-blue-700 transition duration-300'
                                                : 'bg-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        {/* {property.status === 'available' ? 'Book Now' : 'Currently Unavailable'} */}
                                        Book Now
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
                    ) : (
                    <p className="text-red-500 text-sm mt-2 text-center">
                    This property is currently {property.status}
                    </p>)}
                </div>
            </div>
            
            <Footer />
        </div>
    );
};

export default PropertyDetails;