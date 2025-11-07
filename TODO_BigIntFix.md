# TODO: Fix BigInt Type Issues in Truck Owner Service

## Overview
Fix Prisma BigInt field type mismatches in `truck_owner.service.js` by wrapping all BigInt field usages with `BigInt()` to resolve 500 Internal Server Error when fetching drivers and trucks.

## Tasks
- [ ] Update `getDashboardStats` method: Wrap `assignedTruckOwnerId` with `BigInt()`
- [ ] Update `getTrucks` method: Wrap `truckOwnerId` with `BigInt()`
- [ ] Update `createTruck` method: Wrap `truckOwnerId` in data object with `BigInt()`
- [ ] Update `updateTruck` method: Wrap `id` and `truckOwnerId` in where clause with `BigInt()`
- [ ] Update `deleteTruck` method: Wrap `id` and `truckOwnerId` in where clause with `BigInt()`
- [ ] Update `getDrivers` method: Wrap `truckOwnerId` with `BigInt()`
- [ ] Update `createDriver` method: Wrap `truckOwnerId` in data object with `BigInt()`
- [ ] Update `updateDriver` method: Wrap `id` and `truckOwnerId` in where clause with `BigInt()`
- [ ] Update `deleteDriver` method: Wrap `id` and `truckOwnerId` in where clause with `BigInt()`
- [ ] Update `getAssignedOrders` method: Wrap `assignedTruckOwnerId` with `BigInt()`
- [ ] Update `updateOrderStatus` method: Wrap `assignedTruckOwnerId` with `BigInt()`
- [ ] Update `getProfile` method: Wrap `id` with `BigInt()`
- [ ] Update `updateProfile` method: Wrap `id` with `BigInt()`
- [ ] Update `getTrips` method: Wrap `truckOwnerId` with `BigInt()`

## Testing
- [ ] Test `/api/truck-owners/drivers` endpoint returns 200
- [ ] Test `/api/truck-owners/trucks` endpoint returns 200
- [ ] Verify data is correctly retrieved and displayed in frontend
