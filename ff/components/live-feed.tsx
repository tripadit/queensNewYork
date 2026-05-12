'use client';

import { Card } from '@/components/ui/card';
import { Activity, AlertCircle, Camera, Monitor, Video } from 'lucide-react';
import { STREAM_URL, api } from '@/lib/api-client';
import { usePolling } from '@/hooks/use-polling';
import { WeaponLogs } from './weapon-logs';
import { cn } from '@/lib/utils';

const CHANNELS = [
  { id: 'stream1', name: 'Channel 1' },
  { id: 'stream2', name: 'Channel 2' },
  { id: '3', name: 'Channel 3' },
];

function CameraFeed({ channel }: { channel: any }) {
  const { data: staffStats } = usePolling(() => api.getStaffStats(channel.id), 2000);
  
  const totalDetections = staffStats 
    ? (staffStats.Staff || 0) + (staffStats.Customer || 0) + (staffStats.Unknown || 0)
    : 0;

  const currentStreamUrl = `${STREAM_URL}?channel=${channel.id}`;

  return (
    <div className="bg-[#0A0A0A] border border-white/5 rounded-xl overflow-hidden shadow-2xl flex flex-col h-full">
      <div className="aspect-video bg-gradient-to-br from-gray-900 to-black relative flex items-center justify-center group">
        <img 
          src={currentStreamUrl} 
          alt={`Live Stream - ${channel.name}`} 
          className="absolute inset-0 w-full h-full object-contain"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            if (target.parentElement) {
                const placeholder = target.parentElement.querySelector('.stream-error') as HTMLElement;
                if (placeholder) placeholder.style.display = 'flex';
            }
          }}
        />
        
        {/* Overlay Info */}
        <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
           <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
           <span className="text-[9px] font-bold text-white uppercase tracking-wider">Live • {channel.id}</span>
        </div>

        <div className="stream-error text-center hidden flex-col items-center">
          <AlertCircle className="w-6 h-6 text-red-500 mb-2" />
          <p className="text-gray-500 text-[10px] uppercase">Offline</p>
        </div>
      </div>
      
      <div className="p-3 bg-gradient-to-br from-[#0D0D0D] to-[#0A0A0A] flex-1">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white text-[11px] flex items-center gap-1.5">
              <Monitor className="w-3 h-3 text-blue-500" />
              {channel.name}
            </h3>
          </div>
          <div className="text-right">
             <p className="text-[9px] text-gray-500 uppercase tracking-tighter">Flow</p>
             <p className="text-xs font-bold text-green-400 leading-none">{totalDetections}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LiveFeed() {
  return (
    <div className="flex flex-col gap-6">
      {/* 3-Column Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CHANNELS.map((channel) => (
          <CameraFeed key={channel.id} channel={channel} />
        ))}
      </div>

      {/* Bottom Section: Logs */}
      <div className="h-[300px]">
        <WeaponLogs />
      </div>
    </div>
  );
}
