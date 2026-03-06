import { DashboardMetrics } from "@/components/dashboard-metrics"
import { StaffManagement } from "@/components/staff-management"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"

export default function StaffPage() {
  return (
    <div className="relative h-screen w-full bg-black text-white overflow-hidden">
      <Header />

      <div className="h-full overflow-y-auto no-scrollbar">
        <main className="flex gap-6 p-6 pt-24 min-h-full pb-6">
          <Sidebar />

          <div className="flex-1 flex flex-col gap-6 min-w-0">
            <DashboardMetrics />
            <StaffManagement />
          </div>
        </main>
      </div>
    </div>
  )
}
