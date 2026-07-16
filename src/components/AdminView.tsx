/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserPlus, Trash2, Key, Users, ArrowLeft, ShieldCheck, Edit2, Check, X, AlertTriangle, Database, Copy, CheckSquare } from 'lucide-react';
import { User } from '../types';
import { DeleteUserModal } from './DeleteUserModal';

interface AdminViewProps {
  users: User[];
  onAddUser: (name: string, code: string) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  onBack: () => void;
  isSupabaseConnected?: boolean;
  supabaseError?: string | null;
}

export const AdminView: React.FC<AdminViewProps> = ({ 
  users, 
  onAddUser, 
  onDeleteUser, 
  onUpdateUser,
  isSupabaseConnected = false,
  supabaseError = null
}) => {
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showSqlSetup, setShowSqlSetup] = useState(false);
  const [copied, setCopied] = useState(false);

  const sqlScript = `-- 1. Create Users Table
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

-- 3b. Create Daily Overrides Table (for Manual GP, PAID, SA, Refund)
CREATE TABLE IF NOT EXISTS daily_overrides (
  id TEXT PRIMARY KEY, -- date string in YYYY-MM-DD format
  gp INTEGER DEFAULT 0,
  paid INTEGER DEFAULT 0,
  sa INTEGER DEFAULT 0,
  refund INTEGER DEFAULT 0,
  "createdAt" TEXT
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_overrides ENABLE ROW LEVEL SECURITY;

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

-- Daily Overrides Policies
DROP POLICY IF EXISTS "Public Select Daily Overrides" ON daily_overrides;
CREATE POLICY "Public Select Daily Overrides" ON daily_overrides FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Insert Daily Overrides" ON daily_overrides;
CREATE POLICY "Public Insert Daily Overrides" ON daily_overrides FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Update Daily Overrides" ON daily_overrides;
CREATE POLICY "Public Update Daily Overrides" ON daily_overrides FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public Delete Daily Overrides" ON daily_overrides;
CREATE POLICY "Public Delete Daily Overrides" ON daily_overrides FOR DELETE USING (true);

-- 6. Insert Default Admin & Sales Assistant Users
INSERT INTO users (id, name, code, role, created_at)
VALUES 
  ('admin-001', 'Super Admin', '1admosass', 'admin', NOW()::text),
  ('sales-001', 'Sales Assistant', '123456', 'user', NOW()::text)
ON CONFLICT (id) DO NOTHING;`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim() && newCode.trim()) {
      onAddUser(newName.trim(), newCode.trim());
      setNewName('');
      setNewCode('');
    }
  };

  const startEditing = (user: User) => {
    setEditingUserId(user.id);
    setEditName(user.name);
    setEditCode(user.code);
  };

  const cancelEditing = () => {
    setEditingUserId(null);
  };

  const handleSaveEdit = (userId: string) => {
    if (editName.trim() && editCode.trim()) {
      onUpdateUser(userId, { name: editName.trim(), code: editCode.trim() });
      setEditingUserId(null);
    }
  };

  const confirmDelete = (user: User) => {
    setUserToDelete(user);
  };

  return (
    <div className="max-w-4xl mx-auto py-4">
      {userToDelete && (
        <DeleteUserModal
          user={userToDelete}
          isOpen={!!userToDelete}
          onClose={() => setUserToDelete(null)}
          onConfirm={() => {
            onDeleteUser(userToDelete.id);
            setUserToDelete(null);
          }}
        />
      )}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-orange-500" />
            Personnel Management
          </h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Oxygen WiFi Internal Access Control</p>
        </div>
        
        {/* Connection Status Indicator for Admin */}
        <div className={`self-start md:self-auto border px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
          isSupabaseConnected 
            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' 
            : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
        }`}>
          <Database className={`w-4 h-4 ${isSupabaseConnected ? 'text-cyan-400 animate-pulse' : 'text-amber-500'}`} />
          <span>Status Database: {isSupabaseConnected ? 'Terhubung (Supabase)' : 'Lokal (Offline)'}</span>
        </div>
      </header>

      {/* Supabase Error & SQL Script Assistant Banner */}
      {!isSupabaseConnected && (
        <div className="mb-8 p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-500">Database Belum Terhubung Sempurna</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Supabase terdeteksi, namun beberapa tabel atau kebijakan keamanan (RLS) di Supabase belum dikonfigurasi dengan benar.
                Ini menyebabkan data user yang Anda daftarkan mungkin hanya tersimpan di browser lokal dan tidak tersinkron ke database online Supabase.
              </p>
              {supabaseError && (
                <div className="mt-3 p-3 bg-black/40 border border-amber-500/10 rounded-xl font-mono text-[10px] text-amber-400 overflow-x-auto">
                  Error Detail: {supabaseError}
                </div>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setShowSqlSetup(!showSqlSetup)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all"
                >
                  {showSqlSetup ? 'Sembunyikan SQL Script' : 'Lihat / Salin SQL Script Setup'}
                </button>
              </div>
            </div>
          </div>

          {showSqlSetup && (
            <div className="mt-4 p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
              <div className="flex justify-between items-center pb-2.5 mb-2.5 border-b border-zinc-800">
                <span className="text-[10px] font-bold uppercase text-zinc-500">SQL QUERY EDITOR FOR SUPABASE</span>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-[10px] font-bold transition-all"
                >
                  {copied ? (
                    <>
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Query SQL</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-zinc-400 mb-3 leading-relaxed">
                Buka tab <strong className="text-orange-500">SQL Editor</strong> di dashboard Supabase Anda, buat query baru, paste query di bawah ini, lalu jalankan (klik <strong className="text-orange-500">Run</strong>).
              </p>
              <pre className="p-3 bg-black/50 rounded-lg text-[9px] font-mono text-zinc-300 overflow-x-auto max-h-[300px] scrollbar-thin whitespace-pre">
                {sqlScript}
              </pre>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Add User Form */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-zinc-900/50 p-7 rounded-[2rem] border border-slate-100 dark:border-zinc-800">
            <h2 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-orange-500" />
              Register
            </h2>
            <form onSubmit={handleAdd} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <input
                  type="text"
                  placeholder="Sales Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all text-xs font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Access Code</label>
                <input
                  type="text"
                  placeholder="Unique Code"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all text-xs font-mono tracking-wider"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg shadow-orange-500/10"
              >
                Create Account
              </button>
            </form>
          </div>
        </div>

        {/* User List */}
        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-zinc-900/50 rounded-[2rem] border border-slate-100 dark:border-zinc-800 overflow-hidden">
            <div className="px-7 py-5 border-b border-slate-50 dark:border-zinc-800 flex justify-between items-center">
              <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" />
                Active Personnel
              </h2>
              <span className="text-[10px] font-bold text-slate-400">{users.length} Total</span>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-zinc-800">
              {users.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                  No personnel registered.
                </div>
              ) : (
                users.map((user) => (
                  <motion.div 
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-7 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors group"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 ${user.role === 'admin' ? 'bg-orange-50 text-orange-500 dark:bg-orange-500/10' : 'bg-slate-50 text-slate-400 dark:bg-zinc-800'}`}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      
                      {editingUserId === user.id ? (
                        <div className="flex-1 flex flex-col gap-2">
                          <input 
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="text-xs font-black uppercase tracking-tight bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 px-2 py-1 rounded"
                            placeholder="User Name"
                          />
                          <input 
                            type="text"
                            value={editCode}
                            onChange={(e) => setEditCode(e.target.value)}
                            className="text-[10px] font-mono tracking-widest bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 px-2 py-1 rounded"
                            placeholder="Access Code"
                          />
                        </div>
                      ) : (
                        <div className="min-w-0">
                          <div className="text-xs font-black flex items-center gap-2 uppercase tracking-tight truncate">
                            {user.name}
                            {user.role === 'admin' && (
                              <div className="px-1.5 py-0.5 bg-orange-500 text-white rounded text-[7px] font-black uppercase tracking-tighter shrink-0">
                                Master
                              </div>
                            )}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Key className="w-3 h-3 text-slate-300" />
                            <span className="font-mono tracking-widest">{user.code}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {editingUserId === user.id ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(user.id)}
                            className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all"
                            title="Simpan"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
                            title="Batal"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditing(user)}
                            className="p-2.5 text-slate-200 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                            title="Edit User"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {user.role !== 'admin' && (
                            <button
                              onClick={() => confirmDelete(user)}
                              className="p-2.5 text-slate-200 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                              title="Hapus User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
