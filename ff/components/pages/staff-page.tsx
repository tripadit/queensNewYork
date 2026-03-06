"use client"

import { DashboardMetrics } from "@/components/dashboard-metrics"
import { StaffManagement } from "@/components/staff-management"
import { Users } from 'lucide-react'

export function StaffPage() {
  return (
    <div className="flex-1 flex flex-col gap-6 min-w-0">
      <div className="flex items-center gap-3 mb-2">
        <Users className="h-6 w-6 text-green-500" />
        <h1 className="text-2xl font-semibold text-white">Staff Management</h1>
      </div>

      <DashboardMetrics />
      <StaffManagement />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#0A0A0A] border border-white/5 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide text-gray-400">Shifts Today</h3>
          <div className="space-y-3">
            <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-sm font-semibold text-white">Morning Shift</p>
              <p className="text-xs text-gray-500">6:00 AM - 2:00 PM</p>
            </div>
            <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-sm font-semibold text-white">Afternoon Shift</p>
              <p className="text-xs text-gray-500">2:00 PM - 10:00 PM</p>
            </div>
            <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-sm font-semibold text-white">Night Shift</p>
              <p className="text-xs text-gray-500">10:00 PM - 6:00 AM</p>
            </div>
          </div>
        </div>

        <div className="bg-[#0A0A0A] border border-white/5 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide text-gray-400">Performance Metrics</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
              <span className="text-sm text-gray-400">Avg Response Time</span>
              <span className="text-sm font-semibold text-green-400">2.3s</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
              <span className="text-sm text-gray-400">Detection Accuracy</span>
              <span className="text-sm font-semibold text-green-400">94.8%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
              <span className="text-sm text-gray-400">Incidents Handled</span>
              <span className="text-sm font-semibold text-green-400">12</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
