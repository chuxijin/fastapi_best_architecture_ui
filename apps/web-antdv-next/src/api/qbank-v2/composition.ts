import { requestClient } from '#/api/request';

export interface CursorResult<T> {
  items: T[];
  next_cursor?: null | string;
  has_more: boolean;
}

export interface CreateBankSectionParam {
  code: string;
  name: string;
  parent_id?: number;
  sort_order?: number;
}

export interface UpdateBankSectionParam {
  name?: string;
  parent_id?: null | number;
  sort_order?: number;
}

export interface GetBankSectionDetail {
  id: number;
  bank_revision_id: number;
  code: string;
  name: string;
  parent_id?: number;
  depth: number;
  sort_order: number;
  children?: GetBankSectionDetail[];
}

export interface CreateBankItemParam {
  item_key: string;
  question_id: number;
  section_id?: number;
  exam_year?: number;
  score?: number;
  sort_order?: number;
  is_required?: boolean;
  is_active?: boolean;
  settings?: Record<string, any>;
}

export interface UpdateBankItemParam {
  section_id?: null | number;
  exam_year?: null | number;
  score?: number;
  sort_order?: number;
  is_required?: boolean;
  is_active?: boolean;
  settings?: Record<string, any>;
}

export interface GetBankItemDetail {
  id: number;
  bank_revision_id: number;
  item_key: string;
  question_id: number;
  question_type: string;
  section_id?: number;
  exam_year?: number;
  score: number;
  sort_order: number;
  is_required: boolean;
  is_active: boolean;
  settings: Record<string, any>;
  stem_preview?: string;
  created_time: string;
  updated_time: string;
}

export interface GetBankCompositionDetail {
  bank_id: number;
  bank_revision_id: number;
  sections: GetBankSectionDetail[];
  items: GetBankItemDetail[];
  total_items: number;
  total_score: number;
}

export async function getBankCompositionApi(
  bankId: number,
  revisionId: number,
) {
  return requestClient.get<GetBankCompositionDetail>(
    `/api/v1/qbank-v2/banks/${bankId}/revisions/${revisionId}/composition`,
  );
}

export async function getBankCompositionItemsApi(
  bankId: number,
  revisionId: number,
  sectionId?: number,
) {
  const result = await requestClient.get<CursorResult<GetBankItemDetail>>(
    `/api/v1/qbank-v2/banks/${bankId}/revisions/${revisionId}/items`,
    { params: sectionId ? { section_id: sectionId } : undefined },
  );
  return result.items || [];
}

export async function createBankSectionApi(
  bankId: number,
  revisionId: number,
  data: CreateBankSectionParam,
) {
  return requestClient.post<GetBankSectionDetail>(
    `/api/v1/qbank-v2/banks/${bankId}/revisions/${revisionId}/sections`,
    data,
  );
}

export async function updateBankSectionApi(
  bankId: number,
  revisionId: number,
  sectionId: number,
  data: UpdateBankSectionParam,
) {
  return requestClient.put<GetBankSectionDetail>(
    `/api/v1/qbank-v2/banks/${bankId}/revisions/${revisionId}/sections/${sectionId}`,
    data,
  );
}

export async function createBankItemApi(
  bankId: number,
  revisionId: number,
  data: CreateBankItemParam,
) {
  return requestClient.post<GetBankItemDetail>(
    `/api/v1/qbank-v2/banks/${bankId}/revisions/${revisionId}/items`,
    data,
  );
}

export async function updateBankItemApi(
  bankId: number,
  revisionId: number,
  itemId: number,
  data: UpdateBankItemParam,
) {
  return requestClient.put<GetBankItemDetail>(
    `/api/v1/qbank-v2/banks/${bankId}/revisions/${revisionId}/items/${itemId}`,
    data,
  );
}

export async function deleteBankItemApi(
  bankId: number,
  revisionId: number,
  itemId: number,
) {
  return requestClient.delete(
    `/api/v1/qbank-v2/banks/${bankId}/revisions/${revisionId}/items/${itemId}`,
  );
}
