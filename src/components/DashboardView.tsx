/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, UserCheck, Bell, Award, CheckCircle, Check,
  MessageSquare, ChevronRight, Calendar, AlertCircle, BarChart3, RefreshCw, TrendingUp,
  FileSpreadsheet, Upload, Trash2, X, Plus, AlertTriangle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { Lead, SalesConfig } from '../types';
import { 
  formatIDR, 
  getDaysElapsed, 
  formatWhatsAppNumber, 
  getStatusColorClasses,
  isLeadActiveProspect,
  getTodayStr
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
  const TODAY_STR = getTodayStr();

  // State for manual daily performance overrides
  const [manualOverrides, setManualOverrides] = React.useState<Record<string, { gp: number; paid: number; sa: number; refund: number }>>(() => {
    try {
      const saved = localStorage.getItem('oxygen_daily_overrides');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [isActivityModalOpen, setIsActivityModalOpen] = React.useState(false);

  // Robust date string parser for imports
  const parseImportedDate = React.useCallback((dateStr: string): string | null => {
    if (!dateStr) return null;
    dateStr = dateStr.trim();
    
    // Try YYYY-MM-DD first
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // Try D-M-YYYY or D/M/YYYY or D Month YYYY (e.g. 1 July 2026 or 1 Juli 2026)
    const parts = dateStr.split(/[-/ ]+/);
    if (parts.length === 3) {
      let day = parseInt(parts[0]);
      let monthStr = parts[1].toLowerCase();
      let year = parseInt(parts[2]);
      
      // Check if parts[0] is year
      if (parts[0].length === 4) {
        year = parseInt(parts[0]);
        monthStr = parts[1].toLowerCase();
        day = parseInt(parts[2]);
      }
      
      let month = -1;
      if (/^\d+$/.test(monthStr)) {
        month = parseInt(monthStr);
      } else {
        const monthNames = [
          ['january', 'januari', 'jan'],
          ['february', 'februari', 'feb'],
          ['march', 'maret', 'mar'],
          ['april', 'apr'],
          ['may', 'mei'],
          ['june', 'juni', 'jun'],
          ['july', 'juli', 'jul'],
          ['august', 'agustus', 'aug', 'agt'],
          ['september', 'sep'],
          ['october', 'oktober', 'oct', 'okt'],
          ['november', 'nov'],
          ['december', 'desember', 'dec', 'des']
        ];
        month = monthNames.findIndex(names => names.some(n => monthStr.includes(n))) + 1;
      }
      
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2000) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
    return null;
  }, []);

  // Helper to find the date of transition to 'General Payment' (GP)
  const getGPDate = React.useCallback((l: Lead): string | null => {
    // 1. Check history for GP
    if (l.history && l.history.length > 0) {
      const entry = l.history.find(h => h.status === 'General Payment');
      if (entry && entry.date) {
        return entry.date.split(' ')[0]; // YYYY-MM-DD
      }
    }
    // 2. If current status is 'General Payment', fallback to lastFollowUpDate or createdAt
    if (l.status === 'General Payment') {
      return l.lastFollowUpDate || l.createdAt;
    }
    return null;
  }, []);

  // Helper to find the date of transition to 'Paid'
  const getPaidDate = React.useCallback((l: Lead): string | null => {
    // 1. Check history for Paid
    if (l.history && l.history.length > 0) {
      const entry = l.history.find(h => h.status === 'Paid');
      if (entry && entry.date) {
        return entry.date.split(' ')[0];
      }
    }
    // 2. If current status is 'Paid', fallback to lastFollowUpDate or createdAt
    if (l.status === 'Paid') {
      return l.lastFollowUpDate || l.createdAt;
    }
    return null;
  }, []);

  // Helper to find the date of transition to 'Installed' (Pemasangan / Aktif / Closed)
  const getInstalledDate = React.useCallback((l: Lead): string | null => {
    // 1. Check closingDate FIRST as it is the explicit user-defined active/closing date
    if (l.closingDate) {
      return l.closingDate;
    }
    // 2. Check history for Installed or Closing or Aktif
    if (l.history && l.history.length > 0) {
      const entry = l.history.find(h => 
        h.status === 'Installed' || 
        h.status === 'Closing' || 
        h.pipeline === 'Aktif'
      );
      if (entry && entry.date) {
        return entry.date.split(' ')[0];
      }
    }
    // 3. If current status is 'Installed' or pipeline is 'Aktif', fallback to createdAt
    if (l.status === 'Installed' || l.pipeline === 'Aktif' || l.customerStatus === 'Aktif') {
      return l.createdAt;
    }
    return null;
  }, []);

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
  const totalLeads = leads.length;
  
  const activeProspects = React.useMemo(() => {
    return leads.filter(isLeadActiveProspect).length;
  }, [leads]);

  const todayReminders = React.useMemo(() => {
    return leads.filter(
      l => l.nextReminderDate !== null && l.nextReminderDate <= TODAY_STR && isLeadActiveProspect(l)
    ).length;
  }, [leads]);

  // Today's Tasks
  const todayTasks = React.useMemo(() => {
    return leads
      .filter(
        l => l.nextReminderDate !== null && 
             l.nextReminderDate <= TODAY_STR && 
             isLeadActiveProspect(l)
      )
      .sort((a, b) => {
        const dateA = a.nextReminderDate || '';
        const dateB = b.nextReminderDate || '';
        return dateA.localeCompare(dateB);
      });
  }, [leads]);

  // Calculate daily installations and incoming data for chart with de-duplication of SA
  const chartData = React.useMemo(() => {
    if (selectedMonth === 'All') return [];
    
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // Calculate system SA per day for this month first
    const systemSAByDay: Record<string, number> = {};
    leads.forEach(l => {
      const installedDate = getInstalledDate(l);
      if (installedDate && installedDate.startsWith(selectedMonth)) {
        systemSAByDay[installedDate] = (systemSAByDay[installedDate] || 0) + 1;
      }
    });

    const data = Array.from({ length: daysInMonth }, (_, i) => {
      const dayNum = i + 1;
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const manual = manualOverrides[dateStr] || { gp: 0, paid: 0, sa: 0, refund: 0 };
      
      const systemSA = systemSAByDay[dateStr] || 0;
      // If there is SA from customer data (systemSA > 0), use that and don't count manual.sa (aktif = systemSA)
      const finalSA = systemSA > 0 ? systemSA : (manual.sa || 0);

      return {
        day: dayNum,
        dateStr,
        installations: finalSA,
        generalPayment: manual.gp,
        paid: manual.paid,
        aktif: finalSA,
        refund: manual.refund,
        incoming: 0
      };
    });

    leads.forEach(l => {
      // Calculate incoming leads strictly based on l.createdAt
      if (l.createdAt && l.createdAt.startsWith(selectedMonth)) {
        const day = parseInt(l.createdAt.split('-')[2]);
        if (day >= 1 && day <= daysInMonth) {
          data[day - 1].incoming += 1;
        }
      }

      // 1. General Payment transition date
      const gpDate = getGPDate(l);
      if (gpDate && gpDate.startsWith(selectedMonth)) {
        const day = parseInt(gpDate.split('-')[2]);
        if (day >= 1 && day <= daysInMonth) {
          data[day - 1].generalPayment += 1;
        }
      }

      // 2. Paid transition date
      const paidDate = getPaidDate(l);
      if (paidDate && paidDate.startsWith(selectedMonth)) {
        const day = parseInt(paidDate.split('-')[2]);
        if (day >= 1 && day <= daysInMonth) {
          data[day - 1].paid += 1;
        }
      }

      // 3. Installed transition date is handled above during initialization of `data` to avoid double-counting
    });

    return data;
  }, [leads, selectedMonth, manualOverrides, getGPDate, getPaidDate, getInstalledDate]);

  const stats = React.useMemo(() => {
    // 1. System stats
    const systemGP = leads.filter(l => {
      const gpDate = getGPDate(l);
      if (!gpDate) return false;
      return selectedMonth === 'All' || gpDate.startsWith(selectedMonth);
    }).length;

    const systemPaid = leads.filter(l => {
      const paidDate = getPaidDate(l);
      if (!paidDate) return false;
      return selectedMonth === 'All' || paidDate.startsWith(selectedMonth);
    }).length;

    // 2. Manual/Import stats sum
    let manualGPSum = 0;
    let manualPaidSum = 0;
    let manualRefundSum = 0;

    Object.entries(manualOverrides).forEach(([dateStr, rawVal]) => {
      const val = rawVal as { gp?: number; paid?: number; sa?: number; refund?: number };
      if (selectedMonth === 'All' || dateStr.startsWith(selectedMonth)) {
        manualGPSum += val.gp || 0;
        manualPaidSum += val.paid || 0;
        manualRefundSum += val.refund || 0;
      }
    });

    const totalGP = systemGP + manualGPSum;
    const totalPaid = systemPaid + manualPaidSum;
    const totalRefund = manualRefundSum;

    // Calculate de-duplicated SA (Installed) sum
    let totalInstalled = 0;
    let todayInstalled = 0;

    if (selectedMonth === 'All') {
      const systemSAByDate: Record<string, number> = {};
      leads.forEach(l => {
        const instDate = getInstalledDate(l);
        if (instDate) {
          systemSAByDate[instDate] = (systemSAByDate[instDate] || 0) + 1;
        }
      });

      const allDates = new Set<string>([
        ...Object.keys(systemSAByDate),
        ...Object.keys(manualOverrides)
      ]);

      allDates.forEach(dateStr => {
        const systemSA = systemSAByDate[dateStr] || 0;
        const manual = (manualOverrides[dateStr] as { sa?: number })?.sa || 0;
        const finalSA = systemSA > 0 ? systemSA : manual;
        totalInstalled += finalSA;
        if (dateStr === TODAY_STR) {
          todayInstalled += finalSA;
        }
      });
    } else {
      const [year, month] = selectedMonth.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();

      const systemSAByDate: Record<string, number> = {};
      leads.forEach(l => {
        const instDate = getInstalledDate(l);
        if (instDate && instDate.startsWith(selectedMonth)) {
          systemSAByDate[instDate] = (systemSAByDate[instDate] || 0) + 1;
        }
      });

      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const systemSA = systemSAByDate[dateStr] || 0;
        const manual = (manualOverrides[dateStr] as { sa?: number })?.sa || 0;
        const finalSA = systemSA > 0 ? systemSA : manual;
        totalInstalled += finalSA;
        if (dateStr === TODAY_STR) {
          todayInstalled += finalSA;
        }
      }
    }

    const totalIncoming = leads.filter(l => selectedMonth === 'All' || l.createdAt.startsWith(selectedMonth)).length;
    const todayIncoming = leads.filter(l => l.createdAt.startsWith(TODAY_STR)).length;

    return { 
      totalGP, 
      totalPaid, 
      totalInstalled, 
      totalRefund, 
      todayInstalled, 
      totalIncoming, 
      todayIncoming 
    };
  }, [leads, selectedMonth, TODAY_STR, manualOverrides, getGPDate, getPaidDate, getInstalledDate]);

  const monthlyClosings = stats.totalInstalled;

  const targetProgress = Math.min(100, Math.round((monthlyClosings / config.monthlyTarget) * 100));

  // Local state for edits in the modal
  const [tempOverrides, setTempOverrides] = React.useState<Record<string, { gp: number; paid: number; sa: number; refund: number }>>({});
  const [activeModalTab, setActiveModalTab] = React.useState<'manual' | 'import'>('manual');
  const [pasteText, setPasteText] = React.useState('');

  // Populate tempOverrides when modal opens
  React.useEffect(() => {
    if (isActivityModalOpen) {
      setTempOverrides({ ...manualOverrides });
      setPasteText('');
    }
  }, [isActivityModalOpen, manualOverrides]);

  // Days list for selected month
  const daysOfSelectedMonth = React.useMemo(() => {
    if (!selectedMonth || selectedMonth === 'All') return [];
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    
    return Array.from({ length: daysInMonth }, (_, i) => {
      const dayNum = i + 1;
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      return {
        day: dayNum,
        dateStr,
        formattedLabel: `${dayNum} ${formatMonthYear(selectedMonth)}`
      };
    });
  }, [selectedMonth]);

  // Calculated system totals for days of selected month
  const systemTotalsByDay = React.useMemo(() => {
    const totals: Record<string, { gp: number; paid: number; sa: number }> = {};
    if (!selectedMonth || selectedMonth === 'All') return totals;

    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      totals[dateStr] = { gp: 0, paid: 0, sa: 0 };
    }

    leads.forEach(l => {
      // 1. General Payment
      const gpDate = getGPDate(l);
      if (gpDate && gpDate.startsWith(selectedMonth)) {
        if (totals[gpDate]) totals[gpDate].gp += 1;
      }

      // 2. Paid
      const paidDate = getPaidDate(l);
      if (paidDate && paidDate.startsWith(selectedMonth)) {
        if (totals[paidDate]) totals[paidDate].paid += 1;
      }

      // 3. SA / Installation
      const installedDate = getInstalledDate(l);
      if (installedDate && installedDate.startsWith(selectedMonth)) {
        if (totals[installedDate]) totals[installedDate].sa += 1;
      }
    });

    return totals;
  }, [leads, selectedMonth, getGPDate, getPaidDate, getInstalledDate]);

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
          <h1 className={`text-xl font-bold ${config.theme === 'dark' ? 'text-zinc-100' : 'text-slate-800'}`}>
            Hi, {userName}
          </h1>
          <p className={`text-xs ${config.theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'}`}>
            Semangat Closing Tiap Harinya!
          </p>
          <div className="flex items-center gap-2">
          </div>
          
          {/* Month Filter Dropdown */}
          <div className="flex items-center gap-2 mt-2">
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
              {selectedMonth === 'All' ? 'Target SA Total' : `Target SA ${formatMonthYear(selectedMonth)}`}
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
              {selectedMonth === 'All' ? 'Total SA' : `Total SA ${formatMonthYear(selectedMonth)}`}
            </span>
            <span className={`text-xl font-bold ${config.theme === 'dark' ? 'text-zinc-100' : 'text-slate-800'}`}>
              {monthlyClosings}
              <span className={`text-xs font-bold ml-1.5 ${config.theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>({targetProgress}%)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Daily Charts Section */}
      {selectedMonth !== 'All' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Daily Performance Chart */}
          <div className={`p-5 rounded-2xl border shadow-xs ${config.theme === 'dark' ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-slate-100'}`}>
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
              <div className="flex flex-wrap items-center justify-between xl:justify-start gap-4 w-full xl:w-auto">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${config.theme === 'dark' ? 'bg-orange-500/10 text-orange-500' : 'bg-orange-50 text-[#F58220]'}`}>
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold whitespace-nowrap ${config.theme === 'dark' ? 'text-zinc-100' : 'text-slate-800'}`}>
                      Grafik Aktivitas Harian
                    </h3>
                    <p className={`text-[10px] ${config.theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'}`}>
                      Performa harian periode {formatMonthYear(selectedMonth)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsActivityModalOpen(true)}
                  className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors ${
                    config.theme === 'dark' 
                      ? 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20' 
                      : 'bg-orange-50 text-[#F58220] hover:bg-orange-100 border border-orange-200'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Input Manual / Import CSV
                </button>
              </div>
              
              <div className="flex flex-nowrap gap-1 md:gap-1.5 select-none items-center xl:self-center justify-start sm:justify-end">
                <div className={`px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg flex flex-col items-center justify-center min-w-[35px] sm:min-w-[45px] ${config.theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                  <span className={`text-[7px] md:text-[8px] font-bold tracking-tight whitespace-nowrap ${config.theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>GP</span>
                  <span className={`text-[10px] md:text-xs font-black ${config.theme === 'dark' ? 'text-blue-100' : 'text-blue-700'}`}>{stats.totalGP}</span>
                </div>
                <div className={`px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg flex flex-col items-center justify-center min-w-[35px] sm:min-w-[45px] ${config.theme === 'dark' ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
                  <span className={`text-[7px] md:text-[8px] font-bold tracking-tight whitespace-nowrap ${config.theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>P</span>
                  <span className={`text-[10px] md:text-xs font-black ${config.theme === 'dark' ? 'text-indigo-100' : 'text-indigo-700'}`}>{stats.totalPaid}</span>
                </div>
                <div className={`px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg flex flex-col items-center justify-center min-w-[35px] sm:min-w-[45px] border border-emerald-500/20 ${config.theme === 'dark' ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                  <span className={`text-[7px] md:text-[8px] font-bold tracking-tight whitespace-nowrap ${config.theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>PS</span>
                  <span className={`text-[10px] md:text-xs font-black ${config.theme === 'dark' ? 'text-emerald-100' : 'text-emerald-700'}`}>{stats.totalInstalled}</span>
                </div>
                {stats.totalRefund > 0 && (
                  <div className={`px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg flex flex-col items-center justify-center min-w-[35px] sm:min-w-[45px] border border-red-500/20 ${config.theme === 'dark' ? 'bg-red-500/10' : 'bg-red-50'}`}>
                    <span className={`text-[7px] md:text-[8px] font-bold tracking-tight whitespace-nowrap ${config.theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>RF</span>
                    <span className={`text-[10px] md:text-xs font-black ${config.theme === 'dark' ? 'text-red-100' : 'text-red-700'}`}>{stats.totalRefund}</span>
                  </div>
                )}
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
                            {d.refund > 0 && (
                              <p className="flex justify-between gap-4 text-red-500 font-semibold">
                                <span>Refund:</span>
                                <span>{d.refund}</span>
                              </p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="generalPayment" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} barSize={14} />
                  <Bar dataKey="paid" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} barSize={14} />
                  <Bar dataKey="aktif" stackId="a" fill="#F58220" radius={[0, 0, 0, 0]} barSize={14} />
                  <Bar dataKey="refund" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Grafik Data Masuk (Incoming Data Chart) */}
          <div className={`p-5 rounded-2xl border shadow-xs ${config.theme === 'dark' ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-slate-100'}`}>
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${config.theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-sm font-bold whitespace-nowrap ${config.theme === 'dark' ? 'text-zinc-100' : 'text-slate-800'}`}>
                    Grafik Data Masuk
                  </h3>
                  <p className={`text-[10px] ${config.theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'}`}>
                    Total lead baru masuk periode {formatMonthYear(selectedMonth)}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-nowrap gap-1.5 select-none">
                <div className={`px-2 py-1 rounded-lg flex flex-col items-center justify-center min-w-[70px] ${config.theme === 'dark' ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                  <span className={`text-[8px] font-bold tracking-tight whitespace-nowrap ${config.theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>TOTAL MASUK</span>
                  <span className={`text-xs font-black ${config.theme === 'dark' ? 'text-emerald-100' : 'text-emerald-700'}`}>{stats.totalIncoming}</span>
                </div>
                <div className={`px-2 py-1 rounded-lg flex flex-col items-center justify-center min-w-[75px] border border-orange-500/20 ${config.theme === 'dark' ? 'bg-orange-500/10' : 'bg-orange-50'}`}>
                  <span className={`text-[8px] font-bold tracking-tight whitespace-nowrap ${config.theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>MASUK HARI INI</span>
                  <span className={`text-xs font-black ${config.theme === 'dark' ? 'text-orange-100' : 'text-orange-700'}`}>{stats.todayIncoming}</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncoming" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
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
                    cursor={{ stroke: config.theme === 'dark' ? '#3f3f46' : '#e2e8f0', strokeWidth: 1 }}
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
                              <span className="text-emerald-500">Lead Baru Masuk:</span>
                              <span className="font-bold">{d.incoming}</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="incoming" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncoming)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
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
                    const waUrl = `https://api.whatsapp.com/send?phone=${waNumber}`;
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

      {/* Activity Management & Spreadsheet Import Modal */}
      <AnimatePresence>
        {isActivityModalOpen && selectedMonth !== 'All' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsActivityModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`relative w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border shadow-2xl flex flex-col ${
                config.theme === 'dark' ? 'bg-[#1c1c1e] border-zinc-850 text-zinc-100' : 'bg-white border-slate-100 text-slate-800'
              }`}
            >
              {/* Modal Header */}
              <div className={`p-5 border-b flex items-center justify-between ${
                config.theme === 'dark' ? 'border-zinc-800/80 bg-zinc-900/30' : 'border-slate-100 bg-slate-50/50'
              }`}>
                <div>
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-orange-500" />
                    Kelola Grafik Aktivitas Harian ({formatMonthYear(selectedMonth)})
                  </h2>
                  <p className={`text-[11px] mt-0.5 ${config.theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Tambahkan data manual harian atau import langsung dari CSV / file Excel copy-paste.
                  </p>
                </div>
                <button
                  onClick={() => setIsActivityModalOpen(false)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    config.theme === 'dark' ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-400'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs navigation */}
              <div className={`flex border-b px-5 ${
                config.theme === 'dark' ? 'border-zinc-800/80' : 'border-slate-100'
              }`}>
                <button
                  onClick={() => setActiveModalTab('manual')}
                  className={`py-3 px-4 font-bold text-xs border-b-2 transition-colors cursor-pointer ${
                    activeModalTab === 'manual'
                      ? 'border-[#F58220] text-[#F58220]'
                      : 'border-transparent text-slate-400 hover:text-slate-500'
                  }`}
                >
                  Input Manual & Edit Tabel
                </button>
                <button
                  onClick={() => setActiveModalTab('import')}
                  className={`py-3 px-4 font-bold text-xs border-b-2 transition-colors cursor-pointer ${
                    activeModalTab === 'import'
                      ? 'border-[#F58220] text-[#F58220]'
                      : 'border-transparent text-slate-400 hover:text-slate-500'
                  }`}
                >
                  Import CSV / Paste Excel
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {activeModalTab === 'manual' ? (
                  <div className="space-y-3">
                    <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                      config.theme === 'dark' ? 'bg-orange-500/5 border-orange-500/10 text-orange-300' : 'bg-orange-50/50 border-orange-100 text-orange-800'
                    }`}>
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p className="text-[11px] leading-relaxed">
                        Input di bawah ini adalah <strong>tambahan manual</strong>. Sistem akan menjumlahkannya secara otomatis dengan data aktif (leads) yang terdaftar sesuai tanggal transisinya.
                      </p>
                    </div>

                    <div className={`rounded-xl border overflow-hidden ${
                      config.theme === 'dark' ? 'border-zinc-800 bg-zinc-900/10' : 'border-slate-150 bg-white'
                    }`}>
                      <div className="max-h-[42vh] overflow-y-auto overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead className={`sticky top-0 z-10 ${
                            config.theme === 'dark' ? 'bg-zinc-900 text-zinc-400 border-b border-zinc-800' : 'bg-slate-50 text-slate-500 border-b border-slate-100'
                          }`}>
                            <tr>
                              <th className="py-2 px-3 font-bold">Tanggal</th>
                              <th className="py-2 px-3 font-bold">Sistem (Otomatis)</th>
                              <th className="py-2 px-2 text-center font-bold">GP Manual</th>
                              <th className="py-2 px-2 text-center font-bold">PAID Manual</th>
                              <th className="py-2 px-2 text-center font-bold">SA Manual</th>
                              <th className="py-2 px-2 text-center font-bold">REFUND</th>
                              <th className="py-2 px-3 text-right font-bold">Total Day</th>
                            </tr>
                          </thead>
                          <tbody className={`divide-y ${config.theme === 'dark' ? 'divide-zinc-800/80 text-zinc-300' : 'divide-slate-100 text-slate-600'}`}>
                            {daysOfSelectedMonth.map(item => {
                              const system = systemTotalsByDay[item.dateStr] || { gp: 0, paid: 0, sa: 0 };
                              const temp = tempOverrides[item.dateStr] || { gp: 0, paid: 0, sa: 0, refund: 0 };

                              const finalGP = system.gp + temp.gp;
                              const finalPaid = system.paid + temp.paid;
                              const finalSA = system.sa + temp.sa;
                              const finalRefund = temp.refund;

                              const updateTempField = (field: 'gp' | 'paid' | 'sa' | 'refund', valStr: string) => {
                                const val = parseInt(valStr) || 0;
                                setTempOverrides(prev => ({
                                  ...prev,
                                  [item.dateStr]: {
                                    ...(prev[item.dateStr] || { gp: 0, paid: 0, sa: 0, refund: 0 }),
                                    [field]: val
                                  }
                                }));
                              };

                              return (
                                <tr key={item.dateStr} className={`transition-colors ${
                                  config.theme === 'dark' ? 'hover:bg-zinc-800/20' : 'hover:bg-slate-50/50'
                                }`}>
                                  <td className="py-2 px-3 font-bold whitespace-nowrap">
                                    {item.day} {formatMonthYear(selectedMonth)}
                                  </td>
                                  <td className="py-2 px-3">
                                    <div className="flex flex-wrap gap-1">
                                      {system.gp > 0 && (
                                        <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-500 rounded-md text-[9px] font-bold">
                                          GP:{system.gp}
                                        </span>
                                      )}
                                      {system.paid > 0 && (
                                        <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-500 rounded-md text-[9px] font-bold">
                                          PAID:{system.paid}
                                        </span>
                                      )}
                                      {system.sa > 0 && (
                                        <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-md text-[9px] font-bold">
                                          SA:{system.sa}
                                        </span>
                                      )}
                                      {system.gp === 0 && system.paid === 0 && system.sa === 0 && (
                                        <span className="text-[10px] text-slate-400 italic">0 aktivitas</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-1 px-2 text-center">
                                    <input
                                      type="number"
                                      min="0"
                                      value={temp.gp || ''}
                                      placeholder="0"
                                      onChange={e => updateTempField('gp', e.target.value)}
                                      className={`w-14 px-1.5 py-1 text-center rounded-lg border text-xs font-bold transition-all bg-transparent focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-hidden ${
                                        config.theme === 'dark' ? 'border-zinc-700 text-zinc-100' : 'border-slate-200 text-slate-800'
                                      }`}
                                    />
                                  </td>
                                  <td className="py-1 px-2 text-center">
                                    <input
                                      type="number"
                                      min="0"
                                      value={temp.paid || ''}
                                      placeholder="0"
                                      onChange={e => updateTempField('paid', e.target.value)}
                                      className={`w-14 px-1.5 py-1 text-center rounded-lg border text-xs font-bold transition-all bg-transparent focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-hidden ${
                                        config.theme === 'dark' ? 'border-zinc-700 text-zinc-100' : 'border-slate-200 text-slate-800'
                                      }`}
                                    />
                                  </td>
                                  <td className="py-1 px-2 text-center">
                                    <input
                                      type="number"
                                      min="0"
                                      value={temp.sa || ''}
                                      placeholder="0"
                                      onChange={e => updateTempField('sa', e.target.value)}
                                      className={`w-14 px-1.5 py-1 text-center rounded-lg border text-xs font-bold transition-all bg-transparent focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-hidden ${
                                        config.theme === 'dark' ? 'border-zinc-700 text-zinc-100' : 'border-slate-200 text-slate-800'
                                      }`}
                                    />
                                  </td>
                                  <td className="py-1 px-2 text-center">
                                    <input
                                      type="number"
                                      min="0"
                                      value={temp.refund || ''}
                                      placeholder="0"
                                      onChange={e => updateTempField('refund', e.target.value)}
                                      className={`w-14 px-1.5 py-1 text-center rounded-lg border text-xs font-bold transition-all bg-transparent focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-hidden ${
                                        config.theme === 'dark' ? 'border-zinc-700 text-zinc-100' : 'border-slate-200 text-slate-800'
                                      }`}
                                    />
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono font-bold whitespace-nowrap">
                                    <div className="flex flex-col items-end">
                                      <span className={config.theme === 'dark' ? 'text-zinc-200' : 'text-slate-800'}>
                                        GP:{finalGP} | PAID:{finalPaid} | SA:{finalSA}
                                      </span>
                                      {finalRefund > 0 && (
                                        <span className="text-red-500 text-[10px]">
                                          Refund: {finalRefund}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-xl border space-y-2 ${
                      config.theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800 text-zinc-300' : 'bg-slate-50/50 border-slate-150 text-slate-700'
                    }`}>
                      <h4 className="font-bold text-xs uppercase tracking-wide text-orange-500">Petunjuk Format Berkas / Paste</h4>
                      <p className="text-[11px] leading-relaxed">
                        Gunakan file CSV atau salin sel langsung dari file Excel/Spreadsheet Anda. Format kolom wajib terdiri dari 5 kolom berurutan:
                      </p>
                      <div className="p-2.5 rounded-lg bg-black/5 dark:bg-black/20 font-mono text-[10px] space-y-1">
                        <p className="text-[#F58220] font-bold">Tanggal, GP, PAID, SA, REFUND</p>
                        <p className="text-slate-400">1 July 2026, 4, 2, 0, 0</p>
                        <p className="text-slate-400">2 July 2026, 0, 1, 1, 0</p>
                        <p className="text-slate-400">3 July 2026, 2, 0, 3, 1</p>
                      </div>
                      <p className="text-[10px] text-slate-400 italic">
                        * Format Tanggal didukung: "1 Juli 2026", "2026-07-01", "1 July 2026", "1-7-2026", "1/7/2026".
                      </p>
                    </div>

                    {/* File Upload Box */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className={`p-5 rounded-xl border border-dashed flex flex-col items-center justify-center text-center p-6 transition-all ${
                        config.theme === 'dark' ? 'bg-zinc-900/30 border-zinc-800 hover:border-zinc-700' : 'bg-slate-50/30 border-slate-200 hover:border-slate-300'
                      }`}>
                        <Upload className="w-8 h-8 text-slate-400 mb-2 animate-bounce-slow" />
                        <span className="text-xs font-bold block mb-1">Unggah File CSV / TXT</span>
                        <span className="text-[10px] text-slate-400 mb-4 block">Pilih file berformat CSV (.csv) atau Teks (.txt)</span>
                        <label className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-xs">
                          Pilih Berkas
                          <input
                            type="file"
                            accept=".csv,.txt"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (evt) => {
                                const text = evt.target?.result;
                                if (typeof text === 'string') {
                                  processImportText(text);
                                }
                              };
                              reader.readAsText(file);
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Paste spreadsheet Area */}
                      <div className="flex flex-col space-y-1.5">
                        <span className="text-xs font-bold block">Salin & Tempel (Copy-Paste) Sel Excel di Sini:</span>
                        <textarea
                          rows={6}
                          value={pasteText}
                          onChange={(e) => setPasteText(e.target.value)}
                          placeholder="Pilih sel di Excel Anda, salin (Ctrl+C), lalu tempel (Ctrl+V) di sini..."
                          className={`flex-1 p-3 rounded-xl border text-xs font-mono outline-hidden focus:ring-1 focus:ring-orange-500 focus:border-orange-500 ${
                            config.theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600' : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                          }`}
                        />
                        <button
                          onClick={() => {
                            if (!pasteText.trim()) {
                              alert('Silakan tempel teks Excel terlebih dahulu!');
                              return;
                            }
                            processImportText(pasteText);
                          }}
                          className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Proses Data Hasil Tempelan
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className={`p-4 border-t flex flex-wrap items-center justify-between gap-3 ${
                config.theme === 'dark' ? 'border-zinc-800 bg-zinc-900/30' : 'border-slate-100 bg-slate-50/50'
              }`}>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (confirm('Apakah Anda yakin ingin menghapus seluruh data manual untuk periode bulan ini?')) {
                        // Build a clean override list excluding current month
                        const newOverrides = { ...manualOverrides };
                        Object.keys(newOverrides).forEach(key => {
                          if (key.startsWith(selectedMonth)) {
                            delete newOverrides[key];
                          }
                        });
                        setTempOverrides(newOverrides);
                        setManualOverrides(newOverrides);
                        localStorage.setItem('oxygen_daily_overrides', JSON.stringify(newOverrides));
                        setIsActivityModalOpen(false);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 text-red-500 hover:bg-red-500/10 cursor-pointer transition-colors`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Reset Bulan Ini
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsActivityModalOpen(false)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      config.theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      setManualOverrides(tempOverrides);
                      localStorage.setItem('oxygen_daily_overrides', JSON.stringify(tempOverrides));
                      setIsActivityModalOpen(false);
                    }}
                    className="px-5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  // Helper inside modal to parse text input (either CSV file load or Spreadsheet Paste area)
  function processImportText(text: string) {
    const lines = text.split(/\r?\n/);
    const newOverrides = { ...tempOverrides };
    let importedCount = 0;
    let skippedCount = 0;

    lines.forEach((line) => {
      const cleanLine = line.trim();
      if (!cleanLine) return;

      // Handle split by tab, comma, or semicolon
      const cells = cleanLine.split(/[\t,;]+/);
      if (cells.length < 2) return;

      // Skip table header
      const firstCellLower = cells[0].toLowerCase();
      if (
        firstCellLower.includes('tanggal') || 
        firstCellLower.includes('date') || 
        firstCellLower.includes('gp') || 
        firstCellLower.includes('paid')
      ) {
        return;
      }

      const rawDate = cells[0].trim();
      const dateStr = parseImportedDate(rawDate);

      if (dateStr) {
        // Must follow: Tanggal, GP, PAID, SA, REFUND
        const gp = parseInt(cells[1]) || 0;
        const paid = parseInt(cells[2]) || 0;
        const sa = parseInt(cells[3]) || 0;
        const refund = parseInt(cells[4]) || 0;

        newOverrides[dateStr] = { gp, paid, sa, refund };
        importedCount++;
      } else {
        skippedCount++;
      }
    });

    if (importedCount > 0) {
      setTempOverrides(newOverrides);
      setActiveModalTab('manual');
      alert(`Berhasil membaca ${importedCount} baris data harian. Silakan periksa kembali nilainya pada tabel, lalu klik tombol "Simpan Perubahan" di bagian kanan bawah.`);
    } else {
      alert(`Format tidak dikenali. Pastikan data yang dimasukkan memiliki urutan kolom: Tanggal, GP, PAID, SA, REFUND.`);
    }
  }
}
