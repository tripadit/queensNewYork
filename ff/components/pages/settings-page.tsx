"use client"

import { Settings2, Toggle, Bell, Lock, Eye } from 'lucide-react'

export function SettingsPage() {
  return (
    <div className="flex-1 flex flex-col gap-6 min-w-0 max-w-4xl">
      <div className="flex items-center gap-3 mb-2">
        <Settings2 className="h-6 w-6 text-green-500" />
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
      </div>

      <div className="space-y-6">
        <div className="bg-[#0A0A0A] border border-white/5 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide text-gray-400">Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-semibold text-white">Alert Notifications</p>
                  <p className="text-xs text-gray-500">Receive alerts for critical events</p>
                </div>
              </div>
              <input type="checkbox" className="w-5 h-5 accent-green-500 cursor-pointer" defaultChecked />
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-semibold text-white">Email Notifications</p>
                  <p className="text-xs text-gray-500">Send notifications via email</p>
                </div>
              </div>
              <input type="checkbox" className="w-5 h-5 accent-green-500 cursor-pointer" />
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-semibold text-white">Push Notifications</p>
                  <p className="text-xs text-gray-500">Receive mobile push alerts</p>
                </div>
              </div>
              <input type="checkbox" className="w-5 h-5 accent-green-500 cursor-pointer" defaultChecked />
            </div>
          </div>
        </div>

        <div className="bg-[#0A0A0A] border border-white/5 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide text-gray-400">Display</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-semibold text-white">Dark Mode</p>
                  <p className="text-xs text-gray-500">Currently enabled</p>
                </div>
              </div>
              <input type="checkbox" className="w-5 h-5 accent-green-500 cursor-pointer" defaultChecked disabled />
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
              <div>
                <p className="text-sm font-semibold text-white">Refresh Rate</p>
                <p className="text-xs text-gray-500">Dashboard update frequency</p>
              </div>
              <select className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-green-500/50">
                <option>Every 5 seconds</option>
                <option selected>Every 10 seconds</option>
                <option>Every 30 seconds</option>
                <option>Every 1 minute</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-[#0A0A0A] border border-white/5 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide text-gray-400">Security</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-semibold text-white">Two-Factor Authentication</p>
                  <p className="text-xs text-gray-500">Enhance account security</p>
                </div>
              </div>
              <button className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded hover:bg-green-500/30 transition-colors">
                Configure
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-semibold text-white">Change Password</p>
                  <p className="text-xs text-gray-500">Update your account password</p>
                </div>
              </div>
              <button className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded hover:bg-green-500/30 transition-colors">
                Change
              </button>
            </div>
          </div>
        </div>

        <div className="bg-[#0A0A0A] border border-white/5 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide text-gray-400">API Access</h3>
          <div className="space-y-4">
            <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">API Key</p>
              <div className="flex items-center gap-2">
                <code className="text-xs text-gray-400 font-mono truncate">sk_live_xxxxxxxxxxxxxxxxxxx</code>
                <button className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors">
                  Copy
                </button>
              </div>
            </div>
            <button className="w-full px-4 py-2 bg-red-500/20 text-red-400 text-sm font-semibold rounded hover:bg-red-500/30 transition-colors">
              Regenerate API Key
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
