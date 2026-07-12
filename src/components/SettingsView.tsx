/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Settings, User, Target, Clock, ShieldAlert, 
  Download, Upload, Check, AlertCircle, Sparkles, Moon, Sun 
} from 'lucide-react';
import { SalesConfig, Lead } from '../types';

interface SettingsViewProps {
  config: SalesConfig;
  onUpdateConfig: (newConfig: SalesConfig) => void;
  allLeads: Lead[];
  onImportLeads: (importedLeads: Lead[]) => void;
}

export default function SettingsView({ config, onUpdateConfig, allLeads, onImportLeads }: SettingsViewProps) {
  const [monthlyTarget, setMonthlyTarget] = useState(config.monthlyTarget);
  const [reminderMode, setReminderMode] = useState<'auto' | 'manual'>(config.reminderMode || 'auto');
  const [reminderThinkingDays, setReminderThinkingDays] = useState(config.reminderThinkingDays);
  const [reminderNBPDays, setReminderNBPDays] = useState(config.reminderNBPDays);
  const [reminderPattern, setReminderPattern] = useState(config.reminderPattern || '1,2,4,7');
  const [theme, setTheme] = useState<'light' | 'dark'>(config.theme || 'light');
  
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
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
      </div>

    </div>
  );
}
