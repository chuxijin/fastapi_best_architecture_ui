import type { PaginationResult } from '#/types';

import { requestClient } from './request';

// ==================== 枚举定义 ====================

// 递归速度枚举
export type RecursionSpeed = 'normal' | 'slow' | 'fast';

// 同步方法枚举
export type SyncMethod = 'incremental' | 'full' | 'overwrite';

// 模板类型枚举
export type TemplateType = 'exclusion' | 'rename' | 'custom';

// 模板分类枚举
export type TemplateCategory = '文件过滤' | '开发工具' | '文件命名' | '备份管理' | '自动分类' | '文件去重';

// 资源领域枚举
export type ResourceDomain = '教育' | '科技' | '影视';

// 资源类型枚举
export type ResourceType = '课程' | '电子书' | '笔记' | '软件' | '真题';

// 教育领域科目枚举
export type EducationSubject = '26考研英语' | '26考研数学' | '26考研政治' | '26考研统考' | '26考研非统考';

// 科技领域科目枚举
export type TechnologySubject = '编程开发' | '人工智能' | '数据科学' | '网络安全' | '云计算';

// 影视领域科目枚举
export type EntertainmentSubject = '电影' | '短剧' | '电视剧' | '综艺';

// 所有科目类型的联合类型
export type ResourceSubject = EducationSubject | TechnologySubject | EntertainmentSubject;

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
  { label: '增量同步', value: 'incremental', description: '只添加新文件，不删除目标中已有的文件' },
  { label: '完全同步', value: 'full', description: '添加新文件，删除目标中多余的文件' },
  { label: '覆盖同步', value: 'overwrite', description: '删除目标中所有文件，然后添加源中的所有文件' },
] as const;

// 网盘类型选项
export const DRIVE_TYPE_OPTIONS = [
  { label: '百度网盘', value: 'BaiduDrive' },
  { label: '夸克网盘', value: 'QuarkDrive' },
  { label: 'Alist网盘', value: 'AlistDrive' },
] as const;

// 网盘类型标签映射
export const DRIVE_TYPE_LABEL_MAP = {
  BaiduDrive: '百度网盘',
  QuarkDrive: '夸克网盘',
  AlistDrive: 'Alist网盘',
} as const;

// 网盘类型颜色映射
export const DRIVE_TYPE_COLOR_MAP = {
  BaiduDrive: 'blue',
  QuarkDrive: 'green',
  AlistDrive: 'orange',
} as const;

// 获取网盘类型标签
export const getDriveTypeLabel = (type: string) => {
  return DRIVE_TYPE_LABEL_MAP[type as keyof typeof DRIVE_TYPE_LABEL_MAP] || type;
};

// 获取网盘类型颜色
export const getDriveTypeColor = (type: string) => {
  return DRIVE_TYPE_COLOR_MAP[type as keyof typeof DRIVE_TYPE_COLOR_MAP] || 'default';
};

// 网盘类型标签选项（用于表格渲染）
export const DRIVE_TYPE_TAG_OPTIONS = [
  { color: 'blue', label: '百度网盘', value: 'BaiduDrive' },
  { color: 'green', label: '夸克网盘', value: 'QuarkDrive' },
  { color: 'orange', label: 'Alist网盘', value: 'AlistDrive' },
] as const;

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

// 资源领域选项（用于前端显示）
export const RESOURCE_DOMAIN_OPTIONS = [
  { label: '教育', value: '教育' as ResourceDomain },
  { label: '科技', value: '科技' as ResourceDomain },
  { label: '影视', value: '影视' as ResourceDomain },
] as const;

// 资源类型选项（用于前端显示）
export const RESOURCE_TYPE_OPTIONS = [
  { label: '课程', value: '课程' as ResourceType },
  { label: '电子书', value: '电子书' as ResourceType },
  { label: '软件', value: '软件' as ResourceType },
  { label: '真题', value: '真题' as ResourceType },
] as const;

// 领域和科目的映射关系（用于前端联动）
export const DOMAIN_SUBJECT_MAPPING = {
  '教育': [
    { label: '26考研英语', value: '26考研英语' },
    { label: '26考研数学', value: '26考研数学' },
    { label: '26考研政治', value: '26考研政治' },
    { label: '26考研统考', value: '26考研统考' },
    { label: '26考研非统考', value: '26考研非统考' },
  ],
  '科技': [
    { label: '编程开发', value: '编程开发' },
    { label: '人工智能', value: '人工智能' },
    { label: '数据科学', value: '数据科学' },
    { label: '网络安全', value: '网络安全' },
    { label: '云计算', value: '云计算' },
  ],
  '影视': [
    { label: '电影', value: '电影' },
    { label: '短剧', value: '短剧' },
    { label: '电视剧', value: '电视剧' },
    { label: '综艺', value: '综艺' },
  ],
} as const;

// ==================== 类型定义 ====================

// 同步任务相关
export interface SyncTaskResult {
  success: boolean;
  error?: string;
  [key: string]: any;
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

export type CoulddriveRelationshipItem = CoulddriveUserFriendDetail | CoulddriveUserGroupDetail;

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

// 领域科目映射相关类型
export interface DomainSubjectMapping {
  domains: Array<{ label: string; value: string }>;
  subjects: Record<string, string[]>;
  domain_subject_options: Record<string, Array<{ label: string; value: string }>>;
}

// ==================== 同步任务 API ====================

/**
 * 执行同步任务
 */
export async function executeCoulddriveSyncTaskApi(configId: number) {
  return requestClient.post<SyncTaskResult>(`/api/v1/couldsync/execute/${configId}`, {}, {
    timeout: 60 * 60 * 1000, // 1小时超时
  });
}

/**
 * 获取同步配置列表
 */
export async function getCoulddriveSyncConfigListApi(
  params: CoulddriveSyncConfigListParams,
) {
  return requestClient.get<PaginationResult>('/api/v1/couldsync/config', {
    params,
  });
}

/**
 * 创建同步配置
 */
export async function createCoulddriveSyncConfigApi(
  params: CreateCoulddriveSyncConfigParams,
) {
  return requestClient.post<CoulddriveSyncConfigDetail>('/api/v1/couldsync/config', params);
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
  return requestClient.get<PaginationResult>('/api/v1/coulduser/relationshiplist', {
    params,
    headers: {
      'X-Token': token,
    },
    timeout: 60 * 2 * 1000, // 2分钟超时
  });
}

/**
 * 获取 Coulddrive 用户列表
 */
export async function getCoulddriveUserListApi(
  params: CoulddriveUserListParams,
) {
  return requestClient.get<PaginationResult>('/api/v1/coulduser/userlist', {
    params,
  });
}

/**
 * 创建 Coulddrive 用户
 */
export async function createCoulddriveUserApi(
  params: CoulddriveUserInfoParams,
  token: string,
) {
  return requestClient.post<CoulddriveUserInfo>('/api/v1/coulduser/create', {}, {
    params,
    headers: {
      'X-Token': token,
    },
  });
}

/**
 * 删除 Coulddrive 用户
 */
export async function deleteCoulddriveUserApi(userId: number) {
  return requestClient.delete<string>(`/api/v1/coulduser/${userId}`);
}


// ==================== 文件管理 API ====================

/**
 * 获取 Coulddrive 文件列表
 */
export async function getCoulddriveFileListApi(
  params: CoulddriveListFilesParams,
  token: string,
  options?: { disableCache?: boolean }
) {
  // 如果需要禁用缓存，添加时间戳参数
  const finalParams = options?.disableCache
    ? { ...params, _t: Date.now() }
    : params;

  return requestClient.get<PaginationResult>('/api/v1/couldfile/list', {
    params: finalParams,
    headers: {
      'X-Token': token,
    },
    timeout: 60000
  });
}

/**
 * 获取 Coulddrive 分享文件列表
 */
export async function getCoulddriveShareFileListApi(
  params: CoulddriveListShareFilesParams,
  token: string,
) {
  return requestClient.get<PaginationResult>('/api/v1/couldfile/listshare', {
    params,
    headers: {
      'X-Token': token,
    },
    timeout: 60000
  });
}

/**
 * 创建 Coulddrive 文件夹
 */
export async function createCoulddriveFolderApi(
  params: CoulddriveMkdirParams,
  token: string,
) {
  return requestClient.post<CoulddriveFileInfo>('/api/v1/couldfile/mkdir', params, {
    headers: {
      'X-Token': token,
    },
  });
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
    timeout: 60000, // 转存可能需要较长时间
  });
}

/**
 * 创建 Coulddrive 分享链接
 */
export async function createCoulddriveShareApi(
  params: CoulddriveShareParams,
  token: string,
) {
  return requestClient.post<CoulddriveShareInfo>('/api/v1/couldfile/share', params, {
    headers: {
      'X-Token': token,
    },
  });
}

// ==================== 规则模板 API ====================

/**
 * 获取规则模板列表
 */
export async function getRuleTemplateListApi(
  params: RuleTemplateListParams,
) {
  return requestClient.get<PaginationResult>('/api/v1/template/list', {
    params,
  });
}

/**
 * 根据类型获取规则模板
 */
export async function getRuleTemplatesByTypeApi(
  templateType: TemplateType,
) {
  return requestClient.get<RuleTemplateDetail[]>(`/api/v1/template/type/${templateType}`);
}

/**
 * 获取规则模板详情
 */
export async function getRuleTemplateDetailApi(templateId: number) {
  return requestClient.get<RuleTemplateDetail>(`/api/v1/template/${templateId}`);
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
export async function updateRuleTemplateApi(templateId: number, params: UpdateRuleTemplateParams) {
  return requestClient.put<RuleTemplateDetail>(`/api/v1/template/${templateId}`, params);
}

/**
 * 删除规则模板
 */
export async function deleteRuleTemplateApi(templateId: number) {
  return requestClient.delete<{ message: string }>(`/api/v1/template/${templateId}`);
}

/**
 * 批量删除规则模板
 */
export async function batchDeleteRuleTemplatesApi(ids: number[]) {
  return requestClient.delete<{ message: string }>('/api/v1/template/', { data: { ids } });
}

/**
 * 切换规则模板启用状态
 */
export async function toggleRuleTemplateActiveApi(templateId: number, isActive: boolean) {
  return requestClient.put<{ message: string }>(`/api/v1/template/${templateId}/toggle?is_active=${isActive}`, {});
}

/**
 * 使用规则模板
 */
export async function useRuleTemplateApi(templateId: number) {
  return requestClient.post<RuleTemplateDetail>(`/api/v1/template/${templateId}/use`);
}

/**
 * 获取规则模板统计信息
 */
export async function getRuleTemplateStatsApi() {
  return requestClient.get<RuleTemplateStatsDetail>('/api/v1/template/stats/overview');
}

// ==================== 资源管理 API ====================

// 资源管理相关类型定义
export interface ResourceDetail {
  id: number;
  domain: string;
  subject: string;
  main_name: string;
  title?: string;
  resource_type: string;
  url_type: string;
  url: string;
  description?: string;
  resource_intro?: string;
  resource_image?: string;
  extract_code?: string;
  is_temp_file: boolean;
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
}

export interface ResourceListItem {
  id: number;
  domain: string;
  subject: string;
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

export interface ResourceListParams {
  domain?: string;
  subject?: string;
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
  domain: string;
  subject: string;
  main_name: string;
  resource_type: string;
  url: string;
  url_type: string;
  user_id: number;
  description?: string;
  resource_intro?: string;
  resource_image?: string;
  extract_code?: string;
  is_temp_file?: boolean;
  price?: number;
  suggested_price?: number;
  sort?: number;
  remark?: string;
}

export interface UpdateResourceParams {
  domain?: string;
  subject?: string;
  main_name?: string;
  resource_type?: string;
  description?: string;
  resource_intro?: string;
  resource_image?: string;
  url?: string;
  url_type?: string;
  extract_code?: string;
  is_temp_file?: boolean;
  price?: number;
  suggested_price?: number;
  sort?: number;
  remark?: string;
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
 * 获取领域和科目映射关系
 */
export async function getDomainSubjectMappingApi() {
  return requestClient.get<DomainSubjectMapping>('/api/v1/resources/domain-subjects');
}

/**
 * 根据领域获取科目列表
 */
export async function getSubjectsByDomainApi(domain: string) {
  return requestClient.get<Array<{ label: string; value: string }>>(`/api/v1/resources/subjects/${domain}`);
}

/**
 * 获取资源列表
 */
export async function getResourceListApi(params: ResourceListParams) {
  return requestClient.get<PaginationResult>('/api/v1/resources', {
    params,
  });
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
  autoRefresh: boolean = false
) {
  return requestClient.put<ResourceDetail>(
    `/api/v1/resources/${resourceId}?auto_refresh=${autoRefresh}`,
    params
  );
}

/**
 * 刷新资源分享信息
 */
export async function refreshResourceShareInfoApi(resourceId: number) {
  return requestClient.put<ResourceDetail>(`/api/v1/resources/${resourceId}/refresh-share-info`);
}

/**
 * 删除资源
 */
export async function deleteResourceApi(resourceId: number) {
  return requestClient.delete<{ message: string }>(`/api/v1/resources/${resourceId}`);
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
 * 获取资源浏览量历史
 */
export async function getResourceViewHistoryApi(
  resourceId: number,
  params: ResourceViewHistoryListParams
) {
  return requestClient.get<PaginationResult>(
    `/api/v1/resources/${resourceId}/view-history`,
    { params }
  );
}

/**
 * 获取资源浏览量趋势
 */
export async function getResourceViewTrendApi(params: ResourceViewTrendParams) {
  return requestClient.get<ResourceViewTrendResponse>(
    '/api/v1/resources/view-trend',
    { params }
  );
}

/**
 * 更新资源浏览量
 */
export async function updateResourceViewCountApi(
  resourceId: number,
  params: UpdateResourceViewCountParams
) {
  return requestClient.put<{ message: string }>(
    `/api/v1/resources/${resourceId}/view-count`,
    params
  );
}

/**
 * 获取同步任务列表
 */
export async function getSyncTaskListApi(
  configId: number,
  params: SyncTaskListParams
) {
  return requestClient.get<PaginationResult>(
    `/api/v1/couldsync/${configId}/tasks`,
    { params }
  );
}

/**
 * 获取同步任务详情
 */
export async function getSyncTaskDetailApi(taskId: number) {
  return requestClient.get<SyncTaskWithRelationDetail>(
    `/api/v1/couldsync/task/${taskId}`
  );
}

/**
 * 获取同步任务项列表
 */
export async function getSyncTaskItemListApi(
  taskId: number,
  params: SyncTaskItemListParams
) {
  return requestClient.get<PaginationResult>(
    `/api/v1/couldsync/task/${taskId}/items`,
    { params }
  );
}

// 教师映射接口和常量
interface TeacherMapping {
  field: string;
  subject: string;
  sort: number;
}

export const TEACHER_MAPPINGS: Record<string, TeacherMapping> = {
  武忠祥: {
    field: '26考研',
    subject: '数学',
    sort: 1
  },
  张宇: {
    field: '26考研',
    subject: '数学',
    sort: 2
  },
  姜晓千: {
    field: '26考研',
    subject: '数学',
    sort: 3
  },
  李永乐: {
    field: '26考研',
    subject: '数学',
    sort: 5
  },
  汤家凤: {
    field: '26考研',
    subject: '数学',
    sort: 6
  },
  杨超: {
    field: '26考研',
    subject: '数学',
    sort: 7
  },
  周洋鑫: {
    field: '26考研',
    subject: '数学',
    sort: 8
  },
  田静: {
    field: '26考研',
    subject: '英语',
    sort: 1
  },
  唐迟: {
    field: '26考研',
    subject: '英语',
    sort: 2
  },
  刘晓燕: {
    field: '26考研',
    subject: '英语',
    sort: 3
  },
  王晶婷: {
    field: '26考研',
    subject: '英语',
    sort: 4
  },
  颉斌斌: {
    field: '26考研',
    subject: '英语',
    sort: 5
  },
  新东方: {
    field: '26考研',
    subject: '英语',
    sort: 6
  },
  朱伟: {
    field: '26考研',
    subject: '英语',
    sort: 7
  },
  石雷鹏: {
    field: '26考研',
    subject: '英语',
    sort: 8
  },
  王江涛: {
    field: '26考研',
    subject: '英语',
    sort: 9
  },
  Monkey: {
    field: '26考研',
    subject: '英语',
    sort: 10
  },
  其他: {
    field: '26考研',
    subject: '英语',
    sort: 99
  },
  徐涛: {
    field: '26考研',
    subject: '政治',
    sort: 1
  },
  肖: {
    field: '26考研',
    subject: '政治',
    sort: 2
  },
  腿姐: {
    field: '26考研',
    subject: '政治',
    sort: 3
  },
  苏一: {
    field: '26考研',
    subject: '政治',
    sort: 4
  },
  米鹏: {
    field: '26考研',
    subject: '政治',
    sort: 5
  }
};

// 智能识别相关接口
export interface SmartRecognitionRequest {
  content: string;
}

export interface SmartRecognitionResponse {
  domain?: string;
  subject?: string;
  main_name?: string;
  resource_type?: string;
  url?: string;
  url_type?: string;
  extract_code?: string;
  description?: string;
  resource_intro?: string;
  sort?: number;
  confidence: number; // 识别置信度
  success: boolean;
  message?: string;
}

// AI识别服务配置
const AI_CONFIG = {
  apiUrl: 'https://goapi.gptnb.ai/v1/chat/completions',
  apiKey: 'sk-JcAXVYA8xb2PHl7bAa9d47A598Ee4971A910080400EbB122',
  model: 'gpt-4o',
};

// 智能识别提示词
const SMART_RECOGNITION_PROMPT = `
你是一个专业的网盘资源信息提取助手。请从用户提供的分享文本中提取资源信息，并以JSON格式返回。

提取规则：
1. 从文本中识别资源名称（通常在「」或[]中）
2. 判断网盘类型（百度网盘、夸克网盘、阿里云盘等）
3. 提取分享链接
4. 提取提取码（如果有）
5. 根据资源名称推断领域和科目
6. 推断资源类型（课程、电子书、软件、真题等）
7. 识别教师名字并设置对应的排序值

领域分类（必须使用以下值）：
- 教育：包含学科、课程、教学相关内容
- 科技：包含软件、编程、技术相关内容
- 影视：包含电影、电视剧、综艺等内容

科目分类（必须使用以下值）：
教育领域：
- 26考研英语、26考研数学、26考研政治、26考研统考、26考研非统考

科技领域：
- 编程开发、人工智能、数据科学、网络安全、云计算

影视领域：
- 电影、短剧、电视剧、综艺

资源类型（必须使用以下值）：
- 课程、电子书、笔记、软件、真题

网盘类型映射（必须使用以下值）：
- 夸克网盘/夸克 -> QuarkDrive
- 百度网盘/百度 -> BaiduDrive
- 阿里云盘/阿里 -> AlistDrive

教师识别和排序（如果识别到以下教师名字，请设置对应的排序值）：
数学教师：武忠祥(1), 张宇(2), 姜晓千(3), 李永乐(5), 汤家凤(6), 杨超(7), 周洋鑫(8)
英语教师：田静(1), 唐迟(2), 刘晓燕(3), 王晶婷(4), 颉斌斌(5), 新东方(6), 朱伟(7), 石雷鹏(8), 王江涛(9), Monkey(10), 其他(99)
政治教师：徐涛(1), 肖(2), 腿姐(3), 苏一(4), 米鹏(5)

请严格按照以下JSON格式返回，不要包含任何其他文本：
{
  "domain": "领域（教育/科技/影视）",
  "subject": "科目（必须从上述枚举中选择）",
  "main_name": "资源主要名称",
  "resource_type": "资源类型（课程/电子书/软件/真题）",
  "url": "分享链接",
  "url_type": "网盘类型（QuarkDrive/BaiduDrive/AlistDrive）",
  "extract_code": "提取码（如果有）",
  "description": "简要描述",
  "resource_intro": "详细介绍",
  "sort": 排序值（如果识别到教师则使用对应排序，否则设为0）,
  "confidence": 0.95,
  "success": true,
  "message": "识别成功"
}

如果无法识别某些字段，请设为空字符串或null。confidence表示识别置信度(0-1)。
特别注意：科目字段必须从上述枚举列表中精确选择，不能使用其他值。
如果识别到教师名字，请根据上述映射表设置对应的排序值。
`;

// 智能识别API
export async function smartRecognitionApi(content: string): Promise<SmartRecognitionResponse> {
  // 输入验证
  if (!content || content.trim().length < 10) {
    throw new Error('输入内容太短，请提供完整的分享文本');
  }

  // 设置请求超时
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

  try {
    const response = await fetch(AI_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: SMART_RECOGNITION_PROMPT,
          },
          {
            role: 'user',
            content: `请分析以下分享文本并提取资源信息：\n\n${content}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('API密钥无效，请检查配置');
      } else if (response.status === 429) {
        throw new Error('请求过于频繁，请稍后再试');
      } else if (response.status >= 500) {
        throw new Error('AI服务暂时不可用，请稍后重试');
      } else {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('AI响应格式错误');
    }

    const aiResponse = data.choices[0].message.content.trim();

    // 尝试解析JSON响应
    try {
      // 处理被代码块包裹的JSON响应
      let jsonString = aiResponse;

      // 移除可能的代码块标记
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // 移除可能的其他格式标记
      jsonString = jsonString.replace(/^json\s*/, '').trim();

      const parsedResult = JSON.parse(jsonString);

      // 验证必要字段
      if (typeof parsedResult !== 'object') {
        throw new Error('AI返回的不是有效的JSON对象');
      }

      // 设置默认值
      const result: SmartRecognitionResponse = {
        domain: parsedResult.domain || '',
        subject: parsedResult.subject || '',
        main_name: parsedResult.main_name || '',
        resource_type: parsedResult.resource_type || '',
        url: parsedResult.url || '',
        url_type: parsedResult.url_type || '',
        extract_code: parsedResult.extract_code || '',
        description: parsedResult.description || '',
        resource_intro: parsedResult.resource_intro || '',
        sort: parsedResult.sort || 0,
        confidence: Math.min(Math.max(parsedResult.confidence || 0.5, 0), 1), // 确保在0-1范围内
        success: parsedResult.success !== false,
        message: parsedResult.message || '识别完成',
      };

      // 基本验证：如果没有提取到关键信息，降低置信度
      if (!result.main_name && !result.url) {
        result.confidence = Math.min(result.confidence, 0.3);
        result.message = '未能提取到关键信息，建议手动填写';
      }

      return result;
    } catch (parseError) {
      console.error('解析AI响应失败:', parseError);
      console.error('原始AI响应:', aiResponse);

      // 如果JSON解析失败，尝试简单的文本提取
      return await fallbackTextExtraction(content);
    }
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('请求超时，请检查网络连接后重试');
    }

    console.error('智能识别API调用失败:', error);

    // 降级到简单文本提取
    return await fallbackTextExtraction(content);
  }
}

// 降级处理：简单的文本提取
async function fallbackTextExtraction(content: string): Promise<SmartRecognitionResponse> {
  const result: SmartRecognitionResponse = {
    domain: '',
    subject: '',
    main_name: '',
    resource_type: '',
    url: '',
    url_type: '',
    extract_code: '',
    description: '',
    resource_intro: '',
    sort: 0,
    confidence: 0.3,
    success: true,
    message: '使用简单提取模式',
  };

  // 提取链接
  const urlMatch = content.match(/(https?:\/\/[^\s]+)/);
  if (urlMatch) {
    result.url = urlMatch[1];
  }

  // 判断网盘类型
  if (content.includes('夸克') || content.includes('quark')) {
    result.url_type = 'QuarkDrive';
  } else if (content.includes('百度') || content.includes('baidu')) {
    result.url_type = 'BaiduDrive';
  } else if (content.includes('阿里') || content.includes('aliyun')) {
    result.url_type = 'AlistDrive';
  }

  // 提取资源名称（在「」或[]中）
  const nameMatch = content.match(/[「【\[]([^」】\]]+)[」】\]]/);
  if (nameMatch) {
    result.main_name = nameMatch[1];
  }

  // 提取提取码
  const codeMatch = content.match(/提取码[：:]\s*([a-zA-Z0-9]+)|密码[：:]\s*([a-zA-Z0-9]+)/);
  if (codeMatch) {
    result.extract_code = codeMatch[1] || codeMatch[2];
  }

  // 教师识别和排序设置
  let teacherFound = false;
  for (const [teacherName, mapping] of Object.entries(TEACHER_MAPPINGS)) {
    if (content.includes(teacherName)) {
      result.sort = mapping.sort;
      teacherFound = true;

      // 根据教师设置对应的科目
      if (mapping.subject === '数学') {
        result.domain = '教育';
        result.subject = '26考研数学';
        result.resource_type = '课程';
      } else if (mapping.subject === '英语') {
        result.domain = '教育';
        result.subject = '26考研英语';
        result.resource_type = '课程';
      } else if (mapping.subject === '政治') {
        result.domain = '教育';
        result.subject = '26考研政治';
        result.resource_type = '课程';
      }
      break; // 找到第一个匹配的教师就停止
    }
  }

  // 如果没有通过教师识别设置领域，则进行简单的领域判断（使用正确的枚举值）
  if (!teacherFound && result.main_name) {
    const name = result.main_name.toLowerCase();

    // 教育领域判断
    if (name.includes('考研') || name.includes('英语') || name.includes('数学') || name.includes('政治') ||
        name.includes('课程') || name.includes('教学') || name.includes('学习') || name.includes('统考')) {
      result.domain = '教育';
      result.resource_type = '课程';

      // 具体科目判断
      if (name.includes('英语')) {
        result.subject = '26考研英语';
      } else if (name.includes('数学')) {
        result.subject = '26考研数学';
      } else if (name.includes('政治')) {
        result.subject = '26考研政治';
      } else if (name.includes('统考')) {
        result.subject = '26考研统考';
      } else if (name.includes('考研')) {
        result.subject = '26考研非统考';
      }
    }
    // 科技领域判断
    else if (name.includes('软件') || name.includes('编程') || name.includes('代码') ||
             name.includes('ai') || name.includes('人工智能') || name.includes('数据') ||
             name.includes('安全') || name.includes('云计算')) {
      result.domain = '科技';
      result.resource_type = '软件';

      // 具体科目判断
      if (name.includes('编程') || name.includes('代码') || name.includes('开发')) {
        result.subject = '编程开发';
      } else if (name.includes('ai') || name.includes('人工智能')) {
        result.subject = '人工智能';
      } else if (name.includes('数据')) {
        result.subject = '数据科学';
      } else if (name.includes('安全')) {
        result.subject = '网络安全';
      } else if (name.includes('云计算') || name.includes('云')) {
        result.subject = '云计算';
      }
    }
    // 影视领域判断
    else if (name.includes('电影') || name.includes('电视') || name.includes('综艺') ||
             name.includes('短剧') || name.includes('影视') || name.includes('视频')) {
      result.domain = '影视';

      // 具体科目判断
      if (name.includes('电影')) {
        result.subject = '电影';
      } else if (name.includes('短剧')) {
        result.subject = '短剧';
      } else if (name.includes('电视') || name.includes('电视剧')) {
        result.subject = '电视剧';
      } else if (name.includes('综艺')) {
        result.subject = '综艺';
      }
    }
  }

  result.description = content.substring(0, 200); // 取前200个字符作为描述

  return result;
}
