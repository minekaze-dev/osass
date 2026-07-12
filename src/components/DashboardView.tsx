/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { 
  Users, UserCheck, Bell, Award, CheckCircle, Check,
  MessageSquare, ChevronRight, Calendar, AlertCircle, BarChart3, RefreshCw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Lead, SalesConfig } from '../types';
import { 
  formatIDR, 
  getDaysElapsed, 
  formatWhatsAppNumber, 
  getStatusColorClasses 
} from '../utils/helpers';

interface DashboardViewProps {
  leads: Lead[];
  config: SalesConfig;
  userName: string;
  onViewLead: (lead: Lead, historyOnly?: boolean) => void;
  onUpdateStatus: (lead: Lead) => void;
  onQuickFollowUp: (leadId: string) => void;
}

export default function DashboardView({ leads, config, userName, onViewLead, onUpdateStatus, onQuickFollowUp }: DashboardViewProps) {
  const TODAY_STR = '2026-07-10';

  // Dynamic Month Extractor
  const availableMonths = React.useMemo(() => {
    const months = new Set<string>();
    // Always include current calendar month dynamically
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const currentMonthStr = `${year}-${month}`; // "2026-07"
    months.add(currentMonthStr);
    
    // Also make sure '2026-07' is always in the options
    months.add('2026-07');

    leads.forEach(l => {
      if (l.createdAt) {
        const match = l.createdAt.match(/^(\d{4}-\d{2})/);
        if (match) {
          months.add(match[1]);
        }
      }
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [leads]);

  // Default to current month dynamically
  const [selectedMonth, setSelectedMonth] = React.useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`; // "2026-07"
  });

  const formatMonthYear = (yearMonth: string): string => {
    if (yearMonth === 'All') return 'Semua Bulan';
    const [year, month] = yearMonth.split('-');
    const indonesianMonths: Record<string, string> = {
      '01': 'Januari',
      '02': 'Februari',
      '03': 'Maret',
      '04': 'April',
      '05': 'Mei',
      '06': 'Juni',
      '07': 'Juli',
      '08': 'Agustus',
      '09': 'September',
      '10': 'Oktober',
      '11': 'November',
      '12': 'Desember'
    };
    return `${indonesianMonths[month] || month} ${year}`;
  };

  // Filter leads for calculations
  const filteredLeads = React.useMemo(() => {
    if (selectedMonth === 'All') return leads;
    return leads.filter(l => l.createdAt.startsWith(selectedMonth));
  }, [leads, selectedMonth]);

  // Calculations
  const totalLeads = filteredLeads.length;
  
  const activeProspects = filteredLeads.filter(
    l => l.pipeline !== 'Aktif' && 
         !['Not Interested', 'Not Coverage', 'Invalid Number'].includes(l.status)
  ).length;

  const todayReminders = filteredLeads.filter(
    l => l.nextReminderDate !== null && l.nextReminderDate <= TODAY_STR && l.pipeline !== 'Aktif'
  ).length;

  const monthlyClosings = React.useMemo(() => {
    const isClosed = (l: Lead) => l.pipeline === 'Aktif' || l.status === 'Paid' || l.status === 'Installed' || l.status === 'Closing';
    if (selectedMonth === 'All') {
      return leads.filter(isClosed).length;
    }
    return leads.filter(
      l => isClosed(l) && 
           ((l.closingDate && l.closingDate.startsWith(selectedMonth)) || 
            (!l.closingDate && l.createdAt.startsWith(selectedMonth)))
    ).length;
  }, [leads, selectedMonth]);

  // Today's Tasks
  const todayTasks = React.useMemo(() => {
    return filteredLeads
      .filter(
        l => l.nextReminderDate !== null && 
             l.nextReminderDate <= TODAY_STR && 
             l.pipeline !== 'Aktif' &&
             !['Not Interested', 'Not Coverage', 'Invalid Number'].includes(l.status)
      )
      .sort((a, b) => {
        const dateA = a.nextReminderDate || '';
        const dateB = b.nextReminderDate || '';
        return dateA.localeCompare(dateB);
      });
  }, [filteredLeads]);

  // Calculate target progress
  // Calculate daily installations for chart
  const chartData = React.useMemo(() => {
    if (selectedMonth === 'All') return [];
    
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    
    const data = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      installations: 0,
      generalPayment: 0,
      paid: 0,
      aktif: 0
    }));

    leads.forEach(l => {
      const dateStr = l.closingDate || l.createdAt;
      if (dateStr.startsWith(selectedMonth)) {
        const day = parseInt(dateStr.split('-')[2]);
        if (day >= 1 && day <= daysInMonth) {
          if (l.status === 'General Payment') {
            data[day - 1].generalPayment += 1;
          } else if (l.status === 'Paid') {
            data[day - 1].paid += 1;
          } else if (l.pipeline === 'Aktif' || l.status === 'Installed' || l.status === 'Closing') {
            data[day - 1].aktif += 1;
            data[day - 1].installations += 1;
          }
        }
      }
    });

    return data;
  }, [leads, selectedMonth]);

  const stats = React.useMemo(() => {
    const totalGP = leads.filter(l => l.status === 'General Payment' && (selectedMonth === 'All' || l.createdAt.startsWith(selectedMonth))).length;
    const totalPaid = leads.filter(l => l.status === 'Paid' && (selectedMonth === 'All' || l.createdAt.startsWith(selectedMonth))).length;
    const totalInstalled = leads.filter(l => (l.pipeline === 'Aktif' || l.status === 'Installed') && (selectedMonth === 'All' || (l.closingDate || l.createdAt).startsWith(selectedMonth))).length;
    const todayInstalled = leads.filter(l => (l.pipeline === 'Aktif' || l.status === 'Installed') && (l.closingDate === TODAY_STR || (!l.closingDate && l.createdAt.startsWith(TODAY_STR)))).length;

    return { totalGP, totalPaid, totalInstalled, todayInstalled };
  }, [leads, selectedMonth]);

  const targetProgress = Math.min(100, Math.round((monthlyClosings / config.monthlyTarget) * 100));

  const getFollowUpDayText = (lead: Lead): string => {
    const days = getDaysElapsed(lead.createdAt);
    if (lead.status === 'Thinking') {
      return `Hari ke-${days || 1} Follow Up`;
    }
    if (lead.status === 'NBP') {
      return `NBP Hari ke-${days || 1}`;
    }
    return `Hari ke-${days || 0}`;
  };

  return (
    <div className="space-y-4">
      {/* Welcome Banner */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border shadow-xs ${
        config.theme === 'dark' ? 'bg-[#18181b] border-zinc-800 text-zinc-100' : 'bg-white border-slate-100 shadow-xs'
      }`}>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
          </div>
          
          {/* Month Filter Dropdown */}
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold flex items-center gap-1 ${config.theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'}`}>
              <Calendar className="w-3.5 h-3.5 opacity-70" />
              Periode Dashboard:
            </span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className={`text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer border ${
                config.theme === 'dark' 
                  ? 'bg-zinc-900 border-zinc-700 text-zinc-200' 
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="All">Semua Periode (Semua Bulan)</option>
              {availableMonths.map((ym) => (
                <option key={ym} value={ym}>
                  {formatMonthYear(ym)}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Bulanan Target Progress */}
        <div className={`w-full md:w-64 p-3.5 rounded-xl border flex flex-col gap-1.5 ${
          config.theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50 border-slate-100'
        }`}>
          <div className="flex justify-between items-center text-xs">
            <span className={`font-semibold ${config.theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'}`}>
              {selectedMonth === 'All' ? 'Target Closing Total' : `Target Closing ${formatMonthYear(selectedMonth)}`}
            </span>
            <span className="font-bold text-[#F58220]">{monthlyClosings} / {config.monthlyTarget} <span className="text-[10px] font-medium opacity-80">({targetProgress}%)</span></span>
          </div>
          <div className={`w-full rounded-full h-2 ${config.theme === 'dark' ? 'bg-zinc-800' : 'bg-slate-200'}`}>
            <div 
              className="bg-[#F58220] h-2 rounded-full transition-all duration-500" 
              style={{ width: `${targetProgress}%` }}
            />
          </div>
          <span className={`text-[10px] self-end font-medium ${config.theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'}`}>
            Progress: {targetProgress}% tercapai
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Lead */}
        <div className={`p-4 rounded-2xl border shadow-xs transition-shadow flex items-center gap-3 ${
          config.theme === 'dark' ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-slate-100 shadow-xs hover:shadow-md'
        }`}>
          <div className={`p-3 rounded-xl ${config.theme === 'dark' ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className={`text-xs block font-medium ${config.theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'}`}>Total Lead</span>
            <span className={`text-xl font-bold ${config.theme === 'dark' ? 'text-zinc-100' : 'text-slate-800'}`}>{totalLeads}</span>
          </div>
        </div>

        {/* Prospek Aktif */}
        <div className={`p-4 rounded-2xl border shadow-xs transition-shadow flex items-center gap-3 ${
          config.theme === 'dark' ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-slate-100 shadow-xs hover:shadow-md'
        }`}>
          <div className={`p-3 rounded-xl ${config.theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className={`text-xs block font-medium ${config.theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'}`}>Prospek Aktif</span>
            <span className={`text-xl font-bold ${config.theme === 'dark' ? 'text-zinc-100' : 'text-slate-800'}`}>{activeProspects}</span>
          </div>
        </div>

        {/* Reminder Hari Ini */}
        <div className={`p-4 rounded-2xl border shadow-xs transition-shadow flex items-center gap-3 ${
          config.theme === 'dark' ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-slate-100 shadow-xs hover:shadow-md'
        }`}>
          <div className={`p-3 rounded-xl ${config.theme === 'dark' ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <span className={`text-xs block font-medium ${config.theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'}`}>Reminder Hari Ini</span>
            <span className={`text-xl font-bold ${config.theme === 'dark' ? 'text-zinc-100' : 'text-slate-800'}`}>{todayReminders}</span>
          </div>
        </div>

        {/* Closing Bulan Ini */}
        <div className={`p-4 rounded-2xl border shadow-xs transition-shadow flex items-center gap-3 ${
          config.theme === 'dark' ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-slate-100 shadow-xs hover:shadow-md'
        }`}>
          <div className={`p-3 rounded-xl ${config.theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className={`text-xs block font-medium ${config.theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'}`}>
              {selectedMonth === 'All' ? 'Total Closing' : `Closing ${formatMonthYear(selectedMonth)}`}
            </span>
            <span className={`text-xl font-bold ${config.theme === 'dark' ? 'text-zinc-100' : 'text-slate-800'}`}>
              {monthlyClosings}
              <span className={`text-xs font-bold ml-1.5 ${config.theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>({targetProgress}%)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Daily Performance Chart */}
      {selectedMonth !== 'All' && (
        <div className={`p-5 rounded-2xl border shadow-xs ${config.theme === 'dark' ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-slate-100'}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${config.theme === 'dark' ? 'bg-orange-500/10 text-orange-500' : 'bg-orange-50 text-[#F58220]'}`}>
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-sm font-bold ${config.theme === 'dark' ? 'text-zinc-100' : 'text-slate-800'}`}>
                  Grafik Aktivitas Harian
                </h3>
                <p className={`text-[10px] ${config.theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'}`}>
                  Performa harian periode {formatMonthYear(selectedMonth)}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <div className={`px-3 py-1.5 rounded-lg flex flex-col items-center min-w-[80px] ${config.theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                <span className={`text-[9px] font-bold ${config.theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>TOTAL GP</span>
                <span className={`text-sm font-black ${config.theme === 'dark' ? 'text-blue-100' : 'text-blue-700'}`}>{stats.totalGP}</span>
              </div>
              <div className={`px-3 py-1.5 rounded-lg flex flex-col items-center min-w-[80px] ${config.theme === 'dark' ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
                <span className={`text-[9px] font-bold ${config.theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>TOTAL PAID</span>
                <span className={`text-sm font-black ${config.theme === 'dark' ? 'text-indigo-100' : 'text-indigo-700'}`}>{stats.totalPaid}</span>
              </div>
              <div className={`px-3 py-1.5 rounded-lg flex flex-col items-center min-w-[100px] border border-emerald-500/20 ${config.theme === 'dark' ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                <span className={`text-[9px] font-bold ${config.theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>PEMASANGAN HARI INI</span>
                <span className={`text-sm font-black ${config.theme === 'dark' ? 'text-emerald-100' : 'text-emerald-700'}`}>{stats.todayInstalled}</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={false} 
                  stroke={config.theme === 'dark' ? '#27272a' : '#f1f5f9'} 
                />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: config.theme === 'dark' ? '#71717a' : '#94a3b8' }}
                  interval={Math.floor(chartData.length / 10)}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: config.theme === 'dark' ? '#71717a' : '#94a3b8' }}
                  allowDecimals={false}
                />
                <Tooltip 
                  cursor={{ fill: config.theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className={`p-3 rounded-xl border shadow-lg text-[10px] space-y-1 ${
                          config.theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-100 text-slate-800'
                        }`}>
                          <p className="font-bold border-b pb-1 mb-1 border-slate-100 dark:border-zinc-800">
                            {d.day} {formatMonthYear(selectedMonth)}
                          </p>
                          <p className="flex justify-between gap-4">
                            <span className="text-blue-500">General Payment:</span>
                            <span className="font-bold">{d.generalPayment}</span>
                          </p>
                          <p className="flex justify-between gap-4">
                            <span className="text-indigo-500">Paid:</span>
                            <span className="font-bold">{d.paid}</span>
                          </p>
                          <p className="flex justify-between gap-4 border-t pt-1 mt-1 border-slate-50 dark:border-zinc-800/50">
                            <span className="text-[#F58220]">Instalasi:</span>
                            <span className="font-bold">{d.aktif}</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="generalPayment" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} barSize={14} />
                <Bar dataKey="paid" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} barSize={14} />
                <Bar dataKey="aktif" stackId="a" fill="#F58220" radius={[4, 4, 0, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Today's Tasks Section */}
      <div className={`rounded-2xl border p-5 shadow-xs ${
        config.theme === 'dark' ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-slate-100'
      }`}>
        <div className={`flex items-center justify-between border-b pb-3 mb-4 ${
          config.theme === 'dark' ? 'border-zinc-800' : 'border-slate-100'
        }`}>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
            <h2 className={`text-base font-bold ${config.theme === 'dark' ? 'text-zinc-100' : 'text-slate-800'}`}>Today's Task ({todayTasks.length})</h2>
          </div>
          <span className={`text-xs font-mono ${config.theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'}`}>
            Tanggal: {TODAY_STR}
          </span>
        </div>

        {todayTasks.length > 0 ? (
          <div className={`rounded-xl border overflow-hidden ${
            config.theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-slate-100'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                    config.theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800 text-zinc-500' : 'bg-slate-50/70 border-slate-100 text-slate-500'
                  }`}>
                    <th className="py-2.5 px-4">Nama Customer</th>
                    <th className="py-2.5 px-4">Status & Follow-up</th>
                    <th className="py-2.5 px-4">Catatan Aktivitas Terakhir</th>
                    <th className="py-2.5 text-right pr-6">Tindakan</th>
                  </tr>
                </thead>
                <tbody className={`divide-y text-xs ${config.theme === 'dark' ? 'divide-zinc-800 text-zinc-300' : 'divide-slate-100 text-slate-700'}`}>
                  {todayTasks.map((task, index) => {
                    const waNumber = formatWhatsAppNumber(task.whatsapp);
                    const waGreeting = `Halo ${task.name}, saya ${userName} dari WiFi Oxygen. `;
                    const waTemplate = task.status === 'Thinking' 
                      ? `${waGreeting}Bagaimana kelanjutan pendaftaran WiFi Oxygen kemarin Pak/Bu? Apakah jadi diambil promo bebas instalasinya?`
                      : task.status === 'NBP'
                      ? `${waGreeting}Mohon maaf mengganggu waktunya Pak/Bu. Brosur Oxygen kemarin apakah ada yang ingin ditanyakan lebih lanjut?`
                      : `${waGreeting}Ingin menanyakan kabar pendaftaran internet Oxygen untuk rumah Bapak/Ibu. Apakah sudah bisa kita jadwalkan survey titik tiangnya?`;
                    
                    const waUrl = `https://api.whatsapp.com/send?phone=${waNumber}&text=${encodeURIComponent(waTemplate)}`;
                    const isOverdue = task.nextReminderDate && task.nextReminderDate < TODAY_STR;

                    return (
                      <motion.tr
                        key={task.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`transition-colors group ${
                          isOverdue 
                            ? (config.theme === 'dark' ? 'bg-rose-500/5 hover:bg-rose-500/10' : 'bg-rose-50/20 hover:bg-rose-50/40') 
                            : (config.theme === 'dark' ? 'hover:bg-zinc-800/40' : 'hover:bg-slate-50/40')
                        }`}
                      >
                        {/* Name & Whatsapp */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span 
                              className={`font-bold text-[13px] hover:text-[#F58220] transition-colors cursor-pointer flex items-center gap-1 ${
                                config.theme === 'dark' ? 'text-zinc-200' : 'text-slate-800'
                              }`}
                              onClick={() => onViewLead(task)}
                            >
                              {task.name && task.name.trim() !== '' ? task.name : '-'}
                              <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                            </span>
                            {isOverdue && (
                              <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[8px] font-bold rounded-full uppercase tracking-wider">
                                Terlambat
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{task.whatsapp}</div>
                        </td>

                        {/* Status & Follow up */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] px-2 py-0.5 rounded-md border font-bold uppercase tracking-wide ${getStatusColorClasses(task.status).bg}`}>
                              {task.status}
                            </span>
                            <span className="text-[11px] font-semibold text-orange-600 font-mono">
                              {getFollowUpDayText(task)}
                            </span>
                          </div>
                        </td>

                        {/* Last Notes */}
                        <td className="py-3 px-4 max-w-xs">
                          <p className={`truncate italic text-[11px] ${config.theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'}`} title={task.notes}>
                            "{task.notes || 'Tidak ada catatan khusus.'}"
                          </p>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right pr-6">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-[11px] transition-colors flex items-center gap-1 shadow-xs"
                            >
                              <MessageSquare className="w-3 h-3" />
                              WhatsApp
                            </a>

                            <button
                              onClick={() => onQuickFollowUp(task.id)}
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center shadow-xs"
                              title="Tindakan Cepat: Berhasil Follow Up"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => onUpdateStatus(task)}
                              className={`px-3 py-1.5 font-bold rounded-lg text-[11px] transition-all border shadow-xs flex items-center gap-1.5 ${
                                config.theme === 'dark' 
                                  ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700' 
                                  : 'bg-[#F58220] hover:bg-[#E0721B] text-white border-orange-600'
                              }`}
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              Update
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className={`text-center py-10 rounded-xl border border-dashed flex flex-col items-center justify-center gap-3 ${
            config.theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800' : 'bg-slate-50/50 border-slate-200'
          }`}>
            <CheckCircle className="w-10 h-10 text-emerald-500" />
            <div>
              <p className={`font-bold ${config.theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'}`}>Semua Tugas Selesai! 🎉</p>
              <p className={`text-xs mt-1 ${config.theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'}`}>Tidak ada jadwal reminder follow up yang menunggumu hari ini.</p>
            </div>
          </div>
        )}
      </div>

      {/* Pitching Guide Mini banner */}
      <div className="bg-gradient-to-r from-orange-500 to-[#F58220] p-4 rounded-2xl text-white flex items-center justify-between shadow-md">
        <div className="space-y-1">
          <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Tips Closing Hari Ini</span>
          <h4 className="text-sm font-bold">Tekankan Keunggulan Koneksi Simetris! 🚀</h4>
          <p className="text-xs text-white/80">Kabel fiber optik Oxygen menawarkan download dan upload 1:1 simetris. Sangat cocok untuk livestreamer, gamer, dan WFH!</p>
        </div>
      </div>
    </div>
  );
}
