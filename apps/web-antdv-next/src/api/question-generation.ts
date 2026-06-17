import { requestClient } from './request';

export type QuestionGenerationMaterialStatus =
  | 'draft'
  | 'manual_review'
  | 'unusable'
  | 'usable';

export type QuestionGenerationTaskStatus =
  | 'analyzing'
  | 'completed'
  | 'failed'
  | 'generating'
  | 'pending'
  | 'planning'
  | 'reviewing';

export type QuestionGenerationCandidateStatus =
  | 'approved'
  | 'draft'
  | 'published'
  | 'qc_failed'
  | 'qc_passed'
  | 'rejected';

export interface QuestionGenerationMaterialParams {
  exam?: string;
  keyword?: string;
  section?: string;
  status?: QuestionGenerationMaterialStatus;
  subject?: string;
}

export interface QuestionGenerationMaterialListItem {
  created_time: string;
  exam: string;
  id: number;
  processed_time?: null | string;
  province?: null | string;
  section: string;
  source?: null | string;
  source_publish_time?: null | string;
  status: QuestionGenerationMaterialStatus;
  subject: string;
  tags?: null | string[];
  title: string;
  year?: null | number;
}

export interface QuestionGenerationProcessResult {
  can_generate?: boolean;
  recommended_types?: string[];
  risks?: string[];
  auto_selected_question_types?: string[];
  generation_policy?: string;
  max_question_count?: number;
  recommended_question_count?: number;
  structure_markers?: Record<string, string[]>;
  text_length?: number;
  [key: string]: unknown;
}

export interface QuestionGenerationMaterialDetail extends QuestionGenerationMaterialListItem {
  content: string;
  process_result?: null | QuestionGenerationProcessResult;
  source_url?: null | string;
}

export interface CreateQuestionGenerationMaterialParams {
  content: string;
  exam?: string;
  province?: string;
  section?: string;
  source?: string;
  source_publish_time?: string;
  source_url?: string;
  subject?: string;
  tags?: string[];
  title: string;
  year?: number;
}

export interface UpdateQuestionGenerationMaterialParams extends CreateQuestionGenerationMaterialParams {
  status: QuestionGenerationMaterialStatus;
}

export interface StartQuestionGenerationParams {
  exam?: string;
  material_id: number;
  mini_model_id?: string;
  model_id?: string;
  provider_id?: number;
  section?: string;
  subject?: string;
  user_id: number;
}

export interface StartQuestionGenerationResult {
  status: QuestionGenerationTaskStatus;
  task_id: number;
}

export interface QuestionGenerationTaskParams {
  material_id?: number;
  status?: QuestionGenerationTaskStatus;
}

export interface QuestionGenerationTaskListItem {
  created_time: string;
  error_code?: null | string;
  error_message?: null | string;
  exam: string;
  finished_time?: null | string;
  id: number;
  material_id: number;
  progress: number;
  question_count: number;
  section: string;
  stage?: null | string;
  status: QuestionGenerationTaskStatus;
  subject: string;
  target_question_types?: null | string[];
  user_id: number;
}

export interface QuestionGenerationTaskDetail extends QuestionGenerationTaskListItem {
  input_payload: Record<string, unknown>;
  result_summary?: null | Record<string, unknown>;
  state_snapshot?: null | Record<string, unknown>;
}

export interface QuestionGenerationCandidateParams {
  material_id?: number;
  status?: QuestionGenerationCandidateStatus;
  task_id?: number;
}

export interface QuestionGenerationCandidateListItem {
  created_time: string;
  difficulty?: null | number | string;
  id: number;
  material_id: number;
  passage_id?: null | string;
  published_question_id?: null | number;
  question_subtype?: null | string;
  question_type: string;
  sort_order: number;
  status: QuestionGenerationCandidateStatus;
  task_id: number;
}

export interface QuestionGenerationCandidateDetail extends QuestionGenerationCandidateListItem {
  analysis: string;
  answer_data: Record<string, unknown>;
  blueprint?: null | Record<string, unknown>;
  knowledge_point?: Array<number | Record<string, unknown> | string> | null;
  options: Array<Record<string, unknown>>;
  passage_meta?: null | Record<string, unknown>;
  qc_result?: null | Record<string, unknown>;
  selected_passage: string;
  stem: string;
}

export interface ReviewQuestionGenerationCandidateParams {
  reason?: string;
  status: 'approved' | 'rejected';
}

export async function getQuestionGenerationMaterialsApi(
  params?: QuestionGenerationMaterialParams,
) {
  return requestClient.get<QuestionGenerationMaterialListItem[]>(
    '/api/v1/question-generation/materials',
    { params },
  );
}

export async function getQuestionGenerationMaterialApi(id: number) {
  return requestClient.get<QuestionGenerationMaterialDetail>(
    `/api/v1/question-generation/materials/${id}`,
  );
}

export async function createQuestionGenerationMaterialApi(
  data: CreateQuestionGenerationMaterialParams,
) {
  return requestClient.post<QuestionGenerationMaterialDetail>(
    '/api/v1/question-generation/materials',
    data,
  );
}

export async function updateQuestionGenerationMaterialApi(
  id: number,
  data: UpdateQuestionGenerationMaterialParams,
) {
  return requestClient.put(`/api/v1/question-generation/materials/${id}`, data);
}

export async function deleteQuestionGenerationMaterialsApi(ids: number[]) {
  return requestClient.delete('/api/v1/question-generation/materials', {
    data: { ids },
  });
}

export async function deleteQuestionGenerationTasksApi(ids: number[]) {
  return requestClient.delete('/api/v1/question-generation/tasks', {
    data: { ids },
  });
}

export async function getQuestionGenerationTasksApi(
  params?: QuestionGenerationTaskParams,
) {
  return requestClient.get<QuestionGenerationTaskListItem[]>(
    '/api/v1/question-generation/tasks',
    { params },
  );
}

export async function getQuestionGenerationTaskApi(id: number) {
  return requestClient.get<QuestionGenerationTaskDetail>(
    `/api/v1/question-generation/tasks/${id}`,
  );
}

export async function startQuestionGenerationTaskApi(
  data: StartQuestionGenerationParams,
) {
  return requestClient.post<StartQuestionGenerationResult>(
    '/api/v1/question-generation/tasks/start',
    data,
  );
}

export async function getQuestionGenerationCandidatesApi(
  params?: QuestionGenerationCandidateParams,
) {
  return requestClient.get<QuestionGenerationCandidateListItem[]>(
    '/api/v1/question-generation/candidates',
    { params },
  );
}

export async function getQuestionGenerationCandidateApi(id: number) {
  return requestClient.get<QuestionGenerationCandidateDetail>(
    `/api/v1/question-generation/candidates/${id}`,
  );
}

export async function reviewQuestionGenerationCandidateApi(
  id: number,
  data: ReviewQuestionGenerationCandidateParams,
) {
  return requestClient.post(
    `/api/v1/question-generation/candidates/${id}/review`,
    data,
  );
}

export async function deleteQuestionGenerationCandidatesApi(ids: number[]) {
  return requestClient.delete('/api/v1/question-generation/candidates', {
    data: { ids },
  });
}
