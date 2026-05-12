'use client';

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { api } from '@/lib/api-client';
import { usePolling } from '@/hooks/use-polling';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  Activity, 
  Zap, 
  Target,
  BarChart3,
  ArrowUpRight,
  MousePointer2
} from 'lucide-react';

export function VisitorAnalytics() {
  const [mounted, setMounted] = useState(false);
  const { data: summary } = usePolling(api.getAnalyticsSummary, 5000);
  const { data: hourlyFlow } = usePolling(api.getHourlyFlow, 10000);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalVisitors = summary ? summary.total_visits_today : 0;
  const uniqueVisitors = summary ? summary.unique_visitors_today : 0;
  const conversionRate = summary ? summary.conversion_rate : 0;
  const avgDwell = summary ? summary.avg_dwell : 0;
  const loyaltyRate = summary ? summary.loyalty_rate : 0;
  
  const currentHour = mounted ? new Date().getHours() : 0;
  
  // Real data only - no simulations
  const chartData = mounted ? Array.from({ length: 24 }, (_, i) => {
    const hourData = hourlyFlow?.find((h: any) => h.hour === i);
    const count = hourData ? hourData.count : (i > currentHour ? null : 0);
    
    return {
      timestamp: `${i.toString().padStart(2, '0')}:00`,
      unique: count,
    };
  }) : [];

  const peakHour = chartData.reduce((prev: any, current: any) => 
    (prev.unique > current.unique) ? prev : current
  , { timestamp: 'N/A', unique: 0 });

  return (
    <div className="bg-[#0D0D0D] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col h-full group">
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 blur-[100px] rounded-full -mr-32 -mt-32 transition-all group-hover:bg-green-500/10 duration-1000" />

      {/* Header with Smart Insights */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/10 rounded-xl border border-green-500/20">
              <BarChart3 className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">
              Store Traffic Intelligence
            </h3>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tighter">Visitor Momentum</h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Peak Sighting</p>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-sm font-black text-white">{peakHour.timestamp}</span>
            </div>
          </div>
          <div className="w-px h-8 bg-white/10 mx-2" />
          <div className="flex flex-col items-end">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Conversion</p>
            <div className="flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-green-500" />
              <span className="text-sm font-black text-white">{conversionRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* High-Fidelity Chart */}
      <div className="flex-1 min-h-[320px] relative z-10">
        {chartData.some(d => d.unique !== null) ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 20, right: 0, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorUnique" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis
                dataKey="timestamp"
                stroke="#4B5563"
                fontSize={10}
                fontWeight="900"
                axisLine={false}
                tickLine={false}
                dy={15}
                interval={3}
              />
              <YAxis 
                stroke="#4B5563" 
                fontSize={10}
                fontWeight="900"
                axisLine={false}
                tickLine={false}
                dx={-10}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-[#0A0A0A]/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl">
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">{label} Window</p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-8">
                            <span className="text-[10px] font-bold text-green-500 uppercase">Unique Visitors</span>
                            <span className="text-sm font-black text-white">{payload[0].value}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="unique"
                stroke="#22c55e"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorUnique)"
                animationDuration={1500}
              />
              <ReferenceLine x={`${currentHour.toString().padStart(2, '0')}:00`} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'LIVE', fill: '#ef4444', fontSize: 9, fontWeight: '900' }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-700 gap-4 border-2 border-dashed border-white/5 rounded-3xl">
            <Zap className="w-10 h-10 opacity-20 animate-pulse" />
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50">Syncing with Streams</p>
              <p className="text-[9px] font-medium text-gray-500 mt-1 uppercase">Establishing AI Pipeline...</p>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Insights Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 relative z-10">
        <InsightCard 
          label="Unique Visits" 
          value={uniqueVisitors} 
          sub="Individual IDs"
          icon={<Users className="w-3.5 h-3.5 text-green-500" />}
        />
        <InsightCard 
          label="Total Flow" 
          value={totalVisitors} 
          sub="Gross Entries"
          icon={<ArrowUpRight className="w-3.5 h-3.5 text-blue-500" />}
        />
        <InsightCard 
          label="Loyalty Rate" 
          value={`${loyaltyRate.toFixed(1)}%`} 
          sub="Returning Visitors"
          icon={<Target className="w-3.5 h-3.5 text-purple-500" />}
        />
        <InsightCard 
          label="Avg Dwell" 
          value={`${avgDwell}m`} 
          sub="Per Session"
          icon={<Clock className="w-3.5 h-3.5 text-orange-500" />}
        />
      </div>
    </div>
  );
}

function InsightCard({ label, value, sub, icon }: { label: string, value: any, sub: string, icon: any }) {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 hover:bg-white/[0.04] transition-all duration-300 group/card">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 bg-white/5 rounded-lg group-hover/card:scale-110 transition-transform duration-500">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-xl font-black text-white tracking-tight">{value}</p>
        <p className="text-[8px] font-bold text-gray-500 uppercase mt-1 tracking-tighter">{sub}</p>
      </div>
    </div>
  );
}
