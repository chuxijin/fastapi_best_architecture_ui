import type { PaginationResult } from '#/types/pagination';

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

/**
 * 智能解析结果
 */
export interface SmartExtractResult {
  materials: any[];
  questions: any[];
  materials_count: number;
  questions_count: number;
  raw_md_length: number;
}

/**
 * 智能提取题库文档(不入库)
 */
export async function smartExtractPdfApi(bankId: number, file: File) {
  const formData = new FormData();
  formData.append('bank_id', bankId.toString());
  formData.append('file', file);

  return requestClient.post<SmartExtractResult>(
    '/api/v1/qbank/parse/smart-extract',
    formData,
    {
      // AI处理时间极长，设置超时时间为30分钟
      timeout: 1_800_000,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
}

/**
 * 提交并保存智能解析结果
 */
export async function smartCommitApi(
  bankId: number,
  materials: any[],
  questions: any[],
) {
  return requestClient.post('/api/v1/qbank/parse/smart-commit', {
    bank_id: bankId,
    materials,
    questions,
  });
}

/**
 * 仅解析 PDF 为 Markdown (第一阶段)
 */
export async function parsePdfToMdApi(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  return requestClient.post<{ markdown: string }>(
    '/api/v1/qbank/parse/pdf',
    formData,
    {
      timeout: 1_800_000,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
}

/**
 * 保存分段 Markdown 到服务器
 */
export async function saveSegmentsApi(
  bankId: number,
  segments: { content: string; name: string }[],
) {
  return requestClient.post('/api/v1/qbank/parse/save-segments', {
    bank_id: bankId,
    segments,
  });
}
