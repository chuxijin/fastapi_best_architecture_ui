import { requestClient } from '#/api/request';

/** ============ 敏感词管理 ============ */

export interface SensitiveWordResult {
  id: number;
  word: string;
  variants: string[];
  replacement: null | string;
  action: string;
  status: string;
  remark: null | string;
  sort_order: number;
  created_time: string;
  updated_time: null | string;
}

export interface CreateSensitiveWordParams {
  word: string;
  variants?: string[];
  replacement?: null | string;
  action?: string;
  status?: string;
  remark?: null | string;
  sort_order?: number;
}

export interface UpdateSensitiveWordParams {
  word?: string;
  variants?: string[];
  replacement?: null | string;
  action?: string;
  status?: string;
  remark?: null | string;
  sort_order?: number;
}

export interface SensitiveHitLogResult {
  id: number;
  user_id: number;
  word: string;
  keyword: string;
  word_id: null | number;
  action: string;
  replacement: null | string;
  hit_count: number;
  target_type: null | string;
  target_id: null | number;
  snippet: null | string;
  created_time: string;
}

export async function getSensitiveWordActionOptionsApi() {
  return requestClient.get<Array<{ label: string, value: string }>>(
    '/sensitive-words/admin/options',
  );
}

export async function getSensitiveWordListApi(params?: Record<string, any>) {
  return requestClient.get<any>('/sensitive-words/admin/words', { params });
}

export async function createSensitiveWordApi(data: CreateSensitiveWordParams) {
  return requestClient.post<SensitiveWordResult>('/sensitive-words/admin/words', data);
}

export async function updateSensitiveWordApi(
  id: number,
  data: UpdateSensitiveWordParams,
) {
  return requestClient.put(`/sensitive-words/admin/words/${id}`, data);
}

export async function deleteSensitiveWordApi(id: number) {
  return requestClient.delete(`/sensitive-words/admin/words/${id}`);
}

export async function getSensitiveHitLogListApi(params?: Record<string, any>) {
  return requestClient.get<any>('/sensitive-words/admin/hits', { params });
}
