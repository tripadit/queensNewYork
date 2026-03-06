import { Mail, Phone, MessageSquare, FileText, ArrowRight } from 'lucide-react'
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"

export default function SupportPage() {
  const supportChannels = [
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Send us an email and we\'ll respond within 24 hours',
      contact: 'support@retailvision.com'
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: 'Call our support team during business hours',
      contact: '+1 (555) 123-4567'
    },
    {
      icon: MessageSquare,
      title: 'Live Chat',
      description: 'Chat with our support team in real-time',
      contact: 'Available 9 AM - 6 PM EST'
    },
    {
      icon: FileText,
      title: 'Documentation',
      description: 'Access our comprehensive knowledge base',
      contact: 'View Docs'
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
              <h1 className="text-3xl font-semibold text-white mb-2">Support & Help</h1>
              <p className="text-gray-500 mb-8">Get assistance with your account and technical questions</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {supportChannels.map((channel) => {
                  const Icon = channel.icon
                  return (
                    <div key={channel.title} className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 hover:border-white/20 transition-all">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-green-500/10 rounded-lg">
                          <Icon className="w-6 h-6 text-green-500" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white mb-2">{channel.title}</h3>
                          <p className="text-sm text-gray-500 mb-4">{channel.description}</p>
                          <p className="text-sm font-medium text-green-400">{channel.contact}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500/10 to-green-500/5 border border-green-500/20 rounded-xl p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">Frequently Asked Questions</h2>
                  <p className="text-gray-500 text-sm">Find answers to common questions about using the dashboard</p>
                </div>
                <ArrowRight className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-8">
              <h2 className="text-xl font-semibold text-white mb-6">Common Topics</h2>
              <div className="space-y-3">
                {['Getting Started', 'Setting up Cameras', 'Configuring Alerts', 'User Management', 'Data Export', 'API Documentation'].map((topic) => (
                  <div key={topic} className="p-3 flex items-center justify-between hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
                    <span className="text-gray-400">{topic}</span>
                    <ArrowRight className="w-4 h-4 text-gray-600" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
