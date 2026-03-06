"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { LiveFeedPage } from "@/components/pages/live-feed-page"
import { AnalyticsPage } from "@/components/pages/analytics-page"
import { MonitoringPage } from "@/components/pages/monitoring-page"
import { StaffPage } from "@/components/pages/staff-page"
import { LogsPage } from "@/components/pages/logs-page"
import { ExportPage } from "@/components/pages/export-page"
import { SupportPage } from "@/components/pages/support-page"
import { SettingsPage } from "@/components/pages/settings-page"

type PageType = "live-feed" | "analytics" | "monitoring" | "staff" | "logs" | "export" | "support" | "settings"

export function DashboardContainer() {
  const [currentPage, setCurrentPage] = useState<PageType>("live-feed")

  const renderPage = () => {
    switch (currentPage) {
      case "analytics":
        return <AnalyticsPage />
      case "monitoring":
        return <MonitoringPage />
      case "staff":
        return <StaffPage />
      case "logs":
        return <LogsPage />
      case "export":
        return <ExportPage />
      case "support":
        return <SupportPage />
      case "settings":
        return <SettingsPage />
      case "live-feed":
      default:
        return <LiveFeedPage />
    }
  }

  return (
    <div className="relative h-screen w-full bg-black text-white overflow-hidden">
      <Header />

      {/* Main Scrollable Area */}
      <div className="h-full overflow-y-auto no-scrollbar">
        <main className="flex gap-6 p-6 pt-24 min-h-full pb-6">
          <Sidebar onNavigate={setCurrentPage} currentPage={currentPage} />

          {/* Main Content Container */}
          {renderPage()}
        </main>
      </div>
    </div>
  )
}
