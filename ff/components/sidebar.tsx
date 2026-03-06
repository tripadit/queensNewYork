"use client"

import { Video, Activity, AlertTriangle, Users, ListChecks, Download, Settings2, LogOut, HelpCircle } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'

type PageType = "live-feed" | "analytics" | "monitoring" | "staff" | "logs" | "export" | "support" | "settings"

interface SidebarProps {
  onNavigate?: (page: PageType) => void
  currentPage?: PageType
}

export function Sidebar({ onNavigate, currentPage }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()

  const current = currentPage || (pathname === '/' ? 'live-feed' : (pathname.slice(1) as PageType))

  const handleNavigate = (page: PageType) => {
    if (onNavigate) {
      onNavigate(page)
    } else {
      router.push(page === 'live-feed' ? '/' : `/${page}`)
    }
  }

  const navItems = [
    { id: "live-feed", label: "Live Feed", icon: Video },
    { id: "analytics", label: "Analytics", icon: Activity },
    { id: "monitoring", label: "Monitoring", icon: AlertTriangle },
    { id: "staff", label: "Staff", icon: Users },
    { id: "logs", label: "Logs", icon: ListChecks },
    { id: "export", label: "Export", icon: Download },
  ]

  const bottomItems = [
    { id: "support", label: "Support", icon: HelpCircle },
    { id: "settings", label: "Settings", icon: Settings2 },
  ]

  return (
    <aside className="sticky top-20 h-[calc(100vh-8rem)] md:w-56 lg:w-64 bg-[#0A0A0A] rounded-xl hidden md:flex flex-col p-6 overflow-y-auto border border-white/5">
      <nav className="flex flex-col gap-3">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = current === item.id
          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id as PageType)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                isActive
                  ? 'bg-green-500/10 text-green-500'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/5 flex flex-col gap-3">
        {bottomItems.map((item) => {
          const Icon = item.icon
          const isActive = current === item.id
          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id as PageType)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                isActive
                  ? 'bg-green-500/10 text-green-500'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          )
        })}
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-white/5 hover:text-gray-200 transition-colors w-full">
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  )
}
