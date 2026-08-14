import React, { useState, useRef } from 'react';
import { useVault } from '../../context/VaultContext';
import { suggestOrganization } from '../../lib/api';
import {
  X,
  UploadCloud,
  FileText,
  Link as LinkIcon,
  Youtube,
  Globe,
  Sparkles,
  FolderPlus,
  Tag as TagIcon,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { ResourceType, AISuggestion } from '../../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose }) => {
  const { folders, tags, createResource, createFolder, createTag, addToast } = useVault();

  const [mode, setMode] = useState<'file' | 'url'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState<string>('');
  const [resourceName, setResourceName] = useState<string>('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [textContent, setTextContent] = useState<string>('');

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [aiAnalyzing, setAiAnalyzing] = useState<boolean>(false);
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const detectResourceType = (file?: File, url?: string): ResourceType => {
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (['pdf'].includes(ext)) return 'pdf';
      if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) return 'image';
      if (['ppt', 'pptx'].includes(ext)) return 'ppt';
      if (['doc', 'docx'].includes(ext)) return 'doc';
      if (['txt', 'md', 'csv'].includes(ext)) return 'text';
      if (['zip', 'tar', 'gz', '7z', 'rar'].includes(ext)) return 'zip';
    }
    if (url) {
      if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
      return 'website';
    }
    return 'pdf';
  };

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    if (!resourceName) {
      // Remove file extension for name default
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setResourceName(nameWithoutExt);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // AI Feature 1: Trigger Gemini Organization Suggestions
  const handleRunAiAnalysis = async () => {
    const name = resourceName || selectedFile?.name || urlInput;
    if (!name) {
      addToast('info', 'Please select a file or input a URL first');
      return;
    }

    setAiAnalyzing(true);
    const type = detectResourceType(selectedFile || undefined, urlInput);

    try {
      const existingFolderNames = folders.map((f) => f.name);
      const existingTagNames = tags.map((t) => t.name);

      const res = await suggestOrganization({
        resourceName: name,
        resourceType: type,
        textSnippet: textContent,
        existingFolders: existingFolderNames,
        existingTags: existingTagNames,
      });

      if (res) {
        setAiSuggestion(res);
        addToast('success', 'AI suggested tags & folder');
      } else {
        addToast('info', 'Could not generate AI suggestions');
      }
    } catch (err) {
      console.error(err);
      addToast('error', 'AI analysis failed');
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Accept AI Suggestions
  const handleAcceptAiSuggestions = async () => {
    if (!aiSuggestion) return;

    // Handle Folder
    if (aiSuggestion.suggestedFolderName) {
      const matchFolder = folders.find(
        (f) => f.name.toLowerCase() === aiSuggestion.suggestedFolderName?.toLowerCase()
      );
      if (matchFolder) {
        setSelectedFolderId(matchFolder.id);
      } else {
        // Create new folder automatically
        const created = await createFolder(aiSuggestion.suggestedFolderName);
        if (created) setSelectedFolderId(created.id);
      }
    }

    // Handle Tags
    if (aiSuggestion.suggestedTags && aiSuggestion.suggestedTags.length > 0) {
      const tagIdsToAdd: string[] = [...selectedTagIds];

      for (const tagName of aiSuggestion.suggestedTags) {
        const matchTag = tags.find((t) => t.name.toLowerCase() === tagName.toLowerCase());
        if (matchTag) {
          if (!tagIdsToAdd.includes(matchTag.id)) tagIdsToAdd.push(matchTag.id);
        } else {
          const created = await createTag(tagName);
          if (created && !tagIdsToAdd.includes(created.id)) tagIdsToAdd.push(created.id);
        }
      }
      setSelectedTagIds(tagIdsToAdd);
    }

    setAiSuggestion(null);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'file' && !selectedFile) {
      addToast('error', 'Please select a file to upload');
      return;
    }
    if (mode === 'url' && !urlInput.trim()) {
      addToast('error', 'Please enter a valid URL');
      return;
    }

    setUploading(true);
    setUploadProgress(20);

    const type = detectResourceType(selectedFile || undefined, urlInput);
    const finalName = resourceName.trim() || selectedFile?.name || urlInput.trim();

    try {
      setUploadProgress(50);
      const res = await createResource({
        name: finalName,
        resource_type: type,
        folder_id: selectedFolderId || undefined,
        tag_ids: selectedTagIds,
        external_url: mode === 'url' ? urlInput.trim() : undefined,
        text_content: textContent.trim() || undefined,
        file: mode === 'file' ? selectedFile || undefined : undefined,
      });

      setUploadProgress(100);
      if (res) {
        onClose();
        // Reset state
        setSelectedFile(null);
        setUrlInput('');
        setResourceName('');
        setSelectedFolderId('');
        setSelectedTagIds([]);
        setTextContent('');
        setAiSuggestion(null);
      }
    } catch (err: any) {
      addToast('error', err.message || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Save Resource</h3>
              <p className="text-xs text-slate-500">Upload exam papers, notes, slides, or save URLs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleUploadSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/60">
            <button
              type="button"
              onClick={() => setMode('file')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                mode === 'file'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>File Upload (PDF, Docs, ZIP)</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('url')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                mode === 'url'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <LinkIcon className="w-4 h-4" />
              <span>Link (YouTube / Website)</span>
            </button>
          </div>

          {/* Drag & Drop File Zone */}
          {mode === 'file' && (
            <div>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 scale-[1.01]'
                    : selectedFile
                    ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20'
                    : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-950/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.ppt,.pptx,.doc,.docx,.txt,.zip"
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="flex items-center justify-center gap-3 text-left">
                    <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Click or drag to replace
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <UploadCloud className="w-8 h-8 mx-auto text-blue-500 mb-2 stroke-[1.5]" />
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Drop exam papers or files here, or <span className="text-blue-600">browse</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Supports PDF, PNG, JPG, WEBP, PPT/PPTX, DOC/DOCX, TXT, ZIP
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* URL Input */}
          {mode === 'url' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Resource URL (YouTube video or study website)
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=... or https://..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Resource Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Resource Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. DBMS Normalization Exam Notes 2025"
              value={resourceName}
              onChange={(e) => setResourceName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Folder & Tag Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Folder
              </label>
              <select
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Folder (Unorganized Vault)</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Attach Tags
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
                {tags.map((t) => {
                  const isChecked = selectedTagIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTag(t.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        isChecked
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      #{t.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* AI Organization Suggestion Action */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 border border-purple-200/80 dark:border-purple-800/60 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-bold text-purple-900 dark:text-purple-200">
                  AI Smart Auto-Organize
                </span>
              </div>
              <button
                type="button"
                onClick={handleRunAiAnalysis}
                disabled={aiAnalyzing}
                className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {aiAnalyzing ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <span>Analyze Resource</span>
                )}
              </button>
            </div>

            {aiSuggestion && (
              <div className="mt-2 p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-purple-200 dark:border-purple-800 text-xs space-y-2">
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Suggested Folder:
                  </span>{' '}
                  <span className="font-bold text-purple-600 dark:text-purple-400">
                    {aiSuggestion.suggestedFolderName || 'None'}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Suggested Tags:
                  </span>{' '}
                  {aiSuggestion.suggestedTags?.map((tag) => (
                    <span
                      key={tag}
                      className="inline-block px-1.5 py-0.5 mr-1 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-[10px] font-semibold"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleAcceptAiSuggestions}
                    className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700"
                  >
                    Accept Suggestions
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiSuggestion(null)}
                    className="px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px]"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span>Saving to StudyVault...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {uploading ? 'Saving...' : 'Save Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
