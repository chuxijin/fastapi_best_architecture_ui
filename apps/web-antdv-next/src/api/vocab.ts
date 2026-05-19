import { requestClient } from '#/api/request';

/** ============ 词书管理 ============ */

export interface VocabBookResult {
  id: number;
  name: string;
  description: string | null;
  cover_image: string | null;
  category: string;
  word_count: number;
  is_official: boolean;
  status: number;
  created_by: number;
  created_time: string;
  updated_time: string | null;
}

export interface CreateVocabBookParams {
  name: string;
  description?: string;
  cover_image?: string;
  category?: string;
  is_official?: boolean;
  sort_order?: number;
  status?: number;
}

export interface UpdateVocabBookParams {
  name?: string;
  description?: string;
  cover_image?: string;
  category?: string;
  is_official?: boolean;
  sort_order?: number;
  status?: number;
}

export async function getVocabBookListApi(params?: Record<string, any>) {
  return requestClient.get<any>('/vocab/admin/books', { params });
}

export async function getVocabBookApi(id: number) {
  return requestClient.get<VocabBookResult>(`/vocab/admin/books/${id}`);
}

export async function createVocabBookApi(data: CreateVocabBookParams) {
  return requestClient.post<VocabBookResult>('/vocab/admin/books', data);
}

export async function updateVocabBookApi(id: number, data: UpdateVocabBookParams) {
  return requestClient.put(`/vocab/admin/books/${id}`, data);
}

export async function deleteVocabBookApi(id: number) {
  return requestClient.delete(`/vocab/admin/books/${id}`);
}

/** ============ 单词管理 ============ */

export interface VocabWordResult {
  id: number;
  word: string;
  phonetic_us: string | null;
  phonetic_uk: string | null;
  audio_us_url: string | null;
  audio_uk_url: string | null;
  common_meaning: string | null;
  frequency: number;
  definitions: any[];
  examples: any[];
  created_time: string;
}

export interface CreateVocabWordParams {
  word: string;
  phonetic_us?: string;
  phonetic_uk?: string;
  audio_us_url?: string;
  audio_uk_url?: string;
  common_meaning?: string;
  frequency?: number;
  definitions?: any[];
  examples?: any[];
}

export interface UpdateVocabWordParams {
  phonetic_us?: string;
  phonetic_uk?: string;
  audio_us_url?: string;
  audio_uk_url?: string;
  common_meaning?: string;
  frequency?: number;
  definitions?: any[];
  examples?: any[];
}

export async function getVocabWordListApi(params?: Record<string, any>) {
  return requestClient.get<any>('/vocab/admin/words', { params });
}

export async function getVocabWordApi(id: number) {
  return requestClient.get<VocabWordResult>(`/vocab/admin/words/${id}`);
}

export async function createVocabWordApi(data: CreateVocabWordParams) {
  return requestClient.post<VocabWordResult>('/vocab/admin/words', data);
}

export async function updateVocabWordApi(id: number, data: UpdateVocabWordParams) {
  return requestClient.put(`/vocab/admin/words/${id}`, data);
}

export async function deleteVocabWordApi(id: number) {
  return requestClient.delete(`/vocab/admin/words/${id}`);
}
