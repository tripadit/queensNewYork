'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, Package, Users, Eye } from 'lucide-react';
import { api } from '@/lib/api-client';
import { usePolling } from '@/hooks/use-polling';

const detectionIcons = {
  person: Users,
  object: Package,
  loitering: AlertCircle,
  staff: Eye,
  Customer: Users,
  Staff: Eye,
  Unknown: Users,
};

const detectionColors = {
  person: 'bg-blue-500/10 text-blue-500',
  object: 'bg-purple-500/10 text-purple-500',
  loitering: 'bg-red-500/10 text-red-500',
  staff: 'bg-green-500/10 text-green-500',
  Customer: 'bg-blue-500/10 text-blue-500',
  Staff: 'bg-green-500/10 text-green-500',
  Unknown: 'bg-gray-500/10 text-gray-500',
};

export function DetectionLogs() {
  const [mounted, setMounted] = useState(false);
  const { data: staffLogs } = usePolling(api.getStaffLogs, 2000);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatTime = (timestamp: string) => {
    if (!mounted) return '...';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const logs = staffLogs || [];

  return (
    <div className="bg-[#0A0A0A] border border-white/5 rounded-xl p-6">
      <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide text-gray-400">Recent Detections</h3>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {logs.length > 0 ? (
          logs.map((log: any) => {
            const label = log.label;
            const Icon = (detectionIcons as any)[label] || Users;
            return (
              <div
                key={log.id}
                className="p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-white/20 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg ${(detectionColors as any)[label] || detectionColors.Unknown} flex-shrink-0 mt-0.5`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold text-white text-sm">
                        {label} detected
                      </p>
                      <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 font-medium">
                        {(log.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">
                      Tracking ID: {log.tracking_id}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>Cam 01</span>
                      <span>•</span>
                      <span>{formatTime(log.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No recent activity detected</p>
          </div>
        )}
      </div>
    </div>
  );
}
