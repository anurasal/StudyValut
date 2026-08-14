import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { VaultProvider, useVault } from './context/VaultContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { ToastContainer } from './components/layout/Toast';
import { AuthModal } from './components/auth/AuthModal';
import { UploadModal } from './components/upload/UploadModal';
import { ResourcePreviewModal } from './components/preview/ResourcePreviewModal';

import { DashboardView } from './components/views/DashboardView';
import { VaultView } from './components/views/VaultView';
import { FavoritesView } from './components/views/FavoritesView';
import { RecentlyViewedView } from './components/views/RecentlyViewedView';
import { FolderDetailView } from './components/views/FolderDetailView';
import { SettingsView } from './components/views/SettingsView';

import { Resource } from './types';

function MainLayout() {
  const { user, loading: authLoading } = useAuth();
  const { activeView, activeFolderId } = useVault();

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return (
      localStorage.getItem('studyvault_theme') === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  });

  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [selectedPreviewResource, setSelectedPreviewResource] = useState<Resource | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('studyvault_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('studyvault_theme', 'light');
    }
  }, [isDarkMode]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-900 dark:text-white">
        <div className="flex items-center gap-3 font-semibold text-sm">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading StudyVault...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row font-sans transition-colors duration-200">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        onOpenUpload={() => setIsUploadOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <TopHeader
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onOpenUpload={() => setIsUploadOpen(true)}
        />

        <main className="flex-1 px-4 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          {activeView === 'dashboard' && (
            <DashboardView
              onOpenUpload={() => setIsUploadOpen(true)}
              onOpenPreview={(res) => setSelectedPreviewResource(res)}
            />
          )}

          {activeView === 'vault' && (
            <VaultView
              onOpenPreview={(res) => setSelectedPreviewResource(res)}
              onOpenUpload={() => setIsUploadOpen(true)}
            />
          )}

          {activeView === 'favorites' && (
            <FavoritesView
              onOpenPreview={(res) => setSelectedPreviewResource(res)}
              onOpenUpload={() => setIsUploadOpen(true)}
            />
          )}

          {activeView === 'recent' && (
            <RecentlyViewedView
              onOpenPreview={(res) => setSelectedPreviewResource(res)}
              onOpenUpload={() => setIsUploadOpen(true)}
            />
          )}

          {activeView === 'folder' && activeFolderId && (
            <FolderDetailView
              folderId={activeFolderId}
              onOpenPreview={(res) => setSelectedPreviewResource(res)}
              onOpenUpload={() => setIsUploadOpen(true)}
            />
          )}

          {activeView === 'settings' && (
            <SettingsView
              isDarkMode={isDarkMode}
              onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
            />
          )}
        </main>
      </div>

      {/* Modals & Overlays */}
      <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />

      <ResourcePreviewModal
        resource={selectedPreviewResource}
        isOpen={Boolean(selectedPreviewResource)}
        onClose={() => setSelectedPreviewResource(null)}
      />

      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <VaultProvider>
        <MainLayout />
      </VaultProvider>
    </AuthProvider>
  );
}
