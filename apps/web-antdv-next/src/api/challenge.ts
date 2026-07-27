import { requestClient } from './request';

export type ChallengeStage = 'stage_1' | 'stage_2' | 'stage_3' | 'stage_4';
export type ChallengeLevelStatus = 'disabled' | 'draft' | 'published';
export type ChallengeSourceType = 'fixed' | 'generator' | 'manual' | 'pool';
export type ChallengeCompletionMode = 'consecutive_attempts' | 'single_attempt';

export interface ChallengeAttemptRequirement {
  description?: null | string;
  max_total_time?: null | number;
  min_accuracy_rate?: null | number | string;
  seq_no: number;
  title?: null | string;
}

export interface ChallengeCompletionRule {
  attempt_requirements?: ChallengeAttemptRequirement[];
  max_total_time?: null | number;
  min_accuracy_rate?: null | number | string;
  mode: ChallengeCompletionMode;
  required_attempts: number;
}

export interface ChallengeSection {
  enabled: boolean;
  id?: number;
  name?: null | string;
  question_count: number;
  required_correct_count?: null | number;
  seq_no: number;
  source_config: Record<string, unknown>;
  source_type: ChallengeSourceType;
}

export interface ChallengeLevel {
  challenge_key: string;
  completion_rule: ChallengeCompletionRule;
  config_version: number;
  description?: null | string;
  display_config?: null | Record<string, unknown>;
  global_no: number;
  id: number;
  level_no: number;
  pass_rate: number | string;
  previous_level_id?: null | number;
  question_count: number;
  sections: ChallengeSection[];
  sort_order: number;
  stage: ChallengeStage;
  star_three_rate: number | string;
  star_two_rate: number | string;
  status: ChallengeLevelStatus;
  time_limit: number;
  title: string;
}

export interface ChallengeLevelPayload {
  challenge_key: string;
  completion_rule?: ChallengeCompletionRule;
  description?: null | string;
  display_config?: null | Record<string, unknown>;
  global_no: number;
  level_no: number;
  pass_rate?: number;
  previous_level_id?: null | number;
  question_count: number;
  sections: ChallengeSection[];
  sort_order?: number;
  stage: ChallengeStage;
  star_three_rate?: number;
  star_two_rate?: number;
  status?: ChallengeLevelStatus;
  time_limit?: number;
  title: string;
}

export async function getChallengeLevelListApi(params?: {
  challenge_key?: string;
  status?: ChallengeLevelStatus;
}) {
  return requestClient.get<ChallengeLevel[]>(
    '/api/v1/admin/challenges/levels',
    {
      params,
    },
  );
}

export async function getChallengeLevelApi(levelId: number) {
  return requestClient.get<ChallengeLevel>(
    `/api/v1/admin/challenges/levels/${levelId}`,
  );
}

export async function createChallengeLevelApi(data: ChallengeLevelPayload) {
  return requestClient.post<ChallengeLevel>(
    '/api/v1/admin/challenges/levels',
    data,
  );
}

export async function updateChallengeLevelApi(
  levelId: number,
  data: Partial<ChallengeLevelPayload>,
) {
  return requestClient.put<ChallengeLevel>(
    `/api/v1/admin/challenges/levels/${levelId}`,
    data,
  );
}

export async function publishChallengeLevelApi(levelId: number) {
  return requestClient.post<ChallengeLevel>(
    `/api/v1/admin/challenges/levels/${levelId}/publish`,
  );
}
