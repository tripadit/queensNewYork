'use client';

import { Card } from '@/components/ui/card';
import { Activity, AlertCircle } from 'lucide-react';
import { STREAM_URL, api } from '@/lib/api-client';
import { usePolling } from '@/hooks/use-polling';
import { WeaponLogs } from './weapon-logs';

export function LiveFeed() {
  const { data: staffStats } = usePolling(api.getStaffStats, 2000);
  
  const totalDetections = staffStats 
    ? (staffStats.Staff || 0) + (staffStats.Customer || 0) + (staffStats.Unknown || 0)
    : 0;

  const primaryCamera = {
    name: 'Cam 01',
    location: 'Main Entrance',
    uptime: 100
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Live Feed */}
      <div className="lg:col-span-2">
        <div className="bg-[#0A0A0A] border border-white/5 rounded-xl overflow-hidden">
          <div className="aspect-video bg-gradient-to-br from-gray-900 to-black relative flex items-center justify-center border-b border-white/5">
            <img 
              src={STREAM_URL} 
              alt="Live Stream" 
              className="absolute inset-0 w-full h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                if (target.parentElement) {
                    const placeholder = target.parentElement.querySelector('.stream-placeholder') as HTMLElement;
                    if (placeholder) placeholder.style.display = 'flex';
                }
              }}
              onLoad={(e) => {
                 const target = e.target as HTMLImageElement;
                 if (target.parentElement) {
                    const placeholder = target.parentElement.querySelector('.stream-placeholder') as HTMLElement;
                    if (placeholder) placeholder.style.display = 'none';
                }
              }}
            />
            <div className="stream-placeholder text-center hidden">
              <div className="w-14 h-14 bg-red-500/20 rounded-full mx-auto mb-4 flex items-center justify-center border border-red-500/30">
                <AlertCircle className="w-7 h-7 text-red-500" />
              </div>
              <p className="text-white text-sm font-semibold">
                Feed Unavailable
              </p>
              <p className="text-gray-500 text-xs mt-2">
                Check backend connection
              </p>
            </div>
            {/* Fallback while loading */}
             <div className="stream-placeholder flex text-center">
              <p className="text-white text-sm font-semibold">
                Connecting to Feed...
              </p>
            </div>
          </div>
          <div className="p-5 bg-gradient-to-br from-[#0D0D0D] to-[#0A0A0A]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white text-sm">
                Active Detections: <span className="text-green-400">{totalDetections}</span>
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Live</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Uptime: <span className="text-green-400 font-medium">{primaryCamera.uptime}%</span>
            </p>
          </div>
        </div>
      </div>

      {/* Weapon Alerts Section */}
      <div className="lg:col-span-1 h-[400px]">
        <WeaponLogs />
      </div>
    </div>
  );
}
