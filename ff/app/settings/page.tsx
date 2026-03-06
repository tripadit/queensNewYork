import { Bell, Lock, Users, Zap, Database, Eye } from 'lucide-react'
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"

export default function SettingsPage() {
  const settingSections = [
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Manage alert and notification preferences',
      items: ['Email Alerts', 'SMS Notifications', 'In-App Alerts', 'Alert Frequency']
    },
    {
      icon: Lock,
      title: 'Security',
      description: 'Control account security and access settings',
      items: ['Change Password', 'Two-Factor Authentication', 'API Keys', 'Login History']
    },
    {
      icon: Users,
      title: 'Team Management',
      description: 'Manage team members and their permissions',
      items: ['Add Members', 'Role Assignments', 'Permissions', 'Team Activity']
    },
    {
      icon: Eye,
      title: 'Camera Settings',
      description: 'Configure camera and detection parameters',
      items: ['Camera Groups', 'Detection Zones', 'Sensitivity', 'Recording Settings']
    },
    {
      icon: Zap,
      title: 'System',
      description: 'System-wide configuration and preferences',
      items: ['Time Zone', 'Date Format', 'Units', 'Language']
    },
    {
      icon: Database,
      title: 'Data Management',
      description: 'Manage your data storage and retention',
      items: ['Storage Settings', 'Retention Policies', 'Backup', 'Data Export']
    }
  ]

  return (
    <div className="relative h-screen w-full bg-black text-white overflow-hidden">
      <Header />

      <div className="h-full overflow-y-auto no-scrollbar">
        <main className="flex gap-6 p-6 pt-24 min-h-full pb-6">
          <Sidebar />

          <div className="flex-1 flex flex-col gap-6 min-w-0 max-w-4xl">
            <div className="bg-[#0A0A0A] border border-white/5 rounded-xl p-8">
              <h1 className="text-3xl font-semibold text-white mb-2">Settings</h1>
              <p className="text-gray-500">Manage your account and system preferences</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {settingSections.map((section) => {
                const Icon = section.icon
                return (
                  <div key={section.title} className="bg-[#0A0A0A] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-3 bg-green-500/10 rounded-lg">
                        <Icon className="w-6 h-6 text-green-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{section.title}</h3>
                        <p className="text-sm text-gray-500">{section.description}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {section.items.map((item) => (
                        <div key={item} className="text-sm text-gray-400 hover:text-gray-300 cursor-pointer transition-colors p-2 rounded hover:bg-white/5 flex items-center justify-between">
                          <span>{item}</span>
                          <span className="text-gray-600">→</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-8">
              <h2 className="text-lg font-semibold text-white mb-4">Account Information</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div>
                    <p className="text-sm text-gray-500">Account Status</p>
                    <p className="text-white font-medium">Active</p>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div>
                    <p className="text-sm text-gray-500">Subscription Plan</p>
                    <p className="text-white font-medium">Professional</p>
                  </div>
                  <button className="text-sm px-3 py-1.5 bg-green-500/10 text-green-400 rounded hover:bg-green-500/20 transition-colors">
                    Manage
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Last Login</p>
                    <p className="text-white font-medium">Today at 10:30 AM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
