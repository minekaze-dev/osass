/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Bell, AlertCircle, Calendar, MessageSquare, 
  Clock, ArrowRight, UserCheck, Eye, RefreshCw 
} from 'lucide-react';
import { Lead, SalesConfig } from '../types';
import { 
  formatWhatsAppNumber, 
  getStatusColorClasses, 
  getDaysElapsed,
  isLeadActiveProspect
} from '../utils/helpers';

interface ReminderViewProps {
  leads: Lead[];
  onViewLead: (lead: Lead, historyOnly?: boolean) => void;
  onUpdateStatus: (lead: Lead) => void;
  config: SalesConfig;
  userName: string;
}

type ReminderGroup = 'hari-ini' | 'besok' | 'terlambat' | 'thinking' | 'nbp';

export default function ReminderView({ leads, onViewLead, onUpdateStatus, config, userName }: ReminderViewProps) {
  const TODAY_STR = '2026-07-10';
  const TOMORROW_STR = '2026-07-11';
  
  const [activeGroup, setActiveGroup] = useState<ReminderGroup>('hari-ini');

  // Filter out closed and un-actionable prospects
  const actionableLeads = useMemo(() => {
    return leads.filter(isLeadActiveProspect);
  }, [leads]);

  // Groupings
  const groups = useMemo(() => {
    const hariIni = actionableLeads.filter(l => l.nextReminderDate === TODAY_STR);
    const besok = actionableLeads.filter(l => l.nextReminderDate === TOMORROW_STR);
    const terlambat = actionableLeads.filter(l => l.nextReminderDate !== null && l.nextReminderDate < TODAY_STR);
    const thinking = actionableLeads.filter(l => l.status === 'Thinking');
    const nbp = actionableLeads.filter(l => l.status === 'NBP');

    return { hariIni, besok, terlambat, thinking, nbp };
  }, [actionableLeads]);

  // Milestone counters
  const milestoneCounts = useMemo(() => {
    const pattern = (config.reminderPattern || '1,2,4,7').split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    
    let fu0 = 0; // brand new
    let fu1 = 0; // first pattern step
    let fu2 = 0; // second pattern step
    let fu3 = 0; // third pattern step
    let overdueCount = 0;

    actionableLeads.forEach(l => {
      if (l.followUpCount === 0) fu0++;
      else if (l.followUpCount === 1) fu1++;
      else if (l.followUpCount === 2) fu2++;
      else if (l.followUpCount >= 3) fu3++;

      if (l.nextReminderDate && l.nextReminderDate < TODAY_STR) {
        overdueCount++;
      }
    });

    return { 
      fu0, 
      fu1, 
      fu2, 
      fu3, 
      overdue: overdueCount,
      pattern
    };
  }, [actionableLeads, config.reminderPattern]);

  // Helper to determine safety color badges
  // Hijau = Aman, Kuning = Segera, Merah = Terlambat
  const getSafetyBadge = (lead: Lead) => {
    const remDate = lead.nextReminderDate;
    if (!remDate) return { text: 'Aman', css: 'bg-emerald-500 text-white' };
    
    if (remDate < TODAY_STR) {
      return { text: 'Terlambat', css: 'bg-rose-500 text-white' };
    }
    if (remDate === TODAY_STR) {
      return { text: 'Segera', css: 'bg-amber-500 text-white' };
    }
    return { text: 'Aman', css: 'bg-emerald-500 text-white' };
  };

  // Select list of leads to show based on activeGroup
  const currentLeadsToShow = useMemo(() => {
    switch (activeGroup) {
      case 'hari-ini': return groups.hariIni;
      case 'besok': return groups.besok;
      case 'terlambat': return groups.terlambat;
      case 'thinking': return groups.thinking;
      case 'nbp': return groups.nbp;
      default: return [];
    }
  }, [activeGroup, groups]);

  return (
    <div className="space-y-6">
      
      {/* Milestone Counters Dashboard */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Monitoring Status Follow Up</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          
          {/* FU Hari ke-0 */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-500 block">FU Hari ke-0</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-black text-slate-700">{milestoneCounts.fu0}</span>
              <span className="text-[9px] text-slate-400">leads</span>
            </div>
          </div>

          {/* FU Step 1 */}
          <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/60 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-blue-600 block">FU Hari ke-{milestoneCounts.pattern[0] || 1}</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-black text-blue-700">{milestoneCounts.fu1}</span>
              <span className="text-[9px] text-blue-400">leads</span>
            </div>
          </div>

          {/* FU Step 2 */}
          <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100/60 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-amber-600 block font-semibold">FU Hari ke-{milestoneCounts.pattern[1] || 2}</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-black text-amber-700">{milestoneCounts.fu2}</span>
              <span className="text-[9px] text-amber-400">leads</span>
            </div>
          </div>

          {/* FU Step 3+ */}
          <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/60 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-indigo-600 block">FU Hari ke-{milestoneCounts.pattern[2] || 4}+</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-black text-indigo-700">{milestoneCounts.fu3}</span>
              <span className="text-[9px] text-slate-400">leads</span>
            </div>
          </div>

          {/* Terlambat */}
          <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100/60 flex flex-col justify-between col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-rose-600 block">Terlambat FU</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-black text-rose-700">{groups.terlambat.length}</span>
              <span className="text-[9px] text-rose-400">telat</span>
            </div>
          </div>

        </div>
      </div>

      {/* Main Tabs Segment Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200">
        <div className="flex flex-wrap gap-1">
          {/* Hari Ini */}
          <button
            onClick={() => setActiveGroup('hari-ini')}
            className={`pb-3 px-3 text-xs font-bold transition-all relative ${
              activeGroup === 'hari-ini' 
                ? 'text-[#F58220] border-b-2 border-[#F58220]' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Hari Ini
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono">
              {groups.hariIni.length}
            </span>
          </button>

          {/* Besok */}
          <button
            onClick={() => setActiveGroup('besok')}
            className={`pb-3 px-3 text-xs font-bold transition-all relative ${
              activeGroup === 'besok' 
                ? 'text-[#F58220] border-b-2 border-[#F58220]' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Besok
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono">
              {groups.besok.length}
            </span>
          </button>

          {/* Terlambat */}
          <button
            onClick={() => setActiveGroup('terlambat')}
            className={`pb-3 px-3 text-xs font-bold transition-all relative ${
              activeGroup === 'terlambat' 
                ? 'text-[#F58220] border-b-2 border-[#F58220]' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Terlambat
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-mono font-bold">
              {groups.terlambat.length}
            </span>
          </button>

          {/* Thinking */}
          <button
            onClick={() => setActiveGroup('thinking')}
            className={`pb-3 px-3 text-xs font-bold transition-all relative ${
              activeGroup === 'thinking' 
                ? 'text-[#F58220] border-b-2 border-[#F58220]' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Thinking
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono">
              {groups.thinking.length}
            </span>
          </button>

          {/* NBP */}
          <button
            onClick={() => setActiveGroup('nbp')}
            className={`pb-3 px-3 text-xs font-bold transition-all relative ${
              activeGroup === 'nbp' 
                ? 'text-[#F58220] border-b-2 border-[#F58220]' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            NBP
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono">
              {groups.nbp.length}
            </span>
          </button>
        </div>
        
        <span className="text-[11px] text-slate-400 font-medium self-end sm:pb-3">
          Aturan: Thinking +{config.reminderThinkingDays} hari, Otomatis Pola ({config.reminderPattern || '1,2,4,7'})
        </span>
      </div>

      {/* Leads List Content */}
      {currentLeadsToShow.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentLeadsToShow.map((lead, idx) => {
            const safety = getSafetyBadge(lead);
            const waNumber = formatWhatsAppNumber(lead.whatsapp);
            const waGreeting = `Halo ${lead.name}, saya ${userName} dari WiFi Oxygen. `;
            const waTemplate = lead.status === 'Thinking'
              ? `${waGreeting}Bagaimana kelanjutan pendaftaran WiFi Oxygen-nya kemarin Kak? Mumpung slot FAT masih free.`
              : `${waGreeting}Kira-kira kapan kami bisa jadwalkan survey lokasi untuk pemasangan WiFi Oxygen di rumah Kakak?`;
            const waUrl = `https://api.whatsapp.com/send?phone=${waNumber}&text=${encodeURIComponent(waTemplate)}`;
            const daysSinceCreated = getDaysElapsed(lead.createdAt);

            return (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(idx * 0.04, 0.25) }}
                className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative"
              >
                {/* Safety Badge Floating Indicator */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md ${safety.css}`}>
                    {safety.text}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 pr-16">{lead.name}</h4>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{lead.whatsapp}</span>

                  <div className="flex flex-wrap gap-1.5 my-2.5">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getStatusColorClasses(lead.status).bg}`}>
                      {lead.status}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-600">
                      Area: {lead.area}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100/50 mb-4">
                    <p className="flex justify-between">
                      <span className="text-slate-400">Jadwal Reminder:</span>
                      <span className="font-semibold text-amber-700 font-mono">{lead.nextReminderDate || '-'}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-400 font-medium">Lama Terdaftar:</span>
                      <span className="font-semibold text-slate-600">Hari ke-{daysSinceCreated}</span>
                    </p>
                    <p className="flex justify-between pb-1 border-b border-dashed border-slate-200">
                      <span className="text-slate-400">Frekuensi FU:</span>
                      <span className="font-bold text-orange-600">{lead.followUpCount}x Follow Up</span>
                    </p>
                    <p className="text-slate-500 block italic pt-1.5 line-clamp-1">
                      "{lead.notes || 'Tidak ada catatan.'}"
                    </p>
                  </div>
                </div>

                {/* Card actions */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400">
                    Input: {lead.createdAt}
                  </span>
                  
                  <div className="flex gap-2">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-xs"
                      title="Follow Up WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </a>

                    <button
                      onClick={() => onUpdateStatus(lead)}
                      className="p-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                    >
                      <RefreshCw className="w-4 h-4" /> Status
                    </button>

                    <button
                      onClick={() => onViewLead(lead, true)}
                      className="p-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                    >
                      <Eye className="w-4 h-4" /> Log
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center gap-3">
          <Clock className="w-12 h-12 text-slate-300" />
          <div>
            <p className="font-bold text-slate-700">Tidak ada agenda di kategori ini</p>
            <p className="text-xs text-slate-400 mt-1">Kamu terbebas dari tugas kategori "{activeGroup}" sekarang!</p>
          </div>
        </div>
      )}
    </div>
  );
}
