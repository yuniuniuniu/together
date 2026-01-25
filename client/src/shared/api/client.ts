import type { ApiResponse } from '../types';


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

export const uploadApi = {
  uploadFile: async (file: File): Promise<{ url: string; filename: string }> => {
    const token = localStorage.getItem('auth_token');
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${UPLOAD_BASE}/api/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.message || 'Upload failed');
    }

    // Return full URL for the uploaded file
    return {
      url: `${UPLOAD_BASE}${json.data.url}`,
      filename: json.data.filename,
    };
  },

  uploadMultiple: async (files: File[]): Promise<Array<{ url: string; filename: string }>> => {
    const token = localStorage.getItem('auth_token');
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await fetch(`${UPLOAD_BASE}/api/upload/multiple`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.message || 'Upload failed');
    }

    return json.data.map((item: { url: string; filename: string }) => ({
      url: `${UPLOAD_BASE}${item.url}`,
      filename: item.filename,
    }));
  },

  uploadAudio: async (blob: Blob): Promise<{ url: string; filename: string }> => {
    const token = localStorage.getItem('auth_token');
    const formData = new FormData();
    formData.append('file', blob, 'voice-note.webm');

    const response = await fetch(`${UPLOAD_BASE}/api/upload/audio`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.message || 'Audio upload failed');
    }

    return {
      url: `${UPLOAD_BASE}${json.data.url}`,
      filename: json.data.filename,
    };
  },

  uploadVideo: async (file: File): Promise<{ url: string; filename: string; type: string }> => {
    const token = localStorage.getItem('auth_token');
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${UPLOAD_BASE}/api/upload/video`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.message || 'Video upload failed');
    }

    return {
      url: `${UPLOAD_BASE}${json.data.url}`,
      filename: json.data.filename,
      type: json.data.type,
    };
  },

  uploadMedia: async (file: File): Promise<{ url: string; filename: string; type: 'image' | 'gif' | 'video' }> => {
    const token = localStorage.getItem('auth_token');
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${UPLOAD_BASE}/api/upload/media`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.message || 'Media upload failed');
    }

    return {
      url: `${UPLOAD_BASE}${json.data.url}`,
      filename: json.data.filename,
      type: json.data.type,
    };
  },
};
