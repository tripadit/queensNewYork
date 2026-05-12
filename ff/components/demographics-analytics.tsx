'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { api } from '@/lib/api-client';
import { usePolling } from '@/hooks/use-polling';
import { cn } from '@/lib/utils';
import { User, Users } from 'lucide-react';

export function DemographicsAnalytics() {
  const { data: distributionData } = usePolling(api.getGenderAgeDistribution, 10000);

  const data = distributionData?.distribution || [];
  
  // Group and sort data
  const ageGroups = Array.from(new Set(data.map((d: any) => d.age_group))).sort();
  
  let totalMale = 0;
  let totalFemale = 0;
  let maxCount = 0;
  let primarySegment = "N/A";

  const chartData = ageGroups.map(group => {
    const male = data.find((d: any) => d.age_group === group && (d.gender === 'Male' || d.gender === 'M'))?.count || 0;
    const female = data.find((d: any) => d.age_group === group && (d.gender === 'Female' || d.gender === 'F'))?.count || 0;
    
    totalMale += male;
    totalFemale += female;
    
    const totalGroup = male + female;
    if (totalGroup > maxCount) {
      maxCount = totalGroup;
      primarySegment = group;
    }

    return {
      name: group,
      Male: male,
      Female: female,
      total: totalGroup
    };
  });

  const total = totalMale + totalFemale;
  const malePercent = total > 0 ? Math.round((totalMale / total) * 100) : 0;
  const femalePercent = total > 0 ? Math.round((totalFemale / total) * 100) : 0;

  return (
    <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">
            Demographics Distribution
          </h3>
          <p className="text-xl font-black text-white tracking-tight">Visitor Profile</p>
        </div>
        <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
          <Users className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* Gender Split Header */}
      <div className="mb-8">
        <div className="flex justify-between items-end mb-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-bold text-gray-400">Male</span>
            <span className="text-lg font-black text-white">{malePercent}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-white">{femalePercent}%</span>
            <span className="text-xs font-bold text-gray-400">Female</span>
            <User className="w-4 h-4 text-pink-500" />
          </div>
        </div>
        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden flex p-0.5 border border-white/5">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-1000"
            style={{ width: `${malePercent}%` }}
          />
          <div className="w-1" />
          <div 
            className="h-full bg-gradient-to-l from-pink-600 to-pink-400 rounded-full transition-all duration-1000"
            style={{ width: `${femalePercent}%` }}
          />
        </div>
      </div>

      {/* Main Breakdown Chart */}
      <div className="flex-1 min-h-[280px]">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: -10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={true} vertical={false} />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                stroke="#4B5563" 
                fontSize={10} 
                fontWeight="bold"
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0A0A0A',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                }}
                itemStyle={{ padding: '0px' }}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              />
              <Bar dataKey="Male" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} stackId="a">
                <Cell fill="url(#blueGradient)" />
              </Bar>
              <Bar dataKey="Female" fill="#ec4899" radius={[0, 4, 4, 0]} barSize={12} stackId="a">
                <Cell fill="url(#pinkGradient)" />
              </Bar>
              <defs>
                <linearGradient id="blueGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#60a5fa" />
                </linearGradient>
                <linearGradient id="pinkGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#db2777" />
                  <stop offset="100%" stopColor="#f472b6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-3 border-2 border-dashed border-white/5 rounded-2xl">
            <User className="w-8 h-8 opacity-20" />
            <p className="text-xs font-bold uppercase tracking-widest opacity-50">Collecting Data...</p>
          </div>
        )}
      </div>
      
      {/* Footer Highlights */}
      <div className="mt-8 grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
          <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">Primary Audience</p>
          <p className="text-lg font-black text-white tracking-tight">{primarySegment}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
          <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">Total Analyzed</p>
          <p className="text-lg font-black text-white tracking-tight">{distributionData?.total_analyzed || 0}</p>
        </div>
      </div>
    </div>
  );
}
