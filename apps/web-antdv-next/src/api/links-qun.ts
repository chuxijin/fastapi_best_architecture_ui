import type { PageData } from './quest';

import { requestClient } from './request';

// ==================== 群活码(plugin/links) ====================

export type QunStatus = 0 | 1;
export type QunItemStatus = 0 | 1 | 2;

export interface LinksQunResult {
  id: number;
  code: string;
  title: string;
  remark?: null | string;
  clicks: number;
  status: QunStatus;
  entry_domain?: null | string;
  redirect_domain?: null | string;
  landing_domain?: null | string;
  domain_status: number;
  kf?: null | number;
  kf_status: number;
  created_by: number;
  created_time: string;
  updated_time?: null | string;
}

export interface CreateLinksQunParams {
  title: string;
  code?: null | string;
  remark?: null | string;
  entry_domain?: null | string;
  redirect_domain?: null | string;
  landing_domain?: null | string;
  kf?: null | number;
  kf_status?: number;
}

export interface UpdateLinksQunParams {
  title?: null | string;
  remark?: null | string;
  status?: null | QunStatus;
  entry_domain?: null | string;
  redirect_domain?: null | string;
  landing_domain?: null | string;
  domain_status?: null | number;
  kf?: null | number;
  kf_status?: null | number;
}

export interface LinksQunListParams {
  title?: string;
  status?: number;
  page?: number;
  size?: number;
}

export interface LinksQunItemResult {
  id: number;
  qun_id: number;
  qrcode: string;
  limit: number;
  leader?: null | string;
  clicks: number;
  longpress: number;
  status: QunItemStatus;
  created_time: string;
}

export interface CreateLinksQunItemParams {
  qun_id: number;
  qrcode: string;
  limit?: number;
  leader?: null | string;
}

export interface UpdateLinksQunItemParams {
  qrcode?: null | string;
  limit?: null | number;
  leader?: null | string;
  status?: null | QunItemStatus;
}

export async function getLinksQunListApi(params: LinksQunListParams) {
  return requestClient.get<PageData<LinksQunResult>>('/api/v1/links/qun', {
    params,
  });
}

export async function getLinksQunDetailApi(pk: number) {
  return requestClient.get<LinksQunResult>(`/api/v1/links/qun/${pk}`);
}

export async function getLinksQunStatisticsApi(pk: number) {
  return requestClient.get(`/api/v1/links/qun/${pk}/statistics`);
}

export async function getLinksQunItemsApi(pk: number) {
  return requestClient.get<LinksQunItemResult[]>(
    `/api/v1/links/qun/${pk}/items`,
  );
}

export async function createLinksQunApi(data: CreateLinksQunParams) {
  return requestClient.post<LinksQunResult>('/api/v1/links/qun', data);
}

export async function updateLinksQunApi(
  pk: number,
  data: UpdateLinksQunParams,
) {
  return requestClient.put(`/api/v1/links/qun/${pk}`, data);
}

export async function deleteLinksQunApi(pk: number) {
  return requestClient.delete(`/api/v1/links/qun/${pk}`);
}

export async function createLinksQunItemApi(data: CreateLinksQunItemParams) {
  return requestClient.post<LinksQunItemResult>('/api/v1/links/qun/item', data);
}

export async function updateLinksQunItemApi(
  pk: number,
  data: UpdateLinksQunItemParams,
) {
  return requestClient.put(`/api/v1/links/qun/item/${pk}`, data);
}

export async function deleteLinksQunItemApi(pk: number) {
  return requestClient.delete(`/api/v1/links/qun/item/${pk}`);
}
