"use client"

import { DashboardMetrics } from "@/components/dashboard-metrics"
import { VisitorAnalytics } from "@/components/visitor-analytics"
import { BarChart3 } from 'lucide-react'

export function AnalyticsPage() {
  return (
    <div className="flex-1 flex flex-col gap-6 min-w-0">
      <div className="flex items-center gap-3 mb-2">
        <BarChart3 className="h-6 w-6 text-green-500" />
        <h1 className="text-2xl font-semibold text-white">Analytics Overview</h1>
      </div>

      <DashboardMetrics />
      <VisitorAnalytics />

      <div className="bg-[#0A0A0A] border border-white/5 rounded-xl p-8 text-center">
        <p className="text-gray-400">Additional analytics features coming soon</p>
      </div>
    </div>
  )
}
