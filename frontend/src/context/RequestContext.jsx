import { createContext, useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types"; // ✅ Import PropTypes
import axios from "axios";

// Create the context
export const RequestContext = createContext();

export const RequestProvider = ({ children }) => {
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/admin/getVendorRequests`,
          {
            withCredentials: true
          }
        );

        if (response.data.success) {
          setRequestCount(response.data.data.length); // Assuming response.data.data is an array
        } else {
          console.error("Failed to fetch vendor requests:", response.data.error);
        }
      } catch (error) {
        console.error("Error fetching vendor requests:", error);
      }
    };

    fetchRequests();
  }, []); // Runs once when the component mounts

  // ✅ Use useMemo to optimize context value
  const contextValue = useMemo(() => ({ requestCount, setRequestCount }), [requestCount]);

  return (
    <RequestContext.Provider value={contextValue}>
      {children}
    </RequestContext.Provider>
  );
};

// ✅ Add prop validation
RequestProvider.propTypes = {
  children: PropTypes.node.isRequired,
};