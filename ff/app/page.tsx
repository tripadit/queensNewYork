import { DashboardMetrics } from "@/components/dashboard-metrics"
import { LiveFeed } from "@/components/live-feed"
import { VisitorAnalytics } from "@/components/visitor-analytics"
import { DemographicsAnalytics } from "@/components/demographics-analytics"
import { LoiteringMonitoring } from "@/components/loitering-monitoring"
import { StaffManagement } from "@/components/staff-management"
import { DetectionLogs } from "@/components/detection-logs"
import { TickerList } from "@/components/ticker-list"
import { ExportAnalytics } from "@/components/export-analytics"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"

export default function Dashboard() {
  return (
    <div className="relative h-screen w-full bg-black text-white overflow-hidden">
      <Header />

      {/* Main Scrollable Area */}
      <div className="h-full overflow-y-auto no-scrollbar">
        <main className="flex gap-6 p-6 pt-24 min-h-full pb-6">
          <Sidebar />

          {/* Main Content Container */}
          <div className="flex-1 flex flex-col gap-6 min-w-0">
            {/* Metrics Section */}
            <DashboardMetrics />

            {/* Live Feed Section */}
            <LiveFeed />

            {/* Analytics and Demographics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <VisitorAnalytics />
              <DemographicsAnalytics />
            </div>

            {/* Top Customers Section */}
            <div className="grid grid-cols-1 gap-6">
              <TickerList />
            </div>

            {/* Loitering Monitoring Section - Full Width */}
            <LoiteringMonitoring />

            {/* Staff and Logs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <StaffManagement />
              <DetectionLogs />
            </div>

            {/* Export Section */}
            <ExportAnalytics />
          </div>
        </main>
      </div>
    </div>
  )
}
