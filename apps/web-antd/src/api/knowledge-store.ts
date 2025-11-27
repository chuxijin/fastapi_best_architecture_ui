import type { PaginationResult } from '#/types/pagination';

import { requestClient } from './request';

export interface CategoryResult {
  id: number;
  name: string;
  cat_type: number;
  code: string;
  parent_id: null | number;
  level: number;
  is_active: boolean;
  sort_order: number;
  created_time: string;
  updated_time: null | string;
}

export interface CategoryTreeResult extends CategoryResult {
  children?: CategoryTreeResult[];
}

export interface CategoryParams {
  name: string;
  cat_type: number;
  code: string;
  parent_id?: null | number;
  level?: number;
  is_active?: boolean;
  sort_order?: number;
}

export interface CategoryQueryParams {
  cat_type?: number;
  is_active?: boolean;
}

export interface DeleteCategoryParams {
  ids: number[];
}

export async function getQbankCategoryTreeApi(params?: CategoryQueryParams) {
  return requestClient.get<CategoryTreeResult[]>('/api/v1/qbank/categories', {
    params,
  });
}

export async function getQbankCategoryDetailApi(pk: number) {
  return requestClient.get<CategoryResult>(`/api/v1/qbank/categories/${pk}`);
}

export async function createQbankCategoryApi(data: CategoryParams) {
  return requestClient.post('/api/v1/qbank/categories', data);
}

export async function updateQbankCategoryApi(pk: number, data: CategoryParams) {
  return requestClient.put(`/api/v1/qbank/categories/${pk}`, data);
}

export async function deleteQbankCategoryApi(data: DeleteCategoryParams) {
  return requestClient.delete('/api/v1/qbank/categories', { data });
}

// ==================== 题库管理 API ====================

export interface BankResult {
  id: number;
  cat_id: number;
  name: string;
  code: string;
  desc: null | string;
  cover_url: null | string;
  square_cover_url: null | string;
  detail: null | string;
  diff_id: null | number;
  parent_id: null | number;
  status: number;
  scope: number;
  q_count: number;
  total_score: number;
  buy_count: number;
  created_time: string;
  updated_time: null | string;
}

export interface BankParams {
  cat_id: number;
  name: string;
  code: string;
  desc?: null | string;
  cover_url?: null | string;
  diff_id?: null | number;
  parent_id?: null | number;
  status?: number;
  scope?: number;
}

export interface BankQueryParams {
  cat_id?: number;
  status?: number;
  scope?: number;
  keyword?: string;
}

export interface DeleteBankParams {
  ids: number[];
}

export async function getBankListApi(params?: BankQueryParams) {
  return requestClient.get<BankResult[]>('/api/v1/qbank/banks', {
    params,
  });
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

// ==================== 章节管理 API ====================

export interface ChapterResult {
  id: number;
  bank_id: number;
  name: string;
  code: null | string;
  level: number;
  sort_order: number;
  parent_id: null | number;
  q_count: number;
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

// ==================== 题目管理 API ====================

/**
 * 题型枚举
 */
export type QuestionType =
  | 'fill'
  | 'judgement'
  | 'material'
  | 'multiple'
  | 'shortAnswer'
  | 'single';

/**
 * 难度枚举
 */
export type DifficultyType = 'easy' | 'hard' | 'medium';

/**
 * 用途枚举
 */
export type UsageType = 'all' | 'exam' | 'practice';

/**
 * 选项数据结构
 */
export interface OptionData {
  code: string;
  content: string;
}

/**
 * 题目列表项（不含答案）
 */
export interface QuestionListItem {
  id: number;
  bank_id: number;
  chapter_id: null | number;
  chapter_name?: null | string;
  type: QuestionType;
  stem: string;
  difficulty: DifficultyType;
  score: number;
  knowledge_point: null | string;
  is_active: boolean;
  review_status: number;
  created_time: string;
}

/**
 * 题目详情（不含答案）
 */
export interface QuestionDetail {
  id: number;
  bank_id: number;
  chapter_id: null | number;
  type: QuestionType;
  stem: string;
  options_data: null | Record<string, OptionData>;
  difficulty: DifficultyType;
  score: number;
  knowledge_point: null | string;
  source: null | string;
  year: null | number;
  usage: UsageType;
  is_active: boolean;
  review_status: number;
  created_by: number;
  updated_by: null | number;
  created_time: string;
  updated_time: null | string;
}

/**
 * 创建/更新题目参数
 */
export interface QuestionParams {
  bank_id: number;
  chapter_id?: null | number;
  type: QuestionType;
  stem: string;
  options_data?: null | Record<string, OptionData>;
  difficulty?: DifficultyType;
  score?: number;
  knowledge_point?: null | string;
  source?: null | string;
  year?: null | number;
  usage?: UsageType;
  is_active?: boolean;
}

/**
 * 题目查询参数
 */
export interface QuestionQueryParams {
  bank_id?: number;
  chapter_id?: number;
  type?: QuestionType;
  difficulty?: DifficultyType;
  is_active?: boolean;
  review_status?: number;
  keyword?: string;
  page?: number;
  size?: number;
}

/**
 * 删除题目参数
 */
export interface DeleteQuestionParams {
  ids: number[];
}

/**
 * 获取题目列表
 */
export async function getQuestionListApi(params: QuestionQueryParams) {
  return requestClient.get<PaginationResult<QuestionListItem>>(
    '/api/v1/qbank/questions',
    { params },
  );
}

/**
 * 获取题目详情（不含答案）
 */
export async function getQuestionDetailApi(pk: number) {
  return requestClient.get<QuestionDetail>(`/api/v1/qbank/questions/${pk}`);
}

/**
 * 创建题目
 */
export async function createQuestionApi(data: QuestionParams) {
  return requestClient.post('/api/v1/qbank/questions', data);
}

/**
 * 更新题目
 */
export async function updateQuestionApi(pk: number, data: QuestionParams) {
  return requestClient.put(`/api/v1/qbank/questions/${pk}`, data);
}

/**
 * 删除题目
 */
export async function deleteQuestionApi(data: DeleteQuestionParams) {
  return requestClient.delete('/api/v1/qbank/questions', { data });
}

// ==================== 题目解析 API ====================

/**
 * 答案数据结构
 */
export interface AnswerData {
  correct: string | string[];
  keywords?: string[];
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
}

/**
 * 创建/更新解析参数
 */
export interface QuestionAnalysisParams {
  question_id?: number;
  answer_data: AnswerData;
  content: string;
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
 * 创建题目解析
 */
export async function createQuestionAnalysisApi(
  questionId: number,
  data: QuestionAnalysisParams,
) {
  return requestClient.post(`/api/v1/qbank/questions/${questionId}/analysis`, {
    ...data,
    question_id: questionId,
  });
}

/**
 * 更新题目解析
 */
export async function updateQuestionAnalysisApi(
  questionId: number,
  data: QuestionAnalysisParams,
) {
  return requestClient.put(
    `/api/v1/qbank/questions/${questionId}/analysis`,
    data,
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

// ==================== 答题相关 API ====================

/**
 * 提交答案参数
 */
export interface SubmitAnswerParams {
  question_id: number;
  user_answer: string | string[];
  answer_time?: number;
}

/**
 * 提交答案结果
 */
export interface SubmitAnswerResult {
  is_correct: boolean;
  correct_answer: AnswerData;
  score: number;
}

/**
 * 提交答案并判分
 */
export async function submitAnswerApi(
  questionId: number,
  userAnswer: string | string[],
  answerTime?: number,
) {
  return requestClient.post<SubmitAnswerResult>(
    `/api/v1/qbank/questions/${questionId}/submit`,
    {
      question_id: questionId,
      user_answer: userAnswer,
      answer_time: answerTime,
    },
  );
}

// ==================== 题目统计 API ====================

/**
 * 题目统计详情
 */
export interface QuestionStatistics {
  id: number;
  question_id: number;
  attempt_count: number;
  correct_count: number;
  correct_rate: number;
  avg_answer_time: null | number;
  wrong_option_stats: null | Record<string, number>;
  collect_count: number;
  note_count: number;
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
export interface RedeemCodeParams {
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
export async function redeemActcodeApi(data: RedeemCodeParams) {
  return requestClient.post<RedeemCodeResult>('/api/v1/actcode/redeem', data);
}
