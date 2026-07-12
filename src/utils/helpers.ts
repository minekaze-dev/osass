/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FollowUpStatus, Lead } from '../types';

export const PACKAGE_PRICES: Record<string, number> = {
  // Paket Baru
  'Stream 50 Mbps - Rp 185.000': 185000,
  'Stream 50 Mbps - Rp 199.000': 199000,
  'Stream 100 Mbps - Rp 242.000': 242000,
  'Stream Sports 200 Mbps (Promo) - Rp 277.500': 277500,
  'Stream 150 Mbps - Rp 306.000': 306000,
  'Stream 200 Mbps - Rp 356.000': 356000,
  'Stream plus + tv kabel 100 Mbps - Rp 299.000': 299000,
  'Stream plus + tv kabel 150 Mbps - Rp 359.000': 359000,
  'Stream plus + tv kabel 200 Mbps - Rp 409.000': 409000,
  
  // Legacy / Fallback untuk kompatibilitas data lama
  'Stream 30 Mbps': 185000,
  'Zoom 50 Mbps': 199000,
  'Power 100 Mbps': 242000,
  'Sporty 100 Mbps': 277500,
  'Super Double 200 Mbps': 356000
};

export const PACKAGES = [
  'Stream 50 Mbps - Rp 185.000',
  'Stream 50 Mbps - Rp 199.000',
  'Stream 100 Mbps - Rp 242.000',
  'Stream Sports 200 Mbps (Promo) - Rp 277.500',
  'Stream 150 Mbps - Rp 306.000',
  'Stream 200 Mbps - Rp 356.000',
  'Stream plus + tv kabel 100 Mbps - Rp 299.000',
  'Stream plus + tv kabel 150 Mbps - Rp 359.000',
  'Stream plus + tv kabel 200 Mbps - Rp 409.000'
];

export const PERIOD_OPTIONS = [
  'Bulanan',
  '3 Bulan',
  '6 Bulan',
  'Tahunan'
];

export interface FinancialResult {
  basePrice: number;
  pph: number;
  revenue: number;
  insentif25: number;
  insentif30: number;
  insentif35: number;
}

export function calculateContractFinancials(packageName: string, periodStr: string | null | undefined): FinancialResult {
  const packagePrice = PACKAGE_PRICES[packageName] || 185000; // default ke paket termurah jika tidak ditemukan
  
  let basePrice = packagePrice; // total contract price
  let totalMonths = 1;

  const normalizedPeriod = (periodStr || 'Tahunan').toLowerCase().trim();
  
  if (normalizedPeriod === 'tahunan' || normalizedPeriod.includes('tahun') || normalizedPeriod.includes('annual')) {
    basePrice = 10 * packagePrice;
    totalMonths = 12;
  } else if (normalizedPeriod === '6 bulan' || normalizedPeriod.includes('6') || normalizedPeriod.includes('semester')) {
    basePrice = 5 * packagePrice;
    totalMonths = 6;
  } else if (normalizedPeriod === '3 bulan' || normalizedPeriod.includes('3') || normalizedPeriod.includes('quarter')) {
    basePrice = Math.round(3 * packagePrice * 0.90);
    totalMonths = 3;
  } else if (normalizedPeriod === 'bulanan' || normalizedPeriod.includes('bulan') || normalizedPeriod.includes('month')) {
    basePrice = packagePrice;
    totalMonths = 1;
  } else {
    // Default to Tahunan as standard fallback if not specified
    basePrice = 10 * packagePrice;
    totalMonths = 12;
  }
  
  const monthlyPrice = Math.round(basePrice / totalMonths);
  const pph = Math.round(monthlyPrice * 0.11);
  const revenue = monthlyPrice - pph;
  const insentif25 = Math.round(revenue * 0.25);
  const insentif30 = Math.round(revenue * 0.30);
  const insentif35 = Math.round(revenue * 0.35);
  
  return {
    basePrice: packagePrice, // HARGA tetap menggunakan harga paket awal tanpa dipotong diskon periode
    pph,
    revenue,
    insentif25,
    insentif30,
    insentif35
  };
}

export const AREAS = [
  'Aceh',
  'Sumatera Utara',
  'Sumatera Barat',
  'Riau',
  'Kepulauan Riau',
  'Jambi',
  'Sumatera Selatan',
  'Kepulauan Bangka Belitung',
  'Bengkulu',
  'Lampung',
  'DKI Jakarta',
  'Banten',
  'Jawa Barat',
  'Jawa Tengah',
  'DI Yogyakarta',
  'Jawa Timur',
  'Bali',
  'Nusa Tenggara Barat',
  'Nusa Tenggara Timur',
  'Kalimantan Barat',
  'Kalimantan Tengah',
  'Kalimantan Selatan',
  'Kalimantan Timur',
  'Kalimantan Utara',
  'Sulawesi Utara',
  'Gorontalo',
  'Sulawesi Tengah',
  'Sulawesi Barat',
  'Sulawesi Selatan',
  'Sulawesi Tenggara',
  'Maluku',
  'Maluku Utara',
  'Papua Barat',
  'Papua',
  'Papua Selatan',
  'Papua Tengah',
  'Papua Pegunungan',
  'Papua Barat Daya',
  'Lainnya'
];

export const LEAD_SOURCES = [
  'MGM',
  'Qiscus FB',
  'Qiscus Live Chat',
  'Qiscus Website',
  'FB Personal',
  'Webcover',
  'Tiktok',
  'Whatsapp',
  'Lainnya'
] as const;

export const PIPELINE_STAGES = [
  'Lead Baru',
  'Follow Up',
  'Menunggu Berkas',
  'Tidak Tercover',
  'Instalasi',
  'Aktif'
] as const;

export const FOLLOW_UP_STATUSES = [
  'Interested',
  'Thinking',
  'NBP',
  'General Payment',
  'Paid',
  'Closing',
  'Installed',
  'Not Coverage',
  'Not Interested',
  'Invalid Number',
  'Area Full'
] as const;

// Format IDR currency
export const formatIDR = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
};

// Clean and format Indonesian phone number to international 62... format for WhatsApp API
export const formatWhatsAppNumber = (num: string): string => {
  let cleaned = num.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('+62')) {
    cleaned = cleaned.slice(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
};

// Calculate how many days have elapsed since creation or last follow up
export const getDaysElapsed = (startDateStr: string): number => {
  const start = new Date(startDateStr);
  const today = new Date('2026-07-10'); // Fix relative to current date in metadata
  const diffTime = today.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 ? diffDays : 0;
};

// Automate next reminder date (YYYY-MM-DD) based on status and settings
export const calculateNextReminderDate = (
  status: FollowUpStatus,
  thinkingDays: number,
  nbpDays: number,
  customDays?: number,
  nbpCount?: number,
  reminderMode?: 'auto' | 'manual',
  reminderPattern?: string,
  createdAt?: string
): string | null => {
  const today = new Date('2026-07-10'); // Fix relative to current date in metadata
  const createdDate = createdAt ? new Date(createdAt) : new Date(today);
  
  const mode = reminderMode || 'auto';
  
  switch (status) {
    case 'Thinking':
    case 'NBP':
      if (mode === 'manual') {
        today.setDate(today.getDate() + (status === 'Thinking' ? thinkingDays : nbpDays));
      } else {
        // Auto pattern logic - Relative to CREATION date
        const patternStr = reminderPattern || '1,2,4,7';
        const pattern = patternStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        const count = nbpCount || 0;
        
        if (count < pattern.length) {
          const daysFromStart = pattern[count];
          const nextDate = new Date(createdDate);
          nextDate.setDate(nextDate.getDate() + daysFromStart);
          
          // Ensure it's not in the past relative to today if we are doing it late
          const nextDateStr = nextDate.toISOString().split('T')[0];
          const todayStr = today.toISOString().split('T')[0];
          
          if (nextDateStr <= todayStr) {
            // If the milestone is already passed or today, schedule for tomorrow
            today.setDate(today.getDate() + 1);
            return today.toISOString().split('T')[0];
          }
          
          return nextDateStr;
        } else {
          // If past pattern, default to +7 days from today
          today.setDate(today.getDate() + 7);
        }
      }
      break;
    case 'Interested':
      if (customDays !== undefined) {
        today.setDate(today.getDate() + customDays);
      } else {
        today.setDate(today.getDate() + 1); // Default to tomorrow
      }
      break;
    case 'Not Interested':
    case 'Not Coverage':
    case 'Invalid Number':
      return null; // No further automatic reminder
    default:
      today.setDate(today.getDate() + 1); // Default next day
  }
  
  return today.toISOString().split('T')[0];
};

// Determine status badge color scheme
export const getStatusColorClasses = (status: FollowUpStatus) => {
  switch (status) {
    case 'Interested':
      return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-600' };
    case 'Thinking':
      return { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-600' };
    case 'NBP':
      return { bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'text-rose-600' };
    case 'Not Interested':
    case 'Not Coverage':
    case 'Invalid Number':
    case 'Area Full':
      return { bg: 'bg-slate-100 text-slate-700 border-slate-200', text: 'text-slate-500' };
    case 'General Payment':
      return { bg: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-600' };
    case 'Paid':
      return { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', text: 'text-indigo-600' };
    case 'Closing':
    case 'Installed':
      return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-600' };
    default:
      return { bg: 'bg-slate-50 text-slate-700 border-slate-200', text: 'text-slate-600' };
  }
};

// Determine pipeline badge color
export const getPipelineColorClasses = (stage: string) => {
  switch (stage) {
    case 'Lead Baru':
      return 'bg-blue-100 text-blue-800';
    case 'Follow Up':
      return 'bg-indigo-100 text-indigo-800';
    case 'Menunggu Berkas':
      return 'bg-amber-100 text-amber-800';
    case 'Tidak Tercover':
      return 'bg-rose-100 text-rose-800 font-medium';
    case 'Instalasi':
      return 'bg-orange-100 text-orange-800';
    case 'Aktif':
      return 'bg-emerald-100 text-emerald-800 font-bold';
    default:
      return 'bg-slate-100 text-slate-800';
  }
};
