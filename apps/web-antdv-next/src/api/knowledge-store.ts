import type { PaginationResult } from '#/types/pagination';

import { useAppConfig } from '@vben/hooks';
import { useAccessStore } from '@vben/stores';

import { requestClient } from './request';

// ==================== QBank APIs ====================

export interface BankResult {
  id: number;
  cat_id: number;
  name: string;
  code: string;
  desc: null | string;
  cover_url: null | string;
  difficulty: null | number | string;
  bank_type: number;
  scene_mask: number;
  parent_id: null | number;
  status: number;
  scope: number;
  q_count_cache: number;
  total_score_cache: number | string;
  buy_count: number;
  created_by: number;
  updated_by: null | number;
  created_time: string;
  updated_time: null | string;
  children?: BankResult[];
}

export interface BankParams {
  cat_id: number;
  name: string;
  code: string;
  desc?: null | string;
  cover_url?: null | string;
  difficulty?: null | number | string;
  bank_type?: number;
  scene_mask?: number;
  parent_id?: null | number;
  status?: number;
  scope?: number;
}

export interface BankQueryParams {
  cat_id?: number;
  status?: number;
  scope?: number;
  keyword?: string;
  bank_type?: number;
  parent_id?: number;
}

export interface DeleteBankParams {
  ids: number[];
}

export async function getBankListApi(params?: BankQueryParams) {
  return requestClient.get<BankResult[]>('/api/v1/qbank/banks', { params });
}

export async function getBankDetailApi(pk: number) {
  return requestClient.get<BankResult>(`/api/v1/qbank/banks/${pk}`);
}

export async function createBankApi(data: BankParams) {
  return requestClient.post('/api/v1/qbank/banks', data);
}

export async function updateBankApi(pk: number, data: BankParams) {
  return requestClient.put(`/api/v1/qbank/banks/${pk}`, data);
}

export async function deleteBankApi(data: DeleteBankParams) {
  return requestClient.delete('/api/v1/qbank/banks', { data });
}

export interface ChapterResult {
  id: number;
  bank_id: number;
  name: string;
  code: null | string;
  level: number;
  sort_order: number;
  parent_id: null | number;
  is_trial: boolean;
  status: 0 | 1;
  q_count_cache: number;
  created_time: string;
  updated_time: null | string;
}

export interface ChapterTreeResult extends ChapterResult {
  children?: ChapterTreeResult[];
}

export interface ChapterParams {
  bank_id: number;
  name: string;
  code?: null | string;
  level?: number;
  sort_order?: number;
  parent_id?: null | number;
  is_trial?: boolean;
  status?: 0 | 1;
}

export interface ChapterQueryParams {
  bank_id: number;
}

export interface DeleteChapterParams {
  ids: number[];
}

export async function getChapterTreeApi(params: ChapterQueryParams) {
  return requestClient.get<ChapterTreeResult[]>('/api/v1/qbank/chapters', {
    params,
  });
}

export async function getChapterDetailApi(pk: number) {
  return requestClient.get<ChapterResult>(`/api/v1/qbank/chapters/${pk}`);
}

export async function createChapterApi(data: ChapterParams) {
  return requestClient.post('/api/v1/qbank/chapters', data);
}

export async function updateChapterApi(pk: number, data: ChapterParams) {
  return requestClient.put(`/api/v1/qbank/chapters/${pk}`, data);
}

export async function deleteChapterApi(data: DeleteChapterParams) {
  return requestClient.delete('/api/v1/qbank/chapters', { data });
}

export type QuestionType =
  | 'fill'
  | 'judgement'
  | 'multiple'
  | 'shortAnswer'
  | 'single';

export type DifficultyType = 'easy' | 'hard' | 'medium';
export type UsageType = 'all' | 'exam' | 'practice';

export interface OptionData {
  code: string;
  content: string;
}

export interface QuestionListItem {
  id: number;
  type: QuestionType;
  stem: string;
  options_data: null | Record<string, OptionData>;
  difficulty: DifficultyType;
  default_score: number | string;
  knowledge_point: null | string[];
  content_status: number;
  created_time: string;
  updated_time: null | string;
  bank_id: null | number;
  chapter_id: null | number;
  sort_order: number;
  is_active: boolean;
  score: null | number | string;
  review_status: number;
  bank_name?: null | string;
  chapter_name?: null | string;
}

export type QuestionResult = QuestionListItem;

export interface QuestionOptionItem {
  id?: number;
  option_code: string;
  content_id?: number;
  content: string;
  sort_order: number;
  is_active: boolean;
}

export interface QuestionDetail {
  id: number;
  type: QuestionType;
  stem: string;
  options_data: null | Record<string, OptionData>;
  difficulty: DifficultyType;
  default_score: number | string;
  knowledge_point: null | string[];
  content_status: number;
  created_time: string;
  updated_time: null | string;
  bank_id: null | number;
  chapter_id: null | number;
  sort_order: number;
  is_active: boolean;
  score: null | number | string;
  review_status: number;
  bank_name?: null | string;
  chapter_name?: null | string;
  answer_data: null | Record<string, any>;
  analysis_content: null | string;
  analyses: QuestionAnalysisDetail[];
  materials: Array<{ content: string; id: number }>;
  material_ids: number[];
}

export interface QuestionCoreParam {
  type: QuestionType;
  stem: string;
  difficulty?: DifficultyType;
  default_score?: number;
  knowledge_point?: null | string[];
  content_status?: 0 | 10 | 20;
}

export interface QuestionPlacementParam {
  bank_id: number;
  chapter_id?: null | number;
  sort_order?: number;
  is_active?: boolean;
  score?: null | number;
  review_status?: 0 | 10 | 20;
  scene_mask?: null | number;
}

export interface QuestionOptionParam {
  option_code: string;
  content: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface QuestionParams {
  core: QuestionCoreParam;
  options?: QuestionOptionParam[];
  placements: QuestionPlacementParam[];
  analyses: QuestionAnalysisParams[];
  material_ids?: number[];
}

export interface QuestionQueryParams {
  bank_id?: number;
  chapter_id?: number;
  type?: QuestionType;
  difficulty?: DifficultyType;
  content_status?: number;
  is_active?: boolean;
  review_status?: number;
  keyword?: string;
  page?: number;
  size?: number;
  include_answer?: boolean;
}

export interface DeleteQuestionParams {
  ids: number[];
}

export async function getQuestionListApi(params: QuestionQueryParams) {
  return requestClient.get<PaginationResult<QuestionListItem>>(
    '/api/v1/qbank/questions',
    {
      params,
    },
  );
}

export async function getQuestionDetailApi(pk: number) {
  return requestClient.get<QuestionDetail>(`/api/v1/qbank/questions/${pk}`);
}

export async function createQuestionApi(data: QuestionParams) {
  return requestClient.post('/api/v1/qbank/questions', data);
}

export async function updateQuestionApi(
  pk: number,
  data: Partial<QuestionParams>,
) {
  return requestClient.put(`/api/v1/qbank/questions/${pk}`, data);
}

export async function deleteQuestionApi(data: DeleteQuestionParams) {
  return requestClient.delete('/api/v1/qbank/questions', { data });
}

// ==================== 棰樼洰瑙ｆ瀽 API ====================
export interface AnswerData {
  correct: string | string[];
  keywords?: string[];
  versions?: any[];
}

/**
 * 题目解析详情
 */
export interface QuestionAnalysisDetail {
  id: number;
  question_id: number;
  answer_data: AnswerData;
  content: string;
  view_count: number;
  helpful_count: number;
  unhelpful_count: number;
  created_time: string;
  updated_time: null | string;
  type?: string;
  version_no?: number;
  is_default?: boolean;
  status?: 0 | 10 | 20;
}

/**
 * 创建/更新解析参数
 */
export interface QuestionAnalysisParams {
  answer_data: AnswerData;
  content: string;
  type?: string;
  version_no?: number;
  is_default?: boolean;
  status?: 0 | 10 | 20;
}

/**
 * 获取题目解析（含答案）
 */
export async function getQuestionAnalysisApi(questionId: number) {
  return requestClient.get<QuestionAnalysisDetail>(
    `/api/v1/qbank/questions/${questionId}/analysis`,
  );
}

/**
 * 标记解析是否有帮助
 */
export async function markAnalysisHelpfulApi(
  questionId: number,
  isHelpful: boolean,
) {
  return requestClient.post(
    `/api/v1/qbank/questions/${questionId}/analysis/helpful`,
    { is_helpful: isHelpful },
  );
}

// ==================== 题目统计 API ====================

/**
 * 题目统计详情
 */
export interface QuestionStatistics {
  question_id: number;
  attempt_count: number;
  correct_count: number;
  correct_rate: number;
  avg_answer_time: null | number;
  wrong_option_stats: null | Record<string, number>;
  collect_count: number;
  note_count: number;
  report_count: number;
  last_updated: string;
}

/**
 * 获取题目统计
 */
export async function getQuestionStatisticsApi(questionId: number) {
  return requestClient.get<QuestionStatistics>(
    `/api/v1/qbank/questions/${questionId}/statistics`,
  );
}

// ==================== 激活码管理 API ====================

/**
 * 激活码生成器配置
 */
export interface CodeGeneratorConfig {
  groups: number;
  group_length: number;
  separator: string;
  prefix: string;
  suffix: string;
  use_digits: boolean;
  use_letters: boolean;
  letter_case: 'lower' | 'mixed' | 'upper';
  use_special: boolean;
  special_chars: string;
  exclude_chars: string[];
  exclude_words: string[];
  use_checksum: boolean;
}

/**
 * 激活码批次结果
 */
export interface ActcodeBatchResult {
  id: number;
  app_id: string;
  batch_no: string;
  name: string;
  reward_type: string;
  reward_data: any;
  generator_config: CodeGeneratorConfig | null;
  total_count: number;
  used_count: number;
  valid_from: null | string;
  valid_to: null | string;
  max_use_per_code: number;
  status: number;
  created_time: string;
  updated_time: null | string;
}

/**
 * 激活码结果
 */
export interface ActcodeResult {
  id: number;
  batch_id: number;
  code: string;
  used_count: number;
  status: number;
  created_time: string;
}

/**
 * 激活码使用记录
 */
export interface ActcodeUsageResult {
  id: number;
  code_id: number;
  app_id: string;
  user_id: string;
  used_time: string;
  ip_address: null | string;
  device_info: null | string;
}

/**
 * 创建批次参数
 */
export interface CreateBatchParams {
  app_id: string;
  name: string;
  reward_type: string;
  reward_data: any;
  total_count: number;
  valid_from?: null | string;
  valid_to?: null | string;
  max_use_per_code?: number;
  generator_config?: CodeGeneratorConfig | null;
}

/**
 * 批次查询参数
 */
export interface BatchQueryParams {
  app_id?: string;
  status?: number;
  batch_no?: string;
  page?: number;
  size?: number;
}

/**
 * 激活码查询参数
 */
export interface ActcodeQueryParams {
  batch_id?: number;
  status?: number;
  page?: number;
  size?: number;
}

/**
 * 使用记录查询参数
 */
export interface UsageQueryParams {
  app_id?: string;
  user_id?: string;
  code_id?: number;
  page?: number;
  size?: number;
}

/**
 * 兑换激活码参数
 */
export interface KsRedeemCodeParams {
  app_id: string;
  code: string;
  user_id: string;
  ip_address?: null | string;
  device_info?: null | string;
}

/**
 * 兑换结果
 */
export interface RedeemCodeResult {
  success: boolean;
  reward_type: string;
  reward_data: any;
  message: string;
}

/**
 * 获取批次列表
 */
export async function getActcodeBatchListApi(params?: BatchQueryParams) {
  return requestClient.get<PaginationResult<ActcodeBatchResult>>(
    '/api/v1/actcode/batch',
    { params },
  );
}

/**
 * 获取批次详情
 */
export async function getActcodeBatchDetailApi(pk: number) {
  return requestClient.get<ActcodeBatchResult>(`/api/v1/actcode/batch/${pk}`);
}

/**
 * 创建批次
 */
export async function createActcodeBatchApi(data: CreateBatchParams) {
  return requestClient.post<ActcodeBatchResult>('/api/v1/actcode/batch', data);
}

/**
 * 获取激活码列表
 */
export async function getActcodeListApi(params?: ActcodeQueryParams) {
  return requestClient.get<PaginationResult<ActcodeResult>>(
    '/api/v1/actcode/codes',
    { params },
  );
}

/**
 * 获取使用记录
 */
export async function getActcodeUsageListApi(params?: UsageQueryParams) {
  return requestClient.get<PaginationResult<ActcodeUsageResult>>(
    '/api/v1/actcode/usage',
    { params },
  );
}

/**
 * 兑换激活码
 */
export async function redeemActcodeApi(data: KsRedeemCodeParams) {
  return requestClient.post<RedeemCodeResult>('/api/v1/actcode/redeem', data);
}

// ==================== 题目批量导入 API ====================

/**
 * 单条题目导入数据
 */
export interface QuestionImportRow {
  ID?: number | string;
  题目: string;
  题型: string;
  分数: number;
  难度: string;
  选项A?: null | string;
  选项B?: null | string;
  选项C?: null | string;
  选项D?: null | string;
  答案: string;
  解析: string;
  一级目录?: null | string;
  二级目录?: null | string;
  三级目录?: null | string;
  知识点?: null | string;
  材料编号?: null | string;
}

/**
 * 批量导入参数
 */
export interface BatchImportQuestionParams {
  bank_id: number;
  questions: QuestionImportRow[];
}

/**
 * 单条导入结果
 */
export interface ImportResultItem {
  row_number: number;
  success: boolean;
  question_id: null | number;
  error_message: null | string;
  action?: null | string;
}

/**
 * 批量导入结果
 */
export interface BatchImportQuestionResult {
  total: number;
  success_count: number;
  fail_count: number;
  details: ImportResultItem[];
}

/**
 * 批量导入题目
 */
export async function batchImportQuestionsApi(data: BatchImportQuestionParams) {
  return requestClient.post<BatchImportQuestionResult>(
    '/api/v1/qbank/questions/import',
    data,
  );
}

// ==================== 流式 / 文件上传辅助 ====================

/**
 * 获取统一的认证请求头（与 requestClient 保持一致）
 */
function getAuthHeaders(): Record<string, string> {
  const accessStore = useAccessStore();
  const token = accessStore.accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * 获取 API baseURL（与 requestClient 保持一致）
 */
function getApiBaseUrl(): string {
  const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);
  return apiURL;
}

// ==================== AI 审核台文件解析 API ====================

export interface PdfMarkdownResult {
  file_name: string;
  job_id?: string;
  md_length: number;
  md_url: string;
  status?: string;
  text_file_name?: string;
  text_length?: number;
  text_url?: string;
}

export interface RecoverLlamaParseMarkdownPayload {
  bank_id: number;
  download_images?: boolean;
  job_id: string;
}

export interface ReviewMaterialItem {
  material_id: string;
  title: string;
  content: string;
  source_segment_ids: string[];
  confidence: number;
  warnings: string[];
  status: string;
}

export interface ReviewQuestionItem {
  question_id: string;
  source_segment_id?: null | string;
  question_no_raw?: null | string;
  type: string;
  stem: string;
  options_data: Record<string, any>;
  answer_data: Record<string, any>;
  analysis_content: string;
  difficulty: string;
  knowledge_point?: null | string | string[];
  score: number;
  sort_order?: null | number;
  source?: null | string;
  year?: null | number;
  chapter_name?: null | string;
  chapter_level1_name?: null | string;
  chapter_level2_name?: null | string;
  chapter_level3_name?: null | string;
  material_id?: null | string;
  source_quote?: null | string;
  confidence: number;
  warnings: string[];
  status: string;
}

export interface ReviewAnswerItem {
  answer_id: string;
  source_segment_id?: null | string;
  question_no_raw?: null | string;
  sort_order?: null | number;
  answer_data: Record<string, any>;
  analysis_content: string;
  source_quote?: null | string;
  confidence: number;
  warnings: string[];
  status: string;
}

export interface ReviewSegmentItem {
  segment_id: string;
  index: number;
  type: string;
  content: string;
  preview: string;
  length: number;
  content_hash: string;
}

export interface ReviewJobResult {
  job_id: string;
  status: string;
  bank_id: number;
  bank_name: string;
  provider_id: number;
  file_name: string;
  file_type: string;
  extract_mode?: string;
  md_url: string;
  excel_url?: null | string;
  materials: ReviewMaterialItem[];
  questions: ReviewQuestionItem[];
  answers: ReviewAnswerItem[];
  segments: ReviewSegmentItem[];
  warnings: string[];
  materials_count: number;
  questions_count: number;
  answers_count: number;
  segments_count: number;
}

export interface ReviewJobUpdatePayload {
  materials: ReviewMaterialItem[];
  questions: ReviewQuestionItem[];
  answers: ReviewAnswerItem[];
  segments: ReviewSegmentItem[];
  status: string;
}

export type ReviewJobEvent =
  | {
      answers_count: number;
      job: ReviewJobResult;
      materials_count: number;
      message: string;
      questions_count: number;
      segments_count: number;
      type: 'done';
      warnings_count: number;
    }
  | {
      answers_count?: number;
      md_length?: number;
      md_url?: string;
      message: string;
      questions_count?: number;
      segments_count?: number;
      stage: string;
      type: 'stage';
    }
  | {
      batch_answers_count?: number;
      batch_index: number;
      batch_materials_count?: number;
      batch_questions_count?: number;
      total_answers_count?: number;
      total_batches: number;
      total_materials_count?: number;
      total_questions_count?: number;
      type: 'progress';
    }
  | { message: string; type: 'error' };

export async function convertPdfToMarkdownApi(
  file: File,
  bankId: number,
): Promise<PdfMarkdownResult> {
  const formData = new FormData();
  formData.append('bank_id', bankId.toString());
  formData.append('file', file);

  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/v1/qbank/parse/pdf-markdown`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });
  const json = await response.json();
  if (json.code === 200) {
    return json.data as PdfMarkdownResult;
  }
  throw new Error(json.msg || 'PDF 转 Markdown 失败');
}

export async function recoverLlamaParseMarkdownApi(
  data: RecoverLlamaParseMarkdownPayload,
) {
  return requestClient.post<PdfMarkdownResult>(
    '/api/v1/qbank/parse/pdf-markdown/recover',
    data,
  );
}

export async function createReviewJobStreamApi(
  file: File,
  bankId: number,
  providerId: number,
  extractMode: 'answer' | 'question',
  onEvent: (event: ReviewJobEvent) => void,
): Promise<void> {
  const formData = new FormData();
  formData.append('bank_id', bankId.toString());
  formData.append('provider_id', providerId.toString());
  formData.append('extract_mode', extractMode);
  formData.append('file', file);

  const baseUrl = getApiBaseUrl();
  const response = await fetch(
    `${baseUrl}/api/v1/qbank/parse/review-jobs/stream`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    },
  );

  if (!response.ok) {
    throw new Error(`请求失败: HTTP ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('无法读取响应流');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      const dataStr = line.startsWith('data: ') ? line.slice(6) : line;
      if (dataStr === '[DONE]') continue;

      try {
        const event = JSON.parse(dataStr) as ReviewJobEvent;
        onEvent(event);
      } catch {
        // 忽略非 JSON 行
      }
    }
  }
}

export async function updateReviewJobApi(
  jobId: string,
  data: ReviewJobUpdatePayload,
) {
  return requestClient.put<ReviewJobResult>(
    `/api/v1/qbank/parse/review-jobs/${jobId}`,
    data,
  );
}

export async function exportReviewJobExcelApi(jobId: string) {
  return requestClient.post<{ excel_url: string; warnings_count: number }>(
    `/api/v1/qbank/parse/review-jobs/${jobId}/excel`,
  );
}

export async function commitReviewJobApi(jobId: string) {
  return requestClient.post<{
    materials_count: number;
    questions_count: number;
  }>(`/api/v1/qbank/parse/review-jobs/${jobId}/commit`);
}

// ==================== Excel 导入 API ====================

/**
 * Excel 导入结果
 */
export interface ExcelImportResult {
  total: number;
  success_count: number;
  fail_count: number;
  dedup_count?: number;
  existing_count?: number;
  skipped_count?: number;
  conflict_count?: number;
  materials_count?: number;
}

/**
 * Excel 文件导入题目
 *
 * :param file: Excel 文件
 * :param bankId: 题库 ID
 * :return:
 */
export async function importExcelQuestionsApi(
  file: File,
  bankId: number,
): Promise<ExcelImportResult> {
  const formData = new FormData();
  formData.append('bank_id', bankId.toString());
  formData.append('file', file);

  const baseUrl = getApiBaseUrl();
  const response = await fetch(
    `${baseUrl}/api/v1/qbank/questions/import-excel`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    },
  );

  const json = await response.json();
  if (json.code === 200) {
    return json.data as ExcelImportResult;
  }
  throw new Error(json.msg || '导入失败');
}

// ==================== 文件下载 API ====================

/**
 * 下载导入模板
 */
export async function downloadImportTemplateApi(): Promise<Blob> {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(
    `${baseUrl}/api/v1/qbank/questions/import-template`,
    {
      headers: getAuthHeaders(),
    },
  );
  return response.blob();
}

/**
 * 下载解析生成的文件
 */
export async function downloadParseFileApi(urlPath: string): Promise<Blob> {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}${urlPath}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('文件下载失败');
  }
  return response.blob();
}
