"use client"

import React, { useState, useEffect } from 'react'
import { 
  Settings2, 
  LogOut, 
  User, 
  Bell, 
  Shield, 
  Cpu, 
  Globe, 
  Lock,
  ChevronDown
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from '@/lib/utils'

export function Header() {
  const [mounted, setMounted] = useState(false)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-3">
      <div className="mx-auto flex items-center justify-between bg-black/40 backdrop-blur-3xl border border-white/10 rounded-2xl px-6 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        
        {/* Left Section: Branding */}
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-green-500/20 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-black text-white tracking-[0.2em] leading-none uppercase">
              SEETHOS <span className="text-green-500 italic">VISION</span>
            </h1>
            <p className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.3em] mt-1">Intelligence Store Analytics</p>
          </div>
        </div>

        {/* Center Section: Live Feed Status (Visible on Desktop) */}
        <div className="hidden lg:flex items-center gap-8">
          <div className="flex items-center gap-3 px-4 py-1.5 bg-green-500/5 border border-green-500/10 rounded-full">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Network Secure</span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <div className="flex items-center gap-2">
              <Shield className="w-3 h-3 text-green-500" />
              <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Encrypted Stream</span>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <p className="text-[9px] font-black text-green-500 uppercase tracking-widest mb-0.5">Live Data Feed</p>
            <p className="text-sm font-mono font-black text-white tracking-widest">
              {mounted ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : "--:--:--"}
            </p>
          </div>
        </div>

        {/* Right Section: Actions & User */}
        <div className="flex items-center gap-4">
          
          {/* Calendar/Date (Hidden on small screens) */}
          <div className="hidden md:flex flex-col items-end border-r border-white/10 pr-4 mr-2">
            <p className="text-[9px] font-bold text-gray-500 uppercase">{mounted ? time.toLocaleDateString([], { weekday: 'short' }) : "---"}</p>
            <p className="text-[11px] font-bold text-white uppercase tracking-tight">
              {mounted ? time.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }) : "-- --- ----"}
            </p>
          </div>

          {mounted && (
            <div className="flex items-center gap-3">
              {/* Alert Bell */}
              <button className="relative group p-2.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 rounded-xl transition-all">
                <Bell className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0A0A0A] shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              </button>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="group flex items-center gap-3 pl-1 pr-3 py-1 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-2xl transition-all outline-none">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-[10px] font-black text-white leading-none">ROOT_ADMIN</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Lock className="w-2 h-2 text-green-500" />
                        <p className="text-[8px] font-bold text-green-500 uppercase tracking-tighter">Level 4 Access</p>
                      </div>
                    </div>
                    <ChevronDown className="w-3 h-3 text-gray-500 group-hover:text-white transition-colors" />
                  </button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent align="end" className="w-60 bg-[#0D0D0D]/95 backdrop-blur-2xl border-white/10 text-white rounded-2xl shadow-2xl p-2 mt-2">
                  <DropdownMenuLabel className="px-3 py-3">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">User Terminal</p>
                    <p className="text-xs text-white font-medium mt-1">administrator@seethos.internal</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem className="flex items-center gap-3 px-3 py-3 focus:bg-white/5 focus:text-white cursor-pointer rounded-xl text-sm transition-colors group">
                    <User className="w-4 h-4 text-gray-400 group-hover:text-green-500" />
                    Security Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-3 px-3 py-3 focus:bg-white/5 focus:text-white cursor-pointer rounded-xl text-sm transition-colors group">
                    <Settings2 className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                    Hardware Config
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem className="flex items-center gap-3 px-3 py-3 focus:bg-red-500/10 focus:text-red-500 cursor-pointer rounded-xl text-sm text-red-400 transition-colors group">
                    <LogOut className="w-4 h-4" />
                    Logout System
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
      
      {/* Top Scanner Line Decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[1px] bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />
    </header>
  )
}
