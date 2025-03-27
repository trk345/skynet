import { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Users, Building } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Home = () => {
  const [searchParams, setSearchParams] = useState({
    location: '',
    checkIn: '',
    checkOut: '',
    guests: 1
  });
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleSearch = () => {
    // Placeholder for search functionality
    console.log('Searching with params:', searchParams);
  };

  const [properties, setProperties] = useState([]);

  useEffect(() => {
    const getProperties = async () => {
      try {
        const response = await axios.get("http://localhost:4000/api/auth/getProperties", { withCredentials: true });
        if (response.data.success) {
          console.log("Fetched Properties:", response.data.data);
          setProperties(response.data.data);
        } else {
          console.log("Failed to fetch properties:", response.data.error)
        }
      } catch (error) {
          console.log("Error fetchng properties:", error);
      }
    }

    getProperties();
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Navbar></Navbar>
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-800">Find Your Perfect Room</h1>
        <p className="text-xl text-gray-600 mb-8">Discover and book rooms effortlessly across various locations</p>
        {/* Search Container */}
        <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Location Input */}
            <div className="relative">
              <MapPin className="absolute top-3 left-3 text-gray-400" size={20} />
              <input
                type="text"
                name="location"
                placeholder="Location"
                value={searchParams.location}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {/* Check-in Date */}
            <div className="relative">
              <Calendar className="absolute top-3 left-3 text-gray-400" size={20} />
              <input
                type="date"
                name="checkIn"
                value={searchParams.checkIn}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {/* Check-out Date */}
            <div className="relative">
              <Calendar className="absolute top-3 left-3 text-gray-400" size={20} />
              <input
                type="date"
                name="checkOut"
                value={searchParams.checkOut}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {/* Guests */}
            <div className="relative">
              <Users className="absolute top-3 left-3 text-gray-400" size={20} />
              <input
                type="number"
                name="guests"
                min="1"
                value={searchParams.guests}
                onChange={handleInputChange}
                placeholder="Guests"
                className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Featured Rooms</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Link key={property._id} to={`/property/${property._id}`}>
              <div className="bg-white shadow-md rounded-lg p-6 text-center hover:shadow-lg transition">
                <div className="flex justify-center">
                  <Building className="text-blue-600 m-3" size={60} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{property.name}</h3>
                <p className="text-gray-600">{property.price}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
      {/* Footer */}
      <Footer></Footer>
    </div>
  );
};
export default Home;
