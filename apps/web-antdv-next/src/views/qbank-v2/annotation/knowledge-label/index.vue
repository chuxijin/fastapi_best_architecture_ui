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
  Select,
  Spin,
  Switch,
  Tag,
  TreeSelect,
} from 'antdv-next';

import {
  getBankListApi,
  getChapterTreeApi,
  getQuestionDetailApi,
  getQuestionListApi,
  getSysCategoryTreeApi,
  updateQuestionApi,
} from '#/api';

const questionTypeMap: Record<string, string> = {
  single: '单选题',
  multiple: '多选题',
  judgement: '判断题',
  fill: '填空题',
  shortAnswer: '简答题',
  single_choice: '单选题',
  multiple_choice: '多选题',
  true_false: '判断题',
  fill_blank: '填空题',
  short_answer: '简答题',
};

type QuestionDetailRaw = Omit<QuestionDetail, 'options'> & {
  options?: Array<{ code?: string; content?: string; option_code?: string }>;
  placements?: any[];
};

interface KnowledgeTreeOption {
  children?: KnowledgeTreeOption[];
  key: number;
  title: string;
  value: number;
}

interface QuickKnowledge {
  id: number;
  name: string;
  count: number;
}

const RECENT_KP_STORAGE_KEY = 'qbank_recent_knowledge_points';
const MAX_RECENT = 20;
const MAX_QUICK_SHOW = 10;

const loadingBankOptions = ref(false);
const loadingChapterOptions = ref(false);
const loadingKnowledgeTree = ref(false);
const loadingQuestion = ref(false);
const saving = ref(false);

const currentQuestion = ref<null | QuestionResult>(null);
const currentDetail = ref<null | QuestionDetailRaw>(null);

const bankOptions = ref<Array<{ label: string; value: number }>>([]);
const chapterOptions = ref<Array<{ label: string; value: number }>>([]);
const knowledgeTree = ref<KnowledgeTreeOption[]>([]);
const knowledgeNameMap = ref<Map<number, string>>(new Map());
const knowledgeNameIndex = ref<Map<string, number[]>>(new Map());

const selectedCategoryIds = ref<number[]>([]);
const autoNext = ref(true);

const filters = ref({
  bank_id: undefined as number | undefined,
  chapter_id: undefined as number | undefined,
  keyword: '',
  type: undefined as QuestionType | undefined,
  label_status: undefined as 'all' | 'labeled' | 'unlabeled' | undefined,
});

const pager = ref({
  page: 1,
  size: 1,
  total: 0,
});

const questionTypeOptions: Array<{ label: string; value: QuestionType }> = [
  { label: '单选题', value: 'single' },
  { label: '多选题', value: 'multiple' },
  { label: '判断题', value: 'judgement' },
  { label: '填空题', value: 'fill' },
  { label: '简答题', value: 'shortAnswer' },
];

const labelStatusOptions = [
  { label: '全部', value: undefined },
  { label: '已标注', value: 'labeled' },
  { label: '未标注', value: 'unlabeled' },
];

const treeShowChildStrategy = TreeSelect.SHOW_CHILD;

const progressText = computed(() => {
  if (!pager.value.total || !currentQuestion.value) {
    return '0 / 0';
  }
  return `${pager.value.page} / ${pager.value.total}`;
});

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

const currentKnowledgePoints = computed<Array<{ id?: number; name: string }>>(
  () => {
    const raw =
      (currentDetail.value as any)?.knowledge_point ??
      (currentQuestion.value as any)?.knowledge_point;
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw
      .map((item: any) => {
        if (typeof item === 'string' || typeof item === 'number') {
          return { name: String(item) };
        }
        if (item && typeof item === 'object') {
          return {
            id: typeof item.id === 'number' ? item.id : undefined,
            name:
              item.name || item.label || item.title || String(item.id || ''),
          };
        }
        return null;
      })
      .filter(Boolean) as Array<{ id?: number; name: string }>;
  },
);

const quickKnowledgeList = computed<QuickKnowledge[]>(() => {
  const raw = getRecentKnowledgePoints();
  return raw.slice(0, MAX_QUICK_SHOW);
});

const isQuickSelected = (kp: QuickKnowledge) => {
  return selectedCategoryIds.value.includes(kp.id);
};

function toggleQuickKnowledge(kp: QuickKnowledge) {
  const ids = [...selectedCategoryIds.value];
  const index = ids.indexOf(kp.id);
  if (index === -1) {
    ids.push(kp.id);
  } else {
    ids.splice(index, 1);
  }
  selectedCategoryIds.value = ids;
}

function getRecentKnowledgePoints(): QuickKnowledge[] {
  try {
    const raw = localStorage.getItem(RECENT_KP_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item: any) =>
          item && typeof item.id === 'number' && typeof item.name === 'string',
      )
      .toSorted((a: QuickKnowledge, b: QuickKnowledge) => b.count - a.count);
  } catch {
    return [];
  }
}

function recordKnowledgePointUsage(items: Array<{ id: number; name: string }>) {
  if (items.length === 0) return;
  const recent = getRecentKnowledgePoints();
  const nameMap = new Map(recent.map((item) => [item.id, item]));

  for (const kp of items) {
    const existing = nameMap.get(kp.id);
    if (existing) {
      existing.count += 1;
    } else {
      nameMap.set(kp.id, { id: kp.id, name: kp.name, count: 1 });
    }
  }

  const updated = [...nameMap.values()]
    .toSorted((a, b) => b.count - a.count)
    .slice(0, MAX_RECENT);

  localStorage.setItem(RECENT_KP_STORAGE_KEY, JSON.stringify(updated));
}

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

function convertKnowledgeTree(tree: SysCategoryTreeResult[]) {
  const nameMap = new Map<number, string>();
  const nameIndex = new Map<string, number[]>();

  const walk = (nodes: SysCategoryTreeResult[]): KnowledgeTreeOption[] =>
    nodes.map((node) => {
      nameMap.set(node.id, node.name);

      const normalized = node.name.trim().toLowerCase();
      const idList = nameIndex.get(normalized) || [];
      if (!idList.includes(node.id)) {
        idList.push(node.id);
      }
      nameIndex.set(normalized, idList);

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

  knowledgeNameMap.value = nameMap;
  knowledgeNameIndex.value = nameIndex;
  return walk(tree);
}

function normalizeCategoryIds(raw: any): number[] {
  if (!raw) return [];

  const source = Array.isArray(raw) ? raw : [raw];
  const result: number[] = [];
  const nameMap = knowledgeNameMap.value;
  const nameIndex = knowledgeNameIndex.value;

  for (const item of source) {
    if (typeof item === 'number') {
      if (nameMap.has(item)) {
        result.push(item);
      }
      continue;
    }
    if (item && typeof item === 'object') {
      const idCandidate = Number(item.id ?? item.category_id ?? item.cat_id);
      if (Number.isFinite(idCandidate) && nameMap.has(idCandidate)) {
        result.push(idCandidate);
        continue;
      }
      const nameCandidate = item.name || item.label || item.title;
      if (nameCandidate) {
        const candidate = nameIndex.get(
          String(nameCandidate).trim().toLowerCase(),
        );
        if (candidate && candidate.length > 0) {
          result.push(candidate[0] as number);
        }
      }
    }
  }

  return [...new Set(result)];
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

async function loadKnowledgeTree() {
  loadingKnowledgeTree.value = true;
  try {
    const tree = await getSysCategoryTreeApi({
      app_code: 'youanshang',
      type: 'knowledge_point',
      status: true,
    });
    knowledgeTree.value = convertKnowledgeTree(tree);
  } catch (error) {
    console.error(error);
    knowledgeTree.value = [];
    knowledgeNameMap.value = new Map();
    knowledgeNameIndex.value = new Map();
    message.error('加载知识点分类失败');
  } finally {
    loadingKnowledgeTree.value = false;
  }
}

function syncSelectedIdsFromQuestion() {
  const raw =
    (currentDetail.value as any)?.knowledge_point ??
    (currentQuestion.value as any)?.knowledge_point;
  selectedCategoryIds.value = normalizeCategoryIds(raw);
}

function buildQueryParams(page: number): QuestionQueryParams {
  return {
    bank_id: filters.value.bank_id,
    chapter_id: filters.value.chapter_id,
    type: filters.value.type,
    keyword: filters.value.keyword || undefined,
    page,
    size: pager.value.size,
    include_answer: true,
  };
}

async function loadQuestionDetail(questionId: number) {
  try {
    currentDetail.value = (await getQuestionDetailApi(
      questionId,
    )) as QuestionDetailRaw;
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
      return;
    }

    currentQuestion.value = data.items[0] || null;
    if (currentQuestion.value?.id) {
      await loadQuestionDetail(currentQuestion.value.id);
      syncSelectedIdsFromQuestion();
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

async function saveKnowledgePoints() {
  if (!currentQuestion.value) {
    message.warning('当前没有可保存的题目');
    return;
  }

  const normalizedIds = [...new Set(selectedCategoryIds.value)]
    .filter((item) => Number.isFinite(item))
    .filter((item) => knowledgeNameMap.value.has(item));

  const knowledgePointPayload = normalizedIds.map((id) => ({
    id,
    name: knowledgeNameMap.value.get(id) || String(id),
  }));

  const source: any = currentDetail.value || currentQuestion.value;
  const core = {
    type: currentQuestion.value.type,
    stem: source?.stem || currentQuestion.value.stem || '',
    difficulty:
      source?.difficulty || currentQuestion.value.difficulty || 'medium',
    default_score:
      source?.default_score ?? currentQuestion.value.default_score ?? 1,
    knowledge_point: (knowledgePointPayload.length > 0
      ? knowledgePointPayload
      : null) as any,
    content_status:
      source?.content_status ?? currentQuestion.value.content_status ?? 10,
  };

  saving.value = true;
  try {
    await updateQuestionApi(currentQuestion.value.id, { core });
    message.success('知识点已保存');
    recordKnowledgePointUsage(knowledgePointPayload);
    if (autoNext.value) {
      nextQuestion(false);
    }
  } catch (error) {
    console.error(error);
    message.error('保存失败');
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
    pager.value.page = 1;
    pager.value.total = 0;

    if (bankId) {
      await loadChapterOptions(bankId);
    }
  },
);

onMounted(() => {
  loadBankOptions();
  loadKnowledgeTree();
});
</script>

<template>
  <Page auto-content-height>
    <div class="flex h-full flex-col gap-3">
      <Card title="筛选条件" size="small">
        <div class="grid grid-cols-5 gap-3">
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
            placeholder="请选择章节"
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
            v-model:value="filters.label_status"
            :options="labelStatusOptions"
            placeholder="标注状态"
          />
          <Input
            v-model:value="filters.keyword"
            allow-clear
            placeholder="题干关键词（可选）"
            @press-enter="handleSearch"
          />
        </div>
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <Button type="primary" @click="handleSearch">搜索</Button>
          <Button @click="prevQuestion">上一题</Button>
          <Button @click="() => nextQuestion()">下一题</Button>
          <span class="text-sm text-gray-500">
            当前进度：{{ progressText }}
          </span>
          <div class="ml-auto flex items-center gap-2">
            <span class="text-sm text-gray-500">保存后自动下一题</span>
            <Switch v-model:checked="autoNext" size="small" />
          </div>
        </div>
      </Card>

      <div class="flex flex-1 gap-3 overflow-hidden">
        <Card title="知识点树" size="small" class="w-80 shrink-0 overflow-auto">
          <Spin :spinning="loadingKnowledgeTree">
            <TreeSelect
              v-model:value="selectedCategoryIds"
              :tree-data="knowledgeTree"
              :tree-default-expand-all="true"
              :show-checked-strategy="treeShowChildStrategy"
              :allow-clear="true"
              :tree-checkable="true"
              tree-node-filter-prop="title"
              style="width: 100%"
              placeholder="选择知识点"
              show-search
            />
          </Spin>
        </Card>

        <Card size="small" class="flex-1 overflow-auto">
          <template #title>
            <div class="flex items-center gap-2">
              <span>题目信息</span>
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

          <Spin :spinning="loadingQuestion || saving">
            <div v-if="currentQuestion">
              <div class="space-y-4">
                <div class="rounded border border-gray-200 bg-gray-50 p-3">
                  <div class="mb-1 text-sm font-medium text-gray-600">题干</div>
                  <div
                    class="prose max-w-none text-sm"
                    v-html="currentDetail?.stem || currentQuestion.stem"
                  ></div>
                </div>

                <div
                  v-if="displayOptions.length > 0"
                  class="rounded border border-gray-200 bg-gray-50 p-3"
                >
                  <div class="mb-1 text-sm font-medium text-gray-600">选项</div>
                  <div class="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <div
                      v-for="option in displayOptions"
                      :key="option.code"
                      class="rounded border p-2 text-sm"
                      :class="
                        correctOptionCodes.has(option.code)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 bg-white'
                      "
                    >
                      <span class="font-medium">
                        {{ option.code
                        }}{{ correctOptionCodes.has(option.code) ? ' ✓' : '' }}
                      </span>
                      <span class="ml-2" v-html="option.content"></span>
                    </div>
                  </div>
                </div>

                <div class="rounded border border-gray-200 bg-gray-50 p-3">
                  <div class="mb-1 text-sm font-medium text-gray-600">答案</div>
                  <div class="text-sm">{{ answerText }}</div>
                </div>

                <div class="rounded border border-gray-200 bg-blue-50 p-3">
                  <div class="mb-2 flex items-center justify-between">
                    <div class="text-sm font-medium text-blue-700">
                      当前知识点
                    </div>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <Tag
                      v-for="kp in currentKnowledgePoints"
                      :key="kp.name"
                      color="blue"
                    >
                      {{ kp.name }}
                    </Tag>
                    <span
                      v-if="currentKnowledgePoints.length === 0"
                      class="text-sm text-gray-400"
                    >
                      未标注
                    </span>
                  </div>
                </div>

                <div
                  v-if="quickKnowledgeList.length > 0"
                  class="rounded border border-gray-200 bg-yellow-50 p-3"
                >
                  <div class="mb-2 text-sm font-medium text-yellow-700">
                    快速选择（常用知识点）
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <Tag
                      v-for="kp in quickKnowledgeList"
                      :key="kp.id"
                      :color="isQuickSelected(kp) ? 'green' : 'default'"
                      class="cursor-pointer"
                      @click="toggleQuickKnowledge(kp)"
                    >
                      {{ kp.name }}
                    </Tag>
                  </div>
                </div>
              </div>
            </div>

            <Empty v-else description="请选择试卷后搜索，或调整筛选条件" />
          </Spin>
        </Card>
      </div>

      <div class="flex items-center justify-end gap-2">
        <Button
          type="primary"
          :loading="saving"
          :disabled="!currentQuestion"
          @click="saveKnowledgePoints"
        >
          保存知识点
        </Button>
      </div>
    </div>
  </Page>
</template>

<style scoped>
:deep(.ant-tree-select-dropdown) {
  max-height: 60vh;
}
</style>
