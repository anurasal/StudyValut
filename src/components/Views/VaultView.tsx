import React from 'react';
import { useVault } from '../../context/VaultContext';
import { ResourceGrid } from '../resources/ResourceGrid';
import { Resource } from '../../types';

interface VaultViewProps {
  onOpenPreview: (resource: Resource) => void;
  onOpenUpload: () => void;
}

export const VaultView: React.FC<VaultViewProps> = ({ onOpenPreview, onOpenUpload }) => {
  const { resources } = useVault();

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            My Vault
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            All your saved exam question papers, notes, decks, and web references.
          </p>
        </div>
      </div>

      <ResourceGrid
        resources={resources}
        onOpenPreview={onOpenPreview}
        onOpenUpload={onOpenUpload}
      />
    </div>
  );
};
