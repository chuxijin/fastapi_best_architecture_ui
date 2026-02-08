import { requestClient } from './request';

// ==================== 公考词语管理 ====================
export interface GkCiyuParams {
  word?: string;
  category?: string;
  emotion?: string;
  frequency?: number;
  page?: number;
  size?: number;
}

export interface GkCiyuResult {
  id: number;
  word: string;
  pinyin?: string;
  meaning?: string;
  synonym?: string;
  antonym?: string;
  example?: string;
  category?: string;
  source?: string;
  emotion?: string;
  confusion?: string;
  frequency?: number;
  view_count: number;
  created_time: string;
  updated_time?: string;
  created_by: number;
  updated_by?: number;
}

export interface GkCiyuPaginationResponse {
  items: GkCiyuResult[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface CreateGkCiyuParams {
  word: string;
  pinyin?: string;
  meaning?: string;
  synonym?: string;
  antonym?: string;
  example?: string;
  category?: string;
  source?: string;
  emotion?: string;
  confusion?: string;
  frequency?: number;
}

export interface UpdateGkCiyuParams {
  word?: string;
  pinyin?: string;
  meaning?: string;
  synonym?: string;
  antonym?: string;
  example?: string;
  category?: string;
  source?: string;
  emotion?: string;
  confusion?: string;
  frequency?: number;
}

// 获取词语列表（分页）
export async function getGkCiyuListApi(params?: GkCiyuParams) {
  return requestClient.get<GkCiyuPaginationResponse>('/api/v1/gk/ciyu', {
    params,
  });
}

// 获取词语详情
export async function getGkCiyuDetailApi(id: number) {
  return requestClient.get<GkCiyuResult>(`/api/v1/gk/ciyu/${id}`);
}

// 创建词语
export async function createGkCiyuApi(data: CreateGkCiyuParams) {
  return requestClient.post('/api/v1/gk/ciyu', data);
}

// 更新词语
export async function updateGkCiyuApi(id: number, data: UpdateGkCiyuParams) {
  return requestClient.put(`/api/v1/gk/ciyu/${id}`, data);
}

// 删除词语
export async function deleteGkCiyuApi(ids: number[]) {
  return requestClient.delete('/api/v1/gk/ciyu', { data: { ids } });
}

// 增加阅读量
export async function incrementGkCiyuViewApi(id: number) {
  return requestClient.post(`/api/v1/gk/ciyu/${id}/view`);
}

// ==================== 公考经验管理 ====================
export interface GkJingyanParams {
  title?: string;
  type?: string;
  author?: string;
  tags?: string;
  page?: number;
  size?: number;
}

export interface GkJingyanResult {
  id: number;
  title: string;
  type: string;
  content: string;
  author?: string;
  tags?: string;
  daily_date?: string;
  summary?: string;
  view_count: number;
  created_time: string;
  updated_time?: string;
  created_by: number;
  updated_by?: number;
}

export interface GkJingyanPaginationResponse {
  items: GkJingyanResult[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface CreateGkJingyanParams {
  title: string;
  type: string;
  content: string;
  author?: string;
  tags?: string;
  daily_date?: string;
  summary?: string;
}

export interface UpdateGkJingyanParams {
  title?: string;
  type?: string;
  content?: string;
  author?: string;
  tags?: string;
  daily_date?: string;
  summary?: string;
}

// 获取经验列表
export async function getGkJingyanListApi(params?: GkJingyanParams) {
  return requestClient.get<GkJingyanPaginationResponse>('/api/v1/gk/jingyan', {
    params,
  });
}

// 获取经验详情
export async function getGkJingyanDetailApi(id: number) {
  return requestClient.get<GkJingyanResult>(`/api/v1/gk/jingyan/${id}`);
}

// 创建经验
export async function createGkJingyanApi(data: CreateGkJingyanParams) {
  return requestClient.post('/api/v1/gk/jingyan', data);
}

// 更新经验
export async function updateGkJingyanApi(
  id: number,
  data: UpdateGkJingyanParams,
) {
  return requestClient.put(`/api/v1/gk/jingyan/${id}`, data);
}

// 删除经验
export async function deleteGkJingyanApi(ids: number[]) {
  return requestClient.delete('/api/v1/gk/jingyan', { data: { ids } });
}

// 增加阅读量
export async function incrementGkJingyanViewApi(id: number) {
  return requestClient.post(`/api/v1/gk/jingyan/${id}/view`);
}

// ==================== 公考岗位管理 ====================
export interface GkGangweiParams {
  year?: number;
  exam_type?: string;
  region?: string;
  dept_name?: string;
  position_name?: string;
  position_code?: string;
  page?: number;
  size?: number;
}

export interface GkGangweiResult {
  id: number;
  // 基础标识
  year: number;
  position_code?: string;
  serial_no?: string;
  // 部门信息
  dept_code?: string;
  dept_name?: string;
  bureau?: string;
  org_nature?: string;
  org_level?: string;
  dept_website?: string;
  // 职位信息
  position_name?: string;
  position_attr?: string;
  position_intro?: string;
  recruit_num?: number;
  recruit_scope?: string;
  exam_category?: string;
  job_rank?: string;
  // 报考条件
  major?: string;
  education?: string;
  degree?: string;
  edu_type?: string;
  politics?: string;
  age_requirement?: string;
  gender_requirement?: string;
  ethnicity_requirement?: string;
  grassroots_years?: string;
  grassroots_project?: string;
  special_position?: string;
  other_requirement?: string;
  // 地点信息
  region?: string;
  work_location?: string;
  settlement_location?: string;
  // 面试相关
  interview_ratio?: string;
  has_professional_test?: string;
  // 联系方式
  phone1?: string;
  phone2?: string;
  phone3?: string;
  remark?: string;
  // 统计字段
  exam_type?: string;
  apply_count?: number;
  pass_count?: number;
  competition_ratio?: string;
  written_min_score?: number;
  written_avg_score?: number;
  written_max_score?: number;
  interview_min_score?: number;
  interview_avg_score?: number;
  interview_max_score?: number;
  // 系统字段
  created_time: string;
  updated_time?: string;
  created_by: number;
  updated_by?: number;
}

export interface CreateGkGangweiParams {
  // 基础标识
  year: number;
  position_code?: string;
  serial_no?: string;
  // 部门信息
  dept_code?: string;
  dept_name?: string;
  bureau?: string;
  org_nature?: string;
  org_level?: string;
  dept_website?: string;
  // 职位信息
  position_name?: string;
  position_attr?: string;
  position_intro?: string;
  recruit_num?: number;
  recruit_scope?: string;
  exam_category?: string;
  job_rank?: string;
  // 报考条件
  major?: string;
  education?: string;
  degree?: string;
  edu_type?: string;
  politics?: string;
  age_requirement?: string;
  gender_requirement?: string;
  ethnicity_requirement?: string;
  grassroots_years?: string;
  grassroots_project?: string;
  special_position?: string;
  other_requirement?: string;
  // 地点信息
  region?: string;
  work_location?: string;
  settlement_location?: string;
  // 面试相关
  interview_ratio?: string;
  has_professional_test?: string;
  // 联系方式
  phone1?: string;
  phone2?: string;
  phone3?: string;
  remark?: string;
  // 统计字段
  exam_type?: string;
  apply_count?: number;
  pass_count?: number;
  competition_ratio?: string;
  written_min_score?: number;
  written_avg_score?: number;
  written_max_score?: number;
  interview_min_score?: number;
  interview_avg_score?: number;
  interview_max_score?: number;
}

export interface UpdateGkGangweiParams {
  // 基础标识
  year?: number;
  position_code?: string;
  serial_no?: string;
  // 部门信息
  dept_code?: string;
  dept_name?: string;
  bureau?: string;
  org_nature?: string;
  org_level?: string;
  dept_website?: string;
  // 职位信息
  position_name?: string;
  position_attr?: string;
  position_intro?: string;
  recruit_num?: number;
  recruit_scope?: string;
  exam_category?: string;
  job_rank?: string;
  // 报考条件
  major?: string;
  education?: string;
  degree?: string;
  edu_type?: string;
  politics?: string;
  age_requirement?: string;
  gender_requirement?: string;
  ethnicity_requirement?: string;
  grassroots_years?: string;
  grassroots_project?: string;
  special_position?: string;
  other_requirement?: string;
  // 地点信息
  region?: string;
  work_location?: string;
  settlement_location?: string;
  // 面试相关
  interview_ratio?: string;
  has_professional_test?: string;
  // 联系方式
  phone1?: string;
  phone2?: string;
  phone3?: string;
  remark?: string;
  // 统计字段
  exam_type?: string;
  apply_count?: number;
  pass_count?: number;
  competition_ratio?: string;
  written_min_score?: number;
  written_avg_score?: number;
  written_max_score?: number;
  interview_min_score?: number;
  interview_avg_score?: number;
  interview_max_score?: number;
}

export interface GkGangweiPaginationResponse {
  items: GkGangweiResult[];
  total: number;
  page: number;
  size: number;
}

// 获取岗位列表（分页）
export async function getGkGangweiListApi(params?: GkGangweiParams) {
  return requestClient.get<GkGangweiPaginationResponse>('/api/v1/gk/gangwei', {
    params,
  });
}

// 获取岗位详情
export async function getGkGangweiDetailApi(id: number) {
  return requestClient.get<GkGangweiResult>(`/api/v1/gk/gangwei/${id}`);
}

// 创建岗位
export async function createGkGangweiApi(data: CreateGkGangweiParams) {
  return requestClient.post('/api/v1/gk/gangwei', data);
}

// 更新岗位
export async function updateGkGangweiApi(
  id: number,
  data: UpdateGkGangweiParams,
) {
  return requestClient.put(`/api/v1/gk/gangwei/${id}`, data);
}

// 删除岗位
export async function deleteGkGangweiApi(ids: number[]) {
  return requestClient.delete('/api/v1/gk/gangwei', { data: { ids } });
}

// ==================== 公考岗位导入 ====================
export interface ParseFileHeaderResult {
  file_key: string;
  raw_rows: string[][]; // 原始行（供选择表头）
  header_row: number; // 当前表头行
  headers: string[];
  preview_data: Record<string, any>[];
  total_rows: number;
  db_fields: {
    field: string;
    label: string;
    options?: string[];
    required: boolean;
  }[];
  suggested_mappings: { db_field: string; file_column: string }[];
}

export interface FieldMappingItem {
  db_field: string;
  file_column?: string;
  file_columns?: string[]; // 多选（备注字段用）
  fixed_value?: string;
}

export interface ImportWithMappingParams {
  file_key: string;
  header_row: number; // 表头所在行
  mappings: FieldMappingItem[];
  preview?: boolean; // 预览模式
}

export interface ImportGangweiResult {
  total: number;
  success: number;
  skipped: number;
  failed: number;
  errors: string[];
}

// 导入超时时间：10 分钟
const IMPORT_TIMEOUT = 10 * 60 * 1000;

// 解析导入文件表头
export async function parseGkGangweiImportFileApi(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post<ParseFileHeaderResult>(
    '/api/v1/gk/gangwei/import/parse',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: IMPORT_TIMEOUT,
    },
  );
}

// 重新解析表头（切换表头行）
export async function reparseGkGangweiImportFileApi(
  fileKey: string,
  headerRow: number,
) {
  return requestClient.post<ParseFileHeaderResult>(
    '/api/v1/gk/gangwei/import/reparse',
    null,
    {
      params: { file_key: fileKey, header_row: headerRow },
      timeout: IMPORT_TIMEOUT,
    },
  );
}

// 执行带映射的导入
export async function executeGkGangweiImportApi(data: ImportWithMappingParams) {
  return requestClient.post<ImportGangweiResult>(
    '/api/v1/gk/gangwei/import/execute',
    data,
    { timeout: IMPORT_TIMEOUT },
  );
}

// ==================== 公考岗位分数导入 ====================
export interface ImportScoreResult {
  total: number; // 原始行数
  positions: number; // 聚合后岗位数
  updated: number;
  not_found: number;
  failed: number;
  errors: string[];
}

// 解析分数导入文件表头
export async function parseGkScoreImportFileApi(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post<ParseFileHeaderResult>(
    '/api/v1/gk/gangwei/score/import/parse',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: IMPORT_TIMEOUT,
    },
  );
}

// 重新解析分数导入表头（切换表头行）
export async function reparseGkScoreImportFileApi(
  fileKey: string,
  headerRow: number,
) {
  return requestClient.post<ParseFileHeaderResult>(
    '/api/v1/gk/gangwei/score/import/reparse',
    null,
    {
      params: { file_key: fileKey, header_row: headerRow },
      timeout: IMPORT_TIMEOUT,
    },
  );
}

// 执行分数导入
export async function executeGkScoreImportApi(data: ImportWithMappingParams) {
  return requestClient.post<ImportScoreResult>(
    '/api/v1/gk/gangwei/score/import/execute',
    data,
    { timeout: IMPORT_TIMEOUT },
  );
}

// ==================== 公考时评管理 ====================
export interface GkShipingParams {
  title?: string;
  source?: string;
  author?: string;
  keywords?: string;
  daily_date?: string;
  page?: number;
  size?: number;
}

export interface GkShipingResult {
  id: number;
  title: string;
  source?: string;
  author?: string;
  keywords?: string;
  daily_date?: string;
  content?: string;
  sidebar?: string;
  mind_map?: string;
  view_count: number;
  created_time: string;
  updated_time?: string;
  created_by: number;
  updated_by?: number;
}

export interface GkShipingPaginationResponse {
  items: GkShipingResult[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface CreateGkShipingParams {
  title: string;
  source?: string;
  author?: string;
  keywords?: string;
  daily_date?: string;
  content?: string;
  sidebar?: string;
  mind_map?: string;
}

export interface UpdateGkShipingParams {
  title?: string;
  source?: string;
  author?: string;
  keywords?: string;
  daily_date?: string;
  content?: string;
  sidebar?: string;
  mind_map?: string;
}

// 获取时评列表
export async function getGkShipingListApi(params?: GkShipingParams) {
  return requestClient.get<GkShipingPaginationResponse>('/api/v1/gk/shiping', {
    params,
  });
}

// 获取时评详情
export async function getGkShipingDetailApi(id: number) {
  return requestClient.get<GkShipingResult>(`/api/v1/gk/shiping/${id}`);
}

// 创建时评
export async function createGkShipingApi(data: CreateGkShipingParams) {
  return requestClient.post('/api/v1/gk/shiping', data);
}

// 更新时评
export async function updateGkShipingApi(
  id: number,
  data: UpdateGkShipingParams,
) {
  return requestClient.put(`/api/v1/gk/shiping/${id}`, data);
}

// 删除时评
export async function deleteGkShipingApi(ids: number[]) {
  return requestClient.delete('/api/v1/gk/shiping', { data: { ids } });
}

// 增加时评阅读量
export async function incrementGkShipingViewApi(id: number) {
  return requestClient.post(`/api/v1/gk/shiping/${id}/view`);
}

// ==================== 公考时政管理 ====================
export interface GkShizhenParams {
  daily_date?: string;
  page?: number;
  size?: number;
}

export interface GkShizhenResult {
  id: number;
  daily_date?: string;
  original?: string;
  summary?: string;
  created_time: string;
  updated_time?: string;
  created_by: number;
  updated_by?: number;
}

export interface GkShizhenPaginationResponse {
  items: GkShizhenResult[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface CreateGkShizhenParams {
  daily_date?: string;
  original?: string;
  summary?: string;
}

export interface UpdateGkShizhenParams {
  daily_date?: string;
  original?: string;
  summary?: string;
}

// 获取时政列表
export async function getGkShizhenListApi(params?: GkShizhenParams) {
  return requestClient.get<GkShizhenPaginationResponse>('/api/v1/gk/shizhen', {
    params,
  });
}

// 获取时政详情
export async function getGkShizhenDetailApi(id: number) {
  return requestClient.get<GkShizhenResult>(`/api/v1/gk/shizhen/${id}`);
}

// 创建时政
export async function createGkShizhenApi(data: CreateGkShizhenParams) {
  return requestClient.post('/api/v1/gk/shizhen', data);
}

// 更新时政
export async function updateGkShizhenApi(
  id: number,
  data: UpdateGkShizhenParams,
) {
  return requestClient.put(`/api/v1/gk/shizhen/${id}`, data);
}

// 删除时政
export async function deleteGkShizhenApi(ids: number[]) {
  return requestClient.delete('/api/v1/gk/shizhen', { data: { ids } });
}

// ==================== 公考真题管理 ====================
export interface GkZhentiQuestionParams {
  title?: string;
  type?: string;
  category_id?: number;
  material_id?: number;
  year?: number;
  source?: string;
  status?: boolean;
  page?: number;
  size?: number;
}

export interface GkZhentiQuestionResult {
  id: number;
  title: string;
  type: string;
  category_id: number;
  material_ids?: number[];
  difficulty?: number;
  year?: number;
  source?: string;
  tags?: string[];
  score?: number;
  view_count: number;
  status: boolean;
  sort_order: number;
  created_time: string;
  updated_time?: string;
  created_by: number;
  updated_by?: number;
}

export interface GkZhentiQuestionPaginationResponse {
  items: GkZhentiQuestionResult[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface CreateGkZhentiQuestionParams {
  title: string;
  type: string;
  category_id: number;
  material_ids?: number[];
  difficulty?: number;
  year?: number;
  source?: string;
  tags?: string[];
  score?: number;
  status?: boolean;
  sort_order?: number;
}

export interface UpdateGkZhentiQuestionParams {
  title?: string;
  type?: string;
  category_id?: number;
  material_ids?: number[];
  difficulty?: number;
  year?: number;
  source?: string;
  tags?: string[];
  score?: number;
  status?: boolean;
  sort_order?: number;
}

// 获取真题列表
export async function getGkZhentiQuestionListApi(
  params?: GkZhentiQuestionParams,
) {
  return requestClient.get<GkZhentiQuestionPaginationResponse>(
    '/api/v1/gk/zhenti/question',
    { params },
  );
}

// 获取真题详情
export async function getGkZhentiQuestionDetailApi(id: number) {
  return requestClient.get<GkZhentiQuestionResult>(
    `/api/v1/gk/zhenti/question/${id}`,
  );
}

// 创建真题
export async function createGkZhentiQuestionApi(
  data: CreateGkZhentiQuestionParams,
) {
  return requestClient.post('/api/v1/gk/zhenti/question', data);
}

// 更新真题
export async function updateGkZhentiQuestionApi(
  id: number,
  data: UpdateGkZhentiQuestionParams,
) {
  return requestClient.put(`/api/v1/gk/zhenti/question/${id}`, data);
}

// 删除真题
export async function deleteGkZhentiQuestionApi(ids: number[]) {
  return requestClient.delete('/api/v1/gk/zhenti/question', { data: { ids } });
}

// ==================== 公考真题材料管理 ====================
export interface GkZhentiMaterialParams {
  title?: string;
  category_id?: number;
  year?: number;
  source?: string;
  status?: boolean;
  page?: number;
  size?: number;
}

export interface GkZhentiMaterialResult {
  id: number;
  title: string;
  content: string;
  category_id: number;
  year?: number;
  source?: string;
  tags?: string[];
  view_count: number;
  status: boolean;
  sort_order: number;
  created_time: string;
  updated_time?: string;
  created_by: number;
  updated_by?: number;
}

export interface GkZhentiMaterialPaginationResponse {
  items: GkZhentiMaterialResult[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface CreateGkZhentiMaterialParams {
  title: string;
  content: string;
  category_id: number;
  year?: number;
  source?: string;
  tags?: string[];
  status?: boolean;
  sort_order?: number;
}

export interface UpdateGkZhentiMaterialParams {
  title?: string;
  content?: string;
  category_id?: number;
  year?: number;
  source?: string;
  tags?: string[];
  status?: boolean;
  sort_order?: number;
}

// 获取材料列表
export async function getGkZhentiMaterialListApi(
  params?: GkZhentiMaterialParams,
) {
  return requestClient.get<GkZhentiMaterialPaginationResponse>(
    '/api/v1/gk/zhenti/material',
    { params },
  );
}

// 获取材料详情
export async function getGkZhentiMaterialDetailApi(id: number) {
  return requestClient.get<GkZhentiMaterialResult>(
    `/api/v1/gk/zhenti/material/${id}`,
  );
}

// 创建材料
export async function createGkZhentiMaterialApi(
  data: CreateGkZhentiMaterialParams,
) {
  return requestClient.post('/api/v1/gk/zhenti/material', data);
}

// 更新材料
export async function updateGkZhentiMaterialApi(
  id: number,
  data: UpdateGkZhentiMaterialParams,
) {
  return requestClient.put(`/api/v1/gk/zhenti/material/${id}`, data);
}

// 删除材料
export async function deleteGkZhentiMaterialApi(ids: number[]) {
  return requestClient.delete('/api/v1/gk/zhenti/material', { data: { ids } });
}

// ==================== 公考真题答案管理 ====================
export interface GkZhentiAnswerResult {
  id: number;
  question_id: number;
  source: string;
  answer_keys?: string;
  answer?: string;
  analysis?: string;
  analysis_video_url?: string;
  knowledge_points?: string[];
  reference_materials?: string;
  is_official: boolean;
  created_time: string;
  updated_time?: string;
}

export interface CreateGkZhentiAnswerParams {
  question_id: number;
  source: string;
  answer_keys?: string;
  answer?: string;
  analysis?: string;
  analysis_video_url?: string;
  knowledge_points?: string[];
  reference_materials?: string;
  is_official?: boolean;
}

export interface UpdateGkZhentiAnswerParams {
  source?: string;
  answer_keys?: string;
  answer?: string;
  analysis?: string;
  analysis_video_url?: string;
  knowledge_points?: string[];
  reference_materials?: string;
  is_official?: boolean;
}

// 获取题目的所有答案
export async function getGkZhentiAnswersByQuestionApi(questionId: number) {
  return requestClient.get<GkZhentiAnswerResult[]>(
    `/api/v1/gk/zhenti/answer/question/${questionId}`,
  );
}

// 创建答案
export async function createGkZhentiAnswerApi(
  data: CreateGkZhentiAnswerParams,
) {
  return requestClient.post('/api/v1/gk/zhenti/answer', data);
}

// 更新答案
export async function updateGkZhentiAnswerApi(
  id: number,
  data: UpdateGkZhentiAnswerParams,
) {
  return requestClient.put(`/api/v1/gk/zhenti/answer/${id}`, data);
}

// 删除答案
export async function deleteGkZhentiAnswerApi(ids: number[]) {
  return requestClient.delete('/api/v1/gk/zhenti/answer', { data: { ids } });
}

// ==================== 公考分类管理 ====================
export interface GkCategoryParams {
  name?: string;
  type?: string;
  page?: number;
  size?: number;
}

export interface GkCategoryResult {
  id: number;
  name: string;
  type: string;
  description?: string;
  sort_order: number;
  created_time: string;
  updated_time?: string;
}

export interface GkCategoryPaginationResponse {
  items: GkCategoryResult[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface CreateGkCategoryParams {
  name: string;
  type: string;
  description?: string;
  sort_order?: number;
}

export interface UpdateGkCategoryParams {
  name?: string;
  type?: string;
  description?: string;
  sort_order?: number;
}

// 获取分类列表
export async function getGkCategoryListApi(params?: GkCategoryParams) {
  return requestClient.get<GkCategoryPaginationResponse>(
    '/api/v1/gk/category',
    { params },
  );
}

// 获取分类树
export async function getGkCategoryTreeApi(params?: GkCategoryParams) {
  return requestClient.get<GkCategoryResult[]>('/api/v1/gk/category/tree', {
    params,
  });
}

// 获取分类详情
export async function getGkCategoryDetailApi(id: number) {
  return requestClient.get<GkCategoryResult>(`/api/v1/gk/category/${id}`);
}

// 创建分类
export async function createGkCategoryApi(data: CreateGkCategoryParams) {
  return requestClient.post('/api/v1/gk/category', data);
}

// 更新分类
export async function updateGkCategoryApi(
  id: number,
  data: UpdateGkCategoryParams,
) {
  return requestClient.put(`/api/v1/gk/category/${id}`, data);
}

// 删除分类
export async function deleteGkCategoryApi(ids: number[]) {
  return requestClient.delete('/api/v1/gk/category', { data: { ids } });
}

// ==================== 官媒学言语管理 ====================
export interface GkGuanmeiParams {
  daily_date?: string;
  page?: number;
  size?: number;
}

export interface GkGuanmeiResult {
  id: number;
  daily_date?: string;
  left_content?: string;
  right_content?: string;
  view_count: number;
  created_time: string;
  updated_time?: string;
  created_by: number;
  updated_by?: number;
}

export interface GkGuanmeiPaginationResponse {
  items: GkGuanmeiResult[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface CreateGkGuanmeiParams {
  daily_date?: string;
  left_content?: string;
  right_content?: string;
}

export interface UpdateGkGuanmeiParams {
  daily_date?: string;
  left_content?: string;
  right_content?: string;
}

// 获取官媒学言语列表
export async function getGkGuanmeiListApi(params?: GkGuanmeiParams) {
  return requestClient.get<GkGuanmeiPaginationResponse>('/api/v1/gk/guanmei', {
    params,
  });
}

// 获取官媒学言语详情
export async function getGkGuanmeiDetailApi(id: number) {
  return requestClient.get<GkGuanmeiResult>(`/api/v1/gk/guanmei/${id}`);
}

// 创建官媒学言语
export async function createGkGuanmeiApi(data: CreateGkGuanmeiParams) {
  return requestClient.post('/api/v1/gk/guanmei', data);
}

// 更新官媒学言语
export async function updateGkGuanmeiApi(
  id: number,
  data: UpdateGkGuanmeiParams,
) {
  return requestClient.put(`/api/v1/gk/guanmei/${id}`, data);
}

// 删除官媒学言语
export async function deleteGkGuanmeiApi(ids: number[]) {
  return requestClient.delete('/api/v1/gk/guanmei', { data: { ids } });
}

// 增加官媒学言语阅读量
export async function incrementGkGuanmeiViewApi(id: number) {
  return requestClient.post(`/api/v1/gk/guanmei/${id}/view`);
}

// ==================== 公考资料管理 ====================

export async function uploadGkResourceFileApi(file: File, categoryId: number) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post<{
    file_type: string;
    filename: string;
    path: string;
    size: number;
    url: string;
  }>('/api/v1/gk/resource/upload', formData, {
    params: { category_id: categoryId },
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
