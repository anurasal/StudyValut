import React, { useState } from 'react';
import { useVault } from '../../context/VaultContext';
import { ResourceGrid } from '../resources/ResourceGrid';
import { Resource } from '../../types';
import { Folder as FolderIcon, Edit2, Trash2, Check, AlertTriangle, X } from 'lucide-react';

interface FolderDetailViewProps {
  folderId: string;
  onOpenPreview: (resource: Resource) => void;
  onOpenUpload: () => void;
}

export const FolderDetailView: React.FC<FolderDetailViewProps> = ({
  folderId,
  onOpenPreview,
  onOpenUpload,
}) => {
  const { folders, getFolderResources, renameFolder, deleteFolder, setActiveView } = useVault();

  const folder = folders.find((f) => f.id === folderId);
  const resources = folder ? getFolderResources(folder.id) : [];

  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [folderNameInput, setFolderNameInput] = useState<string>(folder?.name || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  if (!folder) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm font-semibold text-slate-500">Folder not found.</p>
        <button
          onClick={() => setActiveView('vault')}
          className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
        >
          Back to Vault
        </button>
      </div>
    );
  }

  const handleSaveName = async () => {
    if (folderNameInput.trim() && folderNameInput !== folder.name) {
      await renameFolder(folder.id, folderNameInput.trim());
    }
    setIsEditingName(false);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    await deleteFolder(folder.id);
    setIsDeleting(false);
    setShowDeleteConfirm(false);
    setActiveView('vault');
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div
            className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60"
            style={{ color: folder.color || '#3B82F6' }}
          >
            <FolderIcon className="w-8 h-8" />
          </div>

          <div>
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={folderNameInput}
                  onChange={(e) => setFolderNameInput(e.target.value)}
                  className="px-3 py-1 text-base font-bold rounded-xl border border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') setIsEditingName(false);
                  }}
                />
                <button
                  onClick={handleSaveName}
                  className="p-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {folder.name}
                </h1>
                <button
                  onClick={() => {
                    setFolderNameInput(folder.name);
                    setIsEditingName(true);
                  }}
                  className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                  title="Rename Folder"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {resources.length} resources stored in this folder
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="px-3.5 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-semibold flex items-center gap-2 transition-all self-start sm:self-auto border border-rose-200 dark:border-rose-900/40"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Folder</span>
        </button>
      </div>

      <ResourceGrid
        resources={resources}
        onOpenPreview={onOpenPreview}
        onOpenUpload={onOpenUpload}
        emptyTitle={`Folder "${folder.name}" is empty`}
        emptyDescription="Upload resources or move existing resources into this folder."
      />

      {/* Delete Folder Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Folder?</h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-white">"{folder.name}"</strong>? Resources inside will not be deleted; they will be moved to <span className="italic">Unorganized Vault</span>.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md shadow-rose-500/20 transition-all disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Folder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

