import type { PaginationResult } from '#/types/pagination';

import { requestClient } from '#/api/request';

export type BankKind = 'mock' | 'paper' | 'practice';
export type BankStatus = 'active' | 'archived' | 'disabled';
export type BankVisibility = 'internal' | 'private' | 'public';
export type RevisionStatus = 'draft' | 'published' | 'retired';

export interface BankRevisionSchemaBase {
  name: string;
  bank_kind: BankKind;
  description?: string;
  cover_asset_id?: number;
  cover_url?: string;
  duration_minutes?: number;
  pass_score?: number;
  settings?: Record<string, any>;
}

export interface CreateBankRevisionParam extends BankRevisionSchemaBase {
  sections?: {
    code: string;
    name: string;
    parent_id?: number;
    sort_order?: number;
  }[];
}

export interface UpdateBankRevisionParam {
  name?: string;
  bank_kind?: BankKind;
  description?: null | string;
  cover_asset_id?: null | number;
  cover_url?: null | string;
  duration_minutes?: null | number;
  pass_score?: null | number;
  settings?: Record<string, any>;
}

export interface CreateBankParam {
  code: string;
  visibility?: BankVisibility;
  revision: CreateBankRevisionParam;
  category_ids?: number[];
  primary_category_id?: number;
}

export interface AdminBankListParams {
  keyword?: string;
  bank_kind?: BankKind;
  page?: number;
  size?: number;
}

export interface UpdateBankParam {
  visibility?: BankVisibility;
  status?: BankStatus;
}

export interface SetBankCategoriesParam {
  category_ids: number[];
  primary_category_id?: number;
}

export interface GetBankCategoryDetail {
  id: number;
  category_id: number;
  category_name: string;
  is_primary: boolean;
  sort_order: number;
}

export interface GetBankRevisionDetail extends BankRevisionSchemaBase {
  id: number;
  bank_id: number;
  revision_no: number;
  question_count: number;
  total_score: number;
  content_hash?: string;
  status: RevisionStatus;
  published_by?: number;
  published_time?: string;
  created_time: string;
  updated_time: string;
}

export interface GetBankDetail {
  id: number;
  code: string;
  owner_id?: number;
  visibility: BankVisibility;
  status: BankStatus;
  current_revision_id?: number;
  current_revision?: GetBankRevisionDetail;
  categories: GetBankCategoryDetail[];
  created_time: string;
  updated_time: string;
}

export interface GetBankListItem {
  id: number;
  code: string;
  name: string;
  bank_kind: BankKind;
  visibility: BankVisibility;
  status: BankStatus;
  current_revision_id?: number;
  question_count: number;
  total_score: number;
  cover_url?: string;
  created_time: string;
  updated_time: string;
  revision_status?: RevisionStatus;
}

export interface BankListParams {
  category_id?: number;
  include_descendants?: boolean;
  bank_kind?: BankKind;
  keyword?: string;
  page?: number;
  size?: number;
}

export async function qbankV2GetBankListApi(params?: BankListParams) {
  return requestClient.get<PaginationResult<GetBankListItem>>(
    '/api/v1/qbank-v2/banks',
    { params },
  );
}

export async function qbankV2GetAdminBankListApi(params?: AdminBankListParams) {
  return requestClient.get<PaginationResult<GetBankListItem>>(
    '/api/v1/qbank-v2/banks/admin',
    { params },
  );
}

export async function getBankApi(pk: number) {
  return requestClient.get<GetBankDetail>(`/api/v1/qbank-v2/banks/${pk}`);
}

export async function qbankV2CreateBankApi(data: CreateBankParam) {
  return requestClient.post<GetBankDetail>('/api/v1/qbank-v2/banks', data);
}

export async function qbankV2UpdateBankApi(pk: number, data: UpdateBankParam) {
  return requestClient.put<GetBankDetail>(`/api/v1/qbank-v2/banks/${pk}`, data);
}

export async function setBankCategoriesApi(
  pk: number,
  data: SetBankCategoriesParam,
) {
  return requestClient.put(`/api/v1/qbank-v2/banks/${pk}/categories`, data);
}

export async function getBankRevisionsApi(pk: number) {
  return requestClient.get<GetBankRevisionDetail[]>(
    `/api/v1/qbank-v2/banks/${pk}/revisions`,
  );
}

export async function createBankRevisionApi(
  pk: number,
  data: CreateBankRevisionParam,
) {
  return requestClient.post<GetBankRevisionDetail>(
    `/api/v1/qbank-v2/banks/${pk}/revisions`,
    data,
  );
}

export async function updateBankRevisionApi(
  pk: number,
  revisionId: number,
  data: UpdateBankRevisionParam,
) {
  return requestClient.put<GetBankRevisionDetail>(
    `/api/v1/qbank-v2/banks/${pk}/revisions/${revisionId}`,
    data,
  );
}

export async function publishBankRevisionApi(pk: number, revisionId: number) {
  return requestClient.post<GetBankRevisionDetail>(
    `/api/v1/qbank-v2/banks/${pk}/revisions/${revisionId}/publish`,
  );
}

export async function getImportTemplateApi() {
  return requestClient.download<Blob>('/api/v1/qbank-v2/banks/import/template');
}

export async function importBankApi(formData: FormData) {
  return requestClient.post<GetBankDetail>(
    '/api/v1/qbank-v2/banks/import',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
}
