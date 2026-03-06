'use client';

import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '@/lib/api-client';
import { usePolling } from '@/hooks/use-polling';

export function VisitorAnalytics() {
  const { data: summary } = usePolling(api.getAnalyticsSummary, 5000);
  const { data: hourlyFlow } = usePolling(api.getHourlyFlow, 10000);

  const totalVisitors = summary ? summary.total_visits_today : 0;
  const currentVisitors = summary ? summary.unique_visitors_today : 0;
  
  // Pad data to show all hours from 00:00 to the current hour
  const currentHour = new Date().getHours();
  const chartData = Array.from({ length: currentHour + 1 }, (_, i) => {
    const hourData = hourlyFlow?.find((h: any) => h.hour === i);
    return {
      timestamp: `${i.toString().padStart(2, '0')}:00`,
      count: hourData ? hourData.count : 0
    };
  });

  const avgVisitors = chartData.length > 0 
    ? Math.round(chartData.reduce((sum: number, d: any) => sum + d.count, 0) / chartData.length)
    : 0;
    
  const peakVisitors = chartData.length > 0 
    ? Math.max(...chartData.map((d: any) => d.count))
    : 0;

  return (
    <div className="bg-[#0A0A0A] border border-white/5 rounded-xl p-6">
      <div className="mb-6">
        <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide text-gray-400">Visitor Analytics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Unique Today</p>
            <p className="text-2xl font-semibold text-green-400">{currentVisitors}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Avg/Hour</p>
            <p className="text-2xl font-semibold text-white">{avgVisitors}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Peak/Hour</p>
            <p className="text-2xl font-semibold text-white">{peakVisitors}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Total Visits</p>
            <p className="text-2xl font-semibold text-white">{totalVisitors}</p>
          </div>
        </div>
      </div>

      <div className="h-64 border border-white/5 rounded-lg bg-gradient-to-br from-gray-900/50 to-black/50 p-4">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="timestamp"
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0A0A0A',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#86efac' }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#86efac"
                dot={false}
                strokeWidth={2.5}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            No visitor data available for today
          </div>
        )}
      </div>
    </div>
  );
}
