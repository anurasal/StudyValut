import React, { useState } from 'react';
import { Resource } from '../../types';
import { useVault } from '../../context/VaultContext';
import { ResourceCard } from './ResourceCard';
import { LayoutGrid, List, SlidersHorizontal, FolderLock, Plus } from 'lucide-react';

interface ResourceGridProps {
  resources: Resource[];
  onOpenPreview: (resource: Resource) => void;
  onOpenUpload?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

export const ResourceGrid: React.FC<ResourceGridProps> = ({
  resources,
  onOpenPreview,
  onOpenUpload,
  emptyTitle = 'No resources found',
  emptyDescription = 'Upload question papers, notes, or links to build your StudyVault.',
}) => {
  const { filterOptions, setFilterOptions, folders, tags } = useVault();
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');

  // Apply filters
  let filtered = resources.filter((res) => {
    // Search query filter
    if (filterOptions.searchQuery) {
      const q = filterOptions.searchQuery.toLowerCase();
      const matchName = res.name.toLowerCase().includes(q);
      const matchText = (res.text_content || '').toLowerCase().includes(q);
      const folder = folders.find((f) => f.id === res.folder_id);
      const matchFolder = folder?.name.toLowerCase().includes(q);
      const resTags = tags.filter((t) => (res.tag_ids || []).includes(t.id));
      const matchTags = resTags.some((t) => t.name.toLowerCase().includes(q));

      if (!matchName && !matchText && !matchFolder && !matchTags) return false;
    }

    // Resource Type Filter
    if (filterOptions.resourceType !== 'all') {
      if (res.resource_type !== filterOptions.resourceType) return false;
    }

    // Folder Filter
    if (filterOptions.folderId !== 'all') {
      if (filterOptions.folderId === 'unorganized') {
        if (res.folder_id) return false;
      } else if (res.folder_id !== filterOptions.folderId) {
        return false;
      }
    }

    // Tag Filter
    if (filterOptions.tagId !== 'all') {
      if (!(res.tag_ids || []).includes(filterOptions.tagId)) return false;
    }

    // Only Favorites
    if (filterOptions.onlyFavorites) {
      if (!res.is_favorite) return false;
    }

    return true;
  });

  // Apply Sorting
  filtered.sort((a, b) => {
    if (filterOptions.sortBy === 'newest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (filterOptions.sortBy === 'oldest') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    if (filterOptions.sortBy === 'recently_viewed') {
      const aTime = a.last_viewed_at ? new Date(a.last_viewed_at).getTime() : 0;
      const bTime = b.last_viewed_at ? new Date(b.last_viewed_at).getTime() : 0;
      return bTime - aTime;
    }
    if (filterOptions.sortBy === 'name_asc') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  return (
    <div className="space-y-4">
      {/* Sub-header Filter & Layout Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Sorting */}
          <div className="flex items-center gap-1.5 font-medium text-slate-500">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Sort:</span>
            <select
              value={filterOptions.sortBy}
              onChange={(e) =>
                setFilterOptions((prev) => ({
                  ...prev,
                  sortBy: e.target.value as any,
                }))
              }
              className="py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="recently_viewed">Recently Viewed</option>
              <option value="name_asc">Name (A-Z)</option>
            </select>
          </div>

          {/* Folder filter dropdown */}
          <select
            value={filterOptions.folderId}
            onChange={(e) =>
              setFilterOptions((prev) => ({
                ...prev,
                folderId: e.target.value,
              }))
            }
            className="py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:outline-none"
          >
            <option value="all">All Folders</option>
            <option value="unorganized">Unorganized</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>

          {/* Tag filter dropdown */}
          <select
            value={filterOptions.tagId}
            onChange={(e) =>
              setFilterOptions((prev) => ({
                ...prev,
                tagId: e.target.value,
              }))
            }
            className="py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:outline-none"
          >
            <option value="all">All Tags</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                #{t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Layout Toggle Buttons */}
        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-200/80 dark:bg-slate-800">
          <button
            onClick={() => setLayoutMode('grid')}
            className={`p-1.5 rounded-lg transition-all ${
              layoutMode === 'grid'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setLayoutMode('list')}
            className={`p-1.5 rounded-lg transition-all ${
              layoutMode === 'list'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid Content */}
      {filtered.length === 0 ? (
        <div className="py-16 px-4 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 my-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
            <FolderLock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{emptyTitle}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            {emptyDescription}
          </p>
          {onOpenUpload && (
            <button
              onClick={onOpenUpload}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Resource</span>
            </button>
          )}
        </div>
      ) : layoutMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((res) => (
            <ResourceCard
              key={res.id}
              resource={res}
              onOpenPreview={onOpenPreview}
              layout="grid"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((res) => (
            <ResourceCard
              key={res.id}
              resource={res}
              onOpenPreview={onOpenPreview}
              layout="list"
            />
          ))}
        </div>
      )}
    </div>
  );
};
