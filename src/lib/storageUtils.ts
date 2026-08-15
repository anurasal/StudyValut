import { supabase, isSupabaseConfigured, BUCKET_NAME } from './supabase';
import { Resource } from '../types';

/**
 * Resolves an accessible URL for viewing or downloading a resource file.
 * Handles Supabase Storage signed URLs, public URLs, base64 data URLs/Blobs, and external URLs.
 */
export async function getResourceAccessUrl(resource: Resource): Promise<{ url: string | null; isBlob?: boolean; error?: string }> {
  try {
    const { file_path, base64Data, mime_type, external_url } = resource;

    // Direct HTTP/HTTPS or Data URI in file_path
    if (file_path && (file_path.startsWith('http://') || file_path.startsWith('https://') || file_path.startsWith('data:'))) {
      return { url: file_path };
    }

    // Supabase Storage file_path
    if (file_path && isSupabaseConfigured && supabase) {
      try {
        // Attempt signed URL first (handles both private and public buckets securely)
        const { data: signedData, error: signedErr } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(file_path, 3600);

        if (!signedErr && signedData?.signedUrl) {
          return { url: signedData.signedUrl };
        }

        if (signedErr) {
          console.warn('Supabase createSignedUrl error, trying public URL fallback:', signedErr);
        }

        // Fallback to public URL
        const { data: publicData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(file_path);
        if (publicData?.publicUrl) {
          return { url: publicData.publicUrl };
        }
      } catch (err: any) {
        console.error('Supabase storage URL resolution exception:', err);
      }
    }

    // Fallback to base64 Data or Blob URL if available
    if (base64Data) {
      const mime = mime_type || (resource.resource_type === 'pdf' ? 'application/pdf' : 'image/png');
      const pureBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
      
      try {
        const byteCharacters = atob(pureBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        return { url: blobUrl, isBlob: true };
      } catch (b64Err) {
        console.warn('Failed to parse base64 to blob, using data URL fallback:', b64Err);
        return { url: `data:${mime};base64,${pureBase64}` };
      }
    }

    // Fallback to external_url
    if (external_url) {
      return { url: external_url };
    }

    return { url: null, error: 'No storage file path, base64 data, or external URL available.' };
  } catch (err: any) {
    console.error('getResourceAccessUrl failed:', err);
    return { url: null, error: err.message || 'Failed to resolve resource access URL' };
  }
}

/**
 * Downloads a resource file to the user's local device.
 */
export async function downloadResourceFile(resource: Resource, urlOverride?: string): Promise<boolean> {
  try {
    let accessUrl = urlOverride;
    if (!accessUrl) {
      const res = await getResourceAccessUrl(resource);
      accessUrl = res.url || undefined;
    }

    if (!accessUrl) {
      if (resource.text_content) {
        const blob = new Blob([resource.text_content], { type: 'text/plain;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        triggerBrowserDownload(blobUrl, `${sanitizeFileName(resource.name)}.txt`);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        return true;
      }
      alert('Download unavailable: File location could not be determined.');
      return false;
    }

    // Direct blob URL or data URL
    if (accessUrl.startsWith('blob:') || accessUrl.startsWith('data:')) {
      triggerBrowserDownload(accessUrl, getDownloadFilename(resource));
      return true;
    }

    // Remote HTTP/HTTPS URL: fetch blob to trigger proper browser download
    try {
      const resp = await fetch(accessUrl);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      triggerBrowserDownload(blobUrl, getDownloadFilename(resource));
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      return true;
    } catch (fetchErr) {
      console.warn('Direct blob fetch for download failed, attempting fallback link:', fetchErr);
      triggerBrowserDownload(accessUrl, getDownloadFilename(resource));
      return true;
    }
  } catch (err: any) {
    console.error('downloadResourceFile error:', err);
    alert('Failed to download file: ' + (err.message || 'Unknown error'));
    return false;
  }
}

function triggerBrowserDownload(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_.-]/g, '_');
}

function getDownloadFilename(resource: Resource): string {
  const cleanName = sanitizeFileName(resource.name);
  const hasExt = /\.[a-zA-Z0-9]+$/.test(cleanName);
  if (hasExt) return cleanName;

  switch (resource.resource_type) {
    case 'pdf':
      return `${cleanName}.pdf`;
    case 'image':
      if (resource.mime_type?.includes('png')) return `${cleanName}.png`;
      if (resource.mime_type?.includes('webp')) return `${cleanName}.webp`;
      if (resource.mime_type?.includes('gif')) return `${cleanName}.gif`;
      return `${cleanName}.jpg`;
    case 'doc':
      return `${cleanName}.docx`;
    case 'ppt':
      return `${cleanName}.pptx`;
    case 'zip':
      return `${cleanName}.zip`;
    case 'text':
      return `${cleanName}.txt`;
    default:
      return cleanName;
  }
}
