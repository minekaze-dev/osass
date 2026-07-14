/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Settings, User, Target, Clock, ShieldAlert, 
  Download, Upload, Check, AlertCircle, Sparkles, Moon, Sun,
  Database, RefreshCw, CloudLightning, Code2
} from 'lucide-react';
import { SalesConfig, Lead } from '../types';

interface SettingsViewProps {
  config: SalesConfig;
  onUpdateConfig: (newConfig: SalesConfig) => void;
  allLeads: Lead[];
  onImportLeads: (importedLeads: Lead[]) => void;
  isSupabaseConnected?: boolean;
  isSyncing?: boolean;
  onSyncToSupabase?: () => void;
  onFetchFromSupabase?: () => void;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  onUpdateSupabaseCredentials?: (url: string, key: string) => void;
}

export default function SettingsView({ 
  config, 
  onUpdateConfig, 
  allLeads, 
  onImportLeads,
  isSupabaseConnected = false,
  isSyncing = false,
  onSyncToSupabase,
  onFetchFromSupabase,
  supabaseUrl = '',
  supabaseAnonKey = '',
  onUpdateSupabaseCredentials = () => {}
}: SettingsViewProps) {
  const [monthlyTarget, setMonthlyTarget] = useState(config.monthlyTarget);
  const [reminderMode, setReminderMode] = useState<'auto' | 'manual'>(config.reminderMode || 'auto');
  const [reminderThinkingDays, setReminderThinkingDays] = useState(config.reminderThinkingDays);
  const [reminderNBPDays, setReminderNBPDays] = useState(config.reminderNBPDays);
  const [reminderPattern, setReminderPattern] = useState(config.reminderPattern || '1,2,4,7');
  const [theme, setTheme] = useState<'light' | 'dark'>(config.theme || 'light');
  
  const [dbUrl, setDbUrl] = useState(supabaseUrl);
  const [dbKey, setDbKey] = useState(supabaseAnonKey);
  
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [showSql, setShowSql] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    onUpdateConfig({
      salesName: config.salesName,
      monthlyTarget: Number(monthlyTarget) || 1,
      reminderMode,
      reminderThinkingDays: Number(reminderThinkingDays) || 1,
      reminderNBPDays: Number(reminderNBPDays) || 1,
      theme,
      reminderPattern: reminderPattern.trim() || '1,2,4,7',
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3000);
  };

  // Backup data - Trigger JSON file download
  const handleBackup = () => {
    try {
      const backupObj = {
        app: 'Sales WiFi Oxygen Assistant',
        backupVersion: '1.0',
        date: '2026-07-10',
        config: {
          salesName: config.salesName,
          monthlyTarget,
          reminderThinkingDays,
          reminderNBPDays,
          theme,
          reminderPattern,
        },
        leads: allLeads,
      };

      const jsonStr = JSON.stringify(backupObj, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `oxygen_sales_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Gagal mengekspor backup data: ' + err);
    }
  };

  // Restore data - Parse uploaded JSON file
  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        // Basic structural validation
        if (!parsed.leads || !Array.isArray(parsed.leads)) {
          throw new Error('Format backup tidak valid. Data leads tidak ditemukan.');
        }

        // Trigger parent state migration
        onImportLeads(parsed.leads);
        
        // If config is included, update it too
        if (parsed.config) {
          onUpdateConfig({
            salesName: parsed.config.salesName || config.salesName,
            monthlyTarget: Number(parsed.config.monthlyTarget) || monthlyTarget,
            reminderMode: parsed.config.reminderMode || reminderMode,
            reminderThinkingDays: Number(parsed.config.reminderThinkingDays) || reminderThinkingDays,
            reminderNBPDays: Number(parsed.config.reminderNBPDays) || reminderNBPDays,
            theme: parsed.config.theme || theme,
            reminderPattern: parsed.config.reminderPattern || reminderPattern,
          });
          // sync local state
          setMonthlyTarget(parsed.config.monthlyTarget || monthlyTarget);
          setReminderMode(parsed.config.reminderMode || reminderMode);
          setReminderThinkingDays(parsed.config.reminderThinkingDays || reminderThinkingDays);
          setReminderNBPDays(parsed.config.reminderNBPDays || reminderNBPDays);
          setTheme(parsed.config.theme || theme);
          setReminderPattern(parsed.config.reminderPattern || reminderPattern);
        }

        setImportSuccess(true);
        setImportError(null);
        setTimeout(() => setImportSuccess(false), 4000);
      } catch (err: any) {
        setImportError(err?.message || 'Gagal memparsing file backup.');
        setImportSuccess(false);
      }
    };
    reader.readAsText(file);
    // Reset file input value to allow uploading same file again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Configurations Form */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
        
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
          <div className="p-1.5 bg-orange-100 rounded-lg text-[#F58220]">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Profil & Parameter Asisten</h2>
            <p className="text-xs text-slate-400">Sesuaikan target personal dan frekuensi otomatisasi asisten.</p>
          </div>
        </div>

        {savedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Pengaturan profil sales berhasil disimpan!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          
          {/* Monthly Closing Target */}
          <div>
            <label className={`block text-xs font-bold mb-1.5 uppercase flex items-center gap-1 ${config.theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'}`}>
              <Target className="w-3.5 h-3.5 text-[#F58220]" /> Target Closing Bulanan (Qty)
            </label>
            <input
              type="number"
              required
              min={1}
              value={monthlyTarget}
              onChange={(e) => setMonthlyTarget(Number(e.target.value))}
              className={`block w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-[#F58220] transition-colors ${
                config.theme === 'dark' 
                  ? 'border-zinc-700 bg-zinc-900 text-zinc-100' 
                  : 'border-slate-200 bg-white text-slate-800'
              }`}
            />
          </div>

          {/* Reminder Mode Selection */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">
              Mode Reminder Follow Up
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="reminderMode" 
                  value="auto" 
                  checked={reminderMode === 'auto'} 
                  onChange={() => setReminderMode('auto')}
                  className="w-4 h-4 text-[#F58220] focus:ring-[#F58220] border-slate-300"
                />
                <span className="text-sm font-medium text-slate-700">Pola Otomatis (1,2,4,7)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="reminderMode" 
                  value="manual" 
                  checked={reminderMode === 'manual'} 
                  onChange={() => setReminderMode('manual')}
                  className="w-4 h-4 text-[#F58220] focus:ring-[#F58220] border-slate-300"
                />
                <span className="text-sm font-medium text-slate-700">Manual (Sesuai Status)</span>
              </label>
            </div>
          </div>

          {reminderMode === 'auto' ? (
            <div className={`p-4 rounded-xl border ${config.theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
              <label className={`block text-xs font-bold mb-1.5 uppercase flex items-center gap-1 ${config.theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'}`}>
                <Clock className="w-3.5 h-3.5 text-[#F58220]" /> Pola Jeda Reminder Otomatis (Hari)
              </label>
              <input
                type="text"
                required
                value={reminderPattern}
                onChange={(e) => setReminderPattern(e.target.value)}
                placeholder="Contoh: 1,2,4,7"
                className={`block w-full px-3 py-2.5 mt-2 rounded-xl border text-sm focus:outline-none focus:border-[#F58220] transition-colors ${
                  config.theme === 'dark' 
                    ? 'border-zinc-700 bg-zinc-950 text-zinc-100' 
                    : 'border-slate-200 bg-white text-slate-800'
                }`}
              />
              <span className={`text-[10px] mt-2 block ${config.theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'}`}>
                Tentukan hari ke berapa saja sistem akan memicu reminder otomatis sejak data pertama kali diinput. Pisahkan dengan koma (contoh: 1,2,4,7).
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Thinking reminder period */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#F58220]" /> Jeda Reminder Thinking (Hari)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={reminderThinkingDays}
                  onChange={(e) => setReminderThinkingDays(Number(e.target.value))}
                  className="block w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:border-[#F58220] transition-colors"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Default: 2 hari. Pelanggan berstatus "Thinking" akan diingatkan kembali setelah X hari.
                </span>
              </div>

              {/* NBP reminder period */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#F58220]" /> Jeda Reminder NBP (Hari)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={reminderNBPDays}
                  onChange={(e) => setReminderNBPDays(Number(e.target.value))}
                  className="block w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:border-[#F58220] transition-colors"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Default: 1 hari. Pelanggan No-Response (NBP) akan di-follow up lagi setelah Y hari.
                </span>
              </div>
            </div>
          )}

          {/* Theme selection (Optional, default to light as instructed) */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
              Tampilan Layar (Theme)
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex-1 py-2 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  theme === 'light'
                    ? 'bg-orange-50 border-[#F58220] text-[#F58220] font-black'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <Sun className="w-4 h-4" />
                Light (Default Utama)
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex-1 py-2 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  theme === 'dark'
                    ? 'bg-orange-50 border-[#F58220] text-[#F58220] font-black'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <Moon className="w-4 h-4" />
                Dark Theme (Opsional)
              </button>
            </div>
            {theme === 'dark' && (
              <span className="text-[10px] text-[#F58220] mt-1 block font-medium">
                Peringatan: Tema utama didesain bernuansa "Light" elegan sesuai ketentuan perusahaan. Mode gelap bersifat eksperimental.
              </span>
            )}
          </div>

          {/* Save button */}
          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#F58220] hover:bg-[#E0721B] text-white font-bold rounded-xl text-sm transition-all shadow-sm hover:shadow"
            >
              Simpan Pengaturan
            </button>
          </div>
        </form>
      </div>

      {/* Backup & Restore Panel */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4 h-fit">
        
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <ShieldAlert className="w-5 h-5 text-amber-500" />
          <div>
            <h3 className="text-sm font-bold text-slate-800">Backup & Pemulihan</h3>
            <p className="text-[10px] text-slate-400">Simpan atau migrasi data penjualan lokal kamu.</p>
          </div>
        </div>

        {importSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Restore data sukses! Seluruh data diperbarui.</span>
          </div>
        )}

        {importError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Restore gagal: {importError}</span>
          </div>
        )}

        <div className="space-y-3">
          {/* Export button */}
          <button
            type="button"
            onClick={handleBackup}
            className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Ekspor Backup (.JSON)
          </button>

          {/* Import area container */}
          <div className="relative">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-4 bg-orange-50 hover:bg-orange-100/70 text-[#F58220] font-bold border border-orange-200/50 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4 text-[#F58220]" />
              Impor / Restore Backup
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleRestore}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>

        {/* Warning info */}
        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] text-slate-500 space-y-1">
          <p className="font-bold text-slate-700 flex items-center gap-0.5">
            <Sparkles className="w-3 h-3 text-[#F58220]" /> Perhatian:
          </p>
          <p>
            Impor data akan menimpa seluruh daftar lead saat ini secara instan. Harap ekspor backup terlebih dahulu jika ragu.
          </p>
        </div>
        <div className="text-[10px] text-slate-400 text-center pt-4">
           v1.0.0 beta build for The Achiever
        </div>
      </div>

      {/* Supabase Sync Panel */}
      {false && (
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4 h-fit">
        
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Database className="w-5 h-5 text-[#F58220]" />
          <div>
            <h3 className="text-sm font-bold text-slate-800">Integrasi Database Supabase</h3>
            <p className="text-[10px] text-slate-400">Hubungkan & sinkronisasikan data asisten ke Supabase.</p>
          </div>
        </div>

        {/* Connection status badge */}
        <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
          isSupabaseConnected 
            ? 'bg-cyan-50 border-cyan-200 text-cyan-800' 
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          <CloudLightning className={`w-4 h-4 shrink-0 ${isSupabaseConnected ? 'text-cyan-600 animate-pulse' : 'text-amber-600'}`} />
          <div className="text-xs">
            <span className="font-bold">Status Koneksi:</span>{' '}
            <span className="font-black underline uppercase">
              {isSupabaseConnected ? 'Tersambung (Online)' : 'Lokal / Offline'}
            </span>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {isSupabaseConnected 
                ? 'Seluruh penambahan dan perubahan data akan disimpan langsung ke database cloud.' 
                : 'Menyimpan ke memori browser lokal. Hubungkan ke Supabase dengan memasukkan detail credentials di bawah ini.'}
            </p>
          </div>
        </div>

        {/* Credentials Form */}
        <div className="p-4 bg-slate-50 rounded-xl space-y-3 border border-slate-100">
          <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Kredensial Koneksi Supabase</h4>
          
          <div>
            <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Supabase URL</label>
            <input
              type="text"
              placeholder="https://xxxxxx.supabase.co"
              value={dbUrl}
              onChange={(e) => setDbUrl(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#F58220]"
            />
          </div>

          <div>
            <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Supabase Anon Key</label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsIn..."
              value={dbKey}
              onChange={(e) => setDbKey(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#F58220]"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => onUpdateSupabaseCredentials(dbUrl.trim(), dbKey.trim())}
              disabled={isSyncing}
              className="flex-1 py-2 px-3 bg-[#F58220] hover:bg-[#E07210] disabled:opacity-50 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all text-center cursor-pointer"
            >
              Simpan & Hubungkan
            </button>
            {(localStorage.getItem('oxygen_supabase_url') || localStorage.getItem('oxygen_supabase_anon_key')) && (
              <button
                type="button"
                onClick={() => {
                  setDbUrl('');
                  setDbKey('');
                  onUpdateSupabaseCredentials('', '');
                }}
                disabled={isSyncing}
                className="py-2 px-3 bg-red-100 hover:bg-red-200 text-red-600 disabled:opacity-50 font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all text-center cursor-pointer"
              >
                Putuskan
              </button>
            )}
          </div>
        </div>

        {/* Sync buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            disabled={isSyncing}
            onClick={onSyncToSupabase}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Unggah Data Lokal ke Supabase
          </button>

          <button
            type="button"
            disabled={isSyncing}
            onClick={onFetchFromSupabase}
            className="w-full py-2.5 px-4 bg-orange-50 hover:bg-orange-100/70 text-[#F58220] font-bold border border-orange-200/50 rounded-xl text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Database className="w-4 h-4" />
            Ambil Data Terbaru dari Supabase
          </button>
        </div>

        {/* Toggle Schema SQL */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowSql(!showSql)}
            className="w-full py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg border border-slate-200/60 transition-all flex items-center justify-between gap-1 cursor-pointer"
          >
            <span className="flex items-center gap-1">
              <Code2 className="w-3.5 h-3.5 text-[#F58220]" />
              {showSql ? 'Sembunyikan SQL Schema' : 'Tampilkan SQL Schema Supabase'}
            </span>
            <span className="text-[10px] font-normal">{showSql ? '▼' : '▶'}</span>
          </button>

          {showSql && (
            <div className="mt-2.5 p-3 bg-zinc-900 border border-zinc-800 rounded-xl font-mono text-[9px] text-zinc-300 overflow-x-auto max-h-[220px] scrollbar-thin">
              <div className="flex justify-between items-center pb-2 mb-2 border-b border-zinc-800">
                <span className="text-zinc-500 text-[8px] uppercase">SQL Query Editor</span>
                <span className="text-[#F58220] text-[8px]">Copy & Run di Supabase</span>
              </div>
              <pre className="whitespace-pre">{`-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  code TEXT UNIQUE,
  role TEXT,
  created_at TEXT
);

-- 2. Create Config Table
CREATE TABLE IF NOT EXISTS config (
  id TEXT PRIMARY KEY,
  "salesName" TEXT,
  "monthlyTarget" INTEGER,
  "reminderMode" TEXT,
  "reminderThinkingDays" INTEGER,
  "reminderNBPDays" INTEGER,
  theme TEXT,
  "reminderPattern" TEXT
);

-- 3. Create Leads Table
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  whatsapp TEXT,
  address TEXT,
  area TEXT,
  source TEXT,
  "packageInterest" TEXT,
  notes TEXT,
  pipeline TEXT,
  status TEXT,
  "nextReminderDate" TEXT,
  "lastFollowUpDate" TEXT,
  "followUpCount" INTEGER DEFAULT 0,
  "customerStatus" TEXT,
  "closingDate" TEXT,
  "subscriptionPeriod" TEXT,
  "customerId" TEXT,
  "closingStatus" TEXT,
  history JSONB DEFAULT '[]'::jsonb,
  "createdAt" TEXT
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies for Public Access (Using Anon Key)
-- Users Policies
DROP POLICY IF EXISTS "Public Select Users" ON users;
CREATE POLICY "Public Select Users" ON users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Insert Users" ON users;
CREATE POLICY "Public Insert Users" ON users FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Update Users" ON users;
CREATE POLICY "Public Update Users" ON users FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public Delete Users" ON users;
CREATE POLICY "Public Delete Users" ON users FOR DELETE USING (true);

-- Config Policies
DROP POLICY IF EXISTS "Public Select Config" ON config;
CREATE POLICY "Public Select Config" ON config FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Insert Config" ON config;
CREATE POLICY "Public Insert Config" ON config FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Update Config" ON config;
CREATE POLICY "Public Update Config" ON config FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public Delete Config" ON config;
CREATE POLICY "Public Delete Config" ON config FOR DELETE USING (true);

-- Leads Policies
DROP POLICY IF EXISTS "Public Select Leads" ON leads;
CREATE POLICY "Public Select Leads" ON leads FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Insert Leads" ON leads;
CREATE POLICY "Public Insert Leads" ON leads FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Update Leads" ON leads;
CREATE POLICY "Public Update Leads" ON leads FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public Delete Leads" ON leads;
CREATE POLICY "Public Delete Leads" ON leads FOR DELETE USING (true);

-- 6. Insert Default Admin & Sales Assistant Users
INSERT INTO users (id, name, code, role, created_at)
VALUES 
  ('admin-001', 'Super Admin', '1admosass', 'admin', NOW()::text),
  ('sales-001', 'Sales Assistant', '123456', 'user', NOW()::text)
ON CONFLICT (id) DO NOTHING;`}</pre>
            </div>
          )}
        </div>
      </div>
      )}

    </div>
  );
}
