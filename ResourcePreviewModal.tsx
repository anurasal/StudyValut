import React, { useState } from 'react';
import { Resource } from '../../types';
import { useVault } from '../../context/VaultContext';
import { summarizePdf } from '../../lib/api';
import { PDFSummaryView } from '../ai/PDFSummaryView';
import { PDFQADrawer } from '../ai/PDFQADrawer';
import {
  X,
  Sparkles,
  MessageSquare,
  ExternalLink,
  Download,
  FileText,
  Youtube,
  Globe,
  Archive,
  FileSpreadsheet,
  FileCode,
  Loader2,
  BookOpen,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

interface ResourcePreviewModalProps {
  resource: Resource | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ResourcePreviewModal: React.FC<ResourcePreviewModalProps> = ({
  resource,
  isOpen,
  onClose,
}) => {
  const { deleteResource } = useVault();
  const [summary, setSummary] = useState<string>('');
  const [summarizing, setSummarizing] = useState<boolean>(false);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [showQADrawer, setShowQADrawer] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  if (!isOpen || !resource) return null;

  const getYouTubeEmbedUrl = (url?: string | null) => {
    if (!url) return null;
    let videoId = '';
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
    } else if (url.includes('youtube.com/watch')) {
      const match = url.match(/v=([^&]+)/);
      if (match) videoId = match[1];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const handleSummarize = async () => {
    setSummarizing(true);
    try {
      const resSummary = await summarizePdf({
        pdfBase64: resource.base64Data,
        textContent: resource.text_content || undefined,
        fileName: resource.name,
      });
      setSummary(resSummary);
      setShowSummaryModal(true);
    } catch (err: any) {
      alert('Failed to generate summary: ' + (err.message || 'Unknown error'));
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden">
        <div className="w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-950/60 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {resource.name}
                </h3>
                <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
                  {resource.resource_type} • Saved {new Date(resource.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* PDF AI Buttons */}
              {resource.resource_type === 'pdf' && (
                <>
                  <button
                    onClick={handleSummarize}
                    disabled={summarizing}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-purple-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {summarizing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Summarizing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Summarize with AI</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowQADrawer(true)}
                    className="px-3 py-1.5 rounded-xl border border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-semibold text-xs hover:bg-purple-100 transition-all flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                    <span>Ask AI</span>
                  </button>
                </>
              )}

              {resource.external_url && (
                <a
                  href={resource.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Open Link"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                title="Delete Resource"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Preview Body */}
          <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-4 sm:p-6 overflow-y-auto flex flex-col items-center justify-center">
            {/* PDF PREVIEW */}
            {resource.resource_type === 'pdf' && (
              <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                {resource.base64Data ? (
                  <iframe
                    src={`data:application/pdf;base64,${resource.base64Data}`}
                    className="w-full h-full rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md"
                    title={resource.name}
                  />
                ) : (
                  <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-3xl max-w-md border border-slate-200 dark:border-slate-800 shadow-lg space-y-3">
                    <BookOpen className="w-12 h-12 text-blue-500 mx-auto" />
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {resource.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      PDF Document • Use AI Summarize or Ask AI to extract study notes.
                    </p>
                    {resource.text_content && (
                      <div className="text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-mono max-h-48 overflow-y-auto">
                        {resource.text_content}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* IMAGE PREVIEW */}
            {resource.resource_type === 'image' && (
              <div className="max-w-full max-h-full flex items-center justify-center">
                {resource.base64Data ? (
                  <img
                    src={`data:${resource.mime_type || 'image/png'};base64,${resource.base64Data}`}
                    alt={resource.name}
                    className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-xl"
                  />
                ) : (
                  <div className="text-center p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {resource.name}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* YOUTUBE PREVIEW */}
            {resource.resource_type === 'youtube' && (
              <div className="w-full max-w-4xl h-full flex flex-col justify-center space-y-4">
                {getYouTubeEmbedUrl(resource.external_url) ? (
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
                    <iframe
                      src={getYouTubeEmbedUrl(resource.external_url)!}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={resource.name}
                    />
                  </div>
                ) : (
                  <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <Youtube className="w-12 h-12 text-red-600 mx-auto" />
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {resource.name}
                    </h4>
                    <a
                      href={resource.external_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white font-semibold text-xs shadow-md"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Open on YouTube</span>
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* WEBSITE PREVIEW */}
            {resource.resource_type === 'website' && (
              <div className="w-full max-w-2xl text-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                  <Globe className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                    {resource.name}
                  </h4>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-mono break-all">
                    {resource.external_url}
                  </p>
                </div>
                {resource.text_content && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                    {resource.text_content}
                  </p>
                )}
                <a
                  href={resource.external_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Visit Website</span>
                </a>
              </div>
            )}

            {/* TEXT / NOTES PREVIEW */}
            {resource.resource_type === 'text' && (
              <div className="w-full max-w-3xl bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-y-auto max-h-[75vh]">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                  {resource.name}
                </h4>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {resource.text_content || 'No text content available.'}
                </div>
              </div>
            )}

            {/* DOCUMENT / PPT / ZIP PREVIEW FALLBACK */}
            {['doc', 'ppt', 'zip'].includes(resource.resource_type) && (
              <div className="w-full max-w-md text-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center">
                  {resource.resource_type === 'zip' ? (
                    <Archive className="w-8 h-8 text-purple-500" />
                  ) : resource.resource_type === 'ppt' ? (
                    <FileSpreadsheet className="w-8 h-8 text-amber-500" />
                  ) : (
                    <FileCode className="w-8 h-8 text-indigo-500" />
                  )}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {resource.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 uppercase font-semibold">
                    {resource.resource_type} Format
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-400 space-y-1 text-left">
                  <p>
                    <strong>File Name:</strong> {resource.name}
                  </p>
                  <p>
                    <strong>Uploaded:</strong> {new Date(resource.created_at).toLocaleString()}
                  </p>
                </div>
                <p className="text-[11px] text-slate-400 italic">
                  In-browser preview is available for PDF, Images, Text, and Web URLs. For PowerPoint, Word, and ZIP archives, download or open locally.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <PDFSummaryView
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        summary={summary}
        resourceName={resource.name}
      />

      <PDFQADrawer
        isOpen={showQADrawer}
        onClose={() => setShowQADrawer(false)}
        pdfBase64={resource.base64Data}
        textContent={resource.text_content || undefined}
        fileName={resource.name}
      />

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
                onClick={async () => {
                  if (isDeleting) return;
                  setIsDeleting(true);
                  const success = await deleteResource(resource.id);
                  setIsDeleting(false);
                  if (success !== false) {
                    setShowDeleteConfirm(false);
                    onClose();
                  }
                }}
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
