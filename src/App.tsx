/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, UserPlus, Phone, Bell, TrendingUp, Settings, 
  Plus, LogOut, CheckCircle2, Moon, Sun, ShieldCheck, Award 
} from 'lucide-react';
import { Lead, SalesConfig, FollowUpStatus, PipelineStage, HistoryEntry, CustomerStatus, User, AuthState } from './types';
import { INITIAL_SALES_CONFIG } from './mockData';
import { supabase } from './lib/supabase';

// Views
import DashboardView from './components/DashboardView';
import LeadView from './components/LeadView';
import ProspekView from './components/ProspekView';
import CustomerView from './components/CustomerView';
import ReminderView from './components/ReminderView';
import RevenueView from './components/RevenueView';
import SettingsView from './components/SettingsView';
import { LoginView } from './components/LoginView';
import { AdminView } from './components/AdminView';

// Modals
import LeadDetailModal from './components/LeadDetailModal';
import UpdateStatusModal from './components/UpdateStatusModal';
import LeadFormModal from './components/LeadFormModal';

type TabType = 'dashboard' | 'lead' | 'prospek' | 'customer' | 'reminder' | 'revenue' | 'settings' | 'admin';

const DEFAULT_ADMIN: User = {
  id: 'admin-001',
  name: 'Super Admin',
  code: '1admosass',
  role: 'admin',
  createdAt: new Date().toISOString()
};

const DEFAULT_SALES: User = {
  id: 'sales-001',
  name: 'Sales Assistant',
  code: '123456',
  role: 'user',
  createdAt: new Date().toISOString()
};

export default function App() {
  // Auth State
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('oxygen_users');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Update admin code if it's the old one
      const adminIndex = parsed.findIndex((u: User) => u.id === 'admin-001');
      if (adminIndex !== -1 && parsed[adminIndex].code === 'admin123') {
        parsed[adminIndex].code = '1admosass';
        localStorage.setItem('oxygen_users', JSON.stringify(parsed));
      }
      return parsed;
    }
    return [DEFAULT_ADMIN, DEFAULT_SALES];
  });
  
  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = localStorage.getItem('oxygen_auth');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed;
    }
    return { user: null, isAuthenticated: false };
  });
  
  const [loginError, setLoginError] = useState('');

  // State
  const [leads, setLeads] = useState<Lead[]>([]);

  // Data Filtering (Isolation)
  // Derive current user name from users list to reflect admin changes immediately
  const currentUserRecord = users.find(u => u.id === auth.user?.id);
  const currentUserName = currentUserRecord ? currentUserRecord.name : (auth.user?.name || '');

  const filteredLeads = useMemo(() => {
    if (!auth.user) return [];
    // Strict isolation: users only see their own data
    return leads.filter(l => l.userId === auth.user?.id);
  }, [leads, auth.user]);

  const [config, setConfig] = useState<SalesConfig>(INITIAL_SALES_CONFIG);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  
  // Modals visibility state
  const [viewLead, setViewLead] = useState<Lead | null>(null);
  const [updateLead, setUpdateLead] = useState<Lead | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [isHistoryOnly, setIsHistoryOnly] = useState(false);

  // Notification badge state & logic for follow up / overdue reminders
  const [lastSeenReminderCount, setLastSeenReminderCount] = useState<number>(() => {
    const saved = localStorage.getItem('oxygen_last_seen_reminder_count');
    return saved ? parseInt(saved, 10) : 0;
  });

  const TODAY_STR = '2026-07-10';

  const dueLeadsCount = useMemo(() => {
    const actionable = filteredLeads.filter(
      l => l.pipeline !== 'Aktif' && 
           !['Not Interested', 'Not Coverage', 'Invalid Number'].includes(l.status)
    );
    const dueOrOverdue = actionable.filter(
      l => l.nextReminderDate !== null && l.nextReminderDate <= TODAY_STR
    );
    return dueOrOverdue.length;
  }, [filteredLeads, TODAY_STR]);

  const reminderBadgeCount = useMemo(() => {
    if (activeTab === 'reminder') return 0;
    const diff = dueLeadsCount - lastSeenReminderCount;
    return diff > 0 ? diff : 0;
  }, [activeTab, dueLeadsCount, lastSeenReminderCount]);

  useEffect(() => {
    if (activeTab === 'reminder') {
      setLastSeenReminderCount(dueLeadsCount);
      localStorage.setItem('oxygen_last_seen_reminder_count', dueLeadsCount.toString());
    }
  }, [activeTab, dueLeadsCount]);

  // Initialize data from localStorage or mockData
  useEffect(() => {
    const storedLeads = localStorage.getItem('oxygen_leads');
    const storedConfig = localStorage.getItem('oxygen_config');

    if (storedLeads) {
      try {
        const parsed = JSON.parse(storedLeads) as Lead[];
        const formatted = parsed.map(l => ({ ...l, name: (l.name || 'TANPA NAMA').toUpperCase() }));
        setLeads(formatted);
      } catch (e) {
        setLeads([]);
      }
    } else {
      setLeads([]);
    }

    if (storedConfig) {
      try {
        setConfig(JSON.parse(storedConfig));
      } catch (e) {
        setConfig(INITIAL_SALES_CONFIG);
      }
    } else {
      setConfig(INITIAL_SALES_CONFIG);
      localStorage.setItem('oxygen_config', JSON.stringify(INITIAL_SALES_CONFIG));
    }
  }, []);

  // Sync theme with document class list
  useEffect(() => {
    if (config.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [config.theme]);

  // Save Leads to LocalStorage whenever updated
  const saveLeads = (updatedLeads: Lead[]) => {
    const formatted = updatedLeads.map(l => ({
      ...l,
      name: (l.name && l.name.trim() !== '' && l.name !== 'TANPA NAMA' ? l.name : '-').toUpperCase(),
      address: l.address && l.address.trim() !== '' ? l.address : '-',
      area: l.area && l.area.trim() !== '' ? l.area : '-',
      packageInterest: l.packageInterest && l.packageInterest.trim() !== '' ? l.packageInterest : '-',
    }));
    setLeads(formatted);
    localStorage.setItem('oxygen_leads', JSON.stringify(formatted));
  };

  // Save Config to LocalStorage
  const handleUpdateConfig = (newConfig: SalesConfig) => {
    setConfig(newConfig);
    localStorage.setItem('oxygen_config', JSON.stringify(newConfig));
  };

  // Auth Handlers
  const handleLogin = (code: string) => {
    const user = users.find(u => u.code === code);
    if (user) {
      setAuth({ user, isAuthenticated: true });
      localStorage.setItem('oxygen_auth', JSON.stringify({ user, isAuthenticated: true }));
      setLoginError('');
      setActiveTab('dashboard');
    } else {
      setLoginError('Kode akses tidak valid');
    }
  };

  const handleLogout = () => {
    setAuth({ user: null, isAuthenticated: false });
    localStorage.removeItem('oxygen_auth');
    setActiveTab('dashboard');
  };

  // Admin Handlers
  const handleAddUser = (name: string, code: string) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      code,
      role: 'user',
      createdAt: new Date().toISOString()
    };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('oxygen_users', JSON.stringify(updatedUsers));
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Hapus user ini? Semua data terkait mungkin tidak terakses.')) {
      const updatedUsers = users.filter(u => u.id !== userId);
      setUsers(updatedUsers);
      localStorage.setItem('oxygen_users', JSON.stringify(updatedUsers));
    }
  };

  const handleUpdateUser = (userId: string, updates: Partial<User>) => {
    const updatedUsers = users.map(u => u.id === userId ? { ...u, ...updates } : u);
    setUsers(updatedUsers);
    localStorage.setItem('oxygen_users', JSON.stringify(updatedUsers));
  };

  // Handle Add Lead
  const handleAddLead = (newLeadData: Omit<Lead, 'id' | 'createdAt' | 'followUpCount' | 'history' | 'lastFollowUpDate' | 'userId'>) => {
    if (!auth.user) return;
    const todayStr = '2026-07-10'; // Anchor date
    const timeStr = '10:00';
    const newId = `lead-${Date.now()}`;
    
    const initialHistory: HistoryEntry = {
      id: `hist-${Date.now()}-init`,
      date: `${todayStr} ${timeStr}`,
      status: newLeadData.status || 'Interested',
      pipeline: newLeadData.pipeline || 'Lead Baru',
      notes: newLeadData.notes || 'Lead baru didaftarkan ke sistem.',
    };

    let finalName = (newLeadData.name || '-').toUpperCase();
    if (finalName === '-' || finalName === 'TANPA NAMA' || finalName.trim() === '') {
       const existingCount = filteredLeads.length + 1;
       finalName = `CST-${existingCount.toString().padStart(3, '0')}`;
    }

    const createdLead: Lead = {
      ...newLeadData,
      userId: auth.user.id,
      name: finalName,
      id: newId,
      createdAt: todayStr,
      followUpCount: 0,
      lastFollowUpDate: null,
      history: [initialHistory],
    };

    const updated = [createdLead, ...leads];
    saveLeads(updated);
  };

  // Handle Update Lead Status & Pipeline
  const handleUpdateLeadStatus = (
    leadId: string, 
    status: FollowUpStatus, 
    pipeline: PipelineStage, 
    notes: string, 
    nextReminder: string | null
  ) => {
    const todayStr = '2026-07-10'; // Anchor date
    const timeStr = '15:45'; // Simulate real action time
    
    const updated = leads.map(l => {
      if (l.id === leadId) {
        const newHistoryEntry: HistoryEntry = {
          id: `hist-${Date.now()}-upd`,
          date: `${todayStr} ${timeStr}`,
          status,
          pipeline,
          notes,
        };

        return {
          ...l,
          status,
          pipeline,
          nextReminderDate: nextReminder,
          lastFollowUpDate: todayStr,
          followUpCount: l.followUpCount + 1,
          history: [newHistoryEntry, ...l.history],
        };
      }
      return l;
    });

    saveLeads(updated);
    
    // Close update status modal
    setUpdateLead(null);
    // If we were viewing the detail modal, sync it up
    if (viewLead && viewLead.id === leadId) {
      const refreshedLead = updated.find(l => l.id === leadId);
      setViewLead(refreshedLead || null);
    }
  };

  // Handle Update Customer Data
  const handleUpdateCustomerData = (
    leadId: string, 
    customerStatus: CustomerStatus | null, 
    closingDate: string | null, 
    subscriptionPeriod: string | null,
    packageInterest?: string,
    customerId?: string
  ) => {
    const todayStr = '2026-07-10'; // Anchor date
    const timeStr = '15:45';
    
    const updated = leads.map(l => {
      if (l.id === leadId) {
        let pipeline = l.pipeline;
        if (customerStatus === 'Aktif') {
          pipeline = 'Aktif';
        } else if (customerStatus === 'Follow Up') {
          pipeline = 'Follow Up';
        }
        
        const newHistoryEntry = {
          id: `hist-${Date.now()}-cust`,
          date: `${todayStr} ${timeStr}`,
          status: l.status,
          pipeline,
          notes: `Update data customer: Status: ${customerStatus || 'Belum diatur'}, Closing: ${closingDate || 'Belum diatur'}, Kontrak: ${subscriptionPeriod || 'Belum diatur'}, ID: ${customerId || 'Belum diatur'}.`,
        };

        return {
          ...l,
          customerStatus,
          closingDate,
          subscriptionPeriod,
          pipeline,
          customerId: customerId || l.customerId,
          packageInterest: packageInterest || l.packageInterest,
          history: [newHistoryEntry, ...l.history],
        };
      }
      return l;
    });

    saveLeads(updated);
    
    // Sync active lead view if needed
    if (viewLead && viewLead.id === leadId) {
      const refreshedLead = updated.find(l => l.id === leadId);
      setViewLead(refreshedLead || null);
    }
  };

  // Handle Quick Closing Status Change
  const handleQuickClosing = (leadId: string, action: 'Not Closed' | 'On Process' | 'Closed') => {
    const todayStr = '2026-07-10';
    const timeStr = '15:45';
    
    const updated = leads.map(l => {
      if (l.id === leadId) {
        if (action === 'Closed') {
          const newHistoryEntry = {
            id: `hist-${Date.now()}-closing`,
            date: `${todayStr} ${timeStr}`,
            status: 'Interested' as FollowUpStatus,
            pipeline: 'Aktif' as PipelineStage,
            notes: 'Quick update: Customer closed (Aktif).',
          };
          return {
            ...l,
            pipeline: 'Aktif' as PipelineStage,
            status: 'Interested' as FollowUpStatus,
            customerStatus: 'Aktif' as CustomerStatus,
            closingDate: l.closingDate || todayStr, // preserve if exists, else today
            closingStatus: 'Closed' as const,
            history: [newHistoryEntry, ...l.history],
          };
        } else if (action === 'On Process') {
          const newHistoryEntry = {
            id: `hist-${Date.now()}-onprocess`,
            date: `${todayStr} ${timeStr}`,
            status: l.status,
            pipeline: 'Follow Up' as PipelineStage,
            notes: 'Quick update: Customer on process.',
          };
          return {
            ...l,
            closingDate: null,
            closingStatus: 'On Process' as const,
            history: [newHistoryEntry, ...l.history],
          };
        } else {
          const newHistoryEntry = {
            id: `hist-${Date.now()}-unclosing`,
            date: `${todayStr} ${timeStr}`,
            status: l.status,
            pipeline: 'Follow Up' as PipelineStage,
            notes: 'Quick update: Customer belum closing (-).',
          };
          return {
            ...l,
            pipeline: 'Follow Up' as PipelineStage,
            customerStatus: null,
            closingDate: null,
            closingStatus: 'Not Closed' as const,
            history: [newHistoryEntry, ...l.history],
          };
        }
      }
      return l;
    });
    saveLeads(updated);
  };

  // Handle Edit Lead Data
  const handleEditLead = (leadId: string, updatedData: Partial<Lead>) => {
    const dataToUpdate = { ...updatedData };
    if (dataToUpdate.name) {
      dataToUpdate.name = dataToUpdate.name.toUpperCase();
    }
    const updated = leads.map(l => {
      if (l.id === leadId) {
        return {
          ...l,
          ...dataToUpdate,
        };
      }
      return l;
    });
    saveLeads(updated);

    // Sync active lead view if needed
    if (viewLead && viewLead.id === leadId) {
      const refreshedLead = updated.find(l => l.id === leadId);
      setViewLead(refreshedLead || null);
    }
  };

  // Handle Quick Follow Up with checkmark
  const handleQuickFollowUp = (leadId: string) => {
    const todayStr = '2026-07-10'; // Anchor date
    const timeStr = '15:45';
    
    const updated = leads.map(l => {
      if (l.id === leadId) {
        const newHistoryEntry: HistoryEntry = {
          id: `hist-${Date.now()}-quick`,
          date: `${todayStr} ${timeStr}`,
          status: l.status,
          pipeline: l.pipeline,
          notes: 'Berhasil follow up.',
        };

        return {
          ...l,
          nextReminderDate: null, // Clear/complete reminder
          lastFollowUpDate: todayStr,
          followUpCount: l.followUpCount + 1,
          history: [newHistoryEntry, ...l.history],
        };
      }
      return l;
    });

    saveLeads(updated);

    // Sync active lead view if needed
    if (viewLead && viewLead.id === leadId) {
      const refreshedLead = updated.find(l => l.id === leadId);
      setViewLead(refreshedLead || null);
    }
  };

  // Import / Migration
  const handleImportLeads = (importedLeads: Lead[]) => {
    saveLeads(importedLeads);
  };

  // Render view depending on ActiveTab
  const renderTabContent = () => {
    if (!auth.isAuthenticated) {
      return null; // Should be handled by LoginView logic
    }

    // Admin Specific Dashboard
    if (auth.user?.role === 'admin') {
      return (
        <AdminView 
          users={users} 
          onAddUser={handleAddUser} 
          onDeleteUser={handleDeleteUser} 
          onUpdateUser={handleUpdateUser}
          onBack={() => {}} // No back button for admin as this is their only view
        />
      );
    }

    // User/Sales Specific Views
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView 
            leads={filteredLeads} 
            config={config} 
            userName={currentUserName}
            onViewLead={(lead, historyOnly) => { setIsHistoryOnly(historyOnly || false); setViewLead(lead); }} 
            onUpdateStatus={(lead) => setUpdateLead(lead)} 
            onQuickFollowUp={handleQuickFollowUp}
          />
        );
      case 'lead':
        return (
          <LeadView 
            leads={filteredLeads} 
            userName={currentUserName}
            onAddLead={handleAddLead} 
            onViewLead={(lead, historyOnly) => { setIsHistoryOnly(historyOnly || false); setViewLead(lead); }} 
            config={config}
          />
        );
      case 'prospek':
        return (
          <ProspekView 
            leads={filteredLeads} 
            userName={currentUserName}
            onViewLead={(lead, historyOnly) => { setIsHistoryOnly(historyOnly || false); setViewLead(lead); }} 
            onUpdateStatus={(lead) => setUpdateLead(lead)} 
            config={config}
          />
        );
      case 'customer':
        return (
          <CustomerView 
            leads={filteredLeads} 
            userName={currentUserName}
            onUpdateCustomerData={handleUpdateCustomerData} 
            onViewLead={(lead, historyOnly) => { setIsHistoryOnly(historyOnly || false); setViewLead(lead); }} 
            onQuickClosing={handleQuickClosing}
            config={config}
          />
        );
      case 'reminder':
        return (
          <ReminderView 
            leads={filteredLeads} 
            userName={currentUserName}
            onViewLead={(lead, historyOnly) => { setIsHistoryOnly(historyOnly || false); setViewLead(lead); }} 
            onUpdateStatus={(lead) => setUpdateLead(lead)} 
            config={config}
          />
        );
      case 'revenue':
        return (
          <RevenueView 
            leads={filteredLeads} 
            config={config} 
          />
        );
      case 'settings':
        return (
          <SettingsView 
            config={config} 
            onUpdateConfig={handleUpdateConfig} 
            allLeads={filteredLeads}
            onImportLeads={handleImportLeads}
          />
        );
      default:
        return null;
    }
  };

  if (!auth.isAuthenticated) {
    return (
      <LoginView 
        onLogin={handleLogin} 
        error={loginError} 
        theme={config.theme}
        onToggleTheme={() => handleUpdateConfig({ ...config, theme: config.theme === 'light' ? 'dark' : 'light' })}
      />
    );
  }

  const isAdmin = auth.user?.role === 'admin';

  return (
    <div className={`min-h-screen ${config.theme === 'dark' ? 'bg-[#0f0f11] text-zinc-100 dark' : 'bg-[#F8FAFC] text-slate-800'}`}>
      <div className={`flex w-full max-w-[1360px] mx-auto min-h-screen relative border-x shadow-sm transition-colors duration-200 ${
        config.theme === 'dark' ? 'bg-[#18181b] border-zinc-800 text-zinc-100' : 'bg-white border-slate-200/50 text-slate-800'
      }`}>
        
        {/* ================= DESKTOP SIDEBAR ================= */}
        <aside className={`hidden md:flex flex-col w-64 border-r p-5 shrink-0 justify-between h-screen sticky top-0 transition-colors duration-200 ${
          config.theme === 'dark' ? 'bg-[#18181b] border-zinc-800 text-zinc-100' : 'bg-white border-slate-200/80 text-slate-800'
        }`}>
          <div className="space-y-6">
            {/* Brand Logo */}
            <div className="mb-6 px-1">
              <img 
                src={config.theme === 'dark' ? 'https://imgur.com/wcB0Js9.jpg' : 'https://imgur.com/kAmrpLM.jpg'} 
                alt="Oxygen Logo" 
                className="h-20 w-auto object-contain"
              />
            </div>

            {/* Sidebar Navigation Options */}
            <nav className="space-y-1">
              {!isAdmin ? (
                <>
                  {/* Dashboard */}
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === 'dashboard' 
                        ? config.theme === 'dark' ? 'bg-zinc-800 text-[#F58220]' : 'bg-orange-50 text-[#F58220]' 
                        : config.theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Home className="w-4 h-4 shrink-0" />
                    <span>Dashboard</span>
                  </button>

                  {/* Lead */}
                  <button
                    onClick={() => setActiveTab('lead')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === 'lead' 
                        ? config.theme === 'dark' ? 'bg-zinc-800 text-[#F58220]' : 'bg-orange-50 text-[#F58220]' 
                        : config.theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <UserPlus className="w-4 h-4 shrink-0" />
                    <span>Lead</span>
                  </button>

                  {/* Prospek */}
                  <button
                    onClick={() => setActiveTab('prospek')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === 'prospek' 
                        ? config.theme === 'dark' ? 'bg-zinc-800 text-[#F58220]' : 'bg-orange-50 text-[#F58220]' 
                        : config.theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Phone className="w-4 h-4 shrink-0" />
                    <span>Prospek</span>
                  </button>

                  {/* Customer */}
                  <button
                    onClick={() => setActiveTab('customer')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === 'customer' 
                        ? config.theme === 'dark' ? 'bg-zinc-800 text-[#F58220]' : 'bg-orange-50 text-[#F58220]' 
                        : config.theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Award className="w-4 h-4 shrink-0" />
                    <span>Customer</span>
                  </button>

                  {/* Reminder */}
                  <button
                    onClick={() => setActiveTab('reminder')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === 'reminder' 
                        ? config.theme === 'dark' ? 'bg-zinc-800 text-[#F58220]' : 'bg-orange-50 text-[#F58220]' 
                        : config.theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Bell className="w-4 h-4 shrink-0" />
                      <span>Reminder</span>
                    </div>
                    {reminderBadgeCount > 0 && (
                      <span className="bg-[#F58220] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full scale-90 min-w-[18px] text-center shadow-xs">
                        {reminderBadgeCount}
                      </span>
                    )}
                  </button>

                  {/* Revenue */}
                  <button
                    onClick={() => setActiveTab('revenue')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === 'revenue' 
                        ? config.theme === 'dark' ? 'bg-zinc-800 text-[#F58220]' : 'bg-orange-50 text-[#F58220]' 
                        : config.theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 shrink-0" />
                    <span>Revenue</span>
                  </button>

                  {/* Settings */}
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === 'settings' 
                        ? config.theme === 'dark' ? 'bg-zinc-800 text-[#F58220]' : 'bg-orange-50 text-[#F58220]' 
                        : config.theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Settings className="w-4 h-4 shrink-0" />
                    <span>Settings</span>
                  </button>
                </>
              ) : (
                <button
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold bg-zinc-800 text-[#F58220] shadow-2xs cursor-default`}
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>User Management</span>
                </button>
              )}
            </nav>
          </div>

          {/* Footer of Sidebar */}
          <div className={`space-y-3 pt-4 border-t ${config.theme === 'dark' ? 'border-zinc-800' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2.5 px-1.5">
              <div className="w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center text-xs font-extrabold text-[#F58220]">
                {auth.user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-bold truncate ${config.theme === 'dark' ? 'text-zinc-200' : 'text-slate-800'}`}>{auth.user?.name}</p>
                <span className="text-[9px] text-slate-400 block truncate capitalize">{auth.user?.role} - WiFi Oxygen</span>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-all`}
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </button>
          </div>
        </aside>

        {/* ================= MAIN WRAPPER CONTAINER ================= */}
        <div className="flex-1 flex flex-col min-w-0 pb-24 md:pb-8">
          
          {/* Sticky Header */}
          <header className={`sticky top-0 z-30 px-5 py-3.5 flex justify-between items-center shadow-xs transition-colors duration-200 border-b ${
            config.theme === 'dark' ? 'bg-[#18181b]/95 border-zinc-800 text-zinc-100' : 'bg-white/95 border-slate-150/75 text-slate-800'
          }`}>
            <div className="flex items-center gap-2 md:hidden">
              <img 
                src={config.theme === 'dark' ? 'https://imgur.com/wcB0Js9.jpg' : 'https://imgur.com/kAmrpLM.jpg'} 
                alt="Oxygen Logo" 
                className="h-16 w-auto object-contain"
              />
            </div>
            
            <div className="hidden md:flex items-center gap-1">
              <span className="text-xs text-slate-400">Status:</span>
              <span className={`text-xs font-bold capitalize ${config.theme === 'dark' ? 'text-zinc-200' : 'text-slate-700'}`}>
                {isAdmin ? 'System Administrator' : activeTab}
              </span>
            </div>

            {/* Top Bar Quick Status Indicators */}
            <div className="flex items-center gap-2.5">
              <div className={`border px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 ${
                config.theme === 'dark' 
                  ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-100/50'
              }`}>
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                {isAdmin ? 'Master Control' : 'Asisten Aktif'}
              </div>
              
              <button 
                onClick={() => handleUpdateConfig({ ...config, theme: config.theme === 'dark' ? 'light' : 'dark' })}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  config.theme === 'dark' 
                    ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
              >
                {config.theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 p-4 md:p-6">
            {renderTabContent()}
          </main>
        </div>

        {/* ================= MOBILE BOTTOM NAVIGATION ================= */}
        {!isAdmin && (
          <nav className={`fixed bottom-0 left-0 right-0 px-2 py-1.5 z-40 flex justify-around md:hidden shadow-lg rounded-t-xl border-t transition-colors duration-200 ${
            config.theme === 'dark' ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-slate-200'
          }`}>
            {/* Dashboard */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center justify-center w-12 py-1 rounded-lg transition-colors ${
                activeTab === 'dashboard' ? 'text-[#F58220]' : config.theme === 'dark' ? 'text-zinc-500 hover:text-zinc-300' : 'text-slate-400'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[8px] font-bold mt-1">Dash</span>
            </button>

            <button
              onClick={() => setActiveTab('lead')}
              className={`flex flex-col items-center justify-center w-12 py-1 rounded-lg transition-colors ${
                activeTab === 'lead' ? 'text-[#F58220]' : config.theme === 'dark' ? 'text-zinc-500 hover:text-zinc-300' : 'text-slate-400'
              }`}
            >
              <UserPlus className="w-5 h-5" />
              <span className="text-[8px] font-bold mt-1">Lead</span>
            </button>

            <button
              onClick={() => setActiveTab('prospek')}
              className={`flex flex-col items-center justify-center w-12 py-1 rounded-lg transition-colors ${
                activeTab === 'prospek' ? 'text-[#F58220]' : config.theme === 'dark' ? 'text-zinc-500 hover:text-zinc-300' : 'text-slate-400'
              }`}
            >
              <Phone className="w-5 h-5" />
              <span className="text-[8px] font-bold mt-1">Pros</span>
            </button>

            <button
              onClick={() => setActiveTab('customer')}
              className={`flex flex-col items-center justify-center w-12 py-1 rounded-lg transition-colors ${
                activeTab === 'customer' ? 'text-[#F58220]' : config.theme === 'dark' ? 'text-zinc-500 hover:text-zinc-300' : 'text-slate-400'
              }`}
            >
              <Award className="w-5 h-5" />
              <span className="text-[8px] font-bold mt-1">Cust</span>
            </button>

            <button
              onClick={() => setActiveTab('reminder')}
              className={`flex flex-col items-center justify-center w-12 py-1 rounded-lg transition-colors relative ${
                activeTab === 'reminder' ? 'text-[#F58220]' : config.theme === 'dark' ? 'text-zinc-500 hover:text-zinc-300' : 'text-slate-400'
              }`}
            >
              <div className="relative">
                <Bell className="w-5 h-5" />
                {reminderBadgeCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 bg-[#F58220] text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-xs scale-90">
                    {reminderBadgeCount}
                  </span>
                )}
              </div>
              <span className="text-[8px] font-bold mt-1">Rem</span>
            </button>

            <button
              onClick={() => setActiveTab('revenue')}
              className={`flex flex-col items-center justify-center w-12 py-1 rounded-lg transition-colors ${
                activeTab === 'revenue' ? 'text-[#F58220]' : config.theme === 'dark' ? 'text-zinc-500 hover:text-zinc-300' : 'text-slate-400'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              <span className="text-[8px] font-bold mt-1">Rev</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex flex-col items-center justify-center w-12 py-1 rounded-lg transition-colors ${
                activeTab === 'settings' ? 'text-[#F58220]' : config.theme === 'dark' ? 'text-zinc-500 hover:text-zinc-300' : 'text-slate-400'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="text-[8px] font-bold mt-1">Set</span>
            </button>

            <button
              onClick={handleLogout}
              className={`flex flex-col items-center justify-center w-12 py-1 rounded-lg transition-colors text-red-400`}
            >
              <LogOut className="w-5 h-5" />
              <span className="text-[8px] font-bold mt-1">Out</span>
            </button>
          </nav>
        )}

        {/* Mobile Admin Logout */}
        {isAdmin && (
          <div className="md:hidden fixed bottom-6 right-6 z-50">
            <button 
              onClick={handleLogout}
              className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ================= FLOATING ACTION BUTTON (FAB) ================= */}
        {!isAdmin && (
          <div className="fixed bottom-16 right-4 md:bottom-6 md:right-6 z-40">
            <button
              onClick={() => setIsQuickAddOpen(true)}
              className="w-12 h-12 bg-[#F58220] hover:bg-[#E0721B] hover:scale-105 active:scale-95 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 group relative"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* ================= MODAL OVERLAYS ================= */}
        
        {/* Lead Details Log Timeline Modal */}
        <LeadDetailModal
          isOpen={viewLead !== null}
          lead={viewLead}
          onClose={() => setViewLead(null)}
          onUpdateStatus={(lead) => {
            setViewLead(null);
            setUpdateLead(lead);
          }}
          onEditLead={(lead) => {
            setViewLead(null);
            setEditLead(lead);
          }}
          hideEdit={activeTab === 'prospek'}
          isCustomerView={activeTab === 'customer'}
          historyOnly={isHistoryOnly}
        />

        {/* Update Status / Log Activity Modal */}
        <UpdateStatusModal
          isOpen={updateLead !== null}
          lead={updateLead}
          onClose={() => setUpdateLead(null)}
          onSave={handleUpdateLeadStatus}
          thinkingDays={config.reminderThinkingDays}
          nbpDays={config.reminderNBPDays}
          reminderMode={config.reminderMode}
          reminderPattern={config.reminderPattern}
        />

        {/* Floating action Quick Lead insertion form */}
        <LeadFormModal
          isOpen={isQuickAddOpen || editLead !== null}
          onClose={() => {
            setIsQuickAddOpen(false);
            setEditLead(null);
          }}
          leadToEdit={editLead}
          onEditLead={handleEditLead}
          onAddLead={(newLead) => {
            handleAddLead(newLead);
            setActiveTab('prospek'); // Navigate to prospect screen so they can see their entry!
          }}
          allLeads={leads}
          onViewExistingLead={(existing) => setViewLead(existing)}
          config={config}
        />

      </div>
      
      {/* Footer */}
      <footer className={`text-center py-6 text-xs ${config.theme === 'dark' ? 'text-zinc-600' : 'text-slate-400'}`}>
        OSASS version 1.0.0 beta - Copyright 2026 
      </footer>
    </div>
  );
}
