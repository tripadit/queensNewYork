"use client"

import { HelpCircle, Mail, Phone, ExternalLink } from 'lucide-react'

export function SupportPage() {
  return (
    <div className="flex-1 flex flex-col gap-6 min-w-0">
      <div className="flex items-center gap-3 mb-2">
        <HelpCircle className="h-6 w-6 text-green-500" />
        <h1 className="text-2xl font-semibold text-white">Support & Help</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0A0A0A] border border-white/5 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide text-gray-400">Contact Support</h3>
          <div className="space-y-4">
            <a href="mailto:support@retailvision.com" className="flex items-start gap-4 p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all">
              <Mail className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-white">Email Support</p>
                <p className="text-xs text-gray-500">support@retailvision.com</p>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-500 ml-auto flex-shrink-0" />
            </a>

            <a href="tel:+1-800-123-4567" className="flex items-start gap-4 p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all">
              <Phone className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-white">Phone Support</p>
                <p className="text-xs text-gray-500">+1 (800) 123-4567</p>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-500 ml-auto flex-shrink-0" />
            </a>
          </div>
        </div>

        <div className="bg-[#0A0A0A] border border-white/5 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide text-gray-400">Resources</h3>
          <div className="space-y-2">
            <a href="#" className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all group">
              <span className="text-sm text-white font-medium">Documentation</span>
              <ExternalLink className="h-4 w-4 text-gray-500 group-hover:text-gray-300" />
            </a>
            <a href="#" className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all group">
              <span className="text-sm text-white font-medium">Video Tutorials</span>
              <ExternalLink className="h-4 w-4 text-gray-500 group-hover:text-gray-300" />
            </a>
            <a href="#" className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all group">
              <span className="text-sm text-white font-medium">FAQ</span>
              <ExternalLink className="h-4 w-4 text-gray-500 group-hover:text-gray-300" />
            </a>
            <a href="#" className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all group">
              <span className="text-sm text-white font-medium">Community Forum</span>
              <ExternalLink className="h-4 w-4 text-gray-500 group-hover:text-gray-300" />
            </a>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-6">
        <h3 className="font-semibold text-white mb-3">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <div>
              <p className="text-sm text-white font-medium">API</p>
              <p className="text-xs text-green-400">Operational</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <div>
              <p className="text-sm text-white font-medium">Services</p>
              <p className="text-xs text-green-400">All Systems</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <div>
              <p className="text-sm text-white font-medium">Database</p>
              <p className="text-xs text-green-400">Healthy</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
