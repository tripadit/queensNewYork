'use client';

import { Users, ShieldCheck, Activity, Radar, ArrowUpRight } from 'lucide-react';
import { api } from '@/lib/api-client';
import { usePolling } from '@/hooks/use-polling';
import { cn } from '@/lib/utils';

export function DashboardMetrics() {
  const { data: summary } = usePolling(api.getAnalyticsSummary, 5000);
  const { data: staffProfiles } = usePolling(api.getStaffProfiles, 10000);
  
  // To get "Active Detections", we sum stats from all channels
  const { data: stats1 } = usePolling(() => api.getStaffStats('stream1'), 2000);
  const { data: stats2 } = usePolling(() => api.getStaffStats('stream2'), 2000);
  const { data: stats3 } = usePolling(() => api.getStaffStats('3'), 2000);

  const getChannelTotal = (s: any) => (s?.Staff || 0) + (s?.Customer || 0) + (s?.Unknown || 0);
  const activeDetections = getChannelTotal(stats1) + getChannelTotal(stats2) + getChannelTotal(stats3);

  const metrics = [
    {
      label: "Today's Visitors",
      value: summary?.unique_visitors_today || 0,
      icon: <Users className="w-5 h-5" />,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      description: "Unique individuals"
    },
    {
      label: "Active Detections",
      value: activeDetections,
      icon: <Radar className="w-5 h-5" />,
      color: "text-red-500",
      bg: "bg-red-500/10",
      description: "Live across all cams"
    },
    {
      label: "Staff On Duty",
      value: staffProfiles?.length || 0,
      icon: <ShieldCheck className="w-5 h-5" />,
      color: "text-green-500",
      bg: "bg-green-500/10",
      description: "Registered profiles"
    },
    {
      label: "Total Visits",
      value: summary?.total_visits_today || 0,
      icon: <Activity className="w-5 h-5" />,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      description: "Cumulative flow"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m, i) => (
        <div 
          key={i} 
          className="relative group bg-[#0D0D0D] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.04] transition-all duration-300 shadow-xl overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">
                {m.label}
              </p>
              <h2 className="text-3xl font-black text-white tracking-tighter">
                {m.value}
              </h2>
              <p className="text-[9px] text-gray-600 font-medium mt-1 flex items-center gap-1">
                <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                {m.description}
              </p>
            </div>
            <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110 duration-500", m.bg, m.color)}>
              {m.icon}
            </div>
          </div>
          
          {/* Decorative corner accent */}
          <div className={cn("absolute -bottom-2 -right-2 w-12 h-12 opacity-5 blur-2xl rounded-full", m.bg)} />
        </div>
      ))}
    </div>
  );
}
