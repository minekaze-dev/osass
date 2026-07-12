/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  AlertCircle, ChevronRight, Sun, Moon, Eye, EyeOff
} from 'lucide-react';

interface LoginViewProps {
  onLogin: (code: string) => void;
  error?: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, error, theme, onToggleTheme }) => {
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      onLogin(code.trim());
    }
  };

  const isDark = theme === 'dark';
  const logoUrl = isDark ? 'https://imgur.com/kg8i74Y.jpg' : 'https://imgur.com/Gek4pUr.jpg';

  return (
    <div className={`fixed inset-0 flex flex-col items-center justify-center p-6 transition-colors duration-500 ${isDark ? 'bg-[#0b0b0c] text-zinc-100' : 'bg-[#fafafa] text-slate-900'}`}>
      {/* Theme Toggle - Minimalist top corner */}
      <div className="absolute top-8 right-8">
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
        className="w-full max-w-[240px] flex flex-col items-center"
      >
        {/* Extreme Large Centered Logo */}
        <div className="mb-2">
          <img 
            src={logoUrl} 
            alt="Oxygen Logo" 
            className="h-44 md:h-56 w-auto object-contain transition-all duration-500" 
          />
        </div>

        {/* Small, Elegant Login Panel - Sharp Corners */}
        <div className={`w-full p-5 rounded-lg transition-all duration-500 ${isDark ? 'bg-zinc-900/40 border border-zinc-800' : 'bg-white border border-slate-100 shadow-sm'}`}>
          <div className="text-center mb-6">
            <h2 className="text-[10px] font-black tracking-[0.2em] uppercase">Security Access</h2>
            <div className={`h-[1px] w-8 mx-auto mt-2 ${isDark ? 'bg-zinc-800' : 'bg-slate-100'}`} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Access Code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-md text-base font-mono tracking-[0.25em] text-center focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-all ${
                  isDark 
                    ? 'bg-zinc-950 border border-zinc-800 text-zinc-200 placeholder:text-zinc-800' 
                    : 'bg-slate-50 border border-slate-100 text-slate-800 placeholder:text-slate-200'
                }`}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-zinc-800 hover:text-zinc-600' : 'text-slate-200 hover:text-slate-400'}`}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-1.5 text-[9px] font-bold text-red-500 justify-center"
              >
                <AlertCircle className="w-3 h-3" />
                <span>{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-md font-bold text-[9px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <span>Authorize</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        <p className={`mt-10 text-[8px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-zinc-800' : 'text-slate-200'}`}>
          Secure Protocol &bull; OSASS v1.0.0 beta
        </p>
      </motion.div>
    </div>
  );
};

