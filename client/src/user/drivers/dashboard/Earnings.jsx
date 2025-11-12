import { useState } from 'react'
import { Card } from '../../../components/ui/Card'
import { DollarSign, Calendar, Clock, TrendingUp } from 'lucide-react'

export default function Earnings() {
  const [earnings, setEarnings] = useState({
    currentMonth: {
      total: 45000,
      trips: 12,
      averagePerTrip: 3750
    },
    pendingSettlements: 8500,
    recentTrips: [
      {
        id: 1,
        date: '2024-10-01',
        from: 'Chennai',
        to: 'Bangalore',
        amount: 8500,
        status: 'Settled'
      },
      
      
      {
        id: 2,
        date: '2024-09-28',
        from: 'Bangalore',
        to: 'Hyderabad',
        amount: 7200,
        status: 'Settled'
      },
      {
        id: 3,
        date: '2024-09-25',
        from: 'Mumbai',
        to: 'Delhi',
        amount: 6800,
        status: 'Pending'
      }
    ]
  })

  const settledTrips = earnings.recentTrips.filter(trip => trip.status === 'Settled')
  const pendingTrips = earnings.recentTrips.filter(trip => trip.status === 'Pending')

  // return (
  //   <div className="p-6 bg-slate-50 min-h-screen">
  //     {/* Header */}
  //     <div className="mb-8">
  //       <div className="flex items-center gap-3 mb-2 group">
  //         <div className="w-10 h-10 bg-[#F08344] rounded-lg flex items-center justify-center">
  //           <DollarSign className="size-5 text-white" />
  //         </div>
  //         <div>
  //           <h1 className="text-2xl font-bold text-slate-900">Earnings</h1>
  //           <p className="text-slate-600">Track your income and settlements</p>
  //         </div>
  //       </div>
  //     </div>

  //     {/* Summary Cards */}
  //     <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
  //       <Card className="p-6">
  //         <div className="flex items-center gap-4">
  //           <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
  //             <DollarSign className="size-6 text-white" />
  //           </div>
  //           <div>
  //             <p className="text-2xl font-bold text-slate-900">₹{earnings.currentMonth.total.toLocaleString()}</p>
  //             <p className="text-sm text-slate-600">This Month</p>
  //           </div>
  //         </div>
  //       </Card>
  //       <Card className="p-6">
  //         <div className="flex items-center gap-4">
  //           <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
  //             <Calendar className="size-6 text-white" />
  //           </div>
  //           <div>
  //             <p className="text-2xl font-bold text-slate-900">{earnings.currentMonth.trips}</p>
  //             <p className="text-sm text-slate-600">Trips Completed</p>
  //           </div>
  //         </div>
  //       </Card>
  //       <Card className="p-6">
  //         <div className="flex items-center gap-4">
  //           <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
  //             <TrendingUp className="size-6 text-white" />
  //           </div>
  //           <div>
  //             <p className="text-2xl font-bold text-slate-900">₹{earnings.currentMonth.averagePerTrip.toLocaleString()}</p>
  //             <p className="text-sm text-slate-600">Avg per Trip</p>
  //           </div>
  //         </div>
  //       </Card>
  //       <Card className="p-6">
  //         <div className="flex items-center gap-4">
  //           <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
  //             <Clock className="size-6 text-white" />
  //           </div>
  //           <div>
  //             <p className="text-2xl font-bold text-slate-900">₹{earnings.pendingSettlements.toLocaleString()}</p>
  //             <p className="text-sm text-slate-600">Pending</p>
  //           </div>
  //         </div>
  //       </Card>
  //     </div>

  //     {/* Recent Trips */}
  //     <div className="mb-8">
  //       <h2 className="text-xl font-semibold text-slate-900 mb-4">Recent Trips</h2>
  //       <div className="space-y-4">
  //         {earnings.recentTrips.map((trip) => (
  //           <Card key={trip.id} className="p-6">
  //             <div className="flex items-center justify-between">
  //               <div className="flex items-center gap-4">
  //                 <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
  //                   <Calendar className="size-5 text-blue-600" />
  //                 </div>
  //                 <div>
  //                   <h3 className="font-semibold text-slate-900">
  //                     {trip.from} → {trip.to}
  //                   </h3>
  //                   <p className="text-sm text-slate-600">{trip.date}</p>
  //                 </div>
  //               </div>
  //               <div className="text-right">
  //                 <p className="text-lg font-bold text-slate-900">₹{trip.amount.toLocaleString()}</p>
  //                 <span className={`px-2 py-1 rounded text-xs font-medium ${
  //                   trip.status === 'Settled' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
  //                 }`}>
  //                   {trip.status}
  //                 </span>
  //               </div>
  //             </div>
  //           </Card>
  //         ))}
  //       </div>
  //     </div>

  //     {/* Pending Settlements */}
  //     {pendingTrips.length > 0 && (
  //       <Card className="p-6">
  //         <h2 className="text-xl font-semibold text-slate-900 mb-4">Pending Settlements</h2>
  //         <div className="space-y-4">
  //           {pendingTrips.map((trip) => (
  //             <div key={trip.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
  //               <div>
  //                 <h3 className="font-semibold text-slate-900">
  //                   {trip.from} → {trip.to}
  //                 </h3>
  //                 <p className="text-sm text-slate-600">{trip.date}</p>
  //               </div>
  //               <div className="text-right">
  //                 <p className="text-lg font-bold text-slate-900">₹{trip.amount.toLocaleString()}</p>
  //                 <p className="text-sm text-yellow-600">Awaiting settlement</p>
  //               </div>
  //             </div>
  //           ))}
  //         </div>
  //         <div className="mt-4 p-4 bg-blue-50 rounded-lg">
  //           <p className="text-sm text-blue-800">
  //             <strong>Note:</strong> Settlements are processed within 7-10 business days after trip completion.
  //           </p>
  //         </div>
  //       </Card>
  //     )}
  //   </div>
  // )
}
