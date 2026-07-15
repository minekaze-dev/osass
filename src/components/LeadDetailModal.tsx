/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Phone, MessageSquare, MapPin, Calendar, Clock, 
  History, User, ArrowRight, Tag, RefreshCw, FileText, Edit 
} from 'lucide-react';
import { Lead } from '../types';
import { 
  formatWhatsAppNumber, getStatusColorClasses, getPipelineColorClasses, formatIDR, PACKAGE_PRICES 
} from '../utils/helpers';

interface LeadDetailModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (lead: Lead) => void;
  onEditLead: (lead: Lead) => void;
  hideEdit?: boolean;
  isCustomerView?: boolean;
  historyOnly?: boolean;
}

export default function LeadDetailModal({ lead, isOpen, onClose, onUpdateStatus, onEditLead, hideEdit = false, isCustomerView = false, historyOnly = false }: LeadDetailModalProps) {
  if (!lead || !isOpen) return null;

  const waNumber = formatWhatsAppNumber(lead.whatsapp);
  const mapQuery = encodeURIComponent(`${lead.name} ${lead.address} ${lead.area}`);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
  
  const waUrl = `https://api.whatsapp.com/send?phone=${waNumber}`;

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
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden z-10 max-h-[90vh] flex flex-col border border-slate-100"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 sticky top-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg shadow-inner">
                {lead.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{lead.name}</h3>
                <span className="text-xs text-slate-500 font-mono">{historyOnly ? 'Riwayat Aktivitas (Log)' : `ID: ${lead.id}`}</span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {!historyOnly && (
              <>
                {/* Quick Badges & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-orange-50/40 p-4 rounded-xl border border-orange-100/60">
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColorClasses(lead.status).bg}`}>
                      {lead.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPipelineColorClasses(lead.pipeline)}`}>
                      {lead.pipeline}
                    </span>
                  </div>
                  
                  <div className="flex gap-1.5">
                    <a 
                      href={waUrl}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all flex items-center gap-1.5 text-xs font-medium shadow-sm hover:shadow"
                    >
                      <MessageSquare className="w-4 h-4" />
                      WA
                    </a>
                    <a 
                      href={`tel:${lead.whatsapp}`}
                      className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all flex items-center gap-1.5 text-xs font-medium shadow-sm hover:shadow"
                    >
                      <Phone className="w-4 h-4" />
                      Telp
                    </a>
                    <a 
                      href={mapsUrl}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all flex items-center gap-1.5 text-xs font-medium border border-slate-200"
                    >
                      <MapPin className="w-4 h-4" />
                      Peta
                    </a>
                  </div>
                </div>

                {/* General Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3.5">
                    <div className="flex items-start gap-2 text-slate-700">
                      <User className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                      <div>
                        <span className="text-xs text-slate-400 block">WhatsApp</span>
                        <span className="text-sm font-medium">{lead.whatsapp}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-slate-700">
                      <Tag className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                      <div>
                        <span className="text-xs text-slate-400 block">Sumber Lead</span>
                        <span className="text-sm font-medium">{lead.source}</span>
                      </div>
                    </div>

                    {!isCustomerView && (
                      <div className="flex items-start gap-2 text-slate-700">
                        <FileText className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                        <div>
                          <span className="text-xs text-slate-400 block">Paket yang Diminati</span>
                          <span className="text-sm font-semibold text-orange-600">
                            {lead.packageInterest} 
                            <span className="text-xs font-normal text-slate-500 block">
                              {formatIDR(PACKAGE_PRICES[lead.packageInterest] || 0)}/bulan
                            </span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3.5">
                    <div className="flex items-start gap-2 text-slate-700">
                      <MapPin className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                      <div>
                        <span className="text-xs text-slate-400 block">Alamat & Area</span>
                        <span className="text-sm font-medium block">{lead.address}</span>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-md">
                          Area: {lead.area}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-slate-700">
                      <Calendar className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                      <div>
                        <span className="text-xs text-slate-400 block">Tanggal Input</span>
                        <span className="text-sm font-medium">{lead.createdAt}</span>
                      </div>
                    </div>

                    {!isCustomerView && (
                      <div className="flex items-start gap-2 text-slate-700">
                        <Clock className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                        <div>
                          <span className="text-xs text-slate-400 block">Reminder Berikutnya</span>
                          <span className={`text-sm font-semibold ${lead.nextReminderDate ? 'text-amber-600' : 'text-slate-400'}`}>
                            {lead.nextReminderDate ? lead.nextReminderDate : 'Tidak ada'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes Section */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Catatan Terakhir</span>
                  <p className="text-sm text-slate-600 leading-relaxed italic">
                    "{lead.notes || 'Tidak ada catatan.'}"
                  </p>
                </div>
              </>
            )}

            {/* History Logs */}
            <div>
              <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                <History className="w-4 h-4 text-slate-400" />
                <h4 className="text-sm font-bold text-slate-700">Riwayat Follow Up ({lead.followUpCount}x)</h4>
              </div>

              {lead.history && lead.history.length > 0 ? (
                <div className="relative border-l border-slate-200 ml-3.5 pl-5 space-y-5 py-2">
                  {lead.history.map((h, idx) => (
                    <div key={h.id || idx} className="relative">
                      {/* Timeline Dot */}
                      <span className="absolute -left-[25px] top-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-white ring-2 ring-orange-400">
                        <span className="h-1 w-1 rounded-full bg-orange-500" />
                      </span>
                      
                      <div className="text-xs text-slate-400 font-mono mb-0.5 flex items-center justify-between">
                        <span>{h.date}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusColorClasses(h.status).bg}`}>
                          {h.status}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-300" />
                        <span className="text-xs font-semibold text-slate-600">
                          {h.pipeline}
                        </span>
                      </div>
                      
                      <p className="text-sm text-slate-600 font-medium bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
                        {h.notes}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Belum ada catatan riwayat follow up.
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap justify-between gap-3 sticky bottom-0">
            {!historyOnly && (
              <>
                {!hideEdit && (
                  <button
                    onClick={() => onEditLead(lead)}
                    className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Edit className="w-4 h-4 text-[#F58220]" />
                    Edit Data
                  </button>
                )}
                {!isCustomerView && (
                  <button
                    onClick={() => onUpdateStatus(lead)}
                    className="flex-1 py-2.5 px-4 bg-[#F58220] hover:bg-[#E0721B] text-white font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Update Status & Pipeline
                  </button>
                )}
              </>
            )}
            <button
              onClick={onClose}
              className={`px-4 py-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium rounded-xl transition-colors ${historyOnly ? 'w-full' : ''}`}
            >
              Tutup
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
