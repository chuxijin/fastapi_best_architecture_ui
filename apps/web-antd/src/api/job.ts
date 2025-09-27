import type { PageData } from '#/api';

import { requestClient } from './request';

export interface JobSearchParams {
  company_name?: string;
  position?: string;
  industry?: string;
  recruitment_type?: string;
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
  ids: number[];
}

// 新增：投递记录接口类型
export interface JobApplicationResult {
  id: number;
  job_posting_id: number;
  application_status: number;
}

/**
 * 分页查询岗位
 */
export async function getJobPostingListApi(params: JobSearchParams) {
  return requestClient.get<PageData<JobPostingResult>>('/api/v1/job_postings', {
    params,
  });
}

// 新增：获取我的投递记录 API
export async function getMyJobApplicationsApi(params: {
  application_status?: number;
  page?: number;
  page_size?: number;
}) {
  // 修正：size 改为 page_size
  return requestClient.get<PageData<JobApplicationResult>>(
    '/api/v1/job_applications',
    {
      params,
    },
  );
}

// 新增：更新投递状态 API
export async function updateJobApplicationStatusApi(
  pk: number, // job_application_id
  application_status: number, // 修正：从 status 改为 application_status
) {
  return requestClient.put(`/api/v1/job_applications/${pk}`, {
    application_status,
  }); // 修正：传入 body 而不是 params
}

export async function createJobApplicationApi(
  job_posting_id: number, // 修正：从 job_id 改为 job_posting_id
  application_status: number, // 修正：从 status 改为 application_status
) {
  return requestClient.post('/api/v1/job_applications', {
    job_posting_id,
    application_status,
  });
}

/**
 * 创建岗位
 */
export async function createJobPostingApi(data: CreateJobPostingParams) {
  return requestClient.post('/api/v1/job_postings', data);
}

/**
 * 更新岗位
 */
export async function updateJobPostingApi(
  pk: number,
  data: UpdateJobPostingParams,
) {
  return requestClient.put(`/api/v1/job_postings/${pk}`, data);
}

/**
 * 批量删除岗位
 */
export async function deleteJobPostingApi(data: DeleteJobPostingParams) {
  return requestClient.delete('/api/v1/job_postings', { data });
}
