/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Lead, SalesConfig } from './types';

export const INITIAL_SALES_CONFIG: SalesConfig = {
  salesName: 'EGI OXYGEN',
  monthlyTarget: 15,
  reminderMode: 'auto',
  reminderThinkingDays: 2,
  reminderNBPDays: 1,
  theme: 'light',
  reminderPattern: '1,2,4,7',
  showActiveProspectsCard: false,
};

// Generate date relative to today's local time (2026-07-10)
const getRelativeDateStr = (offsetDays: number): string => {
  const d = new Date('2026-07-10');
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-1',
    userId: "admin-001",
    whatsapp: '081234567890',
    name: 'Pak Ahmad',
    address: 'Jl. Melati No. 45, RT 02/RW 05, Tebet',
    area: 'DKI Jakarta',
    source: 'Qiscus FB',
    packageInterest: 'Stream 50 Mbps - Rp 185.000',
    notes: 'Tertarik pasang untuk anak sekolah online. Masih nego dengan istri.',
    status: 'Thinking',
    pipeline: 'Follow Up',
    followUpCount: 2,
    nextReminderDate: getRelativeDateStr(0), // Today
    lastFollowUpDate: getRelativeDateStr(-2),
    createdAt: getRelativeDateStr(-4),
    history: [
      {
        id: 'hist-1-1',
    userId: "admin-001",
        date: '2026-07-06 10:00',
        status: 'Interested',
        pipeline: 'Lead Baru',
        notes: 'Inquiry masuk dari FB Ads, tanya paket 50 Mbps.'
      },
      {
        id: 'hist-1-2',
    userId: "admin-001",
        date: '2026-07-08 14:30',
        status: 'Thinking',
        pipeline: 'Follow Up',
        notes: 'Follow up ke-2. Masih nanya diskon biaya instalasi.'
      }
    ]
  },
  {
    id: 'lead-2',
    userId: "admin-001",
    whatsapp: '082345678901',
    name: 'Bu Sinta',
    address: 'Cluster Edelweiss Blok C/12, BSD',
    area: 'Banten',
    source: 'Whatsapp',
    packageInterest: 'Stream 50 Mbps - Rp 199.000',
    notes: 'NBP - Belum respon chat setelah dikirim brosur.',
    status: 'NBP',
    pipeline: 'Lead Baru',
    followUpCount: 1,
    nextReminderDate: getRelativeDateStr(0), // Today
    lastFollowUpDate: getRelativeDateStr(-1),
    createdAt: getRelativeDateStr(-1),
    history: [
      {
        id: 'hist-2-1',
    userId: "admin-001",
        date: '2026-07-09 09:15',
        status: 'NBP',
        pipeline: 'Lead Baru',
        notes: 'Chat dikirim, dibaca saja tapi tidak dibalas.'
      }
    ]
  },
  {
    id: 'lead-3',
    userId: "admin-001",
    whatsapp: '083456789012',
    name: 'Mas Budi',
    address: 'Jl. Kemang Raya No. 10B, Kemang',
    area: 'DKI Jakarta',
    source: 'FB Personal',
    packageInterest: 'Stream 100 Mbps - Rp 242.000',
    notes: 'Butuh internet cepat untuk WFH dan gaming. Minta dikirim penawaran survey.',
    status: 'Interested',
    pipeline: 'Follow Up',
    followUpCount: 3,
    nextReminderDate: getRelativeDateStr(1), // Tomorrow
    lastFollowUpDate: getRelativeDateStr(-1),
    createdAt: getRelativeDateStr(-6),
    history: [
      {
        id: 'hist-3-1',
    userId: "admin-001",
        date: '2026-07-04 11:00',
        status: 'Interested',
        pipeline: 'Lead Baru',
        notes: 'Direferensikan oleh Pak Joko. Minat paket 100 Mbps.'
      },
      {
        id: 'hist-3-2',
    userId: "admin-001",
        date: '2026-07-06 13:00',
        status: 'Interested',
        pipeline: 'Follow Up',
        notes: 'Follow up. Konfirmasi titik tiang terdekat.'
      },
      {
        id: 'hist-3-3',
    userId: "admin-001",
        date: '2026-07-09 15:00',
        status: 'Interested',
        pipeline: 'Follow Up',
        notes: 'Pindah ke pipeline Follow Up. Jadwal survey tgl 11 Juli.'
      }
    ]
  },
  {
    id: 'lead-4',
    userId: "admin-001",
    whatsapp: '084567890123',
    name: 'Ibu Rina',
    address: 'Apartemen Menteng Regency Tower B Lantai 8, Menteng',
    area: 'DKI Jakarta',
    source: 'Lainnya',
    packageInterest: 'Stream 50 Mbps - Rp 185.000',
    notes: 'Terlambat follow up - Sibuk ngurus pindahan.',
    status: 'Thinking',
    pipeline: 'Follow Up',
    followUpCount: 0,
    nextReminderDate: getRelativeDateStr(-2), // Overdue by 2 days
    lastFollowUpDate: null,
    createdAt: getRelativeDateStr(-5),
    history: [
      {
        id: 'hist-4-1',
    userId: "admin-001",
        date: '2026-07-05 16:20',
        status: 'Interested',
        pipeline: 'Lead Baru',
        notes: 'Datang ke booth, minta di-follow up tanggal 8 Juli.'
      }
    ]
  },
  {
    id: 'lead-5',
    userId: "admin-001",
    whatsapp: '085678901234',
    name: 'Pak Hendra',
    address: 'Jl. Boulevard Kelapa Gading Blok WA3 No. 7, Kelapa Gading',
    area: 'DKI Jakarta',
    source: 'Qiscus Website',
    packageInterest: 'Stream Sports 200 Mbps (Promo) - Rp 277.500',
    notes: 'Sudah aktif. Pelanggan sangat puas dengan kecepatan upload simetris.',
    status: 'Interested',
    pipeline: 'Aktif',
    followUpCount: 4,
    nextReminderDate: null,
    lastFollowUpDate: getRelativeDateStr(-1),
    createdAt: getRelativeDateStr(-12),
    customerStatus: 'Aktif',
    closingDate: '2026-07-09',
    subscriptionPeriod: 'Tahunan',
    history: [
      {
        id: 'hist-5-1',
    userId: "admin-001",
        date: '2026-06-28 09:00',
        status: 'Interested',
        pipeline: 'Lead Baru',
        notes: 'Form website masuk.'
      },
      {
        id: 'hist-5-2',
    userId: "admin-001",
        date: '2026-06-30 11:00',
        status: 'Interested',
        pipeline: 'Follow Up',
        notes: 'Hasil survey: Tiang ready jarak 15 meter.'
      },
      {
        id: 'hist-5-3',
    userId: "admin-001",
        date: '2026-07-02 14:00',
        status: 'Interested',
        pipeline: 'Menunggu Berkas',
        notes: 'KTP dan Form Aplikasi diisi.'
      },
      {
        id: 'hist-5-4',
    userId: "admin-001",
        date: '2026-07-05 10:00',
        status: 'Interested',
        pipeline: 'Tidak Tercover',
        notes: 'Port FAT dialokasikan.'
      },
      {
        id: 'hist-5-5',
    userId: "admin-001",
        date: '2026-07-08 13:00',
        status: 'Interested',
        pipeline: 'Instalasi',
        notes: 'Teknisi dijadwalkan pasang.'
      },
      {
        id: 'hist-5-6',
    userId: "admin-001",
        date: '2026-07-09 17:00',
        status: 'Interested',
        pipeline: 'Aktif',
        notes: 'Internet aktif, speedtest aman simetris 200 Mbps.'
      }
    ]
  },
  {
    id: 'lead-6',
    userId: "admin-001",
    whatsapp: '086789012345',
    name: 'Ibu Diana',
    address: 'Perumahan Pondok Indah Blok F/4, Pondok Indah',
    area: 'DKI Jakarta',
    source: 'Lainnya',
    packageInterest: 'Stream plus + tv kabel 100 Mbps - Rp 299.000',
    notes: 'Menunggu berkas disetujui suaminya.',
    status: 'Interested',
    pipeline: 'Menunggu Berkas',
    followUpCount: 2,
    nextReminderDate: getRelativeDateStr(2), // 2 days later
    lastFollowUpDate: getRelativeDateStr(-1),
    createdAt: getRelativeDateStr(-8),
    history: [
      {
        id: 'hist-6-1',
    userId: "admin-001",
        date: '2026-07-02 11:30',
        status: 'Interested',
        pipeline: 'Lead Baru',
        notes: 'Flyer dibagikan saat sepedaan.'
      },
      {
        id: 'hist-6-2',
    userId: "admin-001",
        date: '2026-07-05 14:00',
        status: 'Interested',
        pipeline: 'Follow Up',
        notes: 'Menjawab pertanyaan teknis redaman fiber.'
      },
      {
        id: 'hist-6-3',
    userId: "admin-001",
        date: '2026-07-09 10:00',
        status: 'Interested',
        pipeline: 'Menunggu Berkas',
        notes: 'Sudah deal harga, foto KTP menyusul.'
      }
    ]
  },
  {
    id: 'lead-7',
    userId: "admin-001",
    whatsapp: '087890123456',
    name: 'Pak Joko',
    address: 'Jl. Tebet Barat Dalam IX No. 2A, Tebet',
    area: 'DKI Jakarta',
    source: 'FB Personal',
    packageInterest: 'Stream 50 Mbps - Rp 185.000',
    notes: 'Closing bulan ini. Pemasangan berhasil.',
    status: 'Interested',
    pipeline: 'Aktif',
    followUpCount: 2,
    nextReminderDate: null,
    lastFollowUpDate: getRelativeDateStr(-3),
    createdAt: getRelativeDateStr(-10),
    customerStatus: 'Aktif',
    closingDate: '2026-07-07',
    subscriptionPeriod: '3 Bulan',
    history: [
      {
        id: 'hist-7-1',
    userId: "admin-001",
        date: '2026-07-01 10:00',
        status: 'Interested',
        pipeline: 'Lead Baru',
        notes: 'Direferensikan tetangga.'
      },
      {
        id: 'hist-7-2',
    userId: "admin-001",
        date: '2026-07-07 15:30',
        status: 'Interested',
        pipeline: 'Aktif',
        notes: 'Proses instalasi selesai & tgl 7 Juli aktif.'
      }
    ]
  },
  {
    id: 'lead-8',
    userId: "admin-001",
    whatsapp: '088901234567',
    name: 'Ibu Maya',
    address: 'Perumahan Sunter Hijau Blok K/9, Sunter',
    area: 'DKI Jakarta',
    source: 'Qiscus Live Chat',
    packageInterest: 'Stream 30 Mbps',
    notes: 'Belum tercover jaringan WiFi Oxygen (Not Cover).',
    status: 'Not Coverage',
    pipeline: 'Tidak Tercover',
    followUpCount: 3,
    nextReminderDate: getRelativeDateStr(0), // Today
    lastFollowUpDate: getRelativeDateStr(-1),
    createdAt: getRelativeDateStr(-9),
    history: [
      {
        id: 'hist-8-1',
    userId: "admin-001",
        date: '2026-07-01 13:00',
        status: 'Interested',
        pipeline: 'Lead Baru',
        notes: 'Live chat menanyakan ketersediaan jaringan di Sunter Hijau.'
      },
      {
        id: 'hist-8-2',
    userId: "admin-001",
        date: '2026-07-04 11:00',
        status: 'Interested',
        pipeline: 'Follow Up',
        notes: 'Hasil survey: Tiang terdekat penuh, perlu penambahan FAT.'
      },
      {
        id: 'hist-8-3',
    userId: "admin-001",
        date: '2026-07-09 16:00',
        status: 'Not Coverage',
        pipeline: 'Tidak Tercover',
        notes: 'Pengajuan split box FAT baru.'
      }
    ]
  }
];
