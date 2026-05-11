import { requestClient } from './request';

export interface PageData<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
  links: any;
}

// ==================== 任务 ====================
export interface QuestResult {
  id: number;
  code: string;
  name: string;
  brief: string;
  info?: string;
  detail?: string;
  cover_image?: string;
  start_time?: string;
  end_time?: string;
  status: number;
  total_quota: number;
  claimed_count: number;
  max_claims_per_user: number;
  claim_expire_seconds: number;
  submission_required: boolean;
  review_required: boolean;
  reward_type: string;
  reward_data?: Record<string, any>;
  sort: number;
  created_by?: number;
  created_time: string;
  updated_time?: string;
}

export interface CreateQuestParams {
  code: string;
  name: string;
  brief: string;
  info?: string;
  detail?: string;
  cover_image?: string;
  start_time?: string;
  end_time?: string;
  status?: number;
  total_quota?: number;
  max_claims_per_user?: number;
  claim_expire_seconds?: number;
  submission_required?: boolean;
  review_required?: boolean;
  reward_type?: string;
  reward_data?: Record<string, any>;
  sort?: number;
}

export interface UpdateQuestParams {
  name?: string;
  brief?: string;
  info?: string;
  detail?: string;
  cover_image?: string;
  start_time?: string;
  end_time?: string;
  status?: number;
  total_quota?: number;
  max_claims_per_user?: number;
  claim_expire_seconds?: number;
  submission_required?: boolean;
  review_required?: boolean;
  reward_type?: string;
  reward_data?: Record<string, any>;
  sort?: number;
}

export interface QuestListParams {
  status?: number;
  keyword?: string;
  page?: number;
  size?: number;
}

export async function getQuestListApi(params: QuestListParams) {
  return requestClient.get<PageData<QuestResult>>(
    '/api/v1/quest/admin/quests',
    {
      params,
    },
  );
}

export async function createQuestApi(data: CreateQuestParams) {
  return requestClient.post<QuestResult>('/api/v1/quest/admin/quests', data);
}

export async function updateQuestApi(pk: number, data: UpdateQuestParams) {
  return requestClient.put(`/api/v1/quest/admin/quests/${pk}`, data);
}

export async function deleteQuestApi(pk: number) {
  return requestClient.delete(`/api/v1/quest/admin/quests/${pk}`);
}

// ==================== 领取/审核 ====================
export interface QuestClaimResult {
  id: number;
  quest_id: number;
  user_id: number;
  claim_status: number;
  claim_time?: string;
  expire_time?: string;
  submission_links?: string[];
  submission_images?: string[];
  submission_note?: string;
  submit_time?: string;
  review_remark?: string;
  reviewed_by?: number;
  review_time?: string;
  reward_status: number;
  granted_at?: string;
  created_time: string;
}

export interface QuestClaimListParams {
  quest_id?: number;
  user_id?: number;
  claim_status?: number;
  page?: number;
  size?: number;
}

export async function getQuestClaimListApi(params: QuestClaimListParams) {
  return requestClient.get<PageData<QuestClaimResult>>(
    '/api/v1/quest/admin/claims',
    { params },
  );
}

export interface ReviewClaimParams {
  decision: 'approve' | 'reject';
  remark?: string;
}

export interface ReviewClaimResult {
  claim_id: number;
  claim_status: number;
  reward_granted: boolean;
  message: string;
}

export async function reviewQuestClaimApi(pk: number, data: ReviewClaimParams) {
  return requestClient.post<ReviewClaimResult>(
    `/api/v1/quest/admin/claims/${pk}/review`,
    data,
  );
}

export async function retryGrantQuestClaimApi(pk: number) {
  return requestClient.post(`/api/v1/quest/admin/claims/${pk}/retry-grant`);
}

export interface RevokeClaimParams {
  remark?: string;
}

export interface RevokeClaimResult {
  claim_id: number;
  claim_status: number;
  reward_revoked: boolean;
  message: string;
}

export async function revokeQuestClaimApi(pk: number, data: RevokeClaimParams) {
  return requestClient.post<RevokeClaimResult>(
    `/api/v1/quest/admin/claims/${pk}/revoke`,
    data,
  );
}
