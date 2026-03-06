"use client"

import { Activity, Users, AlertTriangle, Eye } from 'lucide-react'
import { api } from '@/lib/api-client'
import { usePolling } from '@/hooks/use-polling'

export function DashboardMetrics() {
  const { data: summary } = usePolling(api.getAnalyticsSummary, 5000);
  const { data: staffStats } = usePolling(api.getStaffStats, 2000);

  const activeCameras = 1 // Hardcoded to 1 since current backend supports 1 stream
  
  const activeStaff = staffStats ? staffStats.Staff || 0 : 0
  const totalDetections = staffStats 
    ? (staffStats.Staff || 0) + (staffStats.Customer || 0) + (staffStats.Unknown || 0)
    : 0
    
  const uniqueVisitors = summary ? summary.unique_visitors_today : 0
  const totalVisits = summary ? summary.total_visits_today : 0

  return (
    <div className="flex flex-col xl:flex-row gap-8 xl:items-center justify-between p-8 bg-gradient-to-br from-[#0D0D0D] to-[#0A0A0A] rounded-xl border border-white/5">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-gray-500">
          <Activity className="h-5 w-5" />
          <span className="text-sm font-medium uppercase tracking-wide">System Status</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-4xl md:text-3xl lg:text-4xl font-semibold text-white">Active</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="flex flex-col gap-1 p-4 rounded-lg bg-white/5 border border-white/10">
          <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Today's Visitors</span>
          <span className="text-xl font-semibold text-white mt-1">{uniqueVisitors}</span>
        </div>
        <div className="flex flex-col gap-1 p-4 rounded-lg bg-white/5 border border-white/10">
          <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Active Detections</span>
          <span className="text-xl font-semibold text-green-400 mt-1">{totalDetections}</span>
        </div>
        <div className="flex flex-col gap-1 p-4 rounded-lg bg-white/5 border border-white/10">
          <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Staff On Duty</span>
          <span className="text-xl font-semibold text-green-400 mt-1">{activeStaff}</span>
        </div>
        <div className="flex flex-col gap-1 p-4 rounded-lg bg-white/5 border border-white/10">
          <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Total Visits</span>
          <span className="text-xl font-semibold text-green-400 mt-1">{totalVisits}</span>
        </div>
      </div>
    </div>
  )
}
