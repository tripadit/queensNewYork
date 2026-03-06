'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileJson, BarChart3, Table, Loader2 } from 'lucide-react';
import { api } from '@/lib/api-client';

export function ExportAnalytics() {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const exportOptions = [
    {
      label: 'Export as CSV',
      icon: Table,
      action: 'csv',
      description: 'All detection logs and analytics data',
    },
    {
      label: 'Export as JSON',
      icon: FileJson,
      action: 'json',
      description: 'Full dataset in JSON format',
    },
    {
      label: 'Generate Report',
      icon: BarChart3,
      action: 'report',
      description: 'Complete visual analytics report',
    },
  ];

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const a = document.createElement('a');
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleExport = async (action: string) => {
    setIsExporting(action);
    try {
      const [people, visits, staffLogs, loiteringLogs] = await Promise.all([
        api.getPeople(),
        api.getVisits(),
        api.getStaffLogs(),
        api.getLoiteringLogs(),
      ]);

      if (action === 'json' || action === 'report') {
        const fullData = {
          exportDate: new Date().toISOString(),
          people,
          visits,
          staffLogs,
          loiteringLogs,
          summary: await api.getAnalyticsSummary(),
        };
        downloadFile(
          JSON.stringify(fullData, null, 2),
          `seethos_vision_export_${Date.now()}.json`,
          'application/json'
        );
      } else if (action === 'csv') {
        // Simple CSV flattening for visits as primary log
        let csvContent = 'Type,ID,Name/Label,Time,Details\n';
        
        visits.forEach((v: any) => {
          csvContent += `Visit,${v.id},${v.person?.name_label || 'Unknown'},${v.start_time},Customer Visit\n`;
        });
        
        staffLogs.forEach((s: any) => {
          csvContent += `Staff Detection,${s.tracking_id},${s.label},${s.timestamp},Confidence: ${s.confidence}%\n`;
        });

        loiteringLogs.forEach((l: any) => {
          csvContent += `Loitering,${l.track_id},${l.status},${l.start_time},Duration: ${l.duration}s\n`;
        });

        downloadFile(
          csvContent,
          `seethos_vision_logs_${Date.now()}.csv`,
          'text/csv'
        );
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please ensure the backend is running.');
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="bg-[#0A0A0A] border border-white/5 rounded-xl p-6">
      <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide text-gray-400">Export Data</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {exportOptions.map((option) => {
          const Icon = option.icon;
          const loading = isExporting === option.action;
          
          return (
            <div
              key={option.action}
              className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-green-500/30 transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-5 h-5 text-green-500" />
                <p className="font-semibold text-white text-sm">
                  {option.label}
                </p>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                {option.description}
              </p>
              <Button
                onClick={() => handleExport(option.action)}
                size="sm"
                disabled={!!isExporting}
                className="w-full bg-green-500 text-black hover:bg-green-600 transition-colors font-medium disabled:bg-gray-700"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {loading ? 'Exporting...' : 'Export'}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg">
        <p className="text-xs text-gray-500">
          <span className="font-semibold text-white">Note:</span> All
          exports are generated in real-time from current data. Schedule
          automated reports in settings.
        </p>
      </div>
    </div>
  );
}
