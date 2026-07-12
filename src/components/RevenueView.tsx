/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, Landmark, Users, Award, 
  Target, Trophy, Calendar, Sparkles, CheckCircle, ShieldCheck
} from 'lucide-react';
import { Lead } from '../types';
import { 
  PACKAGE_PRICES, 
  formatIDR, 
  calculateContractFinancials, 
  FinancialResult 
} from '../utils/helpers';

interface RevenueViewProps {
  leads: Lead[];
  config: { salesName: string; monthlyTarget: number };
}

export default function RevenueView({ leads, config }: RevenueViewProps) {
  // Filter active (closed) customers
  const activeCustomers = useMemo(() => {
    return leads.filter(l => l.pipeline === 'Aktif');
  }, [leads]);

  const closingCount = activeCustomers.length;

  // Calculate detailed financial breakdown for each active customer
  const customerFinancials = useMemo(() => {
    return activeCustomers.map(c => {
      const financials = calculateContractFinancials(c.packageInterest, c.subscriptionPeriod);
      return {
        customer: c,
        ...financials
      };
    });
  }, [activeCustomers]);

  // Aggregate totals
  const totals = useMemo(() => {
    let totalBasePrice = 0;
    let totalPph = 0;
    let totalRevenue = 0;
    let totalInsentif25 = 0;
    let totalInsentif30 = 0;
    let totalInsentif35 = 0;

    customerFinancials.forEach(item => {
      totalBasePrice += item.basePrice;
      totalPph += item.pph;
      totalRevenue += item.revenue;
      totalInsentif25 += item.insentif25;
      totalInsentif30 += item.insentif30;
      totalInsentif35 += item.insentif35;
    });

    return {
      totalBasePrice,
      totalPph,
      totalRevenue,
      totalInsentif25,
      totalInsentif30,
      totalInsentif35
    };
  }, [customerFinancials]);

  // Potential Revenue (pipeline is NOT Aktif, status is Interested or Thinking)
  const potentialRevenue = useMemo(() => {
    const hotProspects = leads.filter(
      l => l.pipeline !== 'Aktif' && 
           ['Interested', 'Thinking'].includes(l.status)
    );
    return hotProspects.reduce((sum, p) => {
      const price = PACKAGE_PRICES[p.packageInterest] || 0;
      return sum + price;
    }, 0);
  }, [leads]);

  // Determine active tier based on closing count
  const activeTier = useMemo(() => {
    if (closingCount >= 10) {
      return {
        level: 3,
        rate: 0.35,
        name: 'Tier 3 (Superstar)',
        bonusPct: '35%',
        incentiveAmount: totals.totalInsentif35,
        color: 'bg-indigo-600 text-white',
        text: 'text-indigo-600',
        bg: 'bg-indigo-50',
        border: 'border-indigo-500',
        progressMsg: 'Luar biasa! Anda berada di tingkat komisi tertinggi (Tier 3).'
      };
    } else if (closingCount >= 5) {
      return {
        level: 2,
        rate: 0.30,
        name: 'Tier 2 (Pro)',
        bonusPct: '30%',
        incentiveAmount: totals.totalInsentif30,
        color: 'bg-emerald-600 text-white',
        text: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-500',
        progressMsg: `Butuh ${10 - closingCount} closing lagi untuk mencapai Tier 3 (Komisi 35%)`
      };
    } else if (closingCount >= 1) {
      return {
        level: 1,
        rate: 0.25,
        name: 'Tier 1 (Starter)',
        bonusPct: '25%',
        incentiveAmount: totals.totalInsentif25,
        color: 'bg-amber-600 text-white',
        text: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-500',
        progressMsg: `Butuh ${5 - closingCount} closing lagi untuk mencapai Tier 2 (Komisi 30%)`
      };
    } else {
      return {
        level: 1,
        rate: 0.25,
        name: 'Tier 1 (Starter)',
        bonusPct: '25%',
        incentiveAmount: 0,
        color: 'bg-slate-400 text-white',
        text: 'text-slate-500',
        bg: 'bg-slate-50',
        border: 'border-slate-300',
        progressMsg: 'Closing pelanggan pertama Anda untuk mengaktifkan komisi!'
      };
    }
  }, [closingCount, totals]);

  // Target Achievement percentage
  const targetPct = Math.min(100, Math.round((closingCount / config.monthlyTarget) * 100));

  return (
    <div className="space-y-6">
      
      {/* Top statistics cards overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Monthly Closings Count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Closing Bulan Ini</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-800">{closingCount}</span>
            <span className="text-xs text-slate-400 block mt-1">Target: {config.monthlyTarget} closing</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3">
            <div 
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300" 
              style={{ width: `${targetPct}%` }}
            />
          </div>
          <span className="text-[10px] text-emerald-600 font-bold self-end mt-1">{targetPct}% dari Target</span>
        </div>

        {/* Gross Monthly Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Monthly Revenue</span>
            <div className="p-2 bg-[#F58220]/10 text-[#F58220] rounded-xl">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-800">{formatIDR(totals.totalBasePrice)}</span>
            <span className="text-xs text-slate-400 block mt-1">Total tagihan bulanan kotor</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-4 block border-t border-slate-100 pt-2 font-medium">
            Sebelum PPN 11%
          </span>
        </div>

        {/* Net Revenue after PPN */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Revenue (Bersih)</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-800">{formatIDR(totals.totalRevenue)}</span>
            <span className="text-xs text-slate-400 block mt-1">Basis perhitungan komisi</span>
          </div>
          <span className="text-[10px] text-indigo-600 font-bold mt-4 block border-t border-slate-100 pt-2 flex items-center gap-0.5">
            <Sparkles className="w-3 h-3" /> Sudah dipotong PPN 11%
          </span>
        </div>

        {/* Earned Commission based on Active Tier */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Komisi Anda ({activeTier.bonusPct})</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-amber-600">{formatIDR(activeTier.incentiveAmount)}</span>
            <span className="text-xs text-slate-400 block mt-1">Pencapaian: {activeTier.name}</span>
          </div>
          <span className="text-[10px] text-amber-600 font-bold mt-4 block border-t border-slate-100 pt-2 font-medium">
            {activeTier.progressMsg}
          </span>
        </div>
      </div>

      {/* Main List Table - Financial Ledger */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-[#F58220]" />
              Rincian Perhitungan Revenue & Insentif Closing
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Daftar seluruh pelanggan aktif beserta nominal tagihan kotor bulanan, potongan PPN 11%, nilai bersih, dan opsi komisi.
            </p>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-100/40 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-3 text-center">No</th>
                <th className="py-3 px-3">Pelanggan</th>
                <th className="py-3 px-2">Tanggal</th>
                <th className="py-3 px-3">Paket Layanan</th>
                <th className="py-3 px-2">Periode</th>
                <th className="py-3 px-3 text-right">Harga</th>
                <th className="py-3 px-3 text-right text-rose-500">PPN 11%</th>
                <th className="py-3 px-3 text-right text-indigo-600 bg-indigo-50/30">Net Revenue</th>
                <th className="py-3 px-3 text-right text-slate-600">Ins. 25%</th>
                <th className="py-3 px-3 text-right text-slate-600">Ins. 30%</th>
                <th className="py-3 px-3 text-right text-slate-600">Ins. 35%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {customerFinancials.length > 0 ? (
                customerFinancials.map((item, index) => (
                  <tr key={item.customer.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3 text-center font-bold text-slate-400">{index + 1}</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800 leading-tight">{item.customer.name}</div>
                      <div className="text-[9px] text-slate-400 font-medium mt-0.5">{item.customer.area}</div>
                    </td>
                    <td className="py-3 px-2 text-slate-500 whitespace-nowrap">
                      {item.customer.closingDate || item.customer.lastFollowUpDate || '-'}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700 max-w-[150px] truncate" title={item.customer.packageInterest}>
                      {item.customer.packageInterest}
                    </td>
                    <td className="py-3 px-2">
                      <span className="px-1.5 py-0.5 rounded-md font-bold text-[9px] bg-slate-100 text-slate-600 border border-slate-200/50">
                        {item.customer.subscriptionPeriod || 'Tahunan'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">{formatIDR(item.basePrice)}</td>
                    <td className="py-3 px-3 text-right font-mono text-rose-500">-{formatIDR(item.pph)}</td>
                    <td className="py-3 px-3 text-right font-black font-mono text-indigo-700 bg-indigo-50/30">{formatIDR(item.revenue)}</td>
                    <td className={`py-3 px-3 text-right font-mono ${activeTier.level === 1 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                      {formatIDR(item.insentif25)}
                    </td>
                    <td className={`py-3 px-3 text-right font-mono ${activeTier.level === 2 ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                      {formatIDR(item.insentif30)}
                    </td>
                    <td className={`py-3 px-3 text-right font-mono ${activeTier.level === 3 ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
                      {formatIDR(item.insentif35)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 italic">
                    Belum ada data pelanggan yang berstatus Aktif (Closing) pada periode ini.
                  </td>
                </tr>
              )}

              {/* Total Aggregate Row */}
              {customerFinancials.length > 0 && (
                <tr className="bg-slate-50 border-t-2 border-slate-200/60 text-xs font-bold">
                  <td colSpan={5} className="py-3 px-3 text-right text-slate-700 uppercase tracking-wider font-extrabold">Total Keseluruhan</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-500">{formatIDR(totals.totalBasePrice)}</td>
                  <td className="py-3 px-3 text-right font-mono text-rose-500">-{formatIDR(totals.totalPph)}</td>
                  <td className="py-3 px-3 text-right font-mono text-indigo-700 bg-indigo-100/30">{formatIDR(totals.totalRevenue)}</td>
                  <td className={`py-3 px-3 text-right font-mono ${activeTier.level === 1 ? 'text-amber-600 font-extrabold' : 'text-slate-400'}`}>
                    {formatIDR(totals.totalInsentif25)}
                  </td>
                  <td className={`py-3 px-3 text-right font-mono ${activeTier.level === 2 ? 'text-emerald-600 font-extrabold' : 'text-slate-400'}`}>
                    {formatIDR(totals.totalInsentif30)}
                  </td>
                  <td className={`py-3 px-3 text-right font-mono ${activeTier.level === 3 ? 'text-indigo-600 font-extrabold' : 'text-slate-400'}`}>
                    {formatIDR(totals.totalInsentif35)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tier Performance and Target Checker Block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Tier Info Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs md:col-span-2 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Skema Target Komisi & Tier</h4>
            <h3 className="text-sm font-bold text-slate-800">Pencapaian Tingkat Insentif</h3>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {/* Tier 1 */}
            <div className={`p-3 rounded-xl border transition-all ${
              activeTier.level === 1 && closingCount > 0
                ? 'bg-amber-50/60 border-amber-200 shadow-2xs' 
                : 'bg-slate-50/50 border-slate-100 opacity-60'
            }`}>
              <div className="flex items-center gap-1.5 text-amber-700 font-bold text-xs mb-1">
                <Trophy className="w-3.5 h-3.5" />
                <span>Tier 1 (Starter)</span>
              </div>
              <div className="text-[10px] text-slate-500 font-semibold">1 - 4 Closing</div>
              <div className="text-lg font-black text-amber-600 mt-1">25% <span className="text-[10px] text-slate-400 font-medium">Insentif</span></div>
            </div>

            {/* Tier 2 */}
            <div className={`p-3 rounded-xl border transition-all ${
              activeTier.level === 2 
                ? 'bg-emerald-50/60 border-emerald-200 shadow-2xs' 
                : 'bg-slate-50/50 border-slate-100 opacity-60'
            }`}>
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs mb-1">
                <Trophy className="w-3.5 h-3.5" />
                <span>Tier 2 (Pro)</span>
              </div>
              <div className="text-[10px] text-slate-500 font-semibold">5 - 9 Closing</div>
              <div className="text-lg font-black text-emerald-600 mt-1">30% <span className="text-[10px] text-slate-400 font-medium">Insentif</span></div>
            </div>

            {/* Tier 3 */}
            <div className={`p-3 rounded-xl border transition-all ${
              activeTier.level === 3 
                ? 'bg-indigo-50/60 border-indigo-200 shadow-2xs' 
                : 'bg-slate-50/50 border-slate-100 opacity-60'
            }`}>
              <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-xs mb-1">
                <Trophy className="w-3.5 h-3.5" />
                <span>Tier 3 (Superstar)</span>
              </div>
              <div className="text-[10px] text-slate-500 font-semibold">&gt;= 10 Closing</div>
              <div className="text-lg font-black text-indigo-600 mt-1">35% <span className="text-[10px] text-slate-400 font-medium">Insentif</span></div>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] text-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#F58220]" />
              <div>
                <span>Pencapaian Anda: <strong className="text-slate-800">{closingCount} Closing</strong></span>
                <span className="text-[10px] text-slate-400 ml-1.5">({activeTier.name} Aktif)</span>
              </div>
            </div>
            <span className="font-extrabold text-[#F58220]">{activeTier.progressMsg}</span>
          </div>
        </div>

        {/* Real-time Commission calculation card */}
        <div className="bg-slate-900 rounded-2xl p-5 text-white flex flex-col justify-between shadow-md border border-slate-800">
          <div>
            <div className="flex items-center gap-1 bg-[#F58220]/20 text-[#F58220] px-2.5 py-1 rounded-lg w-max mb-3.5 border border-[#F58220]/30">
              <Sparkles className="w-3 h-3" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Kalkulasi Komisi Akhir</span>
            </div>
            
            <h3 className="text-sm font-bold text-slate-200">Total Komisi Yang Diterima</h3>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
              Dihitung berdasarkan persentase tier aktif dikali total Net Revenue bersih dari pelanggan bulan ini.
            </p>

            <div className="mt-5 space-y-2.5">
              <div className="flex justify-between items-baseline border-b border-slate-800 pb-1.5">
                <span className="text-[10px] text-slate-400">Total Net Revenue</span>
                <span className="font-mono text-xs text-slate-300 font-bold">{formatIDR(totals.totalRevenue)}</span>
              </div>
              <div className="flex justify-between items-baseline border-b border-slate-800 pb-1.5">
                <span className="text-[10px] text-slate-400">Tingkat Komisi Anda</span>
                <span className={`text-xs font-black ${activeTier.text || 'text-amber-500'}`}>{activeTier.bonusPct} ({activeTier.name})</span>
              </div>
            </div>
          </div>

          <div className="mt-5 bg-slate-800/60 p-4 rounded-xl border border-slate-800">
            <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Estimasi Komisi Masuk:</span>
            <span className="text-2xl font-black text-[#F58220] block mt-1 font-mono tracking-tight">
              {formatIDR(activeTier.incentiveAmount)}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
