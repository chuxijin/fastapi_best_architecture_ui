import type { PaginationResult } from '#/types';

// 网盘类型 - 使用字典系统
import { DictEnum, getDictOptions } from '#/utils/dict';

import { requestClient } from './request';

// ==================== 枚举定义 ====================

// 递归速度枚举
export type RecursionSpeed = 'fast' | 'normal' | 'slow';

// 同步方法枚举
export type SyncMethod = 'full' | 'incremental' | 'overwrite';

// 模板类型枚举
export type TemplateType = 'custom' | 'exclusion' | 'rename';

// 模板分类枚举
export type TemplateCategory =
  | '备份管理'
  | '开发工具'
  | '文件去重'
  | '文件命名'
  | '文件过滤'
  | '自动分类';

// ==================== 常量定义 ====================

// 递归速度数值映射（用于后端API）
export const RECURSION_SPEED_VALUES = {
  normal: 0,
  slow: 1,
  fast: 2,
} as const;

// 递归速度选项（用于前端显示）
export const RECURSION_SPEED_OPTIONS = [
  { label: '正常速度', value: 0, key: 'normal' },
  { label: '慢速', value: 1, key: 'slow' },
  { label: '快速', value: 2, key: 'fast' },
] as const;

// 同步方法选项（用于前端显示）
export const SYNC_METHOD_OPTIONS = [
  {
    label: '增量同步',
    value: 'incremental',
    description: '只添加新文件，不删除目标中已有的文件',
  },
  {
    label: '完全同步',
    value: 'full',
    description: '添加新文件，删除目标中多余的文件',
  },
  {
    label: '覆盖同步',
    value: 'overwrite',
    description: '删除目标中所有文件，然后添加源中的所有文件',
  },
] as const;

// 导出字典枚举，方便组件直接使用
export { DictEnum, getDictOptions };

// 获取网盘类型标签
export const getDriveTypeLabel = (type: string) => {
  const options = getDictOptions(DictEnum.DRIVE_TYPE);
  const found = options.find((opt) => String(opt.value) === type);
  return found ? found.label : type;
};

// 获取网盘类型颜色
export const getDriveTypeColor = (type: string) => {
  const options = getDictOptions(DictEnum.DRIVE_TYPE);
  const found = options.find((opt) => String(opt.value) === type);
  return found?.color || 'default';
};

// 模板类型选项（用于前端显示）
export const TEMPLATE_TYPE_OPTIONS = [
  { label: '排除规则', value: 'exclusion' as TemplateType },
  { label: '重命名规则', value: 'rename' as TemplateType },
  { label: '自定义规则', value: 'custom' as TemplateType },
] as const;

// 模板分类选项（用于前端显示）
export const TEMPLATE_CATEGORY_OPTIONS = [
  { label: '文件过滤', value: '文件过滤' as TemplateCategory },
  { label: '开发工具', value: '开发工具' as TemplateCategory },
  { label: '文件命名', value: '文件命名' as TemplateCategory },
  { label: '备份管理', value: '备份管理' as TemplateCategory },
  { label: '自动分类', value: '自动分类' as TemplateCategory },
  { label: '文件去重', value: '文件去重' as TemplateCategory },
] as const;

// ==================== 类型定义 ====================

// 分类管理相关（使用 admin 的分类模型）
export interface CategoryDetail {
  id: number;
  app_code: string;
  name: string;
  code?: string;
  description?: string;
  type: string; // 分类类型：domain, subject, resource_type
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
  created_time: string;
  updated_time?: string;
  children?: CategoryDetail[];
}

export interface CategoryTreeNode {
  id: number;
  app_code: string;
  name: string;
  code?: string;
  description?: string;
  type: string; // 分类类型：domain, subject, resource_type
  parent_id?: number;
  level: number;
  sort_order: number;
  status: boolean;
  is_system: boolean;
  children?: CategoryTreeNode[];
}

export interface CategoryListParams {
  app_code?: string;
  type?: string;
  name?: string;
  status?: boolean;
  page?: number;
  size?: number;
}

export interface CreateCategoryParams {
  app_code: string;
  name: string;
  type: string;
  code?: string;
  description?: string;
  parent_id?: number;
  sort_order?: number;
  status?: boolean;
}

export interface UpdateCategoryParams {
  name?: string;
  code?: string;
  description?: string;
  parent_id?: number;
  sort_order?: number;
  status?: boolean;
}

export interface CategoryOption {
  label: string;
  value: string;
  code: string;
}

export interface CategoryStatistics {
  total_count: number;
  active_count: number;
  domain_count: number;
  subject_count: number;
  resource_type_count: number;
}

// 同步任务相关
export interface SyncTaskResult {
  success: boolean;
  error?: string;
  [key: string]: any;
}

// 异步任务提交结果
export interface AsyncTaskSubmitResult {
  task_id: string;
  config_id: number;
  status: string;
  message: string;
}

// 异步任务状态
export interface AsyncTaskStatus {
  task_id: string;
  status: string;
  ready: boolean;
  successful?: boolean;
  failed?: boolean;
  result?: SyncTaskResult;
  error?: string;
  message: string;
}

// 用户信息相关
export interface CoulddriveUserInfo {
  user_id: string;
  username: string;
  avatar_url?: string;
  quota?: number;
  used?: number;
  is_vip?: boolean;
  is_supervip?: boolean;
}

export interface CoulddriveUserFriendDetail {
  uk: number;
  uname: string;
  nick_name: string;
  avatar_url: string;
  is_friend: number;
}

export interface CoulddriveUserGroupDetail {
  gid: string;
  gnum: string;
  name: string;
  type: string;
  status: string;
}

export type CoulddriveRelationshipItem =
  | CoulddriveUserFriendDetail
  | CoulddriveUserGroupDetail;

// 网盘账户详情
export interface CoulddriveDriveAccountDetail {
  id: number;
  user_id: string;
  username: string;
  type: string;
  avatar_url?: string;
  quota?: number;
  used?: number;
  is_vip?: boolean;
  is_supervip?: boolean;
  cookies?: string;
  is_valid: boolean;
  created_time: string;
  updated_time: string;
}

// 文件信息相关
export interface CoulddriveFileInfo {
  file_id: string;
  file_name: string;
  file_path: string;
  is_folder: boolean;
  file_size?: number;
  parent_id?: string;
  created_at?: string;
  updated_at?: string;
  file_ext: Record<string, any>;
}

export interface CoulddriveSyncConfigDetail {
  id: number;
  enable: boolean;
  remark?: string;
  type: string;
  src_path: string;
  dst_path: string;
  user_id: number;
  cron?: string;
  speed: number;
  method: SyncMethod;
  last_sync?: string;
  created_time: string;
  updated_time?: string;
}

// 请求参数类型
export interface CoulddriveUserInfoParams {
  drive_type: string;
}

export interface CoulddriveRelationshipParams {
  drive_type: string;
  relationship_type: 'friend' | 'group';
  page?: number;
  size?: number;
}

export interface CoulddriveUserListParams {
  type?: string;
  is_valid?: boolean;
  page?: number;
  size?: number;
}

export interface CoulddriveListFilesParams {
  drive_type: string;
  file_path?: string;
  file_id?: string;
  desc?: boolean;
  name?: boolean;
  time?: boolean;
  size_sort?: boolean;
  page?: number;
  size?: number;
}

export interface CoulddriveListShareFilesParams {
  drive_type: string;
  source_type: string;
  source_id: string;
  file_path: string;
  page?: number;
  size?: number;
}

export interface CoulddriveMkdirParams {
  drive_type: string;
  file_path: string;
  parent_id?: string;
  file_name?: string;
  return_if_exist?: boolean;
}

export interface CoulddriveRemoveParams {
  drive_type: string;
  file_paths?: string | string[];
  file_ids?: string | string[];
  parent_id?: string;
  file_name?: string;
}

export interface CoulddriveTransferParams {
  drive_type: string;
  source_type: string;
  source_id: string;
  source_path: string;
  target_path: string;
  file_ids?: (number | string)[];
  ext?: Record<string, any>;
}

export interface CoulddriveShareParams {
  drive_type: string;
  file_name: string;
  file_ids: (number | string)[];
  expired_type: number;
  password?: string;
}

export interface CoulddriveShareInfo {
  title: string;
  share_id: string;
  pwd_id: string;
  url: string;
  password: string;
  expired_type: number;
  view_count: number;
  expired_at?: string;
  expired_left?: number;
  audit_status: number;
  status: number;
  file_id?: string;
  file_only_num?: string;
  file_size?: number;
  path_info?: string;
}

// 重命名参数
export interface CoulddriveRenameParams {
  drive_type: string;
  file_id?: string;
  file_path?: string;
  new_name: string;
  parent_id?: string;
  file_name?: string; // 原始文件名称
  new_path?: string; // 新的完整路径
}

// 移动文件参数
export interface CoulddriveMoveParams {
  drive_type: string;
  file_ids?: string[];
  file_paths?: string[];
  target_id?: string;
  target_path?: string;
}

// 复制文件参数
export interface CoulddriveCopyParams {
  drive_type: string;
  file_ids?: string[];
  file_paths?: string[];
  target_id?: string;
  target_path?: string;
}

// 取消分享参数
export interface CoulddriveCancelShareParams {
  drive_type: string;
  shareid_list: (number | string)[];
}

// 批量重命名单个文件项的接口
export interface CoulddriveBatchRenameFileItem {
  file_id: string;
  file_path: string;
  is_folder: boolean;
  file_name: string;
  parent_id?: string;
}

// 批量重命名参数
export interface CoulddriveBatchRenameParams {
  drive_type: string;
  file_infos: CoulddriveBatchRenameFileItem[];
  recursive: boolean;
  target_scope: 'all' | 'file' | 'folder';
  rename_rules?: Array<{
    case_sensitive: boolean;
    enable: boolean;
    match_regex: string;
    replace_string: string;
    target_scope: 'name' | 'path';
  }>;
  template_id?: number;
  task_id?: string;
}

export interface CoulddriveSyncConfigListParams {
  enable?: boolean;
  type?: string;
  remark?: string;
  created_by?: number;
  page?: number;
  size?: number;
}

export interface CreateCoulddriveSyncConfigParams {
  enable: boolean;
  remark?: string;
  type: string;
  src_path: string;
  src_meta?: string;
  dst_path: string;
  dst_meta?: string;
  user_id: number;
  cron?: string;
  speed: number;
  method: SyncMethod;
  end_time?: string;
  exclude?: string;
  rename?: string;
}

export interface UpdateCoulddriveSyncConfigParams {
  enable?: boolean;
  remark?: string;
  type?: string;
  src_path?: string;
  src_meta?: string;
  dst_path?: string;
  dst_meta?: string;
  user_id?: number;
  cron?: string;
  speed?: number;
  method?: SyncMethod;
  end_time?: string;
  exclude?: string;
  rename?: string;
}

// 规则模板相关
export interface RuleTemplateDetail {
  id: number;
  template_name: string;
  template_type: TemplateType;
  description?: string;
  rule_config: Record<string, any>;
  category?: TemplateCategory;
  tags?: string[];
  is_active: boolean;
  is_system: boolean;
  usage_count: number;
  last_used_at?: string;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
}

export interface RuleTemplateListParams {
  template_type?: TemplateType;
  category?: TemplateCategory;
  is_active?: boolean;
  is_system?: boolean;
  keyword?: string;
  page?: number;
  size?: number;
}

export interface CreateRuleTemplateParams {
  template_name: string;
  template_type: TemplateType;
  description?: string;
  rule_config: Record<string, any>;
  category?: TemplateCategory;
  tags?: string[];
}

export interface UpdateRuleTemplateParams {
  template_name?: string;
  template_type?: TemplateType;
  description?: string;
  rule_config?: Record<string, any>;
  category?: TemplateCategory;
  tags?: string[];
  is_active?: boolean;
}

export interface RuleTemplateStatsDetail {
  total_count: number;
  active_count: number;
  system_count: number;
  user_count: number;
  category_stats: Record<string, number>;
  type_stats: Record<string, number>;
}

// ==================== 同步任务 API ====================

/**
 * 提交异步同步任务
 */
export async function executeCoulddriveSyncTaskApi(configId: number) {
  return requestClient.post<AsyncTaskSubmitResult>(
    `/api/v1/couldsync/execute/${configId}`,
    {},
    {
      timeout: 30 * 60 * 1000, // 30分钟超时，仅用于提交任务（长耗时任务）
    },
  );
}

/**
 * 查询异步任务状态
 */
export async function getAsyncTaskStatusApi(taskId: string) {
  return requestClient.get<AsyncTaskStatus>(
    `/api/v1/couldsync/task/status/${taskId}`,
    {
      timeout: 10 * 1000, // 10秒超时
    },
  );
}

/**
 * 获取同步配置列表
 */
export async function getCoulddriveSyncConfigListApi(
  params: CoulddriveSyncConfigListParams,
) {
  return requestClient.get<PaginationResult<CoulddriveSyncConfigDetail>>(
    '/api/v1/couldsync/config',
    {
      params,
    },
  );
}

/**
 * 创建同步配置
 */
export async function createCoulddriveSyncConfigApi(
  params: CreateCoulddriveSyncConfigParams,
) {
  return requestClient.post<CoulddriveSyncConfigDetail>(
    '/api/v1/couldsync/config',
    params,
  );
}

/**
 * 更新同步配置
 */
export async function updateCoulddriveSyncConfigApi(
  configId: number,
  params: UpdateCoulddriveSyncConfigParams,
) {
  return requestClient.put<CoulddriveSyncConfigDetail>(
    `/api/v1/couldsync/config/${configId}`,
    params,
  );
}

/**
 * 删除同步配置
 */
export async function deleteCoulddriveSyncConfigApi(configId: number) {
  return requestClient.delete<{ message: string }>(
    `/api/v1/couldsync/config/${configId}`,
  );
}

// ==================== 用户相关 API ====================

/**
 * 获取 Coulddrive 用户信息
 */
export async function getCoulddriveUserInfoApi(
  params: CoulddriveUserInfoParams,
  token: string,
) {
  return requestClient.get<CoulddriveUserInfo>('/api/v1/coulduser/userinfo', {
    params,
    headers: {
      'X-Token': token,
    },
  });
}

/**
 * 获取 Coulddrive 关系列表
 */
export async function getCoulddriveRelationshipListApi(
  params: CoulddriveRelationshipParams,
  token: string,
) {
  return requestClient.get<PaginationResult<CoulddriveRelationshipItem>>(
    '/api/v1/coulduser/relationshiplist',
    {
      params,
      headers: {
        'X-Token': token,
      },
      timeout: 60 * 2 * 1000, // 2分钟超时
    },
  );
}

/**
 * 获取 Coulddrive 用户列表
 */
export async function getCoulddriveUserListApi(
  params: CoulddriveUserListParams,
) {
  return requestClient.get<PaginationResult<CoulddriveDriveAccountDetail>>(
    '/api/v1/coulduser/userlist',
    {
      params,
    },
  );
}

/**
 * 创建 Coulddrive 用户
 */
export async function createCoulddriveUserApi(
  params: CoulddriveUserInfoParams,
  token: string,
) {
  return requestClient.post<CoulddriveUserInfo>(
    '/api/v1/coulduser/create',
    {},
    {
      params,
      headers: {
        'X-Token': token,
      },
    },
  );
}

/**
 * 删除 Coulddrive 用户
 */
export async function deleteCoulddriveUserApi(userId: number) {
  return requestClient.delete<string>(`/api/v1/coulduser/${userId}`);
}

/**
 * 刷新 Coulddrive 用户信息
 */
export async function refreshCoulddriveUserApi(userId: number) {
  return requestClient.put<CoulddriveUserInfo>(
    `/api/v1/coulduser/${userId}/refresh`,
  );
}

// ==================== 文件管理 API ====================

/**
 * 获取 Coulddrive 文件列表
 */
export async function getCoulddriveFileListApi(
  params: CoulddriveListFilesParams,
  token: string,
) {
  return requestClient.get<PaginationResult<CoulddriveFileInfo>>(
    '/api/v1/couldfile/list',
    {
      params,
      headers: {
        'X-Token': token,
      },
      timeout: 60_000,
    },
  );
}

/**
 * 获取 Coulddrive 分享文件列表
 */
export async function getCoulddriveShareFileListApi(
  params: CoulddriveListShareFilesParams,
  token: string,
) {
  return requestClient.get<PaginationResult<CoulddriveFileInfo>>(
    '/api/v1/couldfile/listshare',
    {
      params,
      headers: {
        'X-Token': token,
      },
      timeout: 60_000,
    },
  );
}

/**
 * 创建 Coulddrive 文件夹
 */
export async function createCoulddriveFolderApi(
  params: CoulddriveMkdirParams,
  token: string,
) {
  return requestClient.post<CoulddriveFileInfo>(
    '/api/v1/couldfile/mkdir',
    params,
    {
      headers: {
        'X-Token': token,
      },
    },
  );
}

/**
 * 删除 Coulddrive 文件或文件夹
 */
export async function removeCoulddriveFilesApi(
  params: CoulddriveRemoveParams,
  token: string,
) {
  return requestClient.delete<boolean>('/api/v1/couldfile/remove', {
    data: params,
    headers: {
      'X-Token': token,
    },
  });
}

/**
 * 转存 Coulddrive 文件
 */
export async function transferCoulddriveFilesApi(
  params: CoulddriveTransferParams,
  token: string,
) {
  return requestClient.post<boolean>('/api/v1/couldfile/transfer', params, {
    headers: {
      'X-Token': token,
    },
    // 转存完成后自动清理文件列表缓存
    timeout: 60_000, // 转存可能需要较长时间
  });
}

/**
 * 创建 Coulddrive 分享链接
 */
export async function createCoulddriveShareApi(
  params: CoulddriveShareParams,
  token: string,
) {
  return requestClient.post<CoulddriveShareInfo>(
    '/api/v1/couldfile/share',
    params,
    {
      headers: {
        'X-Token': token,
      },
    },
  );
}

/**
 * 取消 Coulddrive 分享链接
 */
export async function cancelCoulddriveShareApi(
  params: CoulddriveCancelShareParams,
  token: string,
) {
  return requestClient.delete<boolean>('/api/v1/couldfile/share/cancel', {
    data: params,
    headers: {
      'X-Token': token,
    },
  });
}

/**
 * 重命名 Coulddrive 文件或文件夹
 */
export async function renameCoulddriveFileApi(
  params: CoulddriveRenameParams,
  token: string,
) {
  return requestClient.post<boolean>('/api/v1/couldfile/rename', params, {
    headers: {
      'X-Token': token,
    },
  });
}

/**
 * 批量重命名 Coulddrive 文件或文件夹
 */
export async function batchRenameCoulddriveFilesApi(
  params: CoulddriveBatchRenameParams,
  token: string,
) {
  return requestClient.post<{
    errors: string[];
    renamed_failed: number;
    renamed_success: number;
  }>('/api/v1/couldfile/batch_rename', params, {
    headers: {
      'X-Token': token,
    },
    timeout: 30 * 60 * 1000, // 批量操作可能需要更长时间，设置为5分钟超时
  });
}

/**
 * 移动 Coulddrive 文件或文件夹
 */
export async function moveCoulddriveFilesApi(
  params: CoulddriveMoveParams,
  token: string,
) {
  return requestClient.post<boolean>('/api/v1/couldfile/move', params, {
    headers: {
      'X-Token': token,
    },
  });
}

/**
 * 复制 Coulddrive 文件或文件夹
 */
export async function copyCoulddriveFilesApi(
  params: CoulddriveCopyParams,
  token: string,
) {
  return requestClient.post<boolean>('/api/v1/couldfile/copy', params, {
    headers: {
      'X-Token': token,
    },
  });
}

/**
 * 获取批量重命名进度（SSE流）
 */
export function getBatchRenameProgressApi(taskId: string): EventSource {
  // 在开发环境下，EventSource不会遵循Vite代理配置，需要使用完整URL
  const isDev = import.meta.env.DEV;
  const baseUrl = isDev ? 'http://127.0.0.1:8000' : '';
  const url = `${baseUrl}/api/v1/couldfile/batch-rename-progress/${taskId}`;
  return new EventSource(url);
}

// ==================== 规则模板 API ====================

/**
 * 获取规则模板列表
 */
export async function getRuleTemplateListApi(params: RuleTemplateListParams) {
  return requestClient.get<PaginationResult<RuleTemplateDetail>>(
    '/api/v1/template/list',
    {
      params,
    },
  );
}

/**
 * 根据类型获取规则模板
 */
export async function getRuleTemplatesByTypeApi(templateType: TemplateType) {
  return requestClient.get<RuleTemplateDetail[]>(
    `/api/v1/template/type/${templateType}`,
  );
}

/**
 * 获取规则模板详情
 */
export async function getRuleTemplateDetailApi(templateId: number) {
  return requestClient.get<RuleTemplateDetail>(
    `/api/v1/template/${templateId}`,
  );
}

/**
 * 创建规则模板
 */
export async function createRuleTemplateApi(params: CreateRuleTemplateParams) {
  return requestClient.post<RuleTemplateDetail>('/api/v1/template/', params);
}

/**
 * 更新规则模板
 */
export async function updateRuleTemplateApi(
  templateId: number,
  params: UpdateRuleTemplateParams,
) {
  return requestClient.put<RuleTemplateDetail>(
    `/api/v1/template/${templateId}`,
    params,
  );
}

/**
 * 删除规则模板
 */
export async function deleteRuleTemplateApi(templateId: number) {
  return requestClient.delete<{ message: string }>(
    `/api/v1/template/${templateId}`,
  );
}

/**
 * 批量删除规则模板
 */
export async function batchDeleteRuleTemplatesApi(ids: number[]) {
  return requestClient.delete<{ message: string }>('/api/v1/template/', {
    data: { ids },
  });
}

/**
 * 切换规则模板启用状态
 */
export async function toggleRuleTemplateActiveApi(
  templateId: number,
  isActive: boolean,
) {
  return requestClient.put<{ message: string }>(
    `/api/v1/template/${templateId}/toggle?is_active=${isActive}`,
    {},
  );
}

/**
 * 使用规则模板
 */
export async function useRuleTemplateApi(templateId: number) {
  return requestClient.post<RuleTemplateDetail>(
    `/api/v1/template/${templateId}/use`,
  );
}

/**
 * 获取规则模板统计信息
 */
export async function getRuleTemplateStatsApi() {
  return requestClient.get<RuleTemplateStatsDetail>(
    '/api/v1/template/stats/overview',
  );
}

// ==================== 资源管理 API ====================

// 资源管理相关类型定义
export interface ResourceDetail {
  id: number;
  category_id: number;
  main_name: string;
  title?: string;
  resource_type: string;
  url_type: string;
  url: string;
  description?: string;
  resource_intro?: string;
  resource_image?: string;
  extract_code?: string;
  is_temp_file: number; // 0无操作 1定时删除 2定时刷新 3定时更新
  price?: number;
  suggested_price?: number;
  sort: number;
  remark?: string;
  share_id?: string;
  pwd_id?: string;
  expired_type: number;
  view_count: number;
  expired_at?: string;
  expired_left?: number;
  audit_status: number;
  status: number;
  file_only_num?: string;
  file_size?: number;
  path_info?: string;
  file_id?: string;
  content?: string;
  uk_uid?: string;
  user_id: number;
  is_deleted: boolean;
  created_by: number;
  updated_by?: number;
  created_time: string;
  updated_time?: string;
  local_file_path?: string;
  file_type?: string;
}

export interface ResourceListItem {
  id: number;
  category_id: number;
  main_name: string;
  title?: string;
  resource_type: string;
  url_type: string;
  url: string;
  price?: number;
  suggested_price?: number;
  view_count: number;
  sort: number;
  status: number;
  audit_status: number;
  is_deleted: boolean;
  user_id: number;
  remark?: string;
  created_time: string;
  updated_time?: string;
  local_file_path?: string;
  file_type?: string;
}

export interface ResourceStatistics {
  total_count: number;
  active_count: number;
  pending_audit_count: number;
  approved_count: number;
  rejected_count: number;
  deleted_count: number;
  total_views: number;
  today_start_views: number;
  today_growth: number;
}

// 整体统计趋势相关类型
export interface OverallStatisticsTrendData {
  date: string; // YYYY-MM-DD
  total_count: number;
  total_views: number;
  active_count: number;
  new_resources: number;
}

export interface OverallStatisticsTrendParams {
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  days?: number; // 默认7天
}

export interface OverallStatisticsTrendResponse {
  trend_data: OverallStatisticsTrendData[];
  summary: {
    average_daily_new_resources: number;
    period_days: number;
    total_resources_growth: number;
    total_views_growth: number;
  };
}

export interface ResourceListParams {
  category_id?: number;
  resource_type?: string;
  url_type?: string;
  status?: number;
  audit_status?: number;
  user_id?: number;
  is_deleted?: boolean;
  keyword?: string;
  page?: number;
  size?: number;
}

export interface CreateResourceParams {
  category_id: number;
  main_name: string;
  resource_type: string;
  url: string;
  url_type: string;
  user_id: number;
  description?: string;
  resource_intro?: string;
  resource_image?: string;
  extract_code?: string;
  is_temp_file?: number; // 0无操作 1定时删除 2定时刷新 3定时更新
  price?: number;
  suggested_price?: number;
  sort?: number;
  remark?: string;
  local_file_path?: string;
  file_type?: string;
}

export interface UpdateResourceParams {
  category_id?: number;
  main_name?: string;
  resource_type?: string;
  description?: string;
  resource_intro?: string;
  resource_image?: string;
  url?: string;
  url_type?: string;
  extract_code?: string;
  is_temp_file?: number; // 0无操作 1定时删除 2定时刷新 3定时更新
  price?: number;
  suggested_price?: number;
  sort?: number;
  remark?: string;
  local_file_path?: string;
  file_type?: string;
}

// 资源浏览量历史相关
export interface ResourceViewHistoryDetail {
  id: number;
  pwd_id: string;
  view_count: number;
  record_time: string;
}

export interface ResourceViewTrendData {
  record_time: string;
  view_count: number;
}

export interface ResourceViewTrendResponse {
  pwd_id: string;
  current_view_count: number;
  trend_data: ResourceViewTrendData[];
}

export interface ResourceViewHistoryListParams {
  pwd_id?: string;
  start_time?: string;
  end_time?: string;
  page?: number;
  size?: number;
}

export interface ResourceViewTrendParams {
  pwd_id: string;
  start_time?: string;
  end_time?: string;
}

export interface UpdateResourceViewCountParams {
  pwd_id: string;
  view_count: number;
}

// 同步任务详情接口
export interface SyncTaskDetail {
  id: number;
  config_id: number;
  status: string;
  err_msg?: string;
  start_time?: string;
  task_num?: string;
  dura_time: number;
  created_time: string;
  updated_time?: string;
  created_by: number;
  updated_by?: number;
}

// 同步任务项详情接口
export interface SyncTaskItemDetail {
  id: number;
  task_id: number;
  type: string;
  src_path: string;
  dst_path: string;
  file_name: string;
  file_size: number;
  status: string;
  err_msg?: string;
  created_time: string;
  updated_time?: string;
}

// 同步任务带关系的详情接口
export interface SyncTaskWithRelationDetail extends SyncTaskDetail {
  task_items: SyncTaskItemDetail[];
}

// 同步任务列表参数
export interface SyncTaskListParams {
  status?: string;
  page?: number;
  size?: number;
}

// 同步任务项列表参数
export interface SyncTaskItemListParams {
  status?: string;
  operation_type?: string;
  page?: number;
  size?: number;
}

// 资源管理 API 接口

/**
 * 获取资源列表
 */
export async function getResourceListApi(params: ResourceListParams) {
  return requestClient.get<PaginationResult<ResourceListItem>>(
    '/api/v1/resources',
    {
      params,
    },
  );
}

/**
 * 获取资源详情
 */
export async function getResourceDetailApi(resourceId: number) {
  return requestClient.get<ResourceDetail>(`/api/v1/resources/${resourceId}`);
}

/**
 * 创建资源
 */
export async function createResourceApi(params: CreateResourceParams) {
  return requestClient.post<ResourceDetail>('/api/v1/resources', params);
}

/**
 * 更新资源
 */
export async function updateResourceApi(
  resourceId: number,
  params: UpdateResourceParams,
  autoRefresh: boolean = false,
) {
  return requestClient.put<ResourceDetail>(
    `/api/v1/resources/${resourceId}?auto_refresh=${autoRefresh}`,
    params,
  );
}

/**
 * 刷新资源分享信息
 */
export async function refreshResourceShareInfoApi(resourceId: number) {
  return requestClient.put<ResourceDetail>(
    `/api/v1/resources/${resourceId}/refresh-share-info`,
  );
}

/**
 * 删除资源
 */
export async function deleteResourceApi(resourceId: number) {
  return requestClient.delete<{ message: string }>(
    `/api/v1/resources/${resourceId}`,
  );
}

/**
 * 上传资源文件
 */
export async function uploadResourceFileApi(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post<{
    file_type: string;
    filename: string;
    local_path: string;
    url: string;
  }>('/api/v1/resources/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * 获取资源统计信息
 */
export async function getResourceStatisticsApi(userId?: number) {
  const params = userId ? { user_id: userId } : {};
  return requestClient.get<ResourceStatistics>('/api/v1/resources/statistics', {
    params,
  });
}

/**
 * 获取整体资源统计趋势
 */
export async function getOverallStatisticsTrendApi(
  params: OverallStatisticsTrendParams,
) {
  return requestClient.get<OverallStatisticsTrendResponse>(
    '/api/v1/resources/statistics/trend',
    {
      params,
    },
  );
}

/**
 * 获取资源浏览量历史
 */
export async function getResourceViewHistoryApi(
  resourceId: number,
  params: ResourceViewHistoryListParams,
) {
  return requestClient.get<PaginationResult<ResourceViewHistoryDetail>>(
    `/api/v1/resources/${resourceId}/view-history`,
    { params },
  );
}

/**
 * 获取资源浏览量趋势
 */
export async function getResourceViewTrendApi(params: ResourceViewTrendParams) {
  return requestClient.get<ResourceViewTrendResponse>(
    '/api/v1/resources/view-trend',
    { params },
  );
}

/**
 * 更新资源浏览量
 */
export async function updateResourceViewCountApi(
  resourceId: number,
  params: UpdateResourceViewCountParams,
) {
  return requestClient.put<{ message: string }>(
    `/api/v1/resources/${resourceId}/view-count`,
    params,
  );
}

/**
 * 获取同步任务列表
 */
export async function getSyncTaskListApi(
  configId: number,
  params: SyncTaskListParams,
) {
  return requestClient.get<PaginationResult<SyncTaskDetail>>(
    `/api/v1/couldsync/${configId}/tasks`,
    { params },
  );
}

/**
 * 获取同步任务详情
 */
export async function getSyncTaskDetailApi(taskId: number) {
  return requestClient.get<SyncTaskWithRelationDetail>(
    `/api/v1/couldsync/task/${taskId}`,
  );
}

/**
 * 获取同步任务项列表
 */
export async function getSyncTaskItemListApi(
  taskId: number,
  params: SyncTaskItemListParams,
) {
  return requestClient.get<PaginationResult<SyncTaskItemDetail>>(
    `/api/v1/couldsync/task/${taskId}/items`,
    { params },
  );
}

/**
 * 取消同步任务
 */
export async function cancelSyncTaskApi(taskId: number) {
  return requestClient.post<{
    message: string;
    status: string;
    task_id: number;
  }>(`/api/v1/couldsync/task/${taskId}/cancel`);
}

// 教师映射接口和常量
