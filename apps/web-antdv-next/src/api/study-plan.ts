import type { PaginationResult } from '#/types';

import { requestClient } from './request';

export type StudyPlanModuleType =
  | 'ability'
  | 'practice'
  | 'resource'
  | 'review'
  | 'wrong_review';
export type StudyPlanRefType =
  | 'ability_task'
  | 'content'
  | 'question_set'
  | 'wrong_dynamic';
export type StudyPlanItemStatus =
  | 'completed'
  | 'in_progress'
  | 'pending'
  | 'skipped';
export type StudyPlanStatus = 'active' | 'finished' | 'paused';
export type StudyMentorStatus = 'active' | 'paused';
export type StudyPlanPracticeSourceMode =
  | 'bank'
  | 'chapter'
  | 'chapter_type'
  | 'knowledge_point'
  | 'question_ids';
export type StudyPlanQuestionType =
  | 'fill'
  | 'judgement'
  | 'multiple'
  | 'shortAnswer'
  | 'single';
export type StudyAbilityBindingRole =
  | 'ability'
  | 'knowledge_point'
  | 'solution_method';
export type StudyAbilityProfileSourceType = 'ability' | 'question_bank';
export type StudyPlanRecommendationModuleType = 'ability' | 'practice';
export type SpatialCubePatternRenderType = 'builtin' | 'image';
export type SpatialCubePatternRotationPeriod = 90 | 180 | 360;

export interface SpatialCubePatternQueryParams {
  keyword?: string;
  page?: number;
  render_type?: SpatialCubePatternRenderType;
  size?: number;
  status?: 'active' | 'inactive';
}

export interface SpatialCubePatternDetail {
  asset_url?: null | string;
  asset_version: string;
  code: string;
  created_time: string;
  id: number;
  is_active: boolean;
  name: string;
  render_type: SpatialCubePatternRenderType;
  rotation_period: SpatialCubePatternRotationPeriod;
  sort: number;
  updated_time?: null | string;
}

export interface CreateSpatialCubePatternParams {
  asset_url?: null | string;
  asset_version?: string;
  code: string;
  is_active?: boolean;
  name: string;
  render_type?: SpatialCubePatternRenderType;
  rotation_period?: SpatialCubePatternRotationPeriod;
  sort?: number;
}

export type UpdateSpatialCubePatternParams =
  Partial<CreateSpatialCubePatternParams>;

export interface StudyPlanProgress {
  completed: number;
  percent: number;
  total: number;
}

export interface StudyPlanDetail {
  created_by: number;
  created_time: string;
  domain: string;
  end_date: string;
  id: number;
  start_date: string;
  status: StudyPlanStatus;
  template_id?: null | number;
  title: string;
  user_id: number;
}

export interface StudyPlanRecordDetail {
  completed_at: string;
  correct_count?: null | number;
  duration_seconds: number;
  extra_data?: null | Record<string, unknown>;
  id: number;
  item_id: number;
  score?: null | number;
  total_count?: null | number;
  user_id: number;
}

export interface StudyPlanAbilityParamSpec {
  type: 'enum' | 'int' | 'string';
  label?: string;
  default?: boolean | null | number | string;
  min?: number;
  max?: number;
  options?: Array<number | string | { label: string; value: number | string }>;
  bind_to?: string;
}

export interface StudyPlanAbilityCatalogItem {
  benchmark_seconds?: null | number;
  category: string;
  default_accuracy?: null | number;
  default_minutes: number;
  default_question_count?: null | number;
  description: string;
  domain: string;
  extra?: null | Record<string, unknown>;
  id?: null | number;
  is_active: boolean;
  is_persisted: boolean;
  key: string;
  param_schema?: null | Record<string, StudyPlanAbilityParamSpec>;
  supports_result: boolean;
  supports_study_plan: boolean;
  title: string;
  url: string;
  url_base?: null | string;
}

export interface CreateStudyAbilityCatalogParams {
  ability_key: string;
  benchmark_seconds?: null | number;
  category: string;
  default_accuracy?: null | number;
  default_minutes?: number;
  default_question_count?: null | number;
  description?: null | string;
  domain?: string;
  extra?: null | Record<string, unknown>;
  is_active?: boolean;
  param_schema?: null | Record<string, StudyPlanAbilityParamSpec>;
  supports_result?: boolean;
  supports_study_plan?: boolean;
  title: string;
  url: string;
  url_base?: null | string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UpdateStudyAbilityCatalogParams extends Partial<
  Omit<CreateStudyAbilityCatalogParams, 'ability_key'>
> {}

export interface StudyAbilityCategoryBindingDetail {
  ability_key: string;
  category_code?: null | string;
  category_id: number;
  category_name?: null | string;
  category_type?: null | string;
  confidence: number;
  created_time: string;
  id: number;
  is_primary: boolean;
  mode?: null | string;
  role: StudyAbilityBindingRole;
  source: string;
  updated_time?: null | string;
  weight: number;
}

export interface CreateStudyAbilityCategoryBindingParams {
  ability_key: string;
  category_id: number;
  confidence?: number;
  is_primary?: boolean;
  mode?: null | string;
  role?: StudyAbilityBindingRole;
  source?: string;
  weight?: number;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UpdateStudyAbilityCategoryBindingParams extends Partial<
  Omit<CreateStudyAbilityCategoryBindingParams, 'ability_key'>
> {}

export interface ListStudyAbilityCatalogParams {
  domain?: string;
  include_inactive?: boolean;
  keyword?: string;
}

export interface ListStudyAbilityBindingParams {
  ability_key?: string;
  category_id?: number;
  role?: StudyAbilityBindingRole;
}

export interface GetMentorStudyAbilityProfileParams {
  category_id?: number;
  include_children?: boolean;
  source_type?: null | StudyAbilityProfileSourceType;
}

export interface ListStudyPlanItemRecommendationParams extends GetMentorStudyAbilityProfileParams {
  limit?: number;
  module_type?: null | StudyPlanRecommendationModuleType;
}

export interface StudyUserCategoryProfileDetail {
  accuracy_rate: number;
  algorithm_version: string;
  attempt_count: number;
  avg_seconds?: null | number;
  category_code?: null | string;
  category_id: number;
  category_name?: null | string;
  category_type?: null | string;
  confidence_score: number;
  correct_count: number;
  duration_seconds: number;
  id: number;
  last_attempt_at?: null | string;
  mastery_score: number;
  source_type: string;
  speed_score: number;
  total_count: number;
  trend_score: number;
  updated_time?: null | string;
  user_id: number;
  weakness_score: number;
}

export interface StudyPlanItemRecommendationDraft {
  expected_minutes: number;
  extra?: null | Record<string, unknown>;
  module_type: StudyPlanModuleType;
  ref_id?: null | number;
  ref_type: StudyPlanRefType;
  title: string;
}

export interface StudyPlanItemRecommendation {
  accuracy_rate: number;
  category_code?: null | string;
  category_id: number;
  category_name?: null | string;
  category_type?: null | string;
  confidence_score: number;
  item: StudyPlanItemRecommendationDraft;
  mastery_score: number;
  module_type: StudyPlanRecommendationModuleType;
  payload?: null | Record<string, unknown>;
  priority_score: number;
  reason: string;
  reason_codes: string[];
  recommendation_key: string;
  source_types: string[];
  speed_score: number;
  strategy: string;
  strategy_version: string;
  target_accuracy?: null | number;
  target_question_count?: null | number;
  total_count: number;
  weakness_score: number;
}

export interface StudyPlanPracticeSourcePreviewParams {
  bank_id?: null | number;
  cat_id?: null | number;
  chapter_id?: null | number;
  knowledge_points?: Array<number | Record<string, unknown> | string> | null;
  question_count?: null | number;
  question_ids?: null | number[];
  question_types?: null | StudyPlanQuestionType[];
  region?: null | string;
  source_mode: StudyPlanPracticeSourceMode;
  year_end?: null | number;
  year_start?: null | number;
}

export interface StudyPlanPracticeSourcePreviewResult {
  available_count: number;
  sample_question_ids: number[];
  selected_count: number;
}

export interface CreateStudyPlanParams {
  domain?: string;
  end_date: string;
  start_date: string;
  template_id?: null | number;
  title: string;
  user_id: number;
}

export interface UpdateStudyPlanParams {
  end_date?: string;
  start_date?: string;
  status?: StudyPlanStatus;
  title?: string;
}

export interface InstantiateStudyPlanTemplateParams {
  start_date: string;
  template_id: number;
  title: string;
  user_id: number;
}

export interface StudyPlanItemDetail {
  created_time: string;
  expected_minutes: number;
  extra?: null | Record<string, unknown>;
  id: number;
  module_type: StudyPlanModuleType;
  order_index: number;
  plan_date: string;
  plan_id: number;
  latest_record?: null | StudyPlanRecordDetail;
  ref_id?: null | number;
  ref_type: StudyPlanRefType;
  status: StudyPlanItemStatus;
  title: string;
  user_id: number;
}

export interface CreateStudyPlanItemParams {
  expected_minutes?: number;
  extra?: null | Record<string, unknown>;
  module_type: StudyPlanModuleType;
  order_index: number;
  plan_date: string;
  plan_id: number;
  ref_id?: null | number;
  ref_type: StudyPlanRefType;
  title: string;
}

export interface UpdateStudyPlanItemParams extends Partial<CreateStudyPlanItemParams> {
  status?: StudyPlanItemStatus;
}

export interface StudyPlanTemplateItemParams {
  day_index: number;
  expected_minutes?: number;
  extra?: null | Record<string, unknown>;
  module_type: StudyPlanModuleType;
  order_index: number;
  ref_id?: null | number;
  ref_type: StudyPlanRefType;
  title: string;
}

export interface StudyPlanTemplateItemDetail extends StudyPlanTemplateItemParams {
  id: number;
  template_id: number;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UpdateStudyPlanTemplateItemParams extends Partial<StudyPlanTemplateItemParams> {}

export interface StudyPlanTemplateDetail {
  created_by: number;
  created_time: string;
  description?: null | string;
  domain: string;
  duration_days: number;
  id: number;
  is_active: boolean;
  name: string;
}

export interface StudyPlanTemplateWithItemsDetail extends StudyPlanTemplateDetail {
  items: StudyPlanTemplateItemDetail[];
}

export interface CreateStudyPlanTemplateParams {
  description?: null | string;
  domain?: string;
  duration_days: number;
  is_active?: boolean;
  items?: StudyPlanTemplateItemParams[];
  name: string;
}

export interface UpdateStudyPlanTemplateParams {
  description?: null | string;
  duration_days?: number;
  is_active?: boolean;
  name?: string;
}

export interface AssignMentorStudentParams {
  mentor_id: number;
  note?: null | string;
  student_id: number;
}

export interface ListMentorStudentParams {
  mentor_id?: number;
  status?: StudyMentorStatus;
  student_id?: number;
}

export interface MentorStudentDetail {
  assigned_at: string;
  assigned_by?: null | number;
  id: number;
  mentor_id: number;
  note?: null | string;
  status: StudyMentorStatus;
  student_id: number;
}

export interface MentorStudentOption {
  assigned_at: string;
  id: number;
  status: StudyMentorStatus;
  student_id: number;
  student_nickname?: null | string;
  student_username?: null | string;
}

export async function createStudyPlanFromTemplateApi(
  data: InstantiateStudyPlanTemplateParams,
) {
  return requestClient.post<StudyPlanDetail>(
    '/api/v1/study/mentor/plans/from-template',
    data,
  );
}

export async function getSpatialCubePatternsApi(
  params?: SpatialCubePatternQueryParams,
) {
  return requestClient.get<PaginationResult<SpatialCubePatternDetail>>(
    '/api/v1/study/admin/spatial-cube/patterns',
    { params },
  );
}

export async function createSpatialCubePatternApi(
  data: CreateSpatialCubePatternParams,
) {
  return requestClient.post<SpatialCubePatternDetail>(
    '/api/v1/study/admin/spatial-cube/patterns',
    data,
  );
}

export async function updateSpatialCubePatternApi(
  patternId: number,
  data: UpdateSpatialCubePatternParams,
) {
  return requestClient.put<SpatialCubePatternDetail>(
    `/api/v1/study/admin/spatial-cube/patterns/${patternId}`,
    data,
  );
}

export async function deleteSpatialCubePatternApi(patternId: number) {
  return requestClient.delete(
    `/api/v1/study/admin/spatial-cube/patterns/${patternId}`,
  );
}

export async function getStudyPlanAbilityCatalogApi(
  domainOrParams?: ListStudyAbilityCatalogParams | string,
) {
  const params =
    typeof domainOrParams === 'string'
      ? { domain: domainOrParams }
      : domainOrParams;
  return requestClient.get<StudyPlanAbilityCatalogItem[]>(
    '/api/v1/study/admin/ability-catalog',
    { params },
  );
}

export async function createStudyAbilityCatalogApi(
  data: CreateStudyAbilityCatalogParams,
) {
  return requestClient.post<StudyPlanAbilityCatalogItem>(
    '/api/v1/study/admin/ability-catalog',
    data,
  );
}

export async function updateStudyAbilityCatalogApi(
  catalogId: number,
  data: UpdateStudyAbilityCatalogParams,
) {
  return requestClient.put<StudyPlanAbilityCatalogItem>(
    `/api/v1/study/admin/ability-catalog/${catalogId}`,
    data,
  );
}

export async function deleteStudyAbilityCatalogApi(catalogId: number) {
  return requestClient.delete(
    `/api/v1/study/admin/ability-catalog/${catalogId}`,
  );
}

export async function getStudyAbilityBindingsApi(
  params: ListStudyAbilityBindingParams = {},
) {
  return requestClient.get<StudyAbilityCategoryBindingDetail[]>(
    '/api/v1/study/admin/ability-bindings',
    { params },
  );
}

export async function createStudyAbilityBindingApi(
  data: CreateStudyAbilityCategoryBindingParams,
) {
  return requestClient.post<StudyAbilityCategoryBindingDetail>(
    '/api/v1/study/admin/ability-bindings',
    data,
  );
}

export async function updateStudyAbilityBindingApi(
  bindingId: number,
  data: UpdateStudyAbilityCategoryBindingParams,
) {
  return requestClient.put<StudyAbilityCategoryBindingDetail>(
    `/api/v1/study/admin/ability-bindings/${bindingId}`,
    data,
  );
}

export async function deleteStudyAbilityBindingApi(bindingId: number) {
  return requestClient.delete(
    `/api/v1/study/admin/ability-bindings/${bindingId}`,
  );
}

export async function previewStudyPlanPracticeSourceApi(
  data: StudyPlanPracticeSourcePreviewParams,
) {
  return requestClient.post<StudyPlanPracticeSourcePreviewResult>(
    '/api/v1/study/admin/practice-sources/preview',
    data,
  );
}

export async function createBlankStudyPlanApi(data: CreateStudyPlanParams) {
  return requestClient.post<StudyPlanDetail>(
    '/api/v1/study/mentor/plans',
    data,
  );
}

export async function getMentorStudyPlansApi(studentId: number) {
  return requestClient.get<StudyPlanDetail[]>('/api/v1/study/mentor/plans', {
    params: { student_id: studentId },
  });
}

export async function updateStudyPlanApi(
  planId: number,
  data: UpdateStudyPlanParams,
) {
  return requestClient.put<StudyPlanDetail>(
    `/api/v1/study/mentor/plans/${planId}`,
    data,
  );
}

export async function getMentorStudyPlanProgressApi(planId: number) {
  return requestClient.get<StudyPlanProgress>(
    `/api/v1/study/mentor/plans/${planId}/progress`,
  );
}

export async function getMentorStudyPlanItemsApi(planId: number) {
  return requestClient.get<StudyPlanItemDetail[]>(
    `/api/v1/study/mentor/plans/${planId}/items`,
  );
}

export async function getMentorStudyAbilityProfileApi(
  studentId: number,
  paramsOrSource:
    | GetMentorStudyAbilityProfileParams
    | null
    | StudyAbilityProfileSourceType = {},
) {
  const resolvedParams =
    typeof paramsOrSource === 'string'
      ? { source_type: paramsOrSource }
      : (paramsOrSource ?? {});
  const params: Record<string, boolean | number | string> = {};
  if (resolvedParams.source_type) {
    params.source_type = resolvedParams.source_type;
  }
  if (resolvedParams.category_id) {
    params.category_id = resolvedParams.category_id;
  }
  if (resolvedParams.include_children !== undefined) {
    params.include_children = resolvedParams.include_children;
  }

  return requestClient.get<StudyUserCategoryProfileDetail[]>(
    `/api/v1/study/mentor/students/${studentId}/ability-profile`,
    { params },
  );
}

export async function getMentorStudyPlanItemRecommendationsApi(
  studentId: number,
  params: ListStudyPlanItemRecommendationParams = {},
) {
  const resolvedParams: Record<string, boolean | number | string> = {};
  if (params.source_type) {
    resolvedParams.source_type = params.source_type;
  }
  if (params.category_id) {
    resolvedParams.category_id = params.category_id;
  }
  if (params.include_children !== undefined) {
    resolvedParams.include_children = params.include_children;
  }
  if (params.module_type) {
    resolvedParams.module_type = params.module_type;
  }
  if (params.limit) {
    resolvedParams.limit = params.limit;
  }

  return requestClient.get<StudyPlanItemRecommendation[]>(
    `/api/v1/study/mentor/students/${studentId}/plan-item-recommendations`,
    { params: resolvedParams },
  );
}

export async function getMentorStudyStudentsApi() {
  return requestClient.get<MentorStudentOption[]>(
    '/api/v1/study/mentor/students',
  );
}

export async function createStudyPlanItemApi(data: CreateStudyPlanItemParams) {
  return requestClient.post<StudyPlanItemDetail>(
    '/api/v1/study/mentor/items',
    data,
  );
}

export async function updateStudyPlanItemApi(
  itemId: number,
  data: UpdateStudyPlanItemParams,
) {
  return requestClient.put<StudyPlanItemDetail>(
    `/api/v1/study/mentor/items/${itemId}`,
    data,
  );
}

export async function deleteStudyPlanItemApi(itemId: number) {
  return requestClient.delete(`/api/v1/study/mentor/items/${itemId}`);
}

export async function createStudyPlanTemplateApi(
  data: CreateStudyPlanTemplateParams,
) {
  return requestClient.post<StudyPlanTemplateDetail>(
    '/api/v1/study/admin/templates',
    data,
  );
}

export async function updateStudyPlanTemplateApi(
  templateId: number,
  data: UpdateStudyPlanTemplateParams,
) {
  return requestClient.put<StudyPlanTemplateDetail>(
    `/api/v1/study/admin/templates/${templateId}`,
    data,
  );
}

export async function createStudyPlanTemplateItemApi(
  templateId: number,
  data: StudyPlanTemplateItemParams,
) {
  return requestClient.post<StudyPlanTemplateItemDetail>(
    `/api/v1/study/admin/templates/${templateId}/items`,
    data,
  );
}

export async function updateStudyPlanTemplateItemApi(
  itemId: number,
  data: UpdateStudyPlanTemplateItemParams,
) {
  return requestClient.put<StudyPlanTemplateItemDetail>(
    `/api/v1/study/admin/template-items/${itemId}`,
    data,
  );
}

export async function deleteStudyPlanTemplateItemApi(itemId: number) {
  return requestClient.delete(`/api/v1/study/admin/template-items/${itemId}`);
}

export async function getStudyPlanTemplatesApi() {
  return requestClient.get<StudyPlanTemplateDetail[]>(
    '/api/v1/study/admin/templates',
  );
}

export async function getStudyPlanTemplateApi(templateId: number) {
  return requestClient.get<StudyPlanTemplateWithItemsDetail>(
    `/api/v1/study/admin/templates/${templateId}`,
  );
}

export async function assignStudyMentorStudentApi(
  data: AssignMentorStudentParams,
) {
  return requestClient.post<MentorStudentDetail>(
    '/api/v1/study/admin/mentors/assign',
    data,
  );
}

export async function getStudyMentorStudentsApi(
  params: ListMentorStudentParams = {},
) {
  return requestClient.get<MentorStudentDetail[]>(
    '/api/v1/study/admin/mentors',
    { params },
  );
}

export async function updateStudyMentorStudentStatusApi(
  relationId: number,
  status: StudyMentorStatus,
) {
  return requestClient.put<MentorStudentDetail>(
    `/api/v1/study/admin/mentors/${relationId}/status`,
    { status },
  );
}
