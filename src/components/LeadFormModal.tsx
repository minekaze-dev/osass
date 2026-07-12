/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus, Phone, MapPin, Tag, Info, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { Lead, LeadSource, PipelineStage, FollowUpStatus, SalesConfig } from '../types';
import { AREAS, LEAD_SOURCES, PACKAGES, PIPELINE_STAGES, FOLLOW_UP_STATUSES, calculateNextReminderDate } from '../utils/helpers';

interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLead: (newLead: Omit<Lead, 'id' | 'createdAt' | 'followUpCount' | 'history' | 'lastFollowUpDate' | 'userId'>) => void;
  allLeads: Lead[];
  onViewExistingLead?: (lead: Lead) => void;
  initialWhatsApp?: string; // Prepopulate if coming from a certain context
  leadToEdit?: Lead | null;
  onEditLead?: (leadId: string, updatedData: Partial<Lead>) => void;
  config: SalesConfig;
}

export default function LeadFormModal({
  isOpen,
  onClose,
  onAddLead,
  allLeads,
  onViewExistingLead,
  initialWhatsApp = '',
  leadToEdit = null,
  onEditLead,
  config
}: LeadFormModalProps) {
  const [whatsapp, setWhatsapp] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState(AREAS[0]);
  const [source, setSource] = useState<LeadSource>('Whatsapp');
  const [packageInterest, setPackageInterest] = useState(PACKAGES[0]);
  const [notes, setNotes] = useState('');
  const [pipeline, setPipeline] = useState<PipelineStage>('Lead Baru');
  const [status, setStatus] = useState<FollowUpStatus>('Interested');

  // Duplicate Check
  const [duplicateLead, setDuplicateLead] = useState<Lead | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (leadToEdit) {
        setWhatsapp(leadToEdit.whatsapp);
        setName(leadToEdit.name);
        setAddress(leadToEdit.address);
        setArea(leadToEdit.area);
        setSource(leadToEdit.source);
        setPackageInterest(leadToEdit.packageInterest);
        setNotes(leadToEdit.notes);
        setPipeline(leadToEdit.pipeline);
        setStatus(leadToEdit.status);
      } else {
        setWhatsapp(initialWhatsApp);
        setName('');
        setAddress('');
        setArea(AREAS[0]);
        setSource('MGM');
        setPackageInterest('-');
        setNotes('');
        setPipeline('Lead Baru');
        setStatus('Interested');
      }
      setDuplicateLead(null);
    }
  }, [isOpen, initialWhatsApp, leadToEdit]);

  // Handle WhatsApp change and check duplicates
  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, ''); // Limit to numbers only
    setWhatsapp(val);

    if (val.length >= 8) {
      // Find matches in registered leads (normalize comparison)
      const found = allLeads.find(l => {
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

    if (duplicateLead && (!leadToEdit || duplicateLead.id !== leadToEdit.id)) {
      alert('Nomor WhatsApp ini sudah terdaftar sebagai lead/prospek lain!');
      return;
    }

    if (leadToEdit && onEditLead) {
      onEditLead(leadToEdit.id, {
        whatsapp,
        name: (name.trim() || '-').toUpperCase(),
        address: address.trim() || '-',
        area,
        source,
        packageInterest,
        notes: notes.trim(),
        pipeline,
        status,
      });
    } else {
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
        subscriptionPeriod: '-',
        notes: '',
        status,
        pipeline,
        nextReminderDate: nextReminder,
        closingStatus: 'Not Closed',
      });
    }
    
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden z-10 max-h-[90vh] flex flex-col border border-slate-100"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 sticky top-0">
              <div className="flex items-center gap-2.5 text-[#F58220]">
                <div className="p-1.5 bg-orange-100 rounded-lg">
                  <UserPlus className="w-5 h-5 text-[#F58220]" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  {leadToEdit ? 'Edit Detail Lead' : 'Tambah Lead Baru'}
                </h3>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto">
              <div className="p-6 space-y-4 flex-1">
                
                {/* WhatsApp Input with Duplicate Indicator */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase flex items-center justify-between">
                    <span>Nomor WhatsApp (Wajib)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Hanya Angka</span>
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
                        duplicateLead && (!leadToEdit || duplicateLead.id !== leadToEdit.id)
                          ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200' 
                          : whatsapp.length >= 9
                          ? 'border-emerald-300 focus:border-emerald-400 focus:ring-emerald-200'
                          : 'border-slate-200 focus:border-[#F58220] focus:ring-orange-200'
                      }`}
                    />
                    {duplicateLead && (!leadToEdit || duplicateLead.id !== leadToEdit.id) && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <AlertTriangle className="h-5 w-5 text-rose-500" />
                      </div>
                    )}
                    {(!duplicateLead || (leadToEdit && duplicateLead.id === leadToEdit.id)) && whatsapp.length >= 9 && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                      </div>
                    )}
                  </div>

                  {/* Duplicate Lead Alert Box */}
                  {duplicateLead && (!leadToEdit || duplicateLead.id !== leadToEdit.id) && (
                    <div className="mt-2.5 p-3 bg-rose-50 border border-rose-200 rounded-xl flex flex-col gap-2">
                      <div className="flex gap-2 text-rose-800 text-xs">
                        <Info className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Data Duplikat!</span> Nomor ini sudah terdaftar atas nama <span className="font-bold">{duplicateLead.name}</span> ({duplicateLead.area}) dengan status <span className="font-bold">{duplicateLead.status}</span>.
                        </div>
                      </div>
                      {onViewExistingLead && (
                        <button
                          type="button"
                          onClick={() => {
                            onViewExistingLead(duplicateLead);
                            onClose();
                          }}
                          className="self-end inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 hover:text-rose-900 bg-white border border-rose-200 px-2.5 py-1 rounded-lg shadow-sm hover:shadow-md transition-all mt-1"
                        >
                          Lihat Prospek Ini <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Customer Name */}
                {leadToEdit ? (
                  <>
                    {/* Customer Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
                        Nama Customer (Opsional)
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nama lengkap atau panggilan customer (kosongkan jika belum ada)"
                        className="block w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:border-[#F58220] transition-colors"
                      />
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
                        Alamat Lengkap (Opsional)
                      </label>
                      <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Contoh: Jl. Mawar No. 12, RT 01/RW 03, dekat Masjid Al-Ikhlas"
                        rows={2}
                        className="block w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:border-[#F58220] transition-colors resize-none"
                      />
                    </div>

                    {/* Area & Source Selection in Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
                          Area Wilayah
                        </label>
                        <select
                          value={area}
                          onChange={(e) => setArea(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:border-[#F58220] transition-colors"
                        >
                          {AREAS.map((ar) => (
                            <option key={ar} value={ar}>
                              {ar}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
                          Sumber Lead
                        </label>
                        <select
                          value={source}
                          onChange={(e) => setSource(e.target.value as LeadSource)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:border-[#F58220] transition-colors"
                        >
                          {LEAD_SOURCES.map((sc) => (
                            <option key={sc} value={sc}>
                              {sc}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Package of Interest */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
                        Paket yang Diminati
                      </label>
                      <select
                        value={packageInterest}
                        onChange={(e) => setPackageInterest(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:border-[#F58220] transition-colors"
                      >
                        {PACKAGES.map((pkg) => (
                          <option key={pkg} value={pkg}>
                            {pkg}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Initial Notes */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
                        Catatan Kebutuhan / Keterangan tambahan
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Contoh: Butuh pasang cepat, rencana dipakai untuk WFH 3 laptop."
                        rows={2}
                        className="block w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:border-[#F58220] transition-colors resize-none placeholder:text-slate-400"
                      />
                    </div>

                    {/* Pipeline & Status selection in Edit mode */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
                          Alur Prospek
                        </label>
                        <select
                          value={pipeline}
                          onChange={(e) => setPipeline(e.target.value as PipelineStage)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:border-[#F58220] transition-colors"
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
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:border-[#F58220] transition-colors"
                        >
                          {FOLLOW_UP_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Source only */}
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

                    {/* Pipeline and Status Selectors */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
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
                  </>
                )}

              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!!(duplicateLead && (!leadToEdit || duplicateLead.id !== leadToEdit.id)) || !whatsapp || whatsapp.length < 9}
                  className="px-5 py-2 bg-[#F58220] hover:bg-[#E0721B] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-sm hover:shadow"
                >
                  {leadToEdit ? 'Simpan Perubahan' : 'Tambah Lead'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
