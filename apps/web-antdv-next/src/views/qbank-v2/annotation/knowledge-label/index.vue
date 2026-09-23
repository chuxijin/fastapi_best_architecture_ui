<script setup lang="ts">
import type {
  GetBankSectionDetail,
  GetKnowledgeSystemListItem,
  GetQuestionDetail,
  GetQuestionListItem,
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
  getBankCompositionApi,
  getKnowledgePointsTreeApi,
  getKnowledgeSystemsApi,
  getQuestionApi,
  getSysCategoryTreeApi,
  qbankV2GetAdminBankListApi,
  qbankV2GetQuestionListApi,
  qbankV2UpdateQuestionApi,
} from '#/api';

const SYSTEM_STORAGE_KEY = 'qbank_label_system_id';
const RECENT_KP_STORAGE_KEY = 'qbank_recent_knowledge_points';
const MAX_RECENT = 20;
const MAX_QUICK_SHOW = 10;
const BANK_SEARCH_SIZE = 50;
const BANK_SEARCH_DEBOUNCE = 300;

const questionTypeMap: Record<string, string> = {
  composite: '复合题',
  fill_blank: '填空题',
  multiple_choice: '多选题',
  short_answer: '简答题',
  single_choice: '单选题',
  true_false: '判断题',
};

interface KnowledgeTreeNode {
  children?: KnowledgeTreeNode[];
  key: number;
  title: string;
  value: number;
}

interface KnowledgeNodeRaw {
  children?: KnowledgeNodeRaw[];
  id: number;
  name: string;
}

interface SectionTreeNode {
  children?: SectionTreeNode[];
  label: string;
  value: number;
}

interface QuickKnowledge {
  count: number;
  id: number;
  name: string;
}

interface QuestionPageData {
  detail: GetQuestionDetail | null;
  question: GetQuestionListItem | null;
}

const loadingDomains = ref(false);
const loadingSystems = ref(false);
const loadingKnowledgeTree = ref(false);
const loadingQuestion = ref(false);
const loadingBanks = ref(false);
const loadingSections = ref(false);
const saving = ref(false);

const domainOptions = ref<Array<{ label: string; value: number }>>([]);
const systemOptions = ref<Array<{ label: string; value: number }>>([]);
const bankOptions = ref<
  Array<{ label: string; revisionId?: number; value: number }>
>([]);
const sectionTree = ref<SectionTreeNode[]>([]);
const knowledgeTree = ref<KnowledgeTreeNode[]>([]);
const knowledgeNameMap = ref<Map<number, string>>(new Map());
/** 知识点树的父子索引：用于「子带父」勾选（向上补祖先 / 向下连带取消后代） */
const pointParentMap = ref<Map<number, number>>(new Map());
const pointChildMap = ref<Map<number, number[]>>(new Map());
/**
 * 用户「真正想标注」的知识点（不含自动补上来的祖先）。
 * selectedIds = 该集合的祖先闭包，因此界面上父节点被勾上时它是被推导出来的、不在这里。
 * 必须与 selectedIds 分开存，否则「取消勾选」无法判断要不要连带删掉子树。
 */
const explicitIds = new Set<number>();

const domainId = ref<number | undefined>();
const systemId = ref<number | undefined>();
const selectedIds = ref<number[]>([]);
const autoNext = ref(true);

const currentQuestion = ref<GetQuestionListItem | null>(null);
const currentDetail = ref<GetQuestionDetail | null>(null);

const filters = ref({
  bank_id: undefined as number | undefined,
  keyword: '',
  label_status: 'all' as 'all' | 'labeled' | 'unlabeled',
  section_id: undefined as number | undefined,
  type: undefined as string | undefined,
});

const pager = ref({
  page: 1,
  size: 1,
  total: 0,
});

const questionTypeOptions = [
  { label: '单选题', value: 'single_choice' },
  { label: '多选题', value: 'multiple_choice' },
  { label: '判断题', value: 'true_false' },
  { label: '填空题', value: 'fill_blank' },
  { label: '简答题', value: 'short_answer' },
];

const labelStatusOptions = [
  { label: '全部', value: 'all' },
  { label: '已标注', value: 'labeled' },
  { label: '未标注', value: 'unlabeled' },
];

/**
 * TreeSelect 勾选值的桥接层。
 *
 * 之前用默认的父子联动 + SHOW_CHILD 策略，勾父节点会级联勾上全部后代，
 * 且 value 只收叶子节点 ⇒ 父级知识点（如「数量关系」「数学运算」）永远提交不上。
 * 改为 `tree-check-strictly`（父子互不联动）后，点谁就是谁，父子关系由我们自己算。
 *
 * 自定义规则「子带父」：
 *   - 勾选某个知识点 ⇒ 自动把它的全部祖先一并勾上（勾「行程问题」带出「数学运算」「数量关系」）；
 *   - 直接勾选父节点 ⇒ 不会连带勾选任何子节点；
 *   - 取消某个节点 ⇒ 连带取消它的整棵子树（否则子节点会立刻把父节点带回来，父节点永远取消不掉）。
 *
 * 注意坑：`tree-check-strictly` 会连带把 labelInValue 变成 true，v-model 收到的是
 * { value, label } 对象，这里统一转换，让 selectedIds 保持 number[]，其余逻辑无需改动。
 */
const treeCheckedValue = computed({
  get: () =>
    selectedIds.value.map((id) => ({
      label: knowledgeNameMap.value.get(id) ?? String(id),
      value: id,
    })),
  set: (value) => {
    const list = (value ?? []) as Array<{ value?: number } | number>;
    const incoming = list
      .map((item) => (typeof item === 'number' ? item : item?.value))
      .filter((id): id is number => typeof id === 'number');

    const prev = selectedIds.value;
    // 新勾选的节点记入 explicitIds
    for (const id of incoming) {
      if (!prev.includes(id)) explicitIds.add(id);
    }
    // 被取消的节点从 explicitIds 的整棵子树里摘掉
    for (const id of prev) {
      if (!incoming.includes(id)) removeSubtree(id, explicitIds);
    }

    selectedIds.value = withAncestors(explicitIds);
  },
});

const totalPages = computed(() =>
  Math.ceil(pager.value.total / pager.value.size),
);

const progressText = computed(() => {
  if (!pager.value.total || !currentQuestion.value) {
    return '0 / 0';
  }
  return `${pager.value.page} / ${pager.value.total}`;
});

const currentSystemLabel = computed(
  () =>
    systemOptions.value.find((item) => item.value === systemId.value)?.label ??
    '',
);

const pointIdSet = computed(() => {
  const ids = new Set<number>();
  const walk = (nodes: KnowledgeTreeNode[]) => {
    for (const node of nodes) {
      ids.add(node.value);
      if (node.children && node.children.length > 0) {
        walk(node.children);
      }
    }
  };
  walk(knowledgeTree.value);
  return ids;
});

const assignedPoints = computed(
  () => currentDetail.value?.knowledge_points ?? [],
);

const foreignPoints = computed(() =>
  assignedPoints.value.filter(
    (item) => !pointIdSet.value.has(item.knowledge_point_id),
  ),
);

const displayOptions = computed(() => {
  const options = currentDetail.value?.options ?? [];
  return [...options].toSorted(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
});

const correctOptionCodes = computed<Set<string>>(() => {
  const correct = currentDetail.value?.answer?.answer_data?.correct;
  if (Array.isArray(correct)) {
    return new Set(correct.map(String));
  }
  if (correct === undefined || correct === null || correct === '') {
    return new Set<string>();
  }
  return new Set([String(correct)]);
});

const answerText = computed(() => {
  const correct = currentDetail.value?.answer?.answer_data?.correct;
  if (correct === undefined || correct === null || correct === '') {
    return '-';
  }
  if (currentQuestion.value?.question_type === 'true_false') {
    if (correct === true) return '正确';
    if (correct === false) return '错误';
    return String(correct);
  }
  if (Array.isArray(correct)) {
    return correct.join('、');
  }
  return String(correct);
});

const currentExplanation = computed(() => {
  const list = currentDetail.value?.explanations ?? [];
  return list.find((item) => item.is_default) ?? list[0] ?? null;
});

const quickKnowledgeList = computed<QuickKnowledge[]>(() =>
  getRecentKnowledgePoints()
    .filter((item) => knowledgeNameMap.value.has(item.id))
    .slice(0, MAX_QUICK_SHOW),
);

function errorText(error: unknown, fallback: string) {
  const value = error as { message?: string; msg?: string } | null;
  return value?.msg || value?.message || fallback;
}

function isQuickSelected(kp: QuickKnowledge) {
  return selectedIds.value.includes(kp.id);
}

function toggleQuickKnowledge(kp: QuickKnowledge) {
  // 与树上的语义保持一致：勾选带出祖先，取消连带删掉整棵子树
  if (selectedIds.value.includes(kp.id)) {
    removeSubtree(kp.id, explicitIds);
  } else {
    explicitIds.add(kp.id);
  }
  selectedIds.value = withAncestors(explicitIds);
}

function getRecentKnowledgePoints(): QuickKnowledge[] {
  try {
    const raw = localStorage.getItem(RECENT_KP_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item: unknown) =>
          item &&
          typeof (item as QuickKnowledge).id === 'number' &&
          typeof (item as QuickKnowledge).name === 'string',
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
      nameMap.set(kp.id, { count: 1, id: kp.id, name: kp.name });
    }
  }

  const updated = [...nameMap.values()]
    .toSorted((a, b) => b.count - a.count)
    .slice(0, MAX_RECENT);

  localStorage.setItem(RECENT_KP_STORAGE_KEY, JSON.stringify(updated));
}

function convertKnowledgeTree(nodes: KnowledgeNodeRaw[]) {
  const nameMap = new Map<number, string>();
  const parentMap = new Map<number, number>();
  const childMap = new Map<number, number[]>();
  const walk = (
    items: KnowledgeNodeRaw[],
    parentId?: number,
  ): KnowledgeTreeNode[] =>
    items.map((item) => {
      nameMap.set(item.id, item.name);
      if (parentId !== undefined) {
        parentMap.set(item.id, parentId);
        const siblings = childMap.get(parentId) ?? [];
        siblings.push(item.id);
        childMap.set(parentId, siblings);
      }
      return {
        children:
          item.children && item.children.length > 0
            ? walk(item.children, item.id)
            : undefined,
        key: item.id,
        title: item.name,
        value: item.id,
      };
    });
  return { childMap, nameMap, parentMap, tree: walk(nodes) };
}

/**
 * 收集这些节点及其全部祖先 id（「子带父」）。
 * 勾「行程问题」会连带「数学运算」「数量关系」，但直接勾「数量关系」不会带出任何子节点。
 */
function withAncestors(ids: Iterable<number>): number[] {
  const result = new Set<number>();
  for (const id of ids) {
    let current: number | undefined = id;
    while (current !== undefined && !result.has(current)) {
      result.add(current);
      current = pointParentMap.value.get(current);
    }
  }
  return [...result];
}

/**
 * 从 target 中移除 id 及其全部后代。
 * 取消节点必须连子树一起摘掉，否则被留下的子节点会通过 withAncestors 把父节点立刻带回来。
 */
function removeSubtree(id: number, target: Set<number>) {
  target.delete(id);
  for (const child of pointChildMap.value.get(id) ?? []) {
    removeSubtree(child, target);
  }
}

function syncSelectedIds() {
  const ids = assignedPoints.value
    .map((item) => item.knowledge_point_id)
    .filter((id) => pointIdSet.value.has(id));
  // 库里存的就是「真实标注」，回填到 explicitIds；界面上再补全祖先
  explicitIds.clear();
  for (const id of ids) explicitIds.add(id);
  selectedIds.value = withAncestors(explicitIds);
}

function querySignature() {
  return JSON.stringify({
    bank: filters.value.bank_id ?? null,
    keyword: filters.value.keyword || '',
    labeled: filters.value.label_status,
    section: filters.value.section_id ?? null,
    type: filters.value.type ?? null,
  });
}

function cacheKey(page: number) {
  return `${querySignature()}#${page}`;
}

function buildQueryParams(page: number) {
  const labeled = filters.value.label_status;
  return {
    bank_id: filters.value.bank_id,
    knowledge_labeled:
      labeled === 'labeled'
        ? true
        : labeled === 'unlabeled'
          ? false
          : undefined,
    keyword: filters.value.keyword || undefined,
    page,
    question_type: filters.value.type as never,
    section_id: filters.value.section_id,
    size: pager.value.size,
  };
}

async function fetchPage(page: number): Promise<QuestionPageData> {
  const data = await qbankV2GetQuestionListApi(buildQueryParams(page));
  pager.value.total = data.total;
  const question = data.items[0] ?? null;
  if (!question) {
    return { detail: null, question: null };
  }
  const detail = await getQuestionApi(question.id);
  return { detail, question };
}

async function prefetchPage(
  page: number,
  cache: Map<string, QuestionPageData>,
) {
  if (page < 1) return;
  if (totalPages.value > 0 && page > totalPages.value) return;
  const key = cacheKey(page);
  if (cache.has(key)) return;
  try {
    cache.set(key, await fetchPage(page));
  } catch {
    // 预取失败不打扰用户，翻到该页时会重新请求
  }
}

const pageCache = new Map<string, QuestionPageData>();

async function goPage(page: number) {
  if (!filters.value.bank_id) {
    message.warning('请先选择试卷');
    return;
  }
  if (page < 1) {
    message.info('已经是第一题');
    return;
  }
  if (totalPages.value > 0 && page > totalPages.value) {
    message.info('已经是最后一题');
    return;
  }

  loadingQuestion.value = true;
  try {
    const key = cacheKey(page);
    let data = pageCache.get(key);
    if (!data) {
      data = await fetchPage(page);
      pageCache.set(key, data);
    }
    pager.value.page = page;
    currentQuestion.value = data.question;
    currentDetail.value = data.detail;
    syncSelectedIds();
  } catch (error) {
    console.error(error);
    message.error(errorText(error, '加载题目失败'));
  } finally {
    loadingQuestion.value = false;
  }

  void prefetchPage(page + 1, pageCache);
}

function handleSearch() {
  pager.value.page = 1;
  pager.value.total = 0;
  void goPage(1);
}

function prevQuestion() {
  void goPage(pager.value.page - 1);
}

function nextQuestion(showTip = true) {
  if (pager.value.total && pager.value.page >= totalPages.value) {
    if (showTip) {
      message.info('已经是最后一题');
    }
    return;
  }
  void goPage(pager.value.page + 1);
}

async function persistKnowledgePoints() {
  if (!currentQuestion.value) return;
  // 没拿到体系 ID 就绝不能保存：后端会退回「替换全部体系」的历史行为，把别的体系标注删光
  if (!systemId.value) {
    message.warning('缺少知识体系版本，已取消保存');
    return;
  }
  const ids = [...new Set(selectedIds.value)].filter((id) =>
    knowledgeNameMap.value.has(id),
  );
  const questionId = currentQuestion.value.id;

  saving.value = true;
  try {
    await qbankV2UpdateQuestionApi(questionId, {
      // 必须带体系 ID：否则后端会把该题**其他体系**的标注一起物理删除（不可恢复）
      knowledge_system_id: systemId.value,
      knowledge_points: ids.map((id) => ({
        knowledge_point_id: id,
        source: 'manual' as const,
      })),
    });
    message.success(
      ids.length > 0 ? `已保存 ${ids.length} 个知识点` : '已清空该题的知识点',
    );
    recordKnowledgePointUsage(
      ids.map((id) => ({
        id,
        name: knowledgeNameMap.value.get(id) ?? String(id),
      })),
    );
    pageCache.delete(cacheKey(pager.value.page));
    if (autoNext.value) {
      nextQuestion(false);
    } else {
      void goPage(pager.value.page);
    }
  } catch (error) {
    console.error(error);
    message.error(errorText(error, '保存失败'));
  } finally {
    saving.value = false;
  }
}

function saveKnowledgePoints() {
  if (!currentQuestion.value) {
    message.warning('当前没有可保存的题目');
    return;
  }
  // 保存只替换当前体系的标注，其他体系的标签不受影响，因此不再需要二次确认
  void persistKnowledgePoints();
}

async function loadKnowledgeTree() {
  if (!systemId.value) {
    knowledgeTree.value = [];
    knowledgeNameMap.value = new Map();
    pointParentMap.value = new Map();
    pointChildMap.value = new Map();
    explicitIds.clear();
    selectedIds.value = [];
    return;
  }
  loadingKnowledgeTree.value = true;
  try {
    const data = await getKnowledgePointsTreeApi(systemId.value);
    const { childMap, nameMap, parentMap, tree } = convertKnowledgeTree(
      (data.points ?? []) as unknown as KnowledgeNodeRaw[],
    );
    knowledgeTree.value = tree;
    knowledgeNameMap.value = nameMap;
    // 父子索引必须在 syncSelectedIds() 之前就位，回填要用它补祖先
    pointParentMap.value = parentMap;
    pointChildMap.value = childMap;
    localStorage.setItem(SYSTEM_STORAGE_KEY, String(systemId.value));
    syncSelectedIds();
  } catch (error) {
    console.error(error);
    knowledgeTree.value = [];
    knowledgeNameMap.value = new Map();
    pointParentMap.value = new Map();
    pointChildMap.value = new Map();
    message.error('加载知识点失败');
  } finally {
    loadingKnowledgeTree.value = false;
  }
}

async function loadSystems() {
  if (!domainId.value) return;
  loadingSystems.value = true;
  try {
    const data = await getKnowledgeSystemsApi({
      domain_category_id: domainId.value,
      size: 100,
    });
    const items: GetKnowledgeSystemListItem[] = data.items ?? [];
    systemOptions.value = items.map((item) => ({
      label: `${item.name} · ${item.version}`,
      value: item.id,
    }));
    const savedId = Number(localStorage.getItem(SYSTEM_STORAGE_KEY));
    const preferred =
      items.find((item) => item.id === savedId) ??
      items.find((item) => item.version === 'default') ??
      items[0];
    systemId.value = preferred?.id;
    if (!preferred) {
      message.warning('当前领域还没有启用的知识体系版本');
    }
  } catch (error) {
    console.error(error);
    systemOptions.value = [];
    systemId.value = undefined;
    message.error('加载知识体系版本失败');
  } finally {
    loadingSystems.value = false;
  }
}

async function loadDomains() {
  loadingDomains.value = true;
  try {
    // 领域根分类仍来自 sys_category 的 product_catalog 树，知识点树本身已切到 qbank_v2
    const tree = await getSysCategoryTreeApi({
      app_code: 'youanshang',
      status: true,
      type: 'product_catalog',
    });
    const list = (Array.isArray(tree) ? tree : []) as SysCategoryTreeResult[];
    domainOptions.value = list.map((item) => ({
      label: item.name,
      value: item.id,
    }));
    const preferred =
      domainOptions.value.find((item) => item.label === '公考') ??
      domainOptions.value[0];
    domainId.value = preferred?.value;
  } catch (error) {
    console.error(error);
    domainOptions.value = [];
    message.error('加载领域列表失败');
  } finally {
    loadingDomains.value = false;
  }
}

let bankSearchTimer: ReturnType<typeof setTimeout> | undefined;

async function loadBanks(keyword?: string) {
  loadingBanks.value = true;
  try {
    // 用管理端接口：公开列表 /banks 只含已发布题库，这里要覆盖草稿/非公开的内部题库
    const data = await qbankV2GetAdminBankListApi({
      keyword: keyword || undefined,
      size: BANK_SEARCH_SIZE,
    });
    bankOptions.value = (data.items ?? []).map((item) => ({
      label: item.name,
      // 管理端列表同时返回两个版本 ID：revision_id 是最新版本、current_revision_id 是当前生效版本。
      // 题库目前都只有一个版本，两者相同；优先取最新版本以免漏掉新导入的题
      revisionId: item.revision_id ?? item.current_revision_id,
      value: item.id,
    }));
  } catch (error) {
    console.error(error);
    message.error('加载题库列表失败');
  } finally {
    loadingBanks.value = false;
  }
}

function toSectionTree(nodes: GetBankSectionDetail[]): SectionTreeNode[] {
  return nodes.map((item) => ({
    children: item.children?.length ? toSectionTree(item.children) : undefined,
    label: item.name,
    value: item.id,
  }));
}

async function loadSections() {
  const bankId = filters.value.bank_id;
  const revisionId = bankOptions.value.find(
    (item) => item.value === bankId,
  )?.revisionId;
  if (!bankId) {
    sectionTree.value = [];
    return;
  }
  // 选题库后拿不到版本号时不要静默失败，否则下拉会一直是「暂无数据」且无任何提示
  if (!revisionId) {
    sectionTree.value = [];
    message.warning('该题库没有可用版本，无法加载章节');
    return;
  }
  loadingSections.value = true;
  try {
    const data = await getBankCompositionApi(bankId, revisionId);
    sectionTree.value = toSectionTree(data.sections ?? []);
  } catch (error) {
    console.error(error);
    sectionTree.value = [];
    message.error('加载章节失败');
  } finally {
    loadingSections.value = false;
  }
}

function handleBankSearch(keyword: string) {
  if (bankSearchTimer) {
    clearTimeout(bankSearchTimer);
  }
  bankSearchTimer = setTimeout(() => {
    void loadBanks(keyword);
  }, BANK_SEARCH_DEBOUNCE);
}

watch(systemId, () => {
  void loadKnowledgeTree();
});

function resetQuestionState() {
  currentQuestion.value = null;
  currentDetail.value = null;
  pager.value.page = 1;
  pager.value.total = 0;
  explicitIds.clear();
  selectedIds.value = [];
}

watch(
  () => filters.value.bank_id,
  () => {
    filters.value.section_id = undefined;
    resetQuestionState();
    void loadSections();
  },
);

watch(() => filters.value.section_id, resetQuestionState);

onMounted(async () => {
  await loadDomains();
  await loadSystems();
  void loadBanks();
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
            :loading="loadingBanks"
            :allow-clear="true"
            :filter-option="false"
            placeholder="搜索并选择题库"
            show-search
            @search="handleBankSearch"
          />
          <TreeSelect
            v-model:value="filters.section_id"
            :tree-data="sectionTree"
            :loading="loadingSections"
            :tree-default-expand-all="true"
            :allow-clear="true"
            :disabled="!filters.bank_id"
            tree-node-filter-prop="label"
            placeholder="全部章节（含子章节）"
            show-search
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
          <span class="text-sm text-gray-500"
            >当前进度：{{ progressText }}</span
          >
          <div class="ml-auto flex items-center gap-2">
            <span class="text-sm text-gray-500">保存后自动下一题</span>
            <Switch v-model:checked="autoNext" size="small" />
          </div>
        </div>
      </Card>

      <div class="flex flex-1 gap-3 overflow-hidden">
        <Card title="知识点" size="small" class="w-80 shrink-0 overflow-auto">
          <div class="mb-2 flex flex-col gap-2">
            <Select
              v-model:value="domainId"
              :options="domainOptions"
              :loading="loadingDomains"
              placeholder="所属领域"
              size="small"
            />
            <Select
              v-model:value="systemId"
              :options="systemOptions"
              :loading="loadingSystems"
              placeholder="知识体系版本"
              size="small"
            />
          </div>
          <Spin :spinning="loadingKnowledgeTree">
            <TreeSelect
              v-model:value="treeCheckedValue"
              :tree-data="knowledgeTree"
              :tree-default-expand-all="true"
              :tree-check-strictly="true"
              :label-in-value="true"
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
                  questionTypeMap[currentQuestion.question_type] ||
                  currentQuestion.question_type
                }}
              </Tag>
              <Tag v-if="currentQuestion" color="cyan">
                {{ currentQuestion.code }}
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
                      :key="option.option_code"
                      class="rounded border p-2 text-sm"
                      :class="
                        correctOptionCodes.has(option.option_code)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 bg-white'
                      "
                    >
                      <span class="font-medium">
                        {{ option.option_code
                        }}{{
                          correctOptionCodes.has(option.option_code) ? ' ✓' : ''
                        }}
                      </span>
                      <span class="ml-2" v-html="option.content"></span>
                    </div>
                  </div>
                </div>

                <div class="rounded border border-gray-200 bg-gray-50 p-3">
                  <div class="mb-1 text-sm font-medium text-gray-600">答案</div>
                  <div class="text-sm">{{ answerText }}</div>
                </div>

                <div
                  v-if="currentExplanation"
                  class="rounded border border-gray-200 bg-gray-50 p-3"
                >
                  <div class="mb-1 text-sm font-medium text-gray-600">解析</div>
                  <div
                    class="prose max-w-none text-sm"
                    v-html="currentExplanation.content"
                  ></div>
                </div>

                <div class="rounded border border-gray-200 bg-blue-50 p-3">
                  <div class="mb-2 flex items-center justify-between">
                    <div class="text-sm font-medium text-blue-700">
                      当前已标注（{{ assignedPoints.length }}）
                    </div>
                    <span
                      v-if="foreignPoints.length > 0"
                      class="text-xs text-orange-600"
                    >
                      其中 {{ foreignPoints.length }} 个来自其他知识体系
                    </span>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <Tag
                      v-for="kp in assignedPoints"
                      :key="kp.id"
                      :color="
                        pointIdSet.has(kp.knowledge_point_id)
                          ? 'blue'
                          : 'orange'
                      "
                    >
                      {{ kp.knowledge_point_name }}
                    </Tag>
                    <span
                      v-if="assignedPoints.length === 0"
                      class="text-sm text-gray-400"
                    >
                      未标注
                    </span>
                  </div>
                  <p
                    v-if="foreignPoints.length > 0"
                    class="mt-2 text-xs text-orange-600"
                  >
                    橙色标签来自其他知识体系，保存只替换当前体系 「{{
                      currentSystemLabel
                    }}」的标注，不会影响它们。
                  </p>
                </div>

                <div
                  v-if="quickKnowledgeList.length > 0"
                  class="rounded border border-gray-200 bg-yellow-50 p-3"
                >
                  <div class="mb-2 text-sm font-medium text-yellow-700">
                    快速选择（常用知识点·当前体系）
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
        <span class="text-sm text-gray-500">
          已选 {{ selectedIds.length }} 个知识点
        </span>
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
