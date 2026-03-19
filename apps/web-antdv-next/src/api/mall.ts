import { requestClient } from './request';

// ==================== 商品分类 ====================
export interface MallCategoryResult {
  id: number;
  name: string;
  parent_id?: number;
  level: number;
  sort_order: number;
  icon?: string;
  description?: string;
  is_active: boolean;
  created_time: string;
}

export interface CreateMallCategoryParams {
  name: string;
  parent_id?: number;
  level?: number;
  sort_order?: number;
  icon?: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateMallCategoryParams {
  name?: string;
  parent_id?: number;
  sort_order?: number;
  icon?: string;
  description?: string;
  is_active?: boolean;
}

export async function getMallCategoryListApi(params?: { parent_id?: number }) {
  return requestClient.get<MallCategoryResult[]>(
    '/api/v1/mall/product/category/list',
    { params },
  );
}

export async function getMallCategoryDetailApi(id: number) {
  return requestClient.get<MallCategoryResult>(
    `/api/v1/mall/product/category/${id}`,
  );
}

export async function createMallCategoryApi(data: CreateMallCategoryParams) {
  return requestClient.post('/api/v1/mall/product/category', data);
}

export async function updateMallCategoryApi(
  id: number,
  data: UpdateMallCategoryParams,
) {
  return requestClient.put(`/api/v1/mall/product/category/${id}`, data);
}

export async function deleteMallCategoryApi(id: number) {
  return requestClient.delete(`/api/v1/mall/product/category/${id}`);
}

// ==================== 商品管理 ====================
export type MallProductType = 'physical' | 'virtual';
export type MallProductStatus = 'deleted' | 'draft' | 'off_sale' | 'on_sale';

export interface MallProductResult {
  id: number;
  category_id: number;
  name: string;
  subtitle?: string;
  product_type: MallProductType;
  cover_image?: string;
  status: MallProductStatus;
  sort_order: number;
  sales_count: number;
  virtual_sales: number;
  view_count: number;
  created_time: string;
}

export interface MallProductDetail extends MallProductResult {
  images?: string[];
  detail?: string;
  on_sale_time?: string;
  off_sale_time?: string;
}

export interface CreateMallProductParams {
  category_id: number;
  name: string;
  subtitle?: string;
  product_type?: MallProductType;
  cover_image?: string;
  images?: string[];
  detail?: string;
  sort_order?: number;
  virtual_sales?: number;
}

export interface UpdateMallProductParams {
  category_id?: number;
  name?: string;
  subtitle?: string;
  product_type?: MallProductType;
  cover_image?: string;
  images?: string[];
  detail?: string;
  status?: MallProductStatus;
  sort_order?: number;
  virtual_sales?: number;
}

export async function getMallProductListApi(params?: { category_id?: number }) {
  return requestClient.get<MallProductResult[]>('/api/v1/mall/product/list', {
    params,
  });
}

export async function getMallProductDetailApi(id: number) {
  return requestClient.get<MallProductDetail>(`/api/v1/mall/product/${id}`);
}

export async function createMallProductApi(data: CreateMallProductParams) {
  return requestClient.post('/api/v1/mall/product', data);
}

export async function updateMallProductApi(
  id: number,
  data: UpdateMallProductParams,
) {
  return requestClient.put(`/api/v1/mall/product/${id}`, data);
}

export async function deleteMallProductApi(id: number) {
  return requestClient.delete(`/api/v1/mall/product/${id}`);
}

// ==================== 商品 SKU ====================
export interface MallSKUResult {
  id: number;
  product_id: number;
  sku_name: string;
  sku_code?: string;
  specs?: Record<string, any>;
  price: number;
  original_price?: number;
  stock: number;
  sales_count: number;
  image?: string;
  is_active: boolean;
  created_time: string;
}

export interface CreateMallSKUParams {
  product_id: number;
  sku_name: string;
  sku_code?: string;
  specs?: Record<string, any>;
  price: number;
  original_price?: number;
  stock?: number;
  image?: string;
  is_active?: boolean;
}

export interface UpdateMallSKUParams {
  sku_name?: string;
  sku_code?: string;
  specs?: Record<string, any>;
  price?: number;
  original_price?: number;
  stock?: number;
  image?: string;
  is_active?: boolean;
}

export async function getMallSKUListApi(productId: number) {
  return requestClient.get<MallSKUResult[]>(
    `/api/v1/mall/product/${productId}/sku/list`,
  );
}

export async function getMallSKUDetailApi(skuId: number) {
  return requestClient.get<MallSKUResult>(`/api/v1/mall/product/sku/${skuId}`);
}

export async function createMallSKUApi(data: CreateMallSKUParams) {
  return requestClient.post('/api/v1/mall/product/sku', data);
}

export async function updateMallSKUApi(
  skuId: number,
  data: UpdateMallSKUParams,
) {
  return requestClient.put(`/api/v1/mall/product/sku/${skuId}`, data);
}

export async function deleteMallSKUApi(skuId: number) {
  return requestClient.delete(`/api/v1/mall/product/sku/${skuId}`);
}

// ==================== 拼团活动 ====================
export type MallActivityStatus = 'active' | 'draft' | 'ended' | 'paused';

export interface MallLadderPriceResult {
  id: number;
  activity_id: number;
  people_count: number;
  price: number;
  original_price?: number;
}

export interface MallActivityResult {
  id: number;
  product_id: number;
  sku_id: number;
  activity_name: string;
  min_people: number;
  max_people: number;
  time_limit: number;
  stock: number;
  sales_count: number;
  status: MallActivityStatus;
  start_time: string;
  end_time: string;
  enable_mock_team: boolean;
  created_time: string;
}

export interface MallActivityDetail extends MallActivityResult {
  mock_team_threshold?: number;
  share_config?: Record<string, any>;
  rules?: string;
  ladder_prices: MallLadderPriceResult[];
}

export interface CreateMallLadderPriceParams {
  people_count: number;
  price: number;
  original_price?: number;
}

export interface CreateMallActivityParams {
  product_id: number;
  sku_id: number;
  activity_name: string;
  min_people: number;
  max_people: number;
  time_limit: number;
  stock?: number;
  start_time: string;
  end_time: string;
  enable_mock_team?: boolean;
  mock_team_threshold?: number;
  share_config?: Record<string, any>;
  rules?: string;
  ladder_prices: CreateMallLadderPriceParams[];
}

export interface UpdateMallActivityParams {
  activity_name?: string;
  time_limit?: number;
  stock?: number;
  status?: MallActivityStatus;
  start_time?: string;
  end_time?: string;
  enable_mock_team?: boolean;
  mock_team_threshold?: number;
  share_config?: Record<string, any>;
  rules?: string;
}

export async function getMallActivityListApi(params?: { product_id?: number }) {
  return requestClient.get<MallActivityResult[]>(
    '/api/v1/mall/group-buy/activity/list',
    { params },
  );
}

export async function getMallActivityDetailApi(id: number) {
  return requestClient.get<MallActivityDetail>(
    `/api/v1/mall/group-buy/activity/${id}`,
  );
}

export async function createMallActivityApi(data: CreateMallActivityParams) {
  return requestClient.post('/api/v1/mall/group-buy/activity', data);
}

export async function updateMallActivityApi(
  id: number,
  data: UpdateMallActivityParams,
) {
  return requestClient.put(`/api/v1/mall/group-buy/activity/${id}`, data);
}

export async function deleteMallActivityApi(id: number) {
  return requestClient.delete(`/api/v1/mall/group-buy/activity/${id}`);
}

// 阶梯价格
export async function getMallLadderPriceListApi(activityId: number) {
  return requestClient.get<MallLadderPriceResult[]>(
    `/api/v1/mall/group-buy/activity/${activityId}/ladder-price/list`,
  );
}

export async function addMallLadderPriceApi(
  activityId: number,
  data: CreateMallLadderPriceParams,
) {
  return requestClient.post(
    `/api/v1/mall/group-buy/activity/${activityId}/ladder-price`,
    data,
  );
}

export async function deleteMallLadderPriceApi(priceId: number) {
  return requestClient.delete(`/api/v1/mall/group-buy/ladder-price/${priceId}`);
}

// ==================== 拼团团队 ====================
export type MallTeamStatus = 'cancelled' | 'failed' | 'pending' | 'success';

export interface MallTeamResult {
  id: number;
  activity_id: number;
  leader_user_id: number;
  required_people: number;
  current_people: number;
  team_price: number;
  status: MallTeamStatus;
  start_time: string;
  expire_time: string;
  success_time?: string;
  is_mock: boolean;
  share_code?: string;
  created_time: string;
}

export interface MallTeamMemberResult {
  id: number;
  team_id: number;
  user_id: number;
  order_id?: number;
  is_leader: boolean;
  paid_amount: number;
  join_time: string;
  inviter_user_id?: number;
}

export interface MallTeamDetail extends MallTeamResult {
  members: MallTeamMemberResult[];
}

export async function getMallTeamListApi(params: {
  activity_id: number;
  status?: string;
}) {
  return requestClient.get<MallTeamResult[]>('/api/v1/mall/team/list', {
    params,
  });
}

export async function getMallTeamDetailApi(id: number) {
  return requestClient.get<MallTeamDetail>(`/api/v1/mall/team/${id}`);
}

export async function cancelMallTeamApi(id: number) {
  return requestClient.delete(`/api/v1/mall/team/${id}`);
}

// ==================== 订单管理 ====================
export type MallOrderStatus =
  | 'cancelled'
  | 'completed'
  | 'paid'
  | 'pending'
  | 'refunded';
export type MallOrderType = 'group_buy' | 'normal';

export interface MallOrderResult {
  id: number;
  order_no: string;
  user_id: number;
  order_type: MallOrderType;
  product_id: number;
  sku_id: number;
  product_name: string;
  sku_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  paid_amount: number;
  status: MallOrderStatus;
  team_id?: number;
  activity_id?: number;
  created_time: string;
}

export interface MallOrderDetail extends MallOrderResult {
  remark?: string;
  extra_data?: Record<string, any>;
  paid_time?: string;
  cancelled_time?: string;
  refunded_time?: string;
  completed_time?: string;
  updated_time?: string;
}

export async function getMallOrderListApi(params?: { status?: string }) {
  return requestClient.get<MallOrderResult[]>('/api/v1/mall/order/my', {
    params,
  });
}

export async function getMallOrderDetailApi(id: number) {
  return requestClient.get<MallOrderDetail>(`/api/v1/mall/order/${id}`);
}
