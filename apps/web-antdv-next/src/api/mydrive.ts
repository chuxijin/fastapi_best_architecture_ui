import { requestClient } from './request';

export interface MyDriveAccount {
  id: number;
  provider: string;
  external_account_id: string;
  display_name: string;
  username: null | string;
  avatar_url: null | string;
  quota: null | number;
  used: null | number;
  vip_level: null | string;
  status: string;
  created_time?: string;
  last_profile_synced_at?: null | string;
  last_verified_at?: null | string;
}

export interface MyDriveAccountPayload {
  credential: Record<string, unknown>;
  display_name: string;
  external_account_id: string;
  provider: string;
}

export interface MyDriveSpace {
  id: number;
  provider: string;
  space_type: string;
  name: string;
  source_key: string;
  source_ref: Record<string, unknown>;
  account_id: null | number;
  root_id: null | string;
  root_path: string;
  capabilities: string[];
  is_enabled: boolean;
}

export interface MyDriveFile {
  file_id: string;
  name: string;
  path: string;
  is_directory: boolean;
  size: null | number;
  parent_id: null | string;
  modified_at: null | string;
}

export interface MyDriveFileList {
  items: MyDriveFile[];
  total: number;
  page: number;
  per_page: number;
  path: string;
}

export interface MyDriveShareLink {
  provider: string;
  share_id: string;
  title: string;
  url: string;
  password: string;
  expires_in_days: number;
  expired_at: null | string;
}

export interface MyDriveRelationship {
  source_id: string;
  name: string;
  extra: Record<string, unknown>;
}

export interface MyDriveRelationshipShare {
  source_id: string;
  from_uk: string;
  message_id: string;
  root_id: string;
  name: string;
  is_directory: boolean;
  size: null | number;
  extra: Record<string, unknown>;
}

export interface MyDrivePageData<T> {
  items: T[];
  total: number;
}

export interface MyDriveSyncRuleSet {
  id: number;
  name: string;
  description: string;
  is_enabled: boolean;
}

export interface MyDriveSyncRulePayload {
  sort_order: number;
  rule_type: 'exclude' | 'rename';
  pattern: string;
  replacement: string;
  is_enabled: boolean;
}

export interface MyDriveSyncRule extends MyDriveSyncRulePayload {
  id: number;
}

export interface MyDriveSyncRuleSetDetail extends MyDriveSyncRuleSet {
  owner_id: number;
  rules: MyDriveSyncRule[];
  created_time: string;
  updated_time: null | string;
}

export interface MyDriveSyncConfig {
  id: number;
  name: string;
  source_space_id: number;
  target_space_id: number;
  source_path: string;
  target_path: string;
  rule_set_id: null | number;
  sync_method: 'full' | 'incremental' | 'overwrite';
  is_enabled: boolean;
  cron: null | string;
  end_time: null | string;
  last_synced_at: null | string;
}

export interface MyDriveSyncTask {
  id: number;
  config_id: number;
  status: 'cancelled' | 'completed' | 'failed' | 'pending' | 'running';
  cancel_requested: boolean;
  statistics: Record<string, number>;
  error_message: null | string;
  started_at: null | string;
  finished_at: null | string;
  created_time: string;
}

export interface MyDriveSyncTaskItem {
  id: number;
  task_id: number;
  operation:
    | 'copy'
    | 'create_directory'
    | 'remove'
    | 'rename'
    | 'skip'
    | 'transfer';
  source_path: string;
  target_path: string;
  file_name: string;
  file_size: number;
  status: string;
  error_message: null | string;
  created_time: string;
}

export interface MyDriveSyncConfigPayload {
  name: string;
  source_space_id: number;
  target_space_id: number;
  source_path: string;
  target_path: string;
  rule_set_id?: null | number;
  sync_method: 'full' | 'incremental' | 'overwrite';
  cron?: null | string;
  end_time?: null | string;
}

export interface MyDriveSyncRuleSetPayload {
  name: string;
  description: string;
  rules: MyDriveSyncRulePayload[];
}

/** 飞书表导出配置 */
export interface MyDriveFeishuSheetConfig {
  id: number;
  name: string;
  /** 分类来源，对应 sys_category.app_code */
  app_code: string;
  /** 飞书表格地址 */
  sheet_url: string;
  /** 分类类型，对应 sys_category.type */
  category_type: string;
  description: string;
  /** 资源类型 -> 子表名称 */
  sheet_map: Record<string, string>;
  /** 分类列下拉选项 */
  category_options: string[];
  /** 来源 -> 随机权重 */
  source_weights: Record<string, number>;
  /** 允许出现「店铺购买」来源的子表 */
  paid_sheets: string[];
  is_enabled: boolean;
  cron: null | string;
  end_time: null | string;
  last_synced_at: null | string;
  created_time: string;
  updated_time: null | string;
}

export interface MyDriveFeishuSheetConfigPayload {
  name: string;
  app_code: string;
  sheet_url: string;
  category_type?: string;
  description?: string;
  sheet_map: Record<string, string>;
  category_options?: string[];
  source_weights?: Record<string, number>;
  paid_sheets?: string[];
  cron?: null | string;
  end_time?: null | string;
}

/** 可选分类来源（app_code + category_type 组合） */
export interface MyDriveFeishuCategorySource {
  app_code: string;
  category_type: string;
  /** 该组合下的分类数量，便于确认选对了来源 */
  category_count: number;
  /** 分类名示例，便于人工确认 */
  sample_names: string[];
}

/** 飞书表导出任务 */
export interface MyDriveFeishuSheetTask {
  id: number;
  config_id: number;
  status: 'cancelled' | 'completed' | 'failed' | 'pending' | 'running';
  statistics: Record<string, unknown>;
  error_message: null | string;
  started_at: null | string;
  finished_at: null | string;
  created_time: string;
  updated_time: null | string;
}

export interface MyDriveResourceShare {
  id?: number;
  resource_id?: number;
  provider: string;
  account_id?: null | number;
  source_type: string;
  source_ref: Record<string, unknown>;
  share_url: string;
  share_id: string;
  share_key: string;
  extract_code: string;
  share_title: string;
  share_status: string;
  share_audit_status: string;
  share_expired_at: null | string;
  expires_in_days: number;
  share_meta: Record<string, unknown>;
  file_id: string;
  file_name: string;
  file_path: string;
  is_directory: boolean;
  file_size: null | number;
  file_type: string;
}

export interface MyDriveResource {
  id: number;
  owner_id: number;
  category_id: number;
  title: string;
  resource_type: string;
  description: string;
  images: unknown[];
  org_name: string;
  tags: string[];
  content: string;
  view_count: number;
  search_count: number;
  hot: number;
  last_viewed_at: null | string;
  last_searched_at: null | string;
  status: string;
  audit_status: string;
  temp_policy: number;
  sort: number;
  resource_expired_at: null | string;
  share: MyDriveResourceShare | null;
  created_time: string;
  updated_time: null | string;
}

export interface MyDriveResourcePayload {
  category_id: number;
  title: string;
  resource_type: string;
  description: string;
  images: unknown[];
  org_name: string;
  tags: string[];
  content: string;
  status: string;
  audit_status: string;
  temp_policy: number;
  sort: number;
  resource_expired_at?: null | string;
  share: MyDriveResourceShare;
}

export interface MyDriveResourceStatistics {
  total_count: number;
  active_count: number;
  total_views: number;
  total_searches: number;
  total_hot: number;
}

export async function getMyDriveAccountsApi() {
  return requestClient.get<MyDrivePageData<MyDriveAccount>>(
    '/api/v1/mydrive/accounts',
    { params: { page: 1, size: 100 } },
  );
}

export async function getMyDriveAccountPersonalFilesApi(
  accountId: number,
  path = '/',
  fileId?: null | string,
) {
  return requestClient.get<MyDriveFileList>(
    `/api/v1/mydrive/accounts/${accountId}/personal/list`,
    {
      params: { path, file_id: fileId || undefined, page: 1, per_page: 200 },
      timeout: 60_000,
    },
  );
}

export async function getMyDriveSpacesApi() {
  return requestClient.get<MyDrivePageData<MyDriveSpace>>(
    '/api/v1/mydrive/spaces',
    { params: { page: 1, size: 100 } },
  );
}

export async function getMyDriveSpaceFilesApi(
  spaceId: number,
  path = '/',
  fileId?: null | string,
  refresh = false,
) {
  return requestClient.get<MyDriveFileList>(
    `/api/v1/mydrive/spaces/${spaceId}/list`,
    {
      params: {
        file_id: fileId || undefined,
        path,
        page: 1,
        per_page: 200,
        refresh,
      },
      timeout: 60_000,
    },
  );
}

export async function previewMyDriveSpaceFilesApi(params: {
  account_id: number;
  file_id?: null | string;
  path?: string;
  provider: string;
  root_id?: null | string;
  root_path?: string;
  source_key: string;
  source_ref: Record<string, unknown>;
  space_type: string;
}) {
  return requestClient.post<MyDriveFileList>(
    '/api/v1/mydrive/spaces/preview',
    params,
    { timeout: 60_000 },
  );
}

export async function createMyDriveShareApi(
  spaceId: number,
  params: {
    expires_in_days: number;
    files: MyDriveFile[];
    password: string;
    title: string;
  },
) {
  return requestClient.post<MyDriveShareLink>(
    `/api/v1/mydrive/spaces/${spaceId}/share`,
    params,
    { timeout: 60_000 },
  );
}

export async function getMyDriveSharesApi(spaceId: number) {
  return requestClient.get<MyDrivePageData<MyDriveShareLink>>(
    `/api/v1/mydrive/spaces/${spaceId}/shares`,
    { params: { page: 1, per_page: 100 }, timeout: 60_000 },
  );
}

export async function getMyDriveRelationshipsApi(
  accountId: number,
  spaceType: 'friend' | 'group',
  params?: { limit?: number; offset?: number },
) {
  return requestClient.get<MyDriveRelationship[]>(
    `/api/v1/mydrive/accounts/${accountId}/relationships/${spaceType}`,
    { params, timeout: 60_000 },
  );
}

export async function getMyDriveRelationshipSharesApi(
  accountId: number,
  spaceType: 'friend' | 'group',
  sourceId: string,
) {
  return requestClient.get<MyDriveRelationshipShare[]>(
    `/api/v1/mydrive/accounts/${accountId}/relationships/${spaceType}/${sourceId}/shares`,
    { timeout: 60_000 },
  );
}

export async function getMyDriveShareApi(spaceId: number, shareId: string) {
  return requestClient.get<MyDriveShareLink>(
    `/api/v1/mydrive/spaces/${spaceId}/shares/${shareId}`,
    { timeout: 60_000 },
  );
}

export async function cancelMyDriveSharesApi(
  spaceId: number,
  shareIds: string[],
) {
  return requestClient.post<undefined>(
    `/api/v1/mydrive/spaces/${spaceId}/shares/cancel`,
    { share_ids: shareIds },
    { timeout: 60_000 },
  );
}

export async function createMyDriveDirectoryApi(
  spaceId: number,
  params: {
    name: string;
    parent?: MyDriveFile | null;
  },
) {
  return requestClient.post<MyDriveFile>(
    `/api/v1/mydrive/spaces/${spaceId}/mkdir`,
    params,
    { timeout: 60_000 },
  );
}

export async function renameMyDriveFileApi(
  spaceId: number,
  params: {
    file: MyDriveFile;
    name: string;
  },
) {
  return requestClient.post<MyDriveFile>(
    `/api/v1/mydrive/spaces/${spaceId}/rename`,
    params,
    { timeout: 60_000 },
  );
}

export async function removeMyDriveFilesApi(
  spaceId: number,
  files: MyDriveFile[],
) {
  return requestClient.post<undefined>(
    `/api/v1/mydrive/spaces/${spaceId}/remove`,
    { files },
    { timeout: 60_000 },
  );
}

export async function copyMyDriveFilesApi(
  spaceId: number,
  params: {
    files: MyDriveFile[];
    target?: MyDriveFile | null;
  },
) {
  return requestClient.post<undefined>(
    `/api/v1/mydrive/spaces/${spaceId}/copy`,
    params,
    { timeout: 60_000 },
  );
}

export async function moveMyDriveFilesApi(
  spaceId: number,
  params: {
    files: MyDriveFile[];
    target?: MyDriveFile | null;
  },
) {
  return requestClient.post<undefined>(
    `/api/v1/mydrive/spaces/${spaceId}/move`,
    params,
    { timeout: 60_000 },
  );
}

export async function saveMyDriveShareFilesApi(
  spaceId: number,
  params: {
    account_id: number;
    files: MyDriveFile[];
    provider: string;
    root_id?: null | string;
    root_path?: string;
    source_key: string;
    source_ref: Record<string, unknown>;
    target?: MyDriveFile | null;
  },
) {
  return requestClient.post<MyDriveFile[]>(
    `/api/v1/mydrive/spaces/${spaceId}/save-share`,
    params,
    { timeout: 60_000 },
  );
}

export async function createMyDriveAccountApi(params: {
  credential: Record<string, unknown>;
  display_name: string;
  external_account_id: string;
  provider: string;
}) {
  return requestClient.post<MyDriveAccount>('/api/v1/mydrive/accounts', params);
}

export async function updateMyDriveAccountApi(
  accountId: number,
  params: Partial<MyDriveAccountPayload & { status: string }>,
) {
  return requestClient.put<undefined>(
    `/api/v1/mydrive/accounts/${accountId}`,
    params,
  );
}

export async function syncMyDriveAccountProfileApi(accountId: number) {
  return requestClient.post<MyDriveAccount>(
    `/api/v1/mydrive/accounts/${accountId}/profile/sync`,
    undefined,
    { timeout: 60_000 },
  );
}

export async function deleteMyDriveAccountApi(accountId: number) {
  return requestClient.delete<undefined>(
    `/api/v1/mydrive/accounts/${accountId}`,
  );
}

export async function createMyDriveSpaceApi(params: {
  account_id: number;
  name: string;
  provider: string;
  root_id?: null | string;
  root_path?: string;
  source_key: string;
  source_ref?: Record<string, unknown>;
  space_type: string;
}) {
  return requestClient.post<MyDriveSpace>('/api/v1/mydrive/spaces', params);
}

export async function updateMyDriveSpaceApi(
  spaceId: number,
  params: {
    is_enabled?: boolean;
    name?: string;
    root_id?: null | string;
    root_path?: string;
  },
) {
  return requestClient.put<undefined>(
    `/api/v1/mydrive/spaces/${spaceId}`,
    params,
  );
}

export async function deleteMyDriveSpaceApi(spaceId: number) {
  return requestClient.delete<undefined>(`/api/v1/mydrive/spaces/${spaceId}`);
}

export async function getMyDriveSyncRuleSetsApi() {
  return requestClient.get<MyDrivePageData<MyDriveSyncRuleSet>>(
    '/api/v1/mydrive/sync/rule-sets',
    { params: { page: 1, size: 100 } },
  );
}

export async function createMyDriveSyncRuleSetApi(
  params: MyDriveSyncRuleSetPayload,
) {
  return requestClient.post<MyDriveSyncRuleSetDetail>(
    '/api/v1/mydrive/sync/rule-sets',
    params,
  );
}

export async function getMyDriveSyncRuleSetApi(ruleSetId: number) {
  return requestClient.get<MyDriveSyncRuleSetDetail>(
    `/api/v1/mydrive/sync/rule-sets/${ruleSetId}`,
  );
}

export async function updateMyDriveSyncRuleSetApi(
  ruleSetId: number,
  params: Partial<MyDriveSyncRuleSetPayload & { is_enabled: boolean }>,
) {
  return requestClient.put(
    `/api/v1/mydrive/sync/rule-sets/${ruleSetId}`,
    params,
  );
}

export async function getMyDriveSyncConfigsApi(params?: {
  page?: number;
  size?: number;
}) {
  return requestClient.get<MyDrivePageData<MyDriveSyncConfig>>(
    '/api/v1/mydrive/sync/configs',
    { params: { page: params?.page || 1, size: params?.size || 100 } },
  );
}

export async function createMyDriveSyncConfigApi(
  params: MyDriveSyncConfigPayload,
) {
  return requestClient.post<MyDriveSyncConfig>(
    '/api/v1/mydrive/sync/configs',
    params,
  );
}

export async function updateMyDriveSyncConfigApi(
  configId: number,
  params: Partial<MyDriveSyncConfigPayload & { is_enabled: boolean }>,
) {
  return requestClient.put<undefined>(
    `/api/v1/mydrive/sync/configs/${configId}`,
    params,
  );
}

export async function deleteMyDriveSyncConfigApi(configId: number) {
  return requestClient.delete<undefined>(
    `/api/v1/mydrive/sync/configs/${configId}`,
  );
}

export async function createMyDriveSyncTaskApi(configId: number) {
  return requestClient.post<MyDriveSyncTask>(
    `/api/v1/mydrive/sync/configs/${configId}/tasks`,
  );
}

export async function getMyDriveSyncTasksApi() {
  return requestClient.get<MyDrivePageData<MyDriveSyncTask>>(
    '/api/v1/mydrive/sync/tasks',
    { params: { page: 1, size: 100 } },
  );
}

export async function getMyDriveSyncTaskItemsApi(taskId: number) {
  return requestClient.get<MyDrivePageData<MyDriveSyncTaskItem>>(
    `/api/v1/mydrive/sync/tasks/${taskId}/items`,
    { params: { page: 1, size: 200 } },
  );
}

export async function cancelMyDriveSyncTaskApi(taskId: number) {
  return requestClient.post<undefined>(
    `/api/v1/mydrive/sync/tasks/${taskId}/cancel`,
  );
}

// ---------------- 飞书表导出 ----------------

export async function getMyDriveFeishuCategorySourcesApi() {
  return requestClient.get<MyDriveFeishuCategorySource[]>(
    '/api/v1/mydrive/feishu/category-sources',
  );
}

export async function getMyDriveFeishuConfigsApi(params?: {
  is_enabled?: boolean;
  name?: string;
  page?: number;
  size?: number;
}) {
  return requestClient.get<MyDrivePageData<MyDriveFeishuSheetConfig>>(
    '/api/v1/mydrive/feishu/configs',
    {
      params: { page: params?.page || 1, size: params?.size || 100, ...params },
    },
  );
}

export async function getMyDriveFeishuConfigApi(configId: number) {
  return requestClient.get<MyDriveFeishuSheetConfig>(
    `/api/v1/mydrive/feishu/configs/${configId}`,
  );
}

export async function createMyDriveFeishuConfigApi(
  params: MyDriveFeishuSheetConfigPayload,
) {
  return requestClient.post<MyDriveFeishuSheetConfig>(
    '/api/v1/mydrive/feishu/configs',
    params,
  );
}

export async function updateMyDriveFeishuConfigApi(
  configId: number,
  params: Partial<MyDriveFeishuSheetConfigPayload & { is_enabled: boolean }>,
) {
  return requestClient.put<undefined>(
    `/api/v1/mydrive/feishu/configs/${configId}`,
    params,
  );
}

export async function deleteMyDriveFeishuConfigApi(configId: number) {
  return requestClient.delete<undefined>(
    `/api/v1/mydrive/feishu/configs/${configId}`,
  );
}

/** 手动触发一次导出 */
export async function createMyDriveFeishuTaskApi(configId: number) {
  return requestClient.post<MyDriveFeishuSheetTask>(
    `/api/v1/mydrive/feishu/configs/${configId}/tasks`,
  );
}

export async function getMyDriveFeishuTasksApi(params?: {
  config_id?: number;
  page?: number;
  size?: number;
  status?: string;
}) {
  return requestClient.get<MyDrivePageData<MyDriveFeishuSheetTask>>(
    '/api/v1/mydrive/feishu/tasks',
    {
      params: { page: params?.page || 1, size: params?.size || 100, ...params },
    },
  );
}

export async function getMyDriveFeishuTaskApi(taskId: number) {
  return requestClient.get<MyDriveFeishuSheetTask>(
    `/api/v1/mydrive/feishu/tasks/${taskId}`,
  );
}

export async function getMyDriveResourcesApi(params: Record<string, unknown>) {
  return requestClient.get<MyDrivePageData<MyDriveResource>>(
    '/api/v1/mydrive/resources',
    { params },
  );
}

export async function getMyDriveResourceStatisticsApi() {
  return requestClient.get<MyDriveResourceStatistics>(
    '/api/v1/mydrive/resources/statistics',
  );
}

export async function createMyDriveResourceApi(params: MyDriveResourcePayload) {
  return requestClient.post<MyDriveResource>(
    '/api/v1/mydrive/resources',
    params,
  );
}

export async function updateMyDriveResourceApi(
  resourceId: number,
  params: Partial<MyDriveResourcePayload>,
) {
  return requestClient.put<MyDriveResource>(
    `/api/v1/mydrive/resources/${resourceId}`,
    params,
  );
}

export async function deleteMyDriveResourceApi(resourceId: number) {
  return requestClient.delete<undefined>(
    `/api/v1/mydrive/resources/${resourceId}`,
  );
}

export async function recordMyDriveResourceViewApi(resourceId: number) {
  return requestClient.post<MyDriveResource>(
    `/api/v1/mydrive/resources/${resourceId}/view`,
  );
}

export async function recordMyDriveResourceSearchClickApi(resourceId: number) {
  return requestClient.post<MyDriveResource>(
    `/api/v1/mydrive/resources/${resourceId}/search-click`,
  );
}

export async function refreshMyDriveResourceShareApi(resourceId: number) {
  return requestClient.post<MyDriveResource>(
    `/api/v1/mydrive/resources/${resourceId}/refresh-share`,
    undefined,
    {
      timeout: 60_000,
    },
  );
}

export async function rebuildMyDriveResourceShareApi(resourceId: number) {
  return requestClient.post<MyDriveResource>(
    `/api/v1/mydrive/resources/${resourceId}/rebuild-share`,
    undefined,
    {
      timeout: 60_000,
    },
  );
}

export async function cancelMyDriveResourceShareApi(resourceId: number) {
  return requestClient.post<MyDriveResource>(
    `/api/v1/mydrive/resources/${resourceId}/cancel-share`,
  );
}

export async function getMyDriveResourceViewTrendApi(resourceId: number) {
  return requestClient.get<
    MyDrivePageData<{ id: number; record_time: string; view_count: number }>
  >(`/api/v1/mydrive/resources/${resourceId}/view-trend`, {
    params: { page: 1, size: 100 },
  });
}

export async function uploadMyDriveResourceFileApi(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post<{
    file_type: string;
    filename: string;
    resource_image: string[];
    storage_key: string;
    thumbnail_urls?: string[];
    url: string;
  }>('/api/v1/mydrive/resources/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function uploadMyDriveResourcePdfPreviewsApi(
  file: File,
  options?: { maxSide?: number; pageCount?: number; quality?: number },
) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post<{
    file_type: string;
    filename: string;
    resource_image: string[];
    thumbnail_urls?: string[];
  }>('/api/v1/mydrive/resources/upload/pdf-previews', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    params: {
      max_side: options?.maxSide,
      page_count: options?.pageCount,
      quality: options?.quality,
    },
  });
}
