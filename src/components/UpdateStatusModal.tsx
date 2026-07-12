/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RefreshCw, Calendar, FileText, ArrowRight, BellOff } from 'lucide-react';
import { Lead, FollowUpStatus, PipelineStage } from '../types';
import { 
  PIPELINE_STAGES, 
  FOLLOW_UP_STATUSES, 
  calculateNextReminderDate,
  getStatusColorClasses,
  getPipelineColorClasses
} from '../utils/helpers';

interface UpdateStatusModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (leadId: string, status: FollowUpStatus, pipeline: PipelineStage, notes: string, nextReminder: string | null) => void;
  thinkingDays: number;
  nbpDays: number;
  reminderMode?: 'auto' | 'manual';
  reminderPattern?: string;
}

export default function UpdateStatusModal({ 
  lead, 
  isOpen, 
  onClose, 
  onSave,
  thinkingDays,
  nbpDays,
  reminderMode = 'auto',
  reminderPattern = '1,2,4,7'
}: UpdateStatusModalProps) {
  const [status, setStatus] = useState<FollowUpStatus>('Interested');
  const [pipeline, setPipeline] = useState<PipelineStage>('Lead Baru');
  const [notes, setNotes] = useState('');
  const [reminderOption, setReminderOption] = useState<'auto' | 'custom' | 'none'>('auto');
  const [customReminderDate, setCustomReminderDate] = useState('');

  // Synchronize state when lead changes or opens
  useEffect(() => {
    if (lead) {
      setStatus(lead.status);
      setPipeline(lead.pipeline);
      setNotes('');
      
      // Determine default reminder option
      if (lead.status === 'Not Interested' || lead.status === 'Not Coverage' || lead.status === 'Invalid Number') {
        setReminderOption('none');
      } else {
        setReminderOption('auto');
      }
      
      // Setup custom date picker default to tomorrow
      const tomorrow = new Date('2026-07-10');
      tomorrow.setDate(tomorrow.getDate() + 1);
      setCustomReminderDate(tomorrow.toISOString().split('T')[0]);
    }
  }, [lead, isOpen]);

  if (!lead || !isOpen) return null;

  // Let's count how many times they've been saved with status 'NBP'
  const nbpCount = lead.history.filter(h => h.status === 'NBP').length;

  const getPipelineForStatus = (status: FollowUpStatus): PipelineStage => {
    if (status === 'Installed' || status === 'Closing' || status === 'Paid') return 'Aktif';
    if (status === 'General Payment') return 'Menunggu Berkas';
    if (status === 'Not Interested' || status === 'Not Coverage' || status === 'Invalid Number') return 'Tidak Tercover';
    return 'Follow Up';
  };

  // Compute the automated date
  const autoDate = calculateNextReminderDate(
    status, 
    thinkingDays, 
    nbpDays, 
    undefined, 
    nbpCount, 
    reminderMode,
    reminderPattern,
    lead.createdAt
  );

  const getResolvedReminderDate = (): string | null => {
    if (reminderOption === 'none') return null;
    if (pipeline === 'Aktif') return null; // Active / closed does not need follow-ups
    if (status === 'Not Interested' || status === 'Not Coverage' || status === 'Invalid Number') return null;
    
    if (reminderOption === 'custom') {
      return customReminderDate || null;
    }
    return autoDate;
  };

  const finalReminderDate = getResolvedReminderDate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      alert('Mohon masukkan catatan follow up untuk riwayat aktivitas.');
      return;
    }
    onSave(lead.id, status, pipeline, notes.trim(), finalReminderDate);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#1c1c1f] rounded-2xl shadow-xl overflow-hidden z-10 max-h-[90vh] flex flex-col border border-slate-100 dark:border-zinc-800"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/60">
            <div className="flex items-center gap-2 text-[#F58220]">
              <RefreshCw className="w-5 h-5 animate-spin-slow" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100">Update Status & Pipeline</h3>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto">
            <div className="p-6 space-y-5 flex-1 bg-white dark:bg-[#1c1c1f]">
              {/* Customer Info Mini-Card */}
              <div className="bg-slate-50 dark:bg-zinc-900/60 p-3 rounded-xl border border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 dark:text-zinc-500">Update customer:</span>
                  <p className="font-bold text-slate-700 dark:text-zinc-100">{lead.name}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-slate-400 dark:text-zinc-500 font-mono">{lead.whatsapp}</span>
                  <div className="flex gap-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold">{lead.status}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold">{lead.pipeline}</span>
                  </div>
                </div>
              </div>

              {/* Status & Pipeline Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1.5 uppercase">
                    Pilih Status Cepat
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => {
                        setStatus('General Payment');
                        setPipeline('Menunggu Berkas');
                        setReminderOption('auto');
                      }}
                      className={`px-2 py-2 rounded-xl text-[10px] font-bold border transition-all ${status === 'General Payment' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white dark:bg-zinc-800 border-slate-100 dark:border-zinc-700 text-slate-500'}`}
                    >
                      General Payment
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStatus('Paid');
                        setPipeline('Aktif');
                        setReminderOption('none');
                      }}
                      className={`px-2 py-2 rounded-xl text-[10px] font-bold border transition-all ${status === 'Paid' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white dark:bg-zinc-800 border-slate-100 dark:border-zinc-700 text-slate-500'}`}
                    >
                      Paid
                    </button>
                  </div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1.5 uppercase">
                    Status Follow Up
                  </label>
                  <select
                    value={status}
                    onChange={(e) => {
                      const val = e.target.value as FollowUpStatus;
                      setStatus(val);
                      setPipeline(getPipelineForStatus(val));
                      // Auto adjustment for reminder option
                      if (val === 'Not Interested' || val === 'Not Coverage' || val === 'Invalid Number' || val === 'Paid' || val === 'Installed') {
                        setReminderOption('none');
                      } else {
                        setReminderOption('auto');
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-[#F58220] transition-colors"
                  >
                    {FOLLOW_UP_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1.5 uppercase">
                    Tahapan Pipeline
                  </label>
                  <select
                    value={pipeline}
                    onChange={(e) => {
                      const val = e.target.value as PipelineStage;
                      setPipeline(val);
                      // Auto update status if pipeline is "Aktif"
                      if (val === 'Aktif') {
                        setStatus('Interested');
                        setReminderOption('none');
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-[#F58220] transition-colors"
                  >
                    {PIPELINE_STAGES.map((pl) => (
                      <option key={pl} value={pl}>
                        {pl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Follow Up Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1.5 uppercase flex items-center justify-between">
                  <span>Catatan Aktivitas (Wajib)</span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal">Min. 5 karakter</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Pak Ahmad masih nego dengan istri. Minta dihubungi lagi lusa jam 10 pagi."
                  rows={3}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-[#F58220] transition-colors resize-none placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                />
              </div>

              {/* Next Reminder Selector */}
              {pipeline !== 'Aktif' && !['Not Interested', 'Not Coverage', 'Invalid Number'].includes(status) ? (
                <div className="bg-amber-50/50 dark:bg-zinc-900/80 border border-amber-200 dark:border-zinc-700 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-1.5 text-amber-800 dark:text-[#F58220]">
                    <Calendar className="w-4 h-4 text-[#F58220]" />
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-zinc-100">Atur Reminder Berikutnya</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setReminderOption('auto')}
                      className={`py-1.5 px-2.5 rounded-lg text-xs font-bold border text-center transition-all ${
                        reminderOption === 'auto'
                          ? 'bg-[#F58220] text-white border-[#F58220] shadow-sm'
                          : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700'
                      }`}
                    >
                      Otomatis
                    </button>
                    <button
                      type="button"
                      onClick={() => setReminderOption('custom')}
                      className={`py-1.5 px-2.5 rounded-lg text-xs font-bold border text-center transition-all ${
                        reminderOption === 'custom'
                          ? 'bg-[#F58220] text-white border-[#F58220] shadow-sm'
                          : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700'
                      }`}
                    >
                      Pilih Tanggal
                    </button>
                    <button
                      type="button"
                      onClick={() => setReminderOption('none')}
                      className={`py-1.5 px-2.5 rounded-lg text-xs font-bold border text-center transition-all ${
                        reminderOption === 'none'
                          ? 'bg-[#F58220] text-white border-[#F58220] shadow-sm'
                          : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700'
                      }`}
                    >
                      Tanpa Tag
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setStatus('Not Interested');
                      setReminderOption('none');
                      if (!notes.trim()) {
                        setNotes('Customer tidak tertarik. Stop follow up.');
                      }
                    }}
                    className="w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-900/30 dark:text-red-400 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 border border-red-100 dark:border-red-900/30 cursor-pointer"
                    title="Stop Reminder: Customer Tidak Tertarik"
                  >
                    <BellOff className="w-3.5 h-3.5 shrink-0 text-red-500 dark:text-red-400" />
                    Stop Reminder (Tidak Tertarik)
                  </button>

                  {reminderOption === 'auto' && (
                    <div className="space-y-1.5">
                      <div className="text-xs text-slate-700 dark:text-zinc-200 flex justify-between items-center bg-white dark:bg-zinc-800 p-2.5 rounded-lg border border-amber-200 dark:border-zinc-700">
                        <span className="font-medium">Rekomendasi sistem ({status}):</span>
                        <span className="font-black text-amber-800 dark:text-[#F58220] font-mono bg-amber-100 dark:bg-[#F58220]/10 px-2 py-0.5 rounded border border-amber-200 dark:border-[#F58220]/20">
                          {autoDate ? autoDate : 'Tanpa Reminder'}
                        </span>
                      </div>
                      {status === 'NBP' && (
                        <p className="text-[11px] text-orange-600 dark:text-orange-400 font-bold px-1 flex items-center gap-1">
                          🔔 Pola {status}: FU ke-{nbpCount + 1} ({
                            (() => {
                              const pattern = reminderPattern.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                              if (nbpCount < pattern.length) {
                                return `Hari ke-${pattern[nbpCount]}`;
                              }
                              return `Lanjutan ke-${nbpCount + 1}`;
                            })()
                          })
                        </p>
                      )}
                    </div>
                  )}

                  {reminderOption === 'custom' && (
                    <input
                      type="date"
                      value={customReminderDate}
                      onChange={(e) => setCustomReminderDate(e.target.value)}
                      min="2026-07-10"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors font-mono"
                    />
                  )}

                  {reminderOption === 'none' && (
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                      Pelanggan ini tidak akan dijadwalkan ulang untuk follow-up lanjutan otomatis.
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-slate-100 dark:bg-zinc-900/60 p-3 rounded-xl text-xs text-slate-500 dark:text-zinc-400 text-center border border-slate-200 dark:border-zinc-800">
                  Status akhir (Aktif / Not Interested / Provider Lain) otomatis menghapus jadwal follow-up berikutnya.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-zinc-900/60 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-3 sticky bottom-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 text-sm font-bold rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!notes.trim()}
                className="px-5 py-2 bg-[#F58220] hover:bg-[#E0721B] disabled:opacity-50 text-white text-sm font-black rounded-xl transition-all shadow-sm hover:shadow"
              >
                Simpan & Update
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
