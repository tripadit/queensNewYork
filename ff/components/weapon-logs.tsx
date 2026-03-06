'use client';

import { ShieldAlert, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api-client';
import { usePolling } from '@/hooks/use-polling';

export function WeaponLogs() {
  const { data: weaponLogs } = usePolling(api.getWeaponLogs, 2000);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const logs = weaponLogs || [];

  return (
    <div className="bg-[#0A0A0A] border border-red-900/20 rounded-xl p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-red-500 text-sm uppercase tracking-wide flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          Weapon Alerts
        </h3>
        {logs.length > 0 && (
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        )}
      </div>

      <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
        {logs.length > 0 ? (
          logs.map((log: any) => (
            <div
              key={log.id}
              className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg hover:bg-red-500/10 hover:border-red-500/30 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-red-600/20 text-red-500 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-bold text-red-500 text-sm truncate">
                      {log.label.toUpperCase()}
                    </p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">
                      {(log.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-red-700" />
                      Cam 01
                    </span>
                    <span>•</span>
                    <span>{formatTime(log.timestamp)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
            <ShieldAlert className="w-8 h-8 text-gray-600 mb-2" />
            <p className="text-gray-500 text-xs">No weapon threats detected</p>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(239, 68, 68, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(239, 68, 68, 0.2);
        }
      `}</style>
    </div>
  );
}
