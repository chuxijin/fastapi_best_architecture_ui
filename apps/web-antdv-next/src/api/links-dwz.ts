import type { PageData } from './quest';

import { requestClient } from './request';

// ==================== 短网址(plugin/links) ====================

export type DwzStatus = 0 | 1;

export interface LinksDwzResult {
  id: number;
  code: string;
  original_url: string;
  title?: null | string;
  remark?: null | string;
  clicks: number;
  status: DwzStatus;
  entry_domain?: null | string;
  redirect_domain?: null | string;
  landing_domain?: null | string;
  domain_status: number;
  created_by: number;
  created_time: string;
  updated_time?: null | string;
}

export interface CreateLinksDwzParams {
  original_url: string;
  title?: null | string;
  remark?: null | string;
  code?: null | string;
  entry_domain?: null | string;
  redirect_domain?: null | string;
  landing_domain?: null | string;
}

export interface UpdateLinksDwzParams {
  original_url?: null | string;
  title?: null | string;
  remark?: null | string;
  status?: DwzStatus | null;
  entry_domain?: null | string;
  redirect_domain?: null | string;
  landing_domain?: null | string;
  domain_status?: null | number;
}

export interface LinksDwzListParams {
  title?: string;
  status?: number;
  page?: number;
  size?: number;
}

export interface LinksStatistics {
  total_clicks: number;
  today_clicks: number;
  device_stats: Record<string, number>;
  reference_stats: Record<string, number>;
}

export async function getLinksDwzListApi(params: LinksDwzListParams) {
  return requestClient.get<PageData<LinksDwzResult>>('/api/v1/links/dwz', {
    params,
  });
}

export async function getLinksDwzDetailApi(pk: number) {
  return requestClient.get<LinksDwzResult>(`/api/v1/links/dwz/${pk}`);
}

export async function getLinksDwzStatisticsApi(pk: number) {
  return requestClient.get<LinksStatistics>(
    `/api/v1/links/dwz/${pk}/statistics`,
  );
}

export async function createLinksDwzApi(data: CreateLinksDwzParams) {
  return requestClient.post<LinksDwzResult>('/api/v1/links/dwz', data);
}

export async function updateLinksDwzApi(
  pk: number,
  data: UpdateLinksDwzParams,
) {
  return requestClient.put(`/api/v1/links/dwz/${pk}`, data);
}

export async function deleteLinksDwzApi(pk: number) {
  return requestClient.delete(`/api/v1/links/dwz/${pk}`);
}
