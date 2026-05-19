import { requestClient } from '#/api/request';

// ==================== 通用类型 ====================

export interface PaginationParams {
  page?: number;
  size?: number;
}

export interface PaginationResult<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

// ==================== Domain (领域) ====================

export interface AccessDomainResult {
  id: number;
  code: string;
  name: string;
  short_name: null | string;
  parent_id: null | number;
  icon: null | string;
  color: null | string;
  description: null | string;
  display_order: number;
  status: string;
  created_time: string;
  updated_time?: null | string;
}

export interface CreateAccessDomainParams {
  code: string;
  name: string;
  short_name?: null | string;
  parent_id?: null | number;
  icon?: null | string;
  color?: null | string;
  description?: null | string;
  display_order?: number;
}

export type UpdateAccessDomainParams = Partial<CreateAccessDomainParams> & {
  status?: string;
};

export interface AccessDomainQueryParams extends PaginationParams {
  keyword?: string;
}

export function getAccessDomainListApi(params?: AccessDomainQueryParams) {
  return requestClient.get<PaginationResult<AccessDomainResult>>(
    '/api/v1/access/domains',
    { params },
  );
}

export function createAccessDomainApi(data: CreateAccessDomainParams) {
  return requestClient.post<AccessDomainResult>('/api/v1/access/domains', data);
}

export function updateAccessDomainApi(
  pk: number,
  data: UpdateAccessDomainParams,
) {
  return requestClient.put<AccessDomainResult>(
    `/api/v1/access/domains/${pk}`,
    data,
  );
}

export function deleteAccessDomainApi(pk: number) {
  return requestClient.delete(`/api/v1/access/domains/${pk}`);
}

// ==================== Entitlement (权益) ====================

export interface AccessEntitlementResult {
  id: number;
  code: string;
  name: string;
  category: string;
  metric: string;
  verb: string;
  domain_id: null | number;
  resource_type: null | string;
  description: null | string;
  status: string;
  created_time: string;
}

export interface CreateAccessEntitlementParams {
  code: string;
  name: string;
  category: string;
  description?: null | string;
}

export type UpdateAccessEntitlementParams =
  Partial<CreateAccessEntitlementParams> & {
    status?: string;
  };

export interface AccessEntitlementQueryParams extends PaginationParams {
  category?: string;
  status?: string;
  keyword?: string;
}

export function getAccessEntitlementListApi(
  params?: AccessEntitlementQueryParams,
) {
  return requestClient.get<PaginationResult<AccessEntitlementResult>>(
    '/api/v1/access/entitlements',
    { params },
  );
}

export function createAccessEntitlementApi(
  data: CreateAccessEntitlementParams,
) {
  return requestClient.post<AccessEntitlementResult>(
    '/api/v1/access/entitlements',
    data,
  );
}

export function updateAccessEntitlementApi(
  pk: number,
  data: UpdateAccessEntitlementParams,
) {
  return requestClient.put<AccessEntitlementResult>(
    `/api/v1/access/entitlements/${pk}`,
    data,
  );
}

export function deleteAccessEntitlementApi(pk: number) {
  return requestClient.delete(`/api/v1/access/entitlements/${pk}`);
}

// ==================== Pack (权益包) ====================

export interface AccessPackResult {
  id: number;
  code: string;
  name: string;
  grade: string;
  description: null | string;
  entitlement_codes?: string[];
  items?: AccessPackItemResult[];
  status: string;
  created_time: string;
}

export interface CreateAccessPackParams {
  code: string;
  name: string;
  grade: string;
  description?: null | string;
}

export type UpdateAccessPackParams = Partial<CreateAccessPackParams> & {
  status?: string;
};

export interface AccessPackItemResult {
  id: number;
  pack_id: number;
  entitlement_id: number;
  entitlement_code: string;
  entitlement_name: string;
  value_int: null | number;
  value_meta: Record<string, unknown>;
  status: string;
}

export interface SetAccessPackItemParams {
  entitlement_code: string;
  value_int?: null | number;
  value_meta?: Record<string, unknown>;
}

export interface SetAccessPackItemsParams {
  items: SetAccessPackItemParams[];
}

export interface AccessPackQueryParams extends PaginationParams {
  grade?: string;
  status?: string;
  keyword?: string;
}

export function getAccessPackListApi(params?: AccessPackQueryParams) {
  return requestClient.get<PaginationResult<AccessPackResult>>(
    '/api/v1/access/packs',
    { params },
  );
}

export function getAccessPackApi(pk: number) {
  return requestClient.get<AccessPackResult>(`/api/v1/access/packs/${pk}`);
}

export function createAccessPackApi(data: CreateAccessPackParams) {
  return requestClient.post<AccessPackResult>('/api/v1/access/packs', data);
}

export function updateAccessPackApi(pk: number, data: UpdateAccessPackParams) {
  return requestClient.put<AccessPackResult>(
    `/api/v1/access/packs/${pk}`,
    data,
  );
}

export function deleteAccessPackApi(pk: number) {
  return requestClient.delete(`/api/v1/access/packs/${pk}`);
}

export function setAccessPackItemsApi(
  pk: number,
  data: SetAccessPackItemsParams,
) {
  return requestClient.put(`/api/v1/access/packs/${pk}/items`, data);
}

// ==================== Subscription Template (订阅模板) ====================

export interface SubscriptionTemplateResult {
  id: number;
  code: string;
  name: string;
  kind?: string;
  pack_code?: string;
  pack_codes?: string[];
  packs?: AccessPackResult[];
  domain_codes?: string[];
  duration_days: number;
  auto_renewable?: boolean;
  price?: number;
  original_price?: number;
  price_cents?: number;
  display_order?: number;
  cover_image?: null | string;
  description: null | string;
  sale_period?: null | {
    valid_from: string;
    valid_to: null | string;
  };
  status: string;
  created_time: string;
}

export interface CreateSubscriptionTemplateParams {
  code: string;
  name: string;
  kind?: string;
  pack_codes: string[];
  domain_codes?: string[];
  duration_days?: null | number;
  auto_renewable?: boolean;
  price_cents?: number;
  display_order?: number;
  cover_image?: null | string;
  description?: null | string;
}

export type UpdateSubscriptionTemplateParams =
  Partial<CreateSubscriptionTemplateParams> & { status?: string };

export interface SubscriptionTemplateQueryParams extends PaginationParams {
  pack_code?: string;
  domain_code?: string;
  status?: string;
  keyword?: string;
}

export function getSubscriptionTemplateListApi(
  params?: SubscriptionTemplateQueryParams,
) {
  return requestClient.get<PaginationResult<SubscriptionTemplateResult>>(
    '/api/v1/access/templates',
    { params },
  );
}

export function getSubscriptionTemplateDetailApi(pk: number) {
  return requestClient.get<SubscriptionTemplateResult>(
    `/api/v1/access/templates/${pk}`,
  );
}

export function createSubscriptionTemplateApi(
  data: CreateSubscriptionTemplateParams,
) {
  return requestClient.post<SubscriptionTemplateResult>(
    '/api/v1/access/templates',
    data,
  );
}

export function updateSubscriptionTemplateApi(
  pk: number,
  data: UpdateSubscriptionTemplateParams,
) {
  return requestClient.put<SubscriptionTemplateResult>(
    `/api/v1/access/templates/${pk}`,
    data,
  );
}

export function deleteSubscriptionTemplateApi(pk: number) {
  return requestClient.delete(`/api/v1/access/templates/${pk}`);
}

export function setSubscriptionTemplatePacksApi(
  pk: number,
  data: { pack_codes: string[] },
) {
  return requestClient.put(`/api/v1/access/templates/${pk}/packs`, data);
}

// ==================== Redeem (兑换配置) ====================

export interface RedeemBatchResult {
  id: number;
  app_id: string;
  batch_no: string;
  name: string;
  reward_type: string;
  reward_data: Record<string, unknown>;
  template_code?: null | string;
  total_count: number;
  used_count: number;
  valid_from?: null | string;
  valid_to?: null | string;
  max_use_per_code: number;
  status: number;
  created_time: string;
  updated_time?: null | string;
}

export interface CreateRedeemBatchParams {
  app_id?: string;
  name: string;
  template_code: string;
  total_count?: number;
  valid_from?: null | string;
  valid_to?: null | string;
  max_use_per_code?: number;
}

export type UpdateRedeemBatchParams = Partial<CreateRedeemBatchParams> & {
  status?: number;
};

export interface RedeemBatchQueryParams extends PaginationParams {
  app_id?: string;
  batch_no?: string;
  status?: number;
}

export interface AgisoBatchRule {
  platform: string;
  keyword: string;
  batch_id: number;
}

export function getRedeemBatchListApi(params?: RedeemBatchQueryParams) {
  return requestClient.get<PaginationResult<RedeemBatchResult>>(
    '/api/v1/access/redeem/batches',
    { params },
  );
}

export function getRedeemBatchDetailApi(pk: number) {
  return requestClient.get<RedeemBatchResult>(
    `/api/v1/access/redeem/batches/${pk}`,
  );
}

export function createRedeemBatchApi(data: CreateRedeemBatchParams) {
  return requestClient.post<RedeemBatchResult>(
    '/api/v1/access/redeem/batches',
    data,
  );
}

export function updateRedeemBatchApi(
  pk: number,
  data: UpdateRedeemBatchParams,
) {
  return requestClient.put(`/api/v1/access/redeem/batches/${pk}`, data);
}

export function getAgisoBatchRulesApi() {
  return requestClient.get<AgisoBatchRule[]>(
    '/api/v1/access/redeem/agiso-rules',
  );
}

export function setAgisoBatchRulesApi(data: { rules: AgisoBatchRule[] }) {
  return requestClient.put<AgisoBatchRule[]>(
    '/api/v1/access/redeem/agiso-rules',
    data,
  );
}

// ==================== User Subscription (用户订阅) ====================

export interface UserSubscriptionResult {
  id: number;
  user_id: number;
  username: null | string;
  template_id: number;
  template_code: string;
  template_name: null | string;
  valid_from: string;
  valid_to: string;
  status: string;
  source: string;
  source_ref: null | string;
  created_time: string;
}

export interface UserSubscriptionQueryParams extends PaginationParams {
  user_id?: number;
  username?: string;
  template_code?: string;
  status?: string;
  source?: string;
}

export interface RevokeSubscriptionParams {
  reason: string;
}

export interface ExtendSubscriptionParams {
  days: number;
  reason?: string;
}
export interface CreateSubscriptionParams {
  user_id: number;
  template_code: string;
  valid_period: {
    valid_from: string;
    valid_to: string | null;
  };
  source: string;
  source_ref?: null | string;
}

export function createUserSubscriptionApi(data: CreateSubscriptionParams) {
  return requestClient.post('/api/v1/access/subscriptions', data);
}

export function getUserSubscriptionListApi(
  params?: UserSubscriptionQueryParams,
) {
  return requestClient.get<PaginationResult<UserSubscriptionResult>>(
    '/api/v1/access/subscriptions',
    { params },
  );
}

export function revokeSubscriptionApi(
  pk: number,
  data: RevokeSubscriptionParams,
) {
  return requestClient.post(`/api/v1/access/subscriptions/${pk}/revoke`, data);
}

export function extendSubscriptionApi(
  pk: number,
  data: ExtendSubscriptionParams,
) {
  return requestClient.post(`/api/v1/access/subscriptions/${pk}/extend`, data);
}

// ==================== Decide (决策调试) ====================

export interface DecideStep {
  evaluator: string;
  decision: string;
  reason: null | string;
}

export interface DecideResult {
  allow: boolean;
  reason: null | string;
  matched_rule: null | string;
  steps: DecideStep[];
}

export interface DecideRequestParams {
  user_id: number;
  resource_type: string;
  resource_id: string;
}

export function runAccessDecideApi(data: DecideRequestParams) {
  return requestClient.post<DecideResult>('/api/v1/access/decide/debug', data);
}

// ==================== Dashboard (总览统计) ====================

export interface AccessDashboardStats {
  active_subscription_count: number;
  expiring_in_7_days: number;
  expiring_in_30_days: number;
  pack_distribution: Record<string, number>;
  grade_distribution: Record<string, number>;
  domain_distribution: Record<string, number>;
}

export function getAccessDashboardStatsApi() {
  return requestClient.get<AccessDashboardStats>(
    '/api/v1/access/dashboard/stats',
  );
}

// ==================== Direct Grant (直接授予) ====================

export interface DirectGrantResult {
  id: number;
  user_id: number;
  username: null | string;
  entitlement_id: number;
  entitlement_code: string;
  entitlement_name: null | string;
  valid_from: string;
  valid_to: null | string;
  status: string;
  source: string;
  created_time: string;
}

export interface DirectGrantQueryParams extends PaginationParams {
  user_id?: number;
  entitlement_code?: string;
  source?: string;
  status?: string;
}

export interface CreateDirectGrantParams {
  user_id: number;
  entitlement_code: string;
  valid_period: {
    valid_from: string;
    valid_to: string | null;
  };
  source: string;
}

export function getDirectGrantListApi(params?: DirectGrantQueryParams) {
  return requestClient.get<PaginationResult<DirectGrantResult>>(
    '/api/v1/access/grants',
    { params },
  );
}

export function createDirectGrantApi(data: CreateDirectGrantParams) {
  return requestClient.post('/api/v1/access/grants', data);
}

export function deleteDirectGrantApi(pk: number) {
  return requestClient.delete(`/api/v1/access/grants/${pk}`);
}

