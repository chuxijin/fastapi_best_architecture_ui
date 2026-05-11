import type { PageData } from './quest';

import { requestClient } from './request';

// ==================== 内容运营位 ====================
export type CmsSlotType =
  | 'banner'
  | 'curtain'
  | 'float'
  | 'notice'
  | 'popup'
  | 'splash';

export type CmsJumpType =
  | 'content'
  | 'custom'
  | 'miniprogram'
  | 'none'
  | 'quest'
  | 'url';

export interface CmsSlotResult {
  id: number;
  code: string;
  name: string;
  slot_type: string;
  scene: string;
  title?: string;
  subtitle?: string;
  image_url?: string;
  detail?: string;
  jump_type: string;
  jump_target?: string;
  jump_extra?: Record<string, any>;
  start_time?: string;
  end_time?: string;
  status: number;
  priority: number;
  target_user_type: number;
  target_min_member_level: number;
  target_extra?: Record<string, any>;
  max_show_per_user: number;
  max_show_per_day_per_user: number;
  close_dismiss_count: number;
  can_close: boolean;
  extra?: Record<string, any>;
  created_by?: number;
  created_time: string;
  updated_time?: string;
}

export interface CreateCmsSlotParams {
  code: string;
  name: string;
  slot_type: string;
  scene: string;
  title?: string;
  subtitle?: string;
  image_url?: string;
  detail?: string;
  jump_type?: string;
  jump_target?: string;
  jump_extra?: Record<string, any>;
  start_time?: string;
  end_time?: string;
  status?: number;
  priority?: number;
  target_user_type?: number;
  target_min_member_level?: number;
  target_extra?: Record<string, any>;
  max_show_per_user?: number;
  max_show_per_day_per_user?: number;
  close_dismiss_count?: number;
  can_close?: boolean;
  extra?: Record<string, any>;
}

export interface UpdateCmsSlotParams {
  name?: string;
  slot_type?: string;
  scene?: string;
  title?: string;
  subtitle?: string;
  image_url?: string;
  detail?: string;
  jump_type?: string;
  jump_target?: string;
  jump_extra?: Record<string, any>;
  start_time?: string;
  end_time?: string;
  status?: number;
  priority?: number;
  target_user_type?: number;
  target_min_member_level?: number;
  target_extra?: Record<string, any>;
  max_show_per_user?: number;
  max_show_per_day_per_user?: number;
  close_dismiss_count?: number;
  can_close?: boolean;
  extra?: Record<string, any>;
}

export interface CmsSlotListParams {
  status?: number;
  slot_type?: string;
  scene?: string;
  keyword?: string;
  page?: number;
  size?: number;
}

export interface CmsSlotStatsResult {
  show_count: number;
  click_count: number;
  close_count: number;
  ctr: number;
}

export async function getCmsSlotListApi(params: CmsSlotListParams) {
  return requestClient.get<PageData<CmsSlotResult>>('/api/v1/cms/admin/slots', {
    params,
  });
}

export async function getCmsSlotDetailApi(pk: number) {
  return requestClient.get<CmsSlotResult>(`/api/v1/cms/admin/slots/${pk}`);
}

export async function createCmsSlotApi(data: CreateCmsSlotParams) {
  return requestClient.post<CmsSlotResult>('/api/v1/cms/admin/slots', data);
}

export async function updateCmsSlotApi(pk: number, data: UpdateCmsSlotParams) {
  return requestClient.put(`/api/v1/cms/admin/slots/${pk}`, data);
}

export async function deleteCmsSlotApi(pk: number) {
  return requestClient.delete(`/api/v1/cms/admin/slots/${pk}`);
}

export async function getCmsSlotStatsApi(pk: number, days = 7) {
  return requestClient.get<CmsSlotStatsResult>(
    `/api/v1/cms/admin/slots/${pk}/stats`,
    { params: { days } },
  );
}
