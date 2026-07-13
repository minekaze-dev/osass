/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LeadSource =
  | 'Qiscus FB'
  | 'Qiscus Live Chat'
  | 'Qiscus Website'
  | 'FB Personal'
  | 'Webcover'
  | 'Tiktok'
  | 'Whatsapp'
  | 'Lainnya';

export type FollowUpStatus =
  | 'Interested'
  | 'Thinking'
  | 'NBP' // Tidak Respon
  | 'General Payment'
  | 'Paid'
  | 'Closing'
  | 'Installed'
  | 'Not Coverage'
  | 'Not Interested'
  | 'Invalid Number'
  | 'Area Full';

export type PipelineStage =
  | 'Lead Baru'
  | 'Follow Up'
  | 'Menunggu Berkas'
  | 'Tidak Tercover'
  | 'Instalasi'
  | 'Aktif';

export interface HistoryEntry {
  id: string;
  userId?: string;
  date: string; // YYYY-MM-DD HH:mm
  status: FollowUpStatus;
  pipeline: PipelineStage;
  notes: string;
}

export type CustomerStatus = 'Aktif' | 'Refund' | 'Follow Up' | 'Dismantle' | 'NBP' | 'Thinking' | 'Not Interested' | 'General Payment' | 'Paid' | 'Area Full';

export interface User {
  id: string;
  name: string;
  code: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface Lead {
  id: string;
  userId: string;
  whatsapp: string; // Unique
  name: string;
  address: string;
  area: string;
  source: LeadSource;
  packageInterest: string; // e.g. "Stream 30 Mbps", "Premium 50 Mbps", "Power 100 Mbps"
  notes: string;
  status: FollowUpStatus;
  pipeline: PipelineStage;
  followUpCount: number; // e.g. 0, 1, 2, 7, etc.
  nextReminderDate: string | null; // YYYY-MM-DD
  lastFollowUpDate: string | null; // YYYY-MM-DD
  createdAt: string; // YYYY-MM-DD
  history: HistoryEntry[];
  
  // Customer specific fields
  customerStatus?: CustomerStatus | null;
  closingStatus?: 'Not Closed' | 'On Process' | 'Closed';
  closingDate?: string | null; // YYYY-MM-DD
  subscriptionPeriod?: string | null; // e.g. "12 Bulan", "24 Bulan"
  customerId?: string;
}

export interface SalesConfig {
  salesName: string;
  monthlyTarget: number;
  reminderMode: 'auto' | 'manual';
  reminderThinkingDays: number;
  reminderNBPDays: number;
  theme: 'light' | 'dark';
  reminderPattern: string; // e.g. "1,2,4,7"
}
