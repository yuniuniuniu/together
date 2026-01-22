import type { Space, Partner, User } from '../../shared/types';

export interface CreateSpaceData {
  anniversaryDate: Date;
}

export interface JoinSpaceData {
  inviteCode: string;
}

export type { Space, Partner, User };
