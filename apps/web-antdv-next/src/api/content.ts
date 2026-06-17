import type { PageData } from './quest';

import { requestClient } from './request';

export interface SysContentListItem {
  id: number;
  app_code: string;
  title: string;
  slug?: null | string;
  summary?: null | string;
  cover_image?: null | string;
  category_id?: null | number;
  tags?: null | string[];
  is_pinned: boolean;
  is_public: boolean;
  is_published: boolean;
  sort_order: number;
  view_count: number;
  publish_time?: null | string;
  created_time: string;
  extra?: null | Record<string, any>;
}

export interface SysContentListParams {
  app_code?: string;
  category_id?: number;
  is_published?: boolean;
  keyword?: string;
  page?: number;
  size?: number;
}

export async function getSysContentListApi(params: SysContentListParams) {
  return requestClient.get<PageData<SysContentListItem>>(
    '/api/v1/content/list',
    { params },
  );
}

export async function getSysContentDetailApi(pk: number) {
  return requestClient.get<SysContentListItem>(`/api/v1/content/${pk}`);
}
