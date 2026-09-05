import { requestClient } from '#/api/request';

export interface CreateQuestionInteractionParam {
  interaction_key: string;
  interaction_type: string;
  instruction: string;
  title?: string;
  question_material_id?: number;
  selection_mode?: 'multi_role' | 'multiple' | 'single';
  min_selections?: number;
  max_selections?: number;
  config?: Record<string, any>;
  candidates?: any[];
  status?: 'active' | 'draft' | 'retired';
}

export interface UpdateQuestionInteractionParam {
  instruction?: string;
  title?: string;
  question_material_id?: null | number;
  material_revision_id?: null | number;
  selection_mode?: 'multi_role' | 'multiple' | 'single';
  min_selections?: number;
  max_selections?: null | number;
  config?: Record<string, any>;
  status?: 'active' | 'draft' | 'retired';
  candidates?: any[];
}

export interface GetQuestionInteractionDetail {
  id: number;
  question_id: number;
  interaction_key: string;
  interaction_type: string;
  instruction: string;
  title?: string;
  question_material_id?: number;
  material_revision_id?: number;
  selection_mode: string;
  min_selections: number;
  max_selections?: number;
  config: Record<string, any>;
  status: string;
  candidates?: {
    anchor_id: number;
    anchor_text?: string;
    candidate_role: string;
    id: number;
    label?: string;
    sort_order: number;
  }[];
  created_time?: string;
  updated_time?: string;
}

export async function getQuestionInteractionsApi(params?: {
  interaction_type?: string;
  material_id?: number;
  question_id?: number;
  status?: string;
}) {
  return requestClient.get<GetQuestionInteractionDetail[]>(
    '/api/v1/qbank-v2/questions/interactions',
    { params },
  );
}

export async function createQuestionInteractionApi(
  questionId: number,
  data: CreateQuestionInteractionParam,
) {
  return requestClient.post<GetQuestionInteractionDetail>(
    `/api/v1/qbank-v2/questions/${questionId}/interactions`,
    data,
  );
}

export async function updateQuestionInteractionApi(
  questionId: number,
  interactionId: number,
  data: UpdateQuestionInteractionParam,
) {
  return requestClient.put<GetQuestionInteractionDetail>(
    `/api/v1/qbank-v2/questions/${questionId}/interactions/${interactionId}`,
    data,
  );
}

export async function deleteQuestionInteractionApi(
  questionId: number,
  interactionId: number,
) {
  return requestClient.delete(
    `/api/v1/qbank-v2/questions/${questionId}/interactions/${interactionId}`,
  );
}
