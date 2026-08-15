import React from 'react';
import { useVault } from '../../context/VaultContext';
import { useAuth } from '../../context/AuthContext';
import { ResourceGrid } from '../resources/ResourceGrid';
import {
  FolderLock,
  HardDrive,
  Star,
  Clock,
  Plus,
  Sparkles,
  Folder as FolderIcon,
  ArrowRight,
} from 'lucide-react';
import { Resource } from '../../types';

interface DashboardViewProps {
  onOpenUpload: () => void;
  onOpenPreview: (resource: Resource) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenUpload, onOpenPreview }) => {
  const { resources, folders, setActiveView, getStorageUsedBytes } = useVault();
  const { user } = useAuth();

  const totalResources = resources.length;
  const favoritesCount = resources.filter((r) => r.is_favorite).length;
  const storageUsedBytes = getStorageUsedBytes();

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Recent 6 resources
  const recentUploads = [...resources]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  // Recently viewed
  const recentlyViewed = [...resources]
    .filter((r) => r.last_viewed_at)
    .sort((a, b) => new Date(b.last_viewed_at!).getTime() - new Date(a.last_viewed_at!).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl shadow-blue-500/15">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-blue-100">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI-Assisted Study Vault</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.display_name || 'Student'}!
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 leading-relaxed font-normal">
            Your centralized vault for previous year papers, DBMS notes, lecture videos, and exam revision guides.
          </p>
          <div className="pt-2">
            <button
              onClick={onOpenUpload}
              className="px-5 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs shadow-md transition-all active:scale-[0.98] inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Upload New Resource</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <FolderLock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none">
              {totalResources}
            </p>
            <p className="text-xs font-semibold text-slate-400 mt-1">Total Resources</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500">
            <Star className="w-6 h-6 fill-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none">
              {favoritesCount}
            </p>
            <p className="text-xs font-semibold text-slate-400 mt-1">Starred Favorites</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none">
              {formatBytes(storageUsedBytes)}
            </p>
            <p className="text-xs font-semibold text-slate-400 mt-1">Vault Storage</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <FolderIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none">
              {folders.length}
            </p>
            <p className="text-xs font-semibold text-slate-400 mt-1">Active Folders</p>
          </div>
        </div>
      </div>

      {/* Folders Quick Access */}
      {folders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Folders</h3>
            <button
              onClick={() => setActiveView('vault')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {folders.map((folder) => {
              const count = resources.filter((r) => r.folder_id === folder.id).length;
              return (
                <div
                  key={folder.id}
                  onClick={() => setActiveView('folder', folder.id)}
                  className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-pointer shadow-sm hover:shadow-md flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60"
                      style={{ color: folder.color || '#3B82F6' }}
                    >
                      <FolderIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
                        {folder.name}
                      </h4>
                      <p className="text-xs text-slate-400">{count} items</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Uploads Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Uploads</h3>
          <button
            onClick={() => setActiveView('vault')}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>Go to Vault</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <ResourceGrid
          resources={recentUploads}
          onOpenPreview={onOpenPreview}
          onOpenUpload={onOpenUpload}
        />
      </div>
    </div>
  );
};
