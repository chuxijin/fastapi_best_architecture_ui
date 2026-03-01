import type { RequestClient } from '@vben/request';

import { requestClient } from '#/api/request';

export interface McpConfigItem {
  id: number;
  mcp: string;
  field: string;
  value: Record<string, any>;
  created_time?: string;
  updated_time?: string;
}

export interface UpsertMcpConfigParam {
  mcp: string;
  field: string;
  value: Record<string, any>;
}

export class McpServiceApi {
  private base = '/api/v1/mcp/config';

  constructor(private request: RequestClient) {}

  async deleteConfig(id: number): Promise<void> {
    await this.request.delete(`${this.base}/${id}`);
  }

  async getConfigDetail(id: number): Promise<McpConfigItem | null> {
    const res = await this.request.get<any>(`${this.base}/${id}`);
    return (res?.data ?? res ?? null) as McpConfigItem | null;
  }

  async getConfigList(): Promise<McpConfigItem[]> {
    const res = await this.request.get<any>(`${this.base}/`);
    const data = (res?.data ?? res) as any;
    if (Array.isArray(data)) return data as McpConfigItem[];
    if (Array.isArray(data?.items)) return data.items as McpConfigItem[];
    return [];
  }

  async getConfigPaged(params?: { page?: number; size?: number }) {
    const list = await this.getConfigList();
    const page = params?.page ?? 1;
    const size = params?.size ?? 10;
    const start = (page - 1) * size;
    const items = list.slice(start, start + size);
    return { items, page, size, total: list.length };
  }

  async upsertConfig(data: UpsertMcpConfigParam): Promise<McpConfigItem> {
    const res = await this.request.post<any>(`${this.base}/`, data);
    return (res?.data ?? res) as McpConfigItem;
  }
}

const mcpServiceApi = new McpServiceApi(requestClient);

export const getMcpConfigPagedApi =
  mcpServiceApi.getConfigPaged.bind(mcpServiceApi);
export const getMcpConfigDetailApi =
  mcpServiceApi.getConfigDetail.bind(mcpServiceApi);
export const upsertMcpConfigApi =
  mcpServiceApi.upsertConfig.bind(mcpServiceApi);
export const deleteMcpConfigApi =
  mcpServiceApi.deleteConfig.bind(mcpServiceApi);

// 已在顶部导出类型定义，这里不再重复导出
