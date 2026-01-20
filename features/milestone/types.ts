import type { Milestone, MilestoneType } from '../../shared/types';

export interface CreateMilestoneData {
  title: string;
  description?: string;
  date: Date;
  type: MilestoneType;
  icon?: string;
  photos?: string[];
}

export type { Milestone, MilestoneType };
