import type { RequestClient } from '@vben/request';

import { requestClient } from '#/api/request';

// ==================== 类型定义 ====================

/** 出站端点 */
export interface WebhookEndpoint {
  id: number;
  uid: string;
  name: string;
  url: string;
  description?: string;
  event_types: string[];
  headers?: Record<string, any>;
  is_active: boolean;
  failure_count: number;
  max_retries: number;
  timeout_seconds: number;
  last_success_at?: string;
  last_failure_at?: string;
  created_time: string;
  updated_time?: string;
}

/** 投递记录 */
export interface WebhookDelivery {
  id: number;
  uid: string;
  endpoint_id: number;
  event_id: string;
  event_type: string;
  status: number;
  response_code?: number;
  response_body?: string;
  attempt_count: number;
  next_retry_at?: string;
  completed_at?: string;
  created_time: string;
  updated_time?: string;
}

/** 入站事件日志 */
export interface WebhookEventLog {
  id: number;
  uid: string;
  source: string;
  event_type: string;
  event_id?: string;
  payload: string;
  signature_valid: boolean;
  status: number;
  error_message?: string;
  processed_at?: string;
  source_ip?: string;
  created_time: string;
  updated_time?: string;
}

/** 事件类型注册 */
export interface WebhookEventType {
  id: number;
  type_key: string;
  category: string;
  description?: string;
  payload_schema?: Record<string, any>;
  is_active: boolean;
  created_time: string;
  updated_time?: string;
}

/** CloudEvents 信封 */
export interface CloudEvent {
  specversion: string;
  id: string;
  type: string;
  source: string;
  time?: string;
  datacontenttype: string;
  subject?: string;
  data?: Record<string, any>;
}

// ==================== 参数类型 ====================

export interface CreateEndpointParam {
  name: string;
  url: string;
  description?: string;
  event_types: string[];
  headers?: Record<string, any>;
  max_retries?: number;
  timeout_seconds?: number;
}

export interface UpdateEndpointParam {
  name?: string;
  url?: string;
  description?: string;
  event_types?: string[];
  headers?: Record<string, any>;
  is_active?: boolean;
  max_retries?: number;
  timeout_seconds?: number;
}

export interface CreateEventTypeParam {
  type_key: string;
  category: string;
  description?: string;
  payload_schema?: Record<string, any>;
  is_active?: boolean;
}

export interface UpdateEventTypeParam {
  category?: string;
  description?: string;
  payload_schema?: Record<string, any>;
  is_active?: boolean;
}

export interface PublishEventParam {
  type: string;
  source?: string;
  data?: Record<string, any>;
  subject?: string;
}

export interface EndpointListParam {
  name?: string;
  is_active?: boolean;
  event_type?: string;
}

export interface DeliveryListParam {
  endpoint_id?: number;
  event_type?: string;
  status?: number;
  start_time?: string;
  end_time?: string;
}

export interface EventLogListParam {
  source?: string;
  event_type?: string;
  status?: number;
  start_time?: string;
  end_time?: string;
}

export interface EventTypeListParam {
  category?: string;
  is_active?: boolean;
}

// ==================== 响应类型 ====================

export interface RotateSecretResult {
  uid: string;
  new_secret: string;
  message: string;
}

export interface TestEndpointResult {
  success: boolean;
  status_code?: number;
  response_body?: string;
  message: string;
}

export interface InboundReceiveResult {
  status: string;
  event_id?: string;
  event_type?: string;
  log_id?: number;
}

export interface PublishResult {
  deliveries_created: number;
  message: string;
}

// ==================== API 类 ====================

export class WebhookApi {
  constructor(private request: RequestClient) {}

  // ---------- 出站端点 ----------

  async createEndpoint(data: CreateEndpointParam) {
    return this.request.post<WebhookEndpoint>(
      '/api/v1/sys/webhook/endpoints',
      data,
    );
  }

  async getEndpointList(
    params?: EndpointListParam & { page?: number; size?: number },
  ) {
    return this.request.get<{
      items: WebhookEndpoint[];
      page: number;
      size: number;
      total: number;
    }>('/api/v1/sys/webhook/endpoints', { params });
  }

  async getEndpointDetail(id: number) {
    return this.request.get<WebhookEndpoint>(
      `/api/v1/sys/webhook/endpoints/${id}`,
    );
  }

  async updateEndpoint(id: number, data: UpdateEndpointParam) {
    return this.request.put(`/api/v1/sys/webhook/endpoints/${id}`, data);
  }

  async deleteEndpoints(pks: number[]) {
    return this.request.delete('/api/v1/sys/webhook/endpoints', {
      data: { pks },
    });
  }

  async rotateSecret(id: number) {
    return this.request.post<RotateSecretResult>(
      `/api/v1/sys/webhook/endpoints/${id}/rotate-secret`,
    );
  }

  async testEndpoint(id: number) {
    return this.request.post<TestEndpointResult>(
      `/api/v1/sys/webhook/endpoints/${id}/test`,
    );
  }

  // ---------- 投递记录 ----------

  async getDeliveryList(
    params?: DeliveryListParam & { page?: number; size?: number },
  ) {
    return this.request.get<{
      items: WebhookDelivery[];
      page: number;
      size: number;
      total: number;
    }>('/api/v1/sys/webhook/deliveries', { params });
  }

  async getDeliveryDetail(id: number) {
    return this.request.get<WebhookDelivery>(
      `/api/v1/sys/webhook/deliveries/${id}`,
    );
  }

  async retryDelivery(id: number) {
    return this.request.post(`/api/v1/sys/webhook/deliveries/${id}/retry`);
  }

  async processPending(batchSize = 50) {
    return this.request.post<{ processed: number; message: string }>(
      '/api/v1/sys/webhook/deliveries/process',
      null,
      { params: { batch_size: batchSize } },
    );
  }

  // ---------- 入站事件日志 ----------

  async getEventLogList(
    params?: EventLogListParam & { page?: number; size?: number },
  ) {
    return this.request.get<{
      items: WebhookEventLog[];
      page: number;
      size: number;
      total: number;
    }>('/api/v1/sys/webhook/event-logs', { params });
  }

  async getEventLogDetail(id: number) {
    return this.request.get<WebhookEventLog>(
      `/api/v1/sys/webhook/event-logs/${id}`,
    );
  }

  // ---------- 事件类型 ----------

  async createEventType(data: CreateEventTypeParam) {
    return this.request.post<WebhookEventType>(
      '/api/v1/sys/webhook/event-types',
      data,
    );
  }

  async getEventTypeList(
    params?: EventTypeListParam & { page?: number; size?: number },
  ) {
    return this.request.get<{
      items: WebhookEventType[];
      page: number;
      size: number;
      total: number;
    }>('/api/v1/sys/webhook/event-types', { params });
  }

  async getEventTypeDetail(id: number) {
    return this.request.get<WebhookEventType>(
      `/api/v1/sys/webhook/event-types/${id}`,
    );
  }

  async updateEventType(id: number, data: UpdateEventTypeParam) {
    return this.request.put(`/api/v1/sys/webhook/event-types/${id}`, data);
  }

  async deleteEventTypes(pks: number[]) {
    return this.request.delete('/api/v1/sys/webhook/event-types', {
      data: { pks },
    });
  }

  // ---------- 手动发布 ----------

  async publishEvent(data: PublishEventParam) {
    return this.request.post<PublishResult>(
      '/api/v1/sys/webhook/publish',
      data,
    );
  }
}

// 创建 API 实例
const webhookApi = new WebhookApi(requestClient);

// 导出端点 API
export const createEndpointApi = webhookApi.createEndpoint.bind(webhookApi);
export const getEndpointListApi = webhookApi.getEndpointList.bind(webhookApi);
export const getEndpointDetailApi =
  webhookApi.getEndpointDetail.bind(webhookApi);
export const updateEndpointApi = webhookApi.updateEndpoint.bind(webhookApi);
export const deleteEndpointsApi = webhookApi.deleteEndpoints.bind(webhookApi);
export const rotateSecretApi = webhookApi.rotateSecret.bind(webhookApi);
export const testEndpointApi = webhookApi.testEndpoint.bind(webhookApi);

// 导出投递 API
export const getDeliveryListApi = webhookApi.getDeliveryList.bind(webhookApi);
export const getDeliveryDetailApi =
  webhookApi.getDeliveryDetail.bind(webhookApi);
export const retryDeliveryApi = webhookApi.retryDelivery.bind(webhookApi);
export const processPendingApi = webhookApi.processPending.bind(webhookApi);

// 导出事件日志 API
export const getEventLogListApi = webhookApi.getEventLogList.bind(webhookApi);
export const getEventLogDetailApi =
  webhookApi.getEventLogDetail.bind(webhookApi);

// 导出事件类型 API
export const createEventTypeApi = webhookApi.createEventType.bind(webhookApi);
export const getEventTypeListApi = webhookApi.getEventTypeList.bind(webhookApi);
export const getEventTypeDetailApi =
  webhookApi.getEventTypeDetail.bind(webhookApi);
export const updateEventTypeApi = webhookApi.updateEventType.bind(webhookApi);
export const deleteEventTypesApi = webhookApi.deleteEventTypes.bind(webhookApi);

// 导出发布 API
export const publishEventApi = webhookApi.publishEvent.bind(webhookApi);
