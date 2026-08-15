import React, { useState } from 'react';
import { useVault } from '../../context/VaultContext';
import { useAuth } from '../../context/AuthContext';
import { Search, Filter, Menu, Plus, Sparkles, LogOut, Loader2, User } from 'lucide-react';
import { ResourceType } from '../../types';

interface TopHeaderProps {
  onToggleMobileMenu: () => void;
  onOpenUpload: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onToggleMobileMenu, onOpenUpload }) => {
  const { filterOptions, setFilterOptions, activeView, setActiveView } = useVault();
  const { user, signOut } = useAuth();

  const [showSignOutConfirm, setShowSignOutConfirm] = useState<boolean>(false);
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const titleMap: Record<string, string> = {
    dashboard: 'Dashboard',
    vault: 'My Vault',
    favorites: 'Favorites',
    recent: 'Recently Viewed',
    folder: 'Folder Content',
    settings: 'Settings',
  };

  const handleConfirmSignOut = async () => {
    setIsSigningOut(true);
    setSignOutError(null);
    try {
      await signOut();
      setShowSignOutConfirm(false);
    } catch (err: any) {
      console.error('Sign out error:', err);
      setSignOutError(err?.message || 'Failed to sign out. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 lg:px-8 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white hidden sm:block">
            {titleMap[activeView] || 'StudyVault'}
          </h2>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex-1 max-w-xl flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search resources, folders, tags..."
              value={filterOptions.searchQuery}
              onChange={(e) =>
                setFilterOptions((prev) => ({ ...prev, searchQuery: e.target.value }))
              }
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>

          {/* Quick Type Filter Pill */}
          <div className="hidden md:flex items-center gap-1">
            <select
              value={filterOptions.resourceType}
              onChange={(e) =>
                setFilterOptions((prev) => ({
                  ...prev,
                  resourceType: e.target.value as ResourceType | 'all',
                }))
              }
              className="text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="pdf">PDF Documents</option>
              <option value="image">Images</option>
              <option value="youtube">YouTube Videos</option>
              <option value="website">Websites</option>
              <option value="ppt">PowerPoint (PPT)</option>
              <option value="doc">Word Docs</option>
              <option value="zip">ZIP Archives</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenUpload}
            className="sm:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* User Profile Pill with Sign Out */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveView('settings')}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Go to Settings"
            >
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 font-bold flex items-center justify-center text-xs">
                  {(user?.display_name || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </button>
            <button
              onClick={() => setShowSignOutConfirm(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

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
    </>
  );
};
