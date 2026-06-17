import type { PageData } from './quest';

import { requestClient } from './request';

// ==================== 静态页面托管(plugin/links) ====================

export type PageStatus = 0 | 1;

export interface PageResult {
  id: number;
  code: string;
  title: string;
  html_content?: null | string;
  remark?: null | string;
  clicks: number;
  status: PageStatus;
  entry_domain?: null | string;
  redirect_domain?: null | string;
  landing_domain?: null | string;
  domain_status: number;
  created_by: number;
  created_time: string;
  updated_time?: null | string;
}

export interface CreatePageParams {
  title: string;
  code?: null | string;
  html_content?: null | string;
  remark?: null | string;
  entry_domain?: null | string;
  redirect_domain?: null | string;
  landing_domain?: null | string;
}

export interface UpdatePageParams {
  title?: null | string;
  html_content?: null | string;
  remark?: null | string;
  status?: null | PageStatus;
  entry_domain?: null | string;
  redirect_domain?: null | string;
  landing_domain?: null | string;
  domain_status?: null | number;
}

export interface PageListParams {
  title?: string;
  status?: number;
  page?: number;
  size?: number;
}

export interface PageStatistics {
  total_clicks: number;
  today_clicks: number;
  device_stats: Record<string, number>;
  reference_stats: Record<string, number>;
}

export async function getPageListApi(params: PageListParams) {
  return requestClient.get<PageData<PageResult>>('/api/v1/links/page', {
    params,
  });
}

export async function getPageDetailApi(pk: number) {
  return requestClient.get<PageResult>(`/api/v1/links/page/${pk}`);
}

export async function getPageStatisticsApi(pk: number) {
  return requestClient.get<PageStatistics>(
    `/api/v1/links/page/${pk}/statistics`,
  );
}

export async function createPageApi(data: CreatePageParams) {
  return requestClient.post<PageResult>('/api/v1/links/page', data);
}

export async function updatePageApi(pk: number, data: UpdatePageParams) {
  return requestClient.put(`/api/v1/links/page/${pk}`, data);
}

export async function deletePageApi(pk: number) {
  return requestClient.delete(`/api/v1/links/page/${pk}`);
}
