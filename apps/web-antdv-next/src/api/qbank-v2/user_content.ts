import { requestClient } from '#/api/request';

export interface CreateFavoriteFolderParam {
  name: string;
  description?: string;
  sort_order?: number;
}

export interface UpdateFavoriteFolderParam {
  name?: string;
  description?: null | string;
  sort_order?: number;
  status?: 'active' | 'archived';
}

export interface GetFavoriteFolderDetail {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  sort_order: number;
  status: string;
  created_time: string;
  updated_time: string;
}

export interface CreateQuestionFavoriteParam {
  question_id: number;
  folder_id?: number;
  bank_item_id?: number;
  tags?: string[];
  remark?: string;
}

export interface UpdateQuestionFavoriteParam {
  folder_id?: null | number;
  tags?: string[];
  remark?: null | string;
  is_pinned?: boolean;
}

export interface GetQuestionFavoriteDetail {
  id: number;
  user_id: number;
  question_id: number;
  folder_id?: number;
  folder_name?: string;
  bank_item_id?: number;
  bank_name?: string;
  tags: string[];
  remark?: string;
  is_pinned: boolean;
  pinned_time?: string;
  stem_preview?: string;
  question_type?: string;
  created_time: string;
  updated_time: string;
}

export interface FavoriteStatistics {
  total: number;
  folder_groups: { count: number; folder_id: number; folder_name: string }[];
  knowledge_point_groups: {
    count: number;
    knowledge_point_id: number;
    knowledge_point_name: string;
  }[];
}

export interface CreateQuestionNoteParam {
  question_id: number;
  content: string;
  content_format?: 'html' | 'markdown' | 'plain';
  visibility?: 'private' | 'public';
  bank_item_id?: number;
}

export interface UpdateQuestionNoteParam {
  content?: string;
  content_format?: 'html' | 'markdown' | 'plain';
  visibility?: 'private' | 'public';
  status?: 'draft' | 'hidden' | 'published' | 'rejected';
}

export interface GetQuestionNoteDetail {
  id: number;
  user_id: number;
  nickname?: string;
  question_id: number;
  content: string;
  content_format: string;
  visibility: string;
  status: string;
  like_count: number;
  dislike_count: number;
  view_count: number;
  is_featured: boolean;
  bank_name?: string;
  stem_preview?: string;
  created_time: string;
  updated_time: string;
}

export interface QuestionNoteVoteParam {
  vote_value: -1 | 1;
}

export interface NoteStatistics {
  total: number;
  published_count: number;
  draft_count: number;
  featured_count: number;
  like_count: number;
  view_count: number;
}

export async function getFavoriteFoldersApi() {
  return requestClient.get<GetFavoriteFolderDetail[]>(
    '/api/v1/qbank-v2/favorites/folders',
  );
}

export async function createFavoriteFolderApi(data: CreateFavoriteFolderParam) {
  return requestClient.post<GetFavoriteFolderDetail>(
    '/api/v1/qbank-v2/favorites/folders',
    data,
  );
}

export async function updateFavoriteFolderApi(
  folderId: number,
  data: UpdateFavoriteFolderParam,
) {
  return requestClient.put<GetFavoriteFolderDetail>(
    `/api/v1/qbank-v2/favorites/folders/${folderId}`,
    data,
  );
}

export async function deleteFavoriteFolderApi(folderId: number) {
  return requestClient.delete(`/api/v1/qbank-v2/favorites/folders/${folderId}`);
}

export async function getFavoriteStatisticsApi(
  groupBy: 'bank' | 'knowledge_point' = 'bank',
) {
  return requestClient.get<FavoriteStatistics>(
    '/api/v1/qbank-v2/favorites/statistics',
    {
      params: { group_by: groupBy },
    },
  );
}

export async function getFavoriteListApi(params: {
  folder_id?: number;
  limit?: number;
  offset?: number;
}) {
  return requestClient.get<GetQuestionFavoriteDetail[]>(
    '/api/v1/qbank-v2/favorites',
    { params },
  );
}

export async function createFavoriteApi(data: CreateQuestionFavoriteParam) {
  return requestClient.post<GetQuestionFavoriteDetail>(
    '/api/v1/qbank-v2/favorites',
    data,
  );
}

export async function updateFavoriteApi(
  favoriteId: number,
  data: UpdateQuestionFavoriteParam,
) {
  return requestClient.put<GetQuestionFavoriteDetail>(
    `/api/v1/qbank-v2/favorites/${favoriteId}`,
    data,
  );
}

export async function deleteFavoriteByQuestionApi(questionId: number) {
  return requestClient.delete(
    `/api/v1/qbank-v2/favorites/by-question/${questionId}`,
  );
}

export async function getSessionFavoritesApi(sessionKey: string) {
  return requestClient.get<Record<number, boolean>>(
    `/api/v1/qbank-v2/sessions/${sessionKey}/favorites`,
  );
}

export async function getNoteStatisticsApi(
  groupBy: 'bank' | 'knowledge_point' = 'bank',
) {
  return requestClient.get<NoteStatistics>(
    '/api/v1/qbank-v2/notes/statistics',
    {
      params: { group_by: groupBy },
    },
  );
}

export async function getPublicQuestionNotesApi(
  questionId: number,
  params: { limit?: number; offset?: number },
) {
  return requestClient.get<GetQuestionNoteDetail[]>(
    `/api/v1/qbank-v2/notes/questions/${questionId}/public`,
    { params },
  );
}

export async function getNoteListApi(params: {
  limit?: number;
  offset?: number;
}) {
  return requestClient.get<GetQuestionNoteDetail[]>('/api/v1/qbank-v2/notes', {
    params,
  });
}

export async function createNoteApi(data: CreateQuestionNoteParam) {
  return requestClient.post<GetQuestionNoteDetail>(
    '/api/v1/qbank-v2/notes',
    data,
  );
}

export async function updateNoteApi(
  noteId: number,
  data: UpdateQuestionNoteParam,
) {
  return requestClient.put<GetQuestionNoteDetail>(
    `/api/v1/qbank-v2/notes/${noteId}`,
    data,
  );
}

export async function deleteNoteApi(noteId: number) {
  return requestClient.delete(`/api/v1/qbank-v2/notes/${noteId}`);
}

export async function voteNoteApi(noteId: number, data: QuestionNoteVoteParam) {
  return requestClient.put(`/api/v1/qbank-v2/notes/${noteId}/vote`, data);
}

export async function getSessionNotesApi(sessionKey: string) {
  return requestClient.get<Record<number, GetQuestionNoteDetail>>(
    `/api/v1/qbank-v2/sessions/${sessionKey}/notes`,
  );
}
