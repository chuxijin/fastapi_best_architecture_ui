import { requestClient } from '#/api/request';

export type CollectSource =
  | 'adaptive'
  | 'bank'
  | 'custom'
  | 'favorite'
  | 'knowledge_point'
  | 'note'
  | 'section'
  | 'wrong';

export interface CollectQuestionsParam {
  source_type: CollectSource;
  source_ref?: string;
  bank_id?: number;
  section_ids?: number[];
  knowledge_point_ids?: number[];
  wrong_state_ids?: number[];
  favorite_ids?: number[];
  question_ids?: number[];
  count?: number;
}

export interface CollectQuestionsResult {
  question_ids: number[];
  total: number;
}

export async function collectQuestionsApi(data: CollectQuestionsParam) {
  return requestClient.post<CollectQuestionsResult>(
    '/api/v1/qbank-v2/questions/collect',
    data,
  );
}
