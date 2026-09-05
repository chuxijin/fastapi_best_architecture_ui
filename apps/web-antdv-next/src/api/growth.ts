import type { PaginationParams, PaginationResult } from './access';

import { requestClient } from '#/api/request';

// ==================== Experience Rule (经验值规则) ====================

export interface ExperienceRuleResult {
  id: number;
  event_code: string;
  name: string;
  exp_delta: number;
  required_entitlement_code: null | string;
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
  required_entitlement_code?: null | string;
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
  required_entitlement_code?: string;
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
  user_id: number;
  current_grade: number;
  total_exp: number;
  available_exp: number;
}

export interface ExperienceAccountQueryParams extends PaginationParams {
  user_id?: number;
}

export interface ManualExperienceParams {
  user_id: number;
  exp_delta: number;
  source_key: string;
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

export function grantExperienceApi(data: ManualExperienceParams) {
  return requestClient.post('/api/v1/growth/accounts/grant', data);
}

export function consumeExperienceApi(data: ManualExperienceParams) {
  return requestClient.post('/api/v1/growth/accounts/consume', data);
}

// ==================== Experience Records (经验流水) ====================

export interface ExperienceRecordResult {
  id: number;
  user_id: number;
  operation: string;
  exp_delta: number;
  total_exp_after: number;
  available_exp_after: number;
  grade_after: number;
  source: string;
  source_key: null | string;
  reason: null | string;
  occurred_at: string;
}

export interface ExperienceRecordQueryParams extends PaginationParams {
  user_id?: number;
  operation?: string;
  source?: string;
}

export function getExperienceRecordListApi(
  params?: ExperienceRecordQueryParams,
) {
  return requestClient.get<PaginationResult<ExperienceRecordResult>>(
    '/api/v1/growth/records',
    { params },
  );
}
