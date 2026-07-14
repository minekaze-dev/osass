/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Search, Filter, MessageSquare, Phone, MapPin, 
  RefreshCw, Eye, Tag, Calendar, HelpCircle, LayoutGrid, CheckCircle2, Clock 
} from 'lucide-react';
import { Lead, FollowUpStatus, PipelineStage, SalesConfig } from '../types';
import { 
  AREAS, 
  PIPELINE_STAGES, 
  FOLLOW_UP_STATUSES, 
  formatWhatsAppNumber, 
  getStatusColorClasses, 
  getPipelineColorClasses,
  PACKAGE_PRICES,
  LEAD_SOURCES
} from '../utils/helpers';

const splitPackage = (pkgStr: string) => {
  if (!pkgStr) return { name: '-', price: '' };
  const parts = pkgStr.split(/\s*-\s*/);
  if (parts.length > 1) {
    return { name: parts[0], price: parts[1] };
  }
  return { name: pkgStr, price: '' };
};

interface ProspekViewProps {
  leads: Lead[];
  onViewLead: (lead: Lead, historyOnly?: boolean) => void;
  onUpdateStatus: (lead: Lead) => void;
  config: SalesConfig;
  userName: string;
}

export default function ProspekView({ leads, onViewLead, onUpdateStatus, config, userName }: ProspekViewProps) {
  const [search, setSearch] = useState('');
  const [selectedPipeline, setSelectedPipeline] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedSource, setSelectedSource] = useState<string>('All');
  const [selectedArea, setSelectedArea] = useState<string>('All');
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Pipeline Counts for top progress summary bar
  const pipelineCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    PIPELINE_STAGES.forEach(stage => {
      counts[stage] = 0;
    });
    leads.forEach(l => {
      if (counts[l.pipeline] !== undefined) {
        counts[l.pipeline]++;
      }
    });
    return counts;
  }, [leads]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    const filtered = leads.filter(l => {
      // Search matches
      const searchLower = search.toLowerCase();
      const matchesSearch = 
        l.name.toLowerCase().includes(searchLower) ||
        l.whatsapp.includes(searchLower) ||
        l.address.toLowerCase().includes(searchLower) ||
        l.area.toLowerCase().includes(searchLower) ||
        l.packageInterest.toLowerCase().includes(searchLower);

      // Pipeline match
      const matchesPipeline = selectedPipeline === 'All' || l.pipeline === selectedPipeline;

      // Status match
      const matchesStatus = selectedStatus === 'All' || l.status === selectedStatus;

      // Source match
      const matchesSource = selectedSource === 'All' || l.source === selectedSource;

      // Area match
      const matchesArea = selectedArea === 'All' || l.area === selectedArea;

      // Date match
      const matchesDate = !selectedDate || l.createdAt === selectedDate;

      return matchesSearch && matchesPipeline && matchesStatus && matchesArea && matchesSource && matchesDate;
    });

    // Sort by latest createdAt date descending
    return filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  }, [leads, search, selectedPipeline, selectedStatus, selectedArea, selectedDate]);

  return (
    <div className="space-y-6">
      
      {/* Pipeline Stages Visual Counter */}
      {/* 
      <div className="bg-white dark:bg-[#1c1c1f] rounded-2xl border border-slate-100 dark:border-zinc-800 p-4 shadow-xs overflow-x-auto">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <span className="text-xs font-bold text-[#F58220] uppercase tracking-wider flex items-center gap-1">
            <LayoutGrid className="w-3.5 h-3.5" /> Alur Prospek
          </span>
          <span className="text-[10px] text-slate-400 dark:text-zinc-500">Total Prospek: {leads.length}</span>
        </div>
        
        <div className="flex justify-between items-center min-w-[640px] gap-2 pb-1">
          {PIPELINE_STAGES.map((stage, idx) => {
            const count = pipelineCounts[stage] || 0;
            const isSelected = selectedPipeline === stage;
            
            return (
              <div 
                key={stage}
                onClick={() => setSelectedPipeline(isSelected ? 'All' : stage)}
                className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl cursor-pointer border transition-all h-16 ${
                  isSelected 
                    ? 'bg-[#F58220] border-[#F58220] text-white shadow-sm scale-102' 
                    : count > 0 
                    ? 'bg-orange-50/50 dark:bg-[#F58220]/10 border-orange-100 dark:border-orange-500/20 text-slate-700 dark:text-zinc-300 hover:border-orange-200 dark:hover:border-orange-500/40' 
                    : 'bg-slate-50/50 dark:bg-zinc-900/40 border-slate-100 dark:border-zinc-800/60 text-slate-400 dark:text-zinc-500 hover:border-slate-200 dark:hover:border-zinc-700'
                }`}
              >
                <span className="text-[11px] font-bold line-clamp-2 text-center px-1 leading-tight">
                  {stage}
                </span>
                <span className={`text-xs font-black mt-0.5 ${isSelected ? 'text-white' : count > 0 ? 'text-[#F58220]' : 'text-slate-400 dark:text-zinc-500'}`}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      */}

      {/* Filters & Search Header */}
      <div className="bg-white dark:bg-[#1c1c1f] rounded-2xl border border-slate-100 dark:border-zinc-800 p-5 shadow-xs space-y-4">
        {/* Row 1: Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4.5 w-4.5 text-slate-400 dark:text-zinc-500" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama prospek, nomor WA, alamat, paket, atau wilayah..."
            className="block w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-[#F58220] transition-colors shadow-inner"
          />
        </div>

        {/* Row 2: Select Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Pipeline stage */}
          <div className="hidden">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase mb-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter Alur
            </label>
            <select
              value={selectedPipeline}
              onChange={(e) => setSelectedPipeline(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-slate-700 dark:text-zinc-300 focus:outline-none focus:border-[#F58220] transition-colors"
            >
              <option value="All">Semua Alur</option>
              {PIPELINE_STAGES.map(pl => (
                <option key={pl} value={pl}>{pl}</option>
              ))}
            </select>
          </div>

          {/* Follow up status */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase mb-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-slate-700 dark:text-zinc-300 focus:outline-none focus:border-[#F58220] transition-colors"
            >
              <option value="All">Semua Status</option>
              {FOLLOW_UP_STATUSES.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Area filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase mb-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter Wilayah
            </label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-slate-700 dark:text-zinc-300 focus:outline-none focus:border-[#F58220] transition-colors"
            >
              <option value="All">Semua Wilayah</option>
              {AREAS.map(ar => (
                <option key={ar} value={ar}>{ar}</option>
              ))}
            </select>
          </div>

          {/* Source filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase mb-1 flex items-center gap-1">
              <Tag className="w-3 h-3" /> Filter Sumber
            </label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-slate-700 dark:text-zinc-300 focus:outline-none focus:border-[#F58220] transition-colors"
            >
              <option value="All">Semua Sumber</option>
              {LEAD_SOURCES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Date filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Filter Tanggal
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-slate-700 dark:text-zinc-300 focus:outline-none focus:border-[#F58220] transition-colors h-[29.5px]"
            />
          </div>
        </div>

        {/* Filters Reset feedback */}
        {(selectedPipeline !== 'All' || selectedStatus !== 'All' || selectedArea !== 'All' || selectedDate || search) && (
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-900/60 p-2 rounded-xl border border-slate-100 dark:border-zinc-800">
            <span>
              Menampilkan <span className="font-bold text-slate-700 dark:text-zinc-200">{filteredLeads.length}</span> dari {leads.length} prospek
              {selectedDate && (
                <span> pada tanggal <span className="font-bold text-[#F58220]">{selectedDate}</span></span>
              )}
            </span>
            <button
              onClick={() => {
                setSearch('');
                setSelectedPipeline('All');
                setSelectedStatus('All');
                setSelectedArea('All');
                setSelectedDate('');
              }}
              className="text-xs font-semibold text-[#F58220] hover:text-[#E0721B]"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Prospect Table View */}
      {filteredLeads.length > 0 ? (
        <div className="bg-white dark:bg-[#1c1c1f] rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px] md:min-w-full">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-zinc-900/60 border-b border-slate-100 dark:border-zinc-800 text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3 font-bold whitespace-nowrap text-center">No</th>
                  <th className="py-2.5 px-3 font-bold whitespace-nowrap">Customer</th>
                  <th className="py-2.5 px-3 font-bold whitespace-nowrap">Telepon</th>
                  <th className="py-2.5 px-3 font-bold whitespace-nowrap">Tanggal</th>
                  <th className="py-2.5 px-3 font-bold whitespace-nowrap">Sumber Data</th>
                  <th className="py-2.5 px-3 font-bold whitespace-nowrap">Status</th>
                  <th className="py-2.5 px-3 font-bold whitespace-nowrap">FU</th>
                  <th className="py-2.5 px-3 text-right pr-4 font-bold whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-xs text-slate-700 dark:text-zinc-300">
                {filteredLeads.map((prospect, idx) => {
                  const waNumber = formatWhatsAppNumber(prospect.whatsapp);
                  const mapQuery = encodeURIComponent(`${prospect.name} ${prospect.address} ${prospect.area}`);
                  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
                  
                  const waGreeting = `Halo ${prospect.name}, saya ${userName} dari WiFi Oxygen. `;
                  const waTemplate = `Semoga sehat selalu Bapak/Bibu. Terkait layanan Oxygen WiFi rumahnya, apakah ada yang bisa kami bantu konfirmasi kembali?`;
                  const waUrl = `https://api.whatsapp.com/send?phone=${waNumber}&text=${encodeURIComponent(waTemplate)}`;

                  // Helper to format date
                  const formatDate = (dateStr: string) => {
                    if (!dateStr) return '-';
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                    const parts = dateStr.split('-');
                    if (parts.length === 3) {
                      const year = parts[0];
                      const monthIdx = parseInt(parts[1], 10) - 1;
                      const day = parseInt(parts[2], 10);
                      return `${day} ${months[monthIdx] || parts[1]} ${year}`;
                    }
                    return dateStr;
                  };

                  return (
                    <motion.tr
                      key={prospect.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15, delay: Math.min(idx * 0.02, 0.2) }}
                      className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 transition-colors group"
                    >
                      {/* Numbering */}
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 font-medium">{idx + 1}</span>
                      </td>

                      {/* Name */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-800 dark:text-zinc-100 text-xs sm:text-[13px] truncate max-w-[120px]">
                          {prospect.name && prospect.name.trim() !== '' && prospect.name !== '-' ? prospect.name : '-'}
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                         <div className="text-[11px] text-slate-600 dark:text-zinc-300 font-mono">{prospect.whatsapp}</div>
                      </td>

                      {/* Created At (Initial chat date) */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-50 text-orange-600 border border-orange-100 dark:text-orange-300 font-bold text-[10px]">
                          <Calendar className="w-3 h-3 text-[#F58220]" />
                          <span>{formatDate(prospect.createdAt)}</span>
                        </div>
                      </td>

                      {/* Source */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                           <Tag className="w-3 h-3 text-[#F58220]" />
                           <span className="font-bold text-slate-700 dark:text-zinc-200 text-[11px]">{prospect.source || '-'}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${getStatusColorClasses(prospect.status).bg}`}>
                          {prospect.status}
                        </span>
                      </td>

                      {/* Follow-up count & optional reminder */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 dark:text-zinc-200 text-[10px]">{prospect.followUpCount}x FU</span>
                          <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                            {(() => {
                              if (prospect.followUpCount === 0) return 'Hari ke-0';
                              const pattern = (config.reminderPattern || '1,2,4,7').split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                              const day = pattern[prospect.followUpCount - 1] || prospect.followUpCount;
                              return `Hari ke-${day}`;
                            })()}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right pr-4 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Chat WA */}
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg transition-all"
                            title="WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>

                          <button
                            onClick={() => onUpdateStatus(prospect)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition-all border border-amber-200/30"
                            title="Update Status"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold">Update</span>
                          </button>

                          <button
                            onClick={() => onViewLead(prospect, true)}
                            className="p-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-all"
                            title="Detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
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
        <div className="text-center py-16 bg-white dark:bg-[#1c1c1f] rounded-2xl border border-slate-100 dark:border-zinc-800 flex flex-col items-center justify-center gap-3">
          <HelpCircle className="w-12 h-12 text-slate-300 dark:text-zinc-700" />
          <div>
            <p className="font-bold text-slate-700 dark:text-zinc-300">Tidak ada prospek ditemukan</p>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Coba ubah kata pencarian atau bersihkan filter di atas.</p>
          </div>
        </div>
      )}
    </div>
  );
}
