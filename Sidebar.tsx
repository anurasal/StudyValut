import React, { useState } from 'react';
import { useVault } from '../../context/VaultContext';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FolderLock,
  Star,
  Clock,
  Folder as FolderIcon,
  Plus,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Moon,
  Sun,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

interface SidebarProps {
  onOpenUpload: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenUpload,
  isDarkMode,
  onToggleDarkMode,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { activeView, activeFolderId, setActiveView, folders, createFolder } = useVault();
  const { user, signOut, isSupabaseConnected } = useAuth();

  const [foldersOpen, setFoldersOpen] = useState<boolean>(true);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [isAddingFolder, setIsAddingFolder] = useState<boolean>(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState<boolean>(false);
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const handleConfirmSignOut = async () => {
    setIsSigningOut(true);
    setSignOutError(null);
    try {
      await signOut();
      setShowSignOutConfirm(false);
      if (onCloseMobile) onCloseMobile();
    } catch (err: any) {
      console.error('Sign out failed:', err);
      setSignOutError(err?.message || 'Sign out failed. Please check your internet connection and try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleAddFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    await createFolder(newFolderName.trim());
    setNewFolderName('');
    setIsAddingFolder(false);
  };

  const navItemClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
      isActive
        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-semibold'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
    }`;

  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      <div className="flex flex-col h-full overflow-y-auto px-4 py-5">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
              <FolderLock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                StudyVault
              </h1>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                Resource Vault
              </span>
            </div>
          </div>
        </div>

        {/* Upload Button */}
        <button
          onClick={() => {
            onOpenUpload();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full mb-6 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all text-sm active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Upload Resource</span>
        </button>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          <button
            onClick={() => {
              setActiveView('dashboard');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full ${navItemClass(activeView === 'dashboard')}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => {
              setActiveView('vault');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full ${navItemClass(activeView === 'vault')}`}
          >
            <FolderLock className="w-4 h-4" />
            <span>My Vault</span>
          </button>

          <button
            onClick={() => {
              setActiveView('favorites');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full ${navItemClass(activeView === 'favorites')}`}
          >
            <Star className="w-4 h-4" />
            <span>Favorites</span>
          </button>

          <button
            onClick={() => {
              setActiveView('recent');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full ${navItemClass(activeView === 'recent')}`}
          >
            <Clock className="w-4 h-4" />
            <span>Recently Viewed</span>
          </button>

          {/* Folders Accordion */}
          <div className="pt-3">
            <div className="flex items-center justify-between px-2 pb-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <button
                onClick={() => setFoldersOpen(!foldersOpen)}
                className="flex items-center gap-1.5 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                {foldersOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                <span>Folders</span>
              </button>
              <button
                onClick={() => setIsAddingFolder(!isAddingFolder)}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all"
                title="Create Folder"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {isAddingFolder && (
              <form onSubmit={handleAddFolder} className="px-2 py-2 mb-2">
                <input
                  type="text"
                  placeholder="Folder name..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  autoFocus
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </form>
            )}

            {foldersOpen && (
              <div className="space-y-1 pl-2">
                {folders.length === 0 ? (
                  <p className="text-xs text-slate-400 italic px-2 py-1">No folders created</p>
                ) : (
                  folders.map((folder) => {
                    const isSelected = activeView === 'folder' && activeFolderId === folder.id;
                    return (
                      <button
                        key={folder.id}
                        onClick={() => {
                          setActiveView('folder', folder.id);
                          if (onCloseMobile) onCloseMobile();
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FolderIcon
                            className="w-3.5 h-3.5 shrink-0"
                            style={{ color: folder.color || '#3B82F6' }}
                          />
                          <span className="truncate">{folder.name}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div className="pt-3">
            <button
              onClick={() => {
                setActiveView('settings');
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full ${navItemClass(activeView === 'settings')}`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Footer / User Profile & Dark Mode */}
      <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
        {/* Supabase Status Indicator */}
        <div className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Database</span>
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-semibold text-[10px] ${
            isSupabaseConnected ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {isSupabaseConnected ? 'Supabase' : 'Local Mode'}
          </span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5 min-w-0">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 font-bold flex items-center justify-center text-xs shrink-0">
                {(user?.display_name || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {user?.display_name || 'Student'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onToggleDarkMode}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowSignOutConfirm(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

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
    </aside>
  );
};
