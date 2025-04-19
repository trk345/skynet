import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import axios from "axios";
import Notifications from "./Notifications";

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isPending] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Fetch user data from backend on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
          withCredentials: true
        });
        if (response.data) {
          setUser(response.data.user);
          setIsLoggedIn(true);
        }
      } catch (error) {
        setUser(null);
        setIsLoggedIn(false);
        console.error("Auth error:", error.response?.data || error.message);
      }
    };
    
    fetchUser();
  }, []);

  // Handle dropdown closing when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      window.addEventListener("click", handleClickOutside);
    }

    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Logout function
  const handleLogout = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {}, { withCredentials: true });
      setUser(null);
      setIsLoggedIn(false);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error.response?.data || error.message);
    }
  };

  return (
    <>
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600">
            <Link to="/">Skynet</Link>
          </div>
          <nav className="space-x-4">
            <Link to="/" className="text-gray-700 hover:text-blue-600">Home</Link>

            {(user?.role === "user" || user?.role === "vendor") && (
            <>
              <Link to="/user-dashboard" className="text-gray-700 hover:text-blue-600 cursor-pointer">Dashboard</Link>
              {user?.role === "vendor" && (
                <Link to="/create-property" className="text-gray-700 hover:text-blue-600 cursor-pointer">Create Property</Link>
              )}
            </>) 
            }
            {!isLoggedIn ? (
              <Link to="/login" className="text-gray-700 hover:text-blue-600">Login</Link>
            ) : (
              <>
              {user?.role === "user" && (
                      isPending || user?.pendingStatus === "pending" ? (
                        <span className="text-gray-400">Processing Request...</span>
                      ) : (
              <Link to="/contact" className="text-gray-700 hover:text-blue-600" >Contact</Link> ) 
              )}
              <div ref={dropdownRef} className="relative inline-block">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-700">Hello, {user?.username || "User"}</span>
                  <Notifications />
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
                    aria-label="Toggle menu"
                  >
                    <Menu className="w-5 h-5 text-gray-700 hover:text-blue-600 cursor-pointer" />
                  </button>
                </div>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-blue-600 cursor-pointer"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
              </>
            )}
          </nav>
        </div>
      </header>

    </>
  );
};

export default Navbar;
