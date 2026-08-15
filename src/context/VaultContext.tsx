import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import {
  Resource,
  Folder,
  Tag,
  ResourceType,
  ToastMessage,
  FilterOptions,
} from '../types';
import { useAuth } from './AuthContext';
import {
  supabase,
  isSupabaseConfigured,
  BUCKET_NAME,
} from '../lib/supabase';

interface VaultContextType {
  resources: Resource[];
  folders: Folder[];
  tags: Tag[];
  loading: boolean;
  toasts: ToastMessage[];
  activeView:
    | 'dashboard'
    | 'vault'
    | 'favorites'
    | 'recent'
    | 'folder'
    | 'settings';
  activeFolderId: string | null;
  filterOptions: FilterOptions;

  setActiveView: (
    view:
      | 'dashboard'
      | 'vault'
      | 'favorites'
      | 'recent'
      | 'folder'
      | 'settings',
    folderId?: string
  ) => void;

  setFilterOptions: React.Dispatch<
    React.SetStateAction<FilterOptions>
  >;

  addToast: (
    type: 'success' | 'error' | 'info',
    message: string
  ) => void;

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

  updateResource: (
    id: string,
    updates: Partial<Resource>
  ) => Promise<void>;

  deleteResource: (id: string) => Promise<boolean>;

  toggleFavorite: (id: string) => Promise<void>;

  touchLastViewed: (id: string) => Promise<void>;

  createFolder: (
    name: string,
    color?: string
  ) => Promise<Folder | null>;

  renameFolder: (
    id: string,
    newName: string
  ) => Promise<void>;

  deleteFolder: (id: string) => Promise<void>;

  createTag: (
    name: string,
    color?: string
  ) => Promise<Tag | null>;

  renameTag: (
    id: string,
    newName: string
  ) => Promise<void>;

  deleteTag: (id: string) => Promise<void>;

  addTagToResource: (
    resourceId: string,
    tagId: string
  ) => Promise<void>;

  removeTagFromResource: (
    resourceId: string,
    tagId: string
  ) => Promise<void>;

  moveResourceFolder: (
    resourceId: string,
    folderId: string | null
  ) => Promise<void>;

  getFolderResources: (
    folderId: string
  ) => Resource[];

  getStorageUsedBytes: () => number;
}

const VaultContext = createContext<
  VaultContextType | undefined
>(undefined);

export const VaultProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { user } = useAuth();

  const [resources, setResources] = useState<Resource[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [activeView, setActiveViewRaw] = useState<
    | 'dashboard'
    | 'vault'
    | 'favorites'
    | 'recent'
    | 'folder'
    | 'settings'
  >('dashboard');

  const [activeFolderId, setActiveFolderId] =
    useState<string | null>(null);

  const [filterOptions, setFilterOptions] =
    useState<FilterOptions>({
      searchQuery: '',
      resourceType: 'all',
      folderId: 'all',
      tagId: 'all',
      sortBy: 'newest',
    });

  // ------------------------------------------------------------
  // Toasts
  // ------------------------------------------------------------

  const addToast = useCallback(
    (
      type: 'success' | 'error' | 'info',
      message: string
    ) => {
      const id =
        'toast-' +
        Date.now() +
        '-' +
        Math.random()
          .toString(36)
          .substring(2, 8);

      setToasts((prev) => [
        ...prev,
        {
          id,
          type,
          message,
        },
      ]);

      setTimeout(() => {
        setToasts((prev) =>
          prev.filter((toast) => toast.id !== id)
        );
      }, 4000);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.filter((toast) => toast.id !== id)
    );
  }, []);

  // ------------------------------------------------------------
  // Navigation
  // ------------------------------------------------------------

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

  // ------------------------------------------------------------
  // Local Storage
  // ------------------------------------------------------------

  const saveLocalState = useCallback(
    (
      newResources: Resource[],
      newFolders: Folder[],
      newTags: Tag[]
    ) => {
      if (!user || isSupabaseConfigured) {
        return;
      }

      const localKey = `studyvault_data_${user.id}`;

      localStorage.setItem(
        localKey,
        JSON.stringify({
          resources: newResources,
          folders: newFolders,
          tags: newTags,
        })
      );
    },
    [user]
  );

  // ------------------------------------------------------------
  // Load user data
  // ------------------------------------------------------------

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

    const loadData = async () => {
      try {
        // --------------------------------------------------------
        // Supabase mode
        // --------------------------------------------------------

        if (isSupabaseConfigured && supabase) {
          const [
            foldersRes,
            tagsRes,
            resourcesRes,
            resourceTagsRes,
          ] = await Promise.all([
            supabase
              .from('folders')
              .select('*')
              .eq('user_id', user.id)
              .order('name'),

            supabase
              .from('tags')
              .select('*')
              .eq('user_id', user.id)
              .order('name'),

            supabase
              .from('resources')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', {
                ascending: false,
              }),

            supabase
              .from('resource_tags')
              .select('*'),
          ]);

          if (!isMounted) {
            return;
          }

          if (foldersRes.error) {
            console.error(
              'Error loading folders:',
              foldersRes.error
            );
          }

          if (tagsRes.error) {
            console.error(
              'Error loading tags:',
              tagsRes.error
            );
          }

          if (resourcesRes.error) {
            console.error(
              'Error loading resources:',
              resourcesRes.error
            );
          }

          const fetchedFolders =
            foldersRes.data || [];

          const fetchedTags =
            tagsRes.data || [];

          const fetchedResources =
            resourcesRes.data || [];

          const fetchedResourceTags =
            resourceTagsRes.data || [];

          const processedResources: Resource[] =
            fetchedResources.map((resource) => {
              const tagIds =
                fetchedResourceTags
                  .filter(
                    (relation) =>
                      relation.resource_id ===
                      resource.id
                  )
                  .map(
                    (relation) =>
                      relation.tag_id
                  );

              return {
                ...resource,
                tag_ids: tagIds,
              };
            });

          setFolders(fetchedFolders);
          setTags(fetchedTags);
          setResources(processedResources);

          return;
        }

        // --------------------------------------------------------
        // Local mode
        // --------------------------------------------------------

        const localKey =
          `studyvault_data_${user.id}`;

        const stored =
          localStorage.getItem(localKey);

        if (!stored) {
          // IMPORTANT:
          // New users get an EMPTY vault.
          const emptyData = {
            folders: [],
            tags: [],
            resources: [],
          };

          setFolders([]);
          setTags([]);
          setResources([]);

          localStorage.setItem(
            localKey,
            JSON.stringify(emptyData)
          );

          return;
        }

        try {
          const parsed = JSON.parse(stored);

          if (!isMounted) {
            return;
          }

          setFolders(
            Array.isArray(parsed.folders)
              ? parsed.folders
              : []
          );

          setTags(
            Array.isArray(parsed.tags)
              ? parsed.tags
              : []
          );

          setResources(
            Array.isArray(parsed.resources)
              ? parsed.resources
              : []
          );
        } catch (error) {
          console.error(
            'Invalid local vault data:',
            error
          );

          if (isMounted) {
            setFolders([]);
            setTags([]);
            setResources([]);

            localStorage.removeItem(localKey);
          }
        }
      } catch (error) {
        console.error(
          'Failed to load vault data:',
          error
        );

        if (isMounted) {
          setFolders([]);
          setTags([]);
          setResources([]);

          addToast(
            'error',
            'Failed to load vault data.'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user, addToast]);

  // ------------------------------------------------------------
  // Create Resource
  // ------------------------------------------------------------

  const createResource = async (data: {
    name: string;
    resource_type: ResourceType;
    folder_id?: string;
    tag_ids?: string[];
    external_url?: string;
    text_content?: string;
    file?: File;
  }): Promise<Resource | null> => {
    if (!user) {
      addToast(
        'error',
        'Authentication required.'
      );

      return null;
    }

    let filePath: string | null = null;
    let fileSize: number | null = null;
    let mimeType: string | null = null;
    let base64Data: string | undefined;

    // ----------------------------------------------------------
    // Process uploaded file
    // ----------------------------------------------------------

    if (data.file) {
      fileSize = data.file.size;

      mimeType =
        data.file.type ||
        'application/octet-stream';

      try {
        base64Data =
          await new Promise<string>(
            (resolve, reject) => {
              const reader = new FileReader();

              reader.onload = () => {
                const result =
                  reader.result as string;

                const pureBase64 =
                  result.includes(',')
                    ? result.split(',')[1]
                    : result;

                resolve(pureBase64);
              };

              reader.onerror = () =>
                reject(
                  new Error(
                    'Failed to read file.'
                  )
                );

              reader.readAsDataURL(
                data.file as File
              );
            }
          );
      } catch (error) {
        console.warn(
          'Failed to convert file to base64:',
          error
        );
      }

      // --------------------------------------------------------
      // Supabase Storage
      // --------------------------------------------------------

      if (
        isSupabaseConfigured &&
        supabase
      ) {
        try {
          const sanitizedName =
            data.file.name.replace(
              /[^a-zA-Z0-9.-]/g,
              '_'
            );

          const storagePath =
            `${user.id}/${Date.now()}_${sanitizedName}`;

          const {
            data: uploadData,
            error: uploadError,
          } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(
              storagePath,
              data.file,
              {
                cacheControl: '3600',
                upsert: true,
              }
            );

          if (uploadError) {
            console.error(
              'Storage upload error:',
              uploadError
            );

            addToast(
              'error',
              `File upload failed: ${uploadError.message}`
            );

            return null;
          }

          filePath =
            uploadData?.path ||
            storagePath;
        } catch (error: any) {
          console.error(
            'Storage upload exception:',
            error
          );

          addToast(
            'error',
            error?.message ||
              'File upload failed.'
          );

          return null;
        }
      } else {
        // Local mode only stores metadata/base64.
        filePath =
          `local_storage/${Date.now()}_${data.file.name}`;
      }
    }

    const now =
      new Date().toISOString();

    // Temporary local ID.
    // Supabase replaces it with the DB-generated ID.
    const newResource: Resource = {
      id:
        'res-' +
        Date.now() +
        '-' +
        Math.random()
          .toString(36)
          .substring(2, 8),

      user_id: user.id,

      folder_id:
        data.folder_id || null,

      name: data.name,

      resource_type:
        data.resource_type,

      file_path: filePath,

      file_size: fileSize,

      mime_type: mimeType,

      external_url:
        data.external_url || null,

      text_content:
        data.text_content || null,

      is_favorite: false,

      created_at: now,

      updated_at: now,

      last_viewed_at: now,

      tag_ids:
        data.tag_ids || [],

      base64Data,
    };

    // ----------------------------------------------------------
    // Supabase database
    // ----------------------------------------------------------

    if (
      isSupabaseConfigured &&
      supabase
    ) {
      try {
        const {
          data: inserted,
          error,
        } = await supabase
          .from('resources')
          .insert({
            user_id: user.id,
            folder_id:
              newResource.folder_id,
            name: newResource.name,
            resource_type:
              newResource.resource_type,
            file_path:
              newResource.file_path,
            file_size:
              newResource.file_size,
            mime_type:
              newResource.mime_type,
            external_url:
              newResource.external_url,
            text_content:
              newResource.text_content,
            is_favorite: false,
            created_at:
              newResource.created_at,
            updated_at:
              newResource.updated_at,
            last_viewed_at:
              newResource.last_viewed_at,
          })
          .select()
          .single();

        if (error) {
          console.error(
            'Database resource insert error:',
            error
          );

          addToast(
            'error',
            `Failed to save resource: ${error.message}`
          );

          return null;
        }

        if (!inserted) {
          addToast(
            'error',
            'Resource was not returned by the database.'
          );

          return null;
        }

        // ------------------------------------------------------
        // Resource tags
        // ------------------------------------------------------

        if (
          data.tag_ids &&
          data.tag_ids.length > 0
        ) {
          const tagLinks =
            data.tag_ids.map(
              (tagId) => ({
                resource_id:
                  inserted.id,
                tag_id: tagId,
              })
            );

          const {
            error: tagError,
          } = await supabase
            .from('resource_tags')
            .insert(tagLinks);

          if (tagError) {
            console.error(
              'Resource tag insert error:',
              tagError
            );
          }
        }

        const finalResource: Resource =
          {
            ...inserted,
            tag_ids:
              data.tag_ids || [],
            base64Data,
          };

        setResources((prev) => [
          finalResource,
          ...prev,
        ]);

        addToast(
          'success',
          `Saved "${finalResource.name}"`
        );

        return finalResource;
      } catch (error: any) {
        console.error(
          'Create resource error:',
          error
        );

        addToast(
          'error',
          error?.message ||
            'Failed to create resource.'
        );

        return null;
      }
    }

    // ----------------------------------------------------------
    // Local mode
    // ----------------------------------------------------------

    const updatedResources = [
      newResource,
      ...resources,
    ];

    setResources(updatedResources);

    saveLocalState(
      updatedResources,
      folders,
      tags
    );

    addToast(
      'success',
      `Saved "${newResource.name}"`
    );

    return newResource;
  };

  // ------------------------------------------------------------
  // Update Resource
  // ------------------------------------------------------------

  const updateResource = async (
    id: string,
    updates: Partial<Resource>
  ): Promise<void> => {
    const now =
      new Date().toISOString();

    const updatedResources =
      resources.map((resource) =>
        resource.id === id
          ? {
              ...resource,
              ...updates,
              updated_at: now,
            }
          : resource
      );

    setResources(updatedResources);

    if (
      isSupabaseConfigured &&
      supabase
    ) {
      const {
        tag_ids,
        base64Data,
        user_id,
        id: resourceId,
        created_at,
        ...databaseUpdates
      } = updates as any;

      try {
        const {
          error,
        } = await supabase
          .from('resources')
          .update({
            ...databaseUpdates,
            updated_at: now,
          })
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          console.error(
            'Update resource error:',
            error
          );

          addToast(
            'error',
            `Failed to update resource: ${error.message}`
          );
        }
      } catch (error) {
        console.error(
          'Update resource exception:',
          error
        );
      }
    } else {
      saveLocalState(
        updatedResources,
        folders,
        tags
      );
    }
  };

  // ------------------------------------------------------------
  // Delete Resource
  // ------------------------------------------------------------

  const deleteResource = async (
    id: string
  ): Promise<boolean> => {
    if (!user) {
      addToast(
        'error',
        'Authentication required to delete resources.'
      );

      return false;
    }

    const target =
      resources.find(
        (resource) =>
          resource.id === id
      );

    if (!target) {
      return true;
    }

    if (
      isSupabaseConfigure
