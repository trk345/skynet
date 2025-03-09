import { useState, useEffect, useContext } from "react";
import { Users, Check, X, Eye } from "lucide-react";
import SideBar from "../components/adminSideBar.jsx";
import TopBar from "../components/adminTopbar.jsx";
import axios from "axios";
import { RequestContext } from "../context/RequestContext"; // Import context

const VendorRequestPage = () => {
  const [requests, setRequests] = useState([]);
  const { setRequestCount } = useContext(RequestContext); // Get global state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await axios.get("http://localhost:4000/api/admin/getVendorRequests", {
          withCredentials: true, // Enable credentials
        });
        console.log("Fetched vendor requests:", response.data);
  
        setRequests(response.data.data);
        setRequestCount(response.data.data.length);
      } catch (error) {
        console.error("Error fetching requests:", error);
      }
    };
  
    fetchRequests();
  }, [setRequestCount]);

  const getRoleClass = (role) => {
    if (role === "Admin") return "bg-red-100 text-red-800";
    if (role === "Vendor") return "bg-blue-100 text-blue-800";
    return "bg-green-100 text-green-800";
  };

  const handleAction = async (requestId, action) => {
    try {
      const response = await axios.put(
        "http://localhost:4000/api/admin/updateVendorRequest",
        { requestId, action },
        { withCredentials: true } // Enable credentials
      );
  
      if (response.status === 200) {
        setRequests((prevRequests) => prevRequests.filter((req) => req._id !== requestId));
        setRequestCount((prevCount) => Math.max(prevCount - 1, 0));
        setShowDetailsModal(false);
      }
    } catch (error) {
      console.error("Error updating request:", error);
    }
  };

  const openDetailsModal = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <SideBar />
      <div className="flex-1 overflow-auto">
        {/* Top Bar */}
        <TopBar />
        {/* Main Content */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <Users className="mr-3" size={24} /> Requests
            </h1>
          </div>
          <div className="bg-white rounded-lg shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request</th> */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request._id}>
                    <td className="px-6 py-4">{request.requesterID.username}</td>
                    <td className="px-6 py-4">{request.requesterID.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${getRoleClass(request.requesterID.role)}`}>
                        {request.requesterID.role}
                      </span>
                    </td>
                    {/* <td className="px-6 py-4">{request.message}</td> */}
                    <td className="px-6 py-4 flex justify-center">
                      <button
                        className="flex items-center justify-center px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors cursor-pointer"
                        onClick={() => openDetailsModal(request)}
                      >
                        View Details <Eye size={16} className="ml-2" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

       {/* Details Modal - Now with transparent backdrop */}
       {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <h3 className="text-lg font-semibold text-gray-800">Request Details</h3>
            </div>
            
            {/* Content */}
            <div className="p-6 bg-white">
              <div className="space-y-6">
                {/* Name row */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-600 mb-1">First Name</label>
                    <p className="text-gray-900 font-medium">{selectedRequest.firstName || "N/A"}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Last Name</label>
                    <p className="text-gray-900 font-medium">{selectedRequest.lastName || "N/A"}</p>
                  </div>
                </div>
                
                {/* Contact info */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                    <p className="text-gray-900 font-medium">{selectedRequest.email}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Mobile</label>
                    <p className="text-gray-900 font-medium">{selectedRequest.mobile || "N/A"}</p>
                  </div>
                </div>
                
                {/* Message */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Message</label>
                  <div className="bg-white p-3 rounded border border-gray-200 max-h-32 overflow-y-auto">
                    <p className="text-gray-800 whitespace-pre-line">{selectedRequest.message}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer actions */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors font-medium cursor-pointer"
                onClick={() => setShowDetailsModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center font-medium cursor-pointer"
                onClick={() => handleAction(selectedRequest._id, "reject")}
              >
                <X size={16} className="mr-1" /> Decline
              </button>
              <button
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center font-medium cursor-pointer"
                onClick={() => handleAction(selectedRequest._id, "approve")}
              >
                <Check size={16} className="mr-1" /> Accept
              </button>
            </div>
          </div>
        </div>
      )}      
    </div>
  );
};



export default VendorRequestPage;
