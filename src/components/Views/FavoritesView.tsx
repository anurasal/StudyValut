import React from 'react';
import { useVault } from '../../context/VaultContext';
import { ResourceGrid } from '../resources/ResourceGrid';
import { Resource } from '../../types';
import { Star } from 'lucide-react';

interface FavoritesViewProps {
  onOpenPreview: (resource: Resource) => void;
  onOpenUpload: () => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({ onOpenPreview, onOpenUpload }) => {
  const { resources } = useVault();
  const favoriteResources = resources.filter((r) => r.is_favorite);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500">
          <Star className="w-6 h-6 fill-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Favorites
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Quick access to your starred study materials and high-yield notes.
          </p>
        </div>
      </div>

      <ResourceGrid
        resources={favoriteResources}
        onOpenPreview={onOpenPreview}
        onOpenUpload={onOpenUpload}
        emptyTitle="No favorite resources starred"
        emptyDescription="Click the star icon on any resource card to add it to your Favorites."
      />
    </div>
  );
};
