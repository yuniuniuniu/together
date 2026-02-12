import type { ApiResponse } from '../types';
import { Platform } from '../utils/platform';


const DEFAULT_API_BASE = `${window.location.protocol}//${window.location.hostname}:3005/api`;
const API_BASE = import.meta.env.VITE_API_URL || DEFAULT_API_BASE;

// Debug: Log API configuration on load
console.log('[API Debug] VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('[API Debug] DEFAULT_API_BASE:', DEFAULT_API_BASE);
console.log('[API Debug] Using API_BASE:', API_BASE);

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('auth_token');
  const url = `${API_BASE}${endpoint}`;
  
  console.log('[API Debug] Fetching:', url);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });
    
    console.log('[API Debug] Response status:', response.status);

    // Handle sliding expiration: check for new token in response header
    const newToken = response.headers.get('X-New-Token');
    if (newToken) {
      localStorage.setItem('auth_token', newToken);
    }

    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.message || 'Request failed');
    }

    return json;
  } catch (error) {
    console.error('[API Debug] Fetch error:', error);
    console.error('[API Debug] Error message:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// Auth API
export const authApi = {
  sendCode: (email: string) =>
    apiClient<void>('/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verify: (email: string, code: string) =>
    apiClient<{ user: { id: string; email: string; nickname: string; avatar?: string }; token: string }>(
      '/auth/verify',
      {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      }
    ),

  getMe: () => apiClient<{ id: string; email: string; nickname: string; avatar?: string }>('/auth/me'),

  updateProfile: (updates: { nickname?: string; avatar?: string }) =>
    apiClient<{ id: string; email: string; nickname: string; avatar?: string }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  logout: () =>
    apiClient<void>('/auth/logout', { method: 'POST' }),

  logoutAll: () =>
    apiClient<void>('/auth/logout-all', { method: 'POST' }),
};

// Spaces API
export const spacesApi = {
  create: (anniversaryDate: string) =>
    apiClient<{
      id: string;
      createdAt: string;
      anniversaryDate: string;
      inviteCode: string;
      partners: Array<{ id: string; email: string; nickname: string; avatar?: string }>;
    }>('/spaces', {
      method: 'POST',
      body: JSON.stringify({ anniversaryDate }),
    }),

  getMy: () =>
    apiClient<{
      id: string;
      createdAt: string;
      anniversaryDate: string;
      inviteCode: string;
      partners: Array<{ id: string; email: string; nickname: string; avatar?: string }>;
    } | null>('/spaces/my'),

  getById: (id: string) =>
    apiClient<{
      id: string;
      createdAt: string;
      anniversaryDate: string;
      inviteCode: string;
      partners: Array<{ id: string; email: string; nickname: string; avatar?: string }>;
    }>(`/spaces/${id}`),

  lookup: (inviteCode: string) =>
    apiClient<{
      id: string;
      createdAt: string;
      anniversaryDate: string;
      inviteCode: string;
      partners: Array<{ id: string; email: string; nickname: string; avatar?: string }>;
    }>('/spaces/lookup', {
      method: 'POST',
      body: JSON.stringify({ inviteCode }),
    }),

  join: (inviteCode: string) =>
    apiClient<{
      id: string;
      createdAt: string;
      anniversaryDate: string;
      inviteCode: string;
      partners: Array<{ id: string; email: string; nickname: string; avatar?: string }>;
    }>('/spaces/join', {
      method: 'POST',
      body: JSON.stringify({ inviteCode }),
    }),

  delete: (id: string) =>
    apiClient<void>(`/spaces/${id}`, { method: 'DELETE' }),

  update: (id: string, data: { anniversaryDate: string }) =>
    apiClient<{
      id: string;
      createdAt: string;
      anniversaryDate: string;
      inviteCode: string;
      partners: Array<{ id: string; email: string; nickname: string; avatar?: string }>;
    }>(`/spaces/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  requestUnbind: (id: string) =>
    apiClient<{
      id: string;
      spaceId: string;
      requestedBy: string;
      requestedAt: string;
      expiresAt: string;
      status: 'pending' | 'cancelled' | 'completed';
    }>(`/spaces/${id}/unbind`, { method: 'POST' }),

  cancelUnbind: (id: string) =>
    apiClient<void>(`/spaces/${id}/unbind`, { method: 'DELETE' }),

  getUnbindStatus: (id: string) =>
    apiClient<{
      id: string;
      spaceId: string;
      requestedBy: string;
      requestedAt: string;
      expiresAt: string;
      status: 'pending' | 'cancelled' | 'completed';
    } | null>(`/spaces/${id}/unbind`),
};

// Memories API
export const memoriesApi = {
  list: (page = 1, pageSize = 20) =>
    apiClient<{
      data: Array<{
        id: string;
        spaceId: string;
        content: string;
        mood?: string;
        photos: string[];
        location?: { name: string; address?: string; latitude?: number; longitude?: number };
        voiceNote?: string;
        stickers: string[];
        createdAt: string;
        createdBy: string;
        wordCount?: number;
      }>;
      total: number;
      page: number;
      pageSize: number;
      hasMore: boolean;
    }>(`/memories?page=${page}&pageSize=${pageSize}`),

  create: (data: {
    content: string;
    mood?: string;
    photos?: string[];
    location?: { name: string; address?: string; latitude?: number; longitude?: number };
    voiceNote?: string;
    stickers?: string[];
    date?: string;
  }) =>
    apiClient<{
      id: string;
      spaceId: string;
      content: string;
      mood?: string;
      photos: string[];
      location?: { name: string; address?: string; latitude?: number; longitude?: number };
      voiceNote?: string;
      stickers: string[];
      createdAt: string;
      createdBy: string;
      wordCount?: number;
    }>('/memories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getById: (id: string) =>
    apiClient<{
      id: string;
      spaceId: string;
      content: string;
      mood?: string;
      photos: string[];
      location?: { name: string; address?: string; latitude?: number; longitude?: number };
      voiceNote?: string;
      stickers: string[];
      createdAt: string;
      createdBy: string;
      wordCount?: number;
    }>(`/memories/${id}`),

  update: (
    id: string,
    data: {
      content?: string;
      mood?: string;
      photos?: string[];
      location?: { name: string; address?: string; latitude?: number; longitude?: number };
      voiceNote?: string;
      stickers?: string[];
      date?: string;
    }
  ) =>
    apiClient<{
      id: string;
      spaceId: string;
      content: string;
      mood?: string;
      photos: string[];
      location?: { name: string; address?: string; latitude?: number; longitude?: number };
      voiceNote?: string;
      stickers: string[];
      createdAt: string;
      createdBy: string;
      wordCount?: number;
    }>(`/memories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiClient<void>(`/memories/${id}`, { method: 'DELETE' }),
};

// Milestones API
export const milestonesApi = {
  list: () =>
    apiClient<
      Array<{
        id: string;
        spaceId: string;
        title: string;
        description?: string;
        date: string;
        type: string;
        icon?: string;
        photos: string[];
        location?: { name: string; address?: string; latitude?: number; longitude?: number };
        createdAt: string;
        createdBy: string;
      }>
    >('/milestones'),

  create: (data: {
    title: string;
    description?: string;
    date: string;
    type: string;
    icon?: string;
    photos?: string[];
    location?: { name: string; address?: string; latitude?: number; longitude?: number };
  }) =>
    apiClient<{
      id: string;
      spaceId: string;
      title: string;
      description?: string;
      date: string;
      type: string;
      icon?: string;
      photos: string[];
      location?: { name: string; address?: string; latitude?: number; longitude?: number };
      createdAt: string;
      createdBy: string;
    }>('/milestones', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getById: (id: string) =>
    apiClient<{
      id: string;
      spaceId: string;
      title: string;
      description?: string;
      date: string;
      type: string;
      icon?: string;
      photos: string[];
      location?: { name: string; address?: string; latitude?: number; longitude?: number };
      createdAt: string;
      createdBy: string;
    }>(`/milestones/${id}`),

  update: (
    id: string,
    data: {
      title?: string;
      description?: string;
      date?: string;
      type?: string;
      icon?: string;
      photos?: string[];
      location?: { name: string; address?: string; latitude?: number; longitude?: number };
    }
  ) =>
    apiClient<{
      id: string;
      spaceId: string;
      title: string;
      description?: string;
      date: string;
      type: string;
      icon?: string;
      photos: string[];
      location?: { name: string; address?: string; latitude?: number; longitude?: number };
      createdAt: string;
      createdBy: string;
    }>(`/milestones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiClient<void>(`/milestones/${id}`, { method: 'DELETE' }),
};

// Notifications API
export const notificationsApi = {
  list: () =>
    apiClient<
      Array<{
        id: string;
        userId: string;
        type: string;
        title: string;
        message: string;
        createdAt: string;
        read: boolean;
        actionUrl?: string;
      }>
    >('/notifications'),

  markAsRead: (id: string) =>
    apiClient<{
      id: string;
      userId: string;
      type: string;
      title: string;
      message: string;
      createdAt: string;
      read: boolean;
      actionUrl?: string;
    }>(`/notifications/${id}/read`, { method: 'PUT' }),

  markAllAsRead: () =>
    apiClient<{ count: number }>('/notifications/read-all', { method: 'PUT' }),
};

// Reactions API
export const reactionsApi = {
  toggle: (memoryId: string, type: string = 'love') =>
    apiClient<{
      action: 'added' | 'removed';
      data: {
        id: string;
        memoryId: string;
        userId: string;
        type: string;
        createdAt: string;
      } | null;
    }>(`/reactions/${memoryId}`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    }),

  list: (memoryId: string) =>
    apiClient<
      Array<{
        id: string;
        memoryId: string;
        userId: string;
        type: string;
        createdAt: string;
      }>
    >(`/reactions/${memoryId}`),

  getMine: (memoryId: string) =>
    apiClient<{
      id: string;
      memoryId: string;
      userId: string;
      type: string;
      createdAt: string;
    } | null>(`/reactions/${memoryId}/me`),
};

// Upload API
const UPLOAD_BASE =
  import.meta.env.VITE_API_URL?.replace('/api', '') || `${window.location.protocol}//${window.location.hostname}:3005`;

function normalizeUploadUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    throw new Error('Upload response URL is empty');
  }

  // R2 / CDN / external absolute URLs should be used directly.
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('//')) {
    return `${window.location.protocol}${trimmed}`;
  }

  throw new Error(`Upload response URL must be absolute, got: ${trimmed}`);
}

export const uploadApi = {
  uploadViaServer: async (
    file: File,
    folder: string = 'uploads',
    onProgress?: (progress: number) => void
  ): Promise<{ url: string; filename: string; type: 'image' | 'gif' | 'video' }> =>
    new Promise((resolve, reject) => {
      const token = localStorage.getItem('auth_token');
      const xhr = new XMLHttpRequest();
      const formData = new FormData();

      formData.append('file', file, file.name);
      formData.append('folder', folder);

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        try {
          const payload =
            typeof xhr.response === 'string'
              ? JSON.parse(xhr.response || '{}')
              : xhr.response;

          if (xhr.status < 200 || xhr.status >= 300 || !payload?.success) {
            const message = payload?.error?.message || payload?.message || `Upload failed with status ${xhr.status}`;
            reject(new Error(message));
            return;
          }

          const data = payload.data || {};
          const isVideo = file.type.startsWith('video/');
          const isGif = file.type === 'image/gif';
          const fallbackType: 'image' | 'gif' | 'video' = isVideo ? 'video' : isGif ? 'gif' : 'image';

          resolve({
            url: normalizeUploadUrl(data.url),
            filename: data.filename || file.name,
            type: data.type || fallbackType,
          });
        } catch (error) {
          reject(error instanceof Error ? error : new Error('Invalid upload response'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timed out, please retry on a stable network'));
      });

      xhr.open('POST', `${UPLOAD_BASE}/api/upload`);
      xhr.responseType = 'json';
      xhr.timeout = 15 * 60 * 1000;
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(formData);
    }),

  uploadAudio: async (blob: Blob, filename: string = 'voice-note.webm'): Promise<{ url: string; filename: string }> => {
    const file = new File([blob], filename, {
      type: blob.type || 'audio/webm',
      lastModified: Date.now(),
    });

    if (Platform.isNative()) {
      const result = await uploadApi.uploadViaServer(file, 'audio');
      return {
        url: result.url,
        filename: result.filename,
      };
    }

    const { uploadUrl, publicUrl, contentType } = await uploadApi.getPresignedUrl(
      file.name,
      'audio',
      file.type || undefined
    );

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Audio upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Audio upload failed'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('Audio upload timed out, please retry on a stable network'));
      });

      xhr.open('PUT', uploadUrl);
      xhr.timeout = 15 * 60 * 1000;
      xhr.setRequestHeader('Content-Type', contentType || file.type || 'application/octet-stream');
      xhr.send(file);
    });

    return {
      url: normalizeUploadUrl(publicUrl),
      filename: file.name,
    };
  },

  // Get presigned URL for direct upload to R2
  getPresignedUrl: async (
    filename: string,
    folder: string = 'uploads',
    contentType?: string
  ): Promise<{ uploadUrl: string; key: string; publicUrl: string; contentType: string }> => {
    const token = localStorage.getItem('auth_token');

    const response = await fetch(`${UPLOAD_BASE}/api/upload/presign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ filename, folder, contentType }),
    });

    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.error?.message || 'Failed to get presigned URL');
    }

    return json.data;
  },

  // Direct upload to R2 using presigned URL
  uploadDirect: async (
    file: File,
    folder: string = 'uploads',
    onProgress?: (progress: number) => void
  ): Promise<{ url: string; filename: string; type: 'image' | 'gif' | 'video' }> => {
    if (Platform.isNative()) {
      return uploadApi.uploadViaServer(file, folder, onProgress);
    }

    // Get presigned URL from server
    const { uploadUrl, publicUrl, contentType } = await uploadApi.getPresignedUrl(
      file.name,
      folder,
      file.type || undefined
    );

    // Upload directly to R2
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = Math.round((e.loaded / e.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timed out, please retry on a stable network'));
      });

      xhr.open('PUT', uploadUrl);
      xhr.timeout = 15 * 60 * 1000;
      xhr.setRequestHeader('Content-Type', contentType || file.type || 'application/octet-stream');
      xhr.send(file);
    });

    // Determine file type
    const isVideo = file.type.startsWith('video/');
    const isGif = file.type === 'image/gif';
    const type: 'image' | 'gif' | 'video' = isVideo ? 'video' : isGif ? 'gif' : 'image';

    return {
      url: publicUrl,
      filename: file.name,
      type,
    };
  },

  // Delete file from R2
  deleteFile: async (url: string): Promise<void> => {
    const token = localStorage.getItem('auth_token');

    const response = await fetch(`${UPLOAD_BASE}/api/upload/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ url }),
    });

    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.error?.message || 'Failed to delete file');
    }
  },
};
