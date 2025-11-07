import React, { useState, useEffect } from 'react'
import { Card } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { Truck, MapPin, Calendar, Package, DollarSign, CheckCircle } from 'lucide-react'

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

  // Fetch assigned trips for driver
  useEffect(() => {
    const fetchAssignedTrips = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/drivers/trips`, {
          headers: getHeaders()
        })

        if (!response.ok) {
          throw new Error('Failed to fetch assigned trips')
        }

        const data = await response.json()
        if (data.success) {
          setAssignedTrips(data.data)
        } else {
          throw new Error(data.message || 'Failed to fetch trips')
        }
      } catch (err) {
        setError(err.message)
        console.error('Error fetching trips:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAssignedTrips()
  }, [])

  const updateTripStatus = async (tripId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/drivers/trips/${tripId}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update trip status')
      }

      const data = await response.json()
      if (data.success) {
        setAssignedTrips(trips =>
          trips.map(trip =>
            trip.id === tripId ? { ...trip, status: newStatus } : trip
          )
        )
      }
    } catch (err) {
      setError(err.message)
      console.error('Error updating trip status:', err)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'UPCOMING':
        return 'bg-blue-100 text-blue-800'
      case 'RUNNING':
        return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Truck className="size-12 text-blue-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading your assigned loads...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">My Assigned Loads</h1>
        <p className="text-gray-600">Manage your delivery assignments</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Assigned Trips */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignedTrips.length === 0 ? (
          <Card className="p-8 text-center col-span-full">
            <Truck className="size-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Assigned Loads</h3>
            <p className="text-gray-500">You don't have any loads assigned yet. Check back later.</p>
          </Card>
        ) : (
          assignedTrips.map(trip => (
            <Card key={trip.id} className="p-6 border-l-4 border-l-blue-500">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-gray-900">Trip #{trip.id}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                  {trip.status}
                </span>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mt-0.5" />
                  <div>
                    <p className="font-medium">From: {trip.fromLocation}</p>
                    <p className="font-medium">To: {trip.toLocation}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Package className="w-4 h-4" />
                  <span>Cargo: {trip.cargo}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Truck className="w-4 h-4" />
                  <span>Truck: {trip.truck?.truckNo}</span>
                </div>

                {trip.order && (
                  <div className="text-sm text-gray-600">
                    <p>Order: #{trip.order.id}</p>
                    <p>Customer: {trip.order.customerName}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {trip.status === 'UPCOMING' && (
                  <Button
                    onClick={() => updateTripStatus(trip.id, 'RUNNING')}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Truck className="size-4 mr-2" />
                    Start Trip
                  </Button>
                )}
                
                {trip.status === 'RUNNING' && (
                  <Button
                    onClick={() => updateTripStatus(trip.id, 'COMPLETED')}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <CheckCircle className="size-4 mr-2" />
                    Complete Trip
                  </Button>
                )}
                
                {trip.status === 'COMPLETED' && (
                  <div className="flex items-center gap-2 text-green-600 justify-center">
                    <CheckCircle className="size-4" />
                    <span className="text-sm font-medium">Trip Completed</span>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}