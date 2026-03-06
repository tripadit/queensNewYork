"use client"

import { DashboardMetrics } from "@/components/dashboard-metrics"
import { LiveFeed } from "@/components/live-feed"
import { LoiteringMonitoring } from "@/components/loitering-monitoring"
import { AlertTriangle } from 'lucide-react'

export function MonitoringPage() {
  return (
    <div className="flex-1 flex flex-col gap-6 min-w-0">
      <div className="flex items-center gap-3 mb-2">
        <AlertTriangle className="h-6 w-6 text-green-500" />
        <h1 className="text-2xl font-semibold text-white">Live Monitoring</h1>
      </div>

      <DashboardMetrics />
      <LiveFeed />
      <LoiteringMonitoring />
    </div>
  )
}
