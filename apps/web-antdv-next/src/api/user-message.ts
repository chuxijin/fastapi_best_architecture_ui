import type { PageData } from './quest';

import { requestClient } from './request';

// ==================== 用户消息管理 ====================

export type MessageTargetType = 'all' | 'user';
export type MessageStatus = 0 | 1;

export interface UserMessageResult {
  id: number;
  title: string;
  content: string;
  target_type: MessageTargetType;
  user_id?: null | number;
  message_type: string;
  link_url?: null | string;
  payload?: null | Record<string, any>;
  status: MessageStatus;
  publish_time?: null | string;
  expire_time?: null | string;
  read_time?: null | string;
  created_time: string;
  updated_time?: null | string;
}

export interface CreateUserMessageParams {
  title: string;
  content: string;
  target_type?: MessageTargetType;
  user_id?: null | number;
  message_type?: string;
  link_url?: null | string;
  payload?: null | Record<string, any>;
  status?: MessageStatus;
  publish_time?: null | string;
  expire_time?: null | string;
}

export type UpdateUserMessageParams = CreateUserMessageParams;

export interface UserMessageListParams {
  page?: number;
  size?: number;
}

export async function getUserMessageListApi(params: UserMessageListParams) {
  return requestClient.get<PageData<UserMessageResult>>(
    '/api/v1/qbank/messages/admin',
    { params },
  );
}

export async function createUserMessageApi(data: CreateUserMessageParams) {
  return requestClient.post('/api/v1/qbank/messages/admin', data);
}

export async function updateUserMessageApi(
  pk: number,
  data: UpdateUserMessageParams,
) {
  return requestClient.put(`/api/v1/qbank/messages/admin/${pk}`, data);
}

export async function deleteUserMessageApi(pk: number) {
  return requestClient.delete(`/api/v1/qbank/messages/admin/${pk}`);
}
