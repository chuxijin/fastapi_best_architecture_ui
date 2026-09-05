import type { PaginationResult } from '#/types/pagination';

import { requestClient } from '#/api/request';

export type MaterialStatus = 'active' | 'archived' | 'disabled';
export type MaterialRevisionStatus = 'draft' | 'published' | 'retired';
export type MaterialContentFormat = 'html' | 'json' | 'markdown' | 'plain';
export type MaterialRole = 'attachment' | 'passage' | 'prompt' | 'reference';
export type AnchorType =
  | 'image_point'
  | 'image_region'
  | 'table_cell'
  | 'text_block'
  | 'text_range';
export type AnchorSource = 'ai' | 'import' | 'manual' | 'ocr';

export interface CreateMaterialParam {
  code: string;
  revision: CreateMaterialRevisionParam;
}

export interface UpdateMaterialParam {
  status?: MaterialStatus;
}

export interface CreateMaterialRevisionParam {
  title: string;
  content: string;
  content_format?: MaterialContentFormat;
  structured_data?: Record<string, any>;
  source_name?: string;
  source_url?: string;
}

export interface UpdateMaterialRevisionParam {
  title?: string;
  content?: string;
  content_format?: MaterialContentFormat;
  structured_data?: Record<string, any>;
  source_name?: null | string;
  source_url?: null | string;
}

export interface GetMaterialListItem {
  id: number;
  code: string;
  status: MaterialStatus;
  revision_id: number;
  revision_no: number;
  title: string;
  content_format: MaterialContentFormat;
  source_name?: string;
  revision_status: MaterialRevisionStatus;
  updated_time: string;
}

export interface GetMaterialRevisionDetail {
  id: number;
  material_id: number;
  revision_no: number;
  title: string;
  content: string;
  content_format: string;
  structured_data: Record<string, any>;
  source_name?: string;
  source_url?: string;
  content_hash?: string;
  status: MaterialRevisionStatus;
  published_by?: number;
  published_time?: string;
  created_time: string;
  updated_time: string;
}

export interface GetMaterialDetail {
  id: number;
  code: string;
  status: MaterialStatus;
  current_revision_id?: number;
  revision?: GetMaterialRevisionDetail;
  created_time: string;
  updated_time: string;
}

export interface CreateMaterialAnchorParam {
  anchor_key: string;
  anchor_type: AnchorType;
  text?: string;
  semantic_role?: string;
  block_id?: string;
  start_offset?: number;
  end_offset?: number;
  asset_id?: number;
  bbox?: Record<string, any>;
  polygon?: Record<string, any>[];
  table_cell?: Record<string, any>;
  source?: AnchorSource;
  confidence?: number;
  status?: 'active' | 'draft' | 'retired';
  extra_data?: Record<string, any>;
}

export interface UpdateMaterialAnchorParam {
  text?: null | string;
  semantic_role?: null | string;
  block_id?: null | string;
  start_offset?: null | number;
  end_offset?: null | number;
  asset_id?: null | number;
  bbox?: null | Record<string, any>;
  polygon?: null | Record<string, any>[];
  table_cell?: null | Record<string, any>;
  source?: AnchorSource;
  confidence?: null | number;
  extra_data?: Record<string, any>;
  status?: 'active' | 'draft' | 'retired';
}

export interface GetMaterialAnchorDetail {
  id: number;
  material_id: number;
  material_revision_id: number;
  anchor_key: string;
  anchor_type: string;
  text?: string;
  semantic_role?: string;
  block_id?: string;
  start_offset?: number;
  end_offset?: number;
  asset_id?: number;
  bbox?: Record<string, any>;
  polygon?: Record<string, any>[];
  table_cell?: Record<string, any>;
  source: string;
  confidence?: number;
  status: string;
  extra_data: Record<string, any>;
  created_time: string;
  updated_time: string;
}

export interface MaterialListParams {
  status?: MaterialStatus;
  revision_status?: MaterialRevisionStatus;
  keyword?: string;
  page?: number;
  size?: number;
}

export async function qbankV2GetMaterialListApi(params?: MaterialListParams) {
  return requestClient.get<PaginationResult<GetMaterialListItem>>(
    '/api/v1/qbank-v2/materials',
    { params },
  );
}

export async function getMaterialApi(pk: number, revisionId?: number) {
  return requestClient.get<GetMaterialDetail>(
    `/api/v1/qbank-v2/materials/${pk}`,
    {
      params: revisionId ? { revision_id: revisionId } : undefined,
    },
  );
}

export async function createMaterialApi(data: CreateMaterialParam) {
  return requestClient.post<GetMaterialDetail>(
    '/api/v1/qbank-v2/materials',
    data,
  );
}

export async function updateMaterialApi(pk: number, data: UpdateMaterialParam) {
  return requestClient.put<GetMaterialDetail>(
    `/api/v1/qbank-v2/materials/${pk}`,
    data,
  );
}

export async function getMaterialRevisionsApi(pk: number) {
  const result = await requestClient.get<{
    items: GetMaterialRevisionDetail[];
  }>(`/api/v1/qbank-v2/materials/${pk}/revisions`);
  return result.items || [];
}

export async function createMaterialRevisionApi(
  pk: number,
  data: CreateMaterialRevisionParam,
) {
  return requestClient.post<GetMaterialRevisionDetail>(
    `/api/v1/qbank-v2/materials/${pk}/revisions`,
    data,
  );
}

export async function updateMaterialRevisionApi(
  pk: number,
  revisionId: number,
  data: UpdateMaterialRevisionParam,
) {
  return requestClient.put<GetMaterialRevisionDetail>(
    `/api/v1/qbank-v2/materials/${pk}/revisions/${revisionId}`,
    data,
  );
}

export async function publishMaterialRevisionApi(
  pk: number,
  revisionId: number,
) {
  return requestClient.post<GetMaterialRevisionDetail>(
    `/api/v1/qbank-v2/materials/${pk}/revisions/${revisionId}/publish`,
  );
}

export async function getMaterialAnchorsApi(pk: number, revisionId: number) {
  const result = await requestClient.get<{ items: GetMaterialAnchorDetail[] }>(
    `/api/v1/qbank-v2/materials/${pk}/revisions/${revisionId}/anchors`,
  );
  return result.items || [];
}

export async function qbankV2CreateMaterialAnchorApi(
  pk: number,
  revisionId: number,
  data: CreateMaterialAnchorParam | CreateMaterialAnchorParam[],
) {
  const items = Array.isArray(data) ? data : [data];
  return requestClient.post<GetMaterialAnchorDetail[]>(
    `/api/v1/qbank-v2/materials/${pk}/revisions/${revisionId}/anchors`,
    items,
  );
}

export async function qbankV2UpdateMaterialAnchorApi(
  pk: number,
  revisionId: number,
  anchorId: number,
  data: UpdateMaterialAnchorParam,
) {
  return requestClient.put<GetMaterialAnchorDetail>(
    `/api/v1/qbank-v2/materials/${pk}/revisions/${revisionId}/anchors/${anchorId}`,
    data,
  );
}

export async function deleteMaterialAnchorApi(
  pk: number,
  revisionId: number,
  anchorId: number,
) {
  return requestClient.delete(
    `/api/v1/qbank-v2/materials/${pk}/revisions/${revisionId}/anchors/${anchorId}`,
  );
}

export interface GetMaterialBlocksResult {
  material_id: number;
  revision_id: number;
  title: string;
  content_hash: string;
  blocks: Record<string, any>[];
}

export async function getMaterialBlocksApi(pk: number, revisionId: number) {
  return requestClient.get<GetMaterialBlocksResult>(
    `/api/v1/qbank-v2/materials/${pk}/revisions/${revisionId}/blocks`,
  );
}

export async function getMaterialQuestionsApi(pk: number) {
  const result = await requestClient.get<{ items: Record<string, any>[] }>(
    `/api/v1/qbank-v2/materials/${pk}/questions`,
  );
  return result.items || [];
}
