<script setup lang="ts">
import type { VbenFormProps, VbenFormSchema } from '@vben/common-ui';

import type { VisualFieldRow } from '../utils';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  CreateLearningPlanParams,
  CreateLearningTaskParams,
  GetBankDetail,
  GetBankListItem,
  GetKnowledgePointTreeNode,
  GetKnowledgeSystemListItem,
  GetQuestionListItem,
  LearningPlanDetail,
  LearningTaskDetail,
  LearningTaskGoal,
  LearningTaskKnowledgePoint,
  QbankV2QuestionType,
  SysCategoryTreeResult,
} from '#/api';

import { computed, nextTick, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { message, TreeSelect } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createLearningPlanApi,
  createLearningTaskApi,
  deleteLearningPlanApi,
  deleteLearningTaskApi,
  getBankApi,
  getKnowledgePointsTreeApi,
  getKnowledgeSystemsApi,
  getLearningPlansApi,
  getLearningTasksApi,
  getSysCategoryTreeApi,
  getSysUserListApi,
  qbankV2GetAdminBankListApi,
  qbankV2GetQuestionListApi,
  updateLearningPlanApi,
  updateLearningTaskApi,
} from '#/api';

import VisualFieldEditor from '../components/VisualFieldEditor.vue';
import { objectToVisualFields, visualFieldsToObject } from '../utils';

type Option = { label: string; value: number | string };
type KnowledgeTreeOption = {
  children?: KnowledgeTreeOption[];
  key: number;
  title: string;
  value: number;
};
type GoalForm = Omit<LearningTaskGoal, 'metric'> & {
  customMetric: string;
  metricMode: string;
  rowKey: number;
};

const planSourceOptions = [
  { label: '系统生成', value: 'system' },
  { label: '用户创建', value: 'user' },
  { label: '后台定制', value: 'admin_custom' },
  { label: 'AI 生成', value: 'ai' },
];
const planStatusOptions = [
  { color: 'default', label: '草稿', value: 'draft' },
  { color: 'green', label: '进行中', value: 'active' },
  { color: 'orange', label: '已暂停', value: 'paused' },
  { color: 'blue', label: '已完成', value: 'completed' },
  { color: 'default', label: '已归档', value: 'archived' },
];
const actionTypeOptions = [
  { label: '学习', value: 'learn' },
  { label: '阅读', value: 'read' },
  { label: '刷题', value: 'practice' },
  { label: '错题复习', value: 'wrong_review' },
  { label: '能力练习', value: 'ability' },
  { label: '复习', value: 'review' },
  { label: '自定义', value: 'custom' },
];
const resourceTypeOptions = [
  { label: '无资源', value: 'none' },
  { label: '文章/内容', value: 'content' },
  { label: '课程', value: 'course' },
  { label: '课程课时', value: 'course_lesson' },
  { label: '题库', value: 'question_bank' },
  { label: '能力练习', value: 'ability' },
  { label: '外部资源', value: 'external' },
];
const taskStatusOptions = [
  { color: 'default', label: '待开始', value: 'pending' },
  { color: 'processing', label: '进行中', value: 'in_progress' },
  { color: 'success', label: '已完成', value: 'completed' },
  { color: 'warning', label: '已跳过', value: 'skipped' },
  { color: 'error', label: '已取消', value: 'canceled' },
];
const goalMetricOptions = [
  { label: '刷题数量', unit: '题', value: 'question_count' },
  { label: '正确率', unit: '%', value: 'accuracy' },
  { label: '专注时长', unit: '秒', value: 'focus_seconds' },
  { label: '阅读确认', unit: '次', value: 'read_acknowledged' },
  { label: '尝试次数', unit: '次', value: 'attempt_count' },
  { label: '自定义指标', unit: '', value: 'custom' },
];
const operatorOptions = [
  { label: '不少于', value: 'gte' },
  { label: '不多于', value: 'lte' },
  { label: '等于', value: 'eq' },
];
const questionModeOptions = [
  { label: '随机抽题', value: 'random' },
  { label: '顺序练习', value: 'sequential' },
];
const difficultyOptions = [
  { label: '1 星（简单）', value: 1 },
  { label: '2 星（较易）', value: 2 },
  { label: '3 星（中等）', value: 3 },
  { label: '4 星（较难）', value: 4 },
  { label: '5 星（困难）', value: 5 },
];
const questionTypeOptions = [
  { label: '单选题', value: 'single_choice' },
  { label: '多选题', value: 'multiple_choice' },
  { label: '判断题', value: 'true_false' },
  { label: '填空题', value: 'fill_blank' },
  { label: '简答题', value: 'short_answer' },
  { label: '复合题', value: 'composite' },
  { label: '互动题', value: 'interactive' },
];

const RESOURCE_CONFIG_KEYS = [
  'ability_level',
  'include_answer',
  'must_finish',
  'open_method',
  'provider',
  'question_count',
  'question_mode',
  'reading_mode',
  'repeat_count',
  'require_acknowledge',
  'start_position_seconds',
  'training_mode',
  'difficulty',
];

const today = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};
const findOption = (options: any[], value: unknown) =>
  options.find((item) => item.value === value);

const userOptions = ref<Option[]>([]);
const domainCategories = ref<SysCategoryTreeResult[]>([]);
const domainCategoryOptions = computed(() =>
  domainCategories.value.map((item) => ({ label: item.name, value: item.id })),
);
const publicExamDomainId = computed(
  () => domainCategories.value.find((item) => item.code === 'pc_gongkao')?.id,
);
const knowledgeSystems = ref<GetKnowledgeSystemListItem[]>([]);

const planQuerySchema: VbenFormSchema[] = [
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      optionFilterProp: 'label',
      placeholder: '请选择用户',
      showSearch: true,
    },
    fieldName: 'user_id',
    label: '用户',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: planSourceOptions,
      placeholder: '请选择来源',
    },
    fieldName: 'source_type',
    label: '计划来源',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: planStatusOptions,
      placeholder: '请选择状态',
    },
    fieldName: 'status',
    label: '计划状态',
  },
];

const planFormOptions: VbenFormProps = {
  collapsed: false,
  schema: planQuerySchema,
  showCollapseButton: false,
  submitButtonOptions: { content: '查询' },
};

const planGridOptions: VxeTableGridOptions<LearningPlanDetail> = {
  columns: [
    { field: 'seq', fixed: 'left', title: '序号', type: 'seq', width: 60 },
    {
      field: 'title',
      fixed: 'left',
      minWidth: 220,
      slots: { default: 'title_default' },
      title: '计划',
    },
    {
      field: 'user',
      slots: { default: 'user_default' },
      title: '用户',
      width: 180,
    },
    {
      field: 'date_range',
      slots: { default: 'date_range_default' },
      title: '计划周期',
      width: 210,
    },
    {
      field: 'source_type',
      formatter: ({ cellValue }) =>
        findOption(planSourceOptions, cellValue)?.label ?? cellValue,
      title: '来源',
      width: 110,
    },
    {
      field: 'status',
      slots: { default: 'status_default' },
      title: '状态',
      width: 100,
    },
    {
      field: 'progress',
      slots: { default: 'progress_default' },
      title: '任务进度',
      width: 170,
    },
    { field: 'created_time', title: '创建时间', width: 168 },
    {
      align: 'center',
      field: 'operation',
      fixed: 'right',
      slots: { default: 'operation_default' },
      title: '操作',
      width: 210,
    },
  ],
  height: 'auto',
  pagerConfig: { enabled: false },
  proxyConfig: {
    ajax: {
      query: async (_params, formValues) => getLearningPlansApi(formValues),
    },
  },
  rowConfig: { isHover: true, keyField: 'id' },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, zoom: true },
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: planFormOptions,
  gridOptions: planGridOptions,
});

async function loadUsers() {
  const result = (await getSysUserListApi({ page: 1, size: 200 })) as any;
  const items = Array.isArray(result) ? result : (result?.items ?? []);
  userOptions.value = items.map((item: any) => ({
    label: `${item.nickname || item.username}（${item.username} / ${item.id}）`,
    value: item.id,
  }));
  await gridApi.formApi.updateSchema([
    { componentProps: { options: userOptions.value }, fieldName: 'user_id' },
  ]);
}

async function loadKnowledgeSystems(domainCategoryId?: number) {
  knowledgeSystems.value = [];
  knowledgeSystemId.value = undefined;
  knowledgeTree.value = [];
  selectedKnowledgePointIds.value = [];
  if (!domainCategoryId) return;
  const result = await getKnowledgeSystemsApi({
    domain_category_id: domainCategoryId,
    page: 1,
    size: 200,
  });
  knowledgeSystems.value = result.items ?? [];
}

const planModalOpen = ref(false);
const planSubmitting = ref(false);
const editingPlanId = ref<number>();
const planForm = reactive({
  description: '',
  end_date: undefined as string | undefined,
  source_type: 'admin_custom' as CreateLearningPlanParams['source_type'],
  start_date: today(),
  status: 'draft' as CreateLearningPlanParams['status'],
  title: '',
  user_id: undefined as number | undefined,
});
const planModalTitle = computed(() =>
  editingPlanId.value ? '编辑学习计划' : '新建学习计划',
);

function resetPlanForm() {
  editingPlanId.value = undefined;
  planForm.user_id = undefined;
  planForm.title = '';
  planForm.start_date = today();
  planForm.end_date = undefined;
  planForm.source_type = 'admin_custom';
  planForm.status = 'draft';
  planForm.description = '';
}

function openCreatePlan() {
  resetPlanForm();
  planModalOpen.value = true;
}

function openEditPlan(record: LearningPlanDetail) {
  editingPlanId.value = record.id;
  planForm.user_id = record.user_id;
  planForm.title = record.title;
  planForm.start_date = record.start_date;
  planForm.end_date = record.end_date ?? undefined;
  planForm.source_type = record.source_type;
  planForm.status = record.status;
  planForm.description = record.description ?? '';
  planModalOpen.value = true;
}

async function submitPlan() {
  if (!planForm.user_id || !planForm.title.trim() || !planForm.start_date) {
    message.warning('请填写用户、标题和开始日期');
    return;
  }
  if (planForm.end_date && planForm.end_date < planForm.start_date) {
    message.warning('结束日期不能早于开始日期');
    return;
  }
  planSubmitting.value = true;
  try {
    const payload: CreateLearningPlanParams = {
      description: planForm.description || null,
      end_date: planForm.end_date || null,
      source_type: planForm.source_type,
      start_date: planForm.start_date,
      status: planForm.status,
      title: planForm.title.trim(),
      user_id: planForm.user_id,
    };
    if (editingPlanId.value) {
      const { user_id: _userId, ...updatePayload } = payload;
      await updateLearningPlanApi(editingPlanId.value, updatePayload);
      message.success('学习计划已更新');
    } else {
      await createLearningPlanApi(payload);
      message.success('学习计划已创建');
    }
    planModalOpen.value = false;
    gridApi.query();
  } finally {
    planSubmitting.value = false;
  }
}

async function removePlan(record: LearningPlanDetail) {
  await deleteLearningPlanApi(record.id);
  message.success('学习计划已删除');
  gridApi.query();
}

const taskDrawerOpen = ref(false);
const selectedPlan = ref<LearningPlanDetail>();
const taskGridOptions: VxeTableGridOptions<LearningTaskDetail> = {
  columns: [
    { field: 'plan_date', fixed: 'left', title: '日期', width: 110 },
    {
      field: 'title',
      fixed: 'left',
      minWidth: 220,
      slots: { default: 'task_title_default' },
      title: '任务',
    },
    {
      field: 'action_type',
      formatter: ({ cellValue }) =>
        findOption(actionTypeOptions, cellValue)?.label ?? cellValue,
      title: '行为',
      width: 105,
    },
    {
      field: 'resource_type',
      slots: { default: 'resource_default' },
      title: '资源',
      width: 130,
    },
    {
      field: 'goals',
      minWidth: 260,
      slots: { default: 'goals_default' },
      title: '完成指标',
    },
    {
      field: 'knowledge_points',
      minWidth: 250,
      slots: { default: 'knowledge_points_default' },
      title: '知识点',
    },
    {
      field: 'expected_minutes',
      formatter: ({ cellValue }) => `${cellValue} 分钟`,
      title: '预计用时',
      width: 100,
    },
    {
      field: 'status',
      slots: { default: 'task_status_default' },
      title: '状态',
      width: 100,
    },
    {
      align: 'center',
      field: 'operation',
      fixed: 'right',
      slots: { default: 'task_operation_default' },
      title: '操作',
      width: 140,
    },
  ],
  height: 'auto',
  pagerConfig: { enabled: false },
  proxyConfig: {
    ajax: {
      query: async () =>
        selectedPlan.value ? getLearningTasksApi(selectedPlan.value.id) : [],
    },
  },
  rowConfig: { isHover: true, keyField: 'id' },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, zoom: true },
};
const [TaskGrid, taskGridApi] = useVbenVxeGrid({
  gridOptions: taskGridOptions,
});

async function refreshTasks() {
  taskGridApi.query();
  gridApi.query();
}

async function openTasks(record: LearningPlanDetail) {
  selectedPlan.value = record;
  taskDrawerOpen.value = true;
  await nextTick();
  taskGridApi.query();
}

let rowSequence = 0;
const taskModalOpen = ref(false);
const taskSubmitting = ref(false);
const editingTaskId = ref<number>();
const taskForm = reactive({
  action_type: 'custom' as CreateLearningTaskParams['action_type'],
  delivery_id: undefined as number | undefined,
  description: '',
  due_at: undefined as string | undefined,
  expected_minutes: 30,
  goals: [] as GoalForm[],
  knowledge_points: [] as LearningTaskKnowledgePoint[],
  order_index: 0,
  plan_date: today(),
  remind_at: undefined as string | undefined,
  resource_id: undefined as number | undefined,
  resource_key: '',
  resource_type: 'none' as CreateLearningTaskParams['resource_type'],
  resource_version_id: undefined as number | undefined,
  status: 'pending' as LearningTaskDetail['status'],
  title: '',
});
const resourceConfig = reactive({
  ability_level: '',
  customFields: [] as VisualFieldRow[],
  difficulty: undefined as number | undefined,
  include_answer: true,
  must_finish: true,
  open_method: 'new_page',
  provider: '',
  question_count: undefined as number | undefined,
  question_ids: [] as number[],
  question_mode: 'random',
  question_type: undefined as QbankV2QuestionType | undefined,
  reading_mode: 'normal',
  repeat_count: 1,
  require_acknowledge: true,
  selection_mode: 'system' as 'manual' | 'system',
  shuffle: true,
  start_position_seconds: 0,
  training_mode: 'standard',
});

const questionBanks = ref<GetBankListItem[]>([]);
const questionBanksLoading = ref(false);
const selectedBankDetail = ref<GetBankDetail>();
const manualQuestionRows = ref<GetQuestionListItem[]>([]);
const manualQuestionLoading = ref(false);
const manualQuestionKeyword = ref('');
const manualQuestionPage = ref(1);
const manualQuestionPageSize = ref(10);
const manualQuestionTotal = ref(0);
const knowledgeDomainCategoryId = ref<number>();
const knowledgeSystemId = ref<number>();
const knowledgeTree = ref<KnowledgeTreeOption[]>([]);
const knowledgeTreeLoading = ref(false);
const selectedKnowledgePointIds = ref<number[]>([]);
const knowledgeRole = ref<'primary' | 'secondary'>('primary');
const knowledgeIncludeDescendants = ref(false);
const knowledgeWeight = ref(1);
const treeShowChildStrategy = TreeSelect.SHOW_CHILD;
const manualQuestionColumns = [
  { dataIndex: 'code', title: '题目编码', width: 150 },
  { dataIndex: 'stem', ellipsis: true, title: '题干' },
  { dataIndex: 'question_type', title: '题型', width: 100 },
  { dataIndex: 'difficulty', title: '难度', width: 80 },
];
const questionBankOptions = computed(() =>
  questionBanks.value.map((item) => ({
    label: `${item.name}（${item.code}，${item.question_count} 题）`,
    value: item.id,
  })),
);
const selectedBankVersionText = computed(() => {
  const revision = selectedBankDetail.value?.current_revision;
  if (!revision)
    return taskForm.resource_version_id
      ? `版本 ID：${taskForm.resource_version_id}`
      : '当前没有已发布版本';
  return `V${revision.revision_no} · ${revision.question_count} 题 · 版本 ID：${revision.id}`;
});
const manualQuestionPagination = computed(() => ({
  current: manualQuestionPage.value,
  pageSize: manualQuestionPageSize.value,
  showSizeChanger: true,
  showTotal: (total: number) =>
    `共 ${total} 题，已选 ${resourceConfig.question_ids.length} 题`,
  total: manualQuestionTotal.value,
}));
const manualQuestionRowSelection = computed(() => ({
  onChange: (selectedRowKeys: (number | string)[]) => {
    resourceConfig.question_ids = selectedRowKeys.map(Number);
    resourceConfig.question_count = resourceConfig.question_ids.length;
    syncQuestionCountGoal();
  },
  preserveSelectedRowKeys: true,
  selectedRowKeys: resourceConfig.question_ids,
}));

function makeGoal(metric = 'question_count'): GoalForm {
  const option = findOption(goalMetricOptions, metric);
  return {
    config: null,
    customMetric: '',
    is_required: true,
    metricMode: metric,
    operator: 'gte',
    rowKey: ++rowSequence,
    target_value: metric === 'read_acknowledged' ? 1 : null,
    unit: option?.unit ?? null,
  };
}

function resetResourceConfig() {
  resourceConfig.ability_level = '';
  resourceConfig.customFields = [];
  resourceConfig.difficulty = undefined;
  resourceConfig.include_answer = true;
  resourceConfig.must_finish = true;
  resourceConfig.open_method = 'new_page';
  resourceConfig.provider = '';
  resourceConfig.question_count = undefined;
  resourceConfig.question_ids = [];
  resourceConfig.question_mode = 'random';
  resourceConfig.question_type = undefined;
  resourceConfig.reading_mode = 'normal';
  resourceConfig.repeat_count = 1;
  resourceConfig.require_acknowledge = true;
  resourceConfig.selection_mode = 'system';
  resourceConfig.shuffle = true;
  resourceConfig.start_position_seconds = 0;
  resourceConfig.training_mode = 'standard';
}

function loadResourceConfig(value: null | Record<string, unknown> | undefined) {
  resetResourceConfig();
  if (!value) return;
  resourceConfig.ability_level = String(value.ability_level ?? '');
  resourceConfig.difficulty =
    value.difficulty === null || value.difficulty === undefined
      ? undefined
      : Number(value.difficulty);
  resourceConfig.include_answer = Boolean(value.include_answer ?? true);
  resourceConfig.must_finish = Boolean(value.must_finish ?? true);
  resourceConfig.open_method = String(value.open_method ?? 'new_page');
  resourceConfig.provider = String(value.provider ?? '');
  const rawCount = value.question_count ?? value.count;
  resourceConfig.question_count =
    rawCount === null || rawCount === undefined ? undefined : Number(rawCount);
  resourceConfig.question_ids = Array.isArray(value.question_ids)
    ? value.question_ids.map(Number).filter((item) => item > 0)
    : [];
  resourceConfig.question_mode = String(value.question_mode ?? 'random');
  resourceConfig.question_type = value.question_type as
    | QbankV2QuestionType
    | undefined;
  resourceConfig.reading_mode = String(value.reading_mode ?? 'normal');
  resourceConfig.repeat_count = Number(value.repeat_count ?? 1);
  resourceConfig.require_acknowledge = Boolean(
    value.require_acknowledge ?? true,
  );
  resourceConfig.selection_mode =
    value.selection_mode === 'manual' || value.source_type === 'custom'
      ? 'manual'
      : 'system';
  resourceConfig.shuffle = Boolean(value.shuffle ?? true);
  resourceConfig.start_position_seconds = Number(
    value.start_position_seconds ?? 0,
  );
  resourceConfig.training_mode = String(value.training_mode ?? 'standard');
  resourceConfig.customFields = objectToVisualFields(
    value,
    RESOURCE_CONFIG_KEYS,
  );
}

function buildResourceConfig() {
  const value: Record<string, unknown> = visualFieldsToObject(
    resourceConfig.customFields,
  );
  switch (taskForm.resource_type) {
    case 'ability': {
      value.ability_level = resourceConfig.ability_level || undefined;
      value.repeat_count = resourceConfig.repeat_count;
      value.training_mode = resourceConfig.training_mode;
      break;
    }
    case 'content': {
      value.reading_mode = resourceConfig.reading_mode;
      value.require_acknowledge = resourceConfig.require_acknowledge;
      break;
    }
    case 'course':
    case 'course_lesson': {
      value.must_finish = resourceConfig.must_finish;
      value.start_position_seconds = resourceConfig.start_position_seconds;
      break;
    }
    case 'external': {
      value.open_method = resourceConfig.open_method;
      value.provider = resourceConfig.provider || undefined;
      break;
    }
    case 'question_bank': {
      const knowledgePointIds = taskForm.knowledge_points.map(
        (item) => item.knowledge_point_id,
      );
      value.count = resourceConfig.question_count;
      value.difficulty = resourceConfig.difficulty;
      value.include_answer = resourceConfig.include_answer;
      value.knowledge_point_ids = knowledgePointIds;
      value.question_count = resourceConfig.question_count;
      value.question_ids =
        resourceConfig.selection_mode === 'manual'
          ? resourceConfig.question_ids
          : undefined;
      value.question_mode = resourceConfig.question_mode;
      value.question_type = resourceConfig.question_type;
      value.selection_mode = resourceConfig.selection_mode;
      value.shuffle = resourceConfig.shuffle;
      value.source_type =
        resourceConfig.selection_mode === 'manual'
          ? 'custom'
          : knowledgePointIds.length > 0
            ? 'knowledge_point'
            : 'bank';
      break;
    }
  }
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  );
}

async function loadQuestionBanks(keyword?: string) {
  questionBanksLoading.value = true;
  try {
    const result = await qbankV2GetAdminBankListApi({
      keyword,
      page: 1,
      size: 200,
    });
    questionBanks.value = result.items ?? [];
  } finally {
    questionBanksLoading.value = false;
  }
}

async function onQuestionBankChange(
  bankId?: number,
  preserveSelection = false,
) {
  selectedBankDetail.value = undefined;
  taskForm.resource_version_id = undefined;
  if (!preserveSelection) {
    resourceConfig.question_ids = [];
    manualQuestionRows.value = [];
    manualQuestionTotal.value = 0;
  }
  if (!bankId) return;
  const detail = await getBankApi(bankId);
  selectedBankDetail.value = detail;
  if (
    !questionBanks.value.some((item) => item.id === detail.id) &&
    detail.current_revision
  ) {
    questionBanks.value.push({
      bank_kind: detail.current_revision.bank_kind,
      code: detail.code,
      cover_url: detail.current_revision.cover_url,
      created_time: detail.created_time,
      current_revision_id: detail.current_revision_id,
      id: detail.id,
      name: detail.current_revision.name,
      question_count: detail.current_revision.question_count,
      revision_status: detail.current_revision.status,
      status: detail.status,
      total_score: detail.current_revision.total_score,
      updated_time: detail.updated_time,
      visibility: detail.visibility,
    });
  }
  taskForm.resource_version_id = detail.current_revision_id;
  if (
    !preserveSelection &&
    (resourceConfig.question_count === null ||
      resourceConfig.question_count === undefined)
  ) {
    resourceConfig.question_count =
      Math.min(detail.current_revision?.question_count ?? 20, 20) || 20;
    syncQuestionCountGoal();
  }
  if (resourceConfig.selection_mode === 'manual') await loadManualQuestions(1);
}

function ensureGoal(
  metric: string,
  targetValue: number,
  unit: string,
  operator: 'eq' | 'gte' = 'gte',
) {
  let goal = taskForm.goals.find((item) => item.metricMode === metric);
  if (!goal) {
    goal = makeGoal(metric);
    taskForm.goals.push(goal);
  }
  goal.operator = operator;
  goal.target_value ??= targetValue;
  goal.unit = unit;
  return goal;
}

function syncQuestionCountGoal() {
  if (
    taskForm.resource_type !== 'question_bank' ||
    resourceConfig.question_count === null ||
    resourceConfig.question_count === undefined
  )
    return;
  const goal = ensureGoal(
    'question_count',
    resourceConfig.question_count,
    '题',
  );
  goal.target_value = resourceConfig.question_count;
}

function syncFocusGoal() {
  if (taskForm.expected_minutes <= 0) return;
  const goal = taskForm.goals.find(
    (item) => item.metricMode === 'focus_seconds',
  );
  if (goal) goal.target_value = taskForm.expected_minutes * 60;
}

function onActionTypeChange() {
  if (
    taskForm.action_type === 'practice' ||
    taskForm.action_type === 'wrong_review'
  ) {
    taskForm.resource_type = 'question_bank';
    onResourceTypeChange();
  } else if (
    taskForm.action_type === 'read' &&
    taskForm.resource_type === 'none'
  ) {
    taskForm.resource_type = 'content';
  } else if (taskForm.action_type === 'ability') {
    taskForm.resource_type = 'ability';
  }
}

function onResourceTypeChange() {
  if (taskForm.resource_type !== 'question_bank') return;
  taskForm.action_type = 'practice';
  resourceConfig.question_count ??= 20;
  ensureGoal('question_count', resourceConfig.question_count, '题');
  ensureGoal('accuracy', 60, '%');
  ensureGoal('focus_seconds', taskForm.expected_minutes * 60, '秒');
}

async function onSelectionModeChange() {
  if (resourceConfig.selection_mode === 'manual') {
    await loadManualQuestions(1);
  } else {
    syncQuestionCountGoal();
  }
}

async function loadManualQuestions(
  page = manualQuestionPage.value,
  pageSize = manualQuestionPageSize.value,
) {
  if (!taskForm.resource_id || !taskForm.resource_version_id) {
    manualQuestionRows.value = [];
    manualQuestionTotal.value = 0;
    return;
  }
  manualQuestionLoading.value = true;
  try {
    const result = await qbankV2GetQuestionListApi({
      bank_id: taskForm.resource_id,
      bank_revision_id: taskForm.resource_version_id,
      keyword: manualQuestionKeyword.value || undefined,
      page,
      question_type: resourceConfig.question_type,
      size: pageSize,
    });
    manualQuestionRows.value = result.items ?? [];
    manualQuestionPage.value = result.page;
    manualQuestionPageSize.value = result.size;
    manualQuestionTotal.value = result.total;
  } finally {
    manualQuestionLoading.value = false;
  }
}

function onManualQuestionTableChange(pagination: {
  current?: number;
  pageSize?: number;
}) {
  void loadManualQuestions(
    pagination.current ?? 1,
    pagination.pageSize ?? manualQuestionPageSize.value,
  );
}

function questionTypeLabel(value: string) {
  return findOption(questionTypeOptions, value)?.label ?? value;
}

async function onKnowledgeDomainChange() {
  taskForm.knowledge_points = [];
  await loadKnowledgeSystems(knowledgeDomainCategoryId.value);
}

function resetTaskForm() {
  editingTaskId.value = undefined;
  taskForm.title = '';
  taskForm.plan_date = selectedPlan.value?.start_date ?? today();
  taskForm.order_index = 0;
  taskForm.action_type = 'custom';
  taskForm.resource_type = 'none';
  taskForm.resource_id = undefined;
  taskForm.resource_key = '';
  taskForm.resource_version_id = undefined;
  taskForm.expected_minutes = 30;
  taskForm.due_at = undefined;
  taskForm.remind_at = undefined;
  taskForm.delivery_id = selectedPlan.value?.delivery_id ?? undefined;
  taskForm.description = '';
  taskForm.status = 'pending';
  taskForm.knowledge_points = [];
  taskForm.goals = [makeGoal()];
  resetResourceConfig();
  knowledgeDomainCategoryId.value = publicExamDomainId.value;
  knowledgeSystems.value = [];
  knowledgeSystemId.value = undefined;
  knowledgeTree.value = [];
  selectedKnowledgePointIds.value = [];
  knowledgeRole.value = 'primary';
  knowledgeIncludeDescendants.value = false;
  knowledgeWeight.value = 1;
  selectedBankDetail.value = undefined;
  manualQuestionRows.value = [];
  manualQuestionKeyword.value = '';
  manualQuestionPage.value = 1;
  manualQuestionTotal.value = 0;
}

async function openCreateTask() {
  resetTaskForm();
  taskModalOpen.value = true;
  await loadKnowledgeSystems(knowledgeDomainCategoryId.value);
}

async function openEditTask(record: LearningTaskDetail) {
  resetTaskForm();
  editingTaskId.value = record.id;
  taskForm.title = record.title;
  taskForm.plan_date = record.plan_date;
  taskForm.order_index = record.order_index;
  taskForm.action_type = record.action_type;
  taskForm.resource_type = record.resource_type;
  taskForm.resource_id = record.resource_id ?? undefined;
  taskForm.resource_key = record.resource_key ?? '';
  taskForm.resource_version_id = record.resource_version_id ?? undefined;
  loadResourceConfig(record.resource_config);
  taskForm.expected_minutes = record.expected_minutes;
  taskForm.due_at = record.due_at ?? undefined;
  taskForm.remind_at = record.remind_at ?? undefined;
  taskForm.delivery_id = record.delivery_id ?? undefined;
  taskForm.description = record.description ?? '';
  taskForm.status = record.status;
  taskForm.knowledge_points = record.knowledge_points.map((item) => ({
    ...item,
  }));
  taskForm.goals = record.goals.map((item) => ({
    ...item,
    customMetric: findOption(goalMetricOptions, item.metric) ? '' : item.metric,
    metricMode: findOption(goalMetricOptions, item.metric)
      ? item.metric
      : 'custom',
    rowKey: ++rowSequence,
  }));
  taskModalOpen.value = true;
  await loadKnowledgeSystems(knowledgeDomainCategoryId.value);
  if (record.resource_type === 'question_bank' && record.resource_id) {
    await onQuestionBankChange(record.resource_id, true);
    if (resourceConfig.selection_mode === 'manual') await loadManualQuestions();
  }
}

function mapKnowledgeTree(
  nodes: GetKnowledgePointTreeNode[],
): KnowledgeTreeOption[] {
  return nodes.map((node) => ({
    children: node.children?.length
      ? mapKnowledgeTree(node.children)
      : undefined,
    key: node.id,
    title: `${node.name}${node.code ? `（${node.code}）` : ''}`,
    value: node.id,
  }));
}

async function onKnowledgeSystemChange(systemId?: number) {
  knowledgeTree.value = [];
  selectedKnowledgePointIds.value = [];
  if (!systemId) return;
  knowledgeTreeLoading.value = true;
  try {
    const result = await getKnowledgePointsTreeApi(systemId);
    knowledgeTree.value = mapKnowledgeTree(result.points ?? []);
  } finally {
    knowledgeTreeLoading.value = false;
  }
}

function findTreeTitle(
  nodes: KnowledgeTreeOption[],
  id: number,
): string | undefined {
  for (const node of nodes) {
    if (node.value === id) return node.title;
    const childTitle = node.children
      ? findTreeTitle(node.children, id)
      : undefined;
    if (childTitle) return childTitle;
  }
}

function addKnowledgeBindings() {
  if (
    !knowledgeSystemId.value ||
    selectedKnowledgePointIds.value.length === 0
  ) {
    message.warning('请选择知识体系和知识点');
    return;
  }
  const system = knowledgeSystems.value.find(
    (item) => item.id === knowledgeSystemId.value,
  );
  const existing = new Set(
    taskForm.knowledge_points.map((item) => item.knowledge_point_id),
  );
  for (const pointId of selectedKnowledgePointIds.value) {
    if (existing.has(pointId)) continue;
    taskForm.knowledge_points.push({
      include_descendants: knowledgeIncludeDescendants.value,
      knowledge_point_id: pointId,
      knowledge_point_name: findTreeTitle(knowledgeTree.value, pointId),
      knowledge_system_id: knowledgeSystemId.value,
      knowledge_system_name: system?.name,
      role: knowledgeRole.value,
      weight: knowledgeWeight.value,
    });
  }
  selectedKnowledgePointIds.value = [];
}

function onGoalMetricChange(goal: GoalForm) {
  const option = findOption(goalMetricOptions, goal.metricMode);
  if (goal.metricMode !== 'custom') goal.customMetric = '';
  if (option) goal.unit = option.unit;
  if (goal.metricMode === 'read_acknowledged' && goal.target_value === null)
    goal.target_value = 1;
}

async function submitTask() {
  if (!selectedPlan.value || !taskForm.title.trim() || !taskForm.plan_date) {
    message.warning('请填写任务标题和计划日期');
    return;
  }
  if (taskForm.resource_type === 'question_bank') {
    if (!taskForm.resource_id || !taskForm.resource_version_id) {
      message.warning('请选择一个已有当前版本的题库');
      return;
    }
    if (resourceConfig.selection_mode === 'manual') {
      if (resourceConfig.question_ids.length === 0) {
        message.warning('手动选题模式至少需要选择一道题');
        return;
      }
      resourceConfig.question_count = resourceConfig.question_ids.length;
    } else if (
      !resourceConfig.question_count ||
      resourceConfig.question_count < 1
    ) {
      message.warning('请填写系统抽题数量');
      return;
    }
    syncQuestionCountGoal();
  }
  if (
    taskForm.goals.some(
      (goal) => goal.metricMode === 'custom' && !goal.customMetric.trim(),
    )
  ) {
    message.warning('请填写自定义指标名称');
    return;
  }
  taskSubmitting.value = true;
  try {
    const config = buildResourceConfig();
    const payload: CreateLearningTaskParams = {
      action_type: taskForm.action_type,
      delivery_id: taskForm.delivery_id || null,
      description: taskForm.description || null,
      due_at: taskForm.due_at || null,
      expected_minutes: taskForm.expected_minutes,
      goals: taskForm.goals.map(
        ({ customMetric, metricMode, rowKey: _rowKey, ...goal }) => ({
          ...goal,
          metric: metricMode === 'custom' ? customMetric.trim() : metricMode,
          target_value: goal.target_value ?? null,
          unit: goal.unit || null,
        }),
      ),
      knowledge_points: taskForm.knowledge_points.map((item) => ({
        include_descendants: item.include_descendants,
        knowledge_point_id: item.knowledge_point_id,
        knowledge_system_id: item.knowledge_system_id,
        role: item.role,
        weight: item.weight,
      })),
      order_index: taskForm.order_index,
      plan_date: taskForm.plan_date,
      plan_id: selectedPlan.value.id,
      remind_at: taskForm.remind_at || null,
      resource_config: Object.keys(config).length > 0 ? config : null,
      resource_id: taskForm.resource_id || null,
      resource_key: taskForm.resource_key || null,
      resource_type: taskForm.resource_type,
      resource_version_id: taskForm.resource_version_id || null,
      title: taskForm.title.trim(),
    };
    if (editingTaskId.value) {
      const { plan_id: _planId, ...updatePayload } = payload;
      await updateLearningTaskApi(editingTaskId.value, {
        ...updatePayload,
        status: taskForm.status,
      });
      message.success('学习任务已更新');
    } else {
      await createLearningTaskApi(payload);
      message.success('学习任务已创建');
    }
    taskModalOpen.value = false;
    await refreshTasks();
  } finally {
    taskSubmitting.value = false;
  }
}

async function removeTask(record: LearningTaskDetail) {
  await deleteLearningTaskApi(record.id);
  message.success('学习任务已删除');
  await refreshTasks();
}

function formatGoals(goals: LearningTaskGoal[]) {
  if (goals.length === 0) return '未设置';
  return goals
    .map((goal) => {
      const metric =
        findOption(goalMetricOptions, goal.metric)?.label ?? goal.metric;
      const operator =
        findOption(operatorOptions, goal.operator)?.label ?? goal.operator;
      return `${metric}${operator}${goal.target_value ?? '-'}${goal.unit ?? ''}`;
    })
    .join('；');
}

onMounted(async () => {
  const [categoryTree] = await Promise.all([
    getSysCategoryTreeApi({ app_code: 'youanshang', type: 'product_catalog' }),
    loadUsers(),
    loadQuestionBanks(),
  ]);
  domainCategories.value = categoryTree.filter(
    (item) => !item.parent_id && item.status,
  );
});
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <a-button type="primary" @click="openCreatePlan">新建计划</a-button>
      </template>
      <template #title_default="{ row }">
        <div class="font-medium">{{ row.title }}</div>
        <div class="text-xs text-gray-500">ID {{ row.id }}</div>
      </template>
      <template #user_default="{ row }">
        <div>{{ row.nickname || row.username || `用户 ${row.user_id}` }}</div>
        <div class="text-xs text-gray-500">
          {{ row.username || `ID ${row.user_id}` }}
        </div>
      </template>
      <template #date_range_default="{ row }">
        {{ row.start_date }} ~ {{ row.end_date || '长期' }}
      </template>
      <template #status_default="{ row }">
        <a-tag :color="findOption(planStatusOptions, row.status)?.color">
          {{ findOption(planStatusOptions, row.status)?.label || row.status }}
        </a-tag>
      </template>
      <template #progress_default="{ row }">
        <a-progress
          :percent="
            row.task_count
              ? Math.round((row.completed_task_count / row.task_count) * 100)
              : 0
          "
          size="small"
        />
        <div class="text-xs text-gray-500">
          {{ row.completed_task_count }} / {{ row.task_count }} 个任务
        </div>
      </template>
      <template #operation_default="{ row }">
        <a-button type="link" @click="openTasks(row)">任务</a-button>
        <a-button type="link" @click="openEditPlan(row)">编辑</a-button>
        <a-popconfirm
          title="确定删除该计划及其任务吗？"
          @confirm="removePlan(row)"
        >
          <a-button danger type="link">删除</a-button>
        </a-popconfirm>
      </template>
    </Grid>

    <a-modal
      v-model:open="planModalOpen"
      :confirm-loading="planSubmitting"
      :title="planModalTitle"
      width="680px"
      @ok="submitPlan"
    >
      <a-form layout="vertical">
        <a-form-item label="接收用户" required>
          <a-select
            v-model:value="planForm.user_id"
            :disabled="Boolean(editingPlanId)"
            :options="userOptions"
            option-filter-prop="label"
            placeholder="请选择用户"
            show-search
          />
        </a-form-item>
        <a-form-item label="计划标题" required>
          <a-input v-model:value="planForm.title" :maxlength="255" />
        </a-form-item>
        <div class="grid grid-cols-2 gap-4">
          <a-form-item label="开始日期" required>
            <a-date-picker
              v-model:value="planForm.start_date"
              style="width: 100%"
              value-format="YYYY-MM-DD"
            />
          </a-form-item>
          <a-form-item label="结束日期">
            <a-date-picker
              v-model:value="planForm.end_date"
              style="width: 100%"
              value-format="YYYY-MM-DD"
            />
          </a-form-item>
          <a-form-item label="计划来源">
            <a-select
              v-model:value="planForm.source_type"
              :options="planSourceOptions"
            />
          </a-form-item>
          <a-form-item label="计划状态">
            <a-select
              v-model:value="planForm.status"
              :options="planStatusOptions"
            />
          </a-form-item>
        </div>
        <a-form-item label="计划说明">
          <a-textarea v-model:value="planForm.description" :rows="4" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-drawer
      v-model:open="taskDrawerOpen"
      destroy-on-close
      title="学习任务管理"
      width="1180px"
    >
      <TaskGrid>
        <template #toolbar-actions>
          <div v-if="selectedPlan">
            <div class="font-medium">{{ selectedPlan.title }}</div>
            <div class="text-xs text-gray-500">
              {{
                selectedPlan.nickname ||
                selectedPlan.username ||
                `用户 ${selectedPlan.user_id}`
              }}
              · {{ selectedPlan.start_date }} ~
              {{ selectedPlan.end_date || '长期' }}
            </div>
          </div>
        </template>
        <template #toolbar-tools>
          <a-button type="primary" @click="openCreateTask">新增任务</a-button>
        </template>
        <template #task_title_default="{ row }">
          <div class="font-medium">{{ row.title }}</div>
          <div class="text-xs text-gray-500">排序 {{ row.order_index }}</div>
        </template>
        <template #resource_default="{ row }">
          {{
            findOption(resourceTypeOptions, row.resource_type)?.label ||
            row.resource_type
          }}
          <div v-if="row.resource_id" class="text-xs text-gray-500">
            ID {{ row.resource_id }}
          </div>
        </template>
        <template #goals_default="{ row }">
          <span class="text-xs">{{ formatGoals(row.goals) }}</span>
        </template>
        <template #knowledge_points_default="{ row }">
          <a-space wrap>
            <a-tag
              v-for="point in row.knowledge_points"
              :key="point.id || point.knowledge_point_id"
            >
              {{
                point.knowledge_point_name ||
                point.knowledge_point_code ||
                point.knowledge_point_id
              }}
            </a-tag>
            <span v-if="row.knowledge_points.length === 0" class="text-gray-400"
              >未设置</span
            >
          </a-space>
        </template>
        <template #task_status_default="{ row }">
          <a-tag :color="findOption(taskStatusOptions, row.status)?.color">
            {{ findOption(taskStatusOptions, row.status)?.label || row.status }}
          </a-tag>
        </template>
        <template #task_operation_default="{ row }">
          <a-button type="link" @click="openEditTask(row)">编辑</a-button>
          <a-popconfirm title="确定删除该任务？" @confirm="removeTask(row)">
            <a-button danger type="link">删除</a-button>
          </a-popconfirm>
        </template>
      </TaskGrid>
    </a-drawer>

    <a-modal
      v-model:open="taskModalOpen"
      :confirm-loading="taskSubmitting"
      :title="editingTaskId ? '编辑学习任务' : '新增学习任务'"
      width="1180px"
      @ok="submitTask"
    >
      <a-form layout="vertical">
        <a-card class="mb-4" size="small" title="任务安排">
          <a-form-item label="任务标题" required>
            <a-input
              v-model:value="taskForm.title"
              :maxlength="255"
              placeholder="例如：完成资料分析专项练习"
            />
          </a-form-item>
          <div class="grid grid-cols-4 gap-4">
            <a-form-item label="计划日期" required>
              <a-date-picker
                v-model:value="taskForm.plan_date"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </a-form-item>
            <a-form-item label="当日排序">
              <a-input-number
                v-model:value="taskForm.order_index"
                :min="0"
                style="width: 100%"
              />
            </a-form-item>
            <a-form-item label="学习行为">
              <a-select
                v-model:value="taskForm.action_type"
                :options="actionTypeOptions"
                @change="onActionTypeChange"
              />
            </a-form-item>
            <a-form-item label="资源类型">
              <a-select
                v-model:value="taskForm.resource_type"
                :options="resourceTypeOptions"
                @change="onResourceTypeChange"
              />
            </a-form-item>
            <a-form-item label="预计专注时长（分钟）">
              <a-input-number
                v-model:value="taskForm.expected_minutes"
                :max="1440"
                :min="0"
                style="width: 100%"
                @change="syncFocusGoal"
              />
            </a-form-item>
            <a-form-item v-if="editingTaskId" label="任务状态">
              <a-select
                v-model:value="taskForm.status"
                :options="taskStatusOptions"
              />
            </a-form-item>
            <a-form-item
              v-if="!['none', 'question_bank'].includes(taskForm.resource_type)"
              label="资源 ID"
            >
              <a-input-number
                v-model:value="taskForm.resource_id"
                :min="1"
                style="width: 100%"
              />
            </a-form-item>
            <a-form-item
              v-if="['ability', 'external'].includes(taskForm.resource_type)"
              label="资源业务键 / URL"
            >
              <a-input v-model:value="taskForm.resource_key" />
            </a-form-item>
            <a-form-item label="截止时间">
              <a-date-picker
                v-model:value="taskForm.due_at"
                show-time
                style="width: 100%"
                value-format="YYYY-MM-DDTHH:mm:ss"
              />
            </a-form-item>
            <a-form-item label="提醒时间">
              <a-date-picker
                v-model:value="taskForm.remind_at"
                show-time
                style="width: 100%"
                value-format="YYYY-MM-DDTHH:mm:ss"
              />
            </a-form-item>
            <a-form-item label="交付单 ID">
              <a-input-number
                v-model:value="taskForm.delivery_id"
                :min="1"
                style="width: 100%"
              />
            </a-form-item>
          </div>
        </a-card>

        <a-card
          v-if="taskForm.resource_type !== 'none'"
          class="mb-4"
          size="small"
          :title="
            taskForm.resource_type === 'question_bank'
              ? '题库练习配置'
              : '资源执行配置'
          "
        >
          <template v-if="taskForm.resource_type === 'question_bank'">
            <a-alert
              class="mb-4"
              message="选择题库后自动使用当前发布版本；系统抽题按下方条件生成，手动选题则锁定具体题目。"
              show-icon
              type="info"
            />
            <div class="grid grid-cols-2 gap-4">
              <a-form-item label="题库" required>
                <a-select
                  v-model:value="taskForm.resource_id"
                  :filter-option="false"
                  :loading="questionBanksLoading"
                  :options="questionBankOptions"
                  placeholder="输入题库名称或编码搜索"
                  show-search
                  @change="(value) => onQuestionBankChange(value)"
                  @search="loadQuestionBanks"
                />
              </a-form-item>
              <a-form-item label="当前题库版本">
                <a-input :value="selectedBankVersionText" disabled />
              </a-form-item>
            </div>
            <a-form-item label="选题方式">
              <a-segmented
                v-model:value="resourceConfig.selection_mode"
                :options="[
                  { label: '系统按条件抽题', value: 'system' },
                  { label: '手动选择题目', value: 'manual' },
                ]"
                @change="onSelectionModeChange"
              />
            </a-form-item>
            <div
              v-if="resourceConfig.selection_mode === 'system'"
              class="grid grid-cols-4 gap-4"
            >
              <a-form-item label="抽题顺序">
                <a-select
                  v-model:value="resourceConfig.question_mode"
                  :options="questionModeOptions"
                />
              </a-form-item>
              <a-form-item label="题型">
                <a-select
                  v-model:value="resourceConfig.question_type"
                  allow-clear
                  :options="questionTypeOptions"
                  placeholder="不限题型"
                />
              </a-form-item>
              <a-form-item label="难度">
                <a-select
                  v-model:value="resourceConfig.difficulty"
                  allow-clear
                  :options="difficultyOptions"
                  placeholder="不限难度"
                />
              </a-form-item>
              <a-form-item label="抽题数量" required>
                <a-input-number
                  v-model:value="resourceConfig.question_count"
                  :max="500"
                  :min="1"
                  style="width: 100%"
                  @change="syncQuestionCountGoal"
                />
              </a-form-item>
              <a-form-item label="题目顺序随机化">
                <a-switch v-model:checked="resourceConfig.shuffle" />
              </a-form-item>
              <a-form-item label="完成后显示答案">
                <a-switch v-model:checked="resourceConfig.include_answer" />
              </a-form-item>
            </div>
            <template v-else>
              <div class="mb-3 flex items-end gap-3">
                <a-form-item class="mb-0 flex-1" label="题型筛选">
                  <a-select
                    v-model:value="resourceConfig.question_type"
                    allow-clear
                    :options="questionTypeOptions"
                    placeholder="全部题型"
                    @change="() => loadManualQuestions(1)"
                  />
                </a-form-item>
                <a-form-item class="mb-0 flex-[2]" label="题干搜索">
                  <a-input-search
                    v-model:value="manualQuestionKeyword"
                    allow-clear
                    placeholder="输入题干关键字"
                    @search="() => loadManualQuestions(1)"
                  />
                </a-form-item>
                <a-button @click="loadManualQuestions(1)">刷新题目</a-button>
              </div>
              <a-table
                :columns="manualQuestionColumns"
                :data-source="manualQuestionRows"
                :loading="manualQuestionLoading"
                :pagination="manualQuestionPagination"
                :row-selection="manualQuestionRowSelection"
                row-key="id"
                size="small"
                @change="onManualQuestionTableChange"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.dataIndex === 'question_type'">
{{
                    questionTypeLabel(record.question_type)
                  }}
</template>
                  <template v-else-if="column.dataIndex === 'difficulty'">
{{
                    record.difficulty || '未标注'
                  }}
</template>
                </template>
              </a-table>
            </template>
          </template>
          <div
            v-else-if="taskForm.resource_type === 'content'"
            class="grid grid-cols-2 gap-4"
          >
            <a-form-item label="阅读模式">
              <a-select
                v-model:value="resourceConfig.reading_mode"
                :options="[
                  { label: '普通阅读', value: 'normal' },
                  { label: '精读', value: 'intensive' },
                ]"
              />
            </a-form-item>
            <a-form-item label="需要阅读确认"
              >
<a-switch v-model:checked="resourceConfig.require_acknowledge"
            />
</a-form-item>
          </div>
          <div
            v-else-if="
              ['course', 'course_lesson'].includes(taskForm.resource_type)
            "
            class="grid grid-cols-2 gap-4"
          >
            <a-form-item label="起始位置（秒）"
              >
<a-input-number
                v-model:value="resourceConfig.start_position_seconds"
                :min="0"
                style="width: 100%"
            />
</a-form-item>
            <a-form-item label="必须完整学完"
              >
<a-switch v-model:checked="resourceConfig.must_finish"
            />
</a-form-item>
          </div>
          <div
            v-else-if="taskForm.resource_type === 'ability'"
            class="grid grid-cols-3 gap-4"
          >
            <a-form-item label="能力等级"
              >
<a-input
                v-model:value="resourceConfig.ability_level"
                placeholder="基础 / 进阶 / 冲刺"
            />
</a-form-item>
            <a-form-item label="训练模式"
              >
<a-select
                v-model:value="resourceConfig.training_mode"
                :options="[
                  { label: '标准', value: 'standard' },
                  { label: '限时', value: 'timed' },
                  { label: '强化', value: 'intensive' },
                ]"
            />
</a-form-item>
            <a-form-item label="重复次数"
              >
<a-input-number
                v-model:value="resourceConfig.repeat_count"
                :min="1"
                style="width: 100%"
            />
</a-form-item>
          </div>
          <div
            v-else-if="taskForm.resource_type === 'external'"
            class="grid grid-cols-2 gap-4"
          >
            <a-form-item label="资源提供方"
              >
<a-input
                v-model:value="resourceConfig.provider"
                placeholder="机构或平台名称"
            />
</a-form-item>
            <a-form-item label="打开方式"
              >
<a-select
                v-model:value="resourceConfig.open_method"
                :options="[
                  { label: '新页面', value: 'new_page' },
                  { label: '应用内', value: 'in_app' },
                  { label: '复制链接', value: 'copy' },
                ]"
            />
</a-form-item>
          </div>
          <a-divider title-placement="start">其他配置</a-divider>
          <VisualFieldEditor v-model="resourceConfig.customFields" />
        </a-card>

        <a-card class="mb-4" size="small" title="考试模块 / 知识点">
          <a-alert
            class="mb-4"
            :message="
              taskForm.resource_type === 'question_bank'
                ? '这里既标记任务所属考试模块，也会作为系统抽题的知识点筛选条件。'
                : '考试模块使用 question_bank_v2 的知识体系和知识点。'
            "
            show-icon
            type="info"
          />
          <div class="grid grid-cols-3 gap-4">
            <a-form-item label="学习领域">
              <a-select
                v-model:value="knowledgeDomainCategoryId"
                :options="domainCategoryOptions"
                placeholder="请选择学习领域"
                @change="onKnowledgeDomainChange"
              />
            </a-form-item>
            <a-form-item label="知识体系">
              <a-select
                v-model:value="knowledgeSystemId"
                allow-clear
                :options="
                  knowledgeSystems.map((item) => ({
                    label: `${item.name}（${item.version}）`,
                    value: item.id,
                  }))
                "
                placeholder="请选择知识体系"
                @change="onKnowledgeSystemChange"
              />
            </a-form-item>
            <a-form-item label="知识点">
              <TreeSelect
                v-model:value="selectedKnowledgePointIds"
                allow-clear
                :loading="knowledgeTreeLoading"
                multiple
                :show-checked-strategy="treeShowChildStrategy"
                show-search
                :tree-data="knowledgeTree"
                tree-checkable
                tree-default-expand-all
                placeholder="请选择知识点"
              />
            </a-form-item>
            <a-form-item label="归属角色">
              <a-radio-group v-model:value="knowledgeRole">
                <a-radio value="primary">主要</a-radio>
                <a-radio value="secondary">次要</a-radio>
              </a-radio-group>
            </a-form-item>
            <a-form-item label="知识点配置">
              <a-space>
                <a-switch v-model:checked="knowledgeIncludeDescendants" />
                <span>包含下级</span>
                <span>权重</span>
                <a-input-number
                  v-model:value="knowledgeWeight"
                  :max="1"
                  :min="0.01"
                  :step="0.05"
                />
                <a-button type="primary" @click="addKnowledgeBindings"
                  >
应用知识点
</a-button
                >
              </a-space>
            </a-form-item>
          </div>
          <a-table
            :columns="[
              { title: '知识体系', dataIndex: 'knowledge_system_name' },
              { title: '知识点', dataIndex: 'knowledge_point_name' },
              { title: '角色', dataIndex: 'role', width: 90 },
              {
                title: '包含下级',
                dataIndex: 'include_descendants',
                width: 100,
              },
              { title: '权重', dataIndex: 'weight', width: 80 },
              { title: '操作', dataIndex: 'operation', width: 80 },
            ]"
            :data-source="taskForm.knowledge_points"
            :pagination="false"
            row-key="knowledge_point_id"
            size="small"
          >
            <template #bodyCell="{ column, record, index }">
              <template v-if="column.dataIndex === 'knowledge_system_name'">
{{
                record.knowledge_system_name || record.knowledge_system_id
              }}
</template>
              <template
                v-else-if="column.dataIndex === 'knowledge_point_name'"
                >
{{
                  record.knowledge_point_name || record.knowledge_point_id
                }}
</template
              >
              <template v-else-if="column.dataIndex === 'role'">
{{
                record.role === 'primary' ? '主要' : '次要'
              }}
</template>
              <template
                v-else-if="column.dataIndex === 'include_descendants'"
                >
{{ record.include_descendants ? '是' : '否' }}
</template
              >
              <template v-else-if="column.dataIndex === 'operation'"
                >
<a-button
                  danger
                  type="link"
                  @click="taskForm.knowledge_points.splice(index, 1)"
                  >
移除
</a-button
                >
</template
              >
            </template>
          </a-table>
        </a-card>

        <a-card class="mb-4" size="small" title="完成指标">
          <a-alert
            class="mb-4"
            message="题库任务会自动带出题量、正确率和专注时长，你仍可在这里调整或增加其他标准。"
            show-icon
            type="info"
          />
          <div
            v-for="(goal, index) in taskForm.goals"
            :key="goal.rowKey"
            class="mb-3 grid grid-cols-12 gap-3 rounded border p-3"
          >
            <div
              :class="
                goal.metricMode === 'custom' ? 'col-span-2' : 'col-span-3'
              "
            >
              <div class="mb-1 text-xs text-gray-500">指标</div>
              <a-select
                v-model:value="goal.metricMode"
                :options="goalMetricOptions"
                style="width: 100%"
                @change="onGoalMetricChange(goal)"
              />
            </div>
            <div v-if="goal.metricMode === 'custom'" class="col-span-2">
              <div class="mb-1 text-xs text-gray-500">自定义指标</div>
              <a-input v-model:value="goal.customMetric" />
            </div>
            <div class="col-span-2">
              <div class="mb-1 text-xs text-gray-500">比较方式</div>
              <a-select
                v-model:value="goal.operator"
                :options="operatorOptions"
                style="width: 100%"
              />
            </div>
            <div class="col-span-2">
              <div class="mb-1 text-xs text-gray-500">目标值</div>
              <a-input-number
                v-model:value="goal.target_value"
                style="width: 100%"
              />
            </div>
            <div class="col-span-2">
              <div class="mb-1 text-xs text-gray-500">单位</div>
              <a-input v-model:value="goal.unit" />
            </div>
            <div class="col-span-1 flex items-end pb-1">
              <a-checkbox v-model:checked="goal.is_required">必需</a-checkbox>
            </div>
            <div class="col-span-1 flex items-end justify-end">
              <a-button
                danger
                type="link"
                @click="taskForm.goals.splice(index, 1)"
                >
删除
</a-button
              >
            </div>
          </div>
          <a-button block type="dashed" @click="taskForm.goals.push(makeGoal())"
            >
添加指标
</a-button
          >
        </a-card>

        <a-form-item label="任务说明">
          <a-textarea v-model:value="taskForm.description" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>
  </Page>
</template>
