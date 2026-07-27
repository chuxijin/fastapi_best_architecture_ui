import { requestClient } from './request';

export interface HaloDocProjectResult {
  name: string;
  display_name: string;
  slug: string;
  preferred_version_name: string;
}

export interface HaloDocProjectVersionResult {
  name: string;
  project_name: string;
  slug: string;
  publish: boolean;
}

export interface HaloDocTreeNodeResult {
  name: string;
  title: string;
  slug: string;
  type: 'DOC' | 'TREE' | string;
  permalink: string;
  doc_name: string;
  project_version_name: string;
  path: string;
  children: HaloDocTreeNodeResult[];
}

export interface HaloDocDetailResult {
  name: string;
  doc_tree_name: string;
  doc_name: string;
  title: string;
  permalink: string;
  url: string;
  content: string;
  raw: string;
  raw_type: string;
  updated_at?: string;
}

export interface HaloDocPreviewResult {
  name: string;
  title: string;
  url: string;
  html: string;
}

export async function getHaloDocProjectsApi() {
  return requestClient.get<HaloDocProjectResult[]>(
    '/api/v1/halo/docs/projects',
  );
}

export async function getHaloDocProjectVersionsApi(projectName: string) {
  return requestClient.get<HaloDocProjectVersionResult[]>(
    `/api/v1/halo/docs/projects/${projectName}/versions`,
  );
}

export async function getHaloDocTreeApi(params?: {
  project_version_name?: string;
}) {
  return requestClient.get<HaloDocTreeNodeResult[]>('/api/v1/halo/docs/tree', {
    params,
  });
}

export async function getHaloDocDetailApi(name: string) {
  return requestClient.get<HaloDocDetailResult>(`/api/v1/halo/docs/${name}`);
}

export async function getHaloDocPreviewApi(name: string) {
  return requestClient.get<HaloDocPreviewResult>(
    `/api/v1/halo/docs/${name}/preview`,
  );
}
