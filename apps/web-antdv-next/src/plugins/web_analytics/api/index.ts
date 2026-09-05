import { requestClient } from '#/api/request';

export interface AnalyticsSite {
  id: number;
  site_key: string;
  name: string;
  domains: string[];
  timezone: string;
  is_active: boolean;
  is_public: boolean;
  heatmap_enabled: boolean;
  replay_enabled: boolean;
  replay_sample_rate: number;
  event_retention_days: number;
  replay_retention_days: number;
  created_time: string;
  updated_time?: string;
}

export interface SiteInput {
  name: string;
  domains: string[];
  timezone: string;
  is_active?: boolean;
  is_public: boolean;
  heatmap_enabled: boolean;
  replay_enabled: boolean;
  replay_sample_rate: number;
  event_retention_days: number;
  replay_retention_days: number;
}

export interface AnalyticsOverview {
  pv: number;
  uv: number;
  ip: number;
  sessions: number;
  events: number;
  bounces: number;
  bounce_rate: number;
  duration_seconds: number;
  average_duration_seconds: number;
  active_visitors: number;
}

export interface DailyTrend {
  date: string;
  pv: number;
  uv: number;
  sessions: number;
  events: number;
  bounces: number;
  duration_seconds: number;
}

export interface DimensionItem {
  name: string;
  value: number;
}

export interface HeatmapPoint {
  x_ratio: number;
  y_ratio: number;
  count: number;
}

export interface ReplayItem {
  replay_key: string;
  session_key: string;
  path: string;
  started_at: string;
  last_event_at: string;
  chunk_count: number;
  total_bytes: number;
}

export interface ReplayChunk {
  sequence: number;
  encoding: string;
  events: Record<string, unknown>[];
  occurred_at: string;
}

const prefix = '/api/v1/analytics';

export const listSitesApi = () =>
  requestClient.get<AnalyticsSite[]>(`${prefix}/sites`);

export const createSiteApi = (data: SiteInput) =>
  requestClient.post<AnalyticsSite>(`${prefix}/sites`, data);

export const updateSiteApi = (id: number, data: Partial<SiteInput>) =>
  requestClient.put<AnalyticsSite>(`${prefix}/sites/${id}`, data);

export const getOverviewApi = (
  siteId: number,
  params?: { end?: string; start?: string },
) =>
  requestClient.get<AnalyticsOverview>(`${prefix}/sites/${siteId}/overview`, {
    params,
  });

export const getTrendApi = (
  siteId: number,
  params?: { end_date?: string; start_date?: string },
) =>
  requestClient.get<DailyTrend[]>(`${prefix}/sites/${siteId}/trend`, {
    params,
  });

export const getDimensionsApi = (
  siteId: number,
  params: {
    dimension: string;
    end?: string;
    limit?: number;
    start?: string;
  },
) =>
  requestClient.get<DimensionItem[]>(`${prefix}/sites/${siteId}/dimensions`, {
    params,
  });

export const getHeatmapApi = (
  siteId: number,
  params: { end?: string; path: string; start?: string },
) =>
  requestClient.get<HeatmapPoint[]>(`${prefix}/sites/${siteId}/heatmap`, {
    params,
  });

export const getReplaysApi = (siteId: number, limit = 20) =>
  requestClient.get<ReplayItem[]>(`${prefix}/sites/${siteId}/replays`, {
    params: { limit },
  });

export const getReplayChunksApi = (siteId: number, replayKey: string) =>
  requestClient.get<ReplayChunk[]>(
    `${prefix}/sites/${siteId}/replays/${replayKey}`,
  );

export const runMaintenanceApi = () =>
  requestClient.post<{ aggregated: number; events: number; replays: number }>(
    `${prefix}/sites/maintenance/run`,
  );
