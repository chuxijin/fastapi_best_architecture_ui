import type { PaginationParams, PaginationResult } from './access';

import { requestClient } from '#/api/request';

// ==================== Experience Rule (经验值规则) ====================

export interface ExperienceRuleResult {
  id: number;
  event_code: string;
  name: string;
  exp_delta: number;
  family_code: null | string;
  cycle_day: null | number;
  min_practice_count: number;
  min_practice_duration: number;
  sort: number;
  status: number;
  description: null | string;
  created_time: string;
  updated_time?: null | string;
}

export interface CreateExperienceRuleParams {
  event_code: string;
  name: string;
  exp_delta: number;
  family_code?: null | string;
  cycle_day?: null | number;
  min_practice_count?: number;
  min_practice_duration?: number;
  sort?: number;
  status?: number;
  description?: null | string;
}

export type UpdateExperienceRuleParams = Partial<CreateExperienceRuleParams> & {
  status?: number;
};

export interface ExperienceRuleQueryParams extends PaginationParams {
  family_code?: string;
  status?: number;
  event_code?: string;
}

export function getExperienceRuleListApi(params?: ExperienceRuleQueryParams) {
  return requestClient.get<PaginationResult<ExperienceRuleResult>>(
    '/api/v1/growth/experience-rules',
    { params },
  );
}

export function createExperienceRuleApi(data: CreateExperienceRuleParams) {
  return requestClient.post<ExperienceRuleResult>(
    '/api/v1/growth/experience-rules',
    data,
  );
}

export function updateExperienceRuleApi(
  pk: number,
  data: UpdateExperienceRuleParams,
) {
  return requestClient.put<ExperienceRuleResult>(
    `/api/v1/growth/experience-rules/${pk}`,
    data,
  );
}

export function deleteExperienceRuleApi(pk: number) {
  return requestClient.delete(`/api/v1/growth/experience-rules/${pk}`);
}

// ==================== Experience Account (经验账户) ====================

export interface ExperienceAccountResult {
  id: number;
  user_id: number;
  username: null | string;
  family_code: string;
  current_grade: string;
  total_exp: number;
  available_exp: number;
  updated_time: string;
}

export interface ExperienceAccountQueryParams extends PaginationParams {
  user_id?: number;
  username?: string;
  family_code?: string;
}

export interface GrantExperienceParams {
  user_id: number;
  family_code: string;
  exp_delta: number;
  reason: string;
}

export interface ConsumeExperienceParams {
  user_id: number;
  family_code: string;
  exp_delta: number;
  reason: string;
}

export function getExperienceAccountListApi(
  params?: ExperienceAccountQueryParams,
) {
  return requestClient.get<PaginationResult<ExperienceAccountResult>>(
    '/api/v1/growth/accounts',
    { params },
  );
}

export function grantExperienceApi(data: GrantExperienceParams) {
  return requestClient.post('/api/v1/growth/accounts/grant', data);
}

export function consumeExperienceApi(data: ConsumeExperienceParams) {
  return requestClient.post('/api/v1/growth/accounts/consume', data);
}

// ==================== Experience Records (经验流水) ====================

export interface ExperienceRecordResult {
  id: number;
  user_id: number;
  family_code: string;
  op_type: string;
  exp_delta: number;
  exp_after: number;
  source: string;
  source_key: null | string;
  reason: null | string;
  created_time: string;
}

export interface ExperienceRecordQueryParams extends PaginationParams {
  user_id?: number;
  family_code?: string;
  op_type?: string;
  source?: string;
  start_time?: string;
  end_time?: string;
}

export function getExperienceRecordListApi(
  params?: ExperienceRecordQueryParams,
) {
  return requestClient.get<PaginationResult<ExperienceRecordResult>>(
    '/api/v1/growth/records',
    { params },
  );
}
