import { useState, useEffect } from 'react'
import { Card } from '../../../components/ui/Card'
import { MapPin, Truck, Clock, CheckCircle, AlertCircle, User, Phone, Package, RefreshCw } from 'lucide-react'
import DeliveryDetailsModal from './DeliveryDetailsModal'

const API_BASE_URL = 'http://localhost:7700/api'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    inTransit: 0,
    completed: 0,
    pending: 0,
    currentTrip: null
  })
  
  const [deliveries, setDeliveries] = useState([])
  const [selectedDelivery, setSelectedDelivery] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
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

  // Fetch data from API
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching dashboard data...');
      
      const user = JSON.parse(localStorage.getItem('rt_user'));
      let driverId = user?.employeeId || user?.id;
      
      // Normalize driver ID
      if (driverId && typeof driverId === 'string' && driverId.startsWith('user-')) {
        const numericId = driverId.replace('user-', '');
        driverId = !isNaN(numericId) ? parseInt(numericId) : 1;
      }
      
      console.log('Using driver ID:', driverId);

      // Fetch deliveries data from the working orders endpoint
      const deliveriesResponse = await fetch(`${API_BASE_URL}/orders?driverId=${driverId}&status=IN_PROGRESS,ASSIGNED,RUNNING,CONFIRMED,COMPLETED`, {
        headers: getHeaders()
      });

      if (!deliveriesResponse.ok) {
        throw new Error('Failed to fetch deliveries data');
      }

      const deliveriesData = await deliveriesResponse.json();
      console.log('Deliveries data:', deliveriesData);

      // Handle different response formats
      let deliveriesList = [];
      
      if (deliveriesData && deliveriesData.success && deliveriesData.data) {
        deliveriesList = deliveriesData.data;
      } else if (Array.isArray(deliveriesData)) {
        deliveriesList = deliveriesData;
      } else if (deliveriesData && Array.isArray(deliveriesData.data)) {
        deliveriesList = deliveriesData.data;
      }

      // Convert orders to delivery format
      const formattedDeliveries = deliveriesList.map(order => ({
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

      // Calculate stats from the deliveries data
      const totalDeliveries = formattedDeliveries.length;
      const inTransit = formattedDeliveries.filter(d => 
        d.status === 'In Transit' || mapOrderStatusToDeliveryStatus(d.originalOrder?.status) === 'In Transit'
      ).length;
      const completed = formattedDeliveries.filter(d => 
        d.status === 'Completed' || mapOrderStatusToDeliveryStatus(d.originalOrder?.status) === 'Completed'
      ).length;
      const pending = formattedDeliveries.filter(d => 
        d.status === 'Pending' || mapOrderStatusToDeliveryStatus(d.originalOrder?.status) === 'Pending'
      ).length;

      // Find current trip (first active delivery)
      const currentTrip = formattedDeliveries.find(d => 
        d.status === 'In Transit' || d.status === 'Pending'
      ) || (formattedDeliveries.length > 0 ? formattedDeliveries[0] : null);

      setStats({
        totalDeliveries,
        inTransit,
        completed,
        pending,
        currentTrip: currentTrip ? {
          from: currentTrip.pickup,
          to: currentTrip.drop,
          cargo: currentTrip.product,
          customer: currentTrip.customer,
          customerPhone: currentTrip.customerPhone,
          status: currentTrip.status
        } : null
      });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(`Failed to load dashboard: ${err.message}`);
      
      // Fallback to calculating stats from any existing deliveries data
      if (deliveries.length > 0) {
        const totalDeliveries = deliveries.length;
        const inTransit = deliveries.filter(d => d.status === 'In Transit').length;
        const completed = deliveries.filter(d => d.status === 'Completed').length;
        const pending = deliveries.filter(d => d.status === 'Pending').length;
        
        const currentTrip = deliveries.find(d => d.status === 'In Transit' || d.status === 'Pending') || 
                           (deliveries.length > 0 ? deliveries[0] : null);

        setStats({
          totalDeliveries,
          inTransit,
          completed,
          pending,
          currentTrip: currentTrip ? {
            from: currentTrip.pickup,
            to: currentTrip.drop,
            cargo: currentTrip.product,
            customer: currentTrip.customer,
            customerPhone: currentTrip.customerPhone,
            status: currentTrip.status
          } : null
        });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: 'Total Deliveries',
      value: stats.totalDeliveries,
      subtitle: `${stats.completed} Completed / ${stats.pending} Pending`,
      icon: Truck,
      color: 'bg-blue-500'
    },
    {
      title: 'In Transit',
      value: stats.inTransit,
      icon: MapPin,
      color: 'bg-yellow-500'
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: CheckCircle,
      color: 'bg-green-500'
    },
    {
      title: 'Pending',
      value: stats.pending,
      icon: AlertCircle,
      color: 'bg-red-500'
    }
  ]

  const quickActions = [
    {
      title: 'Start Trip',
      description: 'Begin your current delivery',
      icon: Truck,
      color: 'bg-blue-50 hover:bg-blue-100',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-900',
      subtitleColor: 'text-blue-700',
      onClick: () => {
        if (stats.currentTrip) {
          console.log('Starting trip:', stats.currentTrip);
          alert('Trip started!');
        } else {
          alert('No active trip available');
        }
      }
    },
    {
      title: 'Update Location',
      description: 'Share your current position',
      icon: MapPin,
      color: 'bg-green-50 hover:bg-green-100',
      iconColor: 'text-green-600',
      textColor: 'text-green-900',
      subtitleColor: 'text-green-700',
      onClick: () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              console.log('Location updated:', { latitude, longitude });
              alert(`Location updated: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            },
            (error) => {
              console.error('Geolocation error:', error);
              alert('Failed to get location. Please enable location services.');
            }
          );
        } else {
          alert('Geolocation is not supported by this browser.');
        }
      }
    },
    {
      title: 'Refresh Data',
      description: 'Update dashboard information',
      icon: RefreshCw,
      color: 'bg-purple-50 hover:bg-purple-100',
      iconColor: 'text-purple-600',
      textColor: 'text-purple-900',
      subtitleColor: 'text-purple-700',
      onClick: fetchDashboardData
    }
  ]

  if (loading) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F08344] mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-8 animate-slide-in-right">
        <div className="flex items-center gap-3 mb-2 group">
          <div className="w-10 h-10 bg-[#F08344] rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
            <Truck className="size-5 text-white transition-transform duration-300 group-hover:scale-110" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 group-hover:text-[#F08344] transition-colors duration-200">Driver Dashboard</h1>
            <p className="text-slate-600 group-hover:text-slate-800 transition-colors duration-200">
              {stats.totalDeliveries > 0 
                ? `Managing ${stats.totalDeliveries} delivery${stats.totalDeliveries !== 1 ? 's' : ''}` 
                : 'Track your trips and deliveries'
              }
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="text-red-700 hover:text-red-900 font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <Card
            key={index}
            className="p-6 border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 animate-fade-in-up group relative overflow-hidden"
            style={{ animationDelay: `${index * 150}ms` }}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                <card.icon className="size-6 text-white transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 group-hover:text-[#F08344] transition-colors duration-200">{card.value}</p>
                <p className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors duration-200">{card.title}</p>
                {card.subtitle && <p className="text-xs text-slate-500 mt-1">{card.subtitle}</p>}
              </div>
            </div>
            {/* Hover effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#F08344]/5 to-[#F08344]/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          </Card>
        ))}
      </div>

      {/* Current Trip & Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Current Trip */}
        <Card className="p-6 border-gray-200 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
          <h2 className="text-xl font-semibold text-slate-900 mb-4 group-hover:text-[#F08344] transition-colors duration-200">
            {stats.currentTrip ? 'Current Trip' : 'No Active Trip'}
          </h2>
          {stats.currentTrip ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg group-hover:bg-orange-50 transition-colors duration-200">
                <MapPin className="size-5 text-blue-500" />
                <div>
                  <p className="font-medium text-slate-700">Route</p>
                  <p className="text-lg text-slate-900">{stats.currentTrip.from} → {stats.currentTrip.to}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg group-hover:bg-orange-50 transition-colors duration-200">
                <Package className="size-5 text-green-500" />
                <div>
                  <p className="font-medium text-slate-700">Cargo</p>
                  <p className="text-lg text-slate-900">{stats.currentTrip.cargo}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg group-hover:bg-orange-50 transition-colors duration-200">
                <User className="size-5 text-purple-500" />
                <div>
                  <p className="font-medium text-slate-700">Customer</p>
                  <p className="text-lg text-slate-900">{stats.currentTrip.customer}</p>
                  <p className="text-sm text-slate-600">{stats.currentTrip.customerPhone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg group-hover:bg-orange-50 transition-colors duration-200">
                <Clock className="size-5 text-yellow-500" />
                <div>
                  <p className="font-medium text-slate-700">Status</p>
                  <p className="text-lg text-slate-900">{stats.currentTrip.status}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Truck className="size-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No active trips assigned</p>
              <button
                onClick={fetchDashboardData}
                className="mt-4 bg-[#F08344] text-white px-4 py-2 rounded hover:bg-[#e07334] transition-colors"
              >
                Check for New Trips
              </button>
            </div>
          )}
          {/* Hover effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#F08344]/5 to-[#F08344]/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6 border-gray-200 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
          <h2 className="text-xl font-semibold text-slate-900 mb-4 group-hover:text-[#F08344] transition-colors duration-200">Quick Actions</h2>
          <div className="space-y-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`w-full p-4 ${action.color} rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-4 border border-transparent hover:border-${action.iconColor.split('-')[1]}-200`}
              >
                <action.icon className={`size-6 ${action.iconColor}`} />
                <div className="text-left">
                  <p className={`font-medium ${action.textColor}`}>{action.title}</p>
                  <p className={`text-sm ${action.subtitleColor}`}>{action.description}</p>
                </div>
              </button>
            ))}
          </div>
          {/* Hover effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#F08344]/5 to-[#F08344]/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        </Card>
      </div>

      {/* Recent Deliveries */}
      <Card className="p-6 border-gray-200 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-900 group-hover:text-[#F08344] transition-colors duration-200">
            Recent Deliveries ({deliveries.length})
          </h2>
          <button
            onClick={fetchDashboardData}
            className="text-[#F08344] hover:text-[#e07334] transition-colors"
          >
            <RefreshCw className="size-5" />
          </button>
        </div>
        
        {deliveries.length === 0 ? (
          <div className="text-center py-8">
            <Truck className="size-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No Deliveries Found</h3>
            <p className="text-slate-500">You don't have any deliveries assigned yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                <tr>
                  <th className="px-6 py-3">Order ID</th>
                  <th className="px-6 py-3">Pickup</th>
                  <th className="px-6 py-3">Drop</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.slice(0, 5).map((delivery) => (
                  <tr key={delivery.id} className="bg-white border-b hover:bg-slate-50 transition-colors duration-200">
                    <td className="px-6 py-4 font-medium text-slate-900">#{delivery.id}</td>
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
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
                        delivery.status === 'Completed' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                        delivery.status === 'In Transit' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
                        'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      }`}>
                        {delivery.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedDelivery(delivery)
                          setIsModalOpen(true)
                        }}
                        className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 hover:scale-105 transform"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* Hover effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#F08344]/5 to-[#F08344]/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      </Card>

      {/* Delivery Details Modal */}
      {isModalOpen && selectedDelivery && (
        <DeliveryDetailsModal
          delivery={selectedDelivery}
          onClose={() => setIsModalOpen(false)}
          onUpdateStatus={(id, status) => {
            setDeliveries(deliveries.map(d => d.id === id ? { ...d, status } : d))
            fetchDashboardData(); // Refresh data
          }}
        />
      )}
    </div>
  )
}