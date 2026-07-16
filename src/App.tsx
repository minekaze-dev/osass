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
import { supabase, updateSupabaseCredentials } from './lib/supabase';
import { isLeadActiveProspect, getTodayStr } from './utils/helpers';

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
    // Check if this page load is a reload
    const isReload = (() => {
      try {
        const navEntries = performance.getEntriesByType('navigation');
        if (navEntries.length > 0) {
          const navType = (navEntries[0] as PerformanceNavigationTiming).type;
          return navType === 'reload';
        }
        return performance.navigation?.type === 1; // TYPE_RELOAD
      } catch (e) {
        return false;
      }
    })();

    if (!isReload) {
      localStorage.removeItem('oxygen_auth');
      return { user: null, isAuthenticated: false };
    }

    const saved = localStorage.getItem('oxygen_auth');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed;
    }
    return { user: null, isAuthenticated: false };
  });
  
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [dbUrl, setDbUrl] = useState(() => localStorage.getItem('oxygen_supabase_url') || '');
  const [dbKey, setDbKey] = useState(() => localStorage.getItem('oxygen_supabase_anon_key') || '');

  const handleUpdateSupabaseCredentials = (url: string, key: string) => {
    updateSupabaseCredentials(url, key);
    setDbUrl(url);
    setDbKey(key);
    
    if (url && key) {
      window.location.reload();
    } else {
      setIsSupabaseConnected(false);
      setSupabaseError(null);
      window.location.reload();
    }
  };

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

  const TODAY_STR = getTodayStr();

  const dueLeadsCount = useMemo(() => {
    const actionable = filteredLeads.filter(isLeadActiveProspect);
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

  // Prevent going back to authenticated screen after logout via browser back button (bfcache)
  useEffect(() => {
    const checkAuthStatus = (e?: PageTransitionEvent | StorageEvent) => {
      // Check if this is a reload
      const isReload = (() => {
        try {
          const navEntries = performance.getEntriesByType('navigation');
          if (navEntries.length > 0) {
            const navType = (navEntries[0] as PerformanceNavigationTiming).type;
            return navType === 'reload';
          }
          return performance.navigation?.type === 1; // TYPE_RELOAD
        } catch (err) {
          return false;
        }
      })();

      const isBfCache = e && (e as PageTransitionEvent).persisted;
      const isStorageEvent = e && e.type === 'storage';

      // Only clear if it is NOT a reload and NOT a storage sync event
      const shouldClear = !isReload || isBfCache;

      if (shouldClear && !isStorageEvent) {
        localStorage.removeItem('oxygen_auth');
        setAuth({ user: null, isAuthenticated: false });
        return;
      }

      const saved = localStorage.getItem('oxygen_auth');
      if (!saved) {
        setAuth({ user: null, isAuthenticated: false });
      } else {
        try {
          const parsed = JSON.parse(saved);
          if (!parsed || !parsed.isAuthenticated) {
            setAuth({ user: null, isAuthenticated: false });
          }
        } catch (err) {
          setAuth({ user: null, isAuthenticated: false });
        }
      }
    };

    // Check immediately on mount
    checkAuthStatus();

    // Listen for pageshow (handling bfcache / browser back button)
    window.addEventListener('pageshow', checkAuthStatus);
    
    // Listen for storage changes (handles log out from another tab/window)
    window.addEventListener('storage', checkAuthStatus);

    return () => {
      window.removeEventListener('pageshow', checkAuthStatus);
      window.removeEventListener('storage', checkAuthStatus);
    };
  }, []);

  // Initialize data from localStorage or mockData and Sync with Supabase
  useEffect(() => {
    const loadInitialData = async () => {
      // 1. Immediate Offline-first Load
      const storedLeads = localStorage.getItem('oxygen_leads');
      const storedConfig = localStorage.getItem('oxygen_config');
      const storedUsers = localStorage.getItem('oxygen_users');

      let currentLocalUsers: User[] = [DEFAULT_ADMIN];
      if (storedUsers) {
        try {
          currentLocalUsers = JSON.parse(storedUsers);
          setUsers(currentLocalUsers);
        } catch (e) {}
      }

      if (storedLeads) {
        try {
          const parsed = JSON.parse(storedLeads) as Lead[];
          const formatted = parsed.map(l => ({ ...l, name: (l.name || 'TANPA NAMA').toUpperCase() }));
          setLeads(formatted);
        } catch (e) {
          setLeads([]);
        }
      }

      if (storedConfig) {
        try {
          const parsed = JSON.parse(storedConfig);
          setConfig({
            ...INITIAL_SALES_CONFIG,
            ...parsed
          });
        } catch (e) {
          setConfig(INITIAL_SALES_CONFIG);
        }
      } else {
        setConfig(INITIAL_SALES_CONFIG);
        localStorage.setItem('oxygen_config', JSON.stringify(INITIAL_SALES_CONFIG));
      }

      // 2. Async Online-sync Load if Supabase is active
      if (supabase) {
        try {
          setIsSyncing(true);
          setSupabaseError(null);
          
          // Fetch Users
          const { data: dbUsers, error: usersErr } = await supabase
            .from('users')
            .select('*');
          
          if (usersErr) {
            console.error('Failed to fetch users from Supabase:', usersErr);
            throw usersErr;
          }
          
          if (dbUsers) {
            const mappedUsers: User[] = dbUsers.map(u => ({
              id: u.id,
              name: u.name,
              code: u.code,
              role: u.role,
              createdAt: u.created_at || u.createdAt || new Date().toISOString()
            }));
            
            // Intelligent merge: Keep Supabase users, but also preserve and auto-sync any local users not in Supabase yet
            const mergedUsers = [...mappedUsers];
            
            for (const localUser of currentLocalUsers) {
              const exists = dbUsers.some(u => u.id === localUser.id || u.code === localUser.code);
              if (!exists) {
                mergedUsers.push(localUser);
                // Auto sync this offline user to Supabase
                try {
                  const { error: syncErr } = await supabase.from('users').upsert({
                    id: localUser.id,
                    name: localUser.name,
                    code: localUser.code,
                    role: localUser.role,
                    created_at: localUser.createdAt
                  });
                  if (syncErr) {
                    console.error(`Failed to auto-sync local user ${localUser.name} to Supabase:`, syncErr.message);
                  } else {
                    console.log(`Auto-synced local user ${localUser.name} to Supabase`);
                  }
                } catch (err) {
                  console.error(`Failed to auto-sync local user ${localUser.name} to Supabase:`, err);
                }
              }
            }
            
            setUsers(mergedUsers);
            localStorage.setItem('oxygen_users', JSON.stringify(mergedUsers));

            // Strict verification of active session against Supabase users
            if (auth.isAuthenticated && auth.user) {
              const stillExists = mergedUsers.find(u => u.id === auth.user?.id && u.code === auth.user?.code);
              if (!stillExists) {
                console.warn("Active user session not found in Supabase. Logging out.");
                setAuth({ user: null, isAuthenticated: false });
                localStorage.removeItem('oxygen_auth');
                window.location.replace('/');
              } else {
                setAuth({ user: stillExists, isAuthenticated: true });
                localStorage.setItem('oxygen_auth', JSON.stringify({ user: stillExists, isAuthenticated: true }));
              }
            }
          }

          // Fetch Config
          const { data: dbConfig, error: configErr } = await supabase
            .from('config')
            .select('*')
            .eq('id', 'global_config')
            .maybeSingle();

          if (!configErr && dbConfig) {
            const parsedConfig: SalesConfig = {
              salesName: dbConfig.salesName || INITIAL_SALES_CONFIG.salesName,
              monthlyTarget: Number(dbConfig.monthlyTarget) || INITIAL_SALES_CONFIG.monthlyTarget,
              reminderMode: dbConfig.reminderMode || INITIAL_SALES_CONFIG.reminderMode,
              reminderThinkingDays: Number(dbConfig.reminderThinkingDays) || INITIAL_SALES_CONFIG.reminderThinkingDays,
              reminderNBPDays: Number(dbConfig.reminderNBPDays) || INITIAL_SALES_CONFIG.reminderNBPDays,
              theme: dbConfig.theme || INITIAL_SALES_CONFIG.theme,
              reminderPattern: dbConfig.reminderPattern || INITIAL_SALES_CONFIG.reminderPattern,
              showActiveProspectsCard: dbConfig.showActiveProspectsCard !== undefined ? !!dbConfig.showActiveProspectsCard : INITIAL_SALES_CONFIG.showActiveProspectsCard,
            };
            setConfig(parsedConfig);
            localStorage.setItem('oxygen_config', JSON.stringify(parsedConfig));
          }

          // Fetch Leads
          const { data: dbLeads, error: leadsErr } = await supabase
            .from('leads')
            .select('*');

          if (!leadsErr && dbLeads) {
            const mappedLeads: Lead[] = dbLeads.map(l => ({
              id: l.id,
              userId: l.userId,
              name: l.name,
              whatsapp: l.whatsapp,
              address: l.address,
              area: l.area,
              source: l.source,
              packageInterest: l.packageInterest,
              notes: l.notes,
              pipeline: l.pipeline,
              status: l.status,
              nextReminderDate: l.nextReminderDate,
              lastFollowUpDate: l.lastFollowUpDate,
              followUpCount: Number(l.followUpCount) || 0,
              customerStatus: l.customerStatus,
              closingDate: l.closingDate,
              subscriptionPeriod: l.subscriptionPeriod,
              customerId: l.customerId,
              closingStatus: l.closingStatus,
              history: Array.isArray(l.history) ? l.history : [],
              createdAt: l.createdAt
            }));

            setLeads(mappedLeads);
            localStorage.setItem('oxygen_leads', JSON.stringify(mappedLeads));
          }
          
          if (usersErr || configErr || leadsErr) {
            const errMsgs: string[] = [];
            if (usersErr) errMsgs.push(`Tabel users: ${usersErr.message}`);
            if (configErr) errMsgs.push(`Tabel config: ${configErr.message}`);
            if (leadsErr) errMsgs.push(`Tabel leads: ${leadsErr.message}`);
            
            const fullError = errMsgs.join(' | ');
            console.error('Supabase initialization encountered table or policy errors:', fullError);
            setSupabaseError(fullError);
            setIsSupabaseConnected(false);
          } else {
            setIsSupabaseConnected(true);
            setSupabaseError(null);
          }
        } catch (err: any) {
          console.error('Supabase initialization failed, running in local/offline mode:', err);
          setSupabaseError(err.message || String(err));
          setIsSupabaseConnected(false);
        } finally {
          setIsSyncing(false);
        }
      }
    };

    loadInitialData();
  }, []);

  // Sync theme with document class list
  useEffect(() => {
    if (config.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [config.theme]);

  // Save Leads to LocalStorage & Sync to Supabase background
  const saveLeads = async (updatedLeads: Lead[]) => {
    const formatted = updatedLeads.map(l => ({
      ...l,
      name: (l.name && l.name.trim() !== '' && l.name !== 'TANPA NAMA' ? l.name : '-').toUpperCase(),
      address: l.address && l.address.trim() !== '' ? l.address : '-',
      area: l.area && l.area.trim() !== '' ? l.area : '-',
      packageInterest: l.packageInterest && l.packageInterest.trim() !== '' ? l.packageInterest : '-',
    }));
    setLeads(formatted);
    localStorage.setItem('oxygen_leads', JSON.stringify(formatted));

    if (supabase && isSupabaseConnected) {
      try {
        const dbLeads = formatted.map(l => ({
          id: l.id,
          userId: l.userId,
          name: l.name,
          whatsapp: l.whatsapp,
          address: l.address,
          area: l.area,
          source: l.source,
          packageInterest: l.packageInterest,
          notes: l.notes,
          pipeline: l.pipeline,
          status: l.status,
          nextReminderDate: l.nextReminderDate,
          lastFollowUpDate: l.lastFollowUpDate,
          followUpCount: l.followUpCount,
          customerStatus: l.customerStatus,
          closingDate: l.closingDate,
          subscriptionPeriod: l.subscriptionPeriod,
          customerId: l.customerId,
          closingStatus: l.closingStatus,
          history: l.history,
          createdAt: l.createdAt
        }));

        await supabase.from('leads').upsert(dbLeads, { onConflict: 'id' });
      } catch (err) {
        console.error('Error auto-syncing leads to Supabase:', err);
      }
    }
  };

  // Save Config to LocalStorage & Sync to Supabase
  const handleUpdateConfig = async (newConfig: SalesConfig) => {
    setConfig(newConfig);
    localStorage.setItem('oxygen_config', JSON.stringify(newConfig));

    if (supabase && isSupabaseConnected) {
      try {
        await supabase.from('config').upsert({
          id: 'global_config',
          salesName: newConfig.salesName,
          monthlyTarget: newConfig.monthlyTarget,
          reminderMode: newConfig.reminderMode,
          reminderThinkingDays: newConfig.reminderThinkingDays,
          reminderNBPDays: newConfig.reminderNBPDays,
          theme: newConfig.theme,
          reminderPattern: newConfig.reminderPattern,
          showActiveProspectsCard: newConfig.showActiveProspectsCard,
        }, { onConflict: 'id' });
      } catch (err) {
        console.error('Error auto-syncing config to Supabase:', err);
      }
    }
  };

  // Upload state to Supabase
  const handleSyncLocalToSupabase = async () => {
    if (!supabase) {
      alert('Supabase belum dikonfigurasi di .env');
      return;
    }
    try {
      setIsSyncing(true);
      
      // 1. Sync Config
      const { error: configErr } = await supabase
        .from('config')
        .upsert({
          id: 'global_config',
          salesName: config.salesName,
          monthlyTarget: config.monthlyTarget,
          reminderMode: config.reminderMode,
          reminderThinkingDays: config.reminderThinkingDays,
          reminderNBPDays: config.reminderNBPDays,
          theme: config.theme,
          reminderPattern: config.reminderPattern,
          showActiveProspectsCard: config.showActiveProspectsCard,
        }, { onConflict: 'id' });
      if (configErr) throw configErr;

      // 2. Sync Users
      const dbUsers = users.map(u => ({
        id: u.id,
        name: u.name,
        code: u.code,
        role: u.role,
        created_at: u.createdAt
      }));
      const { error: usersErr } = await supabase
        .from('users')
        .upsert(dbUsers, { onConflict: 'id' });
      if (usersErr) throw usersErr;

      // 3. Sync Leads
      if (leads.length > 0) {
        const dbLeads = leads.map(l => ({
          id: l.id,
          userId: l.userId,
          name: l.name,
          whatsapp: l.whatsapp,
          address: l.address,
          area: l.area,
          source: l.source,
          packageInterest: l.packageInterest,
          notes: l.notes,
          pipeline: l.pipeline,
          status: l.status,
          nextReminderDate: l.nextReminderDate,
          lastFollowUpDate: l.lastFollowUpDate,
          followUpCount: l.followUpCount,
          customerStatus: l.customerStatus,
          closingDate: l.closingDate,
          subscriptionPeriod: l.subscriptionPeriod,
          customerId: l.customerId,
          closingStatus: l.closingStatus,
          history: l.history,
          createdAt: l.createdAt
        }));
        
        const { error: leadsErr } = await supabase
          .from('leads')
          .upsert(dbLeads, { onConflict: 'id' });
        if (leadsErr) throw leadsErr;
      }

      setIsSupabaseConnected(true);
      alert('Berhasil mengunggah semua data lokal ke database Supabase!');
    } catch (err: any) {
      console.error(err);
      alert('Gagal sinkronisasi ke Supabase: ' + (err.message || err));
    } finally {
      setIsSyncing(false);
    }
  };

  // Fetch state from Supabase
  const handleFetchFromSupabase = async () => {
    if (!supabase) {
      alert('Supabase belum dikonfigurasi di .env');
      return;
    }
    try {
      setIsSyncing(true);
      
      // 1. Fetch Users
      const { data: dbUsers, error: usersErr } = await supabase
        .from('users')
        .select('*');
      if (usersErr) throw usersErr;
      
      if (dbUsers) {
        const mappedUsers: User[] = dbUsers.map(u => ({
          id: u.id,
          name: u.name,
          code: u.code,
          role: u.role,
          createdAt: u.created_at || u.createdAt || new Date().toISOString()
        }));
        if (!mappedUsers.some(u => u.id === 'admin-001')) {
          mappedUsers.push(DEFAULT_ADMIN);
        }
        setUsers(mappedUsers);
        localStorage.setItem('oxygen_users', JSON.stringify(mappedUsers));
      }

      // 2. Fetch Config
      const { data: dbConfig, error: configErr } = await supabase
        .from('config')
        .select('*')
        .eq('id', 'global_config')
        .maybeSingle();
      
      if (!configErr && dbConfig) {
        const parsedConfig: SalesConfig = {
          salesName: dbConfig.salesName || INITIAL_SALES_CONFIG.salesName,
          monthlyTarget: Number(dbConfig.monthlyTarget) || INITIAL_SALES_CONFIG.monthlyTarget,
          reminderMode: dbConfig.reminderMode || INITIAL_SALES_CONFIG.reminderMode,
          reminderThinkingDays: Number(dbConfig.reminderThinkingDays) || INITIAL_SALES_CONFIG.reminderThinkingDays,
          reminderNBPDays: Number(dbConfig.reminderNBPDays) || INITIAL_SALES_CONFIG.reminderNBPDays,
          theme: dbConfig.theme || INITIAL_SALES_CONFIG.theme,
          reminderPattern: dbConfig.reminderPattern || INITIAL_SALES_CONFIG.reminderPattern,
          showActiveProspectsCard: dbConfig.showActiveProspectsCard !== undefined ? !!dbConfig.showActiveProspectsCard : INITIAL_SALES_CONFIG.showActiveProspectsCard,
        };
        setConfig(parsedConfig);
        localStorage.setItem('oxygen_config', JSON.stringify(parsedConfig));
      }

      // 3. Fetch Leads
      const { data: dbLeads, error: leadsErr } = await supabase
        .from('leads')
        .select('*');
      if (leadsErr) throw leadsErr;

      if (dbLeads) {
        const mappedLeads: Lead[] = dbLeads.map(l => ({
          id: l.id,
          userId: l.userId,
          name: l.name,
          whatsapp: l.whatsapp,
          address: l.address,
          area: l.area,
          source: l.source,
          packageInterest: l.packageInterest,
          notes: l.notes,
          pipeline: l.pipeline,
          status: l.status,
          nextReminderDate: l.nextReminderDate,
          lastFollowUpDate: l.lastFollowUpDate,
          followUpCount: Number(l.followUpCount) || 0,
          customerStatus: l.customerStatus,
          closingDate: l.closingDate,
          subscriptionPeriod: l.subscriptionPeriod,
          customerId: l.customerId,
          closingStatus: l.closingStatus,
          history: Array.isArray(l.history) ? l.history : [],
          createdAt: l.createdAt
        }));
        setLeads(mappedLeads);
        localStorage.setItem('oxygen_leads', JSON.stringify(mappedLeads));
      }

      setIsSupabaseConnected(true);
      alert('Berhasil mengunduh dan menyinkronkan data terbaru dari Supabase!');
    } catch (err: any) {
      console.error(err);
      alert('Gagal mengambil data dari Supabase: ' + (err.message || err));
    } finally {
      setIsSyncing(false);
    }
  };

  // Auth Handlers
  const handleLogin = async (rawCode: string) => {
    const code = rawCode.trim();
    setIsLoggingIn(true);
    setLoginError('');
    console.log('Oxygen Auth: Memulai verifikasi login untuk kode:', code);
    
    try {
      if (supabase) {
        console.log('Oxygen Auth: Melakukan query live ke Supabase untuk tabel "users"...');
        // Double check against database live
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('code', code)
          .maybeSingle();

        console.log('Oxygen Auth: Hasil query Supabase:', { data, error });

        if (error) {
          console.error('Oxygen Auth: Error query Supabase saat login:', error);
          setLoginError('Verifikasi Gagal, Pastikan Kode Anda Sesuai');
          setIsLoggingIn(false);
          return;
        }

        if (data) {
          console.log('Oxygen Auth: User berhasil ditemukan di Supabase:', data);
          const user: User = {
            id: data.id,
            name: data.name,
            code: data.code,
            role: data.role,
            createdAt: data.created_at || data.createdAt || new Date().toISOString()
          };
          
          // Update local users list if this user isn't in it or is different
          setUsers(prevUsers => {
            const existingUserIndex = prevUsers.findIndex(u => u.id === user.id);
            let updatedUsers = [...prevUsers];
            if (existingUserIndex !== -1) {
              updatedUsers[existingUserIndex] = user;
            } else {
              updatedUsers.push(user);
            }
            localStorage.setItem('oxygen_users', JSON.stringify(updatedUsers));
            return updatedUsers;
          });

          setAuth({ user, isAuthenticated: true });
          localStorage.setItem('oxygen_auth', JSON.stringify({ user, isAuthenticated: true }));
          setLoginError('');
          setActiveTab('dashboard');
          setIsLoggingIn(false);
          return;
        } else {
          console.warn('Oxygen Auth: Kode tidak cocok dengan baris data manapun di tabel "users" Supabase. Ini bisa disebabkan karena data benar-benar tidak ada atau kebijakan RLS SELECT memblokir akses.');
          // If Supabase is active and the user is NOT found in Supabase table, reject login immediately
          setLoginError('Verifikasi Gagal, Pastikan Kode Anda Sesuai');
          setIsLoggingIn(false);
          return;
        }
      }
    } catch (err: any) {
      console.error('Oxygen Auth: Verifikasi Supabase gagal with exception:', err);
      setLoginError('Verifikasi Gagal, Pastikan Kode Anda Sesuai');
      setIsLoggingIn(false);
      return;
    }

    // Fallback/Local login (Only executes if Supabase client is not initialized/active)
    console.log('Oxygen Auth: Supabase tidak aktif. Menggunakan verifikasi database lokal/offline...');
    const user = users.find(u => u.code === code);
    if (user) {
      console.log('Oxygen Auth: Berhasil login lokal:', user);
      setAuth({ user, isAuthenticated: true });
      localStorage.setItem('oxygen_auth', JSON.stringify({ user, isAuthenticated: true }));
      setLoginError('');
      setActiveTab('dashboard');
    } else {
      console.warn('Oxygen Auth: Gagal login lokal. Kode tidak terdaftar di browser local storage.');
      setLoginError('Verifikasi Gagal, Pastikan Kode Anda Sesuai');
    }
    setIsLoggingIn(false);
  };

  const handleLogout = () => {
    setAuth({ user: null, isAuthenticated: false });
    localStorage.removeItem('oxygen_auth');
    // Force a full reload to clear browser history/cache for the authenticated state
    window.location.replace('/');
  };

  // Admin Handlers
  const handleAddUser = async (name: string, code: string) => {
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

    if (supabase) {
      try {
        const { error } = await supabase.from('users').upsert({
          id: newUser.id,
          name: newUser.name,
          code: newUser.code,
          role: newUser.role,
          created_at: newUser.createdAt
        });
        if (error) {
          console.error('Error adding user to Supabase:', error);
          alert('Gagal menyimpan user ke Supabase: ' + error.message + '\n\nPastikan Anda sudah menjalankan SQL Script di halaman Settings.');
        } else {
          console.log('Success adding user to Supabase');
        }
      } catch (err: any) {
        console.error('Error sync adding user to Supabase:', err);
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Hapus user ini? Semua data terkait mungkin tidak terakses.')) {
      const updatedUsers = users.filter(u => u.id !== userId);
      setUsers(updatedUsers);
      localStorage.setItem('oxygen_users', JSON.stringify(updatedUsers));

      if (supabase) {
        try {
          const { error } = await supabase.from('users').delete().eq('id', userId);
          if (error) {
            console.error('Error deleting user from Supabase:', error);
            alert('Gagal menghapus user dari Supabase: ' + error.message);
          }
        } catch (err) {
          console.error('Error sync deleting user from Supabase:', err);
        }
      }
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    const updatedUsers = users.map(u => u.id === userId ? { ...u, ...updates } : u);
    setUsers(updatedUsers);
    localStorage.setItem('oxygen_users', JSON.stringify(updatedUsers));

    if (supabase) {
      try {
        const u = updatedUsers.find(user => user.id === userId);
        if (u) {
          const { error } = await supabase.from('users').upsert({
            id: u.id,
            name: u.name,
            code: u.code,
            role: u.role,
            created_at: u.createdAt
          });
          if (error) {
            console.error('Error updating user on Supabase:', error);
            alert('Gagal memperbarui user di Supabase: ' + error.message);
          }
        }
      } catch (err) {
        console.error('Error sync updating user on Supabase:', err);
      }
    }
  };

  // Handle Add Lead
  const handleAddLead = (newLeadData: Omit<Lead, 'id' | 'createdAt' | 'followUpCount' | 'history' | 'lastFollowUpDate' | 'userId'>) => {
    if (!auth.user) return;
    const todayStr = getTodayStr();
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
    const todayStr = getTodayStr();
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

        const isActive = pipeline === 'Aktif';

        return {
          ...l,
          status,
          pipeline,
          nextReminderDate: nextReminder,
          lastFollowUpDate: todayStr,
          followUpCount: l.followUpCount + 1,
          closingDate: isActive ? (l.closingDate || todayStr) : l.closingDate,
          customerStatus: isActive ? (l.customerStatus || 'Aktif') : l.customerStatus,
          closingStatus: isActive ? ('Closed' as const) : l.closingStatus,
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
    const todayStr = getTodayStr();
    const timeStr = '15:45';
    
    const updated = leads.map(l => {
      if (l.id === leadId) {
        let pipeline = l.pipeline;
        let closingStatus = l.closingStatus;
        if (customerStatus === 'Aktif') {
          pipeline = 'Aktif';
          closingStatus = 'Closed';
        } else if (customerStatus === 'Follow Up') {
          pipeline = 'Follow Up';
          closingStatus = 'Not Closed';
        } else if (customerStatus === 'Refund') {
          pipeline = 'Tidak Tercover';
          closingStatus = 'Refund';
        } else if (customerStatus === 'Dismantle') {
          pipeline = 'Tidak Tercover';
          closingStatus = 'Not Closed';
        } else if (customerStatus === 'Not Interested') {
          pipeline = 'Tidak Tercover';
          closingStatus = 'Not Closed';
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
          closingStatus,
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
  const handleQuickClosing = (leadId: string, action: 'Not Closed' | 'On Process' | 'Closed' | 'Installation' | 'Refund') => {
    const todayStr = getTodayStr();
    const timeStr = '15:45';
    
    const updated = leads.map(l => {
      if (l.id === leadId) {
        if (action === 'Closed') {
          const newHistoryEntry = {
            id: `hist-${Date.now()}-closing`,
            date: `${todayStr} ${timeStr}`,
            status: 'Installed' as FollowUpStatus,
            pipeline: 'Aktif' as PipelineStage,
            notes: 'Quick update: Customer closed (Aktif).',
          };
          return {
            ...l,
            pipeline: 'Aktif' as PipelineStage,
            status: 'Installed' as FollowUpStatus,
            customerStatus: 'Aktif' as CustomerStatus,
            closingDate: l.closingDate || todayStr, // preserve if exists, else today
            closingStatus: 'Closed' as const,
            history: [newHistoryEntry, ...l.history],
          };
        } else if (action === 'Installation') {
          const newHistoryEntry = {
            id: `hist-${Date.now()}-installation`,
            date: `${todayStr} ${timeStr}`,
            status: 'Closing' as FollowUpStatus,
            pipeline: 'Instalasi' as PipelineStage,
            notes: 'Quick update: Customer in installation phase.',
          };
          return {
            ...l,
            pipeline: 'Instalasi' as PipelineStage,
            status: 'Closing' as FollowUpStatus,
            customerStatus: 'Follow Up' as CustomerStatus,
            closingStatus: 'Installation' as const,
            history: [newHistoryEntry, ...l.history],
          };
        } else if (action === 'Refund') {
          const newHistoryEntry = {
            id: `hist-${Date.now()}-refund`,
            date: `${todayStr} ${timeStr}`,
            status: 'Not Interested' as FollowUpStatus,
            pipeline: 'Tidak Tercover' as PipelineStage,
            notes: 'Quick update: Customer cancelled/refunded.',
          };
          return {
            ...l,
            pipeline: 'Tidak Tercover' as PipelineStage,
            status: 'Not Interested' as FollowUpStatus,
            customerStatus: 'Refund' as CustomerStatus,
            closingDate: l.closingDate || todayStr,
            closingStatus: 'Refund' as const,
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
    const todayStr = getTodayStr();
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
    if (auth.user?.role === 'admin' && activeTab !== 'settings') {
      return (
        <AdminView 
          users={users} 
          onAddUser={handleAddUser} 
          onDeleteUser={handleDeleteUser} 
          onUpdateUser={handleUpdateUser}
          onBack={() => {}} // No back button for admin as this is their only view
          isSupabaseConnected={isSupabaseConnected}
          supabaseError={supabaseError}
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
            onAddLeadClick={() => setIsQuickAddOpen(true)}
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
            onUpdateLead={(lead) => {
              const newLeads = leads.map(l => l.id === lead.id ? lead : l);
              saveLeads(newLeads);
            }}
            onBulkUpdateLeads={(updatedLeads) => {
              const updatedIds = new Set(updatedLeads.map(ul => ul.id));
              const newLeads = leads.map(l => updatedIds.has(l.id) ? (updatedLeads.find(ul => ul.id === l.id) || l) : l);
              saveLeads(newLeads);
            }}
            onImportLeads={(importedLeads) => {
              const currentUserId = auth.user?.id || 'admin';
              const mapped = importedLeads.map(l => ({
                ...l,
                userId: currentUserId
              }));
              const newLeads = [...leads, ...mapped];
              saveLeads(newLeads);
            }}
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
            isSupabaseConnected={isSupabaseConnected}
            isSyncing={isSyncing}
            onSyncToSupabase={handleSyncLocalToSupabase}
            onFetchFromSupabase={handleFetchFromSupabase}
            supabaseUrl={dbUrl}
            supabaseAnonKey={dbKey}
            onUpdateSupabaseCredentials={handleUpdateSupabaseCredentials}
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
        isLoading={isLoggingIn}
        onUpdateSupabaseCredentials={handleUpdateSupabaseCredentials}
        isSupabaseConnected={isSupabaseConnected}
        supabaseUrl={dbUrl}
        supabaseAnonKey={dbKey}
      />
    );
  }

  const isAdmin = auth.user?.role === 'admin';

  return (
    <div className={`min-h-screen ${config.theme === 'dark' ? 'bg-[#0f0f11] text-zinc-100 dark' : 'bg-[#F8FAFC] text-slate-800'}`}>
      <div className={`flex w-full max-w-[1320px] mx-auto min-h-screen relative border-x shadow-sm transition-colors duration-200 ${
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
                <>
                  <button
                    onClick={() => setActiveTab('admin')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === 'admin' 
                        ? config.theme === 'dark' ? 'bg-zinc-800 text-[#F58220]' : 'bg-orange-50 text-[#F58220]' 
                        : config.theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>User Management</span>
                  </button>

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
                {isAdmin ? 'Master Control' : 'Online'}
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

              {/* Settings button on mobile */}
              <button 
                onClick={() => setActiveTab('settings')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer md:hidden ${
                  activeTab === 'settings'
                    ? 'text-[#F58220] bg-[#F58220]/10'
                    : config.theme === 'dark' 
                      ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800' 
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 p-4 md:p-6">
            {renderTabContent()}
          </main>
        </div>

        {/* ================= MOBILE BOTTOM NAVIGATION ================= */}
        {isAdmin ? (
          <nav className={`fixed bottom-0 left-0 right-0 px-2 py-1.5 z-40 flex justify-around md:hidden shadow-lg rounded-t-xl border-t transition-colors duration-200 ${
            config.theme === 'dark' ? 'bg-[#18181b]/95 border-zinc-800' : 'bg-white border-slate-200'
          }`}>
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex flex-col items-center justify-center w-24 py-1 rounded-lg transition-colors ${
                activeTab === 'admin' ? 'text-[#F58220]' : config.theme === 'dark' ? 'text-zinc-500 hover:text-zinc-300' : 'text-slate-400'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
              <span className="text-[8px] font-bold mt-1">Users</span>
            </button>

            <button
              onClick={handleLogout}
              className={`flex flex-col items-center justify-center w-24 py-1 rounded-lg transition-colors text-red-400`}
            >
              <LogOut className="w-5 h-5" />
              <span className="text-[8px] font-bold mt-1">Out</span>
            </button>
          </nav>
        ) : (
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
          <div className="fixed bottom-16 right-4 z-40 md:hidden">
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
