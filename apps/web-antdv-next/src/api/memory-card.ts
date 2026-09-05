import { requestClient } from '#/api/request';

/** ============ 记忆卡管理 ============ */

export interface MemoryTextSegmentParam {
  type: 'text';
  text: string;
}

export interface MemoryPointSegmentParam {
  type: 'point';
  id: string;
  correct: string;
  wrong: string;
  options?: string[];
  hint?: null | string;
}

export type MemorySegmentParam =
  | MemoryPointSegmentParam
  | MemoryTextSegmentParam;

export interface MemoryContentParam {
  segments: MemorySegmentParam[];
  title?: null | string;
  settings?: Record<string, any>;
}

export interface MemoryDeckResult {
  id: number;
  code: string;
  name: string;
  description: null | string;
  category_id: null | number;
  scope: string;
  owner_id: null | number;
  status: string;
  daily_new_limit: number;
  daily_review_limit: number;
  sort_order: number;
  card_count: number;
  created_time: string;
  updated_time: null | string;
}

export interface CreateMemoryDeckParams {
  name: string;
  code?: string;
  description?: string;
  category_id?: number;
  status?: string;
  daily_new_limit?: number;
  daily_review_limit?: number;
  sort_order?: number;
  settings?: Record<string, any>;
}

export interface UpdateMemoryDeckParams {
  name?: string;
  description?: string;
  category_id?: number;
  status?: string;
  daily_new_limit?: number;
  daily_review_limit?: number;
  sort_order?: number;
  settings?: Record<string, any>;
}

export interface MemoryGroupNode {
  id: number;
  deck_id: number;
  parent_id: null | number;
  name: string;
  sort_order: number;
  status: string;
  card_count: number;
  children: MemoryGroupNode[];
}

export interface CreateMemoryGroupParams {
  deck_id: number;
  parent_id?: null | number;
  name: string;
  sort_order?: number;
  status?: string;
}

export interface UpdateMemoryGroupParams {
  name?: string;
  parent_id?: null | number;
  sort_order?: number;
  status?: string;
}

export interface MemoryCardResult {
  id: number;
  deck_id: number;
  group_id: null | number;
  group_name: null | string;
  deck_name: null | string;
  code: string;
  title: string;
  card_type: string;
  response_mode: string;
  status: string;
  sort_order: number;
  current_revision_id: null | number;
  revision_no: null | number;
  content: MemoryContentParam | null;
  created_time: string;
  updated_time: null | string;
}

export interface CreateMemoryCardParams {
  deck_id: number;
  group_id?: number;
  code?: string;
  title: string;
  card_type: string;
  response_mode: string;
  status?: string;
  sort_order?: number;
  content: MemoryContentParam;
}

export interface UpdateMemoryCardParams {
  title?: string;
  group_id?: null | number;
  card_type?: string;
  response_mode?: string;
  status?: string;
  sort_order?: number;
  content?: MemoryContentParam;
}

export async function getMemoryDeckListApi(params?: Record<string, any>) {
  return requestClient.get<any>('/memory-cards/admin/decks', { params });
}

export async function getMemoryDeckApi(id: number) {
  return requestClient.get<MemoryDeckResult>(`/memory-cards/admin/decks/${id}`);
}

export async function createMemoryDeckApi(data: CreateMemoryDeckParams) {
  return requestClient.post<MemoryDeckResult>(
    '/memory-cards/admin/decks',
    data,
  );
}

export async function updateMemoryDeckApi(
  id: number,
  data: UpdateMemoryDeckParams,
) {
  return requestClient.put(`/memory-cards/admin/decks/${id}`, data);
}

export async function deleteMemoryDeckApi(id: number) {
  return requestClient.delete(`/memory-cards/admin/decks/${id}`);
}

export async function getMemoryDeckGroupsApi(deckId: number) {
  return requestClient.get<MemoryGroupNode[]>(
    `/memory-cards/admin/decks/${deckId}/groups`,
  );
}

export async function createMemoryGroupApi(data: CreateMemoryGroupParams) {
  return requestClient.post<MemoryGroupNode>(
    '/memory-cards/admin/groups',
    data,
  );
}

export async function updateMemoryGroupApi(
  id: number,
  data: UpdateMemoryGroupParams,
) {
  return requestClient.put(`/memory-cards/admin/groups/${id}`, data);
}

export async function deleteMemoryGroupApi(id: number) {
  return requestClient.delete(`/memory-cards/admin/groups/${id}`);
}

export async function getMemoryCardListApi(params?: Record<string, any>) {
  return requestClient.get<any>('/memory-cards/admin/cards', { params });
}

export async function getMemoryCardApi(id: number) {
  return requestClient.get<MemoryCardResult>(`/memory-cards/admin/cards/${id}`);
}

export async function createMemoryCardApi(data: CreateMemoryCardParams) {
  return requestClient.post<MemoryCardResult>(
    '/memory-cards/admin/cards',
    data,
  );
}

export async function updateMemoryCardApi(
  id: number,
  data: UpdateMemoryCardParams,
) {
  return requestClient.put(`/memory-cards/admin/cards/${id}`, data);
}

export async function deleteMemoryCardApi(id: number) {
  return requestClient.delete(`/memory-cards/admin/cards/${id}`);
}

export async function getMemoryReviewListApi(params?: Record<string, any>) {
  return requestClient.get<any>('/memory-cards/admin/reviews', { params });
}
