import React, { useState } from 'react';
import { X, Trash2 } from 'lucide-react';

interface DeleteUserModalProps {
  user: { id: string; name: string };
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({ user, isOpen, onClose, onConfirm }) => {
  const [confirmationName, setConfirmationName] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (confirmationName === user.name) {
      onConfirm();
      setConfirmationName('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-sm w-full border border-slate-100 dark:border-zinc-800 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-red-500" />
            Konfirmasi Hapus
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6">
          Apakah Anda yakin ingin menghapus user <strong>{user.name}</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>

        <div className="space-y-1.5 mb-6">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ketik nama user untuk mengonfirmasi:</label>
          <input
            type="text"
            value={confirmationName}
            onChange={(e) => setConfirmationName(e.target.value)}
            placeholder={user.name}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-all text-xs font-bold"
          />
        </div>

        <button
          onClick={handleConfirm}
          disabled={confirmationName !== user.name}
          className="w-full py-3.5 bg-red-500 hover:bg-red-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-red-500/20"
        >
          Hapus User
        </button>
      </div>
    </div>
  );
};
