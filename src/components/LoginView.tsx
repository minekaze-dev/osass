/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  AlertCircle, ChevronRight, Sun, Moon, Eye, EyeOff, Database, Key, Check, Link2, X
} from 'lucide-react';

interface LoginViewProps {
  onLogin: (code: string) => void;
  error?: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  isLoading?: boolean;
  onUpdateSupabaseCredentials?: (url: string, key: string) => void;
  isSupabaseConnected?: boolean;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

export const LoginView: React.FC<LoginViewProps> = ({ 
  onLogin, 
  error, 
  theme, 
  onToggleTheme, 
  isLoading = false,
  onUpdateSupabaseCredentials,
  isSupabaseConnected = false,
  supabaseUrl = '',
  supabaseAnonKey = ''
}) => {
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Database setup states
  const [showDbConfig, setShowDbConfig] = useState(false);
  const [dbUrl, setDbUrl] = useState(supabaseUrl || localStorage.getItem('oxygen_supabase_url') || '');
  const [dbKey, setDbKey] = useState(supabaseAnonKey || localStorage.getItem('oxygen_supabase_anon_key') || '');
  const [savedMsg, setSavedMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim() && !isLoading) {
      onLogin(code.trim());
    }
  };

  const handleSaveDb = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateSupabaseCredentials) {
      onUpdateSupabaseCredentials(dbUrl.trim(), dbKey.trim());
      setSavedMsg('Koneksi diperbarui!');
      setTimeout(() => setSavedMsg(''), 3000);
    }
  };

  const isDark = theme === 'dark';
  const logoUrl = isDark ? 'https://imgur.com/kg8i74Y.jpg' : 'https://imgur.com/Gek4pUr.jpg';

  const hasCredentialsSaved = !!(localStorage.getItem('oxygen_supabase_url') || localStorage.getItem('oxygen_supabase_anon_key'));

  return (
    <div className={`fixed inset-0 flex flex-col items-center justify-center p-6 transition-colors duration-500 overflow-y-auto ${isDark ? 'bg-[#0b0b0c] text-zinc-100' : 'bg-[#fafafa] text-slate-900'}`}>
      {/* Theme Toggle - Minimalist top corner */}
      <div className="absolute top-8 right-8 flex items-center gap-3">
        {onUpdateSupabaseCredentials && (
          <button 
            onClick={() => setShowDbConfig(!showDbConfig)}
            className={`p-2 rounded-xl transition-all active:scale-95 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${
              isSupabaseConnected 
                ? 'bg-cyan-500/10 text-cyan-400' 
                : showDbConfig ? 'bg-orange-500/10 text-orange-500' : isDark ? 'bg-zinc-900 text-zinc-500' : 'bg-white text-slate-400 border border-slate-100'
            }`}
          >
            <Database className="w-4 h-4" />
            <span className="hidden md:inline">{isSupabaseConnected ? 'Connected' : 'Database Setup'}</span>
          </button>
        )}
        <button 
          onClick={onToggleTheme}
          className={`p-2 rounded-xl transition-all active:scale-95 ${isDark ? 'bg-zinc-900 text-zinc-500 hover:text-orange-500' : 'bg-white text-slate-400 hover:text-orange-500 border border-slate-100'}`}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[280px] flex flex-col items-center"
      >
        {/* Extreme Large Centered Logo */}
        <div className="mb-2">
          <img 
            src={logoUrl} 
            alt="Oxygen Logo" 
            className="h-32 md:h-40 w-auto object-contain transition-all duration-500" 
          />
        </div>

        {/* Small, Elegant Login Panel - Sharp Corners */}
        <div className={`w-full p-5 rounded-lg transition-all duration-500 ${isDark ? 'bg-zinc-900/40 border border-zinc-800' : 'bg-white border border-slate-100 shadow-sm'}`}>
          
          {showDbConfig ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2 mb-2 border-zinc-800">
                <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                  Koneksi Database
                </span>
                <button onClick={() => setShowDbConfig(false)} className="text-slate-400 hover:text-slate-200">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveDb} className="space-y-3.5">
                <div>
                  <label className="block text-[8px] font-black uppercase text-slate-500 tracking-wider mb-1">SUPABASE URL</label>
                  <input
                    type="text"
                    required
                    placeholder="https://xxxxx.supabase.co"
                    value={dbUrl}
                    onChange={(e) => setDbUrl(e.target.value)}
                    className={`w-full px-3 py-2 rounded-md text-xs font-mono focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-all ${
                      isDark ? 'bg-zinc-950 border border-zinc-800 text-zinc-200' : 'bg-slate-50 border border-slate-100 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[8px] font-black uppercase text-slate-500 tracking-wider mb-1">SUPABASE ANON KEY</label>
                  <input
                    type="password"
                    required
                    placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                    value={dbKey}
                    onChange={(e) => setDbKey(e.target.value)}
                    className={`w-full px-3 py-2 rounded-md text-xs font-mono focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-all ${
                      isDark ? 'bg-zinc-950 border border-zinc-800 text-zinc-200' : 'bg-slate-50 border border-slate-100 text-slate-800'
                    }`}
                  />
                </div>

                {savedMsg && (
                  <div className="text-[9px] font-bold text-emerald-500 text-center flex items-center justify-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>{savedMsg}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md font-bold text-[9px] uppercase tracking-wider transition-all"
                  >
                    Simpan & Tes
                  </button>
                  {hasCredentialsSaved && (
                    <button
                      type="button"
                      onClick={() => {
                        setDbUrl('');
                        setDbKey('');
                        if (onUpdateSupabaseCredentials) {
                          onUpdateSupabaseCredentials('', '');
                        }
                        setSavedMsg('Koneksi dihapus (Offline)');
                        setTimeout(() => setSavedMsg(''), 3000);
                      }}
                      className="py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-md font-bold text-[9px] uppercase tracking-wider transition-all"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </form>
              
              <div className="pt-2 text-center">
                <button 
                  onClick={() => setShowDbConfig(false)} 
                  className="text-[9px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200"
                >
                  &larr; Kembali Ke Login
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="text-[10px] font-black tracking-[0.2em] uppercase">Security Access</h2>
                <div className={`h-[1px] w-8 mx-auto mt-2 ${isDark ? 'bg-zinc-800' : 'bg-slate-100'}`} />
                {isSupabaseConnected ? (
                  <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 rounded text-[7px] font-bold uppercase tracking-widest">
                    <span className="w-1 h-1 bg-cyan-400 rounded-full animate-ping" />
                    Online Cloud
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded text-[7px] font-bold uppercase tracking-widest">
                    Lokal (Offline)
                  </span>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Access Code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    disabled={isLoading}
                    className={`w-full px-4 py-2.5 rounded-md text-base font-mono tracking-[0.25em] text-center focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-all ${
                      isDark 
                        ? 'bg-zinc-950 border border-zinc-800 text-zinc-200 placeholder:text-zinc-800' 
                        : 'bg-slate-50 border border-slate-100 text-slate-800 placeholder:text-slate-200'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-zinc-800 hover:text-zinc-600' : 'text-slate-200 hover:text-slate-400'} ${isLoading ? 'opacity-30 cursor-not-allowed' : ''}`}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-1 text-[9px] font-bold text-red-500 text-center leading-normal"
                  >
                    <div className="flex items-center gap-1.5 justify-center">
                      <AlertCircle className="w-3 h-3" />
                      <span>Verifikasi Gagal</span>
                    </div>
                    <p className="text-[8px] text-red-400/85 px-1">{error}</p>
                    
                    {!isSupabaseConnected && !hasCredentialsSaved && (
                      <button
                        type="button"
                        onClick={() => setShowDbConfig(true)}
                        className="mt-1 text-[8px] uppercase tracking-wider text-orange-500 hover:underline font-black"
                      >
                        Hubungkan database Supabase Anda &rarr;
                      </button>
                    )}
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-md font-bold text-[9px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all active:scale-95 ${
                    isLoading ? 'opacity-70 cursor-not-allowed bg-orange-600/80' : ''
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Authorize</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <p className={`mt-10 text-[8px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-zinc-800' : 'text-slate-200'}`}>
          Secure Protocol &bull; OSASS v1.0.0 beta
        </p>
      </motion.div>
    </div>
  );
};

