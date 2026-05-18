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
  cat_id: null | number;
  sort_order: number;
  status: string;
  created_time: string;
}

export interface CreateAccessDomainParams {
  code: string;
  name: string;
  cat_id?: null | number;
  sort_order?: number;
}

export type UpdateAccessDomainParams = Partial<CreateAccessDomainParams> & {
  status?: string;
};

export interface AccessDomainQueryParams extends PaginationParams {
  status?: string;
  name?: string;
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
  entitlement_codes: string[];
  status: string;
  created_time: string;
}

export interface CreateAccessPackParams {
  code: string;
  name: string;
  grade: string;
  description?: null | string;
  entitlement_codes: string[];
}

export type UpdateAccessPackParams = Partial<CreateAccessPackParams> & {
  status?: string;
};

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

// ==================== Subscription Template (订阅模板) ====================

export interface SubscriptionTemplateResult {
  id: number;
  code: string;
  name: string;
  pack_code: string;
  domain_codes: string[];
  duration_days: number;
  price: number;
  original_price: number;
  description: null | string;
  status: string;
  created_time: string;
}

export interface CreateSubscriptionTemplateParams {
  code: string;
  name: string;
  pack_code: string;
  domain_codes: string[];
  duration_days: number;
  price: number;
  original_price: number;
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
