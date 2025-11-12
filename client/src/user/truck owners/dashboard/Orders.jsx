import React, { useState, useEffect } from 'react'
import { Card } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import { Truck, Package, MapPin, Calendar, DollarSign, User, CheckCircle, Clock, Edit, Eye, AlertCircle, Users, Phone, Star } from 'lucide-react'

const API_BASE_URL = 'http://localhost:7700/api'

export default function Orders() {
  const [assignedOrders, setAssignedOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [drivers, setDrivers] = useState([])
  const [trucks, setTrucks] = useState([])
  const [assignForm, setAssignForm] = useState({
    driverId: '',
    truckId: '',
    estimatedDeliveryDate: '',
    specialInstructions: ''
  })
  const [assignmentLoading, setAssignmentLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

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

  // Fetch assigned orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        console.log('Fetching orders...');
        const response = await fetch(`${API_BASE_URL}/truck-owners/orders`, {
          headers: getHeaders()
        })

        console.log('Orders response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Orders API error:', errorText);
          throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
        }

        const data = await response.json()
        console.log('Orders data:', data);
        
        if (data.success) {
          setAssignedOrders(data.data)
        } else {
          throw new Error(data.message || 'Failed to fetch orders')
        }
      } catch (err) {
        console.error('Error fetching orders:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  // Fetch drivers and trucks for assignment
  const fetchAssignmentData = async () => {
    try {
      setAssignmentLoading(true)
      console.log('Fetching drivers and trucks...');
      
      const [driversRes, trucksRes] = await Promise.all([
        fetch(`${API_BASE_URL}/truck-owners/drivers`, { 
          headers: getHeaders(),
          credentials: 'include'
        }),
        fetch(`${API_BASE_URL}/truck-owners/trucks`, { 
          headers: getHeaders(),
          credentials: 'include'
        })
      ])

      console.log('Drivers response status:', driversRes.status);
      console.log('Trucks response status:', trucksRes.status);

      // Check if responses are ok
      if (!driversRes.ok) {
        const driverError = await driversRes.text();
        console.error('Drivers API error:', driverError);
        throw new Error(`Drivers API failed: ${driversRes.status}`);
      }

      if (!trucksRes.ok) {
        const truckError = await trucksRes.text();
        console.error('Trucks API error:', truckError);
        throw new Error(`Trucks API failed: ${trucksRes.status}`);
      }

      const driversData = await driversRes.json()
      const trucksData = await trucksRes.json()
      
      console.log('Drivers data:', driversData);
      console.log('Trucks data:', trucksData);

      if (driversData.success) {
        setDrivers(driversData.data || [])
      } else {
        console.warn('Drivers API returned success: false', driversData)
        setDrivers([])
      }

      if (trucksData.success) {
        setTrucks(trucksData.data || [])
      } else {
        console.warn('Trucks API returned success: false', trucksData)
        setTrucks([])
      }

    } catch (err) {
      console.error('Error fetching assignment data:', err)
      setError(`Failed to load assignment data: ${err.message}`)
      // Set empty arrays to prevent UI from breaking
      setDrivers([])
      setTrucks([])
    } finally {
      setAssignmentLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border border-blue-200'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border border-green-200'
      case 'CONFIRMED':
        return 'bg-purple-100 text-purple-800 border border-purple-200'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="size-4 mr-1" />
      case 'IN_PROGRESS':
        return <Truck className="size-4 mr-1" />
      case 'COMPLETED':
        return <CheckCircle className="size-4 mr-1" />
      case 'CONFIRMED':
        return <CheckCircle className="size-4 mr-1" />
      default:
        return <Package className="size-4 mr-1" />
    }
  }

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/truck-owners/orders/${orderId}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update order status')
      }

      const data = await response.json()
      if (data.success) {
        setAssignedOrders(orders =>
          orders.map(order =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        )
        alert(`Order status updated to ${newStatus.replace('_', ' ')}`)
      }
    } catch (err) {
      setError(err.message)
      console.error('Error updating order status:', err)
    }
  }

  const handleAssignClick = async (order) => {
    setSelectedOrder(order)
    setAssignForm({ 
      driverId: '', 
      truckId: '',
      estimatedDeliveryDate: '',
      specialInstructions: ''
    })
    
    await fetchAssignmentData()
    setIsAssignModalOpen(true)
  }

  const handleAssignSubmit = async (e) => {
    e.preventDefault()
    if (!assignForm.driverId || !assignForm.truckId) {
      alert('Please select both driver and truck')
      return
    }

    setIsAssignModalOpen(false)
    setIsConfirmModalOpen(true)
  }

  const confirmAssignment = async () => {
    try {
      setAssignmentLoading(true)
      
      // Create trip assignment
      const tripData = {
        orderId: selectedOrder.id,
        driverId: parseInt(assignForm.driverId),
        truckId: parseInt(assignForm.truckId),
        fromLocation: selectedOrder.manufacturer?.location || 'Warehouse',
        toLocation: selectedOrder.deliveryAddress,
        status: 'UPCOMING',
        cargo: selectedOrder.items?.map(item => item.product?.name || item.manufacturerProduct?.name).join(', ') || 'General Cargo',
        estimatedDeliveryDate: assignForm.estimatedDeliveryDate || null,
        specialInstructions: assignForm.specialInstructions || ''
      }

      console.log('Creating trip assignment:', tripData);

      const response = await fetch(`${API_BASE_URL}/truck-owners/trips`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(tripData)
      })

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Trip assignment error:', errorText);
        throw new Error('Failed to assign trip')
      }

      const data = await response.json()
      if (data.success) {
        // Update order status to IN_PROGRESS
        await handleUpdateStatus(selectedOrder.id, 'IN_PROGRESS')
        setIsConfirmModalOpen(false)
        setSelectedOrder(null)
        alert('Trip assigned successfully!')
      }
    } catch (err) {
      setError(err.message)
      console.error('Error assigning trip:', err)
      alert('Failed to assign trip. Please try again.')
    } finally {
      setAssignmentLoading(false)
    }
  }

  const handleViewDetails = (order) => {
    setSelectedOrder(order)
  }

  // Filter orders based on search and status
  const filteredOrders = assignedOrders.filter(order => {
    const matchesSearch = 
      order.id.toString().includes(search.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      order.deliveryAddress?.toLowerCase().includes(search.toLowerCase()) ||
      order.manufacturer?.companyName?.toLowerCase().includes(search.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Truck className="size-12 text-[#F08344] mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600">Loading assigned orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2 group">
          <div className="w-10 h-10 bg-[#F08344] rounded-lg flex items-center justify-center">
            <Package className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Assigned Orders</h1>
            <p className="text-slate-600">Manage orders assigned to you for delivery</p>
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

      {/* Filter Bar */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search orders by ID, customer, or address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#F08344] focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="sm:w-64">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#F08344] focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Assigned Delivery Orders</h3>
          <p className="text-slate-600 text-sm mt-1">
            {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-4 px-6 font-medium text-slate-900">Order ID</th>
                <th className="text-left py-4 px-6 font-medium text-slate-900">Manufacturer</th>
                <th className="text-left py-4 px-6 font-medium text-slate-900">Customer</th>
                <th className="text-left py-4 px-6 font-medium text-slate-900">Items</th>
                <th className="text-left py-4 px-6 font-medium text-slate-900">Total Amount</th>
                <th className="text-left py-4 px-6 font-medium text-slate-900">Status</th>
                <th className="text-left py-4 px-6 font-medium text-slate-900">Order Date</th>
                <th className="text-left py-4 px-6 font-medium text-slate-900">Delivery Address</th>
                <th className="text-left py-4 px-6 font-medium text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center">
                    <Package className="size-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No Orders Found</h3>
                    <p className="text-slate-600">
                      {assignedOrders.length === 0 
                        ? "You don't have any orders assigned for delivery yet." 
                        : "No orders match your search criteria."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors group"
                  >
                    <td className="py-4 px-6 font-medium text-slate-900 group-hover:text-[#F08344] transition-colors">
                      #{order.id}
                    </td>
                    <td className="py-4 px-6 text-slate-900 group-hover:text-[#F08344] transition-colors">
                      <div className="flex items-center">
                        <Users className="size-4 mr-2 text-slate-400" />
                        {order.manufacturer?.companyName || 'Manufacturer'}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="font-medium text-slate-900 group-hover:text-[#F08344] transition-colors">
                          {order.customerName}
                        </div>
                        <div className="flex items-center text-sm text-slate-600">
                          <Phone className="size-3 mr-1" />
                          {order.customerPhone || order.customerEmail || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        {order.items?.slice(0, 2).map((item, index) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium text-slate-900">{item.product?.name || item.manufacturerProduct?.name || 'Product'}</span>
                            <span className="text-slate-600"> (Qty: {item.quantity})</span>
                          </div>
                        ))}
                        {order.items && order.items.length > 2 && (
                          <div className="text-xs text-slate-500">
                            +{order.items.length - 2} more items
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-900 group-hover:text-[#F08344] transition-colors">
                      <div className="flex items-center">
                        <DollarSign className="size-4 mr-1 text-green-600" />
                        ₹{order.totalAmount?.toLocaleString() || '0'}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600 group-hover:text-[#F08344] transition-colors">
                      <div className="flex items-center">
                        <Calendar className="size-4 mr-1 text-slate-400" />
                        {new Date(order.orderDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600 max-w-xs truncate group-hover:text-[#F08344] transition-colors">
                      <div className="flex items-start">
                        <MapPin className="size-4 mr-1 text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="truncate">{order.deliveryAddress}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {/* Show Assign button for both PENDING and CONFIRMED orders */}
                        {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                          <Button
                            onClick={() => handleAssignClick(order)}
                            className="bg-[#F08344] hover:bg-[#e07334] flex items-center"
                            size="sm"
                          >
                            <Truck className="size-4 mr-1" />
                            Assign
                          </Button>
                        )}
                        
                        {/* Show Complete button for IN_PROGRESS orders */}
                        {order.status === 'IN_PROGRESS' && (
                          <Button
                            onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                            className="bg-green-600 hover:bg-green-700 flex items-center"
                            size="sm"
                          >
                            <CheckCircle className="size-4 mr-1" />
                            Complete
                          </Button>
                        )}
                        
                        {/* Show nothing for COMPLETED orders */}
                        {order.status === 'COMPLETED' && (
                          <span className="text-sm text-gray-500">Completed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Delivery Modal */}
      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)}>
        {selectedOrder && (
          <>
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Truck className="size-6 mr-2 text-[#F08344]" />
              Assign Delivery - Order #{selectedOrder.id}
            </h2>
            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Driver *
                </label>
                <select
                  value={assignForm.driverId}
                  onChange={(e) => setAssignForm({ ...assignForm, driverId: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#F08344] focus:border-transparent"
                  required
                  disabled={assignmentLoading}
                >
                  <option value="">Choose a driver</option>
                  {drivers.length === 0 ? (
                    <option value="" disabled>No drivers available</option>
                  ) : (
                    drivers
                      .filter(driver => driver.status === 'AVAILABLE')
                      .map(driver => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name} - {driver.phone} {driver.rating && `(${driver.rating}⭐)`}
                        </option>
                      ))
                  )}
                </select>
                {drivers.filter(driver => driver.status === 'AVAILABLE').length === 0 && (
                  <p className="text-sm text-red-600 mt-1">No available drivers found</p>
                )}
                {drivers.length === 0 && (
                  <p className="text-sm text-yellow-600 mt-1">Could not load drivers list</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Truck *
                </label>
                <select
                  value={assignForm.truckId}
                  onChange={(e) => setAssignForm({ ...assignForm, truckId: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#F08344] focus:border-transparent"
                  required
                  disabled={assignmentLoading}
                >
                  <option value="">Choose a truck</option>
                  {trucks.length === 0 ? (
                    <option value="" disabled>No trucks available</option>
                  ) : (
                    trucks
                      .filter(truck => truck.status === 'ACTIVE' || truck.status === 'AVAILABLE')
                      .map(truck => (
                        <option key={truck.id} value={truck.id}>
                          {truck.truckNo} - {truck.type} ({truck.capacity})
                        </option>
                      ))
                  )}
                </select>
                {trucks.filter(truck => truck.status === 'ACTIVE' || truck.status === 'AVAILABLE').length === 0 && (
                  <p className="text-sm text-red-600 mt-1">No available trucks found</p>
                )}
                {trucks.length === 0 && (
                  <p className="text-sm text-yellow-600 mt-1">Could not load trucks list</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Delivery Date
                </label>
                <input
                  type="date"
                  value={assignForm.estimatedDeliveryDate}
                  onChange={(e) => setAssignForm({ ...assignForm, estimatedDeliveryDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#F08344] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Instructions
                </label>
                <textarea
                  value={assignForm.specialInstructions}
                  onChange={(e) => setAssignForm({ ...assignForm, specialInstructions: e.target.value })}
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#F08344] focus:border-transparent"
                  placeholder="Any special instructions for the driver..."
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                  <MapPin className="size-4 mr-2" />
                  Delivery Information
                </h4>
                <p className="text-sm text-blue-700">
                  <strong>From:</strong> {selectedOrder.manufacturer?.location || 'Warehouse'}
                </p>
                <p className="text-sm text-blue-700">
                  <strong>To:</strong> {selectedOrder.deliveryAddress}
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Cargo:</strong> {selectedOrder.items?.map(item => item.product?.name || item.manufacturerProduct?.name).join(', ') || 'General Cargo'}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  variant="outline"
                  disabled={assignmentLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#F08344] hover:bg-[#e07334] flex items-center"
                  disabled={assignmentLoading || !assignForm.driverId || !assignForm.truckId || drivers.length === 0 || trucks.length === 0}
                >
                  {assignmentLoading ? (
                    <>
                      <div className="animate-spin rounded-full size-4 border-b-2 border-white mr-2"></div>
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Truck className="size-4 mr-2" />
                      Assign Delivery
                    </>
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </Modal>

      {/* Confirmation Modal */}
      <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)}>
        {selectedOrder && (
          <>
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <CheckCircle className="size-6 mr-2 text-green-600" />
              Confirm Assignment
            </h2>
            <div className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  Are you sure you want to assign this delivery?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Driver</label>
                  <p className="text-sm text-gray-900">
                    {drivers.find(d => d.id === parseInt(assignForm.driverId))?.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Truck</label>
                  <p className="text-sm text-gray-900">
                    {trucks.find(t => t.id === parseInt(assignForm.truckId))?.truckNo || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Order</label>
                  <p className="text-sm text-gray-900">#{selectedOrder.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer</label>
                  <p className="text-sm text-gray-900">{selectedOrder.customerName}</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  onClick={() => setIsConfirmModalOpen(false)}
                  variant="outline"
                  disabled={assignmentLoading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={confirmAssignment}
                  className="bg-green-600 hover:bg-green-700 flex items-center"
                  disabled={assignmentLoading}
                >
                  {assignmentLoading ? (
                    <>
                      <div className="animate-spin rounded-full size-4 border-b-2 border-white mr-2"></div>
                      Assigning...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="size-4 mr-2" />
                      Confirm Assignment
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
        
      </Modal>
    </div>
  )
}