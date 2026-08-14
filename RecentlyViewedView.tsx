import React from 'react';
import { useVault } from '../../context/VaultContext';
import { ResourceGrid } from '../resources/ResourceGrid';
import { Resource } from '../../types';
import { Clock } from 'lucide-react';

interface RecentlyViewedViewProps {
  onOpenPreview: (resource: Resource) => void;
  onOpenUpload: () => void;
}

export const RecentlyViewedView: React.FC<RecentlyViewedViewProps> = ({
  onOpenPreview,
  onOpenUpload,
}) => {
  const { resources } = useVault();

  const recentResources = [...resources]
    .filter((r) => r.last_viewed_at)
    .sort(
      (a, b) => new Date(b.last_viewed_at!).getTime() - new Date(a.last_viewed_at!).getTime()
    );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Recently Viewed
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Resources you have opened and studied recently.
          </p>
        </div>
      </div>

      <ResourceGrid
        resources={recentResources}
        onOpenPreview={onOpenPreview}
        onOpenUpload={onOpenUpload}
        emptyTitle="No recently viewed resources"
        emptyDescription="Open resources from your vault to see them listed here automatically."
      />
    </div>
  );
};
