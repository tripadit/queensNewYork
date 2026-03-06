"use client"

import { ArrowUp, ArrowDown, ChevronsUpDown, Users } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer } from "recharts"
import { api } from '@/lib/api-client'
import { usePolling } from '@/hooks/use-polling'

export function TickerList() {
  const { data: topCustomers } = usePolling(api.getTopCustomers, 10000);
  
  const customers = topCustomers || [];

  return (
    <div className="bg-[#0D0D0D] rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-5 w-5 text-green-500" />
        <h3 className="font-semibold text-white text-sm uppercase tracking-wide">Top Customers</h3>
      </div>
      <table className="w-full">
        <thead>
          <tr className="text-[#919191] text-sm border-b border-transparent">
            <th className="pb-4 text-left font-medium pl-2">
              <div className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors">
                Customer Name
                <ChevronsUpDown className="h-4 w-4" />
              </div>
            </th>
            <th className="pb-4 text-right font-medium">Total Visits</th>
            <th className="pb-4 text-right font-medium pr-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {customers.length > 0 ? (
            customers.map((item: any, index: number) => (
              <tr 
                key={index} 
                className="group transition-colors border-b border-white/5 last:border-0 hover:bg-[#1A1A1A]"
              >
                <td className="py-4 pl-2 rounded-l-xl">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white">{item.name}</span>
                  </div>
                </td>
                <td className="py-4 text-right text-white font-medium">{item.visits}</td>
                <td className="py-4 text-right font-medium pr-2 rounded-r-xl text-[#4ADE80]">
                  <div className="flex items-center justify-end gap-1">
                    <ArrowUp className="h-4 w-4" />
                    Frequent
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} className="py-8 text-center text-gray-500">
                No customer data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
