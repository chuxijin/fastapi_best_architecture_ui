<script setup lang="ts">
import type {
  BankResult,
  ChapterTreeResult,
  QuestionDetail,
  QuestionQueryParams,
  QuestionResult,
  QuestionType,
  SysCategoryTreeResult,
} from '#/api';

import { computed, onMounted, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Empty,
  Input,
  message,
  Modal,
  Select,
  Spin,
  Tag,
  TreeSelect,
} from 'ant-design-vue';

import {
  getBankListApi,
  getChapterTreeApi,
  getQuestionDetailApi,
  getQuestionListApi,
  getSysCategoryTreeApi,
  updateQuestionApi,
} from '#/api';
import HaloEditorWrapper from '#/components/HaloEditor/HaloEditorWrapper.vue';

import { questionTypeMap } from '../workspace/components/question-data';

interface ReviewQuestionDetail extends QuestionDetail {
  options?: Array<{ code?: string; content?: string; option_code?: string }>;
  placements?: any[];
}

interface KnowledgeTreeOption {
  children?: KnowledgeTreeOption[];
  key: number;
  title: string;
  value: number;
}

const loadingBankOptions = ref(false);
const loadingChapterOptions = ref(false);
const loadingKnowledgeCategoryOptions = ref(false);
const loadingQuestion = ref(false);
const saving = ref(false);

const stemEditorOpen = ref(false);
const stemEditorContent = ref('');
const answerEditorOpen = ref(false);
const answerEditorSingle = ref('');
const answerEditorMulti = ref<string[]>([]);
const analysisEditorOpen = ref(false);
const analysisEditorContent = ref('');
const knowledgeEditorOpen = ref(false);
const knowledgeEditorCategoryIds = ref<number[]>([]);

const optionEditorOpen = ref(false);
const optionEditorCode = ref('');
const optionEditorContent = ref('');
const currentQuestion = ref<null | QuestionResult>(null);
const currentDetail = ref<null | ReviewQuestionDetail>(null);

const bankOptions = ref<Array<{ label: string; value: number }>>([]);
const chapterOptions = ref<Array<{ label: string; value: number }>>([]);
const knowledgeCategoryTree = ref<KnowledgeTreeOption[]>([]);
const knowledgeCategoryNameMap = ref<Map<number, string>>(new Map());
const knowledgeCategoryNameIndex = ref<Map<string, number[]>>(new Map());

const filters = ref({
  bank_id: undefined as number | undefined,
  chapter_id: undefined as number | undefined,
  keyword: '',
  review_status: 0 as number | undefined,
  type: undefined as QuestionType | undefined,
});

const pager = ref({
  page: 1,
  size: 1,
  total: 0,
});

const reviewStatusOptions = [
  { label: '待审核', value: 0 },
  { label: '已通过', value: 10 },
  { label: '已拒绝', value: 20 },
  { label: '全部状态', value: undefined },
];

const questionTypeOptions: Array<{ label: string; value: QuestionType }> = [
  { label: '单选题', value: 'single' },
  { label: '多选题', value: 'multiple' },
  { label: '判断题', value: 'judgement' },
  { label: '填空题', value: 'fill' },
  { label: '简答题', value: 'shortAnswer' },
];

const progressText = computed(() => {
  if (!pager.value.total || !currentQuestion.value) {
    return '0 / 0';
  }
  return `${pager.value.page} / ${pager.value.total}`;
});

const optionEditorTitle = computed(() => `编辑选项 ${optionEditorCode.value}`);

const displayOptions = computed<
  Array<{
    code: string;
    content: string;
    is_active?: boolean;
    sort_order?: number;
  }>
>(() => {
  if (currentDetail.value?.options && currentDetail.value.options.length > 0) {
    return currentDetail.value.options.map((item: any, index: number) => ({
      code: item.option_code || item.code || '',
      content: item.content || '',
      sort_order: item.sort_order ?? index,
      is_active: item.is_active ?? true,
    }));
  }

  const raw = (currentQuestion.value as any)?.options_data;
  if (!raw || typeof raw !== 'object') {
    return [];
  }
  return Object.entries(raw).map(
    ([key, value]: [string, any], index: number) => ({
      code: value?.code || key,
      content: value?.content || '',
      sort_order: index,
      is_active: true,
    }),
  );
});

const currentAnalysis = computed<any | null>(() => {
  const detailAnalyses = (currentDetail.value as any)?.analyses;
  if (Array.isArray(detailAnalyses) && detailAnalyses.length > 0) {
    return (
      detailAnalyses.find((item: any) => item?.is_default) || detailAnalyses[0]
    );
  }

  const listAnalyses = (currentQuestion.value as any)?.analyses;
  if (Array.isArray(listAnalyses) && listAnalyses.length > 0) {
    return (
      listAnalyses.find((item: any) => item?.is_default) || listAnalyses[0]
    );
  }

  const listAnswerData = (currentQuestion.value as any)?.answer_data;
  const listAnalysisContent = (currentQuestion.value as any)?.analysis_content;
  if (listAnswerData || listAnalysisContent) {
    return {
      answer_data: listAnswerData || null,
      content: listAnalysisContent || '',
    };
  }

  return null;
});

const correctOptionCodes = computed<Set<string>>(() => {
  const correct = currentAnalysis.value?.answer_data?.correct;
  if (Array.isArray(correct)) {
    return new Set(correct.map(String));
  }
  if (correct === undefined || correct === null || correct === '') {
    return new Set();
  }
  return new Set([String(correct)]);
});

const answerText = computed(() => {
  const correct = currentAnalysis.value?.answer_data?.correct;
  const qType = currentQuestion.value?.type;
  if (correct === undefined || correct === null || correct === '') {
    return '-';
  }
  if (qType === 'judgement') {
    const v = Array.isArray(correct) ? String(correct[0]) : String(correct);
    if (v === 'A' || v.toLowerCase() === 'true') return '正确';
    if (v === 'B' || v.toLowerCase() === 'false') return '错误';
    return v;
  }
  if (Array.isArray(correct)) {
    return correct.join('、');
  }
  return String(correct);
});

const knowledgePoints = computed<string[]>(() => {
  const raw =
    (currentDetail.value as any)?.knowledge_point ??
    (currentQuestion.value as any)?.knowledge_point;
  if (Array.isArray(raw)) {
    return raw
      .map((item: any) => {
        if (typeof item === 'string' || typeof item === 'number') {
          return String(item);
        }
        if (item && typeof item === 'object') {
          return item.name || item.label || item.title || item.id || '';
        }
        return '';
      })
      .filter(Boolean);
  }
  if (raw) {
    return [String(raw)];
  }
  return [];
});

const answerEditorOptions = computed<Array<{ label: string; value: string }>>(
  () => {
    const qType = currentQuestion.value?.type;
    if (qType === 'judgement') {
      return [
        { label: 'A（正确）', value: 'A' },
        { label: 'B（错误）', value: 'B' },
      ];
    }
    return displayOptions.value.map((item) => ({
      label: item.code,
      value: item.code,
    }));
  },
);

const treeShowChildStrategy = TreeSelect.SHOW_CHILD;

function flattenBankOptions(
  items: BankResult[],
  level = 0,
): Array<{ label: string; value: number }> {
  return items.flatMap((item) => {
    const prefix = level > 0 ? `${'　'.repeat(level)}` : '';
    const result = [{ label: `${prefix}${item.name}`, value: item.id }];
    if (item.children && item.children.length > 0) {
      result.push(...flattenBankOptions(item.children, level + 1));
    }
    return result;
  });
}

function flattenChapterOptions(
  items: ChapterTreeResult[],
  level = 0,
): Array<{ label: string; value: number }> {
  return items.flatMap((item) => {
    const prefix = level > 0 ? `${'　'.repeat(level)}` : '';
    const result = [{ label: `${prefix}${item.name}`, value: item.id }];
    if (item.children && item.children.length > 0) {
      result.push(...flattenChapterOptions(item.children, level + 1));
    }
    return result;
  });
}

async function loadBankOptions() {
  loadingBankOptions.value = true;
  try {
    const list = await getBankListApi({ bank_type: 2 });
    bankOptions.value = flattenBankOptions(list);
  } catch (error) {
    console.error(error);
    message.error('加载试卷列表失败');
  } finally {
    loadingBankOptions.value = false;
  }
}

async function loadChapterOptions(bankId: number) {
  loadingChapterOptions.value = true;
  try {
    const tree = await getChapterTreeApi({ bank_id: bankId });
    chapterOptions.value = flattenChapterOptions(tree);
  } catch (error) {
    console.error(error);
    chapterOptions.value = [];
    message.error('加载章节列表失败');
  } finally {
    loadingChapterOptions.value = false;
  }
}

function normalizeCategoryName(name: string) {
  return name.trim().toLowerCase();
}

function convertKnowledgeCategoryTree(tree: SysCategoryTreeResult[]) {
  const nameMap = new Map<number, string>();
  const nameIndex = new Map<string, number[]>();

  const walk = (nodes: SysCategoryTreeResult[]): KnowledgeTreeOption[] =>
    nodes.map((node) => {
      nameMap.set(node.id, node.name);

      const normalizedName = normalizeCategoryName(node.name);
      const idList = nameIndex.get(normalizedName) || [];
      if (!idList.includes(node.id)) {
        idList.push(node.id);
      }
      nameIndex.set(normalizedName, idList);

      return {
        key: node.id,
        title: node.name,
        value: node.id,
        children:
          node.children && node.children.length > 0
            ? walk(node.children)
            : undefined,
      };
    });

  knowledgeCategoryNameMap.value = nameMap;
  knowledgeCategoryNameIndex.value = nameIndex;
  return walk(tree);
}

async function loadKnowledgeCategoryOptions() {
  loadingKnowledgeCategoryOptions.value = true;
  try {
    const tree = await getSysCategoryTreeApi({
      app_code: 'youanshang',
      type: 'knowledge_point',
      status: true,
    });
    knowledgeCategoryTree.value = convertKnowledgeCategoryTree(tree);
  } catch (error) {
    console.error(error);
    knowledgeCategoryTree.value = [];
    knowledgeCategoryNameMap.value = new Map();
    knowledgeCategoryNameIndex.value = new Map();
    message.error('加载知识点分类失败');
  } finally {
    loadingKnowledgeCategoryOptions.value = false;
  }
}

function normalizeKnowledgeCategoryIds(raw: any): number[] {
  if (!raw) {
    return [];
  }

  const source = Array.isArray(raw) ? raw : [raw];
  const result: number[] = [];
  const nameMap = knowledgeCategoryNameMap.value;
  const nameIndex = knowledgeCategoryNameIndex.value;

  source.forEach((item: any) => {
    if (typeof item === 'number') {
      if (nameMap.has(item)) {
        result.push(item);
      }
      return;
    }

    if (typeof item === 'string') {
      const candidate = nameIndex.get(normalizeCategoryName(item));
      if (candidate && candidate.length > 0) {
        result.push(candidate[0] as number);
      }
      return;
    }

    if (item && typeof item === 'object') {
      const idCandidate = Number(item.id ?? item.category_id ?? item.cat_id);
      if (Number.isFinite(idCandidate) && nameMap.has(idCandidate)) {
        result.push(idCandidate);
        return;
      }

      const nameCandidate = item.name || item.label || item.title;
      if (nameCandidate) {
        const candidate = nameIndex.get(
          normalizeCategoryName(String(nameCandidate)),
        );
        if (candidate && candidate.length > 0) {
          result.push(candidate[0] as number);
        }
      }
    }
  });

  return [...new Set(result)];
}

function buildQueryParams(page: number): QuestionQueryParams {
  return {
    bank_id: filters.value.bank_id,
    chapter_id: filters.value.chapter_id,
    keyword: filters.value.keyword || undefined,
    review_status: filters.value.review_status,
    type: filters.value.type,
    page,
    size: pager.value.size,
    include_answer: true,
  };
}

async function loadQuestionDetail(questionId: number) {
  try {
    currentDetail.value = (await getQuestionDetailApi(
      questionId,
    )) as ReviewQuestionDetail;
  } catch (error) {
    console.error(error);
    currentDetail.value = null;
    message.error('加载题目详情失败');
  }
}

async function queryOneQuestion(page = 1) {
  if (!filters.value.bank_id) {
    message.warning('请先选择试卷');
    return;
  }

  loadingQuestion.value = true;
  try {
    const data = await getQuestionListApi(buildQueryParams(page));
    pager.value.page = data.page;
    pager.value.total = data.total;

    if (data.items.length === 0) {
      currentQuestion.value = null;
      currentDetail.value = null;
      stemEditorOpen.value = false;
      answerEditorOpen.value = false;
      analysisEditorOpen.value = false;
      knowledgeEditorOpen.value = false;
      optionEditorOpen.value = false;
      return;
    }

    currentQuestion.value = data.items[0] || null;
    stemEditorOpen.value = false;
    answerEditorOpen.value = false;
    analysisEditorOpen.value = false;
    knowledgeEditorOpen.value = false;
    optionEditorOpen.value = false;
    if (currentQuestion.value?.id) {
      await loadQuestionDetail(currentQuestion.value.id);
    } else {
      currentDetail.value = null;
    }
  } catch (error) {
    console.error(error);
    message.error('加载题目失败');
  } finally {
    loadingQuestion.value = false;
  }
}

function handleSearch() {
  pager.value.page = 1;
  queryOneQuestion(1);
}

function prevQuestion() {
  if (!pager.value.total || pager.value.page <= 1) {
    message.info('已经是第一题');
    return;
  }
  queryOneQuestion(pager.value.page - 1);
}

function nextQuestion(showTip = true) {
  const totalPages = Math.ceil((pager.value.total || 0) / pager.value.size);
  if (!pager.value.total || pager.value.page >= totalPages) {
    if (showTip) {
      message.info('已经是最后一题');
    }
    return;
  }
  queryOneQuestion(pager.value.page + 1);
}

function buildCorePayload(overrides: Record<string, any> = {}) {
  if (!currentQuestion.value) {
    return null;
  }
  const source: any = currentDetail.value || currentQuestion.value;
  const sourceKnowledgePoint = Array.isArray(source?.knowledge_point)
    ? source.knowledge_point
    : knowledgePoints.value.length > 0
      ? [...knowledgePoints.value]
      : null;
  return {
    type: currentQuestion.value.type,
    stem: source?.stem || currentQuestion.value.stem || '',
    difficulty:
      source?.difficulty || currentQuestion.value.difficulty || 'medium',
    default_score:
      source?.default_score ?? currentQuestion.value.default_score ?? 1,
    knowledge_point: sourceKnowledgePoint,
    content_status:
      source?.content_status ?? currentQuestion.value.content_status ?? 10,
    ...overrides,
  };
}

function buildAnalysesPayload(
  overrides: {
    answer_data?: Record<string, any>;
    content?: string;
  } = {},
) {
  const sourceList = Array.isArray((currentDetail.value as any)?.analyses)
    ? ([...(currentDetail.value as any).analyses] as any[])
    : [];
  const analyses =
    sourceList.length > 0
      ? sourceList
      : currentAnalysis.value
        ? [
            {
              type: currentAnalysis.value.type || 'official',
              version_no: currentAnalysis.value.version_no ?? 1,
              is_default: true,
              answer_data: currentAnalysis.value.answer_data || {},
              content: currentAnalysis.value.content || '暂无解析',
              status: currentAnalysis.value.status ?? 10,
            },
          ]
        : [];

  if (analyses.length === 0) {
    return [
      {
        type: 'official',
        version_no: 1,
        is_default: true,
        answer_data: overrides.answer_data || { correct: '' },
        content: overrides.content || '暂无解析',
        status: 10,
      },
    ];
  }

  const defaultIndex = analyses.findIndex((item) => item?.is_default);
  const targetIndex = Math.max(defaultIndex, 0);

  return analyses.map((item, index) => {
    const currentAnswerData =
      item?.answer_data && typeof item.answer_data === 'object'
        ? { ...item.answer_data }
        : { correct: '' };

    return {
      type: item?.type || 'official',
      version_no: item?.version_no ?? 1,
      is_default:
        typeof item?.is_default === 'boolean'
          ? item.is_default
          : index === targetIndex,
      answer_data:
        index === targetIndex && overrides.answer_data
          ? { ...overrides.answer_data }
          : currentAnswerData,
      content:
        index === targetIndex && overrides.content !== undefined
          ? overrides.content
          : item?.content || '暂无解析',
      status: item?.status ?? 10,
    };
  });
}

async function savePartialQuestion(
  payload: Record<string, any>,
  successText: string,
): Promise<boolean> {
  if (!currentQuestion.value) {
    message.warning('当前没有可保存的题目');
    return false;
  }

  saving.value = true;
  try {
    await updateQuestionApi(currentQuestion.value.id, payload);
    message.success(successText);
    await queryOneQuestion(pager.value.page);
    return true;
  } catch (error) {
    console.error(error);
    message.error('保存失败');
    return false;
  } finally {
    saving.value = false;
  }
}

function openStemEditor() {
  if (!currentQuestion.value) {
    message.warning('当前没有可编辑题目');
    return;
  }
  stemEditorContent.value =
    currentDetail.value?.stem || currentQuestion.value.stem || '';
  stemEditorOpen.value = true;
}

async function saveStemEditor() {
  const stem = stemEditorContent.value || '';
  if (!stem.replaceAll(/<[^>]*>/g, '').trim()) {
    message.warning('题干不能为空');
    return;
  }

  const core = buildCorePayload({ stem });
  if (!core) return;
  const success = await savePartialQuestion({ core }, '题干已保存');
  if (success) {
    stemEditorOpen.value = false;
  }
}

function openAnswerEditor() {
  if (!currentQuestion.value) {
    message.warning('当前没有可编辑题目');
    return;
  }

  const qType = currentQuestion.value.type;
  const correct = currentAnalysis.value?.answer_data?.correct;

  if (qType === 'multiple') {
    if (Array.isArray(correct)) {
      answerEditorMulti.value = correct.map(String);
    } else if (correct === undefined || correct === null || correct === '') {
      answerEditorMulti.value = [];
    } else {
      answerEditorMulti.value = [String(correct)];
    }
    answerEditorSingle.value = '';
  } else {
    if (Array.isArray(correct)) {
      answerEditorSingle.value = String(correct[0] ?? '');
    } else if (correct === undefined || correct === null) {
      answerEditorSingle.value = '';
    } else {
      answerEditorSingle.value = String(correct);
    }
    answerEditorMulti.value = [];
  }

  answerEditorOpen.value = true;
}

async function saveAnswerEditor() {
  if (!currentQuestion.value) {
    message.warning('当前没有可编辑题目');
    return;
  }

  const qType = currentQuestion.value.type;
  const optionCodes = new Set(displayOptions.value.map((item) => item.code));
  let correct: string | string[] = '';

  if (qType === 'multiple') {
    const selected = answerEditorMulti.value.map(String).filter(Boolean);
    if (selected.length === 0) {
      message.warning('请至少选择一个正确选项');
      return;
    }
    if (
      optionCodes.size > 0 &&
      selected.some((item) => !optionCodes.has(item))
    ) {
      message.warning('答案必须是现有选项编码');
      return;
    }
    correct = selected;
  } else {
    const selected = answerEditorSingle.value.trim();
    if (!selected) {
      message.warning('答案不能为空');
      return;
    }
    if (
      ['judgement', 'single'].includes(qType) &&
      optionCodes.size > 0 &&
      !optionCodes.has(selected)
    ) {
      message.warning('答案必须是现有选项编码');
      return;
    }
    correct = selected;
  }

  const baseAnswerData =
    currentAnalysis.value?.answer_data &&
    typeof currentAnalysis.value.answer_data === 'object'
      ? { ...currentAnalysis.value.answer_data }
      : {};
  const analyses = buildAnalysesPayload({
    answer_data: { ...baseAnswerData, correct },
  });
  const success = await savePartialQuestion({ analyses }, '答案已保存');
  if (success) {
    answerEditorOpen.value = false;
  }
}

function openAnalysisEditor() {
  if (!currentQuestion.value) {
    message.warning('当前没有可编辑题目');
    return;
  }
  analysisEditorContent.value = currentAnalysis.value?.content || '';
  analysisEditorOpen.value = true;
}

async function saveAnalysisEditor() {
  const content = analysisEditorContent.value || '';
  if (!content.replaceAll(/<[^>]*>/g, '').trim()) {
    message.warning('解析不能为空');
    return;
  }

  const analyses = buildAnalysesPayload({ content });
  const success = await savePartialQuestion({ analyses }, '解析已保存');
  if (success) {
    analysisEditorOpen.value = false;
  }
}

async function openKnowledgeEditor() {
  if (!currentQuestion.value) {
    message.warning('当前没有可编辑题目');
    return;
  }

  if (
    knowledgeCategoryTree.value.length === 0 &&
    !loadingKnowledgeCategoryOptions.value
  ) {
    await loadKnowledgeCategoryOptions();
  }

  const raw =
    (currentDetail.value as any)?.knowledge_point ??
    (currentQuestion.value as any)?.knowledge_point;
  knowledgeEditorCategoryIds.value = normalizeKnowledgeCategoryIds(raw);
  knowledgeEditorOpen.value = true;
}

async function saveKnowledgeEditor() {
  const normalizedIds = [...new Set(knowledgeEditorCategoryIds.value)]
    .filter((item) => Number.isFinite(item))
    .filter((item) => knowledgeCategoryNameMap.value.has(item));

  const knowledgePointPayload = normalizedIds.map((id) => ({
    id,
    name: knowledgeCategoryNameMap.value.get(id) || String(id),
  }));

  const core = buildCorePayload({
    knowledge_point:
      knowledgePointPayload.length > 0 ? knowledgePointPayload : null,
  });
  if (!core) return;

  const success = await savePartialQuestion({ core }, '知识点已保存');
  if (success) {
    knowledgeEditorOpen.value = false;
  }
}

function openOptionEditor(option: { code: string; content: string }) {
  optionEditorCode.value = option.code;
  optionEditorContent.value = option.content || '';
  optionEditorOpen.value = true;
}

async function saveOptionEditor() {
  if (!currentQuestion.value) {
    message.warning('当前没有可编辑题目');
    return;
  }

  const optionsPayload = displayOptions.value.map((item, index) => ({
    option_code: item.code,
    content:
      item.code === optionEditorCode.value
        ? optionEditorContent.value
        : item.content,
    sort_order: item.sort_order ?? index,
    is_active: item.is_active ?? true,
  }));

  if (optionsPayload.length === 0) {
    message.warning('当前题目没有可编辑选项');
    return;
  }

  saving.value = true;
  try {
    await updateQuestionApi(currentQuestion.value.id, {
      options: optionsPayload,
    });
    message.success(`选项 ${optionEditorCode.value} 已保存`);
    optionEditorOpen.value = false;
    await queryOneQuestion(pager.value.page);
  } catch (error) {
    console.error(error);
    message.error('保存选项失败');
  } finally {
    saving.value = false;
  }
}

watch(
  () => filters.value.bank_id,
  async (bankId) => {
    filters.value.chapter_id = undefined;
    chapterOptions.value = [];
    currentQuestion.value = null;
    currentDetail.value = null;
    stemEditorOpen.value = false;
    answerEditorOpen.value = false;
    analysisEditorOpen.value = false;
    knowledgeEditorOpen.value = false;
    optionEditorOpen.value = false;
    pager.value.page = 1;
    pager.value.total = 0;

    if (bankId) {
      await loadChapterOptions(bankId);
    }
  },
);

onMounted(() => {
  loadBankOptions();
  loadKnowledgeCategoryOptions();
});
</script>

<template>
  <Page auto-content-height>
    <div class="space-y-4">
      <Card title="题目审核筛选" size="small">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Select
            v-model:value="filters.bank_id"
            :options="bankOptions"
            :loading="loadingBankOptions"
            :allow-clear="true"
            placeholder="请选择试卷"
            show-search
            option-filter-prop="label"
          />
          <Select
            v-model:value="filters.chapter_id"
            :options="chapterOptions"
            :loading="loadingChapterOptions"
            :allow-clear="true"
            placeholder="请选择篇章"
            show-search
            option-filter-prop="label"
          />
          <Select
            v-model:value="filters.type"
            :options="questionTypeOptions"
            :allow-clear="true"
            placeholder="请选择题型"
          />
          <Select
            v-model:value="filters.review_status"
            :options="reviewStatusOptions"
            placeholder="审核状态"
          />
          <Input
            v-model:value="filters.keyword"
            allow-clear
            placeholder="题干关键词（可选）"
            @press-enter="handleSearch"
          />
        </div>
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <Button type="primary" @click="handleSearch">开始审核</Button>
          <Button @click="prevQuestion">上一题</Button>
          <Button @click="nextQuestion">下一题</Button>
          <span class="text-sm text-gray-500"
            >当前进度：{{ progressText }}</span
          >
        </div>
      </Card>

      <Card size="small">
        <template #title>
          <div class="flex items-center gap-2">
            <span>单题审核</span>
            <Tag v-if="currentQuestion" color="blue">
              ID {{ currentQuestion.id }}
            </Tag>
            <Tag v-if="currentQuestion" color="purple">
              {{
                questionTypeMap[currentQuestion.type] || currentQuestion.type
              }}
            </Tag>
            <Tag v-if="(currentQuestion as any)?.chapter_name" color="cyan">
              {{ (currentQuestion as any).chapter_name }}
            </Tag>
          </div>
        </template>
        <template #extra>
          <div v-if="currentQuestion" class="flex items-center gap-2">
            <Button @click="nextQuestion(false)">跳到下一题</Button>
          </div>
        </template>

        <Spin :spinning="loadingQuestion || saving">
          <div v-if="currentQuestion">
            <div class="space-y-4">
              <div class="rounded border border-gray-200 bg-gray-50 p-4">
                <div class="mb-2 flex items-center justify-between">
                  <div class="text-sm text-gray-600">题干</div>
                  <Button type="link" size="small" @click="openStemEditor">
                    编辑
                  </Button>
                </div>
                <div
                  class="prose max-w-none text-sm"
                  v-html="currentDetail?.stem || currentQuestion.stem"
                ></div>
              </div>

              <div class="rounded border border-gray-200 bg-gray-50 p-4">
                <div class="mb-2 flex items-center justify-between">
                  <div class="text-sm text-gray-600">知识点</div>
                  <Button type="link" size="small" @click="openKnowledgeEditor">
                    编辑
                  </Button>
                </div>
                <div class="flex flex-wrap gap-2">
                  <Tag v-for="kp in knowledgePoints" :key="kp" color="blue">
                    {{ kp }}
                  </Tag>
                  <span
                    v-if="knowledgePoints.length === 0"
                    class="text-sm text-gray-500"
                    >-</span
                  >
                </div>
              </div>

              <div
                v-if="displayOptions.length > 0"
                class="rounded border border-gray-200 bg-gray-50 p-4"
              >
                <div class="mb-2 flex items-center justify-between">
                  <div class="text-sm text-gray-600">选项</div>
                </div>
                <div class="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <div
                    v-for="option in displayOptions"
                    :key="option.code"
                    class="rounded border p-3 text-sm"
                    :class="
                      correctOptionCodes.has(option.code)
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-white'
                    "
                  >
                    <div class="mb-1 flex items-center justify-between gap-2">
                      <span class="font-medium">
                        {{ option.code
                        }}{{
                          correctOptionCodes.has(option.code) ? '（正确）' : ''
                        }}
                      </span>
                      <Button
                        type="link"
                        size="small"
                        @click="openOptionEditor(option)"
                      >
                        编辑
                      </Button>
                    </div>
                    <div
                      class="prose max-w-none text-sm"
                      v-html="option.content"
                    ></div>
                  </div>
                </div>
              </div>

              <div class="rounded border border-gray-200 bg-gray-50 p-4">
                <div class="mb-2 flex items-center justify-between">
                  <div class="text-sm text-gray-600">答案</div>
                  <Button type="link" size="small" @click="openAnswerEditor">
                    编辑
                  </Button>
                </div>
                <div class="text-sm">{{ answerText }}</div>
              </div>

              <div class="rounded border border-gray-200 bg-gray-50 p-4">
                <div class="mb-2 flex items-center justify-between">
                  <div class="text-sm text-gray-600">解析</div>
                  <Button type="link" size="small" @click="openAnalysisEditor">
                    编辑
                  </Button>
                </div>
                <div
                  class="prose max-w-none text-sm"
                  v-html="currentAnalysis?.content || '-'"
                ></div>
              </div>
            </div>
          </div>

          <Empty
            v-else
            description="当前筛选条件下没有题目，请调整试卷/篇章/状态后重试"
          />
        </Spin>
      </Card>

      <Modal
        v-model:open="stemEditorOpen"
        title="编辑题干"
        :width="960"
        :destroy-on-hidden="true"
        :mask-closable="false"
      >
        <HaloEditorWrapper v-model="stemEditorContent" :height="320" />
        <template #footer>
          <div class="flex items-center justify-end gap-2">
            <Button @click="stemEditorOpen = false">取消</Button>
            <Button type="primary" :loading="saving" @click="saveStemEditor">
              保存题干
            </Button>
          </div>
        </template>
      </Modal>

      <Modal
        v-model:open="answerEditorOpen"
        title="编辑答案"
        :width="720"
        :destroy-on-hidden="true"
        :mask-closable="false"
      >
        <div class="space-y-3">
          <div class="text-xs text-gray-500">
            当前题型：{{
              currentQuestion
                ? questionTypeMap[currentQuestion.type] || currentQuestion.type
                : '-'
            }}
          </div>

          <Select
            v-if="currentQuestion?.type === 'multiple'"
            v-model:value="answerEditorMulti"
            mode="multiple"
            :options="answerEditorOptions"
            :allow-clear="true"
            placeholder="请选择正确选项（可多选）"
          />

          <Select
            v-else-if="
              ['single', 'judgement'].includes(currentQuestion?.type || '') &&
              answerEditorOptions.length > 0
            "
            v-model:value="answerEditorSingle"
            :options="answerEditorOptions"
            :allow-clear="true"
            placeholder="请选择正确选项"
          />

          <Input.TextArea
            v-else
            v-model:value="answerEditorSingle"
            :rows="4"
            placeholder="请输入答案内容"
          />
        </div>
        <template #footer>
          <div class="flex items-center justify-end gap-2">
            <Button @click="answerEditorOpen = false">取消</Button>
            <Button type="primary" :loading="saving" @click="saveAnswerEditor">
              保存答案
            </Button>
          </div>
        </template>
      </Modal>

      <Modal
        v-model:open="analysisEditorOpen"
        title="编辑解析"
        :width="960"
        :destroy-on-hidden="true"
        :mask-closable="false"
      >
        <HaloEditorWrapper v-model="analysisEditorContent" :height="320" />
        <template #footer>
          <div class="flex items-center justify-end gap-2">
            <Button @click="analysisEditorOpen = false">取消</Button>
            <Button
              type="primary"
              :loading="saving"
              @click="saveAnalysisEditor"
            >
              保存解析
            </Button>
          </div>
        </template>
      </Modal>

      <Modal
        v-model:open="knowledgeEditorOpen"
        title="编辑知识点"
        :width="760"
        :destroy-on-hidden="true"
        :mask-closable="false"
      >
        <TreeSelect
          v-model:value="knowledgeEditorCategoryIds"
          :tree-data="knowledgeCategoryTree"
          :tree-default-expand-all="true"
          :loading="loadingKnowledgeCategoryOptions"
          :show-checked-strategy="treeShowChildStrategy"
          :allow-clear="true"
          :tree-checkable="true"
          tree-node-filter-prop="title"
          style="width: 100%"
          placeholder="请选择知识点分类（可多选）"
          show-search
        />
        <template #footer>
          <div class="flex items-center justify-end gap-2">
            <Button @click="knowledgeEditorOpen = false">取消</Button>
            <Button
              type="primary"
              :loading="saving"
              @click="saveKnowledgeEditor"
            >
              保存知识点
            </Button>
          </div>
        </template>
      </Modal>

      <Modal
        v-model:open="optionEditorOpen"
        :title="optionEditorTitle"
        :width="820"
        :destroy-on-hidden="true"
        :mask-closable="false"
      >
        <HaloEditorWrapper v-model="optionEditorContent" :height="260" />
        <template #footer>
          <div class="flex items-center justify-end gap-2">
            <Button @click="optionEditorOpen = false">取消</Button>
            <Button type="primary" :loading="saving" @click="saveOptionEditor">
              保存该选项
            </Button>
          </div>
        </template>
      </Modal>
    </div>
  </Page>
</template>



