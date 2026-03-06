"use client"

import { DashboardMetrics } from "@/components/dashboard-metrics"
import { ExportAnalytics } from "@/components/export-analytics"
import { Download } from 'lucide-react'

export function ExportPage() {
  return (
    <div className="flex-1 flex flex-col gap-6 min-w-0">
      <div className="flex items-center gap-3 mb-2">
        <Download className="h-6 w-6 text-green-500" />
        <h1 className="text-2xl font-semibold text-white">Export & Reports</h1>
      </div>

      <DashboardMetrics />
      <ExportAnalytics />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0A0A0A] border border-white/5 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide text-gray-400">Scheduled Reports</h3>
          <div className="space-y-3">
            <div className="p-3 bg-white/5 border border-white/10 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Daily Summary</p>
                <p className="text-xs text-gray-500">Every day at 9:00 AM</p>
              </div>
              <input type="checkbox" className="w-4 h-4 accent-green-500" defaultChecked />
            </div>
            <div className="p-3 bg-white/5 border border-white/10 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Weekly Report</p>
                <p className="text-xs text-gray-500">Every Monday at 8:00 AM</p>
              </div>
              <input type="checkbox" className="w-4 h-4 accent-green-500" defaultChecked />
            </div>
            <div className="p-3 bg-white/5 border border-white/10 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Monthly Report</p>
                <p className="text-xs text-gray-500">First day of month at 12:00 PM</p>
              </div>
              <input type="checkbox" className="w-4 h-4 accent-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-[#0A0A0A] border border-white/5 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide text-gray-400">Export History</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-sm font-semibold text-white">analytics_2026-02-26.csv</p>
              <p className="text-xs text-gray-500">Today at 2:45 PM</p>
            </div>
            <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-sm font-semibold text-white">detections_2026-02-26.xlsx</p>
              <p className="text-xs text-gray-500">Today at 1:30 PM</p>
            </div>
            <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-sm font-semibold text-white">staff_report_2026-02-25.pdf</p>
              <p className="text-xs text-gray-500">Yesterday at 10:00 AM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
