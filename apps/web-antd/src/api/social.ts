import type { PaginationResult } from '#/types';

import { requestClient } from './request';

// 平台枚举
export type SocialPlatform =
  | 'bilibili'
  | 'douyin'
  | 'kuaishou'
  | 'qq'
  | 'tieba'
  | 'weibo'
  | 'xhs';

export const SOCIAL_PLATFORM_OPTIONS: Array<{
  label: string;
  value: SocialPlatform;
}> = [
  { label: '抖音', value: 'douyin' },
  { label: '小红书', value: 'xhs' },
  { label: '微博', value: 'weibo' },
  { label: 'QQ', value: 'qq' },
  { label: '贴吧', value: 'tieba' },
  { label: 'B站', value: 'bilibili' },
  { label: '快手', value: 'kuaishou' },
];

// ============ Account ============
export interface SocialAccountDetail {
  id: number;
  name: string;
  homepage?: string;
  phone?: string;
  platform: SocialPlatform | string;
  domain: string;
  account_info?: null | Record<string, any>;
  created_time: string;
  updated_time?: string;
}

export interface SocialAccountListParams {
  platform?: SocialPlatform | string;
  name?: string;
  domain?: string;
  page?: number;
  size?: number;
}

export interface CreateSocialAccountParams {
  name: string;
  platform: SocialPlatform | string;
  domain: string;
  homepage?: string;
  phone?: string;
  account_info?: null | Record<string, any>;
}

export interface UpdateSocialAccountParams {
  name?: string;
  platform?: SocialPlatform | string;
  domain?: string;
  homepage?: string;
  phone?: string;
  account_info?: null | Record<string, any>;
}

export async function getSocialAccountListApi(params: SocialAccountListParams) {
  return requestClient.get<PaginationResult<SocialAccountDetail>>(
    '/api/v1/social/account',
    { params },
  );
}

export async function getSocialAccountDetailApi(id: number) {
  return requestClient.get<SocialAccountDetail>(`/api/v1/social/account/${id}`);
}

export async function createSocialAccountApi(
  params: CreateSocialAccountParams,
) {
  return requestClient.post<SocialAccountDetail>(
    '/api/v1/social/account',
    params,
  );
}

export async function updateSocialAccountApi(
  id: number,
  params: UpdateSocialAccountParams,
) {
  return requestClient.put(`/api/v1/social/account/${id}`, params);
}

export async function deleteSocialAccountApi(ids: number[]) {
  return requestClient.delete('/api/v1/social/account', {
    params: { pks: ids },
  });
}

// ============ Work ============
export interface SocialWorkDetail {
  id: number;
  account_id: number;
  work_url: string;
  copywriting?: null | Record<string, any>;
  external_id: string;
  published_at?: string;
  created_time: string;
  updated_time?: string;
}

export interface SocialWorkListParams {
  account_id?: number;
  external_id?: string;
  page?: number;
  size?: number;
}

export interface CreateSocialWorkParams {
  account_id: number;
  work_url: string;
  external_id?: string;
  copywriting?: null | Record<string, any>;
  published_at?: string;
}

export interface UpdateSocialWorkParams {
  work_url?: string;
  external_id?: string;
  copywriting?: null | Record<string, any>;
  published_at?: string;
}

export async function getSocialWorkListApi(params: SocialWorkListParams) {
  return requestClient.get<PaginationResult<SocialWorkDetail>>(
    '/api/v1/social/work',
    { params },
  );
}

export async function getSocialWorkDetailApi(id: number) {
  return requestClient.get<SocialWorkDetail>(`/api/v1/social/work/${id}`);
}

export async function createSocialWorkApi(params: CreateSocialWorkParams) {
  return requestClient.post<SocialWorkDetail>('/api/v1/social/work', params);
}

export async function updateSocialWorkApi(
  id: number,
  params: UpdateSocialWorkParams,
) {
  return requestClient.put(`/api/v1/social/work/${id}`, params);
}

export async function deleteSocialWorkApi(ids: number[]) {
  return requestClient.delete('/api/v1/social/work', { params: { pks: ids } });
}

// ============ Metric ============
export interface SocialWorkMetricDetail {
  id: number;
  work_id: number;
  view_count: number;
  like_count: number;
  favorite_count: number;
  comment_count: number;
  share_count: number;
  record_time: string;
  created_time: string;
  updated_time?: string;
}

export interface SocialWorkMetricListParams {
  work_id?: number;
  page?: number;
  size?: number;
}

export interface CreateSocialWorkMetricParams {
  work_id: number;
  view_count?: number;
  like_count?: number;
  favorite_count?: number;
  comment_count?: number;
  share_count?: number;
  record_time?: string;
}

export interface UpdateSocialWorkMetricParams {
  view_count?: number;
  like_count?: number;
  favorite_count?: number;
  comment_count?: number;
  share_count?: number;
  record_time?: string;
}

export async function getSocialWorkMetricListApi(
  params: SocialWorkMetricListParams,
) {
  return requestClient.get<PaginationResult<SocialWorkMetricDetail>>(
    '/api/v1/social/metric',
    { params },
  );
}

export async function getSocialWorkMetricDetailApi(id: number) {
  return requestClient.get<SocialWorkMetricDetail>(
    `/api/v1/social/metric/${id}`,
  );
}

export async function createSocialWorkMetricApi(
  params: CreateSocialWorkMetricParams,
) {
  return requestClient.post<SocialWorkMetricDetail>(
    '/api/v1/social/metric',
    params,
  );
}

export async function updateSocialWorkMetricApi(
  id: number,
  params: UpdateSocialWorkMetricParams,
) {
  return requestClient.put(`/api/v1/social/metric/${id}`, params);
}

export async function deleteSocialWorkMetricApi(ids: number[]) {
  return requestClient.delete('/api/v1/social/metric', {
    params: { pks: ids },
  });
}

// ============ Trend ============
export interface SocialWorkTrendPoint {
  record_time: string;
  view_count: number;
  like_count: number;
  favorite_count: number;
  comment_count: number;
  share_count: number;
}

export async function getSocialWorkTrendApi(workId: number) {
  return requestClient.get<SocialWorkTrendPoint[]>(
    `/api/v1/social/metric/trend/${workId}`,
  );
}
