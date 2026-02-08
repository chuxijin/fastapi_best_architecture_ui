import { requestClient } from './request';

// ==================== 系统分类 ====================

export interface SysCategoryResult {
  id: number;
  app_code: string;
  name: string;
  type: string;
  code?: string;
  description?: string;
  parent_id?: number;
  level: number;
  path?: string;
  icon?: string;
  color?: string;
  sort_order: number;
  status: boolean;
  is_system: boolean;
  remark?: string;
  extra_data?: Record<string, any>;
  created_by?: number;
  updated_by?: number;
  created_time: string;
  updated_time?: string;
}

export interface SysCategoryTreeResult extends SysCategoryResult {
  children?: SysCategoryTreeResult[];
}

export interface SysCategoryPaginationResponse {
  items: SysCategoryResult[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface SysCategoryParams {
  app_code: string;
  name: string;
  type?: string;
  code?: string;
  description?: string;
  parent_id?: number;
  icon?: string;
  color?: string;
  sort_order?: number;
  status?: boolean;
  is_system?: boolean;
  remark?: string;
  extra_data?: Record<string, any>;
}

export interface SysCategoryUpdateParams {
  name?: string;
  code?: string;
  description?: string;
  parent_id?: number;
  icon?: string;
  color?: string;
  sort_order?: number;
  status?: boolean;
  is_system?: boolean;
  remark?: string;
  extra_data?: Record<string, any>;
}

export interface SysCategoryQueryParams {
  app_code?: string;
  type?: string;
  name?: string;
  status?: boolean;
}

/**
 * 获取分类树
 */
export async function getSysCategoryTreeApi(params?: SysCategoryQueryParams) {
  return requestClient.get<SysCategoryTreeResult[]>(
    '/api/v1/sys/categories/tree',
    { params },
  );
}

/**
 * 获取分类列表（分页）
 */
export async function getSysCategoryListApi(
  params?: SysCategoryQueryParams & { page?: number; size?: number },
) {
  return requestClient.get<SysCategoryPaginationResponse>(
    '/api/v1/sys/categories',
    { params },
  );
}

/**
 * 获取分类详情
 */
export async function getSysCategoryDetailApi(pk: number) {
  return requestClient.get<SysCategoryResult>(`/api/v1/sys/categories/${pk}`);
}

/**
 * 获取应用下的分类类型列表
 */
export async function getSysCategoryTypesApi(appCode: string) {
  return requestClient.get<string[]>(`/api/v1/sys/categories/types/${appCode}`);
}

/**
 * 获取所有应用标识选项
 */
export async function getSysCategoryAppCodesApi() {
  return requestClient.get<string[]>(
    '/api/v1/sys/categories/options/app-codes',
  );
}

/**
 * 获取所有分类类型选项
 */
export async function getSysCategoryTypeOptionsApi(appCode?: string) {
  return requestClient.get<string[]>('/api/v1/sys/categories/options/types', {
    params: appCode ? { app_code: appCode } : undefined,
  });
}

/**
 * 创建分类
 */
export async function createSysCategoryApi(data: SysCategoryParams) {
  return requestClient.post('/api/v1/sys/categories', data);
}

/**
 * 更新分类
 */
export async function updateSysCategoryApi(
  pk: number,
  data: SysCategoryUpdateParams,
) {
  return requestClient.put(`/api/v1/sys/categories/${pk}`, data);
}

/**
 * 批量删除分类
 */
export async function deleteSysCategoryApi(ids: number[]) {
  return requestClient.delete('/api/v1/sys/categories', { data: { ids } });
}
