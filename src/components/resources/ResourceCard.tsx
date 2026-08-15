import React, { useState } from 'react';
import { Resource } from '../../types';
import { useVault } from '../../context/VaultContext';
import {
  FileText,
  Image as ImageIcon,
  Youtube,
  Globe,
  FileSpreadsheet,
  FileCode,
  Archive,
  Star,
  MoreVertical,
  Folder as FolderIcon,
  Clock,
  Sparkles,
  Trash2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { ResourceActionsModal } from './ResourceActionsModal';

interface ResourceCardProps {
  resource: Resource;
  onOpenPreview: (resource: Resource) => void;
  layout?: 'grid' | 'list';
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  onOpenPreview,
  layout = 'grid',
}) => {
  const { folders, tags, toggleFavorite, touchLastViewed, deleteResource } = useVault();
  const [showActionsModal, setShowActionsModal] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const folder = folders.find((f) => f.id === resource.folder_id);
  const resourceTags = tags.filter((t) => (resource.tag_ids || []).includes(t.id));

  const getTypeIcon = () => {
    switch (resource.resource_type) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-rose-500" />;
      case 'image':
        return <ImageIcon className="w-5 h-5 text-emerald-500" />;
      case 'youtube':
        return <Youtube className="w-5 h-5 text-red-600" />;
      case 'website':
        return <Globe className="w-5 h-5 text-blue-500" />;
      case 'ppt':
        return <FileSpreadsheet className="w-5 h-5 text-amber-500" />;
      case 'doc':
        return <FileCode className="w-5 h-5 text-indigo-500" />;
      case 'zip':
        return <Archive className="w-5 h-5 text-purple-500" />;
      default:
        return <FileText className="w-5 h-5 text-slate-500" />;
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleCardClick = () => {
    touchLastViewed(resource.id);
    onOpenPreview(resource);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(resource.id);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActionsModal(true);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    const success = await deleteResource(resource.id);
    setIsDeleting(false);
    if (success !== false) {
      setShowDeleteConfirm(false);
    }
  };

  if (layout === 'list') {
    return (
      <>
        <div
          onClick={handleCardClick}
          className="group flex items-center justify-between gap-4 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all cursor-pointer shadow-sm hover:shadow-md"
        >
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
              {getTypeIcon()}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                {resource.name}
              </h4>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {folder && (
                  <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
                    <FolderIcon className="w-3 h-3 text-blue-500" />
                    {folder.name}
                  </span>
                )}
                {resource.file_size && <span>{formatFileSize(resource.file_size)}</span>}
                <span>{new Date(resource.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {resourceTags.length > 0 && (
              <div className="hidden md:flex gap-1">
                {resourceTags.slice(0, 2).map((t) => (
                  <span
                    key={t.id}
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  >
                    #{t.name}
                  </span>
                ))}
              </div>
            )}

            <button
              onClick={handleFavoriteClick}
              className={`p-1.5 rounded-lg transition-colors ${
                resource.is_favorite
                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/50'
                  : 'text-slate-400 hover:text-amber-500'
              }`}
              title={resource.is_favorite ? 'Remove Favorite' : 'Add Favorite'}
            >
              <Star className={`w-4 h-4 ${resource.is_favorite ? 'fill-amber-500' : ''}`} />
            </button>

            <button
              onClick={handleDeleteClick}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              title="Delete Resource"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={handleMenuClick}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Resource Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        <ResourceActionsModal
          resource={resource}
          isOpen={showActionsModal}
          onClose={() => setShowActionsModal(false)}
          onOpenPreview={onOpenPreview}
        />

        {showDeleteConfirm && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
          >
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Resource?</h3>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-900 dark:text-white">"{resource.name}"</strong>? This will permanently remove the database record and any associated storage files.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md shadow-rose-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Permanently</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div
        onClick={handleCardClick}
        className="group relative flex flex-col justify-between p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700/60 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-0.5 space-y-3"
      >
        {/* Card Header: Type badge & Favorite/Menu */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60 transition-colors">
              {getTypeIcon()}
            </div>
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {resource.resource_type}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleFavoriteClick}
              className={`p-1.5 rounded-xl transition-all ${
                resource.is_favorite
                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/50'
                  : 'text-slate-300 hover:text-amber-500 dark:text-slate-600'
              }`}
              title={resource.is_favorite ? 'Remove Favorite' : 'Add Favorite'}
            >
              <Star className={`w-4 h-4 ${resource.is_favorite ? 'fill-amber-500' : ''}`} />
            </button>
            <button
              onClick={handleDeleteClick}
              className="p-1.5 rounded-xl text-slate-300 hover:text-rose-600 dark:text-slate-600 dark:hover:text-rose-400 transition-colors"
              title="Delete Resource"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleMenuClick}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Resource Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card Title & Snippet */}
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
            {resource.name}
          </h4>
          {resource.text_content && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 font-normal">
              {resource.text_content}
            </p>
          )}
        </div>

        {/* Tags */}
        {resourceTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {resourceTags.slice(0, 3).map((t) => (
              <span
                key={t.id}
                className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300"
              >
                #{t.name}
              </span>
            ))}
          </div>
        )}

        {/* Card Footer: Folder & Timestamp */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          {folder ? (
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-semibold truncate max-w-[130px]">
              <FolderIcon className="w-3 h-3 text-blue-500 shrink-0" />
              <span className="truncate">{folder.name}</span>
            </span>
          ) : (
            <span className="text-slate-400 italic">Unorganized</span>
          )}

          <div className="flex items-center gap-2">
            {resource.file_size && <span>{formatFileSize(resource.file_size)}</span>}
            <span className="flex items-center gap-0.5">
              <Clock className="w-3 h-3 text-slate-400" />
              {new Date(resource.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      <ResourceActionsModal
        resource={resource}
        isOpen={showActionsModal}
        onClose={() => setShowActionsModal(false)}
        onOpenPreview={onOpenPreview}
      />

      {showDeleteConfirm && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Resource?</h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-white">"{resource.name}"</strong>? This will permanently remove the database record and any associated storage files.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md shadow-rose-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Permanently</span>
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
