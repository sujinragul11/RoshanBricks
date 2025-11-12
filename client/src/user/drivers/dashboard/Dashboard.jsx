import { useState, useEffect } from 'react'
import { Card } from '../../../components/ui/Card'
import { MapPin, Truck, Clock, CheckCircle, AlertCircle, User, Phone, Package } from 'lucide-react'
import DeliveryDetailsModal from './DeliveryDetailsModal'
import { getCurrentUser } from '../../../lib/auth'

const API_BASE_URL = 'http://localhost:7700/api'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    inTransit: 0,
    completed: 0,
    pending: 0,
    currentTrip: {
      from: '',
      to: '',
      cargo: '',
      customer: '',
      customerPhone: ''
    }
  })
  
  const [deliveries, setDeliveries] = useState([])
  const [selectedDelivery, setSelectedDelivery] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch data from API
  useEffect(() => {
    const fetchDriverData = async () => {
      try {
        const user = getCurrentUser()

        // Ensure employeeId is available for drivers
        if (!user.employeeId && user.roles.includes('driver')) {
          try {
            const response = await fetch(`${API_BASE_URL}/employees/by-phone`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ phone: user.phone, role: 'Driver' })
            })

            if (response.ok) {
              const data = await response.json()
              user.employeeId = data.id
              localStorage.setItem('rt_user', JSON.stringify(user))
            } else {
              throw new Error('Employee record not found')
            }
          } catch (err) {
            setError('Your driver account is not properly set up. Please contact support.')
            console.error('Error fetching employee details:', err)
            return
          }
        }

        // Fetch dashboard stats
        const statsResponse = await fetch(`${API_BASE_URL}/drivers/dashboard/stats`, {
          headers: {
            'Content-Type': 'application/json',
            'X-Employee-Id': user.employeeId ? user.employeeId.toString() : '',
            'X-User-Roles': 'Driver'
          }
        })

        if (!statsResponse.ok) {
          throw new Error('Failed to fetch dashboard stats')
        }

        const statsData = await statsResponse.json()
        if (statsData.success) {
          setStats(statsData.data)
        }

        // Fetch recent deliveries
        const deliveriesResponse = await fetch(`${API_BASE_URL}/drivers/deliveries`, {
          headers: {
            'Content-Type': 'application/json',
            'X-Employee-Id': user.employeeId ? user.employeeId.toString() : '',
            'X-User-Roles': 'Driver'
          }
        })

        if (deliveriesResponse.ok) {
          const deliveriesData = await deliveriesResponse.json()
          if (deliveriesData.success) {
            setDeliveries(deliveriesData.data)
          }
        }

      } catch (err) {
        setError(err.message)
        console.error('Error fetching driver data:', err)
        
        // Fallback to mock data if API fails
        setStats({
          totalDeliveries: 10,
          inTransit: 2,
          completed: 7,
          pending: 1,
          currentTrip: {
            from: 'Chennai',
            to: 'Bangalore',
            cargo: 'Electronics - 15 Ton',
            customer: 'ABC Corp',
            customerPhone: '+91 9876543210'
          }
        })
        
        setDeliveries([
          {
            id: 'ORD001',
            pickup: 'Warehouse A, Chennai',
            drop: 'Store B, Bangalore',
            status: 'Pending',
            product: 'Electronics',
            customer: 'ABC Corp',
            customerPhone: '+91 9876543210'
          },
          {
            id: 'ORD002',
            pickup: 'Factory X, Mumbai',
            drop: 'Retail Y, Delhi',
            status: 'In Transit',
            product: 'Clothing',
            customer: 'XYZ Ltd',
            customerPhone: '+91 9876543211'
          },
          {
            id: 'ORD003',
            pickup: 'Depot Z, Pune',
            drop: 'Outlet W, Hyderabad',
            status: 'Completed',
            product: 'Furniture',
            customer: 'PQR Inc',
            customerPhone: '+91 9876543212'
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchDriverData()
  }, [])

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
      onClick: () => console.log('Start Trip clicked')
    },
    {
      title: 'Update Location',
      description: 'Share your current position',
      icon: MapPin,
      color: 'bg-green-50 hover:bg-green-100',
      iconColor: 'text-green-600',
      textColor: 'text-green-900',
      subtitleColor: 'text-green-700',
      onClick: () => console.log('Update Location clicked')
    },
    {
      title: 'End Trip',
      description: 'Complete delivery',
      icon: Clock,
      color: 'bg-purple-50 hover:bg-purple-100',
      iconColor: 'text-purple-600',
      textColor: 'text-purple-900',
      subtitleColor: 'text-purple-700',
      onClick: () => console.log('End Trip clicked')
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
            <p className="text-slate-600 group-hover:text-slate-800 transition-colors duration-200">Track your trips and deliveries</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
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
          <h2 className="text-xl font-semibold text-slate-900 mb-4 group-hover:text-[#F08344] transition-colors duration-200">Current Trip</h2>
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
                <p className="text-lg text-slate-900">In Progress</p>
              </div>
            </div>
          </div>
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

      {/* Deliveries Table */}
      <Card className="p-6 border-gray-200 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
        <h2 className="text-xl font-semibold text-slate-900 mb-4 group-hover:text-[#F08344] transition-colors duration-200">Recent Deliveries</h2>
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
              {deliveries.map((delivery) => (
                <tr key={delivery.id} className="bg-white border-b hover:bg-slate-50 transition-colors duration-200">
                  <td className="px-6 py-4 font-medium text-slate-900">{delivery.id}</td>
                  <td className="px-6 py-4 text-slate-700">{delivery.pickup}</td>
                  <td className="px-6 py-4 text-slate-700">{delivery.drop}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
                      delivery.status === 'Completed' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                      delivery.status === 'In Transit' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
                      'bg-red-100 text-red-800 hover:bg-red-200'
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
          }}
        />
      )}
    </div>
  )
}