import { requestClient } from './request';

export interface PageData<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
  links: any;
}

export interface JobSearchParams {
  company_name?: string;
  company_type?: string;
  work_location?: string;
  recruitment_object?: string;
  position?: string;
  industry?: string;
  recruitment_type?: string;
  page?: number;
  page_size?: number;
}

export interface JobPostingResult {
  id: number;
  company_name: string;
  company_type?: string;
  industry?: string;
  recruitment_type?: string;
  work_location?: string;
  recruitment_object?: string;
  position: string;
  delivery_start?: string;
  delivery_end?: string;
  delivery_link?: string;
  recruitment_announcement?: string;
  referral_code?: string;
  remark?: string;
  salary_range?: string;
  is_exempt_from_written_test?: boolean;
  logo_url?: string;
}

export interface CreateJobPostingParams {
  company_name: string;
  company_type?: string;
  industry?: string;
  recruitment_type?: string;
  work_location?: string;
  recruitment_object?: string;
  position: string;
  delivery_start?: string;
  delivery_end?: string;
  delivery_link?: string;
  recruitment_announcement?: string;
  referral_code?: string;
  remark?: string;
  salary_range?: string;
  is_exempt_from_written_test?: boolean;
  logo_url?: string;
}

export interface UpdateJobPostingParams {
  company_name?: string;
  company_type?: string;
  industry?: string;
  recruitment_type?: string;
  work_location?: string;
  recruitment_object?: string;
  position?: string;
  delivery_start?: string;
  delivery_end?: string;
  delivery_link?: string;
  recruitment_announcement?: string;
  referral_code?: string;
  remark?: string;
  salary_range?: string;
  is_exempt_from_written_test?: boolean;
  logo_url?: string;
}

export interface DeleteJobPostingParams {
  pks: number[];
}

// 新增：删除投递记录参数
export interface DeleteJobApplicationParams {
  pks: number[];
}

// 新增：投递记录接口类型
export interface JobApplicationResult {
  id: number;
  job_posting_id: number;
  application_status: string; // 修正：从 number 改为 string，因为后端返回的是枚举字符串
}

/**
 * 分页查询岗位
 */
export async function getJobPostingListApi(params: JobSearchParams) {
  return requestClient.get<PageData<JobPostingResult>>('/api/v1/job/posting', {
    params,
  });
}

// 新增：获取我的投递记录 API
export async function getMyJobApplicationsApi(params: {
  application_status?: string; // 修正：从 number 改为 string
  page?: number;
  page_size?: number;
}) {
  return requestClient.get<PageData<JobApplicationResult>>(
    '/api/v1/job/application',
    {
      params,
    },
  );
}

// 新增：更新投递状态 API
export async function updateJobApplicationStatusApi(
  pk: number, // job_application_id
  application_status: string, // 修正：从 number 改为 string
) {
  return requestClient.put(`/api/v1/job/application/${pk}`, {
    application_status,
  }); // 修正：传入 body 而不是 params
}

export async function createJobApplicationApi(
  job_posting_id: number, // 修正：从 job_id 改为 job_posting_id
  application_status: string, // 修正：从 number 改为 string
) {
  return requestClient.post('/api/v1/job/application', {
    job_posting_id,
    application_status,
  });
}

// 新增：批量删除投递记录 API
export async function deleteJobApplicationApi(
  data: DeleteJobApplicationParams,
) {
  return requestClient.delete('/api/v1/job/application', { data });
}

/**
 * 创建岗位
 */
export async function createJobPostingApi(data: CreateJobPostingParams) {
  return requestClient.post('/api/v1/job/posting', data);
}

/**
 * 更新岗位
 */
export async function updateJobPostingApi(
  pk: number,
  data: UpdateJobPostingParams,
) {
  return requestClient.put(`/api/v1/job/posting/${pk}`, data);
}

/**
 * 批量删除岗位
 */
export async function deleteJobPostingApi(data: DeleteJobPostingParams) {
  return requestClient.delete('/api/v1/job/posting', { data });
}

// 解析/提交导入
export async function parseJobImportHtml(html: string) {
  return requestClient.post<{ code: number; data: CreateJobPostingParams[] }>(
    '/api/v1/job/import/parse',
    { html },
  );
}

export async function commitJobImportHtml(html: string) {
  return requestClient.post<{ code: number }>('/api/v1/job/import/commit', {
    html,
  });
}
