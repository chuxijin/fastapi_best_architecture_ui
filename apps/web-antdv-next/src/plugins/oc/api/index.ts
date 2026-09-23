import type { PaginationResult } from '#/types';

import { requestClient } from '#/api/request';

/** 公司 */
export interface OcCompanyParams {
  name?: string;
  company_type?: string;
  industry?: string;
  location?: string;
  page?: number;
  size?: number;
}

export interface OcCompanyWebsite {
  id: number;
  url: string;
  name?: null | string;
  remark?: null | string;
  created_time: string;
}

export interface OcCompanyResult {
  id: number;
  name: string;
  short_name?: null | string;
  company_type?: null | string;
  industry?: null | string;
  company_size?: null | string;
  location?: null | string;
  extra_info: Record<string, any>;
  remark?: null | string;
  websites: OcCompanyWebsite[];
  created_time: string;
  updated_time?: null | string;
}

export interface OcCompanyForm {
  id?: number;
  name: string;
  short_name?: string;
  company_type?: string;
  industry?: string;
  company_size?: string;
  location?: string;
  remark?: string;
}

/** 网站 */
export interface OcWebsiteParams {
  company_name?: string;
  name?: string;
  url?: string;
  page?: number;
  size?: number;
}

export interface OcWebsiteResult {
  id: number;
  company_id: number;
  company_name: string;
  url: string;
  name?: null | string;
  remark?: null | string;
  created_time: string;
}

export interface OcWebsiteForm {
  id?: number;
  company_id?: number;
  url: string;
  name?: string;
  remark?: string;
}

/** 招聘公告 */
export interface OcAnnouncementParams {
  company_id?: number;
  company_name?: string;
  recruitment_type?: string;
  recruit_target?: string;
  location?: string;
  keyword?: string;
  job_category?: string;
  page?: number;
  size?: number;
}

export interface OcAnnouncementResult {
  id: number;
  company_id: number;
  title: string;
  recruitment_type: string;
  recruit_target?: null | string;
  positions?: null | string;
  start_time?: null | string;
  end_time?: null | string;
  location?: null | string;
  exam_info?: null | string;
  referral_code?: null | string;
  apply_url?: null | string;
  notice_url?: null | string;
  source_update_date?: null | string;
  remark?: null | string;
  company: {
    company_size?: null | string;
    company_type?: null | string;
    id: number;
    industry?: null | string;
    name: string;
    short_name?: null | string;
  };
  created_time: string;
  updated_time?: null | string;
}

export interface OcAnnouncementForm {
  id?: number;
  company_id: number;
  title: string;
  recruitment_type: string;
  recruit_target?: string;
  positions?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  exam_info?: string;
  referral_code?: string;
  apply_url?: string;
  notice_url?: string;
  source_update_date?: string;
  remark?: string;
}

/** 公司 API */
export async function getCompanyListApi(params: OcCompanyParams) {
  return await requestClient.get<PaginationResult<OcCompanyResult>>(
    '/api/v1/jobs/company',
    { params },
  );
}

export async function createCompanyApi(data: OcCompanyForm) {
  return await requestClient.post('/api/v1/jobs/company', data);
}

export async function updateCompanyApi(pk: number, data: OcCompanyForm) {
  return await requestClient.put(`/api/v1/jobs/company/${pk}`, data);
}

export async function deleteCompanyApi(pk: number) {
  return await requestClient.delete(`/api/v1/jobs/company/${pk}`);
}

/** 网站 API */
export async function getWebsiteListApi(params: OcWebsiteParams) {
  return await requestClient.get<PaginationResult<OcWebsiteResult>>(
    '/api/v1/jobs/website',
    { params },
  );
}

export async function createWebsiteApi(data: OcWebsiteForm) {
  return await requestClient.post('/api/v1/jobs/website', data);
}

export async function updateWebsiteApi(pk: number, data: OcWebsiteForm) {
  return await requestClient.put(`/api/v1/jobs/website/${pk}`, data);
}

export async function deleteWebsiteApi(pk: number) {
  return await requestClient.delete(`/api/v1/jobs/website/${pk}`);
}

/** 招聘公告 API */
export async function getAnnouncementListApi(params: OcAnnouncementParams) {
  return await requestClient.get<PaginationResult<OcAnnouncementResult>>(
    '/api/v1/jobs/announcement',
    { params },
  );
}

export async function createAnnouncementApi(data: OcAnnouncementForm) {
  return await requestClient.post('/api/v1/jobs/announcement', data);
}

export async function updateAnnouncementApi(
  pk: number,
  data: OcAnnouncementForm,
) {
  return await requestClient.put(`/api/v1/jobs/announcement/${pk}`, data);
}

export async function deleteAnnouncementApi(pk: number) {
  return await requestClient.delete(`/api/v1/jobs/announcement/${pk}`);
}
