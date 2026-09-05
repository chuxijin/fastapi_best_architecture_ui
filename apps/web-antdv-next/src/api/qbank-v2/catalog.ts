import type { PaginationResult } from '#/types/pagination';

import { requestClient } from '#/api/request';

export type CollectionStatus = 'active' | 'archived' | 'draft';
export type CollectionVisibility = 'internal' | 'private' | 'public';

export interface CreateCollectionParam {
  code: string;
  name: string;
  parent_id?: number;
  description?: string;
  visibility?: CollectionVisibility;
  sort_order?: number;
}

export interface UpdateCollectionParam {
  name?: string;
  description?: null | string;
  visibility?: CollectionVisibility;
  status?: CollectionStatus;
  sort_order?: number;
}

export interface GetCollectionDetail {
  id: number;
  code: string;
  name: string;
  parent_id?: number;
  owner_id?: number;
  description?: string;
  visibility: CollectionVisibility;
  status: CollectionStatus;
  sort_order: number;
  created_time: string;
  updated_time: string;
}

export interface CreateCollectionBankMountParam {
  bank_id: number;
  bank_revision_id?: number;
  follow_latest?: boolean;
  display_name?: string;
  sort_order?: number;
}

export interface UpdateCollectionBankMountParam {
  bank_revision_id?: null | number;
  follow_latest?: boolean;
  display_name?: null | string;
  sort_order?: number;
  is_active?: boolean;
}

export interface GetCollectionBankMountDetail {
  id: number;
  collection_id: number;
  bank_id: number;
  bank_name: string;
  bank_revision_id?: number;
  revision_no?: number;
  follow_latest: boolean;
  display_name?: string;
  sort_order: number;
  is_active: boolean;
  created_time: string;
}

export interface GetCollectionCatalogItem {
  id: number;
  code: string;
  name: string;
  description?: string;
  visibility: CollectionVisibility;
  sort_order: number;
  children?: GetCollectionCatalogItem[];
  banks?: {
    bank_id: number;
    bank_kind: string;
    bank_name: string;
    display_name?: string;
    follow_latest: boolean;
    id: number;
    revision_no?: number;
  }[];
}

export async function getCollectionCatalogApi() {
  return requestClient.get<GetCollectionCatalogItem[]>(
    '/api/v1/qbank-v2/collections/catalog',
  );
}

export async function getCollectionListApi(params?: {
  keyword?: string;
  page?: number;
  size?: number;
}) {
  return requestClient.get<PaginationResult<GetCollectionDetail>>(
    '/api/v1/qbank-v2/collections',
    { params },
  );
}

export async function getCollectionApi(pk: number) {
  return requestClient.get<GetCollectionDetail>(
    `/api/v1/qbank-v2/collections/${pk}`,
  );
}

export async function createCollectionApi(data: CreateCollectionParam) {
  return requestClient.post<GetCollectionDetail>(
    '/api/v1/qbank-v2/collections',
    data,
  );
}

export async function updateCollectionApi(
  pk: number,
  data: UpdateCollectionParam,
) {
  return requestClient.put<GetCollectionDetail>(
    `/api/v1/qbank-v2/collections/${pk}`,
    data,
  );
}

export async function getCollectionBanksApi(pk: number) {
  return requestClient.get<GetCollectionBankMountDetail[]>(
    `/api/v1/qbank-v2/collections/${pk}/banks`,
  );
}

export async function createCollectionBankApi(
  pk: number,
  data: CreateCollectionBankMountParam,
) {
  return requestClient.post<GetCollectionBankMountDetail>(
    `/api/v1/qbank-v2/collections/${pk}/banks`,
    data,
  );
}

export async function updateCollectionBankApi(
  pk: number,
  mountId: number,
  data: UpdateCollectionBankMountParam,
) {
  return requestClient.put<GetCollectionBankMountDetail>(
    `/api/v1/qbank-v2/collections/${pk}/banks/${mountId}`,
    data,
  );
}

export async function deleteCollectionBankApi(pk: number, mountId: number) {
  return requestClient.delete(
    `/api/v1/qbank-v2/collections/${pk}/banks/${mountId}`,
  );
}
