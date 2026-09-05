import type { PaginationResult } from '#/types';

import { requestClient } from '#/api/request';

export type QbankV2QuestionType =
  | 'composite'
  | 'fill_blank'
  | 'interactive'
  | 'multiple_choice'
  | 'short_answer'
  | 'single_choice'
  | 'true_false';
export type QuestionOrigin =
  | 'curated'
  | 'generated'
  | 'imported'
  | 'user_created';
export type QuestionVisibility = 'internal' | 'private' | 'public';
export type QuestionStatus = 'active' | 'archived' | 'disabled';
export type ContentFormat = 'html' | 'json' | 'markdown' | 'plain';
export type ExplanationType = 'ai' | 'expert' | 'official' | 'user';

export interface CreateQuestionParam {
  code: string;
  stem: string;
  question_type: QbankV2QuestionType;
  options?: QuestionOption[];
  default_score?: number;
  difficulty?: number;
  visibility?: QuestionVisibility;
  origin_type?: QuestionOrigin;
  status?: QuestionStatus;
  content_format?: ContentFormat;
  answer: QuestionAnswerParam;
  explanations: QuestionExplanationParam[];
  knowledge_points?: QuestionKnowledgePoint[];
  materials?: QuestionMaterial[];
}

export interface QuestionOption {
  option_code: string;
  content: string;
  sort_order?: number;
}

export interface QuestionAnswerParam {
  answer_data: any;
  grading_method?: string;
  grading_config?: Record<string, any>;
}

export interface QuestionExplanationParam {
  content: string;
  explanation_type?: ExplanationType;
  version_no?: number;
  is_default?: boolean;
}

export interface QuestionKnowledgePoint {
  knowledge_point_id: number;
  role?: 'prerequisite' | 'primary' | 'secondary';
  weight?: number;
  source?: 'ai' | 'import' | 'manual';
  confidence?: number;
}

export interface QuestionMaterial {
  material_id: number;
  material_revision_id: number;
  role?: 'attachment' | 'passage' | 'prompt' | 'reference';
  sort_order?: number;
  display_config?: Record<string, any>;
}

export interface UpdateQuestionParam {
  code?: string;
  stem?: string;
  question_type?: QbankV2QuestionType;
  options?: QuestionOption[];
  default_score?: number;
  difficulty?: null | number;
  visibility?: QuestionVisibility;
  status?: QuestionStatus;
  content_format?: ContentFormat;
  answer?: QuestionAnswerParam;
  explanations?: QuestionExplanationParam[];
  knowledge_points?: QuestionKnowledgePoint[];
  materials?: QuestionMaterial[];
}

export interface GetQuestionListItem {
  id: number;
  code: string;
  stem: string;
  question_type: QbankV2QuestionType;
  difficulty?: number;
  visibility: QuestionVisibility;
  status: QuestionStatus;
  origin_type: QuestionOrigin;
  default_score: number;
  owner_id?: number;
  created_time: string;
  updated_time: string;
}

export interface GetQuestionDetail {
  id: number;
  code: string;
  stem: string;
  question_type: QbankV2QuestionType;
  options: QuestionOption[];
  default_score: number;
  difficulty?: number;
  visibility: QuestionVisibility;
  status: QuestionStatus;
  origin_type: QuestionOrigin;
  content_format: string;
  content_hash?: string;
  owner_id?: number;
  answer?: {
    answer_data: any;
    grading_config: Record<string, any>;
    grading_method: string;
    id: number;
  };
  explanations: {
    content: string;
    explanation_type: string;
    id: number;
    is_default: boolean;
    status: string;
    version_no?: number;
  }[];
  knowledge_points: {
    id: number;
    knowledge_point_id: number;
    knowledge_point_name: string;
    role: string;
    weight: number;
  }[];
  materials: QuestionMaterial[];
  created_time: string;
  updated_time: string;
}

export interface QuestionListParams {
  page?: number;
  size?: number;
  bank_id?: number;
  bank_revision_id?: number;
  question_type?: QbankV2QuestionType;
  keyword?: string;
}

export async function qbankV2GetQuestionListApi(params: QuestionListParams) {
  return requestClient.get<PaginationResult<GetQuestionListItem>>(
    '/api/v1/qbank-v2/questions',
    { params },
  );
}

export async function getQuestionApi(pk: number) {
  return requestClient.get<GetQuestionDetail>(
    `/api/v1/qbank-v2/questions/${pk}`,
  );
}

export async function qbankV2CreateQuestionApi(data: CreateQuestionParam) {
  return requestClient.post<GetQuestionDetail>(
    '/api/v1/qbank-v2/questions',
    data,
  );
}

export async function qbankV2UpdateQuestionApi(
  pk: number,
  data: UpdateQuestionParam,
) {
  return requestClient.put<GetQuestionDetail>(
    `/api/v1/qbank-v2/questions/${pk}`,
    data,
  );
}
