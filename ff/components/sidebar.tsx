'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  ShieldAlert, 
  BarChart3, 
  FileDown, 
  Settings, 
  HelpCircle,
  LogOut,
  Camera
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Live Feed', href: '/', icon: Camera },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Monitoring', href: '/monitoring', icon: ShieldAlert },
  { name: 'Staff', href: '/staff', icon: Users },
  { name: 'Logs', href: '/logs', icon: FileDown },
];

const secondaryItems = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Support', href: '/support', icon: HelpCircle },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 flex flex-col h-full bg-[#0D0D0D] border border-white/5 rounded-2xl p-4 shadow-2xl">
      {/* Navigation Label */}
      <div className="px-4 mb-6">
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Main Console</p>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
                isActive 
                  ? "bg-green-500/10 border border-green-500/20 text-white" 
                  : "text-gray-500 hover:text-white hover:bg-white/5 border border-transparent"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 transition-transform group-hover:scale-110",
                isActive ? "text-green-500" : "text-gray-500"
              )} />
              <span className="text-sm font-bold tracking-tight uppercase">{item.name}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="h-px bg-white/5 my-6 mx-2" />

      {/* Secondary Navigation */}
      <div className="space-y-1.5 pb-4">
        <p className="px-4 text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3">System</p>
        {secondaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300",
                isActive 
                  ? "bg-white/5 text-white" 
                  : "text-gray-500 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[13px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
