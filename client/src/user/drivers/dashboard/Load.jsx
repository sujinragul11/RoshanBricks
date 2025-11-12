import React, { useState, useEffect } from 'react'
import { Card } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { Truck, MapPin, Calendar, Package, DollarSign, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

const API_BASE_URL = 'http://localhost:7700/api'

export default function Load() {
  const [assignedTrips, setAssignedTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Get headers for API calls
  const getHeaders = () => {
    const user = JSON.parse(localStorage.getItem('rt_user'));
    const headers = {
      'Content-Type': 'application/json',
    };
    
    headers['X-Employee-Id'] = (user?.employeeId || user?.id || '1').toString();
    headers['X-User-Roles'] = 'DRIVER';
    
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  // Helper function to map order status to trip status
  const mapOrderStatusToTripStatus = (orderStatus) => {
    const statusMap = {
      'PENDING': 'ASSIGNED',
      'CONFIRMED': 'ASSIGNED', 
      'IN_PROGRESS': 'RUNNING',
      'ASSIGNED': 'ASSIGNED',
      'RUNNING': 'RUNNING',
      'COMPLETED': 'COMPLETED',
      'CANCELLED': 'CANCELLED'
    };
    return statusMap[orderStatus] || 'ASSIGNED';
  }

  // Helper function to map trip status back to order status
  const mapTripStatusToOrderStatus = (tripStatus) => {
    const statusMap = {
      'ASSIGNED': 'IN_PROGRESS',
      'RUNNING': 'IN_PROGRESS',
      'COMPLETED': 'COMPLETED'
    };
    return statusMap[tripStatus] || tripStatus;
  }

  // Fetch assigned trips for driver
  const fetchAssignedTrips = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching driver trips...');
      
      const user = JSON.parse(localStorage.getItem('rt_user'));
      
      // Get the actual driver/employee ID
      let driverId = user?.employeeId || user?.id;
      
      // Normalize driver ID
      if (driverId && typeof driverId === 'string' && driverId.startsWith('user-')) {
        const numericId = driverId.replace('user-', '');
        driverId = !isNaN(numericId) ? parseInt(numericId) : 1;
      }
      
      console.log('Using driver ID:', driverId);

      // Try multiple endpoints - prioritize the working orders endpoint
      const endpoints = [
        `${API_BASE_URL}/orders?driverId=${driverId}&status=IN_PROGRESS,ASSIGNED,RUNNING,CONFIRMED`,
        `${API_BASE_URL}/orders?driverId=${driverId}`,
        `${API_BASE_URL}/drivers/${driverId}/orders`,
        `${API_BASE_URL}/drivers/${driverId}/trips`,
        `${API_BASE_URL}/trips?driverId=${driverId}`
      ];
      
      let response = null;
      let data = null;
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          response = await fetch(endpoint, {
            headers: getHeaders()
          });
          
          console.log(`Response status for ${endpoint}:`, response.status);
          
          if (response.ok) {
            data = await response.json();
            console.log(`Success with endpoint: ${endpoint}`, data);
            
            // Handle different response formats
            let tripsData = null;
            
            if (data && data.success && data.data) {
              // Format: { success: true, data: [...] }
              tripsData = data.data;
            } else if (Array.isArray(data)) {
              // Format: [...]
              tripsData = data;
            } else if (data && Array.isArray(data.data)) {
              // Format: { data: [...] }
              tripsData = data.data;
            }
            
            if (tripsData && tripsData.length > 0) {
              console.log(`Found ${tripsData.length} trips from ${endpoint}`);
              
              // Convert orders to trip format for display
              const formattedTrips = tripsData.map(order => ({
                id: order.id,
                orderId: order.id,
                fromLocation: order.manufacturer?.location || order.pickupLocation || 'Warehouse',
                toLocation: order.deliveryAddress,
                status: mapOrderStatusToTripStatus(order.status),
                cargo: order.items?.map(item => 
                  item.product?.name || item.manufacturerProduct?.name || 'Product'
                ).join(', ') || 'General Cargo',
                customerName: order.customerName,
                deliveryAddress: order.deliveryAddress,
                specialInstructions: order.specialInstructions || order.deliveryInstructions || '',
                estimatedDeliveryDate: order.estimatedDeliveryDate,
                // Include truck and driver info if available
                truck: order.truck || { truckNo: order.truckNumber || order.truckId || 'Assigned Truck' },
                driver: order.driver || { name: order.driverName || 'Driver' },
                originalOrder: order // Keep the original order data for reference
              }));
              
              console.log('Formatted trips:', formattedTrips);
              setAssignedTrips(formattedTrips);
              return;
            }
          } else {
            console.log(`Endpoint ${endpoint} failed with status: ${response.status}`);
          }
        } catch (err) {
          console.log(`Endpoint ${endpoint} error:`, err.message);
          continue;
        }
      }

      // If we get here, no endpoints returned valid trip data
      console.log('No trip data found from any endpoint');
      setAssignedTrips([]);
      
    } catch (err) {
      console.error('Error fetching trips:', err);
      setError(`Failed to load trips: ${err.message}`);
      setAssignedTrips([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAssignedTrips();
  }, []);

  const updateTripStatus = async (tripId, newStatus) => {
    try {
      console.log(`Updating trip ${tripId} to ${newStatus}`);
      
      const user = JSON.parse(localStorage.getItem('rt_user'));
      const driverId = user?.employeeId || user?.id;
      
      // Map trip status to order status
      const orderStatus = mapTripStatusToOrderStatus(newStatus);
      
      // Prepare update data
      const updateData = { 
        status: orderStatus
      };
      
      // Add completion date if marking as completed
      if (newStatus === 'COMPLETED') {
        updateData.actualDeliveryDate = new Date().toISOString();
        updateData.completedDate = new Date().toISOString();
      }
      
      // Try multiple endpoints for status update
      const endpoints = [
        `${API_BASE_URL}/orders/${tripId}/status`,
        `${API_BASE_URL}/drivers/orders/${tripId}/status`,
        `${API_BASE_URL}/truck-owners/orders/${tripId}/status`,
        `${API_BASE_URL}/orders/${tripId}`,
        `${API_BASE_URL}/drivers/trips/${tripId}/status`,
        `${API_BASE_URL}/trips/${tripId}/status`
      ];
      
      let response = null;
      let success = false;
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying status update endpoint: ${endpoint}`);
          
          // Determine method based on endpoint
          const method = endpoint.includes('/status') ? 'PUT' : 'PATCH';
          
          response = await fetch(endpoint, {
            method: method,
            headers: getHeaders(),
            body: JSON.stringify(updateData)
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success || response.status === 200) {
              console.log(`Status updated successfully via ${endpoint}`);
              success = true;
              break;
            }
          }
          console.log(`Endpoint ${endpoint} failed with status: ${response.status}`);
        } catch (err) {
          console.log(`Endpoint ${endpoint} error:`, err.message);
          continue;
        }
      }

      if (!success) {
        const errorText = await response?.text();
        console.error('Status update failed:', errorText);
        throw new Error('Failed to update status through all endpoints');
      }

      // Update local state immediately for better UX
      setAssignedTrips(trips =>
        trips.map(trip =>
          trip.id === tripId ? { 
            ...trip, 
            status: newStatus,
            ...(newStatus === 'COMPLETED' && { 
              completedDate: new Date().toISOString() 
            })
          } : trip
        )
      );
      
      alert(`Trip status updated to ${newStatus}`);
      
      // Refresh the list to get any server-side updates
      setTimeout(() => {
        fetchAssignedTrips();
      }, 1000);
      
    } catch (err) {
      setError(err.message);
      console.error('Error updating trip status:', err);
      alert('Failed to update trip status. Please try again.');
      
      // Revert local state on error
      fetchAssignedTrips();
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'UPCOMING':
      case 'ASSIGNED':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'RUNNING':
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'UPCOMING':
      case 'ASSIGNED':
        return <Calendar className="size-4 mr-1" />;
      case 'RUNNING':
      case 'IN_PROGRESS':
        return <Truck className="size-4 mr-1" />;
      case 'COMPLETED':
        return <CheckCircle className="size-4 mr-1" />;
      default:
        return <Package className="size-4 mr-1" />;
    }
  }

  // Filter trips to only show active ones (not completed)
  const activeTrips = assignedTrips.filter(trip => 
    trip.status !== 'COMPLETED' && trip.status !== 'CANCELLED'
  );

  const completedTrips = assignedTrips.filter(trip => 
    trip.status === 'COMPLETED'
  );

  if (loading) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Truck className="size-12 text-[#F08344] mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600">Loading your assigned loads...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#F08344] rounded-lg flex items-center justify-center">
            <Truck className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Assigned Loads</h1>
            <p className="text-slate-600">Manage your delivery assignments</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
          <AlertCircle className="size-5 mr-2" />
          <span>{error}</span>
          <button 
            onClick={() => setError(null)} 
            className="ml-auto font-bold hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      {/* Refresh Button */}
      <div className="mb-6 flex justify-between items-center">
        <div className="text-sm text-slate-600">
          {activeTrips.length} active load{activeTrips.length !== 1 ? 's' : ''}, 
          {' '}{completedTrips.length} completed
        </div>
        <Button
          onClick={fetchAssignedTrips}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </div>

      {/* Active Trips */}
      {activeTrips.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Active Loads</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTrips.map(trip => (
              <Card key={trip.id} className="p-6 border-l-4 border-l-[#F08344] border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-slate-900 text-lg">Order #{trip.id}</h3>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(trip.status)}`}>
                    {getStatusIcon(trip.status)}
                    {trip.status?.replace('_', ' ') || 'Unknown'}
                  </span>
                </div>
                
                <div className="space-y-4 mb-4">
                  <div className="flex items-start gap-2 text-sm text-slate-700">
                    <MapPin className="w-4 h-4 mt-0.5 text-red-500 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium mb-1">From: <span className="text-slate-900">{trip.fromLocation}</span></p>
                      <p className="font-medium">To: <span className="text-slate-900">{trip.toLocation}</span></p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Package className="w-4 h-4 text-[#F08344]" />
                    <span><strong>Cargo:</strong> {trip.cargo}</span>
                  </div>
                  
                  {trip.truck && (
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Truck className="w-4 h-4 text-[#F08344]" />
                      <span><strong>Truck:</strong> {trip.truck.truckNo}</span>
                    </div>
                  )}

                  <div className="text-sm text-slate-700 space-y-1">
                    <p><strong>Customer:</strong> {trip.customerName}</p>
                    {trip.deliveryAddress && (
                      <p className="text-xs text-slate-600">
                        <MapPin className="w-3 h-3 inline mr-1" />
                        {trip.deliveryAddress}
                      </p>
                    )}
                  </div>

                  {trip.specialInstructions && (
                    <div className="text-sm text-slate-700 bg-yellow-50 p-2 rounded border border-yellow-200">
                      <p><strong>Instructions:</strong> {trip.specialInstructions}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {(trip.status === 'UPCOMING' || trip.status === 'ASSIGNED') && (
                    <Button
                      onClick={() => updateTripStatus(trip.id, 'RUNNING')}
                      className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center"
                    >
                      <Truck className="size-4 mr-2" />
                      Start Delivery
                    </Button>
                  )}
                  
                  {(trip.status === 'RUNNING' || trip.status === 'IN_PROGRESS') && (
                    <Button
                      onClick={() => updateTripStatus(trip.id, 'COMPLETED')}
                      className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center"
                    >
                      <CheckCircle className="size-4 mr-2" />
                      Complete Delivery
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed Trips */}
      {completedTrips.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Completed Loads</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedTrips.map(trip => (
              <Card key={trip.id} className="p-6 border-l-4 border-l-green-500 border border-slate-200 bg-green-50">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-slate-900 text-lg">Order #{trip.id}</h3>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(trip.status)}`}>
                    {getStatusIcon(trip.status)}
                    {trip.status?.replace('_', ' ') || 'Unknown'}
                  </span>
                </div>
                
                <div className="space-y-3 text-sm text-slate-700">
                  <p><strong>Customer:</strong> {trip.customerName}</p>
                  <p><strong>Delivery:</strong> {trip.toLocation}</p>
                  <p><strong>Cargo:</strong> {trip.cargo}</p>
                  <div className="flex items-center gap-2 text-green-600 justify-center p-2 bg-green-100 rounded-lg border border-green-200 mt-2">
                    <CheckCircle className="size-5" />
                    <span className="text-sm font-medium">Delivery Completed</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Loads Message */}
      {assignedTrips.length === 0 && !loading && (
        <Card className="p-8 text-center col-span-full border border-slate-200">
          <Truck className="size-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No Assigned Loads</h3>
          <p className="text-slate-500 mb-4">
            You don't have any loads assigned yet. Check back later or contact your manager.
          </p>
          <Button 
            onClick={fetchAssignedTrips}
            className="bg-[#F08344] hover:bg-[#e07334] flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="size-4" />
            Check Again
          </Button>
        </Card>
      )}
    </div>
  )
}