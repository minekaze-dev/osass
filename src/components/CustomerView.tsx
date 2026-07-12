/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Search, Filter, MessageSquare, Phone, Calendar, 
  CheckCircle2, XCircle, AlertCircle, Trash2, Clock, 
  Tag, Award, CheckCircle, RefreshCw, Eye, Edit2, Check, X 
} from 'lucide-react';
import { Lead, CustomerStatus, SalesConfig } from '../types';
import { 
  formatWhatsAppNumber, 
  getStatusColorClasses, 
  getPipelineColorClasses,
  PACKAGES,
  PERIOD_OPTIONS,
  PACKAGE_PRICES
} from '../utils/helpers';

interface CustomerViewProps {
  leads: Lead[];
  onUpdateCustomerData: (
    leadId: string, 
    customerStatus: CustomerStatus | null, 
    closingDate: string | null, 
    subscriptionPeriod: string | null,
    packageInterest?: string,
    customerId?: string
  ) => void;
  onViewLead: (lead: Lead, historyOnly?: boolean) => void;
  onQuickClosing?: (leadId: string, action: 'Not Closed' | 'On Process' | 'Closed') => void;
  config: SalesConfig;
  userName: string;
}

const CUSTOMER_STATUSES: { value: CustomerStatus; label: string; color: string; bg: string }[] = [
  { value: 'Aktif', label: 'Aktif', color: 'text-emerald-700 border-emerald-200 bg-emerald-50', bg: 'bg-emerald-500' },
  { value: 'General Payment', label: 'General Payment', color: 'text-blue-700 border-blue-200 bg-blue-50', bg: 'bg-blue-500' },
  { value: 'Paid', label: 'Paid', color: 'text-cyan-700 border-cyan-200 bg-cyan-50', bg: 'bg-cyan-500' },
  { value: 'Refund', label: 'Refund', color: 'text-rose-700 border-rose-200 bg-rose-50', bg: 'bg-rose-500' },
  { value: 'Follow Up', label: 'Follow Up', color: 'text-amber-700 border-amber-200 bg-amber-50', bg: 'bg-amber-500' },
  { value: 'Dismantle', label: 'Dismantle (Putus)', color: 'text-slate-700 border-slate-200 bg-slate-50', bg: 'bg-slate-600' },
  { value: 'NBP', label: 'NBP (tidak respon)', color: 'text-red-700 border-red-200 bg-red-50/50', bg: 'bg-red-500' },
  { value: 'Thinking', label: 'Thinking (Pikir-pikir/Diskusi)', color: 'text-indigo-700 border-indigo-200 bg-indigo-50', bg: 'bg-indigo-500' },
  { value: 'Not Interested', label: 'Not Interested (Tidak minat)', color: 'text-slate-500 border-slate-200 bg-slate-100', bg: 'bg-slate-400' },
  { value: 'Area Full', label: 'Area Full', color: 'text-slate-500 border-slate-200 bg-slate-100', bg: 'bg-slate-400' }
];

export default function CustomerView({ 
  leads, 
  onUpdateCustomerData, 
  onViewLead,
  onQuickClosing,
  config,
  userName
}: CustomerViewProps) {
  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [closingFilter, setClosingFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [editingRow, setEditingRow] = useState<string | null>(null);

  // Edit fields temp state
  const [tempStatus, setTempStatus] = useState<CustomerStatus>('Aktif');
  const [tempClosingDate, setTempClosingDate] = useState('');
  const [tempPeriod, setTempPeriod] = useState('Tahunan');
  const [tempPackage, setTempPackage] = useState('');
  const [tempCustomerId, setTempCustomerId] = useState('');

  // Handle row edit start
  const startEditing = (lead: Lead) => {
    setEditingRow(lead.id);
    setTempStatus(lead.customerStatus || (lead.pipeline === 'Aktif' ? 'Aktif' : 'Follow Up'));
    
    // Default to today if not set
    const defaultDate = lead.closingDate || new Date('2026-07-10').toISOString().split('T')[0];
    setTempClosingDate(defaultDate);
    
    setTempPeriod(lead.subscriptionPeriod || 'Tahunan');
    setTempPackage(lead.packageInterest);
    setTempCustomerId(lead.customerId || '');
  };

  // Save changes
  const saveRowChanges = (leadId: string) => {
    const finalPeriod = tempStatus === 'Not Interested' ? '-' : tempPeriod;
    const finalPackage = tempStatus === 'Not Interested' ? '-' : tempPackage;
    onUpdateCustomerData(leadId, tempStatus, tempClosingDate, finalPeriod, finalPackage, tempCustomerId);
    setEditingRow(null);
  };

  // Filter leads/customers
  const filteredLeads = useMemo(() => {
    const filtered = leads.filter(l => {
      // Search
      const matchesSearch = 
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.whatsapp.includes(searchTerm) ||
        l.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.area.toLowerCase().includes(searchTerm.toLowerCase());

      // Customer Status Filter
      const resolvedCustStatus = l.customerStatus || (l.pipeline === 'Aktif' ? 'Aktif' : null);
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'none' && !resolvedCustStatus) ||
        (resolvedCustStatus === statusFilter);

      // Closing Filter (is closed / closing vs prospecting)
      const isClosed = l.pipeline === 'Aktif' || !!l.closingDate;
      const matchesClosing = closingFilter === 'all' ||
        (closingFilter === 'closed' && isClosed) ||
        (closingFilter === 'open' && !isClosed);

      // Date Filter
      const matchesDate = !dateFilter || l.createdAt === dateFilter;

      return matchesSearch && matchesStatus && matchesClosing && matchesDate;
    });

    // Sort by latest createdAt date descending
    return filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  }, [leads, searchTerm, statusFilter, closingFilter, dateFilter]);

  // Quick stats
  const stats = useMemo(() => {
    let totalCustomers = 0;
    let active = 0;
    let refund = 0;
    let dismantle = 0;
    let closedCount = 0;

    leads.forEach(l => {
      const isClosed = l.pipeline === 'Aktif' || !!l.closingDate;
      if (isClosed) closedCount++;

      const resolvedCustStatus = l.customerStatus || (l.pipeline === 'Aktif' ? 'Aktif' : null);
      if (resolvedCustStatus) {
        totalCustomers++;
        if (resolvedCustStatus === 'Aktif') active++;
        if (resolvedCustStatus === 'Refund') refund++;
        if (resolvedCustStatus === 'Dismantle') dismantle++;
      }
    });

    return { totalCustomers, active, refund, dismantle, closedCount };
  }, [leads]);

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Award className="w-6 h-6 text-[#F58220]" />
            Daftar Customer & Closing
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kelola data pelanggan yang sudah closing, ubah status langganan, tanggal pemasangan aktif, kontrak, dan pembatalan.
          </p>
        </div>
      </div>

      {/* KPI Stats Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Database Customer */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Database</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-slate-800">{stats.totalCustomers}</span>
            <span className="text-[10px] text-slate-400 font-semibold">Pelanggan</span>
          </div>
          <div className="text-[9px] text-slate-500 font-medium mt-2 flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
            <span>Aktif + Refund + Dismantle</span>
          </div>
        </div>

        {/* Aktif */}
        <div className="bg-emerald-50/40 border border-emerald-100 p-4 rounded-2xl shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">Pelanggan Aktif</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-emerald-700">{stats.active}</span>
            <span className="text-[10px] text-emerald-500 font-semibold">Aktif</span>
          </div>
          <div className="text-[9px] text-emerald-600 font-medium mt-2 flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            <span>Koneksi menyala</span>
          </div>
        </div>

        {/* Refund */}
        <div className="bg-rose-50/40 border border-rose-100 p-4 rounded-2xl shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider block">Refund / Cancel</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-rose-700">{stats.refund}</span>
            <span className="text-[10px] text-rose-500 font-semibold">Unit</span>
          </div>
          <div className="text-[9px] text-rose-600 font-medium mt-2 flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
            <span>Uang dikembalikan</span>
          </div>
        </div>

        {/* Dismantle */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Dismantle (Putus)</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-slate-700">{stats.dismantle}</span>
            <span className="text-[10px] text-slate-500 font-semibold">Off</span>
          </div>
          <div className="text-[9px] text-slate-500 font-medium mt-2 flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-slate-600 rounded-full" />
            <span>Pemberhentian langganan</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari nama customer, nomor WA, alamat atau area..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#F58220] transition-all"
            />
          </div>

          {/* Customer Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-500 whitespace-nowrap">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-[#F58220]"
            >
              <option value="all">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="General Payment">General Payment</option>
              <option value="Paid">Paid</option>
              <option value="Refund">Refund</option>
              <option value="Follow Up">Follow Up</option>
              <option value="Dismantle">Dismantle</option>
              <option value="Thinking">Thinking</option>
              <option value="NBP">NBP</option>
              <option value="Not Interested">Not Interested</option>
              <option value="Area Full">Area Full</option>
              <option value="none">Belum Ditentukan</option>
            </select>
          </div>

          {/* Closing Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 whitespace-nowrap">Closing:</span>
            <select
              value={closingFilter}
              onChange={(e) => setClosingFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-[#F58220]"
            >
              <option value="all">Semua Lead</option>
              <option value="closed">Sudah Closing (Deal/Aktif)</option>
              <option value="open">Belum Closing (Prospek)</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 whitespace-nowrap">Tanggal:</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-[#F58220] h-[31px]"
            />
          </div>
        </div>

        {/* Reset Feedback for Filters */}
        {(searchTerm || statusFilter !== 'all' || closingFilter !== 'all' || dateFilter) && (
          <div className="flex justify-between items-center text-xs text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100/60 mt-2">
            <span>
              Menampilkan <span className="font-bold text-slate-700">{filteredLeads.length}</span> dari {leads.length} customer
              {dateFilter && (
                <span> pada tanggal <span className="font-bold text-[#F58220]">{dateFilter}</span></span>
              )}
            </span>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setClosingFilter('all');
                setDateFilter('');
              }}
              className="text-xs font-semibold text-[#F58220] hover:text-[#E0721B]"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Customers Table List */}
      {filteredLeads.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px] md:min-w-full">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3 font-bold whitespace-nowrap text-center">No</th>
                  <th className="py-2.5 px-2 font-bold whitespace-nowrap">Customer</th>
                  <th className="py-2.5 px-2 font-bold whitespace-nowrap">Closing Status</th>
                  <th className="py-2.5 px-2 font-bold whitespace-nowrap">Tanggal</th>
                  <th className="py-2.5 px-2 font-bold whitespace-nowrap">Paket</th>
                  <th className="py-2.5 px-2 font-bold whitespace-nowrap">Periode</th>
                  <th className="py-2.5 px-2 font-bold whitespace-nowrap">Status</th>
                  <th className="py-2.5 px-2 text-right pr-4 font-bold whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredLeads.map((lead, idx) => {
                  const isEditing = editingRow === lead.id;
                  const isClosed = lead.pipeline === 'Aktif' || !!lead.closingDate;
                  const resolvedCustStatus = lead.customerStatus || (lead.pipeline === 'Aktif' ? 'Aktif' : 'Follow Up');
                  
                  const waNumber = formatWhatsAppNumber(lead.whatsapp);
                  const waTemplate = `Halo ${lead.name}, saya ${userName} dari WiFi Oxygen. Terkait paket internet ${lead.packageInterest} yang Bapak/Ibu gunakan saat ini, apakah layanannya berjalan dengan lancar?`;
                  const waUrl = `https://api.whatsapp.com/send?phone=${waNumber}&text=${encodeURIComponent(waTemplate)}`;

                  return (
                    <motion.tr
                      key={lead.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15, delay: Math.min(idx * 0.02, 0.2) }}
                      className={`hover:bg-slate-50/50 transition-all ${isEditing ? 'bg-orange-50/20' : ''}`}
                    >
                      {/* Numbering */}
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-[10px] font-mono text-slate-400 font-medium">{idx + 1}</span>
                      </td>

                      {/* Customer Name & WA */}
                      <td className="py-2.5 px-2">
                        <div className="font-bold text-slate-800 text-xs sm:text-[13px] whitespace-nowrap overflow-hidden text-overflow-ellipsis max-w-[120px] sm:max-w-[160px]" title={lead.name}>
                          {lead.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{lead.whatsapp}</div>
                        
                        {isEditing ? (
                          <div className="mt-1.5 flex flex-col gap-1">
                            <label className="text-[8px] font-bold text-slate-500 uppercase">Customer ID</label>
                            <input
                              type="text"
                              placeholder="Input ID..."
                              value={tempCustomerId}
                              onChange={(e) => setTempCustomerId(e.target.value)}
                              className="px-1.5 py-1 border border-slate-200 rounded-md text-[10px] bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-200"
                            />
                          </div>
                        ) : (
                          lead.customerId && (
                            <div className="text-[9px] text-emerald-600 font-bold mt-1 flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded inline-flex">
                              <CheckCircle className="w-2.5 h-2.5" />
                              <span>ID: {lead.customerId}</span>
                            </div>
                          )
                        )}
                      </td>

                      {/* Closing Status */}
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        <select
                          value={lead.closingStatus || (isClosed ? 'Closed' : 'Not Closed')}
                          onChange={(e) => onQuickClosing && onQuickClosing(lead.id, e.target.value as 'Not Closed' | 'On Process' | 'Closed')}
                          className={`px-1.5 py-1 border rounded-lg text-[10px] font-bold focus:outline-none focus:ring-1 focus:ring-orange-200 cursor-pointer ${
                            lead.closingStatus === 'Closed' || (!lead.closingStatus && isClosed)
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : lead.closingStatus === 'On Process'
                              ? 'bg-amber-50 text-amber-600 border-amber-200'
                              : 'bg-slate-50 text-slate-500 border-slate-200'
                          }`}
                        >
                          <option value="Not Closed" className="font-bold text-slate-600">Not Closed</option>
                          <option value="On Process" className="font-bold text-amber-600">On Process</option>
                          <option value="Closed" className="font-bold text-emerald-700">Closed</option>
                        </select>
                      </td>

                      {/* Closing Date */}
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="date"
                            value={tempClosingDate}
                            onChange={(e) => setTempClosingDate(e.target.value)}
                            className="px-1.5 py-0.5 border border-slate-200 rounded-md text-[11px] bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-200 font-mono"
                          />
                        ) : (
                          <div className="text-[11px] text-slate-600 font-mono whitespace-nowrap">
                            {lead.closingDate ? (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                                {lead.closingDate}
                              </span>
                            ) : lead.pipeline === 'Aktif' ? (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                                {lead.lastFollowUpDate || lead.createdAt}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Belum closing</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Package interest */}
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        {isEditing ? (
                          <select
                            value={tempPackage}
                            onChange={(e) => setTempPackage(e.target.value)}
                            className="px-1 py-0.5 border border-slate-200 rounded-md text-[11px] bg-white text-slate-800 focus:outline-none"
                          >
                            <option value="-">-</option>
                            {PACKAGES.map(pkg => (
                              <option key={pkg} value={pkg}>{pkg}</option>
                            ))}
                          </select>
                        ) : (
                          lead.packageInterest === '-' ? (
                            <span className="text-slate-400 font-medium">-</span>
                          ) : (
                            <div className="whitespace-nowrap">
                              <div className="font-bold text-slate-800 text-[11px]">
                                {(() => {
                                  const pkg = lead.packageInterest;
                                  const speedMatch = pkg.match(/(\d+)\s*Mbps/);
                                  return speedMatch ? pkg.substring(0, speedMatch.index).trim() : pkg;
                                })()}
                              </div>
                              <div className="text-[9px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                                {(() => {
                                  const pkg = lead.packageInterest;
                                  const speedMatch = pkg.match(/(\d+)\s*Mbps/);
                                  const speed = speedMatch ? speedMatch[0] : '';
                                  const priceStr = speedMatch ? pkg.substring(speedMatch.index! + speedMatch[0].length).replace(/^ - /, '').trim() : '';
                                  const price = priceStr || (PACKAGE_PRICES[pkg] ? `Rp ${PACKAGE_PRICES[pkg].toLocaleString('id-ID')}` : '');
                                  return (
                                    <>
                                      {speed && <span className="text-[#F58220] font-bold">{speed}</span>}
                                      {speed && price && <span className="text-slate-300">|</span>}
                                      {price && <span>{price}</span>}
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          )
                        )}
                      </td>

                      {/* Subscription Period */}
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        {isEditing ? (
                          <select
                            value={tempPeriod}
                            onChange={(e) => setTempPeriod(e.target.value)}
                            className="px-1 py-0.5 border border-slate-200 rounded-md text-[11px] bg-white text-slate-800 focus:outline-none"
                          >
                            <option value="-">-</option>
                            {PERIOD_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <div className={`text-[11px] font-mono whitespace-nowrap ${lead.subscriptionPeriod === '-' ? 'text-slate-400 font-medium' : 'text-slate-600'}`}>
                            {lead.subscriptionPeriod || 'Tahunan'}
                          </div>
                        )}
                      </td>

                      {/* Customer Status */}
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        {isEditing ? (
                          <select
                            value={tempStatus}
                            onChange={(e) => setTempStatus(e.target.value as CustomerStatus)}
                            className="px-1 py-0.5 border border-slate-200 rounded-md text-[11px] bg-white text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-orange-200"
                          >
                            {CUSTOMER_STATUSES.map(item => (
                              <option key={item.value} value={item.value}>{item.label}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold border whitespace-nowrap ${
                            CUSTOMER_STATUSES.find(item => item.value === resolvedCustStatus)?.color || 'text-slate-700 bg-slate-50 border-slate-200'
                          }`}>
                            <span className={`w-1 h-1 rounded-full ${
                              CUSTOMER_STATUSES.find(item => item.value === resolvedCustStatus)?.bg || 'bg-slate-400'
                            }`} />
                            {resolvedCustStatus}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-2 text-right pr-4 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => saveRowChanges(lead.id)}
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
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg transition-all"
                                title="Kirim WhatsApp Chat"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </a>

                              <button
                                onClick={() => startEditing(lead)}
                                className="p-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-[11px] font-bold flex items-center justify-center transition-all border border-amber-200/30"
                                title="Edit Status"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => onViewLead(lead)}
                                className="p-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-all"
                                title="Lihat Detail"
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
          
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500 font-medium">
            <span>Menampilkan {filteredLeads.length} dari total {leads.length} lead & customer</span>
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-[#F58220]" />
              Oxygen WiFi Sales Assistant
            </span>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center gap-3">
          <AlertCircle className="w-10 h-10 text-slate-300" />
          <h3 className="text-base font-bold text-slate-700">Tidak ada data customer ditemukan</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            Cobalah ubah kata kunci pencarian atau hilangkan filter status yang Anda pilih.
          </p>
        </div>
      )}

    </div>
  );
}
