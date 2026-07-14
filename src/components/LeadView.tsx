/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  UserPlus, Phone, MapPin, Tag, Info, AlertTriangle, 
  CheckCircle, FileText, Clock, Sparkles, ExternalLink, RefreshCcw 
} from 'lucide-react';
import { Lead, LeadSource, PipelineStage, FollowUpStatus, SalesConfig } from '../types';
import { 
  AREAS, 
  LEAD_SOURCES, 
  PACKAGES, 
  PIPELINE_STAGES,
  FOLLOW_UP_STATUSES,
  calculateNextReminderDate,
  getStatusColorClasses, 
  getPipelineColorClasses 
} from '../utils/helpers';

interface LeadViewProps {
  leads: Lead[];
  onAddLead: (newLead: Omit<Lead, 'id' | 'createdAt' | 'followUpCount' | 'history' | 'lastFollowUpDate' | 'userId'>) => void;
  onViewLead: (lead: Lead, historyOnly?: boolean) => void;
  config: SalesConfig;
  userName: string;
}

export default function LeadView({ leads, onAddLead, onViewLead, config, userName }: LeadViewProps) {
  const [whatsapp, setWhatsapp] = useState('');
  const [source, setSource] = useState<LeadSource>('Whatsapp');
  const [pipeline, setPipeline] = useState<PipelineStage>('Lead Baru');
  const [status, setStatus] = useState<FollowUpStatus>('Interested');
  const [successMsg, setSuccessMsg] = useState(false);

  // Duplicate state
  const [duplicateLead, setDuplicateLead] = useState<Lead | null>(null);

  // Filter latest 4 leads
  const recentLeads = [...leads]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, ''); // Number only
    setWhatsapp(val);

    if (val.length >= 8) {
      const found = leads.find(l => {
        const cleanA = l.whatsapp.replace(/\D/g, '');
        const cleanB = val.replace(/\D/g, '');
        return cleanA === cleanB || cleanA.endsWith(cleanB) || cleanB.endsWith(cleanA);
      });
      setDuplicateLead(found || null);
    } else {
      setDuplicateLead(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!whatsapp || whatsapp.length < 9) {
      alert('Nomor WhatsApp tidak valid (minimum 9 angka).');
      return;
    }

    if (duplicateLead) {
      alert('Nomor WhatsApp ini sudah terdaftar!');
      return;
    }

    const nextReminder = calculateNextReminderDate(
      status, 
      config.reminderThinkingDays, 
      config.reminderNBPDays, 
      undefined, 
      undefined, 
      config.reminderMode
    );

    onAddLead({
      whatsapp,
      name: '-',
      address: '-',
      area: '-',
      source,
      packageInterest: '-',
      notes: '',
      status,
      pipeline,
      nextReminderDate: nextReminder,
    });

    // Reset Form
    setWhatsapp('');
    setSource('Whatsapp');
    setPipeline('Lead Baru');
    setStatus('Interested');
    setDuplicateLead(null);

    // Show custom success message
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
    }, 4000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form Section */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
          <div className="p-1.5 bg-orange-100 rounded-lg text-[#F58220]">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Form Input Lead Baru</h2>
            <p className="text-xs text-slate-400">Pastikan nomor WhatsApp aktif untuk kemudahan follow-up.</p>
          </div>
        </div>

        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <div>
              <span className="font-bold">Lead berhasil disimpan!</span> Data customer telah masuk ke pipeline <span className="font-semibold">Lead Baru</span> dan dijadwalkan follow up besok.
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* WhatsApp Field */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase flex items-center justify-between">
              <span>Nomor WhatsApp (Wajib)</span>
              <span className="text-[10px] text-slate-400 font-normal">Input angka saja</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                required
                value={whatsapp}
                onChange={handleWhatsappChange}
                placeholder="Contoh: 081234567890"
                className={`block w-full pl-10 pr-10 py-2.5 rounded-xl border bg-white text-sm text-slate-800 focus:outline-none focus:ring-1 transition-all ${
                  duplicateLead 
                    ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200' 
                    : whatsapp.length >= 9
                    ? 'border-emerald-300 focus:border-emerald-400 focus:ring-emerald-200'
                    : 'border-slate-200 focus:border-[#F58220] focus:ring-orange-200'
                }`}
              />
              {duplicateLead && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <AlertTriangle className="h-5 w-5 text-rose-500" />
                </div>
              )}
              {!duplicateLead && whatsapp.length >= 9 && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                </div>
              )}
            </div>

            {/* Duplicate Notice Box */}
            {duplicateLead && (
              <div className="mt-2 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex gap-2 text-rose-800 text-xs">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <div>
                    <span className="font-bold">Nomor Duplikat!</span> Sudah terdaftar atas nama <span className="font-bold">{duplicateLead.name}</span> ({duplicateLead.area}) dengan status <span className="font-bold">{duplicateLead.status}</span>.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onViewLead(duplicateLead)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 hover:text-rose-900 bg-white border border-rose-200 px-2.5 py-1 rounded-lg shadow-xs hover:shadow transition-all shrink-0"
                >
                  Lihat Detail <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Sumber Lead Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
              Sumber Lead
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as LeadSource)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:border-[#F58220] transition-colors"
            >
              {LEAD_SOURCES.map((sc) => (
                <option key={sc} value={sc}>
                  {sc}
                </option>
              ))}
            </select>
          </div>

          {/* Pipeline & Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="hidden">
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
                Alur Prospek (Pipeline)
              </label>
              <select
                value={pipeline}
                onChange={(e) => setPipeline(e.target.value as PipelineStage)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:border-[#F58220] transition-colors"
              >
                {PIPELINE_STAGES.map((pl) => (
                  <option key={pl} value={pl}>
                    {pl}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
                Status Follow Up
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as FollowUpStatus)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:border-[#F58220] transition-colors"
              >
                {FOLLOW_UP_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!!duplicateLead || !whatsapp || whatsapp.length < 9}
              className="w-full py-2.5 bg-[#F58220] hover:bg-[#E0721B] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Simpan Data Customer & Jadwalkan Follow Up
            </button>
          </div>
        </form>
      </div>

      {/* Sidebar - Recent Added Leads */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4 h-fit">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Clock className="w-5 h-5 text-[#F58220]" />
          <div>
            <h3 className="text-sm font-bold text-slate-800">Baru Saja Ditambahkan</h3>
            <p className="text-[10px] text-slate-400">4 pendaftaran terakhir hari ini.</p>
          </div>
        </div>

        {recentLeads.length > 0 ? (
          <div className="space-y-3">
            {recentLeads.map((rl) => (
              <div 
                key={rl.id}
                onClick={() => onViewLead(rl)}
                className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex justify-between items-start gap-1">
                  <h4 className="text-xs font-bold text-slate-700 group-hover:text-[#F58220] transition-colors truncate max-w-[120px]">
                    {rl.name}
                  </h4>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-900 font-bold truncate scale-95 origin-right border border-slate-200/50">
                    {rl.area}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 font-mono">
                  <span>{rl.whatsapp}</span>
                  <span className={`px-1.5 py-0.5 rounded font-semibold text-[8px] uppercase border ${getStatusColorClasses(rl.status).bg}`}>
                    {rl.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-400 italic">
            Belum ada lead baru hari ini.
          </div>
        )}

        {/* Quick Tips */}
        <div className="p-3.5 bg-orange-50 border border-orange-100 rounded-xl flex items-start gap-2.5 text-[11px] text-slate-600">
          <Sparkles className="w-4 h-4 text-[#F58220] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-800 block mb-0.5">Kecepatan adalah Kunci!</span>
            Berdasarkan survei, respon sales di bawah 5 menit meningkatkan peluang closing hingga 80%. Jangan biarkan prospek menunggu.
          </div>
        </div>
      </div>
    </div>
  );
}
