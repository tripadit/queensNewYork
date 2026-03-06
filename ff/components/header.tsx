"use client"

import React, { useState, useEffect } from 'react'
import { Eye, Settings2, LogOut } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Header() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-black/5 backdrop-blur-xl border-b border-white/5">
      <div className="flex items-center gap-2.5">
        <h1 className="text-lg font-semibold text-white tracking-tight">
          Seethos <span className="text-green-500">Vision</span>
        </h1>
      </div>
      {mounted && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-10 w-10 rounded-full bg-green-500 hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/20" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-[#0D0D0D] border-[#1F1F1F] text-white">
            <DropdownMenuItem className="focus:bg-[#1F1F1F] focus:text-white cursor-pointer text-[#919191]">
              <Settings2 className="mr-2 h-4 w-4 text-[#919191]" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-[#1F1F1F] focus:text-white cursor-pointer text-[#919191]">
              <LogOut className="mr-2 h-4 w-4 text-[#919191]" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  )
}
