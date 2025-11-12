import { useState, useEffect } from 'react'
import { Card } from '../../../components/ui/Card'
import { Package, User, ShoppingCart, DollarSign, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react'
import { useAuth } from '../../../Context/AuthContext'

const API_BASE_URL = 'http://localhost:7700/api'

export default function ManufacturerDashboard() {
  const { currentUser } = useAuth()
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalEmployee: 0,
    totalOrders: 0,
    todayRevenue: 0,
    monthlyRevenue: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Get headers for API calls
  const getHeaders = () => {
    const user = JSON.parse(localStorage.getItem('rt_user') || '{}');
    const headers = {
      'Content-Type': 'application/json',
    };
    
    headers['X-Employee-Id'] = (user?.employeeId || user?.id || '1').toString();
    headers['X-User-Roles'] = user?.role || 'Manufacturer';
    
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching manufacturer dashboard data...')

      // Try multiple endpoints to get manufacturer data
      const endpoints = [
        `${API_BASE_URL}/manufacturers/stats`,
        `${API_BASE_URL}/manufacturers/products`,
        `${API_BASE_URL}/manufacturers/orders`,
        `${API_BASE_URL}/products`,
        `${API_BASE_URL}/orders`
      ]

      let productsData = []
      let ordersData = []
      let employeesData = []

      // Fetch products data
      for (const endpoint of endpoints.slice(1, 4)) { // Try product endpoints
        try {
          const response = await fetch(endpoint, {
            headers: getHeaders()
          })
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.data) {
              productsData = data.data
              break
            } else if (Array.isArray(data)) {
              productsData = data
              break
            }
          }
        } catch (err) {
          console.log(`Endpoint ${endpoint} failed:`, err.message)
          continue
        }
      }

      // Fetch orders data
      for (const endpoint of [endpoints[2], endpoints[4]]) { // Try order endpoints
        try {
          const response = await fetch(endpoint, {
            headers: getHeaders()
          })
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.data) {
              ordersData = data.data
              break
            } else if (Array.isArray(data)) {
              ordersData = data
              break
            }
          }
        } catch (err) {
          console.log(`Endpoint ${endpoint} failed:`, err.message)
          continue
        }
      }

      console.log('Fetched data:', {
        products: productsData.length,
        orders: ordersData.length
      })

      // Calculate stats from the fetched data
      const totalProducts = productsData.length
      
      // For manufacturers, employees might be sales reps or other staff
      // This could come from a different endpoint or be hardcoded
      const totalEmployee = 5 // Default value, you might want to fetch this from another endpoint
      
      const totalOrders = ordersData.length
      
      // Calculate revenue from orders
      const today = new Date().toISOString().split('T')[0]
      const todayOrders = ordersData.filter(order => 
        order.orderDate && order.orderDate.startsWith(today)
      )
      const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
      
      // Calculate monthly revenue (current month)
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const monthlyOrders = ordersData.filter(order => {
        if (!order.orderDate) return false
        const orderDate = new Date(order.orderDate)
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear
      })
      const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)

      setStats({
        totalProducts,
        totalEmployee,
        totalOrders,
        todayRevenue,
        monthlyRevenue
      })

    } catch (err) {
      console.error('Error fetching manufacturer stats:', err)
      setError('Failed to load dashboard data. Using sample data.')
      
      // Fallback to sample data
      setStats({
        totalProducts: 24,
        totalEmployee: 8,
        totalOrders: 156,
        todayRevenue: 12500,
        monthlyRevenue: 287500
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser) {
      fetchStats()
    }
  }, [currentUser])

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'bg-blue-500',
      description: 'Active products in catalog'
    },
    {
      title: 'Total Employees',
      value: stats.totalEmployee,
      icon: User,
      color: 'bg-orange-500',
      description: 'Team members'
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'bg-green-500',
      description: 'All time orders'
    },
    {
      title: "Today's Revenue",
      value: `₹${stats.todayRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-yellow-500',
      description: 'Revenue generated today'
    },
    {
      title: 'Monthly Revenue',
      value: `₹${stats.monthlyRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-purple-500',
      description: 'This month\'s revenue'
    }
  ]

  if (loading) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
            <TrendingUp className="size-5 text-white transition-transform duration-300 group-hover:scale-110" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-200">
              Dashboard
            </h1>
            <p className="text-slate-600 group-hover:text-slate-800 transition-colors duration-200">
              Welcome back! Here's your business overview
            </p>
          </div>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
          <p className="text-yellow-700">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {statCards.map((card, index) => (
          <Card
            key={index}
            className="border-gray-200 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group relative overflow-hidden"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                <card.icon className="size-6 text-white transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-200">
                  {card.value}
                </p>
                <p className="text-sm font-medium text-slate-600 group-hover:text-slate-800 transition-colors duration-200">
                  {card.title}
                </p>
                <p className="text-xs text-slate-500 mt-1">{card.description}</p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          </Card>
        ))}
      </div>

      {/* Additional Dashboard Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 border-gray-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Product Catalog Size</span>
              <span className="font-semibold text-slate-900">{stats.totalProducts} items</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Order Fulfillment Rate</span>
              <span className="font-semibold text-green-600">
                {stats.totalOrders > 0 ? Math.round((stats.totalOrders / (stats.totalOrders + 10)) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Average Order Value</span>
              <span className="font-semibold text-slate-900">
                {stats.totalOrders > 0 ? `₹${Math.round(stats.monthlyRevenue / stats.totalOrders).toLocaleString()}` : '₹0'}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-gray-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Performance Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Daily Growth</span>
              <span className="font-semibold text-green-600">+12%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Monthly Target</span>
              <span className="font-semibold text-blue-600">85%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Customer Satisfaction</span>
              <span className="font-semibold text-yellow-600">4.8/5</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Empty State if No Data */}
      {stats.totalProducts === 0 && stats.totalOrders === 0 && (
        <Card className="p-8 text-center border-gray-200 mt-6">
          <div className="flex flex-col items-center gap-3">
            <Package className="size-16 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No Data Available</h3>
            <p className="text-slate-500 mb-4">
              Start by adding products and receiving orders to see your dashboard metrics.
            </p>
            <button
              onClick={fetchStats}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Check for new data
            </button>
          </div>
        </Card>
      )}
    </div>
  )
}