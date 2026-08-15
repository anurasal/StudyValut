import React, { useState } from 'react';
import { useVault } from '../../context/VaultContext';
import { Resource } from '../../types';
import { X, FolderInput, Tag as TagIcon, Edit2, Trash2, AlertTriangle, Loader2 } from 'lucide-react';

interface ResourceActionsModalProps {
  resource: Resource | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenPreview: (resource: Resource) => void;
}

export const ResourceActionsModal: React.FC<ResourceActionsModalProps> = ({
  resource,
  isOpen,
  onClose,
  onOpenPreview,
}) => {
  const { folders, tags, updateResource, deleteResource, moveResourceFolder, addTagToResource, removeTagFromResource } =
    useVault();

  const [newName, setNewName] = useState<string>(resource?.name || '');
  const [selectedFolderId, setSelectedFolderId] = useState<string>(resource?.folder_id || '');
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  if (!isOpen || !resource) return null;

  const handleSaveName = async () => {
    if (newName.trim() && newName !== resource.name) {
      await updateResource(resource.id, { name: newName.trim() });
    }
    setIsEditingName(false);
  };

  const handleFolderChange = async (folderId: string) => {
    setSelectedFolderId(folderId);
    await moveResourceFolder(resource.id, folderId ? folderId : null);
  };

  const handleConfirmDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    const success = await deleteResource(resource.id);
    setIsDeleting(false);
    if (success !== false) {
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  const resourceTags = resource.tag_ids || [];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
              Resource Options
            </h3>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Rename */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Resource Name</label>
            {isEditingName ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') setIsEditingName(false);
                  }}
                />
                <button
                  onClick={handleSaveName}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                  {resource.name}
                </span>
                <button
                  onClick={() => {
                    setNewName(resource.name);
                    setIsEditingName(true);
                  }}
                  className="p-1 text-slate-400 hover:text-blue-600"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Move Folder */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Folder Location</label>
            <div className="flex items-center gap-2">
              <FolderInput className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={selectedFolderId}
                onChange={(e) => handleFolderChange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">Unorganized (No Folder)</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Manage Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Tags</label>
            <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 max-h-28 overflow-y-auto">
              {tags.map((t) => {
                const isAttached = resourceTags.includes(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      if (isAttached) {
                        removeTagFromResource(resource.id, t.id);
                      } else {
                        addTagToResource(resource.id, t.id);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      isAttached
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    #{t.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Actions */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-rose-200/80 dark:border-rose-900/40"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Resource</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenPreview(resource);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-colors"
            >
              Open & Study
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
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
