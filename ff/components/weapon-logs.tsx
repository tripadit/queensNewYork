'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, Radio, Clock, Camera } from 'lucide-react';
import { api } from '@/lib/api-client';
import { usePolling } from '@/hooks/use-polling';
import { cn } from '@/lib/utils';

export function WeaponLogs() {
  const [mounted, setMounted] = useState(false);
  const { data: weaponLogs } = usePolling(api.getWeaponLogs, 3000);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatTime = (dateStr: string) => {
    if (!mounted) return '...';
    return new Date(dateStr).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl h-full flex flex-col overflow-hidden shadow-2xl shadow-red-900/5">
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg transition-colors",
            weaponLogs?.length > 0 ? "bg-red-500/20 text-red-500" : "bg-green-500/20 text-green-500"
          )}>
            {weaponLogs?.length > 0 ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">Security Threat Log</h3>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">
              {weaponLogs?.length > 0 ? 'Action Required' : 'All Zones Secure'}
            </p>
          </div>
        </div>
        
        {weaponLogs?.length === 0 && (
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
            <span className="text-[9px] font-bold text-green-500 uppercase tracking-tighter">System Scanning</span>
          </div>
        )}
      </div>

      {/* Logs Content */}
      <div className="flex-1 overflow-auto custom-scrollbar p-4">
        {weaponLogs && weaponLogs.length > 0 ? (
          <div className="space-y-3">
            {weaponLogs.map((log: any) => (
              <div 
                key={log.id} 
                className="group relative bg-red-500/5 border border-red-500/10 rounded-xl p-4 hover:bg-red-500/10 transition-all cursor-default"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/20">
                      <AlertTriangle className="w-4 h-4 text-white animate-pulse" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white uppercase tracking-tight">{log.label}</p>
                      <p className="text-[10px] font-bold text-red-500 uppercase">Critical Threat Detected</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black bg-red-500 text-white px-2 py-0.5 rounded shadow-sm">
                      {Math.round(log.confidence * 100)}% CONF
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-red-500/10">
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <Camera className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase">Channel {log.channel_id || '01'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400 justify-end">
                    <Clock className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase">{formatTime(log.timestamp)}</span>
                  </div>
                </div>
                
                {/* Decorative scanner line */}
                <div className="absolute left-0 top-0 w-1 h-full bg-red-500 rounded-l-xl opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 bg-white/[0.02] border border-white/5 rounded-full flex items-center justify-center mb-4">
              <Radio className="w-6 h-6 text-gray-700 animate-pulse" />
            </div>
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest text-center">
              No active threats monitored <br /> in current session
            </p>
          </div>
        )}
      </div>

      {/* Footer / Status */}
      <div className="p-3 bg-white/[0.01] border-t border-white/5 text-center">
        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter">
          Encrypted Security Stream • Seethos Vision v2.0
        </p>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(239, 68, 68, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(239, 68, 68, 0.2); }
      `}</style>
    </div>
  );
}
