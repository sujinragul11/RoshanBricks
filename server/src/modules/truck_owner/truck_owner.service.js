// Use shared prisma instance when available to avoid multiple clients
let prisma
try {
  prisma = require('../../shared/lib/db.js')
} catch (e) {
  // Fallback to direct PrismaClient if shared instance not available
  const { PrismaClient } = require('@prisma/client')
  prisma = new PrismaClient()
}

class TruckOwnerService {
  // Dashboard Stats - Fixed to work with correct models
  async getDashboardStats(actingLabourId) {
    try {
      console.log('Fetching dashboard stats for acting labour ID:', actingLabourId);

      // Get total orders assigned to this truck owner
      const totalOrders = await prisma.order.count({
        where: {
          assignedTruckOwnerId: actingLabourId
        }
      });

      // Get orders by status
      const completedOrders = await prisma.order.count({
        where: {
          assignedTruckOwnerId: actingLabourId,
          status: 'COMPLETED'
        }
      });

      const pendingOrders = await prisma.order.count({
        where: {
          assignedTruckOwnerId: actingLabourId,
          status: 'PENDING'
        }
      });

      const inProgressOrders = await prisma.order.count({
        where: {
          assignedTruckOwnerId: actingLabourId,
          status: 'IN_PROGRESS'
        }
      });

      // Get total trucks
      const totalTrucks = await prisma.truckOwnerTruck.count({
        where: {
          truckOwnerId: actingLabourId
        }
      });

      // Get total drivers
      const totalDrivers = await prisma.truckOwnerDriver.count({
        where: {
          truckOwnerId: actingLabourId
        }
      });

      // Get total trips
      const totalTrips = await prisma.trip.count({
        where: {
          truckOwnerId: actingLabourId
        }
      });

      // Get trips by status - fixed to use correct enum values
      const runningTrips = await prisma.trip.count({
        where: {
          truckOwnerId: actingLabourId,
          status: 'RUNNING'
        }
      });

      const upcomingTrips = await prisma.trip.count({
        where: {
          truckOwnerId: actingLabourId,
          status: 'UPCOMING'
        }
      });

      const completedTrips = await prisma.trip.count({
        where: {
          truckOwnerId: actingLabourId,
          status: 'COMPLETED'
        }
      });

      // Get recent orders
      const recentOrders = await prisma.order.findMany({
        where: {
          assignedTruckOwnerId: actingLabourId
        },
        include: {
          manufacturer: {
            include: {
              user: {
                include: {
                  profile: true
                }
              }
            }
          },
          items: {
            include: {
              product: true
            }
          }
        },
        orderBy: {
          orderDate: 'desc'
        },
        take: 5
      });

      // Get truck owner profile
      const truckOwner = await prisma.actingLabour.findUnique({
        where: {
          id: actingLabourId
        }
      });

      return {
        overview: {
          totalOrders,
          completedOrders,
          pendingOrders,
          inProgressOrders,
          totalTrucks,
          totalDrivers,
          totalTrips,
          runningTrips,
          upcomingTrips,
          completedTrips,
          completionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0
        },
        recentOrders,
        truckOwner: {
          name: truckOwner?.name || 'Truck Owner',
          rating: truckOwner?.rating || 0,
          status: truckOwner?.status || 'AVAILABLE',
          experience: truckOwner?.experience || 0
        }
      };
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      
      // Return default stats if there's an error
      if (error.code === 'P2021' || error.code === '42P01' || /relation .* does not exist/i.test(error.message || '')) {
        console.log('Database tables not found, returning default stats');
        return {
          overview: {
            totalOrders: 0,
            completedOrders: 0,
            pendingOrders: 0,
            inProgressOrders: 0,
            totalTrucks: 0,
            totalDrivers: 0,
            totalTrips: 0,
            runningTrips: 0,
            upcomingTrips: 0,
            completedTrips: 0,
            completionRate: 0
          },
          recentOrders: [],
          truckOwner: {
            name: 'Truck Owner',
            rating: 0,
            status: 'AVAILABLE',
            experience: 0
          }
        };
      }
      
      throw new Error(`Failed to get dashboard stats: ${error.message}`);
    }
  }

  // Truck CRUD Operations - TEMPORARY FIX: Remove truckOwnerId filter
  async getTrucks(actingLabourId) {
    try {
      console.log('Getting trucks for actingLabourId:', actingLabourId);
      
      // TEMPORARY FIX: Return all trucks without filtering by truckOwnerId
      // This will work until we fix the database relationships
      const trucks = await prisma.truckOwnerTruck.findMany({
        orderBy: { createdAt: 'desc' }
      });
      
      console.log('Found trucks:', trucks.length);
      return trucks;
    } catch (error) {
      console.error('Error in getTrucks:', error);
      if (error.code === 'P2021' || error.code === '42P01') {
        return [];
      }
      throw new Error(`Failed to get trucks: ${error.message}`);
    }
  }

  async createTruck(actingLabourId, truckData) {
    try {
      // Check for duplicate truck number
      const existingTruck = await prisma.truckOwnerTruck.findUnique({
        where: { truckNo: truckData.truckNo }
      });
      
      if (existingTruck) {
        throw new Error('Truck number already exists');
      }

      return await prisma.truckOwnerTruck.create({
        data: {
          ...truckData,
          truckOwnerId: actingLabourId
        }
      });
    } catch (error) {
      console.error('Error in createTruck:', error);
      throw new Error(`Failed to create truck: ${error.message}`);
    }
  }

  async updateTruck(truckId, actingLabourId, truckData) {
    try {
      // Verify ownership
      const truck = await prisma.truckOwnerTruck.findFirst({
        where: { id: truckId, truckOwnerId: actingLabourId }
      });

      if (!truck) {
        throw new Error('Truck not found or access denied');
      }

      // Check for duplicate truck number if changing
      if (truckData.truckNo && truckData.truckNo !== truck.truckNo) {
        const existingTruck = await prisma.truckOwnerTruck.findUnique({
          where: { truckNo: truckData.truckNo }
        });
        
        if (existingTruck) {
          throw new Error('Truck number already exists');
        }
      }

      return await prisma.truckOwnerTruck.update({
        where: { id: truckId },
        data: truckData
      });
    } catch (error) {
      console.error('Error in updateTruck:', error);
      throw new Error(`Failed to update truck: ${error.message}`);
    }
  }

  async deleteTruck(truckId, actingLabourId) {
    try {
      // Verify ownership and check for active trips
      const truck = await prisma.truckOwnerTruck.findFirst({
        where: { 
          id: truckId, 
          truckOwnerId: actingLabourId 
        },
        include: { 
          trips: {
            where: {
              status: { in: ['UPCOMING', 'RUNNING'] }
            }
          }
        }
      });

      if (!truck) {
        throw new Error('Truck not found or access denied');
      }

      if (truck.trips.length > 0) {
        throw new Error('Cannot delete truck with active trips');
      }

      return await prisma.truckOwnerTruck.delete({
        where: { id: truckId }
      });
    } catch (error) {
      console.error('Error in deleteTruck:', error);
      throw new Error(`Failed to delete truck: ${error.message}`);
    }
  }

  // Driver Management - TEMPORARY FIX: Remove truckOwnerId filter
  async getDrivers(actingLabourId) {
    try {
      console.log('Getting drivers for actingLabourId:', actingLabourId);
      
      // TEMPORARY FIX: Return all drivers without filtering by truckOwnerId
      // This will work until we fix the database relationships
      const drivers = await prisma.truckOwnerDriver.findMany({
        orderBy: { createdAt: 'desc' }
      });
      
      console.log('Found drivers:', drivers.length);
      return drivers;
    } catch (error) {
      console.error('Error in getDrivers:', error);
      if (error.code === 'P2021' || error.code === '42P01') {
        return [];
      }
      throw new Error(`Failed to get drivers: ${error.message}`);
    }
  }

  async createDriver(actingLabourId, driverData) {
    try {
      return await prisma.truckOwnerDriver.create({
        data: {
          ...driverData,
          truckOwnerId: actingLabourId
        }
      });
    } catch (error) {
      console.error('Error in createDriver:', error);
      throw new Error(`Failed to create driver: ${error.message}`);
    }
  }

  async updateDriver(driverId, actingLabourId, driverData) {
    try {
      // Verify ownership
      const driver = await prisma.truckOwnerDriver.findFirst({
        where: { 
          id: driverId, 
          truckOwnerId: actingLabourId 
        }
      });

      if (!driver) {
        throw new Error('Driver not found or access denied');
      }

      return await prisma.truckOwnerDriver.update({
        where: { id: driverId },
        data: driverData
      });
    } catch (error) {
      console.error('Error in updateDriver:', error);
      throw new Error(`Failed to update driver: ${error.message}`);
    }
  }

  async deleteDriver(driverId, actingLabourId) {
    try {
      // Verify ownership and check for active trips
      const driver = await prisma.truckOwnerDriver.findFirst({
        where: { 
          id: driverId, 
          truckOwnerId: actingLabourId 
        },
        include: {
          trips: {
            where: {
              status: { in: ['UPCOMING', 'RUNNING'] }
            }
          }
        }
      });

      if (!driver) {
        throw new Error('Driver not found or access denied');
      }

      if (driver.trips.length > 0) {
        throw new Error('Cannot delete driver with active trips');
      }

      return await prisma.truckOwnerDriver.delete({
        where: { id: driverId }
      });
    } catch (error) {
      console.error('Error in deleteDriver:', error);
      throw new Error(`Failed to delete driver: ${error.message}`);
    }
  }

  // Order Management
  async getAssignedOrders(actingLabourId) {
    try {
      return await prisma.order.findMany({
        where: { assignedTruckOwnerId: actingLabourId },
        include: {
          items: {
            include: {
              product: true
            }
          },
          manufacturer: {
            include: {
              user: {
                include: {
                  profile: true
                }
              }
            }
          }
        },
        orderBy: { orderDate: 'desc' }
      });
    } catch (error) {
      console.error('Error in getAssignedOrders:', error);
      if (error.code === 'P2021' || error.code === '42P01') {
        return [];
      }
      throw new Error(`Failed to get assigned orders: ${error.message}`);
    }
  }

  async updateOrderStatus(orderId, actingLabourId, status) {
    try {
      // FIX: Use string ID directly (since your order IDs are strings)
      const order = await prisma.order.findFirst({
        where: { 
          id: orderId, // Use string ID directly
          assignedTruckOwnerId: actingLabourId 
        }
      });

      if (!order) {
        throw new Error('Order not found or not assigned to you');
      }

      return await prisma.order.update({
        where: { id: orderId }, // Use string ID directly
        data: { status }
      });
    } catch (error) {
      console.error('Error in updateOrderStatus:', error);
      throw new Error(`Failed to update order status: ${error.message}`);
    }
  }

  // Trip Management
  async getTrips(actingLabourId) {
    try {
      return await prisma.trip.findMany({
        where: { truckOwnerId: actingLabourId },
        include: {
          truck: true,
          driver: true,
          order: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('Error in getTrips:', error);
      if (error.code === 'P2021' || error.code === '42P01') {
        return [];
      }
      throw new Error(`Failed to get trips: ${error.message}`);
    }
  }

  // Create Trip - FIXED: Handle string order IDs properly
  async createTrip(actingLabourId, tripData) {
    try {
      const { orderId, driverId, truckId, fromLocation, toLocation, status, cargo, estimatedDeliveryDate, specialInstructions } = tripData;

      console.log('Creating trip with data:', { actingLabourId, tripData });

      // Verify driver exists
      const driver = await prisma.truckOwnerDriver.findUnique({
        where: { id: parseInt(driverId) }
      });

      if (!driver) {
        throw new Error('Driver not found');
      }

      // Verify truck exists
      const truck = await prisma.truckOwnerTruck.findUnique({
        where: { id: parseInt(truckId) }
      });

      if (!truck) {
        throw new Error('Truck not found');
      }

      // FIX: Use string order ID directly (no parseInt)
      const order = await prisma.order.findFirst({
        where: { 
          id: orderId, // Use string ID directly
          assignedTruckOwnerId: actingLabourId
        }
      });

      if (!order) {
        throw new Error('Order not found or not assigned to you');
      }

      // Create the trip - FIX: Use string order ID
      const trip = await prisma.trip.create({
        data: {
          orderId: orderId, // Use string ID directly
          driverId: parseInt(driverId),
          truckId: parseInt(truckId),
          truckOwnerId: actingLabourId,
          fromLocation,
          toLocation,
          status: status || 'UPCOMING',
          cargo,
          estimatedDeliveryDate: estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : null,
          specialInstructions
        }
      });

      // Update order status to IN_PROGRESS - FIX: Use string order ID
      await prisma.order.update({
        where: {
          id: orderId // Use string ID directly
        },
        data: {
          status: 'IN_PROGRESS'
        }
      });

      return trip;
    } catch (error) {
      console.error('Error in createTrip:', error);
      throw new Error(`Failed to create trip: ${error.message}`);
    }
  }

  // Profile Management
  async getProfile(actingLabourId) {
    try {
      const truckOwner = await prisma.actingLabour.findUnique({
        where: { id: actingLabourId }
      });

      if (!truckOwner) {
        throw new Error('Profile not found');
      }

      return {
        id: truckOwner.id,
        name: truckOwner.name,
        type: truckOwner.type,
        phone: truckOwner.phone,
        email: truckOwner.email,
        location: truckOwner.location,
        status: truckOwner.status,
        experience: truckOwner.experience,
        rating: truckOwner.rating,
        assignedToId: truckOwner.assignedToId,
        assignedToType: truckOwner.assignedToType,
        assignedAt: truckOwner.assignedAt,
        createdAt: truckOwner.createdAt,
        updatedAt: truckOwner.updatedAt
      };
    } catch (error) {
      console.error('Error in getProfile:', error);
      throw new Error(`Failed to get profile: ${error.message}`);
    }
  }

  async updateProfile(actingLabourId, profileData) {
    try {
      const truckOwner = await prisma.actingLabour.findUnique({
        where: { id: actingLabourId }
      });

      if (!truckOwner) {
        throw new Error('Profile not found');
      }

      return await prisma.actingLabour.update({
        where: { id: actingLabourId },
        data: profileData
      });
    } catch (error) {
      console.error('Error in updateProfile:', error);
      throw new Error(`Failed to update profile: ${error.message}`);
    }
  }
}

module.exports = new TruckOwnerService();