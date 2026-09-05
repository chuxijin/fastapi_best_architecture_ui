import { requestClient } from '#/api/request';

export type RankType = 'accuracy_rate' | 'practice_count' | 'streak_days';

export interface QuestionTypeProgress {
  question_type: string;
  total_count: number;
  answered_count: number;
  correct_count: number;
  correct_rate: number;
}

export interface BankProgressSummary {
  bank_id: number;
  bank_name: string;
  total_items: number;
  answered_items: number;
  correct_items: number;
  progress_rate: number;
  accuracy_rate: number;
}

export interface BankSectionProgress extends BankProgressSummary {
  section_id: number;
  section_name: string;
  children?: BankSectionProgress[];
}

export interface GetBankProgressDetail extends BankProgressSummary {
  children: BankSectionProgress[];
  question_type_progress: Record<string, QuestionTypeProgress>;
}

export interface WrongSectionCount {
  section_id: number;
  section_name: string;
  wrong_count: number;
  children?: WrongSectionCount[];
}

export interface GetBankWrongSectionCounts {
  bank_id: number;
  bank_name: string;
  total_wrong: number;
  sections: WrongSectionCount[];
}

export interface UserDailyPracticeDetail {
  date: string;
  attempt_count: number;
  correct_count: number;
  duration_ms: number;
}

export interface UserMonthlyPracticeDetail {
  month: string;
  attempt_count: number;
  correct_count: number;
  duration_ms: number;
}

export interface GetUserPracticeReport {
  total_attempts: number;
  total_correct: number;
  accuracy_rate: number;
  total_duration_ms: number;
  practice_days: number;
  streak_days: number;
  daily: UserDailyPracticeDetail[];
  monthly: UserMonthlyPracticeDetail[];
}

export interface PracticeRankItem {
  rank: number;
  user_id: number;
  nickname: string;
  avatar: string;
  practice_count: number;
  accuracy_rate: number;
  streak_days: number;
}

export interface GetPracticeRankList {
  ranks: PracticeRankItem[];
  total: number;
}

export interface GetCollectionProgressSummary {
  collection_id: number;
  total_banks: number;
  total_items: number;
  answered_items: number;
  correct_items: number;
  progress_rate: number;
  accuracy_rate: number;
  bank_progress: BankProgressSummary[];
}

export async function getCollectionProgressSummaryApi(
  collectionId: number,
  includeDescendants = true,
) {
  return requestClient.get<GetCollectionProgressSummary>(
    `/api/v1/qbank-v2/collections/${collectionId}/progress/summary`,
    { params: { include_descendants: includeDescendants } },
  );
}

export async function getBankProgressApi(bankId: number) {
  return requestClient.get<GetBankProgressDetail>(
    `/api/v1/qbank-v2/banks/${bankId}/progress`,
  );
}

export async function getBankWrongSectionsApi(bankId: number) {
  return requestClient.get<GetBankWrongSectionCounts>(
    `/api/v1/qbank-v2/banks/${bankId}/wrong-sections`,
  );
}

export async function getUserPracticeReportApi(days = 30) {
  return requestClient.get<GetUserPracticeReport>(
    '/api/v1/qbank-v2/analytics/report',
    { params: { days } },
  );
}

export async function getPracticeRanksApi(
  rankType: RankType = 'practice_count',
  offset = 0,
  limit = 20,
) {
  return requestClient.get<GetPracticeRankList>(
    '/api/v1/qbank-v2/analytics/ranks',
    { params: { rank_type: rankType, offset, limit } },
  );
}
