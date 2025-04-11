import { useState, useEffect } from 'react';
import { Send, Building, Mail, Phone, MessageSquare, User } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Contact = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState('welcome'); // 'welcome' or 'contact'
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    countryCode: "+880",
    mobile: '',
    message: ''
  });

  useEffect(() => {
    // Animation effect on load
    setTimeout(() => {
      setIsLoaded(true);
    }, 300);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const payload = {
      ...formData,
      mobile: `${formData.countryCode}${formData.mobile}`, // Combine for backend
    };
  
    try {
      const response = await axios.post(
        "http://localhost:4000/api/user/postVendorRequest",
        payload,
        { withCredentials: true }
      );
      if (response.data.success) {
        console.log("Successfully Request", response.data.data);
      } else {
        console.log("Failed Request", response.data.error)
      }
      console.log('Form submitted:', payload);
  
      // Reset form after submission
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
        message: '',
        countryCode: '+880' // Reset to default or empty if you prefer
      });
  
      navigate('/');
    } catch (error) {
      console.error("Submission error:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Navbar />
      
      <main className="container mx-auto px-4 py-16">
        {/* Section Navigation */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-full shadow-md p-1 inline-flex">
            <button 
              onClick={() => setActiveSection('welcome')}
              className={`px-8 py-3 rounded-full text-lg font-medium transition-all duration-300 cursor-pointer ${
                activeSection === 'welcome' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-transparent text-gray-600 hover:bg-gray-100'
              }`}
            >
              Welcome
            </button>
            <button 
              onClick={() => setActiveSection('contact')}
              className={`px-8 py-3 rounded-full text-lg font-medium transition-all duration-300 cursor-pointer ${
                activeSection === 'contact' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-transparent text-gray-600 hover:bg-gray-100'
              }`}
            >
              Contact Us
            </button>
          </div>
        </div>
        
        {/* Welcome Section */}
        <div 
          className={`transform transition-all duration-700 ${
            isLoaded && activeSection === 'welcome' 
              ? 'translate-y-0 opacity-100 block' 
              : activeSection === 'welcome' 
                ? 'translate-y-10 opacity-0 block' 
                : 'hidden'
          }`}
        >
          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold mb-6 text-gray-800 tracking-tight">
              Welcome to <span className="text-blue-600">Skynet</span>
            </h1>
            <div className="w-24 h-1 bg-blue-600 mx-auto mb-8 rounded-full"></div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Your gateway to exceptional accommodations worldwide
            </p>
          </div>
          
          <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Left side: Image */}
              <div className="bg-blue-600 p-12 flex items-center justify-center">
                <div className="text-white">
                  <Building className="w-32 h-32 mx-auto mb-8 opacity-90" />
                  <h2 className="text-3xl font-bold mb-6 text-center">Premium Accommodations</h2>
                  <p className="text-lg opacity-90 leading-relaxed">
                    Skynet offers access to the finest accommodations across the globe. From luxury suites to cozy boutique hotels, we ensure every stay exceeds expectations.
                  </p>
                </div>
              </div>
              
              {/* Right side: Content */}
              <div className="p-12">
                <div className="prose max-w-none">
                  <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                    Skynet is a premier room booking platform connecting discerning travelers with exceptional accommodations worldwide. We prioritize quality, convenience, and personalized service to ensure your stay is nothing short of perfect.
                  </p>
                  
                  <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                    Whether you&apos;re a business traveler seeking functional workspace or a vacationer in pursuit of luxury, our curated selection offers options to match every preference and requirement.
                  </p>
                  
                  <div className="mt-12">
                    <h2 className="text-3xl font-bold mb-6 text-gray-800">Join Our Network</h2>
                    <p className="text-lg text-gray-700 mb-8">
                      Are you a property owner looking to partner with an exclusive platform? Join our network of elite accommodation providers and expand your reach.
                    </p>
                    
                    <button 
                      onClick={() => {
                        setActiveSection('contact');
                        setTimeout(() => setShowVendorForm(true), 300);
                      }}
                      className="bg-blue-600 text-white py-4 px-8 rounded-full hover:bg-blue-700 transition duration-300 flex items-center text-lg font-medium shadow-lg hover:shadow-xl cursor-pointer"
                    >
                      <Building className="mr-3" size={22} />
                      Become a Vendor
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Contact Section */}
        <div 
          className={`transform transition-all duration-700 ${
            isLoaded && activeSection === 'contact' 
              ? 'translate-y-0 opacity-100 block' 
              : activeSection === 'contact' 
                ? 'translate-y-10 opacity-0 block' 
                : 'hidden'
          }`}
        >
          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold mb-6 text-gray-800 tracking-tight">Get In Touch</h1>
            <div className="w-24 h-1 bg-blue-600 mx-auto mb-8 rounded-full"></div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Have questions or want to join our network? We&apos;d love to hear from you.
            </p>
          </div>
          
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Contact Information */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-xl p-10 h-full">
                  <h2 className="text-2xl font-bold mb-8 text-gray-800">Contact Information</h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-start">
                      <div className="bg-blue-100 p-3 rounded-full mr-4">
                        <Mail className="text-blue-600" size={22} />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-800">Email</h3>
                        <p className="text-gray-600 mt-1">info@skynet.com</p>
                        <p className="text-gray-600">support@skynet.com</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="bg-blue-100 p-3 rounded-full mr-4">
                        <Phone className="text-blue-600" size={22} />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-800">Phone</h3>
                        <p className="text-gray-600 mt-1">+880 22897123894</p>
                        <p className="text-gray-600">+880 11223344556</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="bg-blue-100 p-3 rounded-full mr-4">
                        <Building className="text-blue-600" size={22} />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-800">Office</h3>
                        <p className="text-gray-600 mt-1">123 Skynet Tower</p>
                        <p className="text-gray-600">Pluto, Milky Way 9999</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-12">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">Follow Us</h3>
                    <div className="flex space-x-4">
                      {['facebook', 'twitter', 'instagram', 'linkedin'].map(social => (
                        <a 
                          key={social} 
                          href={`#${social}`} 
                          className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors duration-300"
                        >
                          <span className="capitalize">{social.charAt(0)}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Contact Form */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-xl p-10">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-gray-800">
                      {/* {showVendorForm ? 'Vendor Application' : 'Send a Message'} */}
                    </h2>
                    
                    {activeSection === 'contact' && (
                      <button 
                        onClick={() => setShowVendorForm(!showVendorForm)}
                        className="text-blue-600 hover:text-blue-800 transition-colors duration-300 flex items-center"
                      >
                        {/* <span>{showVendorForm ? 'Send a general message instead' : 'Apply as a vendor'}</span> */}
                      </button>
                    )}
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="John"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Doe"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="john.doe@example.com"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-5 w-5 text-gray-400" />
                          </div>
                          <div className="flex">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Phone className="h-5 w-5 text-gray-400" />
                            </div>
                            <select
                              name="countryCode"
                              value={formData.countryCode}
                              onChange={handleInputChange}
                              className="pl-10 pr-3 py-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700"
                              required
                            >
                              <option value="+1">+1 (US)</option>
                              <option value="+44">+44 (UK)</option>
                              <option value="+61">+61 (AU)</option>
                              <option value="+91">+91 (IN)</option>
                              <option value="+880">+880 (BD)</option>
                              <option value="+971">+971 (UAE)</option>
                              {/* Add more countries as needed */}
                            </select>
                            <input
                              type="tel"
                              id="mobile"
                              name="mobile"
                              value={formData.mobile}
                              onChange={handleInputChange}
                              className="w-full pl-4 pr-3 py-3 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="1234567890"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                      <div className="relative">
                        <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                          <MessageSquare className="h-5 w-5 text-gray-400" />
                        </div>
                        <textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          rows="5"
                          className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        //   placeholder={showVendorForm ? "Tell us about your property and business..." : "How can we help you?"}
                          placeholder={"Tell us about your property and business..."}
                          required
                        ></textarea>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="bg-blue-600 text-white py-4 px-10 rounded-full hover:bg-blue-700 transition duration-300 flex items-center text-lg font-medium shadow-lg hover:shadow-xl cursor-pointer"
                      >
                        <Send className="mr-2" size={20} />
                        {/* {showVendorForm ? 'Submit Application' : 'Send Message'} */}
                        Submit Application
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Contact;