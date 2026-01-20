import type { ApiResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('auth_token');

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.message || 'Request failed');
  }

  return json;
}

// Auth API
export const authApi = {
  sendCode: (phone: string) =>
    apiClient<{ code: string }>('/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  verify: (phone: string, code: string) =>
    apiClient<{ user: { id: string; phone: string; nickname: string; avatar?: string }; token: string }>(
      '/auth/verify',
      {
        method: 'POST',
        body: JSON.stringify({ phone, code }),
      }
    ),

  getMe: () => apiClient<{ id: string; phone: string; nickname: string; avatar?: string }>('/auth/me'),

  updateProfile: (updates: { nickname?: string; avatar?: string }) =>
    apiClient<{ id: string; phone: string; nickname: string; avatar?: string }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
};

// Spaces API
export const spacesApi = {
  create: (anniversaryDate: string) =>
    apiClient<{
      id: string;
      createdAt: string;
      anniversaryDate: string;
      inviteCode: string;
      partners: Array<{ id: string; phone: string; nickname: string; avatar?: string }>;
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
      partners: Array<{ id: string; phone: string; nickname: string; avatar?: string }>;
    } | null>('/spaces/my'),

  getById: (id: string) =>
    apiClient<{
      id: string;
      createdAt: string;
      anniversaryDate: string;
      inviteCode: string;
      partners: Array<{ id: string; phone: string; nickname: string; avatar?: string }>;
    }>(`/spaces/${id}`),

  join: (inviteCode: string) =>
    apiClient<{
      id: string;
      createdAt: string;
      anniversaryDate: string;
      inviteCode: string;
      partners: Array<{ id: string; phone: string; nickname: string; avatar?: string }>;
    }>('/spaces/join', {
      method: 'POST',
      body: JSON.stringify({ inviteCode }),
    }),

  delete: (id: string) =>
    apiClient<void>(`/spaces/${id}`, { method: 'DELETE' }),
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
};
