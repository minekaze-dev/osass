/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Search, Filter, MessageSquare, Phone, MapPin, 
  RefreshCw, Eye, Tag, Calendar, HelpCircle, LayoutGrid, CheckCircle2, Clock, 
  Edit2, Check, X, Upload, FileSpreadsheet, Database
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Lead, FollowUpStatus, PipelineStage, SalesConfig } from '../types';
import { 
  AREAS, 
  PIPELINE_STAGES, 
  FOLLOW_UP_STATUSES, 
  formatWhatsAppNumber, 
  getStatusColorClasses, 
  getPipelineColorClasses,
  PACKAGE_PRICES,
  LEAD_SOURCES,
  getTodayStr,
  isLeadActiveProspect
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
  onUpdateLead: (lead: Lead) => void;
  onBulkUpdateLeads?: (updatedLeads: Lead[]) => void;
  onImportLeads?: (importedLeads: Lead[]) => void;
  config: SalesConfig;
  userName: string;
}

export default function ProspekView({ leads, onViewLead, onUpdateStatus, onUpdateLead, onBulkUpdateLeads, onImportLeads, config, userName }: ProspekViewProps) {
  const [search, setSearch] = useState('');
  const [selectedPipeline, setSelectedPipeline] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedSource, setSelectedSource] = useState<string>('All');
  const [selectedArea, setSelectedArea] = useState<string>('All');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [tempDate, setTempDate] = useState<string>('');
  const [tempSource, setTempSource] = useState<string>('');

  // Bulk Edit selection and values state
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<string>('');
  const [bulkSource, setBulkSource] = useState<string>('');

  // Handle row edit start
  const startEditing = (lead: Lead) => {
    setEditingRow(lead.id);
    const dateOnly = lead.createdAt ? lead.createdAt.split('T')[0] : '';
    setTempDate(dateOnly);
    setTempSource(lead.source || '-');
  };

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

  // Split lists into Active and Pool (Inactive/Older than 3 days NBP/Not Coverage/Not Interested)
  const activeProspectsList = useMemo(() => {
    return filteredLeads.filter(l => isLeadActiveProspect(l));
  }, [filteredLeads]);

  const poolProspectsList = useMemo(() => {
    return filteredLeads.filter(l => !isLeadActiveProspect(l));
  }, [filteredLeads]);

  // Selection helpers
  const isAllSelected = useMemo(() => {
    if (filteredLeads.length === 0) return false;
    return filteredLeads.every(l => selectedLeadIds.includes(l.id));
  }, [filteredLeads, selectedLeadIds]);

  const handleSelectAll = () => {
    if (isAllSelected) {
      const filteredIds = new Set(filteredLeads.map(l => l.id));
      setSelectedLeadIds(prev => prev.filter(id => !filteredIds.has(id)));
    } else {
      const filteredIds = filteredLeads.map(l => l.id);
      setSelectedLeadIds(prev => {
        const union = new Set([...prev, ...filteredIds]);
        return Array.from(union);
      });
    }
  };

  const isAllActiveSelected = useMemo(() => {
    if (activeProspectsList.length === 0) return false;
    return activeProspectsList.every(l => selectedLeadIds.includes(l.id));
  }, [activeProspectsList, selectedLeadIds]);

  const handleSelectAllActive = () => {
    if (isAllActiveSelected) {
      const activeIds = new Set(activeProspectsList.map(l => l.id));
      setSelectedLeadIds(prev => prev.filter(id => !activeIds.has(id)));
    } else {
      const activeIds = activeProspectsList.map(l => l.id);
      setSelectedLeadIds(prev => {
        const union = new Set([...prev, ...activeIds]);
        return Array.from(union);
      });
    }
  };

  const isAllPoolSelected = useMemo(() => {
    if (poolProspectsList.length === 0) return false;
    return poolProspectsList.every(l => selectedLeadIds.includes(l.id));
  }, [poolProspectsList, selectedLeadIds]);

  const handleSelectAllPool = () => {
    if (isAllPoolSelected) {
      const poolIds = new Set(poolProspectsList.map(l => l.id));
      setSelectedLeadIds(prev => prev.filter(id => !poolIds.has(id)));
    } else {
      const poolIds = poolProspectsList.map(l => l.id);
      setSelectedLeadIds(prev => {
        const union = new Set([...prev, ...poolIds]);
        return Array.from(union);
      });
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedLeadIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleApplyBulkEdit = () => {
    if (!bulkStatus && !bulkSource) {
      alert('Silakan pilih Status Baru atau Sumber Data Baru terlebih dahulu!');
      return;
    }

    if (selectedLeadIds.length === 0) {
      alert('Tidak ada prospek yang terpilih!');
      return;
    }

    const todayStr = getTodayStr();
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const leadsToUpdate = leads.filter(l => selectedLeadIds.includes(l.id));
    const updatedLeads = leadsToUpdate.map(l => {
      let updated = { ...l };
      let notesParts: string[] = [];

      if (bulkSource) {
        updated.source = bulkSource as any;
        notesParts.push(`Sumber data diubah massal menjadi: ${bulkSource}`);
      }

      if (bulkStatus) {
        const statusVal = bulkStatus as FollowUpStatus;
        const pipelineVal = getPipelineForStatus(statusVal);
        updated.status = statusVal;
        updated.pipeline = pipelineVal;
        updated.lastFollowUpDate = todayStr;
        updated.followUpCount = l.followUpCount + 1;
        notesParts.push(`Status diubah massal menjadi: ${statusVal}`);

        const isActive = pipelineVal === 'Aktif';
        if (isActive) {
          updated.closingDate = l.closingDate || todayStr;
          updated.customerStatus = l.customerStatus || 'Aktif';
          updated.closingStatus = 'Closed';
        }
      }

      const newHistoryEntry = {
        id: `hist-${Date.now()}-bulk-${Math.random().toString(36).substring(2, 9)}`,
        date: `${todayStr} ${timeStr}`,
        status: updated.status,
        pipeline: updated.pipeline,
        notes: notesParts.join(', ') + '.',
      };

      updated.history = [newHistoryEntry, ...l.history];
      return updated;
    });

    if (onBulkUpdateLeads) {
      onBulkUpdateLeads(updatedLeads);
    } else {
      updatedLeads.forEach(ul => onUpdateLead(ul));
    }

    alert(`Berhasil memperbarui ${updatedLeads.length} prospek!`);
    setSelectedLeadIds([]);
    setBulkStatus('');
    setBulkSource('');
  };

  // Helper to parse dates
  const parseIndonesianOrStandardDate = (dateStr: string): string => {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    
    let str = dateStr.trim().toLowerCase();
    
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      return str.substring(0, 10);
    }
    
    const idMonths: Record<string, string> = {
      'januari': '01', 'jan': '01',
      'februari': '02', 'feb': '02',
      'maret': '03', 'mar': '03',
      'april': '04', 'apr': '04',
      'mei': '05',
      'juni': '06', 'jun': '06',
      'juli': '07', 'jul': '07',
      'agustus': '08', 'agu': '08', 'ags': '08',
      'september': '09', 'sep': '09',
      'oktober': '10', 'okt': '10',
      'november': '11', 'nov': '11',
      'desember': '12', 'des': '12'
    };

    const parts = str.split(/\s+/);
    if (parts.length >= 3) {
      const day = parts[0].padStart(2, '0');
      const monthWord = parts[1];
      const year = parts[2];
      
      const monthNum = idMonths[monthWord];
      if (monthNum && /^\d+$/.test(day) && /^\d{4}$/.test(year)) {
        return `${year}-${monthNum}-${day}`;
      }
    }

    const slashParts = str.split(/[\/\-]/);
    if (slashParts.length === 3) {
      const p1 = slashParts[0].padStart(2, '0');
      const p2 = slashParts[1].padStart(2, '0');
      const p3 = slashParts[2];
      
      if (p3.length === 4 && /^\d+$/.test(p1) && /^\d+$/.test(p2)) {
        return `${p3}-${p2}-${p1}`;
      }
      if (p1.length === 4 && /^\d+$/.test(p2) && /^\d+$/.test(p3)) {
        return `${p1}-${p2}-${p3}`;
      }
    }

    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    } catch (e) {}

    return new Date().toISOString().split('T')[0];
  };

  const mapRemarkToStatus = (remark: string): FollowUpStatus => {
    const clean = (remark || '').trim().toUpperCase();
    if (clean.includes('NOT INT')) return 'Not Interested';
    if (clean.includes('NBP') || clean.includes('TIDAK RESPON')) return 'NBP';
    if (clean.includes('UNCOVER') || clean.includes('NOT COV') || clean.includes('TIDAK TERCOVER')) return 'Not Coverage';
    if (clean.includes('INTEREST')) return 'Interested';
    if (clean.includes('THINKING')) return 'Thinking';
    if (clean.includes('PAID')) return 'Paid';
    if (clean.includes('CLOSING')) return 'Closing';
    if (clean.includes('INSTALLED') || clean.includes('AKTIF') || clean === 'ACTIVE') return 'Installed';
    if (clean.includes('AREA FULL')) return 'Area Full';
    if (clean.includes('INVALID')) return 'Invalid Number';
    if (clean.includes('GENERAL PAYMENT') || clean.includes('GP')) return 'General Payment';
    return 'Interested';
  };

  const getPipelineForStatus = (status: FollowUpStatus): PipelineStage => {
    if (status === 'Installed' || status === 'Closing' || status === 'Paid') return 'Aktif';
    if (status === 'General Payment') return 'Menunggu Berkas';
    if (status === 'Not Interested' || status === 'Not Coverage' || status === 'Invalid Number') return 'Tidak Tercover';
    return 'Follow Up';
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rawData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });
        if (rawData.length === 0) {
          alert('File kosong!');
          return;
        }

        const headers = (rawData[0] as any[]).map(h => String(h || '').trim().toLowerCase());
        
        const colIdxTanggal = headers.findIndex(h => h.includes('tanggal') || h === 'tgl');
        const colIdxNoHP = headers.findIndex(h => h.includes('hp') || h.includes('telp') || h.includes('wa') || h.includes('phone') || h.includes('no wa') || h.includes('no telepon') || h.includes('no_hp'));
        const colIdxRemark = headers.findIndex(h => h.includes('remark') || h.includes('status') || h.includes('keterangan'));
        const colIdxNote = headers.findIndex(h => h.includes('note') || h.includes('riwayat') || h.includes('fu') || h.includes('follow up') || h.includes('keterangan'));

        if (colIdxNoHP === -1) {
          alert('Kolom "No HP" atau nomor telepon tidak ditemukan di baris pertama file!');
          return;
        }

        const importedLeads: Lead[] = [];
        
        let maxCstNumber = 0;
        leads.forEach(l => {
          const match = (l.name || '').match(/cst-(\d+)/i);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxCstNumber) {
              maxCstNumber = num;
            }
          }
        });

        for (let r = 1; r < rawData.length; r++) {
          const row = rawData[r] as any[];
          if (!row || row.length === 0) continue;

          const phoneRaw = colIdxNoHP !== -1 ? row[colIdxNoHP] : null;
          if (!phoneRaw) continue;

          let cleanedPhone = String(phoneRaw).replace(/[^\d+]/g, '').trim();
          if (!cleanedPhone) continue;

          if (cleanedPhone.startsWith('0')) {
            cleanedPhone = '62' + cleanedPhone.substring(1);
          } else if (!cleanedPhone.startsWith('62') && !cleanedPhone.startsWith('+')) {
            cleanedPhone = '62' + cleanedPhone;
          }

          let dateParsed = new Date().toISOString().split('T')[0];
          if (colIdxTanggal !== -1 && row[colIdxTanggal]) {
            const dateVal = row[colIdxTanggal];
            if (dateVal instanceof Date) {
              dateParsed = dateVal.toISOString().split('T')[0];
            } else {
              dateParsed = parseIndonesianOrStandardDate(String(dateVal));
            }
          }

          const nextNum = maxCstNumber + importedLeads.length + 1;
          const customerName = `cst-${String(nextNum).padStart(3, '0')}`;

          const remarkRaw = colIdxRemark !== -1 ? String(row[colIdxRemark] || '') : '';
          const remarkStatus = mapRemarkToStatus(remarkRaw);

          const noteRaw = colIdxNote !== -1 ? String(row[colIdxNote] || '') : '';
          const isNoteAktif = noteRaw.toLowerCase().includes('aktif');

          const finalStatus = isNoteAktif ? 'Installed' : remarkStatus;
          const finalPipeline = isNoteAktif ? 'Aktif' : getPipelineForStatus(remarkStatus);
          const finalCustomerStatus = isNoteAktif ? 'Aktif' : undefined;
          const finalClosingStatus = isNoteAktif ? 'Closed' : undefined;
          const finalClosingDate = isNoteAktif ? dateParsed : undefined;

          const newLead: Lead = {
            id: `lead-${Date.now()}-${r}-${Math.random().toString(36).substring(2, 9)}`,
            userId: 'admin',
            whatsapp: cleanedPhone,
            name: customerName,
            address: '-',
            area: '-',
            source: '-',
            packageInterest: '-',
            notes: noteRaw,
            status: finalStatus,
            pipeline: finalPipeline,
            followUpCount: (noteRaw || isNoteAktif) ? 1 : 0,
            nextReminderDate: null,
            lastFollowUpDate: dateParsed,
            createdAt: dateParsed,
            customerStatus: finalCustomerStatus,
            closingStatus: finalClosingStatus,
            closingDate: finalClosingDate,
            history: (noteRaw || isNoteAktif) ? [
              {
                id: `hist-${Date.now()}-${r}-${Math.random().toString(36).substring(2, 9)}`,
                date: `${dateParsed} 12:00`,
                status: finalStatus,
                pipeline: finalPipeline,
                notes: noteRaw || 'Sudah aktif dari import file'
              }
            ] : []
          };

          importedLeads.push(newLead);
        }

        if (importedLeads.length === 0) {
          alert('Tidak ada data prospek valid yang bisa diimpor.');
          return;
        }

        if (onImportLeads) {
          onImportLeads(importedLeads);
          alert(`Berhasil mengimpor ${importedLeads.length} data prospek!`);
        } else {
          alert('Callback onImportLeads tidak tersedia.');
        }

      } catch (error: any) {
        console.error('Error importing file:', error);
        alert('Gagal membaca file: ' + error.message);
      }
    };

    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const renderProspectTable = (
    title: string, 
    list: Lead[], 
    isTableAllSelected: boolean, 
    onSelectAll: () => void,
    indicatorColor: string,
    animatePulse: boolean
  ) => {
    if (list.length === 0) {
      return (
        <div className="mb-6 bg-white dark:bg-[#1c1c1f] rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-xs p-8 text-center">
          <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">Tidak ada prospek di kategori ini</p>
        </div>
      );
    }

    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-2.5 h-2.5 rounded-full ${indicatorColor} ${animatePulse ? 'animate-pulse' : ''}`} />
          <h3 className={`font-bold text-xs sm:text-sm uppercase tracking-wider ${config.theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'}`}>
            {title} ({list.length})
          </h3>
        </div>

        <div className="bg-white dark:bg-[#1c1c1f] rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px] md:min-w-full">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-zinc-900/60 border-b border-slate-100 dark:border-zinc-800 text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3 font-bold whitespace-nowrap text-center w-10">
                    <input
                      type="checkbox"
                      checked={isTableAllSelected}
                      onChange={onSelectAll}
                      className="rounded border-slate-300 dark:border-zinc-700 text-[#F58220] focus:ring-[#F58220] cursor-pointer w-4 h-4"
                    />
                  </th>
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
                {list.map((prospect, idx) => {
                  const waNumber = formatWhatsAppNumber(prospect.whatsapp);
                  const waUrl = `https://api.whatsapp.com/send?phone=${waNumber}`;

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
                      {/* Checkbox */}
                      <td className="py-2.5 px-3 text-center w-10">
                        <input
                          type="checkbox"
                          checked={selectedLeadIds.includes(prospect.id)}
                          onChange={() => handleSelectOne(prospect.id)}
                          className="rounded border-slate-300 dark:border-zinc-700 text-[#F58220] focus:ring-[#F58220] cursor-pointer w-4 h-4"
                        />
                      </td>

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

                      {/* Created At */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {editingRow === prospect.id ? (
                          <input
                            type="date"
                            value={tempDate}
                            onChange={(e) => setTempDate(e.target.value)}
                            className="px-1.5 py-0.5 border border-slate-200 rounded-md text-[11px] bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-200 font-mono"
                          />
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-50 text-orange-600 border border-orange-100 dark:text-orange-300 font-bold text-[10px]">
                            <Calendar className="w-3 h-3 text-[#F58220]" />
                            <span>{formatDate(prospect.createdAt)}</span>
                          </div>
                        )}
                      </td>

                      {/* Source */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {editingRow === prospect.id ? (
                          <select
                            value={tempSource}
                            onChange={(e) => setTempSource(e.target.value)}
                            className="px-1.5 py-0.5 border border-slate-200 dark:border-zinc-700 rounded-md text-[11px] bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-200"
                          >
                            <option value="-">-</option>
                            {LEAD_SOURCES.map(src => (
                              <option key={src} value={src}>{src}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex items-center gap-1.5">
                             <Tag className="w-3 h-3 text-[#F58220]" />
                             <span className="font-bold text-slate-700 dark:text-zinc-200 text-[11px]">{prospect.source || '-'}</span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <select
                          value={prospect.status}
                          onChange={(e) => {
                            const newStatus = e.target.value as FollowUpStatus;
                            const todayStr = getTodayStr();
                            const now = new Date();
                            const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                            
                            const newHistoryEntry = {
                              id: `hist-${Date.now()}-status-quick`,
                              date: `${todayStr} ${timeStr}`,
                              status: newStatus,
                              pipeline: prospect.pipeline,
                              notes: `Status diubah cepat dari tabel menjadi: ${newStatus}.`,
                            };

                            onUpdateLead({
                              ...prospect,
                              status: newStatus,
                              history: [newHistoryEntry, ...prospect.history]
                            });
                          }}
                          className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-200 dark:bg-zinc-900 ${getStatusColorClasses(prospect.status).bg}`}
                        >
                          {FOLLOW_UP_STATUSES.map(st => (
                            <option key={st} value={st} className="bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 font-bold">
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Follow-up count */}
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
                          {editingRow === prospect.id ? (
                            <>
                              <button
                                onClick={() => {
                                    onUpdateLead({...prospect, createdAt: tempDate, source: tempSource as any});
                                    setEditingRow(null);
                                }}
                                className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-sm flex items-center justify-center"
                                title="Simpan"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingRow(null)}
                                className="p-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg transition-all flex items-center justify-center"
                                title="Batal"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
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
                                onClick={() => startEditing(prospect)}
                                className="p-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-[11px] font-bold flex items-center justify-center transition-all border border-amber-200/30"
                                title="Edit Tanggal"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

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
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">

      {/* Import & Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Import Prospek Panel */}
        <div className="md:col-span-2 bg-white dark:bg-[#1c1c1f] rounded-2xl border border-slate-100 dark:border-zinc-800 p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-50 dark:bg-orange-950/20 rounded-xl shrink-0">
              <Upload className="w-5 h-5 text-[#F58220]" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-100">Impor Data Prospek</h3>
              <p className="text-[10px] sm:text-xs text-slate-400 dark:text-zinc-500 mt-0.5">Unggah CSV atau Excel (.xlsx/.xls) dengan kolom: Tanggal, No, No HP, Remark, Note</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
            <input
              type="file"
              id="prospek-file-import"
              accept=".csv,.xlsx,.xls"
              onChange={handleImportFile}
              className="hidden"
            />
            <button
              onClick={() => document.getElementById('prospek-file-import')?.click()}
              className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-[#F58220] to-[#E0721B] hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Pilih File CSV / Excel
            </button>
          </div>
        </div>

        {/* Total Leads Stats Card */}
        <div className="bg-white dark:bg-[#1c1c1f] rounded-2xl border border-slate-100 dark:border-zinc-800 p-5 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-50 dark:bg-orange-950/20 rounded-xl shrink-0">
              <Database className="w-5 h-5 text-[#F58220]" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-100">Total Data Leads</h3>
              <p className="text-[10px] sm:text-xs text-slate-400 dark:text-zinc-500 mt-0.5">Semua data terinput</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-2xl md:text-3xl font-black text-[#F58220]">{leads.length}</span>
            <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 block uppercase tracking-wider">Leads</span>
          </div>
        </div>
      </div>
      
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

      {/* Bulk Action Panel */}
      {selectedLeadIds.length > 0 && (
        <div className="bg-orange-500/10 dark:bg-orange-500/5 border border-orange-500/20 text-slate-800 dark:text-zinc-200 rounded-2xl p-4 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#F58220]/20 text-[#F58220] rounded-xl shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-xs sm:text-sm text-slate-800 dark:text-zinc-100">
                Kelola {selectedLeadIds.length} Prospek Terpilih
              </p>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Ubah status atau sumber data untuk semua prospek yang dipilih sekaligus.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Bulk Status Select */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Status:</span>
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-slate-700 dark:text-zinc-300 focus:outline-none focus:border-[#F58220]"
              >
                <option value="">-- Lewati --</option>
                {FOLLOW_UP_STATUSES.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* Bulk Source Select */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Sumber:</span>
              <select
                value={bulkSource}
                onChange={(e) => setBulkSource(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-slate-700 dark:text-zinc-300 focus:outline-none focus:border-[#F58220]"
              >
                <option value="">-- Lewati --</option>
                <option value="-">-</option>
                {LEAD_SOURCES.map(src => (
                  <option key={src} value={src}>{src}</option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleApplyBulkEdit}
                className="px-4 py-2 bg-[#F58220] hover:bg-[#E0721B] text-white font-bold text-xs rounded-xl transition-all shadow-xs hover:shadow-md cursor-pointer whitespace-nowrap"
              >
                Simpan Perubahan
              </button>
              <button
                onClick={() => {
                  setSelectedLeadIds([]);
                  setBulkStatus('');
                  setBulkSource('');
                }}
                className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prospect Table View */}
      {filteredLeads.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#1c1c1f] rounded-2xl border border-slate-100 dark:border-zinc-800 flex flex-col items-center justify-center gap-3">
          <HelpCircle className="w-12 h-12 text-slate-300 dark:text-zinc-700" />
          <div>
            <p className="font-bold text-slate-700 dark:text-zinc-300">Tidak ada prospek ditemukan</p>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Coba ubah kata pencarian atau bersihkan filter di atas.</p>
          </div>
        </div>
      ) : (
        <>
          {renderProspectTable("Prospek Aktif", activeProspectsList, isAllActiveSelected, handleSelectAllActive, "bg-emerald-500", true)}
          {renderProspectTable("Kumpulan Prospek", poolProspectsList, isAllPoolSelected, handleSelectAllPool, "bg-slate-400", false)}
        </>
      )}
    </div>
  );
}
