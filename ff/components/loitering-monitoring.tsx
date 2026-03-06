'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, Circle } from 'lucide-react';
import { api } from '@/lib/api-client';
import Link from 'next/link';

export function LoiteringMonitoring() {
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    try {
      const res = await api.getLoiteringStatus();
      setIsRunning(res.is_running);
    } catch (e) {
      console.error("Error checking loitering status:", e);
    }
  };

  return (
    <Card className="bg-[#0A0A0A] border border-white/5 rounded-xl overflow-hidden">
      <CardContent className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl transition-colors ${isRunning ? 'bg-red-500/10' : 'bg-white/5'}`}>
            <Circle className={`w-6 h-6 ${isRunning ? 'text-red-500 fill-red-500' : 'text-gray-500'}`} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Loitering Monitoring</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                isRunning ? 'bg-red-500 text-white' : 'bg-white/10 text-gray-400'
              }`}>
                {isRunning ? "Service Running" : "Service Offline"}
              </span>
              <span className="text-xs text-gray-500">Microservice on Port 8001</span>
            </div>
          </div>
        </div>
        
        <Link 
          href="/monitoring"
          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors text-sm shadow-lg shadow-green-500/20"
        >
          <ExternalLink className="w-4 h-4" />
          Open Loitering Console
        </Link>
      </CardContent>
    </Card>
  );
}
