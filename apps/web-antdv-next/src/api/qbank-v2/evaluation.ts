import { requestClient } from '#/api/request';

export interface TriggerEvaluationParam {
  provider?: string;
  model_name?: string;
  force?: boolean;
}

export interface SubjectiveAnswerOCRResult {
  attempt_id: number;
  status: string;
  images: {
    confidence: number;
    page: number;
    text: string;
  }[];
}

export interface EvaluationRunRead {
  id: number;
  purpose: string;
  engine_type: string;
  attempt_id?: number;
  session_id?: number;
  status: string;
  provider?: string;
  model_name?: string;
  score?: number;
  max_score?: number;
  confidence?: number;
  summary_text?: string;
  error_code?: string;
  error_message?: string;
  started_time?: string;
  finished_time?: string;
  created_time: string;
}

export interface GetAttemptEvaluationResult {
  attempt_id: number;
  evaluation: EvaluationRunRead;
  is_correct?: boolean;
  score?: number;
  max_score: number;
  feedback?: string;
}

export interface GetSessionEvaluationSummary {
  session_key: string;
  summary_text?: string;
  evaluation: EvaluationRunRead;
}

export async function subjectiveAnswerOcrApi(files: File[]) {
  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));
  return requestClient.post<SubjectiveAnswerOCRResult>(
    '/api/v1/qbank-v2/evaluations/ocr',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
}

export async function getAttemptEvaluationApi(attemptId: number) {
  return requestClient.get<GetAttemptEvaluationResult>(
    `/api/v1/qbank-v2/evaluations/attempts/${attemptId}`,
  );
}

export async function judgeAttemptApi(
  attemptId: number,
  data: TriggerEvaluationParam,
) {
  return requestClient.post<EvaluationRunRead>(
    `/api/v1/qbank-v2/evaluations/attempts/${attemptId}/judge`,
    data,
  );
}

export async function startShenlunAgentApi(attemptId: number) {
  return requestClient.post<EvaluationRunRead>(
    `/api/v1/qbank-v2/evaluations/attempts/${attemptId}/shenlun-agent`,
  );
}

export async function getShenlunAgentApi(taskId: number) {
  return requestClient.get<EvaluationRunRead>(
    `/api/v1/qbank-v2/evaluations/agents/${taskId}`,
  );
}

export async function judgeSessionSubjectiveApi(
  sessionKey: string,
  data: TriggerEvaluationParam,
) {
  return requestClient.post<EvaluationRunRead[]>(
    `/api/v1/qbank-v2/evaluations/sessions/${sessionKey}/judge-subjective`,
    data,
  );
}

export async function getSessionEvaluationSummaryApi(sessionKey: string) {
  return requestClient.get<GetSessionEvaluationSummary>(
    `/api/v1/qbank-v2/evaluations/sessions/${sessionKey}/summary`,
  );
}

export async function generateSessionEvaluationSummaryApi(
  sessionKey: string,
  data: TriggerEvaluationParam,
) {
  return requestClient.post<EvaluationRunRead>(
    `/api/v1/qbank-v2/evaluations/sessions/${sessionKey}/summary`,
    data,
  );
}
