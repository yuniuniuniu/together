export interface LoginCredentials {
  phone: string;
  code: string;
}

export interface ProfileSetupData {
  nickname: string;
  avatar?: string;
}

export type AuthStep = 'login' | 'verify' | 'profile-setup';
