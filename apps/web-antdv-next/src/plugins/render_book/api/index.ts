import { requestClient } from '#/api/request';
import type { PageData } from '#/api/job';

export type RenderVariant =
  | 'questions_only'
  | 'solutions_only'
  | 'combined_inline'
  | 'combined_appendix';
export type RenderContentMode = 'questions_only' | 'questions_with_answers';
export type RenderAnswerLayout = 'appendix' | 'inline';
export type RenderDeliveryMode = 'single_pdf' | 'split_pdf';
export type RenderFileKind = 'combined_pdf' | 'question_pdf' | 'solution_pdf';
export type RenderArtifactKind = 'log' | 'pdf';
export type RenderJobStatus = 'accepted' | 'failed' | 'running' | 'succeeded';

export interface RenderTemplateSummary {
  key: string;
  name: string;
  description: string;
  scene: string;
  subject?: null | string;
  estimated_latency: 'fast' | 'medium' | 'slow';
}

export type LayoutMode =
  | 'compact'
  | 'loose'
  | 'pad_landscape'
  | 'pad_portrait'
  | 'single'
  | 'standard';
export type ThemeColor =
  | 'amber'
  | 'blue'
  | 'crimson'
  | 'green'
  | 'indigo'
  | 'orange'
  | 'purple'
  | 'teal';

export interface RenderOptionsPayload {
  include_answer: boolean;
  include_analysis: boolean;
  layout_mode: LayoutMode;
  theme: ThemeColor;
  dark_mode: boolean;
  show_source: boolean;
}

export interface RenderOutputTargetsPayload {
  question_pdf: boolean;
  solution_pdf: boolean;
}

export interface RenderTemplatePreviewPayload {
  template_key: string;
  mode?: 'preview' | 'final';
  title: string;
  subtitle?: null | string;
  subject?: null | string;
  book_kind?: null | 'custom' | 'exam' | 'module' | 'wrong';
  content_mode?: null | RenderContentMode;
  answer_layout?: null | RenderAnswerLayout;
  delivery_mode?: null | RenderDeliveryMode;
  solution_mode?: null | 'appendix' | 'inline' | 'none' | 'separate';
  filters: Record<string, any>;
  options: RenderOptionsPayload;
  output_targets: RenderOutputTargetsPayload;
  metadata?: Record<string, any>;
  render_variant?: null | RenderVariant;
  layout_params?: Record<string, any>;
  upload_to_oss?: boolean;
}

export interface RenderJobFileResult {
  file_kind: string;
  render_variant?: null | RenderVariant;
  storage_type: 'local' | 'oss';
  status: 'available' | 'failed';
  filename: string;
  content_type: string;
  size_bytes?: null | number;
  local_path?: null | string;
  object_key?: null | string;
  url?: null | string;
  error_message?: null | string;
  created_at: string;
  updated_at: string;
}

export interface RenderJobResult {
  job_id: string;
  status: RenderJobStatus;
  mode: 'final' | 'preview';
  template_key: string;
  title: string;
  subtitle?: null | string;
  subject?: null | string;
  book_kind?: null | string;
  content_mode?: null | RenderContentMode;
  answer_layout?: null | RenderAnswerLayout;
  delivery_mode?: null | RenderDeliveryMode;
  solution_mode?: null | string;
  filters: Record<string, any>;
  options: RenderOptionsPayload;
  output_targets: RenderOutputTargetsPayload;
  render_variants: RenderVariant[];
  metadata: Record<string, any>;
  payload_path?: null | string;
  question_count?: null | number;
  material_count?: null | number;
  output_path?: null | string;
  error_message?: null | string;
  files: RenderJobFileResult[];
  created_at: string;
  updated_at: string;
}

export interface RenderJobListParams {
  job_id?: string;
  status?: RenderJobStatus;
  template_key?: string;
  mode?: 'final' | 'preview';
  user_id?: number;
  keyword?: string;
  page?: number;
  size?: number;
}

export interface RenderTemplatePreviewResult {
  job: RenderJobResult;
  render_variant: RenderVariant;
  pdf_url?: null | string;
  payload: Record<string, any>;
  resolved_metadata: Record<string, any>;
}

export interface RenderTemplatePresetPayload {
  title: string;
  subtitle?: null | string;
  subject?: null | string;
  book_kind?: null | 'custom' | 'exam' | 'module' | 'wrong';
  content_mode?: null | RenderContentMode;
  answer_layout?: null | RenderAnswerLayout;
  delivery_mode?: null | RenderDeliveryMode;
  solution_mode?: null | 'appendix' | 'inline' | 'none' | 'separate';
  filters: Record<string, any>;
  options: RenderOptionsPayload;
  output_targets: RenderOutputTargetsPayload;
  metadata?: Record<string, any>;
  render_variant?: null | RenderVariant;
  layout_params?: Record<string, any>;
}

export interface RenderTemplatePresetResult {
  id: number;
  template_key: string;
  preset_name: string;
  description?: null | string;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
  payload: RenderTemplatePresetPayload;
  remark?: null | string;
  created_at: string;
  updated_at: string;
}

export interface RenderTemplatePresetCreatePayload {
  template_key: string;
  preset_name: string;
  description?: null | string;
  is_active?: boolean;
  is_default?: boolean;
  sort_order?: number;
  payload: RenderTemplatePresetPayload;
  remark?: null | string;
}

export interface RenderTemplatePresetUpdatePayload {
  preset_name?: string;
  description?: null | string;
  is_active?: boolean;
  is_default?: boolean;
  sort_order?: number;
  payload?: RenderTemplatePresetPayload;
  remark?: null | string;
}

export async function getRenderTemplatesApi() {
  return requestClient.get<RenderTemplateSummary[]>('/api/v1/render-books/templates');
}

export async function previewRenderTemplateApi(data: RenderTemplatePreviewPayload) {
  return requestClient.post<RenderTemplatePreviewResult>('/api/v1/render-books/templates/preview', data);
}

export async function getRenderTemplatePresetsApi(params?: {
  template_key?: string;
  is_active?: boolean;
}) {
  return requestClient.get<RenderTemplatePresetResult[]>('/api/v1/render-books/presets', { params });
}

export async function createRenderTemplatePresetApi(data: RenderTemplatePresetCreatePayload) {
  return requestClient.post<RenderTemplatePresetResult>('/api/v1/render-books/presets', data);
}

export async function updateRenderTemplatePresetApi(
  presetId: number,
  data: RenderTemplatePresetUpdatePayload,
) {
  return requestClient.put<RenderTemplatePresetResult>(`/api/v1/render-books/presets/${presetId}`, data);
}

export async function deleteRenderTemplatePresetApi(presetId: number) {
  return requestClient.delete(`/api/v1/render-books/presets/${presetId}`);
}

export async function createRenderJobApi(data: RenderTemplatePreviewPayload) {
  return requestClient.post<RenderJobResult>('/api/v1/render-books/jobs', data);
}

export async function executeRenderJobApi(jobId: string, uploadToOss = true) {
  return requestClient.post<RenderJobResult>(
    `/api/v1/render-books/jobs/${jobId}/execute`,
    undefined,
    {
      params: {
        upload_to_oss: uploadToOss,
      },
    },
  );
}

export async function dispatchRenderJobApi(jobId: string, uploadToOss = true) {
  return requestClient.post<RenderJobResult>(
    `/api/v1/render-books/jobs/${jobId}/dispatch`,
    undefined,
    {
      params: {
        upload_to_oss: uploadToOss,
      },
    },
  );
}

export async function getRenderJobApi(jobId: string) {
  return requestClient.get<RenderJobResult>(`/api/v1/render-books/jobs/${jobId}`);
}

export async function getRenderJobListApi(params?: RenderJobListParams) {
  return requestClient.get<PageData<RenderJobResult>>('/api/v1/render-books/jobs', {
    params,
  });
}

export function buildRenderPreviewPdfUrl(jobId: string, renderVariant?: RenderVariant) {
  const search = new URLSearchParams();
  if (renderVariant) {
    search.set('render_variant', renderVariant);
  }
  search.set('prefer_url', 'true');
  const query = search.toString();
  return `/api/v1/render-books/jobs/${jobId}/preview.pdf?${query}`;
}

export function buildRenderJobFileUrl(
  jobId: string,
  fileKind: RenderFileKind,
  options?: {
    inline?: boolean;
    preferUrl?: boolean;
    renderVariant?: RenderVariant;
  },
) {
  const search = new URLSearchParams();
  if (options?.inline) {
    search.set('inline', 'true');
  }
  if (options?.preferUrl) {
    search.set('prefer_url', 'true');
  }
  if (options?.renderVariant) {
    search.set('render_variant', options.renderVariant);
  }
  const query = search.toString();
  const base = `/api/v1/render-books/jobs/${jobId}/files/${fileKind}`;
  return query ? `${base}?${query}` : base;
}

export function buildRenderArtifactUrl(
  jobId: string,
  renderVariant: RenderVariant,
  artifactKind: RenderArtifactKind,
) {
  return `/api/v1/render-books/jobs/${jobId}/artifacts/${renderVariant}/${artifactKind}`;
}
