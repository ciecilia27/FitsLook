/**
 * Google Drive link utilities
 * Converts Google Drive share links to direct image URLs
 */

/**
 * Extract file ID from various Google Drive URL formats
 * Supports:
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 * - https://drive.google.com/uc?export=view&id=FILE_ID
 */
export function extractDriveFileId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  // Format: /file/d/FILE_ID/view
  const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch) return fileIdMatch[1];

  // Format: ?id=FILE_ID or &id=FILE_ID
  const idParamMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch) return idParamMatch[1];

  return null;
}

/**
 * Check if a URL is a Google Drive link
 */
export function isGoogleDriveUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.includes('drive.google.com');
}

/**
 * Convert a Google Drive share link to a direct image URL
 * Uses lh3.googleusercontent.com for reliable hotlinking
 */
export function driveUrlToImageUrl(url: string): string {
  if (!isGoogleDriveUrl(url)) return url;

  const fileId = extractDriveFileId(url);
  if (!fileId) return url;

  // lh3.googleusercontent.com is the most reliable for direct image embedding
  // It works with Next.js <Image> and canvas without CORS issues
  return `https://lh3.googleusercontent.com/d/${fileId}`;
}

/**
 * Smart resolver: if it's a Drive link, convert it; otherwise return as-is
 */
export function resolveImageUrl(url: string): string {
  if (!url) return '';
  if (isGoogleDriveUrl(url)) {
    return driveUrlToImageUrl(url);
  }
  return url;
}

/**
 * Get a thumbnail URL (smaller, faster loading)
 * Good for product cards and previews
 */
export function driveUrlToThumbnailUrl(url: string, size: number = 400): string {
  if (!isGoogleDriveUrl(url)) return url;

  const fileId = extractDriveFileId(url);
  if (!fileId) return url;

  return `https://lh3.googleusercontent.com/d/${fileId}=w${size}`;
}
