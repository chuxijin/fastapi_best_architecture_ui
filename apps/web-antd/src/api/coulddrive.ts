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
export type ResourceType = '课程' | '电子书' | '软件' | '真题';

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
  recursive?: boolean;
  desc?: boolean;
  name?: boolean;
  time?: boolean;
  size_sort?: boolean;
  recursion_speed?: RecursionSpeed;
  exclude_rules?: string;
  page?: number;
  size?: number;
}

export interface CoulddriveListShareFilesParams {
  drive_type: string;
  source_type: string;
  source_id: string;
  file_path: string;
  recursive?: boolean;
  recursion_speed?: RecursionSpeed;
  exclude_rules?: string;
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
) {
  return requestClient.get<PaginationResult>('/api/v1/couldfile/list', {
    params,
    headers: {
      'X-Token': token,
    },
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
