import type {
  StudyMentorStatus,
  StudyPlanItemStatus,
  StudyPlanModuleType,
  StudyPlanPracticeSourceMode,
  StudyPlanQuestionType,
  StudyPlanRefType,
  StudyPlanStatus,
} from '#/api/study-plan';

export const moduleOptions: Array<{
  color: string;
  label: string;
  value: StudyPlanModuleType;
}> = [
  { color: 'blue', label: '学习', value: 'review' },
  { color: 'cyan', label: '刷题', value: 'practice' },
  { color: 'rose', label: '错题复盘', value: 'wrong_review' },
  { color: 'purple', label: '能力提升', value: 'ability' },
  { color: 'green', label: '资源', value: 'resource' },
];

export const refTypeOptions: Array<{
  label: string;
  value: StudyPlanRefType;
}> = [
  { label: '内容 content', value: 'content' },
  { label: '题库 question_set', value: 'question_set' },
  { label: '动态错题 wrong_dynamic', value: 'wrong_dynamic' },
  { label: '能力任务 ability_task', value: 'ability_task' },
];

export const practiceSourceModeOptions: Array<{
  label: string;
  value: StudyPlanPracticeSourceMode;
}> = [
  { label: '题库', value: 'bank' },
  { label: '篇章', value: 'chapter' },
  { label: '篇章题型', value: 'chapter_type' },
  { label: '知识点', value: 'knowledge_point' },
  { label: '指定 ID', value: 'question_ids' },
];

export const practiceQuestionTypeOptions: Array<{
  label: string;
  value: StudyPlanQuestionType;
}> = [
  { label: '单选题', value: 'single' },
  { label: '多选题', value: 'multiple' },
  { label: '判断题', value: 'judgement' },
  { label: '填空题', value: 'fill' },
  { label: '简答题', value: 'shortAnswer' },
];

export const itemStatusOptions: Array<{
  color: string;
  label: string;
  value: StudyPlanItemStatus;
}> = [
  { color: 'default', label: '待开始', value: 'pending' },
  { color: 'processing', label: '进行中', value: 'in_progress' },
  { color: 'success', label: '已完成', value: 'completed' },
  { color: 'warning', label: '已跳过', value: 'skipped' },
];

export const planStatusOptions: Array<{
  color: string;
  label: string;
  value: StudyPlanStatus;
}> = [
  { color: 'processing', label: '进行中', value: 'active' },
  { color: 'warning', label: '已暂停', value: 'paused' },
  { color: 'success', label: '已结束', value: 'finished' },
];

export const mentorStatusOptions: Array<{
  color: string;
  label: string;
  value: StudyMentorStatus;
}> = [
  { color: 'success', label: '生效', value: 'active' },
  { color: 'warning', label: '暂停', value: 'paused' },
];

export function findOption<T extends string>(
  options: Array<{ color?: string; label: string; value: T }>,
  value?: null | T,
) {
  return options.find((item) => item.value === value);
}

export function parseJsonObject(text?: string): null | Record<string, unknown> {
  const raw = text?.trim();
  if (!raw) {
    return null;
  }

  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('JSON 必须是对象');
  }

  return parsed as Record<string, unknown>;
}

export function stringifyJson(value?: null | Record<string, unknown>) {
  if (!value) {
    return '';
  }

  return JSON.stringify(value, null, 2);
}

export interface PracticeKnowledgePoint {
  id?: number;
  name: string;
}

export interface PracticeSourceFormState {
  practice_bank_id: null | number;
  practice_bank_label: string;
  practice_chapter_id: null | number;
  practice_chapter_label: string;
  practice_knowledge_point_ids: number[];
  practice_knowledge_points: PracticeKnowledgePoint[];
  practice_knowledge_points_text: string;
  practice_question_ids_text: string;
  practice_question_types: StudyPlanQuestionType[];
  practice_region: string;
  practice_shuffle: boolean;
  practice_source_mode: StudyPlanPracticeSourceMode;
  practice_time_limit: null | number;
  practice_year_end: null | number;
  practice_year_start: null | number;
  target_accuracy_percent?: null | number;
  target_question_count?: null | number;
}

export interface ModuleTargetExtra {
  accuracyPercent: null | number;
  extraJson: string;
  questionCount: null | number;
}

export interface PracticeTargetExtra
  extends ModuleTargetExtra, PracticeSourceFormState {}

export interface AbilityTargetExtra extends ModuleTargetExtra {
  abilityKey: string;
  abilityParams: Record<string, unknown>;
  abilityTitle: string;
  abilityUrl: string;
}

export interface CloudLinkItem {
  title: string;
  url: string;
  password?: string;
  provider?: string;
}

export interface ResourceTargetExtra {
  cloudLinks: CloudLinkItem[];
  extraJson: string;
}

export const cloudLinkProviderOptions: Array<{ label: string; value: string }> =
  [
    { label: '百度网盘', value: 'baidu' },
    { label: '夸克网盘', value: 'quark' },
    { label: '阿里云盘', value: 'aliyun' },
    { label: '腾讯微云', value: 'weiyun' },
    { label: '其它', value: 'other' },
  ];

export function isValidHttpUrl(value: string): boolean {
  if (!value) return false;
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function createDefaultCloudLink(): CloudLinkItem {
  return { title: '', url: '', password: '', provider: '' };
}

function normalizeCloudLink(raw: unknown): CloudLinkItem | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const data = raw as Record<string, unknown>;
  const url = readText(data.url);
  if (!url) return null;
  return {
    title: readText(data.title) || url,
    url,
    password: readText(data.password) || undefined,
    provider: readText(data.provider) || undefined,
  };
}

export function splitResourceTargetExtra(
  extra?: null | Record<string, unknown>,
): ResourceTargetExtra {
  const rest = { ...extra };
  const rawList = Array.isArray(rest.cloud_links) ? rest.cloud_links : [];
  const cloudLinks = rawList
    .map((item) => normalizeCloudLink(item))
    .filter((item): item is CloudLinkItem => item !== null);

  delete rest.cloud_links;

  return {
    cloudLinks,
    extraJson: stringifyJson(Object.keys(rest).length > 0 ? rest : null),
  };
}

const DEFAULT_PRACTICE_ACCURACY_PERCENT = 60;

function readFiniteNumber(value: unknown): null | number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value !== 'string') {
    return null;
  }

  const text = value.trim();
  if (!text) {
    return null;
  }

  const parsed = Number(text);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

function toFixedNumber(value: number, digits = 2) {
  const rate = 10 ** digits;
  return Math.round(value * rate) / rate;
}

function readPositiveInt(value: unknown): null | number {
  const parsed = readFiniteNumber(value);
  if (parsed === null || parsed <= 0 || !Number.isInteger(parsed)) {
    return null;
  }

  return parsed;
}

function readText(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function readBoolean(value: unknown) {
  return value === true;
}

function isPracticeSourceMode(
  value: unknown,
): value is StudyPlanPracticeSourceMode {
  return practiceSourceModeOptions.some((item) => item.value === value);
}

function isQuestionType(value: unknown): value is StudyPlanQuestionType {
  return practiceQuestionTypeOptions.some((item) => item.value === value);
}

function getQuestionTypeLabel(value: StudyPlanQuestionType) {
  return (
    practiceQuestionTypeOptions.find((item) => item.value === value)?.label ??
    value
  );
}

function normalizeQuestionTypes(value: unknown): StudyPlanQuestionType[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const result: StudyPlanQuestionType[] = [];
  const seen = new Set<string>();
  value.forEach((item) => {
    if (!isQuestionType(item) || seen.has(item)) {
      return;
    }

    seen.add(item);
    result.push(item);
  });
  return result;
}

function normalizeIntList(value: unknown, limit = 500): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const result: number[] = [];
  const seen = new Set<number>();
  value.forEach((item) => {
    const parsed = readPositiveInt(item);
    if (parsed === null || seen.has(parsed) || result.length >= limit) {
      return;
    }

    seen.add(parsed);
    result.push(parsed);
  });
  return result;
}

function normalizePracticeSourceMode(
  extra: Record<string, unknown>,
  refId?: null | number,
): StudyPlanPracticeSourceMode {
  if (isPracticeSourceMode(extra.source_mode)) {
    return extra.source_mode;
  }
  if (normalizeIntList(extra.question_ids).length > 0) {
    return 'question_ids';
  }
  if (
    Array.isArray(extra.knowledge_points) ||
    Array.isArray(extra.knowledge_point)
  ) {
    return 'knowledge_point';
  }
  if (
    readPositiveInt(extra.chapter_id) !== null &&
    normalizeQuestionTypes(extra.question_types).length > 0
  ) {
    return 'chapter_type';
  }
  if (readPositiveInt(extra.chapter_id) !== null) {
    return 'chapter';
  }
  if (refId) {
    return 'bank';
  }

  return 'bank';
}

function normalizeKnowledgePoints(value: unknown) {
  const source = Array.isArray(value) ? value : [];
  const points: PracticeKnowledgePoint[] = [];
  const ids: number[] = [];
  const textParts: string[] = [];
  const seen = new Set<string>();

  source.forEach((item) => {
    let id: null | number;
    let name: string;

    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const raw = item as Record<string, unknown>;
      id = readPositiveInt(raw.id ?? raw.category_id ?? raw.cat_id);
      name = readText(raw.name ?? raw.label ?? raw.title);
    } else {
      id = readPositiveInt(item);
      name = readText(item);
    }

    if (!name && id !== null) {
      name = String(id);
    }
    if (!name) {
      return;
    }

    const key = id === null ? `name:${name}` : `id:${id}`;
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    points.push(id === null ? { name } : { id, name });
    if (id === null) {
      textParts.push(name);
    } else {
      ids.push(id);
    }
  });

  return {
    ids,
    points,
    text: textParts.join('、'),
  };
}

export function parsePracticeQuestionIds(text?: string, limit = 500) {
  const raw = readText(text);
  if (!raw) {
    return [];
  }

  const tokens = raw.split(/[\s,，、;；]+/).filter(Boolean);
  const result: number[] = [];
  const seen = new Set<number>();
  tokens.forEach((token) => {
    const parsed = Number(token);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new Error(`题目 ID「${token}」不是有效正整数`);
    }
    if (seen.has(parsed) || result.length >= limit) {
      return;
    }

    seen.add(parsed);
    result.push(parsed);
  });
  return result;
}

export function parsePracticeKnowledgePointText(text?: string) {
  const raw = readText(text);
  if (!raw) {
    return [];
  }

  return raw
    .split(/[\s,，、;；]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((name) => ({ name }));
}

export function createDefaultPracticeSourceFields(): PracticeSourceFormState {
  return {
    practice_bank_id: null,
    practice_bank_label: '',
    practice_chapter_id: null,
    practice_chapter_label: '',
    practice_knowledge_point_ids: [],
    practice_knowledge_points: [],
    practice_knowledge_points_text: '',
    practice_question_ids_text: '',
    practice_question_types: [],
    practice_region: '',
    practice_shuffle: true,
    practice_source_mode: 'bank',
    practice_time_limit: null,
    practice_year_end: null,
    practice_year_start: null,
    target_accuracy_percent: null,
    target_question_count: null,
  };
}

export function splitPracticeTargetExtra(
  extra?: null | Record<string, unknown>,
  refId?: null | number,
): PracticeTargetExtra {
  const rest = { ...extra };
  const questionCount = readFiniteNumber(rest.question_count);
  const accuracyDecimal = readFiniteNumber(rest.required_accuracy);
  const sourceMode = normalizePracticeSourceMode(rest, refId);
  const questionIds = normalizeIntList(rest.question_ids);
  const knowledge = normalizeKnowledgePoints(
    rest.knowledge_points ?? rest.knowledge_point,
  );

  delete rest.question_count;
  delete rest.required_accuracy;
  delete rest.source_mode;
  delete rest.source_label;
  delete rest.bank_label;
  delete rest.chapter_id;
  delete rest.chapter_label;
  delete rest.question_types;
  delete rest.question_type_labels;
  delete rest.knowledge_points;
  delete rest.knowledge_point;
  delete rest.question_ids;
  delete rest.year_start;
  delete rest.year_end;
  delete rest.region;
  delete rest.shuffle;
  delete rest.practice_mode;
  delete rest.time_limit;

  const accuracyPercent =
    accuracyDecimal === null
      ? DEFAULT_PRACTICE_ACCURACY_PERCENT
      : toFixedNumber(accuracyDecimal * 100, 1);

  return {
    accuracyPercent,
    extraJson: stringifyJson(Object.keys(rest).length > 0 ? rest : null),
    practice_bank_id: refId ?? null,
    practice_bank_label: readText(extra?.bank_label),
    practice_chapter_id: readPositiveInt(extra?.chapter_id),
    practice_chapter_label: readText(extra?.chapter_label),
    practice_knowledge_point_ids: knowledge.ids,
    practice_knowledge_points: knowledge.points,
    practice_knowledge_points_text: knowledge.text,
    practice_question_ids_text: questionIds.join(','),
    practice_question_types: normalizeQuestionTypes(extra?.question_types),
    practice_region: readText(extra?.region),
    practice_shuffle:
      extra?.shuffle === undefined ? true : readBoolean(extra.shuffle),
    practice_source_mode: sourceMode,
    practice_time_limit: readPositiveInt(extra?.time_limit),
    practice_year_end: readPositiveInt(extra?.year_end),
    practice_year_start: readPositiveInt(extra?.year_start),
    questionCount,
    target_accuracy_percent: accuracyPercent,
    target_question_count: questionCount,
  };
}

export function splitAbilityTargetExtra(
  extra?: null | Record<string, unknown>,
  knownParamNames: string[] = [],
): AbilityTargetExtra {
  const rest = { ...extra };
  const questionCount = readFiniteNumber(rest.question_count);
  const accuracyDecimal = readFiniteNumber(rest.required_accuracy);
  const abilityKey =
    typeof rest.ability_key === 'string' ? rest.ability_key : '';
  const abilityTitle =
    typeof rest.ability_title === 'string' ? rest.ability_title : '';
  const abilityUrl =
    typeof rest.ability_url === 'string' ? rest.ability_url : '';

  delete rest.ability_key;
  delete rest.ability_title;
  delete rest.ability_url;
  delete rest.question_count;
  delete rest.required_accuracy;

  const abilityParams: Record<string, unknown> = {};
  knownParamNames.forEach((name) => {
    if (name in rest) {
      abilityParams[name] = rest[name];
      Reflect.deleteProperty(rest, name);
    }
  });

  return {
    abilityKey,
    abilityParams,
    abilityTitle,
    abilityUrl,
    accuracyPercent:
      accuracyDecimal === null ? null : toFixedNumber(accuracyDecimal * 100, 1),
    extraJson: stringifyJson(Object.keys(rest).length > 0 ? rest : null),
    questionCount,
  };
}

export function syncPracticeKnowledgePoints(
  form: PracticeSourceFormState,
  nameMap: Map<number, string>,
) {
  const points: PracticeKnowledgePoint[] = [];
  const seen = new Set<string>();

  form.practice_knowledge_point_ids.forEach((id) => {
    const name = nameMap.get(id) || String(id);
    const key = `id:${id}`;
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    points.push({ id, name });
  });

  parsePracticeKnowledgePointText(form.practice_knowledge_points_text).forEach(
    (item) => {
      const key = `name:${item.name}`;
      if (seen.has(key)) {
        return;
      }

      seen.add(key);
      points.push(item);
    },
  );

  form.practice_knowledge_points = points;
}

export function resolvePracticeSourceRefId(form: PracticeSourceFormState) {
  if (form.practice_source_mode === 'knowledge_point') {
    return null;
  }

  return form.practice_bank_id ?? null;
}

export function buildPracticePreviewPayload(form: PracticeSourceFormState) {
  const questionIds = parsePracticeQuestionIds(form.practice_question_ids_text);
  const knowledgePoints =
    form.practice_knowledge_points.length > 0
      ? form.practice_knowledge_points
      : parsePracticeKnowledgePointText(form.practice_knowledge_points_text);

  return {
    bank_id: form.practice_bank_id,
    chapter_id: form.practice_chapter_id,
    knowledge_points: knowledgePoints.length > 0 ? knowledgePoints : null,
    question_count: form.target_question_count ?? null,
    question_ids: questionIds.length > 0 ? questionIds : null,
    question_types:
      form.practice_question_types.length > 0
        ? form.practice_question_types
        : null,
    region: form.practice_region || null,
    source_mode: form.practice_source_mode,
    year_end: form.practice_year_end,
    year_start: form.practice_year_start,
  };
}

export function validatePracticeSourceForm(form: PracticeSourceFormState) {
  if (
    ['bank', 'chapter', 'chapter_type'].includes(form.practice_source_mode) &&
    !form.practice_bank_id
  ) {
    throw new Error('请选择题库');
  }
  if (
    ['chapter', 'chapter_type'].includes(form.practice_source_mode) &&
    !form.practice_chapter_id
  ) {
    throw new Error('请选择题库篇章');
  }
  if (
    form.practice_source_mode === 'chapter_type' &&
    form.practice_question_types.length === 0
  ) {
    throw new Error('请选择题型');
  }
  if (
    form.practice_source_mode === 'knowledge_point' &&
    form.practice_knowledge_points.length === 0 &&
    !form.practice_knowledge_points_text.trim()
  ) {
    throw new Error('请选择或填写知识点');
  }
  if (form.practice_source_mode === 'question_ids') {
    const questionIds = parsePracticeQuestionIds(
      form.practice_question_ids_text,
    );
    if (questionIds.length === 0) {
      throw new Error('请填写题目 ID');
    }
    if (
      form.target_question_count &&
      form.target_question_count > questionIds.length
    ) {
      throw new Error('目标题数不能超过指定 ID 数量');
    }
  }
}

function buildPracticeSourceLabel(target: Partial<PracticeSourceFormState>) {
  if (target.practice_source_mode === 'question_ids') {
    const count = parsePracticeQuestionIds(
      target.practice_question_ids_text,
    ).length;
    return `指定 ID ${count} 题`;
  }
  if (target.practice_source_mode === 'knowledge_point') {
    const points = target.practice_knowledge_points ?? [];
    const names = points.map((item) => item.name).filter(Boolean);
    return names.length > 0
      ? `知识点 ${names.slice(0, 3).join('、')}`
      : '知识点';
  }
  if (target.practice_source_mode === 'chapter_type') {
    return target.practice_chapter_label
      ? `篇章题型 ${target.practice_chapter_label}`
      : '篇章题型';
  }
  if (target.practice_source_mode === 'chapter') {
    return target.practice_chapter_label
      ? `篇章 ${target.practice_chapter_label}`
      : '篇章';
  }
  if (target.practice_bank_label) {
    return `题库 ${target.practice_bank_label}`;
  }

  return '题库';
}

export function buildModuleExtra(
  moduleType: StudyPlanModuleType,
  extraJson: string,
  target: {
    abilityKey?: null | string;
    abilityParams?: Record<string, unknown>;
    abilityTitle?: null | string;
    abilityUrl?: null | string;
    accuracyPercent?: null | number;
    cloudLinks?: CloudLinkItem[];
    practiceBankLabel?: null | string;
    practiceChapterId?: null | number;
    practiceChapterLabel?: null | string;
    practiceKnowledgePoints?: PracticeKnowledgePoint[];
    practiceQuestionIdsText?: null | string;
    practiceQuestionTypes?: StudyPlanQuestionType[];
    practiceRegion?: null | string;
    practiceShuffle?: boolean;
    practiceSourceMode?: StudyPlanPracticeSourceMode;
    practiceTimeLimit?: null | number;
    practiceYearEnd?: null | number;
    practiceYearStart?: null | number;
    questionCount?: null | number;
  } = {},
) {
  const extra = parseJsonObject(extraJson) ?? {};

  if (moduleType === 'practice') {
    const sourceMode = target.practiceSourceMode ?? 'bank';
    extra.source_mode = sourceMode;
    extra.source_label = buildPracticeSourceLabel({
      practice_bank_label: target.practiceBankLabel ?? '',
      practice_chapter_label: target.practiceChapterLabel ?? '',
      practice_knowledge_points: target.practiceKnowledgePoints ?? [],
      practice_question_ids_text: target.practiceQuestionIdsText ?? '',
      practice_source_mode: sourceMode,
    });
    if (target.practiceBankLabel) {
      extra.bank_label = target.practiceBankLabel;
    }
    if (sourceMode === 'chapter' || sourceMode === 'chapter_type') {
      if (target.practiceChapterId) {
        extra.chapter_id = target.practiceChapterId;
      }
      if (target.practiceChapterLabel) {
        extra.chapter_label = target.practiceChapterLabel;
      }
    }
    if (sourceMode === 'chapter_type' && target.practiceQuestionTypes?.length) {
      extra.question_types = target.practiceQuestionTypes;
      extra.question_type_labels = target.practiceQuestionTypes.map((item) =>
        getQuestionTypeLabel(item),
      );
    }
    if (sourceMode === 'knowledge_point') {
      const points = target.practiceKnowledgePoints ?? [];
      if (points.length > 0) {
        extra.knowledge_points = points;
      }
    }
    if (sourceMode === 'question_ids') {
      const questionIds = parsePracticeQuestionIds(
        target.practiceQuestionIdsText ?? '',
      );
      if (questionIds.length > 0) {
        extra.question_ids = questionIds;
      }
    }
    if (sourceMode !== 'question_ids') {
      if (target.practiceYearStart) {
        extra.year_start = target.practiceYearStart;
      }
      if (target.practiceYearEnd) {
        extra.year_end = target.practiceYearEnd;
      }
      if (target.practiceRegion) {
        extra.region = target.practiceRegion.trim();
      }
      if (target.practiceShuffle) {
        extra.shuffle = true;
      }
      if (target.practiceTimeLimit) {
        extra.time_limit = target.practiceTimeLimit;
      }
      extra.practice_mode = 'practice';
    }
    if (target.questionCount !== null && target.questionCount !== undefined) {
      extra.question_count = target.questionCount;
    }
    if (
      target.accuracyPercent !== null &&
      target.accuracyPercent !== undefined
    ) {
      extra.required_accuracy = toFixedNumber(target.accuracyPercent / 100, 4);
    }
  }

  if (moduleType === 'ability') {
    if (target.abilityKey) {
      extra.ability_key = target.abilityKey;
    }
    if (target.abilityTitle) {
      extra.ability_title = target.abilityTitle;
    }
    if (target.abilityUrl) {
      extra.ability_url = target.abilityUrl;
    }
    if (target.questionCount !== null && target.questionCount !== undefined) {
      extra.question_count = target.questionCount;
    }
    if (
      target.accuracyPercent !== null &&
      target.accuracyPercent !== undefined
    ) {
      extra.required_accuracy = toFixedNumber(target.accuracyPercent / 100, 4);
    }
    if (target.abilityParams) {
      Object.entries(target.abilityParams).forEach(([k, v]) => {
        if (v !== null && v !== undefined && v !== '') {
          extra[k] = v;
        }
      });
    }
  }

  if (moduleType === 'resource') {
    const links = (target.cloudLinks ?? [])
      .map((item) => {
        const url = readText(item.url);
        if (!url) return null;
        const cleaned: Record<string, unknown> = {
          title: readText(item.title) || url,
          url,
        };
        const password = readText(item.password);
        if (password) cleaned.password = password;
        const provider = readText(item.provider);
        if (provider) cleaned.provider = provider;
        return cleaned;
      })
      .filter((item): item is Record<string, unknown> => item !== null);
    if (links.length > 0) {
      extra.cloud_links = links;
    } else {
      delete extra.cloud_links;
    }
  }

  return Object.keys(extra).length > 0 ? extra : null;
}

export function formatPracticeTarget(
  moduleType: StudyPlanModuleType,
  extra?: null | Record<string, unknown>,
) {
  if (moduleType !== 'practice') {
    return '-';
  }

  const target = splitPracticeTargetExtra(extra);
  const parts: string[] = [];
  const sourceLabel =
    readText(extra?.source_label) || buildPracticeSourceLabel(target);
  if (sourceLabel) {
    parts.push(sourceLabel);
  }
  if (target.practice_question_types.length > 0) {
    parts.push(
      target.practice_question_types
        .map((qt) => getQuestionTypeLabel(qt))
        .join('、'),
    );
  }
  if (target.questionCount !== null) {
    parts.push(`${target.questionCount} 题`);
  }
  if (target.accuracyPercent !== null) {
    parts.push(`${target.accuracyPercent}%`);
  }
  if (target.practice_time_limit !== null) {
    parts.push(`${target.practice_time_limit} 分钟`);
  }

  return parts.length > 0 ? parts.join(' / ') : '-';
}

export function formatAbilityTarget(
  moduleType: StudyPlanModuleType,
  extra?: null | Record<string, unknown>,
) {
  if (moduleType !== 'ability') {
    return '-';
  }

  const target = splitAbilityTargetExtra(extra);
  const parts: string[] = [];
  if (target.abilityTitle || target.abilityKey) {
    parts.push(target.abilityTitle || target.abilityKey);
  }
  if (target.questionCount !== null) {
    parts.push(`${target.questionCount} 题`);
  }
  if (target.accuracyPercent !== null) {
    parts.push(`${target.accuracyPercent}%`);
  }

  return parts.length > 0 ? parts.join(' / ') : '-';
}

export function formatResourceTarget(
  moduleType: StudyPlanModuleType,
  extra?: null | Record<string, unknown>,
) {
  if (moduleType !== 'resource') {
    return '-';
  }

  const target = splitResourceTargetExtra(extra);
  if (target.cloudLinks.length === 0) {
    return '尚未配置链接';
  }
  const first = target.cloudLinks[0];
  const head = first?.title || first?.url || '链接';
  if (target.cloudLinks.length === 1) {
    return head;
  }
  return `${head} 等 ${target.cloudLinks.length} 个链接`;
}

export function formatModuleTarget(
  moduleType: StudyPlanModuleType,
  extra?: null | Record<string, unknown>,
) {
  if (moduleType === 'practice') {
    return formatPracticeTarget(moduleType, extra);
  }
  if (moduleType === 'ability') {
    return formatAbilityTarget(moduleType, extra);
  }
  if (moduleType === 'resource') {
    return formatResourceTarget(moduleType, extra);
  }

  return '-';
}

export function formatDurationSeconds(value?: null | number) {
  if (value === null || value === undefined) {
    return '-';
  }
  if (value <= 0) {
    return '0 秒';
  }

  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  if (minutes <= 0) {
    return `${seconds} 秒`;
  }
  if (seconds <= 0) {
    return `${minutes} 分钟`;
  }

  return `${minutes} 分 ${seconds} 秒`;
}

export function formatAccuracy(
  correctCount?: null | number,
  totalCount?: null | number,
) {
  if (correctCount === null || correctCount === undefined) {
    return '-';
  }
  if (!totalCount) {
    return '-';
  }

  const percent = Math.round((correctCount * 1000) / totalCount) / 10;
  return `${correctCount}/${totalCount} (${percent}%)`;
}
