import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Mail, Phone, X, House, UserRound, Save, Upload, Bed, Bath, Square, DollarSign, MapPin } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import axios from "axios";

const EditProperty = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  console.log("ID:", id)
  const [property, setProperty] = useState({
    name: '',
    type: 'standard-room',
    description: '',
    location: '',
    address: '',
    price: '',
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: '',
    maxGuests: 1,
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
      startDate: '',
      endDate: ''
    },
    mobile: '',
    email: '',
    images: []
  });

  const [preview, setPreview] = useState([]);

  useEffect(() => {
    const getProperty = async () => {
      try {
        const response = await axios.get(`http://localhost:4000/api/vendor/getProperty/${id}`, { withCredentials: true});
        if (response.data.success) {
          setProperty(response.data.data)

          // Convert stored images into preview format
          const storedImages = Array.isArray(response.data.data.images) // Check if property had images
          ? response.data.data.images.map((image) => ({
              preview: `http://localhost:4000/${image}`,
              file: image, // No file data for already stored images
              stored: true, // Mark as existing image from DB
              })) 
          : [];
          setPreview(storedImages);

        } else {
          console.error("Error fetching property:", response.data.error)
        }
      } catch (error) {
        console.error("Error fetching property:", error);
      }
    }
    getProperty();
  }, [id])

  // State for tracking validation errors
  const [errors, setErrors] = useState({});

  const propertyTypes = [
    { id: 'standard-room', name: 'Standard Room' },
    { id: 'luxury-room', name: 'Luxury Room' },
    { id: 'business-suite', name: 'Business Suite' },
    { id: 'apartment', name: 'Apartment' },
    { id: 'villa', name: 'Villa' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProperty(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleNumberInput = (event) => {
    const { name, value } = event.target;
  
    // Allow only numbers
    if (/^\d*$/.test(value) || value === "") {
      setProperty((prev) => ({ 
        ...prev, 
        [name]: value === "" ? "" : Number(value)  // Convert to Number
      }));
    }

    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleDecimalInput = (event) => {
    const { name, value } = event.target;
  
    // Allow only numbers (upto 2 d.p.)

    if (/^\d*\.?\d{0,2}$/.test(value) || value === "") {
      setProperty((prev) => ({ 
        ...prev, 
        [name]: value
      }));
    }

    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  

  const handleAmenityChange = (e) => {
    const { name, checked } = e.target;
    setProperty(prev => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [name]: checked
      }
    }));
  };

  const handleAvailabilityChange = (e) => {
    const { name, value } = e.target;
    setProperty(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [name]: value
      }
    }));
  };

  const handleMobileInput = (event) => {
    const { name, value } = event.target;
    // Allow only numbers and +
    if (/^[+]?\d*$/.test(value) || value === "") {
      setProperty((prev) => ({ 
        ...prev, 
        [name]: value
      }
    ));
    }

    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  }

  // Validate the form
  const validateForm = () => {
    const newErrors = {};
    
    // Required field validation
    if (!property.name.trim()) newErrors.name = "Property name is required";
    if (!property.description.trim()) newErrors.description = "Description is required";
    if (!property.location.trim()) newErrors.location = "Location is required";
    if (!property.address.trim()) newErrors.address = "Address is required";
    if (!property.price) newErrors.price = "Price is required";
    // if (property.price && property.price <= 0) newErrors.price = "Valid Price required";
    if (!property.bedrooms) newErrors.bedrooms = "Bedrooms must be at least 1";
    if (!property.bathrooms) newErrors.bathrooms = "This field is required";
    if (!property.maxGuests || property.maxGuests < 1) newErrors.maxGuests = "Max guests must be at least 1";
    if (!property.mobile) newErrors.mobile = "Mobile is required";
    if (property.mobile && !/^\+?[0-9]{10,15}$/.test(property.mobile)) { newErrors.mobile = "Invalid mobile number";}
    if (!property.email) newErrors.email = "Email is required";
    if (property.email && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(property.email)) {
      newErrors.email = "Invalid email address";
    }
    

    // Date validation if dates are provided
    if (property.availability.startDate && property.availability.endDate) {
      const start = new Date(property.availability.startDate);
      const end = new Date(property.availability.endDate);
      if (end < start) {
        newErrors.endDate = "End date cannot be before start date";
      }
    }
    
    return newErrors;
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    // Validate file size (Max 5MB)
    const validSizeFiles = files.filter(file => file.size <= 5 * 1024 * 1024);
    if (validSizeFiles.length !== files.length) {
      alert('Files exceed the 5MB limit.');
      return;
    }

    // Validate file format (Only JPG, PNG, WEBP)
    const validFiles = validSizeFiles.filter(file => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type));
    if (validFiles.length !== files.length) {
      alert('Some files have an invalid format. Please upload JPG, PNG, or WEBP only.');
      return;
    }

    // Convert files to an array of objects with URL previews
    const newImages = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      stored: false // Mark as new upload
    }));

    // Append valid files to state
    setProperty(prevProperty => ({...prevProperty, images: [...prevProperty.images, ...validFiles]}));
    setPreview(prev => [...prev, ...newImages]);

  }

  
  const removeImage = (index, e) => {
    e.preventDefault(); // Prevent default form submission behavior
  
    setPreview((prev) => {
      const updatedPreview = [...prev];
      const removedImage = updatedPreview[index]; // Get the removed image
  
      // // Extract the filename from the full URL (handles both '/' and '\')
      // const filename = removedImage.preview.split(/[/\\]/).pop();
  
      // Check if it's a stored image
      if (removedImage.stored) {
        setProperty((prevProperty) => ({
          ...prevProperty,
          images: prevProperty.images.filter((_, i) => i !== index),
          removedImages: [...(prevProperty.removedImages || []), removedImage.file], // Store removed DB images to later remove from server
        }))
        console.log("Removed Images: ", property.removedImages);
      } else {
        setProperty((prevProperty) => ({
          ...prevProperty,
          images: prevProperty.images.filter((_, i) => i !== index),
        }));
      }
  
      // Remove from the preview list
      updatedPreview.splice(index, 1);
      return updatedPreview;
    });
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const formErrors = validateForm();
    setErrors(formErrors);
    
    // If there are errors, stop submission
    if (Object.keys(formErrors).length > 0) {
      // Scroll to the first error
      const firstErrorField = document.getElementById(Object.keys(formErrors)[0]);
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstErrorField.focus();
      }
      return;
    }
    
    // Form is valid, proceed with submission
    console.log('Submitting Changes:', property);
    const formData = new FormData();

    // Append the form fields to formData
    formData.append("updatedName", property.name);
    formData.append("updatedType", property.type);
    formData.append("updatedDescription", property.description);
    formData.append("updatedLocation", property.location);
    formData.append("updatedAddress", property.address);
    formData.append("updatedPrice", property.price);
    formData.append("updatedBedrooms", property.bedrooms);
    formData.append("updatedBathrooms", property.bathrooms);
    formData.append("updatedSquareFeet", property.squareFeet);
    formData.append("updatedMaxGuests", property.maxGuests);
    formData.append("updatedAmenities", JSON.stringify(property.amenities)); // If you need to store it as a string
    formData.append("updatedAvailability", JSON.stringify(property.availability)); // Same for availability
    formData.append("updatedMobile", property.mobile);
    formData.append("updatedEmail", property.email);

    // Append images to formData
    preview.forEach((image) => {
      if (!image.stored) { // Only append images that aren't already in the DB 
        formData.append("newImages", image.file); // Each image is appended with the key "newImages"
      }
    });

    // Append removed images to formData
    property.removedImages?.forEach((image) => {
      formData.append("removedImages", image); // Each image is appended with the key "removedImages"
    });
  
    // Make the API request to upload
    try {
      const response = await axios.put(`http://localhost:4000/api/vendor/update-property/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });
  
      if (response.status === 200) {
        navigate(`/property/${id}`);
        alert("Property updated successfully");
      }
    } catch (err) {
        alert("Something went wrong, changes were not submitted");
        console.error("Error submitting property:", err);
    }
    
  };

  // Helper function to determine if a field has error
  const hasError = (fieldName) => {
    return errors[fieldName];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">        
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">Edit Property</h1>
          <form onSubmit={handleSubmit} noValidate>
            {/* Basic Information */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 mb-2">
                    Property Name*
                    {hasError('name') && (
                      <span className="text-red-500 ml-1 text-sm">{errors.name}</span>
                    )}
                  </label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={property.name}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      hasError('name') ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter property name"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2">Property Type*</label>
                  <select
                    id="type"
                    name="type"
                    value={property.type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {propertyTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-gray-700 mb-2">
                    Description*
                    {hasError('description') && (
                      <span className="text-red-500 ml-1 text-sm">{errors.description}</span>
                    )}
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={property.description}
                    onChange={handleInputChange}
                    required
                    rows="4"
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      hasError('description') ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Describe your property"
                  ></textarea>
                </div>
              </div>
            </div>
            
            {/* Location */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Location</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 mb-2">
                    City/Area*
                    {hasError('location') && (
                      <span className="text-red-500 ml-1 text-sm">{errors.location}</span>
                    )}
                  </label>
                  <div className="relative">
                    <MapPin className="absolute top-3 left-3 text-gray-400" size={20} />
                    <input
                      id="location"
                      type="text"
                      name="location"
                      value={property.location}
                      onChange={handleInputChange}
                      required
                      className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        hasError('location') ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., New York, Miami"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2">
                    Full Address*
                    {hasError('address') && (
                      <span className="text-red-500 ml-1 text-sm">{errors.address}</span>
                    )}
                  </label>
                  <div className="relative">
                    <House className="absolute top-3 left-3 text-gray-400" size={20} />
                    <input
                        id="address"
                        type="text"
                        name="address"
                        value={property.address}
                        onChange={handleInputChange}
                        required
                        className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        hasError('address') ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Full street address"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Details */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Property Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-gray-700 mb-2">
                    Price per Night*
                    {hasError('price') && (
                      <span className="text-red-500 ml-1 text-sm">{errors.price}</span>
                    )}
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute top-3 left-3 text-gray-400" size={20} />
                    <input
                      id="price"
                      type="text"
                      inputMode="decimal"
                      name="price"
                      value={property.price}
                      onChange={handleDecimalInput}
                      required
                      className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        hasError('price') ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="99.99"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2">
                    Bedrooms*
                    {hasError('bedrooms') && (
                      <span className="text-red-500 ml-1 text-sm">{errors.bedrooms}</span>
                    )}
                  </label>
                  <div className="relative">
                    <Bed className="absolute top-3 left-3 text-gray-400" size={20} />
                    <input
                      id="bedrooms"
                      type="text"
                      name="bedrooms"
                      value={property.bedrooms}
                      onChange={handleNumberInput}
                      required
                      className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        hasError('bedrooms') ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2">
                    Bathrooms*
                    {hasError('bathrooms') && (
                      <span className="text-red-500 ml-1 text-sm">{errors.bathrooms}</span>
                    )}
                  </label>
                  <div className="relative">
                    <Bath className="absolute top-3 left-3 text-gray-400" size={20} />
                    <input
                      id="bathrooms"
                      type="text"
                      name="bathrooms"
                      value={property.bathrooms}
                      onChange={handleNumberInput}
                      required
                      className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        hasError('bathrooms') ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2">Size (sq ft)</label>
                  <div className="relative">
                    <Square className="absolute top-3 left-3 text-gray-400" size={20} />
                    <input
                      id="squareFeet"
                      type="text"
                      name="squareFeet"
                      value={property.squareFeet}
                      onChange={handleNumberInput}
                      className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2">
                    Max Guests*
                    {hasError('maxGuests') && (
                      <span className="text-red-500 ml-1 text-sm">{errors.maxGuests}</span>
                    )}
                  </label>
                  <div className="relative">
                    <UserRound className="absolute top-3 left-3 text-gray-400" size={20} />
                    <input
                        id="maxGuests"
                        type="text"
                        name="maxGuests"
                        value={property.maxGuests}
                        onChange={handleNumberInput}
                        required
                        className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        hasError('maxGuests') ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Amenities */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.keys(property.amenities).map((amenity) => (
                  <div key={amenity} className="flex items-center">
                    <input
                      type="checkbox"
                      id={amenity}
                      name={amenity}
                      checked={property.amenities[amenity]}
                      onChange={handleAmenityChange}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={amenity} className="ml-2 text-gray-700">
                      {amenity.charAt(0).toUpperCase() + amenity.slice(1).replace(/([A-Z])/g, ' $1')}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Availability */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Availability</h2>
              <p className="text-sm text-gray-500 mb-4">
                You can leave this blank, which will specify that the property is available on all dates except dates it is already booked.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 mb-2">Available From</label>
                  <input
                    id="startDate"
                    type="date"
                    name="startDate"
                    value={property.availability?.startDate ? new Date(property.availability.startDate).toISOString().split('T')[0] : ''}
                    max={property.availability?.endDate ? new Date(property.availability.endDate).toISOString().split('T')[0] : ''}
                    onChange={handleAvailabilityChange}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2">
                    Available Until
                    {hasError('endDate') && (
                      <span className="text-red-500 ml-1 text-sm">{errors.endDate}</span>
                    )}
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    name="endDate"
                    value={property.availability?.endDate ? new Date(property.availability.endDate).toISOString().split('T')[0] : ''}
                    min={property.availability?.startDate ? new Date(property.availability.startDate).toISOString().split('T')[0] : ''}
                    onChange={handleAvailabilityChange}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      hasError('endDate') ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Your Contact</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 mb-2">
                    Mobile*
                    {hasError('mobile') && (
                      <span className="text-red-500 ml-1 text-sm">{errors.mobile}</span>
                    )}
                  </label>
                  <div className="relative">
                    <Phone className="absolute top-3 left-3 text-gray-400" size={20} />
                    <input
                      id="mobile"
                      type="text"
                      name="mobile"
                      value={property.mobile}
                      onChange={handleMobileInput}
                      required
                      className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        hasError('mobile') ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g. +880 1234567899"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2">
                    Email*
                    {hasError('email') && (
                      <span className="text-red-500 ml-1 text-sm">{errors.email}</span>
                    )}
                  </label>
                  <div className="relative">
                    <Mail className="absolute top-3 left-3 text-gray-400" size={20} />
                    <input
                      id="email"
                      type="text"
                      name="email"
                      value={property.email}
                      onChange={handleInputChange}
                      required
                      className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        hasError('email') ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Images Upload */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Property Images</h2>
              <div className="border-dashed border-2 border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600 mb-2">Drag and drop your images here, or click to browse</p>
                <p className="text-sm text-gray-500 mb-4">Supported formats: JPG, PNG, WEBP (Max 5MB each)</p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  id="property-images"
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="property-images"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-300 cursor-pointer"
                >
                  Select Images
                </label>
              </div>
            </div>
          
          {/* Preview of Selected Images */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {preview.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image.preview}
                  alt={`preview-${index}`}
                  className="mb-2 w-full h-32 sm:h-40 md:h-48 object-cover bg-gray-100 rounded-md border"
                />
                <button
                  type="button"
                  onClick={(e) => removeImage(index, e)}
                  className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-80 hover:opacity-100 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
                
            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-300 flex items-center cursor-pointer"
              >
                <Save className="mr-2" size={20} />
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default EditProperty;