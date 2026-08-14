import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SUPABASE_SQL_SCHEMA } from '../../lib/sqlExport';
import {
  Database,
  Copy,
  Check,
  Moon,
  Sun,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  ExternalLink,
  LogOut,
  Loader2,
} from 'lucide-react';

interface SettingsViewProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ isDarkMode, onToggleDarkMode }) => {
  const { user, signOut, isSupabaseConnected } = useAuth();
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState<boolean>(false);
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleConfirmReset = () => {
    if (user) {
      localStorage.removeItem(`studyvault_data_${user.id}`);
      window.location.reload();
    }
  };

  const handleConfirmSignOut = async () => {
    setIsSigningOut(true);
    setSignOutError(null);
    try {
      await signOut();
      setShowSignOutConfirm(false);
    } catch (err: any) {
      console.error('Sign out error:', err);
      setSignOutError(err?.message || 'Failed to sign out. Please check network connection and try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Settings & Infrastructure
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Database status, security setup, and app preferences.
        </p>
      </div>

      {/* Connection Status Card */}
      <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-2xl ${
                isSupabaseConnected
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300'
              }`}
            >
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Database & Storage Connection
              </h3>
              <p className="text-xs text-slate-500">
                {isSupabaseConnected
                  ? 'Connected to Supabase PostgreSQL & Storage'
                  : 'Running in Isolated Local Persistence Engine'}
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              isSupabaseConnected
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
            }`}
          >
            {isSupabaseConnected ? 'Live Supabase' : 'Local Fallback'}
          </span>
        </div>

        {!isSupabaseConnected && (
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2">
            <p className="font-semibold">
              To connect your own live Supabase cloud database:
            </p>
            <ol className="list-decimal pl-4 space-y-1 text-amber-800 dark:text-amber-300 font-medium">
              <li>Add <code className="font-mono">VITE_SUPABASE_URL</code> and <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> to your Secrets panel.</li>
              <li>Click "Copy SQL Schema" below and paste it in your Supabase SQL Editor to set up tables and Row Level Security.</li>
            </ol>
          </div>
        )}

        {/* Copy SQL Button */}
        <div className="pt-2 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Supabase SQL Migration Generator
            </h4>
            <p className="text-[11px] text-slate-400">
              Generates complete SQL schema for profiles, folders, tags, resources, and RLS policies.
            </p>
          </div>

          <button
            onClick={handleCopySql}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all"
          >
            {copiedSql ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Copied SQL Schema!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy SQL Schema</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* User Profile Overview */}
      <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Student Profile</h3>
          <button
            onClick={() => setShowSignOutConfirm(true)}
            className="px-3.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-950/70 transition-all flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-bold text-lg flex items-center justify-center shrink-0">
            {(user?.display_name || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.display_name || 'Student'}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Appearance & Reset */}
      <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Preferences</h3>
        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">Theme Mode</p>
            <p className="text-[11px] text-slate-400">Toggle dark or light color palette</p>
          </div>
          <button
            onClick={onToggleDarkMode}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold flex items-center gap-2"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600" />}
            <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>

        {!isSupabaseConnected && (
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Reset Local Demo Data</p>
              <p className="text-[11px] text-slate-400">Restore default sample resources</p>
            </div>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-3.5 py-1.5 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Data</span>
            </button>
          </div>
        )}
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Reset Local Demo Data?</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              This will clear your local cached study resources and reset back to standard demo materials.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md shadow-rose-500/20 transition-all"
              >
                Reset Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60">
                <LogOut className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Sign Out?</h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to sign out of <strong className="text-slate-900 dark:text-white">StudyVault</strong>? You will need to log back in to access your study materials.
            </p>

            {signOutError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
                {signOutError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setShowSignOutConfirm(false);
                  setSignOutError(null);
                }}
                disabled={isSigningOut}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSignOut}
                disabled={isSigningOut}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md shadow-rose-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSigningOut ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Signing out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
