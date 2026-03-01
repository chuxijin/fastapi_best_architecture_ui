import type { RequestClient } from '@vben/request';

import { requestClient } from '#/api/request';

export interface WebhookEvent {
  id: number;
  event_type: string;
  source: string;
  webhook_url?: string;
  headers?: Record<string, any>;
  payload: string;
  status: number;
  error_message?: string;
  processed_at?: string;
  retry_count: number;
  created_time: string;
  updated_time?: string;
}

export interface WebhookReceiveParam {
  event_type?: string;
  data: Record<string, any> | string;
}

export interface HeaderValidationRule {
  header_name: string;
  header_value: string;
  is_required: boolean;
  validation_type: 'contains' | 'exact' | 'regex';
}

export interface WebhookListParam {
  event_type?: string;
  source?: string;
  status?: number;
  start_time?: string;
  end_time?: string;
}

export interface WebhookConfig {
  id: number;
  name: string;
  endpoint_url: string;
  secret_key?: string;
  required_headers?: Record<string, any>;
  allowed_event_types?: string[];
  is_active: boolean;
  created_time: string;
  updated_time?: string;
}

export interface WebhookConfigListParam {
  name?: string;
  endpoint_url?: string;
  is_active?: boolean;
}

export interface CreateWebhookConfigParam {
  name: string;
  endpoint_url: string;
  secret_key?: string;
  required_headers?: Record<string, any>;
  allowed_event_types?: string[];
  is_active?: boolean;
}

export interface UpdateWebhookConfigParam {
  name?: string;
  endpoint_url?: string;
  secret_key?: string;
  required_headers?: Record<string, any>;
  allowed_event_types?: string[];
  is_active?: boolean;
}

export class WebhookApi {
  constructor(private request: RequestClient) {}

  /**
   * 创建WebhookConfig
   */
  async createWebhookConfig(data: CreateWebhookConfigParam) {
    return this.request.post('/api/v1/sys/webhook-configs', data);
  }

  /**
   * 批量删除WebhookConfig
   */
  async deleteWebhookConfigs(pks: number[]) {
    return this.request.delete('/api/v1/sys/webhook-configs', {
      data: { pks },
    });
  }

  /**
   * 批量删除Webhook事件
   */
  async deleteWebhooks(pks: number[]) {
    return this.request.delete('/api/v1/sys/webhooks', { data: { pks } });
  }

  /**
   * 获取所有启用的WebhookConfig
   */
  async getActiveWebhookConfigs() {
    return this.request.get<WebhookConfig[]>(
      '/api/v1/sys/webhook-configs/active',
    );
  }

  /**
   * 获取待处理的Webhook事件
   */
  async getPendingWebhooks(limit = 100) {
    return this.request.get<WebhookEvent[]>('/api/v1/sys/webhooks/pending', {
      params: { limit },
    });
  }

  /**
   * 获取WebhookConfig详情
   */
  async getWebhookConfigDetail(id: number) {
    return this.request.get<WebhookConfig>(`/api/v1/sys/webhook-configs/${id}`);
  }

  /**
   * 获取WebhookConfig列表
   */
  async getWebhookConfigList(
    params?: WebhookConfigListParam & { page?: number; size?: number },
  ) {
    return this.request.get<{
      items: WebhookConfig[];
      page: number;
      size: number;
      total: number;
    }>('/api/v1/sys/webhook-configs', { params });
  }

  /**
   * 获取Webhook事件详情
   */
  async getWebhookDetail(id: number) {
    return this.request.get<WebhookEvent>(`/api/v1/sys/webhooks/${id}`);
  }

  /**
   * 获取Webhook事件列表
   */
  async getWebhookList(
    params?: WebhookListParam & { page?: number; size?: number },
  ) {
    return this.request.get<{
      items: WebhookEvent[];
      page: number;
      size: number;
      total: number;
    }>('/api/v1/sys/webhooks', { params });
  }

  /**
   * 重试失败的Webhook事件
   */
  async retryFailedWebhooks() {
    return this.request.post<{
      message: string;
      retry_count: number;
    }>('/api/v1/sys/webhooks/retry');
  }

  /**
   * 发送测试Webhook事件
   */
  async sendTestWebhook(data: WebhookReceiveParam) {
    return this.request.post<{
      event_type: string;
      message: string;
      source: string;
      status: string;
      webhook_id: number;
    }>('/api/v1/sys/webhooks/receive', data);
  }

  /**
   * 发送带验证的测试Webhook事件
   */
  async sendValidatedTestWebhook(
    data: WebhookReceiveParam,
    validationRules?: HeaderValidationRule[],
    secretKey?: string,
  ) {
    return this.request.post<{
      event_type: string;
      message: string;
      source: string;
      status: string;
      webhook_id: number;
    }>('/api/v1/sys/webhooks/receive/validated', data, {
      params: { secret_key: secretKey },
      headers: validationRules?.reduce(
        (acc, rule) => {
          acc[rule.header_name] = rule.header_value;
          return acc;
        },
        {} as Record<string, string>,
      ),
    });
  }

  /**
   * 更新Webhook事件
   */
  async updateWebhook(id: number, data: Partial<WebhookEvent>) {
    return this.request.put(`/api/v1/sys/webhooks/${id}`, data);
  }

  /**
   * 更新WebhookConfig
   */
  async updateWebhookConfig(id: number, data: UpdateWebhookConfigParam) {
    return this.request.put(`/api/v1/sys/webhook-configs/${id}`, data);
  }

  /**
   * 更新WebhookConfig状态
   */
  async updateWebhookConfigStatus(id: number, is_active: boolean) {
    return this.request.put(
      `/api/v1/sys/webhook-configs/${id}/status?is_active=${is_active}`,
      {},
    );
  }
}

// 创建API实例
const webhookApi = new WebhookApi(requestClient);

// 导出API函数
export const getWebhookListApi = webhookApi.getWebhookList.bind(webhookApi);
export const getWebhookDetailApi = webhookApi.getWebhookDetail.bind(webhookApi);
export const updateWebhookApi = webhookApi.updateWebhook.bind(webhookApi);
export const deleteWebhookApi = webhookApi.deleteWebhooks.bind(webhookApi);
export const retryFailedWebhooksApi =
  webhookApi.retryFailedWebhooks.bind(webhookApi);
export const getPendingWebhooksApi =
  webhookApi.getPendingWebhooks.bind(webhookApi);
export const sendTestWebhookApi = webhookApi.sendTestWebhook.bind(webhookApi);
export const sendValidatedTestWebhookApi =
  webhookApi.sendValidatedTestWebhook.bind(webhookApi);

// 导出WebhookConfig API函数
export const getWebhookConfigListApi =
  webhookApi.getWebhookConfigList.bind(webhookApi);
export const getWebhookConfigDetailApi =
  webhookApi.getWebhookConfigDetail.bind(webhookApi);
export const createWebhookConfigApi =
  webhookApi.createWebhookConfig.bind(webhookApi);
export const updateWebhookConfigApi =
  webhookApi.updateWebhookConfig.bind(webhookApi);
export const deleteWebhookConfigsApi =
  webhookApi.deleteWebhookConfigs.bind(webhookApi);
export const updateWebhookConfigStatusApi =
  webhookApi.updateWebhookConfigStatus.bind(webhookApi);
export const getActiveWebhookConfigsApi =
  webhookApi.getActiveWebhookConfigs.bind(webhookApi);
