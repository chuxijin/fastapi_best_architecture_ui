import { requestClient } from './request';

// ==================== 通用分页响应类型 ====================
export interface PaginationResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
  links: {
    first: string;
    last: string;
    next?: string;
    prev?: string;
    self: string;
  };
}

// ==================== 应用管理 ====================
export interface AppApplicationParams {
  name?: string;
  status?: number;
  page?: number;
  size?: number;
}

export interface AppApplicationResult {
  id: number;
  name: string;
  app_key: string;
  description?: string;
  icon?: string;
  status: number;
  is_free: boolean;
  created_time: string;
  updated_time?: string;
}

export interface CreateAppApplicationParams {
  name: string;
  app_key: string;
  description?: string;
  icon?: string;
  is_free?: boolean;
}

export interface UpdateAppApplicationParams {
  name?: string;
  description?: string;
  icon?: string;
  status?: number;
  is_free?: boolean;
}

// ==================== 设备管理 ====================
export interface AppDeviceParams {
  device_name?: string;
  status?: number;
  page?: number;
  size?: number;
}

export interface AppDeviceResult {
  id: number;
  device_id: string;
  device_name?: string;
  device_type?: string;
  os_info?: string;
  ip_address?: string;
  status: number;
  first_seen: string;
  last_seen?: string;
}

export interface CreateAppDeviceParams {
  device_id: string;
  device_name?: string;
  device_type?: string;
  os_info?: string;
  ip_address?: string;
}

export interface UpdateAppDeviceParams {
  device_name?: string;
  device_type?: string;
  os_info?: string;
  ip_address?: string;
  status?: number;
}

// ==================== 套餐管理 ====================
export interface AppPackageParams {
  application_id?: number;
  is_active?: boolean;
  page?: number;
  size?: number;
}

export interface AppPackageResult {
  id: number;
  application_id: number;
  application_name?: string;
  name: string;
  description?: string;
  duration_days: number;
  original_price: string;
  current_price: string;
  discount_rate?: string;
  discount_start_time?: string;
  discount_end_time?: string;
  max_devices: number;
  is_active: boolean;
  sort_order: number;
  created_time: string;
  updated_time?: string;
}

export interface CreateAppPackageParams {
  application_id: number;
  name: string;
  description?: string;
  duration_days: number;
  original_price: string;
  discount_rate?: string;
  discount_start_time?: string;
  discount_end_time?: string;
  max_devices?: number;
  sort_order?: number;
}

export interface UpdateAppPackageParams {
  name?: string;
  description?: string;
  duration_days?: number;
  original_price?: string;
  discount_rate?: string;
  discount_start_time?: string;
  discount_end_time?: string;
  max_devices?: number;
  is_active?: boolean;
  sort_order?: number;
}

// ==================== 订单管理 ====================
export interface AppOrderParams {
  user_id?: number;
  payment_status?: number;
  order_status?: number;
  page?: number;
  size?: number;
}

export interface AppOrderResult {
  id: number;
  order_no: string;
  package_id: number;
  device_id?: number;
  user_id?: number;
  username?: string;
  contact_info?: string;
  total_amount: string;
  paid_amount: string;
  payment_method?: string;
  payment_status: number;
  order_status: number;
  remark?: string;
  created_time: string;
  paid_time?: string;
  completed_time?: string;
}

export interface CreateAppOrderParams {
  package_id: number;
  device_id?: number;
  user_id?: number;
  username?: string;
  contact_info?: string;
  remark?: string;
}

export interface UpdateAppOrderParams {
  payment_method?: string;
  payment_status?: number;
  order_status?: number;
  paid_amount?: string;
  remark?: string;
}

// ==================== 兑换码管理 ====================
export interface AppRedeemCodeParams {
  application_id?: number;
  batch_no?: string;
  is_used?: boolean;
  page?: number;
  size?: number;
}

export interface AppRedeemCodeResult {
  id: number;
  code: string;
  application_id: number;
  batch_no?: string;
  duration_days: number;
  max_devices: number;
  is_used: boolean;
  used_by?: string;
  used_time?: string;
  expire_time?: string;
  remark?: string;
  created_time: string;
}

export interface CharTypeOptions {
  uppercase?: boolean;
  lowercase?: boolean;
  digits?: boolean;
  special?: boolean;
}

export interface CardKeyGenerationRequest {
  char_types?: CharTypeOptions;
  key_length?: number;
  prefix?: string;
  suffix?: string;
  group_length?: number;
  separator?: string;
  count: number;
}

export interface BatchCreateRedeemCodeParams {
  application_id: number;
  batch_no: string;
  duration_days: number;
  max_devices?: number;
  remark?: string;
  generation_params: CardKeyGenerationRequest;
}

// ==================== 版本管理 ====================
export interface AppVersionParams {
  application_id?: number;
  status?: number;
  page?: number;
  size?: number;
}

export interface AppVersionResult {
  id: number;
  application_id: number;
  version_name: string;
  version_code: string;
  description?: string;
  download_url?: string;
  file_size?: string;
  file_hash?: string;
  is_force_update: boolean;
  is_latest: boolean;
  status: number;
  created_time: string;
  updated_time?: string;
}

export interface CreateAppVersionParams {
  application_id: number;
  version_name: string;
  version_code: string;
  description?: string;
  download_url?: string;
  file_size?: string;
  file_hash?: string;
  is_force_update?: boolean;
}

export interface UpdateAppVersionParams {
  version_name?: string;
  description?: string;
  download_url?: string;
  file_size?: string;
  file_hash?: string;
  is_force_update?: boolean;
  is_latest?: boolean;
  status?: number;
}

// ==================== 授权管理 ====================
export interface AppAuthorizationParams {
  application_id?: number;
  device_id?: number;
  status?: number;
  page?: number;
  size?: number;
}

export interface AppAuthorizationResult {
  id: number;
  application_id: number;
  device_id: number;
  auth_type: number;
  status: number;
  start_time: string;
  end_time?: string;
  remaining_days?: number;
  auth_source?: string;
  remark?: string;
  created_time: string;
  updated_time?: string;
}

export interface CreateAppAuthorizationParams {
  application_id: number;
  device_id: number;
  auth_type: number;
  start_time: string;
  end_time?: string;
  auth_source?: string;
  remark?: string;
}

export interface UpdateAppAuthorizationParams {
  status?: number;
  end_time?: string;
  remark?: string;
}

export interface CheckAuthorizationParams {
  app_key: string;
  device_id: string;
}

export interface AuthorizationCheckResult {
  is_authorized: boolean;
  status?: number;
  remaining_days?: number;
  end_time?: string;
  message: string;
}

export interface RedeemCodeParams {
  code: string;
  device_id: string;
  used_by?: string;
}

// 应用注册趋势数据
export interface ApplicationTrendData {
  application_name: string;
  total_registrations: number;
  active_devices: number;
  trend_data: Array<{
    count: number;
    date: string;
  }>;
  period: string;
}

// 设备授权历史数据
export interface DeviceAuthorizationHistory {
  device_info: {
    device_id: string;
    device_name?: string;
    device_type?: string;
    first_seen: string;
    id: number;
    ip_address?: string;
    last_seen?: string;
    os_info?: string;
    status: number;
  };
  authorizations: Array<{
    app_key: string;
    application_name: string;
    auth_source?: string;
    auth_type: number;
    auth_type_text: string;
    created_time: string;
    end_time: string;
    id: number;
    remaining_days?: number;
    remark?: string;
    start_time: string;
    status: number;
    status_text: string;
  }>;
  total_count: number;
}

// 统计数据接口
export interface AppAuthStatistics {
  applications: number;
  devices: number;
  authorizations: number;
  redeem_codes: number;
  active_authorizations: number;
  expired_authorizations: number;
  total_orders: number;
  total_packages: number;
}

// ==================== API 方法 ====================

// 应用管理 API
export async function getAppApplicationListApi(params: AppApplicationParams) {
  return requestClient.get<PaginationResponse<AppApplicationResult>>(
    '/api/v1/app-auth/applications',
    { params },
  );
}

export async function getAppApplicationApi(id: number) {
  return requestClient.get<AppApplicationResult>(
    `/api/v1/app-auth/applications/${id}`,
  );
}

export async function createAppApplicationApi(
  data: CreateAppApplicationParams,
) {
  return requestClient.post('/api/v1/app-auth/applications', data);
}

export async function updateAppApplicationApi(
  id: number,
  data: UpdateAppApplicationParams,
) {
  return requestClient.put(`/api/v1/app-auth/applications/${id}`, data);
}

export async function deleteAppApplicationApi(id: number) {
  return requestClient.delete(`/api/v1/app-auth/applications/${id}`);
}

export async function getAppApplicationOptionsApi() {
  return requestClient.get<{ id: number; name: string }[]>(
    '/api/v1/app-auth/applications/all/options',
  );
}

// 设备管理 API
export async function getAppDeviceListApi(params: AppDeviceParams) {
  return requestClient.get<PaginationResponse<AppDeviceResult>>(
    '/api/v1/app-auth/devices',
    { params },
  );
}

export async function getAppDeviceApi(id: number) {
  return requestClient.get<AppDeviceResult>(`/api/v1/app-auth/devices/${id}`);
}

export async function createAppDeviceApi(data: CreateAppDeviceParams) {
  return requestClient.post('/api/v1/app-auth/devices', data);
}

export async function updateAppDeviceApi(
  id: number,
  data: UpdateAppDeviceParams,
) {
  return requestClient.put(`/api/v1/app-auth/devices/${id}`, data);
}

export async function deleteAppDeviceApi(id: number) {
  return requestClient.delete(`/api/v1/app-auth/devices/${id}`);
}

// 套餐管理 API
export async function getAppPackageListApi(params: AppPackageParams) {
  return requestClient.get<PaginationResponse<AppPackageResult>>(
    '/api/v1/app-auth/packages',
    { params },
  );
}

export async function getAppPackageApi(id: number) {
  return requestClient.get<AppPackageResult>(`/api/v1/app-auth/packages/${id}`);
}

export async function createAppPackageApi(data: CreateAppPackageParams) {
  return requestClient.post('/api/v1/app-auth/packages', data);
}

export async function updateAppPackageApi(
  id: number,
  data: UpdateAppPackageParams,
) {
  return requestClient.put(`/api/v1/app-auth/packages/${id}`, data);
}

export async function deleteAppPackageApi(id: number) {
  return requestClient.delete(`/api/v1/app-auth/packages/${id}`);
}

// 订单管理 API
export async function getAppOrderListApi(params: AppOrderParams) {
  return requestClient.get<PaginationResponse<AppOrderResult>>(
    '/api/v1/app-auth/orders',
    { params },
  );
}

export async function getAppOrderApi(id: number) {
  return requestClient.get<AppOrderResult>(`/api/v1/app-auth/orders/${id}`);
}

export async function createAppOrderApi(data: CreateAppOrderParams) {
  return requestClient.post('/api/v1/app-auth/orders', data);
}

export async function updateAppOrderApi(
  id: number,
  data: UpdateAppOrderParams,
) {
  return requestClient.put(`/api/v1/app-auth/orders/${id}`, data);
}

export async function deleteAppOrderApi(id: number) {
  return requestClient.delete(`/api/v1/app-auth/orders/${id}`);
}

// 兑换码管理 API
export async function getAppRedeemCodeListApi(params: AppRedeemCodeParams) {
  return requestClient.get<PaginationResponse<AppRedeemCodeResult>>(
    '/api/v1/app-auth/redeem-codes',
    { params },
  );
}

export async function getAppRedeemCodeApi(id: number) {
  return requestClient.get<AppRedeemCodeResult>(
    `/api/v1/app-auth/redeem-codes/${id}`,
  );
}

export async function batchGenerateRedeemCodesApi(
  data: BatchCreateRedeemCodeParams,
) {
  return requestClient.post('/api/v1/app-auth/redeem-codes/batch', data);
}

export async function deleteAppRedeemCodeApi(id: number) {
  return requestClient.delete(`/api/v1/app-auth/redeem-codes/${id}`);
}

// 版本管理 API
export async function getAppVersionListApi(params: AppVersionParams) {
  return requestClient.get<PaginationResponse<AppVersionResult>>(
    '/api/v1/app-auth/versions',
    { params },
  );
}

export async function getAppVersionApi(id: number) {
  return requestClient.get<AppVersionResult>(`/api/v1/app-auth/versions/${id}`);
}

export async function createAppVersionApi(data: CreateAppVersionParams) {
  return requestClient.post('/api/v1/app-auth/versions', data);
}

export async function updateAppVersionApi(
  id: number,
  data: UpdateAppVersionParams,
) {
  return requestClient.put(`/api/v1/app-auth/versions/${id}`, data);
}

export async function deleteAppVersionApi(id: number) {
  return requestClient.delete(`/api/v1/app-auth/versions/${id}`);
}

// 授权管理 API
export async function getAppAuthorizationListApi(
  params: AppAuthorizationParams,
) {
  return requestClient.get<PaginationResponse<AppAuthorizationResult>>(
    '/api/v1/app-auth/authorizations',
    {
      params,
    },
  );
}

export async function getAppAuthorizationApi(id: number) {
  return requestClient.get<AppAuthorizationResult>(
    `/api/v1/app-auth/authorizations/${id}`,
  );
}

export async function createAppAuthorizationApi(
  data: CreateAppAuthorizationParams,
) {
  return requestClient.post<AppAuthorizationResult>(
    '/api/v1/app-auth/authorizations',
    data,
  );
}

export async function updateAppAuthorizationApi(
  id: number,
  data: UpdateAppAuthorizationParams,
) {
  return requestClient.put(`/api/v1/app-auth/authorizations/${id}`, data);
}

export async function deleteAppAuthorizationApi(id: number) {
  return requestClient.delete(`/api/v1/app-auth/authorizations/${id}`);
}

// 获取应用注册趋势
export async function getApplicationRegistrationTrendApi(
  applicationId: number,
  days: number = 30,
) {
  return requestClient.get<ApplicationTrendData>(
    `/api/v1/app-auth/authorizations/application/${applicationId}/trend`,
    {
      params: { days },
    },
  );
}

// 获取设备授权历史
export async function getDeviceAuthorizationHistoryApi(deviceId: number) {
  return requestClient.get<DeviceAuthorizationHistory>(
    `/api/v1/app-auth/authorizations/device/${deviceId}/history`,
  );
}

// 兑换码授权
export async function redeemCodeAuthorizationApi(data: RedeemCodeParams) {
  return requestClient.post('/api/v1/app-auth/authorizations/redeem', data);
}

// 检查授权状态
export async function checkAuthorizationApi(data: CheckAuthorizationParams) {
  return requestClient.post<AuthorizationCheckResult>(
    '/api/v1/app-auth/authorizations/check',
    data,
  );
}

// 手动授权设备
export interface ManualAuthorizeParams {
  application_id: number;
  device_id: string;
  duration_days: number;
  remark?: string;
}

export async function manualAuthorizeDeviceApi(data: ManualAuthorizeParams) {
  return requestClient.post('/api/v1/app-auth/authorizations/manual', data);
}

// 兑换码授权
export interface RedeemCodeAuthorizeParams {
  code: string;
  device_id: string;
}

export async function redeemCodeAuthorizeApi(data: RedeemCodeAuthorizeParams) {
  return requestClient.post('/api/v1/app-auth/authorizations/redeem', data);
}

// 修改授权时间
export interface UpdateAuthTimeParams {
  end_time?: string;
  remark?: string;
}

export async function updateAuthorizationTimeApi(
  id: number,
  data: UpdateAuthTimeParams,
) {
  return requestClient.put(`/api/v1/app-auth/authorizations/${id}/time`, data);
}

// 使授权失效
export async function disableAuthorizationApi(id: number) {
  return requestClient.put(`/api/v1/app-auth/authorizations/${id}/disable`);
}

// 统计数据 API
export async function getAppAuthStatisticsApi() {
  return requestClient.get<AppAuthStatistics>(
    '/api/v1/app-auth/statistics/overview',
  );
}

// ==================== API 方法别名 ====================
// 为了保持与组件中使用的方法名一致，添加别名

// 应用管理别名
export const getApplicationList = getAppApplicationListApi;
export const getApplicationOptions = getAppApplicationOptionsApi;
export const getApplication = getAppApplicationApi;
export const createApplication = createAppApplicationApi;
export const updateApplication = updateAppApplicationApi;
export const deleteApplication = deleteAppApplicationApi;

// 设备管理别名
export const getDeviceList = getAppDeviceListApi;
export const getDevice = getAppDeviceApi;
export const createDevice = createAppDeviceApi;
export const updateDevice = updateAppDeviceApi;
export const deleteDevice = deleteAppDeviceApi;

// 套餐管理别名
export const getPackageList = getAppPackageListApi;
export const getPackage = getAppPackageApi;
export const createPackage = createAppPackageApi;
export const updatePackage = updateAppPackageApi;
export const deletePackage = deleteAppPackageApi;

// 订单管理别名
export const getOrderList = getAppOrderListApi;
export const getOrder = getAppOrderApi;
export const createOrder = createAppOrderApi;
export const updateOrder = updateAppOrderApi;
export const deleteOrder = deleteAppOrderApi;

// 兑换码管理别名
export const getRedeemCodeList = getAppRedeemCodeListApi;
export const getRedeemCode = getAppRedeemCodeApi;
export const batchGenerateRedeemCodes = batchGenerateRedeemCodesApi;
export const deleteRedeemCode = deleteAppRedeemCodeApi;

// 版本管理别名
export const getVersionList = getAppVersionListApi;
export const getVersion = getAppVersionApi;
export const createVersion = createAppVersionApi;
export const updateVersion = updateAppVersionApi;
export const deleteVersion = deleteAppVersionApi;

// 授权管理别名
export const getAuthorizationList = getAppAuthorizationListApi;
export const getAuthorization = getAppAuthorizationApi;
export const createManualAuthorization = createAppAuthorizationApi;
export const createRedeemAuthorization = redeemCodeAuthorizationApi;
export const checkAuthorization = checkAuthorizationApi;
export const updateAuthorization = updateAppAuthorizationApi;
export const deleteAuthorization = deleteAppAuthorizationApi;
