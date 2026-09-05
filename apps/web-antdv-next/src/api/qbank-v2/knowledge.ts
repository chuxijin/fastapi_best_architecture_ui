import type { PaginationResult } from '#/types/pagination';

import { requestClient } from '#/api/request';

export type KnowledgeSystemStatus = 'active' | 'archived' | 'draft';
export type KnowledgePointRole = 'prerequisite' | 'primary' | 'secondary';
export type KnowledgePointSource = 'ai' | 'import' | 'manual';

export interface CreateKnowledgeSystemParam {
  code: string;
  name: string;
  version: string;
  description?: string;
}

export interface UpdateKnowledgeSystemParam {
  name?: string;
  description?: null | string;
  status?: KnowledgeSystemStatus;
}

export interface GetKnowledgeSystemListItem {
  id: number;
  code: string;
  name: string;
  version: string;
  description?: string;
  status: KnowledgeSystemStatus;
  created_time: string;
  updated_time: string;
}

export interface CreateKnowledgePointParam {
  code: string;
  name: string;
  parent_id?: number;
  sort_order?: number;
  description?: string;
}

export interface UpdateKnowledgePointParam {
  name?: string;
  parent_id?: null | number;
  sort_order?: number;
  description?: null | string;
}

export interface GetKnowledgePointTreeNode {
  id: number;
  system_id: number;
  code: string;
  name: string;
  parent_id?: number;
  path?: string;
  depth: number;
  sort_order: number;
  description?: string;
  question_count?: number;
  mastered_count?: number;
  children?: GetKnowledgePointTreeNode[];
}

export interface GetKnowledgePointDetail {
  id: number;
  system_id: number;
  code: string;
  name: string;
  parent_id?: number;
  path?: string;
  depth: number;
  sort_order: number;
  description?: string;
  children: GetKnowledgePointTreeNode[];
  question_count: number;
  mastered_count: number;
}

export interface KnowledgePointAssignmentParam {
  knowledge_point_ids: number[];
  role?: KnowledgePointRole;
  weight?: number;
  source?: KnowledgePointSource;
  confidence?: number;
}

export interface GetKnowledgePointAssignmentDetail {
  id: number;
  question_id: number;
  knowledge_point_id: number;
  knowledge_point_name: string;
  system_name: string;
  role: string;
  weight: number;
  source: string;
  confidence?: number;
}

export async function getKnowledgeSystemsApi(params?: {
  code?: string;
  domain_category_id?: number;
  page?: number;
  size?: number;
}) {
  return requestClient.get<PaginationResult<GetKnowledgeSystemListItem>>(
    '/api/v1/qbank-v2/knowledge-systems',
    { params },
  );
}

export async function createKnowledgeSystemApi(
  data: CreateKnowledgeSystemParam,
) {
  return requestClient.post<GetKnowledgeSystemListItem>(
    '/api/v1/qbank-v2/knowledge-systems',
    data,
  );
}

export async function updateKnowledgeSystemApi(
  pk: number,
  data: UpdateKnowledgeSystemParam,
) {
  return requestClient.put<GetKnowledgeSystemListItem>(
    `/api/v1/qbank-v2/knowledge-systems/${pk}`,
    data,
  );
}

export async function getKnowledgeTreeApi(
  systemId: number,
  bankId: number,
  rootId?: number,
) {
  return requestClient.get<GetKnowledgePointTreeNode[]>(
    `/api/v1/qbank-v2/knowledge-systems/${systemId}/tree`,
    { params: { bank_id: bankId, root_id: rootId } },
  );
}

export async function getKnowledgePointApi(pointId: number, bankId: number) {
  return requestClient.get<GetKnowledgePointDetail>(
    `/api/v1/qbank-v2/knowledge-points/${pointId}`,
    { params: { bank_id: bankId } },
  );
}

export async function getKnowledgePointsTreeApi(systemId: number) {
  return requestClient.get<{ points: GetKnowledgePointTreeNode[] }>(
    `/api/v1/qbank-v2/knowledge-systems/${systemId}/points`,
  );
}

export async function createKnowledgePointApi(
  systemId: number,
  data: CreateKnowledgePointParam,
) {
  return requestClient.post<GetKnowledgePointTreeNode>(
    `/api/v1/qbank-v2/knowledge-systems/${systemId}/points`,
    data,
  );
}

export async function updateKnowledgePointApi(
  pointId: number,
  data: UpdateKnowledgePointParam,
) {
  return requestClient.put<GetKnowledgePointTreeNode>(
    `/api/v1/qbank-v2/knowledge-points/${pointId}`,
    data,
  );
}

export async function deleteKnowledgePointApi(pointId: number) {
  return requestClient.delete(`/api/v1/qbank-v2/knowledge-points/${pointId}`);
}
