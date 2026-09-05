import { requestClient } from '#/api/request';

export type LearningPlanSource = 'admin_custom' | 'ai' | 'system' | 'user';
export type LearningPlanStatus =
  | 'active'
  | 'archived'
  | 'completed'
  | 'draft'
  | 'paused';
export type LearningDeliverySource =
  | 'external_order'
  | 'gift'
  | 'internal'
  | 'manual'
  | 'other';
export type LearningDeliveryStatus =
  | 'canceled'
  | 'delivered'
  | 'drafting'
  | 'pending'
  | 'validated';
export type LearningActionType =
  | 'ability'
  | 'custom'
  | 'learn'
  | 'practice'
  | 'read'
  | 'review'
  | 'wrong_review';
export type LearningResourceType =
  | 'ability'
  | 'content'
  | 'course'
  | 'course_lesson'
  | 'external'
  | 'none'
  | 'question_bank';
export type LearningTaskStatus =
  | 'canceled'
  | 'completed'
  | 'in_progress'
  | 'pending'
  | 'skipped';
export type LearningTemplateStatus = 'active' | 'archived' | 'draft';

export interface LearningPlanDetail {
  id: number;
  user_id: number;
  username?: null | string;
  nickname?: null | string;
  title: string;
  start_date: string;
  end_date?: null | string;
  source_type: LearningPlanSource;
  status: LearningPlanStatus;
  delivery_id?: null | number;
  template_id?: null | number;
  template_name?: null | string;
  description?: null | string;
  settings?: null | Record<string, unknown>;
  task_count: number;
  completed_task_count: number;
  created_by: number;
  created_time: string;
  updated_time?: null | string;
}

export interface CreateLearningPlanParams {
  user_id: number;
  title: string;
  start_date: string;
  end_date?: null | string;
  source_type: LearningPlanSource;
  status: LearningPlanStatus;
  delivery_id?: null | number;
  description?: null | string;
  settings?: null | Record<string, unknown>;
}

export type UpdateLearningPlanParams = Partial<
  Omit<CreateLearningPlanParams, 'user_id'>
>;

export interface LearningTaskKnowledgePoint {
  id?: number;
  knowledge_system_id: number;
  knowledge_point_id: number;
  knowledge_point_code?: null | string;
  knowledge_point_name?: null | string;
  knowledge_point_path?: null | string;
  knowledge_system_name?: null | string;
  role: 'primary' | 'secondary';
  include_descendants: boolean;
  weight: number;
}

export interface LearningTaskGoal {
  id?: number;
  metric: string;
  operator: 'eq' | 'gte' | 'lte';
  target_value?: null | number;
  unit?: null | string;
  is_required: boolean;
  config?: null | Record<string, unknown>;
}

export interface LearningTaskDetail {
  id: number;
  plan_id: number;
  user_id: number;
  delivery_id?: null | number;
  plan_date: string;
  order_index: number;
  title: string;
  action_type: LearningActionType;
  resource_type: LearningResourceType;
  resource_id?: null | number;
  resource_key?: null | string;
  resource_version_id?: null | number;
  resource_config?: null | Record<string, unknown>;
  expected_minutes: number;
  due_at?: null | string;
  remind_at?: null | string;
  status: LearningTaskStatus;
  description?: null | string;
  knowledge_points: LearningTaskKnowledgePoint[];
  goals: LearningTaskGoal[];
  created_by: number;
  created_time: string;
  updated_time?: null | string;
}

export interface CreateLearningTaskParams {
  plan_id: number;
  delivery_id?: null | number;
  plan_date: string;
  order_index: number;
  title: string;
  action_type: LearningActionType;
  resource_type: LearningResourceType;
  resource_id?: null | number;
  resource_key?: null | string;
  resource_version_id?: null | number;
  resource_config?: null | Record<string, unknown>;
  expected_minutes: number;
  due_at?: null | string;
  remind_at?: null | string;
  description?: null | string;
  knowledge_points: LearningTaskKnowledgePoint[];
  goals: LearningTaskGoal[];
}

export type UpdateLearningTaskParams = Partial<
  Omit<CreateLearningTaskParams, 'plan_id'>
> & {
  status?: LearningTaskStatus;
};

export interface LearningDeliveryDetail {
  id: number;
  delivery_no: string;
  user_id?: null | number;
  username?: null | string;
  nickname?: null | string;
  source_type: LearningDeliverySource;
  source_channel?: null | string;
  external_order_no?: null | string;
  external_customer_ref?: null | string;
  requirements?: null | Record<string, unknown>;
  source_meta?: null | Record<string, unknown>;
  status: LearningDeliveryStatus;
  assigned_to?: null | number;
  delivered_by?: null | number;
  delivered_at?: null | string;
  remark?: null | string;
  plan_id?: null | number;
  plan_title?: null | string;
  template_id?: null | number;
  template_name?: null | string;
  task_count: number;
  created_by: number;
  created_time: string;
  updated_time?: null | string;
}

export interface CreateLearningDeliveryParams {
  user_id?: null | number;
  source_type: LearningDeliverySource;
  source_channel?: null | string;
  external_order_no?: null | string;
  external_customer_ref?: null | string;
  requirements?: null | Record<string, unknown>;
  source_meta?: null | Record<string, unknown>;
  assigned_to?: null | number;
  remark?: null | string;
  plan?: null | {
    description?: null | string;
    end_date?: null | string;
    start_date: string;
    template_id?: null | number;
    title?: null | string;
  };
}

export type UpdateLearningDeliveryParams = Partial<
  Omit<CreateLearningDeliveryParams, 'plan'>
> & {
  status?: LearningDeliveryStatus;
};

export interface LearningPlanTemplateDetail {
  id: number;
  code: string;
  name: string;
  exam_type?: null | string;
  version: number;
  duration_days: number;
  default_daily_minutes: number;
  status: LearningTemplateStatus;
  description?: null | string;
  settings?: null | Record<string, unknown>;
  stage_count: number;
  task_count: number;
  created_by: number;
  created_time: string;
  updated_time?: null | string;
}

export interface CreateLearningPlanTemplateParams {
  code: string;
  name: string;
  exam_type?: null | string;
  version: number;
  duration_days: number;
  default_daily_minutes: number;
  status: LearningTemplateStatus;
  description?: null | string;
  settings?: null | Record<string, unknown>;
}

export type UpdateLearningPlanTemplateParams =
  Partial<CreateLearningPlanTemplateParams>;

export interface LearningPlanTemplateStageDetail {
  id: number;
  template_id: number;
  name: string;
  start_day: number;
  end_day: number;
  order_index: number;
  description?: null | string;
  created_time: string;
  updated_time?: null | string;
}

export interface CreateLearningPlanTemplateStageParams {
  template_id: number;
  name: string;
  start_day: number;
  end_day: number;
  order_index: number;
  description?: null | string;
}

export type UpdateLearningPlanTemplateStageParams = Partial<
  Omit<CreateLearningPlanTemplateStageParams, 'template_id'>
>;

export interface LearningPlanTemplateTaskDetail {
  id: number;
  template_id: number;
  relative_day: number;
  stage_id?: null | number;
  stage_name?: null | string;
  order_index: number;
  title: string;
  action_type: LearningActionType;
  resource_type: LearningResourceType;
  resource_id?: null | number;
  resource_key?: null | string;
  resource_version_id?: null | number;
  resource_config?: null | Record<string, unknown>;
  expected_minutes: number;
  description?: null | string;
  knowledge_points: LearningTaskKnowledgePoint[];
  goals: LearningTaskGoal[];
  created_time: string;
  updated_time?: null | string;
}

export interface CreateLearningPlanTemplateTaskParams {
  template_id: number;
  relative_day: number;
  stage_id?: null | number;
  order_index: number;
  title: string;
  action_type: LearningActionType;
  resource_type: LearningResourceType;
  resource_id?: null | number;
  resource_key?: null | string;
  resource_version_id?: null | number;
  resource_config?: null | Record<string, unknown>;
  expected_minutes: number;
  description?: null | string;
  knowledge_points: LearningTaskKnowledgePoint[];
  goals: LearningTaskGoal[];
}

export type UpdateLearningPlanTemplateTaskParams = Partial<
  Omit<CreateLearningPlanTemplateTaskParams, 'template_id'>
>;

export async function getLearningPlansApi(params?: Record<string, unknown>) {
  return requestClient.get<LearningPlanDetail[]>(
    '/api/v1/learning/admin/plans',
    { params },
  );
}

export async function createLearningPlanApi(data: CreateLearningPlanParams) {
  return requestClient.post<LearningPlanDetail>(
    '/api/v1/learning/admin/plans',
    data,
  );
}

export async function updateLearningPlanApi(
  planId: number,
  data: UpdateLearningPlanParams,
) {
  return requestClient.put<LearningPlanDetail>(
    `/api/v1/learning/admin/plans/${planId}`,
    data,
  );
}

export async function deleteLearningPlanApi(planId: number) {
  return requestClient.delete(`/api/v1/learning/admin/plans/${planId}`);
}

export async function getLearningTasksApi(planId: number) {
  return requestClient.get<LearningTaskDetail[]>(
    `/api/v1/learning/admin/plans/${planId}/tasks`,
  );
}

export async function createLearningTaskApi(data: CreateLearningTaskParams) {
  return requestClient.post<LearningTaskDetail>(
    '/api/v1/learning/admin/tasks',
    data,
  );
}

export async function updateLearningTaskApi(
  taskId: number,
  data: UpdateLearningTaskParams,
) {
  return requestClient.put<LearningTaskDetail>(
    `/api/v1/learning/admin/tasks/${taskId}`,
    data,
  );
}

export async function deleteLearningTaskApi(taskId: number) {
  return requestClient.delete(`/api/v1/learning/admin/tasks/${taskId}`);
}

export async function getLearningDeliveriesApi(
  params?: Record<string, unknown>,
) {
  return requestClient.get<LearningDeliveryDetail[]>(
    '/api/v1/learning/admin/deliveries',
    { params },
  );
}

export async function createLearningDeliveryApi(
  data: CreateLearningDeliveryParams,
) {
  return requestClient.post<LearningDeliveryDetail>(
    '/api/v1/learning/admin/deliveries',
    data,
  );
}

export async function updateLearningDeliveryApi(
  deliveryId: number,
  data: UpdateLearningDeliveryParams,
) {
  return requestClient.put<LearningDeliveryDetail>(
    `/api/v1/learning/admin/deliveries/${deliveryId}`,
    data,
  );
}

export async function publishLearningDeliveryApi(deliveryId: number) {
  return requestClient.post<LearningDeliveryDetail>(
    `/api/v1/learning/admin/deliveries/${deliveryId}/publish`,
  );
}

export async function getLearningPlanTemplatesApi(
  params?: Record<string, unknown>,
) {
  return requestClient.get<LearningPlanTemplateDetail[]>(
    '/api/v1/learning/admin/templates',
    { params },
  );
}

export async function createLearningPlanTemplateApi(
  data: CreateLearningPlanTemplateParams,
) {
  return requestClient.post<LearningPlanTemplateDetail>(
    '/api/v1/learning/admin/templates',
    data,
  );
}

export async function updateLearningPlanTemplateApi(
  templateId: number,
  data: UpdateLearningPlanTemplateParams,
) {
  return requestClient.put<LearningPlanTemplateDetail>(
    `/api/v1/learning/admin/templates/${templateId}`,
    data,
  );
}

export async function deleteLearningPlanTemplateApi(templateId: number) {
  return requestClient.delete(`/api/v1/learning/admin/templates/${templateId}`);
}

export async function getLearningPlanTemplateStagesApi(templateId: number) {
  return requestClient.get<LearningPlanTemplateStageDetail[]>(
    `/api/v1/learning/admin/templates/${templateId}/stages`,
  );
}

export async function createLearningPlanTemplateStageApi(
  data: CreateLearningPlanTemplateStageParams,
) {
  return requestClient.post<LearningPlanTemplateStageDetail>(
    '/api/v1/learning/admin/template-stages',
    data,
  );
}

export async function updateLearningPlanTemplateStageApi(
  stageId: number,
  data: UpdateLearningPlanTemplateStageParams,
) {
  return requestClient.put<LearningPlanTemplateStageDetail>(
    `/api/v1/learning/admin/template-stages/${stageId}`,
    data,
  );
}

export async function deleteLearningPlanTemplateStageApi(stageId: number) {
  return requestClient.delete(
    `/api/v1/learning/admin/template-stages/${stageId}`,
  );
}

export async function getLearningPlanTemplateTasksApi(templateId: number) {
  return requestClient.get<LearningPlanTemplateTaskDetail[]>(
    `/api/v1/learning/admin/templates/${templateId}/tasks`,
  );
}

export async function createLearningPlanTemplateTaskApi(
  data: CreateLearningPlanTemplateTaskParams,
) {
  return requestClient.post<LearningPlanTemplateTaskDetail>(
    '/api/v1/learning/admin/template-tasks',
    data,
  );
}

export async function updateLearningPlanTemplateTaskApi(
  taskId: number,
  data: UpdateLearningPlanTemplateTaskParams,
) {
  return requestClient.put<LearningPlanTemplateTaskDetail>(
    `/api/v1/learning/admin/template-tasks/${taskId}`,
    data,
  );
}

export async function deleteLearningPlanTemplateTaskApi(taskId: number) {
  return requestClient.delete(
    `/api/v1/learning/admin/template-tasks/${taskId}`,
  );
}

export async function instantiateLearningDeliveryPlanApi(
  deliveryId: number,
  data: {
    description?: null | string;
    start_date: string;
    template_id: number;
    title?: null | string;
  },
) {
  return requestClient.post<LearningPlanDetail>(
    `/api/v1/learning/admin/deliveries/${deliveryId}/instantiate`,
    data,
  );
}
