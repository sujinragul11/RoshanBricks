import { useState, useEffect } from 'react'
import { Card } from '../../../components/ui/Card'
import DeliveryDetailsModal from './DeliveryDetailsModal'

const API_BASE_URL = 'http://localhost:7700/api'

export default function DeliveriesList() {
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filteredDeliveries, setFilteredDeliveries] = useState([])
  const [filterMonth, setFilterMonth] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [selectedDelivery, setSelectedDelivery] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editStatusId, setEditStatusId] = useState(null)
  const [editStatusValue, setEditStatusValue] = useState('')

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

  // Fetch assigned trips/deliveries
  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching driver deliveries...');
      
      const user = JSON.parse(localStorage.getItem('rt_user'));
      let driverId = user?.employeeId || user?.id;
      
      // Normalize driver ID
      if (driverId && typeof driverId === 'string' && driverId.startsWith('user-')) {
        const numericId = driverId.replace('user-', '');
        driverId = !isNaN(numericId) ? parseInt(numericId) : 1;
      }
      
      console.log('Using driver ID:', driverId);

      // Try multiple endpoints - prioritize the working orders endpoint
      const endpoints = [
        `${API_BASE_URL}/orders?driverId=${driverId}&status=IN_PROGRESS,ASSIGNED,RUNNING,CONFIRMED,COMPLETED`,
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
            let deliveriesData = null;
            
            if (data && data.success && data.data) {
              deliveriesData = data.data;
            } else if (Array.isArray(data)) {
              deliveriesData = data;
            } else if (data && Array.isArray(data.data)) {
              deliveriesData = data.data;
            }
            
            if (deliveriesData && deliveriesData.length > 0) {
              console.log(`Found ${deliveriesData.length} deliveries from ${endpoint}`);
              
              // Convert orders to delivery format
              const formattedDeliveries = deliveriesData.map(order => ({
                id: order.id,
                orderId: order.id,
                pickup: order.manufacturer?.location || order.pickupLocation || 'Warehouse',
                drop: order.deliveryAddress,
                status: mapOrderStatusToDeliveryStatus(order.status),
                product: order.items?.map(item => 
                  item.product?.name || item.manufacturerProduct?.name || 'Product'
                ).join(', ') || 'General Cargo',
                customer: order.customerName,
                customerPhone: order.customerPhone || 'N/A',
                date: order.orderDate || order.assignedDate || new Date().toISOString(),
                // Additional fields for details modal
                fromLocation: order.manufacturer?.location || order.pickupLocation || 'Warehouse',
                toLocation: order.deliveryAddress,
                cargo: order.items?.map(item => 
                  item.product?.name || item.manufacturerProduct?.name || 'Product'
                ).join(', ') || 'General Cargo',
                specialInstructions: order.specialInstructions || '',
                estimatedDeliveryDate: order.estimatedDeliveryDate,
                truck: order.truck || { truckNo: order.truckNumber || 'Assigned Truck' },
                originalOrder: order
              }));
              
              console.log('Formatted deliveries:', formattedDeliveries);
              setDeliveries(formattedDeliveries);
              setFilteredDeliveries(formattedDeliveries);
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

      // If we get here, no endpoints returned valid data
      console.log('No delivery data found from any endpoint');
      setDeliveries([]);
      setFilteredDeliveries([]);
      
    } catch (err) {
      console.error('Error fetching deliveries:', err);
      setError(`Failed to load deliveries: ${err.message}`);
      setDeliveries([]);
      setFilteredDeliveries([]);
    } finally {
      setLoading(false);
    }
  }

  // Helper function to map order status to delivery status
  const mapOrderStatusToDeliveryStatus = (orderStatus) => {
    const statusMap = {
      'PENDING': 'Pending',
      'CONFIRMED': 'Pending',
      'ASSIGNED': 'Pending',
      'IN_PROGRESS': 'In Transit',
      'RUNNING': 'In Transit',
      'COMPLETED': 'Completed',
      'CANCELLED': 'Cancelled'
    };
    return statusMap[orderStatus] || 'Pending';
  }

  // Helper function to map delivery status back to order status
  const mapDeliveryStatusToOrderStatus = (deliveryStatus) => {
    const statusMap = {
      'Pending': 'IN_PROGRESS',
      'In Transit': 'IN_PROGRESS',
      'Completed': 'COMPLETED'
    };
    return statusMap[deliveryStatus] || 'IN_PROGRESS';
  }

  useEffect(() => {
    fetchDeliveries();
  }, []);

  useEffect(() => {
    let filtered = deliveries;
    
    if (filterMonth) {
      filtered = filtered.filter(d => {
        try {
          const month = new Date(d.date).getMonth() + 1;
          return month === parseInt(filterMonth);
        } catch (error) {
          return true; // If date parsing fails, include the delivery
        }
      });
    }
    
    if (filterYear) {
      filtered = filtered.filter(d => {
        try {
          const year = new Date(d.date).getFullYear();
          return year === parseInt(filterYear);
        } catch (error) {
          return true; // If date parsing fails, include the delivery
        }
      });
    }
    
    setFilteredDeliveries(filtered);
  }, [filterMonth, filterYear, deliveries]);

  const handleEditClick = (id, currentStatus) => {
    setEditStatusId(id)
    setEditStatusValue(currentStatus)
  }

  const handleSaveClick = async (id) => {
    try {
      const deliveryToUpdate = deliveries.find(d => d.id === id);
      if (!deliveryToUpdate) return;

      const orderStatus = mapDeliveryStatusToOrderStatus(editStatusValue);
      
      // Update status on the server
      const updateEndpoints = [
        `${API_BASE_URL}/orders/${id}/status`,
        `${API_BASE_URL}/drivers/orders/${id}/status`,
        `${API_BASE_URL}/truck-owners/orders/${id}/status`
      ];

      let success = false;
      
      for (const endpoint of updateEndpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ status: orderStatus })
          });

          if (response.ok) {
            success = true;
            break;
          }
        } catch (err) {
          continue;
        }
      }

      if (success) {
        // Update local state
        setDeliveries(deliveries.map(d => 
          d.id === id ? { ...d, status: editStatusValue } : d
        ));
        setEditStatusId(null);
        setEditStatusValue('');
        
        // Refresh data to ensure consistency
        fetchDeliveries();
      } else {
        alert('Failed to update status on server. Please try again.');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status. Please try again.');
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Transit':
        return 'bg-yellow-100 text-yellow-800';
      case 'Pending':
        return 'bg-blue-100 text-blue-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  if (loading) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full size-12 border-b-2 border-[#F08344] mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your deliveries...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">⚠️</div>
          <p className="text-slate-700 mb-4">{error}</p>
          <button
            onClick={fetchDeliveries}
            className="bg-[#F08344] text-white px-4 py-2 rounded hover:bg-[#e07334]"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Delivery Trips</h1>
        <p className="text-slate-600">Manage your assigned deliveries</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 bg-white border-l-4 border-l-blue-500">
          <div className="text-sm text-slate-600">Total Deliveries</div>
          <div className="text-2xl font-bold text-slate-900">{deliveries.length}</div>
        </Card>
        <Card className="p-4 bg-white border-l-4 border-l-yellow-500">
          <div className="text-sm text-slate-600">In Progress</div>
          <div className="text-2xl font-bold text-slate-900">
            {deliveries.filter(d => d.status === 'In Transit' || d.status === 'Pending').length}
          </div>
        </Card>
        <Card className="p-4 bg-white border-l-4 border-l-green-500">
          <div className="text-sm text-slate-600">Completed</div>
          <div className="text-2xl font-bold text-slate-900">
            {deliveries.filter(d => d.status === 'Completed').length}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <select
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
          className="border border-slate-300 rounded px-3 py-2 bg-white"
        >
          <option value="">All Months</option>
          {[...Array(12)].map((_, i) => (
            <option key={i+1} value={i+1}>
              {new Date(0, i).toLocaleString('default', { month: 'long' })}
            </option>
          ))}
        </select>
        <select
          value={filterYear}
          onChange={e => setFilterYear(e.target.value)}
          className="border border-slate-300 rounded px-3 py-2 bg-white"
        >
          <option value="">All Years</option>
          {[2023, 2024, 2025].map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
        <button
          onClick={fetchDeliveries}
          className="bg-[#F08344] text-white px-4 py-2 rounded hover:bg-[#e07334] ml-auto"
        >
          Refresh
        </button>
      </div>

      {/* Deliveries Table */}
      <Card className="p-6">
        {filteredDeliveries.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-slate-400 text-6xl mb-4">🚚</div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No Deliveries Found</h3>
            <p className="text-slate-500">
              {deliveries.length === 0 
                ? "You don't have any deliveries assigned yet." 
                : "No deliveries match your filter criteria."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                <tr>
                  <th className="px-6 py-3">Order ID</th>
                  <th className="px-6 py-3">Pickup Location</th>
                  <th className="px-6 py-3">Delivery Address</th>
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeliveries.map(delivery => (
                  <tr key={delivery.id} className="bg-white border-b hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      #{delivery.id}
                    </td>
                    <td className="px-6 py-4 text-slate-700 max-w-xs">
                      <div className="truncate" title={delivery.pickup}>
                        {delivery.pickup}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 max-w-xs">
                      <div className="truncate" title={delivery.drop}>
                        {delivery.drop}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {delivery.product}
                    </td>
                    <td className="px-6 py-4">
                      {editStatusId === delivery.id ? (
                        <select
                          value={editStatusValue}
                          onChange={e => setEditStatusValue(e.target.value)}
                          className="border border-slate-300 rounded px-2 py-1 text-sm"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Transit">In Transit</option>
                          <option value="Completed">Completed</option>
                        </select>
                      ) : (
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(delivery.status)}`}>
                          {delivery.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editStatusId === delivery.id ? (
                        <button
                          className="text-green-600 hover:text-green-800 font-medium text-sm"
                          onClick={() => handleSaveClick(delivery.id)}
                        >
                          Save
                        </button>
                      ) : (
                        <button
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                          onClick={() => {
                            setSelectedDelivery(delivery)
                            setIsModalOpen(true)
                          }}
                        >
                          View Details
                        </button>
                      )}
                      {editStatusId !== delivery.id && delivery.status !== 'Completed' && (
                        <button
                          className="ml-3 text-orange-600 hover:text-orange-800 font-medium text-sm"
                          onClick={() => handleEditClick(delivery.id, delivery.status)}
                        >
                          Edit Status
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Delivery Details Modal */}
      {isModalOpen && selectedDelivery && (
        <DeliveryDetailsModal
          delivery={selectedDelivery}
          onClose={() => setIsModalOpen(false)}
          onUpdateStatus={(id, status) => {
            setDeliveries(deliveries.map(d => d.id === id ? { ...d, status } : d))
            fetchDeliveries(); // Refresh data
          }}
        />
      )}
    </div>
  )
}