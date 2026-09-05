import { requestClient } from '#/api/request';

export type PracticePreferenceMode =
  | 'adaptive'
  | 'exam'
  | 'exercise'
  | 'memorize'
  | 'mock'
  | 'practice'
  | 'review';
export type ThemeMode = 'auto' | 'dark' | 'light';

export interface GetPracticePreferenceDetail {
  id: number;
  user_id: number;
  current_category_id?: number;
  current_knowledge_point_id?: number;
  practice_mode: PracticePreferenceMode;
  mastery_threshold: number;
  theme_mode: ThemeMode;
  random_practice_count: number;
  random_practice_year_range: string;
  review_reminder_enabled: boolean;
  review_reminder_time: string;
  review_reminder_timezone: string;
  review_daily_limit: number;
  custom_tabs: Record<string, any[]>;
  created_time: string;
  updated_time: string;
}

export interface UpdatePracticePreferenceParam {
  current_category_id?: null | number;
  current_knowledge_point_id?: null | number;
  practice_mode?: PracticePreferenceMode;
  mastery_threshold?: number;
  theme_mode?: ThemeMode;
  random_practice_count?: number;
  random_practice_year_range?: string;
  review_reminder_enabled?: boolean;
  review_reminder_time?: string;
  review_reminder_timezone?: string;
  review_daily_limit?: number;
  custom_tabs?: Record<string, any[]>;
}

export async function getPracticePreferenceApi() {
  return requestClient.get<GetPracticePreferenceDetail>(
    '/api/v1/qbank-v2/preferences',
  );
}

export async function updatePracticePreferenceApi(
  data: UpdatePracticePreferenceParam,
) {
  return requestClient.put<GetPracticePreferenceDetail>(
    '/api/v1/qbank-v2/preferences',
    data,
  );
}
