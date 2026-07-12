/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserPlus, Trash2, Key, Users, ArrowLeft, ShieldCheck, Edit2, Check, X } from 'lucide-react';
import { User } from '../types';
import { DeleteUserModal } from './DeleteUserModal';

interface AdminViewProps {
  users: User[];
  onAddUser: (name: string, code: string) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  onBack: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ users, onAddUser, onDeleteUser, onUpdateUser }) => {
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

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
      <header className="mb-10">
        <h1 className="text-xl font-black tracking-tight flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-orange-500" />
          Personnel Management
        </h1>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Oxygen WiFi Internal Access Control</p>
      </header>

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
