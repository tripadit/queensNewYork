'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, TrendingUp, UserPlus, X } from 'lucide-react';
import { api } from '@/lib/api-client';
import { usePolling } from '@/hooks/use-polling';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const statusDots = {
  active: 'bg-green-500',
  inactive: 'bg-gray-500',
  break: 'bg-yellow-500',
};

export function StaffManagement() {
  const { data: staffStats } = usePolling(api.getStaffStats, 2000);
  const { data: staffProfiles, refetch: refetchProfiles } = usePolling(api.getStaffProfiles, 5000);
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const activeStaff = staffStats ? staffStats.Staff || 0 : 0;
  const profiles = staffProfiles || [];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !file) return;

    const formData = new FormData();
    formData.append('name', name);
    formData.append('file', file);

    try {
      await api.registerStaff(formData);
      setName('');
      setFile(null);
      setIsRegistering(false);
      refetchProfiles();
    } catch (err) {
      console.error(err);
      alert('Failed to register staff');
    }
  };

  return (
    <div className="bg-[#0A0A0A] border border-white/5 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-white text-sm uppercase tracking-wide text-gray-400">Staff Management</h3>
        <div className="flex items-center gap-4 text-sm">
          <Button 
            size="sm" 
            variant="ghost" 
            className="text-green-500 hover:text-green-400 hover:bg-green-500/10"
            onClick={() => setIsRegistering(!isRegistering)}
          >
            {isRegistering ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4 mr-2" />}
            {isRegistering ? 'Cancel' : 'Register'}
          </Button>
          <div>
            <span className="text-gray-500 font-medium">Active: </span>
            <span className="font-semibold text-green-400">{activeStaff}</span>
          </div>
        </div>
      </div>

      {isRegistering && (
        <form onSubmit={handleRegister} className="mb-6 p-4 bg-white/5 border border-white/10 rounded-lg space-y-4">
          <div>
            <label className="text-xs text-gray-500 uppercase font-medium mb-1 block">Staff Name</label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Full Name" 
              className="bg-black border-white/10 text-white text-sm"
              required
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase font-medium mb-1 block">Reference Photo</label>
            <Input 
              type="file" 
              onChange={(e) => setFile(e.target.files?.[0] || null)} 
              className="bg-black border-white/10 text-white text-sm cursor-pointer"
              required
              accept="image/*"
            />
          </div>
          <Button type="submit" size="sm" className="w-full bg-green-500 text-black hover:bg-green-600 font-bold">
            Complete Registration
          </Button>
        </form>
      )}

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {profiles.length > 0 ? (
          profiles.map((member: any) => (
            <div key={member.id} className="p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-white/20 transition-all">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-3 h-3 rounded-full ${statusDots.active} flex-shrink-0`} />
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm">{member.name}</p>
                    <p className="text-xs text-gray-500">Registered Staff</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">Storewide</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span className="capitalize">Online</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No registered staff</p>
          </div>
        )}
      </div>
    </div>
  );
}
