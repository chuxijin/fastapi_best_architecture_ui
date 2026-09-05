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

// ==================== Membership Tier (会员档位) ====================

export interface MembershipTierResult {
  id: number;
  code: string;
  name: string;
  weight: number;
  is_paid: boolean;
  badge_color: null | string;
  description: null | string;
  display_order: number;
  metadata?: Record<string, unknown>;
  status: string;
  created_time: string;
  updated_time?: null | string;
}

export interface CreateMembershipTierParams {
  code: string;
  name: string;
  weight?: number;
  is_paid?: boolean;
  badge_color?: null | string;
  description?: null | string;
  display_order?: number;
  metadata?: Record<string, unknown>;
  status?: string;
}

export type UpdateMembershipTierParams = Partial<CreateMembershipTierParams> & {
  status?: string;
};

export interface MembershipTierQueryParams extends PaginationParams {
  keyword?: string;
  status?: string;
}

export function getMembershipTierListApi(params?: MembershipTierQueryParams) {
  return requestClient.get<PaginationResult<MembershipTierResult>>(
    '/api/v1/access/tiers',
    { params },
  );
}

export function createMembershipTierApi(data: CreateMembershipTierParams) {
  return requestClient.post('/api/v1/access/tiers', data);
}

export function updateMembershipTierApi(
  pk: number,
  data: UpdateMembershipTierParams,
) {
  return requestClient.put(`/api/v1/access/tiers/${pk}`, data);
}

export function deleteMembershipTierApi(pk: number) {
  return requestClient.delete(`/api/v1/access/tiers/${pk}`);
}

// ==================== Entitlement (权益) ====================

export interface AccessEntitlementResult {
  id: number;
  code: string;
  name: string;
  category: string;
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
  description: null | string;
  entitlement_codes?: string[];
  items?: AccessPackItemResult[];
  status: string;
  created_time: string;
}

export interface CreateAccessPackParams {
  code: string;
  name: string;
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

// ==================== Resource Rule (资源规则) ====================

export interface AccessRuleValidPeriod {
  valid_from?: null | string;
  valid_to?: null | string;
}

/** 授权模式: 布尔准入 / 计量配额 / 限免 */
export type AccessGrantMode = 'access' | 'free_pass' | 'metered';

/** 试看模式: 按序位 / 按比例 / 按摘录 / 按日计数 */
export type AccessTrialMode =
  | 'daily_count'
  | 'excerpt'
  | 'fraction'
  | 'ordinal';

/** 试看策略: 挂在资源规则上的降级放行策略, 不是权益凭证 */
export interface AccessTrialPolicy {
  mode: AccessTrialMode;
  /** ordinal / daily_count 的次数上限 */
  limit?: null | number;
  /** fraction 的放行比例 (0-1] */
  ratio?: null | number;
  /** excerpt 的可见字数 */
  chars?: null | number;
}

export interface AccessRuleResult {
  id: number;
  resource_type: string;
  resource_id: number;
  entitlement_code: string;
  grant_mode: AccessGrantMode;
  priority: number;
  trial_policy: AccessTrialPolicy | null;
  valid_period: AccessRuleValidPeriod | null;
  audience_filter: Record<string, unknown>;
  inherit_to_children: boolean;
  status: string;
  created_time: string;
  updated_time?: null | string;
}

export interface CreateAccessRuleParams {
  resource_type: string;
  resource_id: number;
  entitlement_code: string;
  grant_mode: AccessGrantMode;
  priority?: number;
  trial_policy?: AccessTrialPolicy | null;
  valid_period?: AccessRuleValidPeriod | null;
  audience_filter?: Record<string, unknown>;
  inherit_to_children?: boolean;
  metadata?: Record<string, unknown>;
}

export interface UpdateAccessRuleParams {
  grant_mode?: AccessGrantMode;
  priority?: number;
  trial_policy?: AccessTrialPolicy | null;
  valid_period?: AccessRuleValidPeriod | null;
  audience_filter?: null | Record<string, unknown>;
  inherit_to_children?: boolean;
  metadata?: null | Record<string, unknown>;
  status?: string;
}

export interface AccessRuleQueryParams extends PaginationParams {
  resource_type?: string;
  resource_id?: number;
  entitlement_code?: string;
  grant_mode?: AccessGrantMode;
  status?: string;
}

export interface BulkUpsertAccessRulesParams {
  resource_type: string;
  resource_ids: number[];
  entitlement_code: string;
  grant_mode: AccessGrantMode;
  priority?: number;
  trial_policy?: AccessTrialPolicy | null;
  valid_period?: AccessRuleValidPeriod | null;
}

export function getAccessRuleListApi(params?: AccessRuleQueryParams) {
  return requestClient.get<PaginationResult<AccessRuleResult>>(
    '/api/v1/access/rules',
    { params },
  );
}

export function getAccessRuleApi(pk: number) {
  return requestClient.get<AccessRuleResult>(`/api/v1/access/rules/${pk}`);
}

export function createAccessRuleApi(data: CreateAccessRuleParams) {
  return requestClient.post('/api/v1/access/rules', data);
}

export function updateAccessRuleApi(pk: number, data: UpdateAccessRuleParams) {
  return requestClient.put(`/api/v1/access/rules/${pk}`, data);
}

export function deleteAccessRuleApi(pk: number) {
  return requestClient.delete(`/api/v1/access/rules/${pk}`);
}

export function bulkUpsertAccessRulesApi(data: BulkUpsertAccessRulesParams) {
  return requestClient.post<{ created: number }>(
    '/api/v1/access/rules/bulk-upsert',
    data,
  );
}

// ==================== Subscription Template (订阅模板) ====================

export interface SubscriptionTemplateResult {
  id: number;
  code: string;
  name: string;
  tier_code?: null | string;
  tier_name?: null | string;
  tier_weight?: number;
  is_paid_membership?: boolean;
  tier_badge_color?: null | string;
  kind?: string;
  pack_code?: string;
  pack_codes?: string[];
  packs?: AccessPackResult[];
  domain_codes?: string[];
  duration_days: null | number;
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
  tier_code?: null | string;
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
  nickname: null | string;
  template_id: number;
  template_code: string;
  template_name: null | string;
  tier_code?: null | string;
  tier_name?: null | string;
  tier_weight?: number;
  is_paid_membership?: boolean;
  valid_from: string;
  valid_to: null | string;
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
    valid_to: null | string;
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
  outcome: string;
  reason: null | string;
  matched?: null | Record<string, unknown>;
}

export interface DecideDecision {
  allowed: boolean;
  decision: string;
  reason_code: string;
  matched_grant: null | string;
  consumed_ledger_id: null | number;
  explanation: DecideStep[];
}

export interface DecideRule {
  id: number;
  resource_type: string;
  resource_id: number;
  entitlement_code: string;
  grant_mode: AccessGrantMode;
  priority: number;
  trial_policy?: AccessTrialPolicy | null;
  inherit_to_children: boolean;
}

export interface DecideSnapshot {
  subscription_ids: number[];
  direct_grant_ids: number[];
  entitlement_codes: string[];
}

export interface DecideResult {
  decision: DecideDecision;
  rules: DecideRule[];
  snapshot: DecideSnapshot;
}

export interface DecideRequestParams {
  user_id: number;
  resource_type: string;
  resource_id: number | string;
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
  template_distribution: Record<string, number>;
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
    valid_to: null | string;
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
