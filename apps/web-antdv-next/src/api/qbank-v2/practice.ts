import type { PaginationResult } from '#/types';

import { requestClient } from '#/api/request';

export type PracticeMode =
  | 'adaptive'
  | 'exam'
  | 'memorize'
  | 'mock'
  | 'practice'
  | 'review';
export type PracticeSessionStatus =
  | 'cancelled'
  | 'created'
  | 'expired'
  | 'graded'
  | 'in_progress'
  | 'submitted';
export type PracticeSourceType =
  | 'adaptive'
  | 'bank'
  | 'custom'
  | 'favorite'
  | 'knowledge_point'
  | 'note'
  | 'section'
  | 'wrong';

export interface CreatePracticeSessionParam {
  bank_revision_id?: number;
  mode: PracticeMode;
  source_type: PracticeSourceType;
  source_ref?: string;
  section_ids?: number[];
  knowledge_point_ids?: number[];
  question_ids?: number[];
  count?: number;
  title?: string;
  settings?: Record<string, any>;
}

export interface GetPracticeSessionListItem {
  id: number;
  session_key: string;
  user_id: number;
  bank_revision_id?: number;
  bank_name?: string;
  mode: PracticeMode;
  source_type: string;
  title_snapshot?: string;
  status: PracticeSessionStatus;
  total_items: number;
  answered_items: number;
  correct_items: number;
  score: number;
  started_time: string;
  submitted_time?: string;
  expires_time?: string;
  created_time: string;
}

export interface GetPracticeSessionDetail extends GetPracticeSessionListItem {
  items: {
    display_config: Record<string, any>;
    id: number;
    max_score: number;
    position: number;
    question_id: number;
  }[];
}

export interface GetPracticeSessionReport {
  session_key: string;
  mode: string;
  status: string;
  total_items: number;
  answered_items: number;
  correct_items: number;
  score: number;
  max_score: number;
  accuracy_rate: number;
  duration_ms: number;
  item_reports: {
    duration_ms: number;
    grading_status: string;
    is_correct?: boolean;
    max_score: number;
    position: number;
    question_id: number;
    score?: number;
  }[];
}

export interface GetPracticeSessionSolutionItem {
  position: number;
  question_id: number;
  stem: string;
  option_data: any[];
  answer_data: any;
  explanation?: string;
  my_response?: any;
  is_correct?: boolean;
  score?: number;
  max_score: number;
}

export interface SavePracticeResponseParam {
  response_data: any;
  is_flagged?: boolean;
  duration_ms?: number;
  save_version: number;
}

export interface GetPracticeResponseDetail {
  session_item_id: number;
  response_data: any;
  status: string;
  is_flagged: boolean;
  duration_ms: number;
  save_version: number;
}

export interface SubmitPracticeItemParam {
  response_data: any;
  duration_ms?: number;
}

export interface SubmitPracticeItemResult {
  is_correct?: boolean;
  score?: number;
  grading_status: string;
  feedback?: string;
}

export interface SubmitPracticeSessionResult {
  session_key: string;
  total_items: number;
  answered_items: number;
  correct_items: number;
  score: number;
  graded: boolean;
}

export interface GetPracticeSolutionDetail {
  question_id: number;
  stem: string;
  option_data: any[];
  answer_data: any;
  explanations: {
    content: string;
    explanation_type: string;
  }[];
  my_response?: any;
  is_correct?: boolean;
  score?: number;
  max_score: number;
}

export interface PracticeSessionListParams {
  status?: PracticeSessionStatus;
  mode?: PracticeMode;
  source_type?: string;
  bank_id?: number;
  page?: number;
  size?: number;
}

export async function createPracticeSessionApi(
  data: CreatePracticeSessionParam,
) {
  return requestClient.post<GetPracticeSessionDetail>(
    '/api/v1/qbank-v2/sessions',
    data,
  );
}

export async function getPracticeSessionListApi(
  params: PracticeSessionListParams,
) {
  return requestClient.get<PaginationResult<GetPracticeSessionListItem>>(
    '/api/v1/qbank-v2/sessions',
    { params },
  );
}

export async function getPracticeSessionApi(sessionKey: string) {
  return requestClient.get<GetPracticeSessionDetail>(
    `/api/v1/qbank-v2/sessions/${sessionKey}`,
  );
}

export async function deletePracticeSessionApi(sessionKey: string) {
  return requestClient.delete(`/api/v1/qbank-v2/sessions/${sessionKey}`);
}

export async function getPracticeSessionReportApi(sessionKey: string) {
  return requestClient.get<GetPracticeSessionReport>(
    `/api/v1/qbank-v2/sessions/${sessionKey}/report`,
  );
}

export async function getPracticeSessionSolutionsApi(sessionKey: string) {
  return requestClient.get<GetPracticeSessionSolutionItem[]>(
    `/api/v1/qbank-v2/sessions/${sessionKey}/solutions`,
  );
}

export async function savePracticeResponseApi(
  sessionKey: string,
  sessionItemId: number,
  data: SavePracticeResponseParam,
) {
  return requestClient.put<GetPracticeResponseDetail>(
    `/api/v1/qbank-v2/sessions/${sessionKey}/items/${sessionItemId}/response`,
    data,
  );
}

export async function submitPracticeItemApi(
  sessionKey: string,
  sessionItemId: number,
  data: SubmitPracticeItemParam,
) {
  return requestClient.post<SubmitPracticeItemResult>(
    `/api/v1/qbank-v2/sessions/${sessionKey}/items/${sessionItemId}/submit`,
    data,
  );
}

export async function getPracticeSolutionApi(
  sessionKey: string,
  sessionItemId: number,
) {
  return requestClient.get<GetPracticeSolutionDetail>(
    `/api/v1/qbank-v2/sessions/${sessionKey}/items/${sessionItemId}/solution`,
  );
}

export async function submitPracticeSessionApi(sessionKey: string) {
  return requestClient.post<SubmitPracticeSessionResult>(
    `/api/v1/qbank-v2/sessions/${sessionKey}/submit`,
  );
}
