import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Resource, Folder, Tag, ResourceType, ToastMessage, FilterOptions } from '../types';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured, BUCKET_NAME } from '../lib/supabase';

interface VaultContextType {
  resources: Resource[];
  folders: Folder[];
  tags: Tag[];
  loading: boolean;
  toasts: ToastMessage[];
  activeView: 'dashboard' | 'vault' | 'favorites' | 'recent' | 'folder' | 'settings';
  activeFolderId: string | null;
  filterOptions: FilterOptions;

  setActiveView: (
    view: 'dashboard' | 'vault' | 'favorites' | 'recent' | 'folder' | 'settings',
    folderId?: string
  ) => void;
  setFilterOptions: React.Dispatch<React.SetStateAction<FilterOptions>>;
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
  removeToast: (id: string) => void;

  createResource: (data: {
    name: string;
    resource_type: ResourceType;
    folder_id?: string;
    tag_ids?: string[];
    external_url?: string;
    text_content?: string;
    file?: File;
  }) => Promise<Resource | null>;
  updateResource: (id: string, updates: Partial<Resource>) => Promise<void>;
  deleteResource: (id: string) => Promise<boolean>;
  toggleFavorite: (id: string) => Promise<void>;
  touchLastViewed: (id: string) => Promise<void>;

  createFolder: (name: string, color?: string) => Promise<Folder | null>;
  renameFolder: (id: string, newName: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;

  createTag: (name: string, color?: string) => Promise<Tag | null>;
  renameTag: (id: string, newName: string) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;

  addTagToResource: (resourceId: string, tagId: string) => Promise<void>;
  removeTagFromResource: (resourceId: string, tagId: string) => Promise<void>;
  moveResourceFolder: (resourceId: string, folderId: string | null) => Promise<void>;

  getFolderResources: (folderId: string) => Resource[];
  getStorageUsedBytes: () => number;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

// Demo seed data is kept in the source but is NO LONGER automatically loaded.
// New users now start with an empty vault.

const SEED_FOLDERS: Folder[] = [
  {
    id: 'f-1',
    user_id: 'demo-student-id-101',
    name: 'Database Management Systems',
    color: '#3B82F6',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'f-2',
    user_id: 'demo-student-id-101',
    name: 'Semester 4 Mid-Terms',
    color: '#10B981',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'f-3',
    user_id: 'demo-student-id-101',
    name: 'Algorithms & Data Structures',
    color: '#8B5CF6',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const SEED_TAGS: Tag[] = [
  {
    id: 't-1',
    user_id: 'demo-student-id-101',
    name: 'Important',
    color: '#EF4444',
    created_at: new Date().toISOString(),
  },
  {
    id: 't-2',
    user_id: 'demo-student-id-101',
    name: 'Exam Prep',
    color: '#F59E0B',
    created_at: new Date().toISOString(),
  },
  {
    id: 't-3',
    user_id: 'demo-student-id-101',
    name: 'Previous Year',
    color: '#10B981',
    created_at: new Date().toISOString(),
  },
  {
    id: 't-4',
    user_id: 'demo-student-id-101',
    name: 'Revision',
    color: '#6366F1',
    created_at: new Date().toISOString(),
  },
];

const SEED_RESOURCES: Resource[] = [
  {
    id: 'r-1',
    user_id: 'demo-student-id-101',
    folder_id: 'f-1',
    name: 'DBMS Normalization & BCNF Notes',
    resource_type: 'pdf',
    file_size: 2450000,
    mime_type: 'application/pdf',
    text_content: `DATABASE MANAGEMENT SYSTEMS: NORMALIZATION & BCNF GUIDELINES

1. First Normal Form (1NF):
Each column must contain atomic (indivisible) values, and each entry in a column must be of the same data type. No repeating groups allowed.

2. Second Normal Form (2NF):
Must be in 1NF and all non-key attributes must be fully functionally dependent on the primary key. Eliminates partial dependency.

3. Third Normal Form (3NF):
Must be in 2NF and no non-prime attribute is transitively dependent on the primary key. If X -> Y, then X is a superkey or Y is a prime attribute.

4. Boyce-Codd Normal Form (BCNF):
A stricter version of 3NF. For every non-trivial functional dependency X -> Y, X MUST be a super key.

Exam Tip: Remember that BCNF preserves functional dependencies in most cases, but losslessness is guaranteed for 3NF and BCNF decomposition.`,
    is_favorite: true,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    last_viewed_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    tag_ids: ['t-1', 't-2'],
  },
  {
    id: 'r-2',
    user_id: 'demo-student-id-101',
    folder_id: 'f-2',
    name: '2025 Mid-Term Question Paper with Solutions',
    resource_type: 'pdf',
    file_size: 1850000,
    mime_type: 'application/pdf',
    text_content: `SEMESTER 4 EXAMINATION - DATABASE & SYSTEM ARCHITECTURE

Section A (Short Questions - 5 x 4 marks):
1. Differentiate between DDL and DML statements with examples.
2. Explain ACID properties in DBMS transaction management.
3. What is a Deadlock in OS processes? List two prevention strategies.

Section B (Detailed Problems - 3 x 10 marks):
1. Given Relation R(A,B,C,D,E) with FDs { A->BC, CD->E, B->D }. Find Key and normalize to BCNF.
2. Construct B+ Tree of order 4 for insertion sequence [10, 20, 5, 15, 25, 30, 22].`,
    is_favorite: true,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    last_viewed_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    tag_ids: ['t-1', 't-3'],
  },
  {
    id: 'r-3',
    user_id: 'demo-student-id-101',
    folder_id: 'f-3',
    name: 'Graph Algorithms & Dynamic Programming Overview',
    resource_type: 'youtube',
    external_url: 'https://www.youtube.com/watch?v=09_LlHjoEiY',
    text_content:
      'Comprehensive video lecture explaining Dijkstra Algorithm, Bellman-Ford, Floyd-Warshall, and Dynamic Programming Memoization.',
    is_favorite: false,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    last_viewed_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    tag_ids: ['t-2', 't-4'],
  },
  {
    id: 'r-4',
    user_id: 'demo-student-id-101',
    folder_id: 'f-1',
    name: 'Relational Algebra & SQL Cheatsheet',
    resource_type: 'website',
    external_url: 'https://sqltutorial.org/sql-cheat-sheet/',
    text_content:
      'Essential SQL joins syntax, GROUP BY HAVING clauses, subqueries, and window functions reference.',
    is_favorite: false,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    last_viewed_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    tag_ids: ['t-4'],
  },
];

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [resources, setResources] = useState<Resource[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [activeView, setActiveViewRaw] = useState<
    'dashboard' | 'vault' | 'favorites' | 'recent' | 'folder' | 'settings'
  >('dashboard');

  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    searchQuery: '',
    resourceType: 'all',
    folderId: 'all',
    tagId: 'all',
    sortBy: 'newest',
  });

  const addToast = useCallback(
    (type: 'success' | 'error' | 'info', message: string) => {
      const id =
        'toast-' +
        Date.now() +
        '-' +
        Math.random().toString(36).substr(2, 4);

      setToasts((prev) => [...prev, { id, type, message }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const setActiveView = useCallback(
    (
      view:
        | 'dashboard'
        | 'vault'
        | 'favorites'
        | 'recent'
        | 'folder'
        | 'settings',
      folderId?: string
    ) => {
      setActiveViewRaw(view);

      if (view === 'folder' && folderId) {
        setActiveFolderId(folderId);
      } else if (view !== 'folder') {
        setActiveFolderId(null);
      }
    },
    []
  );

  // Sync data whenever user or connection mode changes
  useEffect(() => {
    if (!user) {
      setResources([]);
      setFolders([]);
      setTags([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    async function loadData() {
      if (isSupabaseConfigured && supabase) {
        try {
          const [foldersRes, tagsRes, resourcesRes, resTagsRes] =
            await Promise.all([
              supabase
                .from('folders')
                .select('*')
                .eq('user_id', user!.id)
                .order('name'),

              supabase
                .from('tags')
                .select('*')
                .eq('user_id', user!.id)
                .order('name'),

              supabase
                .from('resources')
                .select('*')
                .eq('user_id', user!.id)
                .order('created_at', { ascending: false }),

              supabase.from('resource_tags').select('*'),
            ]);

          if (isMounted) {
            const fetchedFolders = foldersRes.data || [];
            const fetchedTags = tagsRes.data || [];
            const fetchedResources = resourcesRes.data || [];
            const fetchedResTags = resTagsRes.data || [];

            const processedResources: Resource[] = fetchedResources.map(
              (resItem) => {
                const tagIds = fetchedResTags
                  .filter((rt) => rt.resource_id === resItem.id)
                  .map((rt) => rt.tag_id);

                return {
                  ...resItem,
                  tag_ids: tagIds,
                };
              }
            );

            setFolders(fetchedFolders);
            setTags(fetchedTags);
            setResources(processedResources);
          }
        } catch (err) {
          console.error('Error fetching Supabase vault data:', err);
        }
      } else {
        // Local persistence mode
        const localKey = `studyvault_data_${user.id}`;
        const stored = localStorage.getItem(localKey);

        if (stored) {
          try {
            const parsed = JSON.parse(stored);

            if (isMounted) {
              setFolders(parsed.folders || []);
              setTags(parsed.tags || []);
              setResources(parsed.resources || []);
            }
          } catch {
            // Corrupted local data: reset to an empty vault.
            if (isMounted) {
              setFolders([]);
              setTags([]);
              setResources([]);
              localStorage.removeItem(localKey);
            }
          }
        } else {
          // New user: start with an empty vault.
          if (isMounted) {
            const emptyData = {
              folders: [],
              tags: [],
              resources: [],
            };

            setFolders([]);
            setTags([]);
            setResources([]);

            localStorage.setItem(localKey, JSON.stringify(emptyData));
          }
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Persist local store updates
  const saveLocalState = (
    newResources: Resource[],
    newFolders: Folder[],
    newTags: Tag[]
  ) => {
    if (!user || isSupabaseConfigured) return;

    const localKey = `studyvault_data_${user.id}`;

    localStorage.setItem(
      localKey,
      JSON.stringify({
        resources: newResources,
        folders: newFolders,
        tags: newTags,
      })
    );
  };

  // Create Resource
  const createResource = async (data: {
    name: string;
    resource_type: ResourceType;
    folder_id?: string;
    tag_ids?: string[];
    external_url?: string;
    text_content?: string;
    file?: File;
  }): Promise<Resource | null> => {
    if (!user) return null;

    let filePath: string | null = null;
    let fileSize: number | null = null;
    let mimeType: string | null = null;
    let base64Data: string | undefined = undefined;

    if (data.file) {
      fileSize = data.file.size;
      mimeType = data.file.type || 'application/octet-stream';

      try {
        base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();

          reader.onload = () => {
            const result = reader.result as string;
            const pureBase64 = result.includes(',')
              ? result.split(',')[1]
              : result;

            resolve(pureBase64);
          };

          reader.onerror = reject;
          reader.readAsDataURL(data.file!);
        });
      } catch (e) {
        console.warn('Failed to read file as base64:', e);
      }

      if (isSupabaseConfigured && supabase) {
        try {
          const sanitizedName = data.file.name.replace(
            /[^a-zA-Z0-9.-]/g,
            '_'
          );

          const storagePath = `${user.id}/${Date.now()}_${sanitizedName}`;

          const { data: uploadData, error: uploadErr } =
            await supabase.storage
              .from(BUCKET_NAME)
              .upload(storagePath, data.file, {
                cacheControl: '3600',
                upsert: true,
              });

          if (uploadErr) {
            console.error('Storage upload error:', uploadErr);
          } else {
            filePath = uploadData?.path || storagePath;
          }
        } catch (err) {
          console.error('Storage upload exception:', err);
        }
      } else {
        filePath = `local_storage/${Date.now()}_${data.file.name}`;
      }
    }

    const newResource: Resource = {
      id:
        'res-' +
        Date.now() +
        '-' +
        Math.random().toString(36).substr(2, 4),
      user_id: user.id,
      folder_id: data.folder_id || null,
      name: data.name,
      resource_type: data.resource_type,
      file_path: filePath,
      file_size: fileSize,
      mime_type: mimeType,
      external_url: data.external_url || null,
      text_content: data.text_content || null,
      is_favorite: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_viewed_at: new Date().toISOString(),
      tag_ids: data.tag_ids || [],
      base64Data,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: inserted, error } = await supabase
          .from('resources')
          .insert({
            user_id: user.id,
            folder_id: newResource.folder_id,
            name: newResource.name,
            resource_type: newResource.resource_type,
            file_path: newResource.file_path,
            file_size: newResource.file_size,
            mime_type: newResource.mime_type,
            external_url: newResource.external_url,
            text_content: newResource.text_content,
            is_favorite: false,
            created_at: newResource.created_at,
            updated_at: newResource.updated_at,
            last_viewed_at: newResource.last_viewed_at,
          })
          .select()
          .single();

        if (error) {
          console.error('Database resource insert error:', error);
          addToast('error', 'Failed to save resource to database');
          return null;
        }

        const dbResource = inserted;

        if (data.tag_ids && data.tag_ids.length > 0) {
          const tagLinks = data.tag_ids.map((tagId) => ({
            resource_id: dbResource.id,
            tag_id: tagId,
          }));

          try {
            await supabase.from('resource_tags').insert(tagLinks);
          } catch (err) {
            console.error(err);
          }
        }

        const finalResource: Resource = {
          ...dbResource,
          tag_ids: data.tag_ids || [],
          base64Data,
        };

        setResources((prev) => [finalResource, ...prev]);
        addToast('success', `Saved "${finalResource.name}"`);

        return finalResource;
      } catch (err: any) {
        addToast('error', err.message || 'Upload failed');
        return null;
      }
    } else {
      const updatedList = [newResource, ...resources];

      setResources(updatedList);
      saveLocalState(updatedList, folders, tags);

      addToast('success', `Saved "${newResource.name}"`);

      return newResource;
    }
  };

  // Update Resource
  const updateResource = async (
    id: string,
    updates: Partial<Resource>
  ) => {
    const now = new Date().toISOString();

    const updatedList = resources.map((r) =>
      r.id === id
        ? {
            ...r,
            ...updates,
            updated_at: now,
          }
        : r
    );

    setResources(updatedList);

    if (isSupabaseConfigured && supabase) {
      const { tag_ids, base64Data, ...dbUpdates } = updates as any;

      try {
        await supabase
          .from('resources')
          .update({
            ...dbUpdates,
            updated_at: now,
          })
          .eq('id', id);
      } catch (err) {
        console.error(err);
      }
    } else {
      saveLocalState(updatedList, folders, tags);
    }
  };

  // Delete Resource
  const deleteResource = async (id: string): Promise<boolean> => {
    if (!user) {
      addToast('error', 'Authentication required to delete resources.');
      return false;
    }

    const target = resources.find((r) => r.id === id);

    if (!target) {
      return true;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error: tagLinkErr } = await supabase
          .from('resource_tags')
          .delete()
          .eq('resource_id', id);

        if (tagLinkErr) {
          console.warn('Note deleting resource_tags:', tagLinkErr);
        }

        const isUuid =
          /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
            id
          );

        if (isUuid) {
          const { error: dbErr } = await supabase
            .from('resources')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

          if (dbErr) {
            console.error('Supabase resource delete error:', dbErr);
            addToast(
              'error',
              `Failed to delete resource: ${dbErr.message}`
            );
            return false;
          }
        } else {
          console.info(
            `Resource ID ${id} is non-UUID (seed/local item), removing locally.`
          );
        }

        const isStoragePath =
          target.file_path &&
          !target.file_path.startsWith('http://') &&
          !target.file_path.startsWith('https://') &&
          !target.file_path.startsWith('local_storage/') &&
          !target.file_path.startsWith('data:');

        if (isStoragePath) {
          const { error: storageErr } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([target.file_path]);

          if (storageErr) {
            console.error(
              'Sup
