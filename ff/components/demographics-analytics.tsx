'use client';

import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { api } from '@/lib/api-client';
import { usePolling } from '@/hooks/use-polling';

export function DemographicsAnalytics() {
  const { data: distributionData } = usePolling(api.getGenderAgeDistribution, 10000);

  const data = distributionData?.distribution || [];
  
  // Transform data for the chart
  // The backend returns { gender: string, age_group: string, count: number }[]
  // We want to group by age_group and show gender bars
  
  const ageGroups = Array.from(new Set(data.map((d: any) => d.age_group))).sort();
  const chartData = ageGroups.map(group => {
    const male = data.find((d: any) => d.age_group === group && (d.gender === 'Male' || d.gender === 'M'))?.count || 0;
    const female = data.find((d: any) => d.age_group === group && (d.gender === 'Female' || d.gender === 'F'))?.count || 0;
    return {
      name: group,
      Male: male,
      Female: female,
    };
  });

  return (
    <div className="bg-[#0A0A0A] border border-white/5 rounded-xl p-6">
      <h3 className="font-semibold text-white mb-6 text-sm uppercase tracking-wide text-gray-400">Demographics Distribution</h3>
      
      <div className="h-64 border border-white/5 rounded-lg bg-gradient-to-br from-gray-900/50 to-black/50 p-4">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0A0A0A',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
                cursor={false}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="Male" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Female" fill="#ec4899" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            No demographic data available
          </div>
        )}
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="p-3 rounded bg-blue-500/5 border border-blue-500/10">
          <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Total Analyzed</p>
          <p className="text-xl font-semibold text-white">{distributionData?.total_analyzed || 0}</p>
        </div>
        <div className="p-3 rounded bg-pink-500/5 border border-pink-500/10">
          <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Data Points</p>
          <p className="text-xl font-semibold text-white">{data.length}</p>
        </div>
      </div>
    </div>
  );
}
