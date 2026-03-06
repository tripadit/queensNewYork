"use client"

import { DashboardMetrics } from "@/components/dashboard-metrics"
import { DetectionLogs } from "@/components/detection-logs"
import { ListChecks } from 'lucide-react'

export function LogsPage() {
  return (
    <div className="flex-1 flex flex-col gap-6 min-w-0">
      <div className="flex items-center gap-3 mb-2">
        <ListChecks className="h-6 w-6 text-green-500" />
        <h1 className="text-2xl font-semibold text-white">Detection Logs</h1>
      </div>

      <DashboardMetrics />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DetectionLogs />
        </div>
        <div className="bg-[#0A0A0A] border border-white/5 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide text-gray-400">Filters</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Detection Type</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50">
                <option>All Types</option>
                <option>Person</option>
                <option>Loitering</option>
                <option>Unauthorized</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Time Range</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50">
                <option>Last 24 Hours</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Confidence</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50">
                <option>All Levels</option>
                <option>High (90%+)</option>
                <option>Medium (70-90%)</option>
                <option>Low (&lt;70%)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
