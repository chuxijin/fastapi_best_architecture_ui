import type { PageData } from './quest';

import { requestClient } from './request';

// ==================== 客服码(plugin/links) ====================

export type KfStatus = 0 | 1;
export type KfItemStatus = 0 | 1 | 2;

export interface LinksKfResult {
  id: number;
  code: string;
  title: string;
  remark?: null | string;
  online?: null | string;
  clicks: number;
  status: KfStatus;
  entry_domain?: null | string;
  redirect_domain?: null | string;
  landing_domain?: null | string;
  domain_status: number;
  created_by: number;
  created_time: string;
  updated_time?: null | string;
}

export interface CreateLinksKfParams {
  title: string;
  code?: null | string;
  remark?: null | string;
  online?: null | string;
  entry_domain?: null | string;
  redirect_domain?: null | string;
  landing_domain?: null | string;
}

export interface UpdateLinksKfParams {
  title?: null | string;
  remark?: null | string;
  online?: null | string;
  status?: KfStatus | null;
  entry_domain?: null | string;
  redirect_domain?: null | string;
  landing_domain?: null | string;
  domain_status?: null | number;
}

export interface LinksKfListParams {
  title?: string;
  status?: number;
  page?: number;
  size?: number;
}

export interface LinksKfItemResult {
  id: number;
  kf_id: number;
  qrcode: string;
  limit: number;
  leader?: null | string;
  clicks: number;
  longpress: number;
  status: KfItemStatus;
  created_time: string;
}

export interface CreateLinksKfItemParams {
  kf_id: number;
  qrcode: string;
  limit?: number;
  leader?: null | string;
}

export interface UpdateLinksKfItemParams {
  qrcode?: null | string;
  limit?: null | number;
  leader?: null | string;
  status?: KfItemStatus | null;
}

export async function getLinksKfListApi(params: LinksKfListParams) {
  return requestClient.get<PageData<LinksKfResult>>('/api/v1/links/kf', {
    params,
  });
}

export async function getLinksKfDetailApi(pk: number) {
  return requestClient.get<LinksKfResult>(`/api/v1/links/kf/${pk}`);
}

export async function getLinksKfStatisticsApi(pk: number) {
  return requestClient.get(`/api/v1/links/kf/${pk}/statistics`);
}

export async function getLinksKfItemsApi(pk: number) {
  return requestClient.get<LinksKfItemResult[]>(`/api/v1/links/kf/${pk}/items`);
}

export async function createLinksKfApi(data: CreateLinksKfParams) {
  return requestClient.post<LinksKfResult>('/api/v1/links/kf', data);
}

export async function updateLinksKfApi(pk: number, data: UpdateLinksKfParams) {
  return requestClient.put(`/api/v1/links/kf/${pk}`, data);
}

export async function deleteLinksKfApi(pk: number) {
  return requestClient.delete(`/api/v1/links/kf/${pk}`);
}

export async function createLinksKfItemApi(data: CreateLinksKfItemParams) {
  return requestClient.post<LinksKfItemResult>('/api/v1/links/kf/item', data);
}

export async function updateLinksKfItemApi(
  pk: number,
  data: UpdateLinksKfItemParams,
) {
  return requestClient.put(`/api/v1/links/kf/item/${pk}`, data);
}

export async function deleteLinksKfItemApi(pk: number) {
  return requestClient.delete(`/api/v1/links/kf/item/${pk}`);
}
