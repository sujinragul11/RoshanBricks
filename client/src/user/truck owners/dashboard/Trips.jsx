import React, { useState, useEffect } from "react";
import { MapPin, Truck, RefreshCw, AlertCircle } from "lucide-react";

const API_BASE_URL = 'http://localhost:7700/api'

export default function Trips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Get headers for API calls
  const getHeaders = () => {
    const user = JSON.parse(localStorage.getItem('rt_user'));
    const headers = {
      'Content-Type': 'application/json',
    };
    
    headers['X-Employee-Id'] = (user?.employeeId || user?.id || '1').toString();
    headers['X-User-Roles'] = user?.role || 'Truck Owner';
    
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  // Fetch trips data from API
  const fetchTrips = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching trips data...');

      // Try multiple endpoints to get trips data
      const endpoints = [
        `${API_BASE_URL}/truck-owners/trips`,
        `${API_BASE_URL}/truck-owners/orders?status=IN_PROGRESS,RUNNING,ASSIGNED,COMPLETED`,
        `${API_BASE_URL}/trips`,
        `${API_BASE_URL}/orders?driverId=all&status=IN_PROGRESS,RUNNING,ASSIGNED,COMPLETED`
      ];

      let response = null;
      let data = null;

      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          response = await fetch(endpoint, {
            headers: getHeaders()
          });
          
          if (response.ok) {
            data = await response.json();
            console.log(`Success with endpoint: ${endpoint}`, data);
            
            if (data && (data.data || Array.isArray(data))) {
              const tripsData = data.data || data;
              if (tripsData.length > 0) {
                await processTripsData(tripsData);
                return;
              }
            }
          }
        } catch (err) {
          console.log(`Endpoint ${endpoint} failed:`, err.message);
          continue;
        }
      }

      // If no data found from any endpoint
      setTrips([]);
      
    } catch (err) {
      console.error('Error fetching trips:', err);
      setError(`Failed to load trips: ${err.message}`);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }

  // Process and format trips data
  const processTripsData = async (tripsData) => {
    try {
      console.log('Processing trips data:', tripsData);

      // Format trips based on the data structure
      const formattedTrips = tripsData.map(trip => {
        // Handle both trip and order data structures
        const isTrip = trip.hasOwnProperty('fromLocation');
        const isOrder = trip.hasOwnProperty('deliveryAddress');

        if (isTrip) {
          // Trip data structure
          return {
            id: trip.id,
            truckNo: trip.truck?.truckNo || trip.truckNumber || 'N/A',
            driver: trip.driver?.name || trip.driverName || 'Driver',
            from: trip.fromLocation,
            to: trip.toLocation,
            status: mapTripStatus(trip.status),
            startTime: formatDate(trip.startDate || trip.createdAt || trip.assignedDate),
            estimatedArrival: formatDate(trip.estimatedDeliveryDate || trip.estimatedArrival),
            cargo: trip.cargo || 'General Cargo',
            agent: trip.agent || trip.customerName || 'Customer',
            podUploaded: trip.podUploaded || false,
            originalData: trip
          };
        } else if (isOrder) {
          // Order data structure
          return {
            id: trip.id,
            truckNo: trip.truck?.truckNo || trip.truckNumber || 'Assigned',
            driver: trip.driver?.name || trip.driverName || 'Driver',
            from: trip.manufacturer?.location || trip.pickupLocation || 'Warehouse',
            to: trip.deliveryAddress,
            status: mapOrderStatus(trip.status),
            startTime: formatDate(trip.orderDate || trip.assignedDate),
            estimatedArrival: formatDate(trip.estimatedDeliveryDate),
            cargo: trip.items?.map(item => 
              item.product?.name || item.manufacturerProduct?.name || 'Product'
            ).join(', ') || 'General Cargo',
            agent: trip.customerName || 'Customer',
            podUploaded: trip.podUploaded || false,
            originalData: trip
          };
        } else {
          // Fallback for unknown data structure
          return {
            id: trip.id,
            truckNo: trip.truckNo || 'N/A',
            driver: trip.driver || 'Driver',
            from: trip.from || 'Location',
            to: trip.to || 'Destination',
            status: mapTripStatus(trip.status),
            startTime: formatDate(trip.startTime),
            estimatedArrival: formatDate(trip.estimatedArrival),
            cargo: trip.cargo || 'Cargo',
            agent: trip.agent || 'Agent',
            podUploaded: trip.podUploaded || false,
            originalData: trip
          };
        }
      });

      console.log('Formatted trips:', formattedTrips);
      setTrips(formattedTrips);

    } catch (err) {
      console.error('Error processing trips data:', err);
      throw new Error('Failed to process trips data');
    }
  }

  // Map trip status to display format
  const mapTripStatus = (status) => {
    const statusMap = {
      'RUNNING': 'Running',
      'IN_PROGRESS': 'Running',
      'ASSIGNED': 'Upcoming',
      'UPCOMING': 'Upcoming',
      'COMPLETED': 'Completed',
      'CANCELLED': 'Cancelled'
    };
    return statusMap[status] || status || 'Upcoming';
  }

  // Map order status to trip status
  const mapOrderStatus = (status) => {
    const statusMap = {
      'IN_PROGRESS': 'Running',
      'RUNNING': 'Running',
      'ASSIGNED': 'Upcoming',
      'CONFIRMED': 'Upcoming',
      'PENDING': 'Upcoming',
      'COMPLETED': 'Completed',
      'CANCELLED': 'Cancelled'
    };
    return statusMap[status] || status || 'Upcoming';
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  }

  useEffect(() => {
    fetchTrips();
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F08344] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trips data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <div className="w-1 h-8 bg-[#F08344] rounded-full"></div>
            Trips Management
          </h2>
          <button
            onClick={fetchTrips}
            className="flex items-center gap-2 bg-[#F08344] text-white px-4 py-2 rounded-lg hover:bg-[#e67533] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
            <button
              onClick={fetchTrips}
              className="ml-auto text-red-700 hover:text-red-900 font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Trips Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          {trips.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Truck className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No trips available.</p>
                <p className="text-gray-400 text-sm">Trips will appear here when assigned to your trucks.</p>
                <button
                  onClick={fetchTrips}
                  className="mt-2 text-[#F08344] hover:text-[#e67533] font-medium"
                >
                  Check for new trips
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-[#F08344] to-[#e67533]">
                    <th className="text-left px-6 py-4 text-white font-semibold text-sm uppercase tracking-wider">
                      Driver
                    </th>
                    <th className="text-left px-6 py-4 text-white font-semibold text-sm uppercase tracking-wider">
                      Truck No
                    </th>
                    <th className="text-center px-6 py-4 text-white font-semibold text-sm uppercase tracking-wider">
                      Route
                    </th>
                    <th className="text-left px-6 py-4 text-white font-semibold text-sm uppercase tracking-wider">
                      Cargo
                    </th>
                    <th className="text-left px-6 py-4 text-white font-semibold text-sm uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="text-left px-6 py-4 text-white font-semibold text-sm uppercase tracking-wider">
                      Start Time
                    </th>
                    <th className="text-left px-6 py-4 text-white font-semibold text-sm uppercase tracking-wider">
                      Est. Arrival
                    </th>
                    <th className="text-left px-6 py-4 text-white font-semibold text-sm uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {trips.map((trip) => (
                    <tr 
                      key={trip.id} 
                      className="hover:bg-gradient-to-r hover:from-orange-50 hover:to-transparent transition-all duration-200 group"
                    >
                      <td className="px-6 py-4 font-semibold text-gray-800 group-hover:text-[#F08344] transition-colors">
                        {trip.driver}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm bg-gray-100 px-3 py-1 rounded-md text-gray-700 group-hover:bg-orange-100 transition-colors">
                          {trip.truckNo}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700">{trip.from}</span>
                          <div className="flex items-center">
                            <div className="w-8 h-0.5 bg-gray-300"></div>
                            <MapPin className="w-4 h-4 mx-1 text-[#F08344] animate-pulse" />
                            <div className="w-8 h-0.5 bg-gray-300"></div>
                          </div>
                          <span className="font-medium text-gray-700">{trip.to}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 max-w-xs truncate block" title={trip.cargo}>
                          {trip.cargo}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-700">{trip.agent}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{trip.startTime}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{trip.estimatedArrival}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm ${
                            trip.status === "Running"
                              ? "bg-gradient-to-r from-green-400 to-green-500 text-white"
                              : trip.status === "Completed"
                              ? "bg-gradient-to-r from-gray-400 to-gray-500 text-white"
                              : trip.status === "Cancelled"
                              ? "bg-gradient-to-r from-red-400 to-red-500 text-white"
                              : "bg-gradient-to-r from-blue-400 to-blue-500 text-white"
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full mr-2 ${
                            trip.status === "Running" ? "bg-white animate-pulse" : "bg-white"
                          }`}></span>
                          {trip.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {trips.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow border border-gray-200">
              <div className="text-sm text-gray-600">Total Trips</div>
              <div className="text-2xl font-bold text-gray-800">{trips.length}</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow border border-gray-200">
              <div className="text-sm text-gray-600">Running</div>
              <div className="text-2xl font-bold text-green-600">
                {trips.filter(trip => trip.status === 'Running').length}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow border border-gray-200">
              <div className="text-sm text-gray-600">Upcoming</div>
              <div className="text-2xl font-bold text-blue-600">
                {trips.filter(trip => trip.status === 'Upcoming').length}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow border border-gray-200">
              <div className="text-sm text-gray-600">Completed</div>
              <div className="text-2xl font-bold text-gray-600">
                {trips.filter(trip => trip.status === 'Completed').length}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}