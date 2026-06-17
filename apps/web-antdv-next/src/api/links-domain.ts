import type { PageData } from './quest';

import { requestClient } from './request';

// ==================== 域名管理(plugin/links) ====================

export type DomainType = 1 | 2 | 3;

export interface LinksDomainResult {
  id: number;
  domain: string;
  domain_type: DomainType;
  remark?: null | string;
  created_by: number;
  created_time: string;
  updated_time?: null | string;
}

export interface CreateLinksDomainParams {
  domain: string;
  domain_type: DomainType;
  remark?: null | string;
}

export interface UpdateLinksDomainParams {
  domain?: null | string;
  domain_type?: DomainType | null;
  remark?: null | string;
}

export interface LinksDomainListParams {
  domain?: string;
  domain_type?: DomainType;
  page?: number;
  size?: number;
}

export async function getLinksDomainListApi(params: LinksDomainListParams) {
  return requestClient.get<PageData<LinksDomainResult>>(
    '/api/v1/links/domain',
    { params },
  );
}

export async function getLinksDomainsByTypeApi(domainType: DomainType) {
  return requestClient.get<LinksDomainResult[]>(
    `/api/v1/links/domain/type/${domainType}`,
  );
}

export async function getLinksDomainDetailApi(pk: number) {
  return requestClient.get<LinksDomainResult>(`/api/v1/links/domain/${pk}`);
}

export async function createLinksDomainApi(data: CreateLinksDomainParams) {
  return requestClient.post<LinksDomainResult>('/api/v1/links/domain', data);
}

export async function updateLinksDomainApi(
  pk: number,
  data: UpdateLinksDomainParams,
) {
  return requestClient.put(`/api/v1/links/domain/${pk}`, data);
}

export async function deleteLinksDomainApi(pk: number) {
  return requestClient.delete(`/api/v1/links/domain/${pk}`);
}
