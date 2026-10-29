import { apiClient } from './apiClient';
import { resolveImageUrl } from './apiConfig';

export interface UploadImageResult {
  url: string;
  fullUrl?: string;
  fileName?: string;
  type?: string;
}

export const uploadService = {
  /**
   * Upload an image File or Blob via multipart FormData (Sections 3, 4, 5, 6, 7)
   */
  async uploadImageFile(
    file: File | Blob,
    type: 'product' | 'logo' | 'cover' | 'general' = 'product',
    fileName?: string
  ): Promise<UploadImageResult> {
    if (!file) {
      throw new Error('Image file is required');
    }

    const actualFileName = (file as File).name || fileName || 'image';

    const formData = new FormData();
    formData.append('image', file, actualFileName);
    formData.append('type', type);

    try {
      const response = await apiClient.post<any>('/upload/image', formData, {
        requiresAuth: true,
      });

      const payload = response?.data || response;
      if (payload && (payload.url || payload.fullUrl)) {
        const rawUrl = payload.url || payload.fullUrl;
        const normalizedUrl = resolveImageUrl(rawUrl);
        return {
          url: normalizedUrl,
          fullUrl: payload.fullUrl || normalizedUrl,
          fileName: payload.fileName,
          type: payload.type,
        };
      }

      throw new Error('Unable to upload image. Try again.');
    } catch (error: any) {
      if (__DEV__) {
        console.warn('[uploadService.uploadImageFile] Error:', error);
      }
      const message = error?.message || 'Unable to upload image. Try again.';
      throw new Error(message.includes('Try again') ? message : 'Unable to upload image. Try again.');
    }
  },

  /**
   * Upload an image to the backend.
   * Accepts a browser File/Blob, Base64 data URI (data:image/...), or HTTPS remote URL.
   */
  async uploadImage(
    imageData: string | File | Blob,
    type: 'product' | 'logo' | 'cover' | 'general' = 'product'
  ): Promise<UploadImageResult> {
    if (typeof File !== 'undefined' && imageData instanceof File) {
      return this.uploadImageFile(imageData, type);
    }
    if (typeof Blob !== 'undefined' && imageData instanceof Blob) {
      return this.uploadImageFile(imageData, type);
    }
    if (!imageData || typeof imageData !== 'string') {
      throw new Error('Image data is required');
    }

    try {
      const response = await apiClient.post<any>('/upload/image', {
        image: imageData,
        type,
      }, {
        requiresAuth: true,
      });

      const payload = response?.data || response;
      if (payload && (payload.url || payload.fullUrl)) {
        const rawUrl = payload.url || payload.fullUrl;
        const normalizedUrl = resolveImageUrl(rawUrl);
        return {
          url: normalizedUrl,
          fullUrl: payload.fullUrl || normalizedUrl,
          fileName: payload.fileName,
          type: payload.type,
        };
      }

      throw new Error('Unable to upload image. Try again.');
    } catch (error: any) {
      if (__DEV__) {
        console.warn('[uploadService.uploadImage] Error:', error);
      }
      const message = error?.message || 'Unable to upload image. Try again.';
      throw new Error(message.includes('Try again') ? message : 'Unable to upload image. Try again.');
    }
  },

  /**
   * Validate image file format and size
   */
  validateImageFile(file: { size?: number; type?: string; name?: string }): { valid: boolean; error?: string } {
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/pjpeg', 'image/x-png'];
    const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp'];

    if (file.size && file.size > MAX_SIZE) {
      return { valid: false, error: 'Image must be smaller than 5MB.' };
    }

    const hasValidMime = file.type ? ALLOWED_MIME.includes(file.type.toLowerCase()) : false;
    let hasValidExt = false;
    if (file.name && file.name.includes('.')) {
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      hasValidExt = ALLOWED_EXT.includes(ext);
    }

    // Pass if either valid MIME or valid extension is present
    if (file.type && file.name) {
      if (!hasValidMime && !hasValidExt) {
        return { valid: false, error: 'Please select a JPG, PNG, or WEBP image.' };
      }
    } else if (file.type && !hasValidMime) {
      return { valid: false, error: 'Please select a JPG, PNG, or WEBP image.' };
    } else if (file.name && !hasValidExt) {
      return { valid: false, error: 'Please select a JPG, PNG, or WEBP image.' };
    }

    return { valid: true };
  },
};
