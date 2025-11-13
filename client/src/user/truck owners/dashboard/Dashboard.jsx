import { useState, useEffect } from 'react'
import { Card } from '../../../components/ui/Card'
import { Truck, MapPin, DollarSign, CheckCircle, Clock, TrendingUp, Users, Package } from 'lucide-react'

const API_BASE_URL = 'http://localhost:7700/api'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalTrucks: 0,
    activeTrucks: 0,
    inactiveTrucks: 0,
    runningTrips: 0,
    upcomingTrips: 0,
    completedTrips: 0,
    monthlyEarnings: 0,
    yearlyEarnings: 0,
    totalDrivers: 0,
    totalOrders: 0
  })
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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching truck owner dashboard data...');

        // Fetch data from multiple working endpoints
        const [trucksResponse, driversResponse, ordersResponse, tripsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/truck-owners/trucks`, { headers: getHeaders() }),
          fetch(`${API_BASE_URL}/truck-owners/drivers`, { headers: getHeaders() }),
          fetch(`${API_BASE_URL}/truck-owners/orders`, { headers: getHeaders() }),
          fetch(`${API_BASE_URL}/truck-owners/trips`, { headers: getHeaders() }).catch(err => null) // Optional endpoint
        ]);

        // Process trucks data
        let trucksData = [];
        if (trucksResponse.ok) {
          const trucksResult = await trucksResponse.json();
          if (trucksResult.success) {
            trucksData = trucksResult.data || [];
          }
        }

        // Process drivers data
        let driversData = [];
        if (driversResponse.ok) {
          const driversResult = await driversResponse.json();
          if (driversResult.success) {
            driversData = driversResult.data || [];
          }
        }

        // Process orders data
        let ordersData = [];
        if (ordersResponse.ok) {
          const ordersResult = await ordersResponse.json();
          if (ordersResult.success) {
            ordersData = ordersResult.data || [];
          }
        }

        // Process trips data (optional)
        let tripsData = [];
        if (tripsResponse && tripsResponse.ok) {
          const tripsResult = await tripsResponse.json();
          if (tripsResult.success) {
            tripsData = tripsResult.data || [];
          }
        }

        console.log('Fetched data:', {
          trucks: trucksData.length,
          drivers: driversData.length,
          orders: ordersData.length,
          trips: tripsData.length
        });

        // Calculate stats from the fetched data
        const totalTrucks = trucksData.length;
        const activeTrucks = trucksData.filter(truck => 
          truck.status === 'ACTIVE' || truck.status === 'AVAILABLE' || truck.status === 'RUNNING'
        ).length;
        const inactiveTrucks = totalTrucks - activeTrucks;

        const totalDrivers = driversData.length;
        
        const totalOrders = ordersData.length;
        const runningTrips = ordersData.filter(order => 
          order.status === 'IN_PROGRESS' || order.status === 'RUNNING'
        ).length;
        const upcomingTrips = ordersData.filter(order => 
          order.status === 'PENDING' || order.status === 'CONFIRMED' || order.status === 'ASSIGNED'
        ).length;
        const completedTrips = ordersData.filter(order => 
          order.status === 'COMPLETED'
        ).length;

        // Calculate earnings from completed orders
        const monthlyEarnings = ordersData
          .filter(order => order.status === 'COMPLETED')
          .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

        // For yearly earnings, use monthly * 12 as a simple estimate
        const yearlyEarnings = monthlyEarnings * 12;

        // Alternative calculation using trips data if available
        let calculatedRunningTrips = runningTrips;
        let calculatedUpcomingTrips = upcomingTrips;
        let calculatedCompletedTrips = completedTrips;

        if (tripsData.length > 0) {
          calculatedRunningTrips = tripsData.filter(trip => 
            trip.status === 'RUNNING' || trip.status === 'IN_PROGRESS'
          ).length;
          calculatedUpcomingTrips = tripsData.filter(trip => 
            trip.status === 'UPCOMING' || trip.status === 'ASSIGNED'
          ).length;
          calculatedCompletedTrips = tripsData.filter(trip => 
            trip.status === 'COMPLETED'
          ).length;
        }

        setStats({
          totalTrucks,
          activeTrucks,
          inactiveTrucks,
          runningTrips: calculatedRunningTrips,
          upcomingTrips: calculatedUpcomingTrips,
          completedTrips: calculatedCompletedTrips,
          monthlyEarnings,
          yearlyEarnings,
          totalDrivers,
          totalOrders
        });

      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError(`Failed to load dashboard: ${err.message}`);
        
        // Fallback to mock data if API fails completely
        // setStats({
        //   totalTrucks: 8,
        //   activeTrucks: 6,
        //   inactiveTrucks: 2,
        //   runningTrips: 3,
        //   upcomingTrips: 2,
        //   completedTrips: 15,
        //   monthlyEarnings: 125000,
        //   yearlyEarnings: 1500000,
        //   totalDrivers: 12,
        //   totalOrders: 20
        // });
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Trucks',
      value: stats.totalTrucks,
      subtitle: `${stats.activeTrucks} Active / ${stats.inactiveTrucks} Inactive`,
      icon: Truck,
      color: 'bg-blue-500',
      description: 'Fleet vehicles'
    },
    {
      title: 'Total Drivers',
      value: stats.totalDrivers,
      subtitle: 'Available drivers',
      icon: Users,
      color: 'bg-green-500',
      description: 'Driver workforce'
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      subtitle: 'All time orders',
      icon: Package,
      color: 'bg-purple-500',
      description: 'Delivery orders'
    },
    {
      title: 'Running Trips',
      value: stats.runningTrips,
      subtitle: 'Currently active',
      icon: MapPin,
      color: 'bg-orange-500',
      description: 'Active deliveries'
    },
    {
      title: 'Upcoming Trips',
      value: stats.upcomingTrips,
      subtitle: 'Scheduled trips',
      icon: Clock,
      color: 'bg-yellow-500',
      description: 'Future deliveries'
    },
    {
      title: 'Completed Trips',
      value: stats.completedTrips,
      subtitle: 'This month',
      icon: CheckCircle,
      color: 'bg-teal-500',
      description: 'Finished deliveries'
    },
    {
      title: 'Monthly Earnings',
      value: `₹${stats.monthlyEarnings.toLocaleString()}`,
      subtitle: 'Current month',
      icon: DollarSign,
      color: 'bg-indigo-500',
      description: 'Monthly revenue'
    },
    {
      title: 'Yearly Earnings',
      value: `₹${stats.yearlyEarnings.toLocaleString()}`,
      subtitle: 'Annual projection',
      icon: TrendingUp,
      color: 'bg-red-500',
      description: 'Yearly revenue'
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
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2 group">
          <div className="w-10 h-10 bg-[#F08344] rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
            <Truck className="size-5 text-white transition-transform duration-300 group-hover:scale-110" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 group-hover:text-[#F08344] transition-colors duration-200">
              Truck Owner Dashboard
            </h1>
            <p className="text-slate-600 group-hover:text-slate-800 transition-colors duration-200">
              Manage your fleet and track your business
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Using estimated data
              </h3>

              <p className="text-sm text-yellow-700 mt-1">
                {error} Showing calculated statistics based on available data.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.slice(0, 4).map((card, index) => (
          <Card
            key={index}
            className="p-6 border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group relative overflow-hidden"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                <card.icon className="size-6 text-white transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-slate-900 group-hover:text-[#F08344] transition-colors duration-200">
                  {card.value}
                </p>
                <p className="text-sm font-medium text-slate-600 group-hover:text-slate-800 transition-colors duration-200">
                  {card.title}
                </p>
                {card.subtitle && (
                  <p className="text-xs text-slate-500 mt-1">{card.subtitle}</p>
                )}
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#F08344]/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          </Card>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.slice(4).map((card, index) => (
          <Card
            key={index}
            className="p-6 border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group relative overflow-hidden"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                <card.icon className="size-6 text-white transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-slate-900 group-hover:text-[#F08344] transition-colors duration-200">
                  {card.value}
                </p>
                <p className="text-sm font-medium text-slate-600 group-hover:text-slate-800 transition-colors duration-200">
                  {card.title}
                </p>
                {card.subtitle && (
                  <p className="text-xs text-slate-500 mt-1">{card.subtitle}</p>
                )}
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#F08344]/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          </Card>
        ))}
      </div>

      {/* Quick Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 border-gray-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Fleet Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Truck Utilization</span>
              <span className="font-semibold text-slate-900">
                {stats.totalTrucks > 0 ? Math.round((stats.activeTrucks / stats.totalTrucks) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Order Completion Rate</span>
              <span className="font-semibold text-slate-900">
                {stats.totalOrders > 0 ? Math.round((stats.completedTrips / stats.totalOrders) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Driver to Truck Ratio</span>
              <span className="font-semibold text-slate-900">
                {stats.totalTrucks > 0 ? (stats.totalDrivers / stats.totalTrucks).toFixed(1) : 0}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-gray-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Revenue Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Average per Trip</span>
              <span className="font-semibold text-slate-900">
                {stats.completedTrips > 0 ? `₹${Math.round(stats.monthlyEarnings / stats.completedTrips).toLocaleString()}` : '₹0'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Monthly Growth</span>
              <span className="font-semibold text-green-600">+12%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Active Revenue Streams</span>
              <span className="font-semibold text-slate-900">{stats.runningTrips + stats.upcomingTrips}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}