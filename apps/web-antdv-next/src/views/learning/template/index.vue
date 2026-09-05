<script setup lang="ts">
import type { VbenFormProps, VbenFormSchema } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  CreateLearningPlanTemplateParams,
  CreateLearningPlanTemplateTaskParams,
  GetBankDetail,
  GetBankListItem,
  GetKnowledgePointTreeNode,
  GetKnowledgeSystemListItem,
  GetQuestionListItem,
  LearningPlanTemplateDetail,
  LearningPlanTemplateStageDetail,
  LearningPlanTemplateTaskDetail,
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
  createLearningPlanTemplateApi,
  createLearningPlanTemplateStageApi,
  createLearningPlanTemplateTaskApi,
  deleteLearningPlanTemplateApi,
  deleteLearningPlanTemplateStageApi,
  deleteLearningPlanTemplateTaskApi,
  getBankApi,
  getKnowledgePointsTreeApi,
  getKnowledgeSystemsApi,
  getLearningPlanTemplatesApi,
  getLearningPlanTemplateStagesApi,
  getLearningPlanTemplateTasksApi,
  getSysCategoryTreeApi,
  qbankV2GetAdminBankListApi,
  qbankV2GetQuestionListApi,
  updateLearningPlanTemplateApi,
  updateLearningPlanTemplateStageApi,
  updateLearningPlanTemplateTaskApi,
} from '#/api';

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

const templateStatusOptions = [
  { color: 'default', label: '草稿', value: 'draft' },
  { color: 'success', label: '启用', value: 'active' },
  { color: 'warning', label: '已归档', value: 'archived' },
];
const examTypeOptions = [
  { label: '国家公务员考试', value: 'national_civil_service' },
  { label: '省级公务员考试', value: 'provincial_civil_service' },
  { label: '事业单位考试', value: 'public_institution' },
  { label: '选调生考试', value: 'selected_graduate' },
  { label: '其他考试', value: 'other' },
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

const findOption = (options: any[], value: unknown) =>
  options.find((item) => item.value === value);

const querySchema: VbenFormSchema[] = [
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: templateStatusOptions,
      placeholder: '请选择状态',
    },
    fieldName: 'status',
    label: '模板状态',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: examTypeOptions,
      placeholder: '请选择考试类型',
    },
    fieldName: 'exam_type',
    label: '考试类型',
  },
];
const formOptions: VbenFormProps = {
  collapsed: false,
  schema: querySchema,
  showCollapseButton: false,
  submitButtonOptions: { content: '查询' },
};
const gridOptions: VxeTableGridOptions<LearningPlanTemplateDetail> = {
  columns: [
    { field: 'seq', fixed: 'left', title: '序号', type: 'seq', width: 60 },
    {
      field: 'name',
      fixed: 'left',
      minWidth: 240,
      slots: { default: 'name_default' },
      title: '模板',
    },
    {
      field: 'exam_type',
      slots: { default: 'exam_default' },
      title: '适用考试',
      width: 170,
    },
    {
      field: 'duration_days',
      formatter: ({ cellValue }) => `${cellValue} 天`,
      title: '周期',
      width: 90,
    },
    {
      field: 'default_daily_minutes',
      formatter: ({ cellValue }) => `${cellValue} 分钟`,
      title: '默认每日时长',
      width: 130,
    },
    {
      field: 'content',
      slots: { default: 'content_default' },
      title: '模板内容',
      width: 160,
    },
    {
      field: 'status',
      slots: { default: 'status_default' },
      title: '状态',
      width: 90,
    },
    { field: 'updated_time', title: '更新时间', width: 168 },
    {
      align: 'center',
      field: 'operation',
      fixed: 'right',
      slots: { default: 'operation_default' },
      title: '操作',
      width: 220,
    },
  ],
  height: 'auto',
  pagerConfig: { enabled: false },
  proxyConfig: {
    ajax: {
      query: async (_params, formValues) =>
        getLearningPlanTemplatesApi(formValues),
    },
  },
  rowConfig: { isHover: true, keyField: 'id' },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, zoom: true },
};
const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

const domainCategories = ref<SysCategoryTreeResult[]>([]);
const domainCategoryOptions = computed(() =>
  domainCategories.value.map((item) => ({
    label: item.name,
    value: item.id,
  })),
);
const publicExamDomainId = computed(
  () => domainCategories.value.find((item) => item.code === 'pc_gongkao')?.id,
);
const templateModalOpen = ref(false);
const templateSubmitting = ref(false);
const editingTemplateId = ref<number>();
const editingTemplateSettings = ref<Record<string, unknown>>({});
const templateForm = reactive({
  code: '',
  default_daily_minutes: 120,
  description: '',
  domain_category_id: undefined as number | undefined,
  duration_days: 30,
  exam_type: 'national_civil_service',
  name: '',
  status: 'draft' as CreateLearningPlanTemplateParams['status'],
  version: 1,
});
const templateModalTitle = computed(() =>
  editingTemplateId.value ? '编辑计划模板' : '新建计划模板',
);

function resetTemplateForm() {
  editingTemplateId.value = undefined;
  editingTemplateSettings.value = {};
  templateForm.code = '';
  templateForm.name = '';
  templateForm.exam_type = 'national_civil_service';
  templateForm.domain_category_id = publicExamDomainId.value;
  templateForm.version = 1;
  templateForm.duration_days = 30;
  templateForm.default_daily_minutes = 120;
  templateForm.status = 'draft';
  templateForm.description = '';
}

function openCreateTemplate() {
  resetTemplateForm();
  templateModalOpen.value = true;
}

function openEditTemplate(record: LearningPlanTemplateDetail) {
  editingTemplateId.value = record.id;
  editingTemplateSettings.value = { ...record.settings };
  templateForm.code = record.code;
  templateForm.name = record.name;
  templateForm.exam_type = record.exam_type ?? 'other';
  templateForm.domain_category_id =
    Number(record.settings?.domain_category_id) || publicExamDomainId.value;
  templateForm.version = record.version;
  templateForm.duration_days = record.duration_days;
  templateForm.default_daily_minutes = record.default_daily_minutes;
  templateForm.status = record.status;
  templateForm.description = record.description ?? '';
  templateModalOpen.value = true;
}

async function submitTemplate() {
  if (!templateForm.code.trim() || !templateForm.name.trim()) {
    message.warning('请填写模板编码和模板名称');
    return;
  }
  if (!templateForm.domain_category_id) {
    message.warning('请选择学习领域');
    return;
  }
  templateSubmitting.value = true;
  try {
    const payload: CreateLearningPlanTemplateParams = {
      code: templateForm.code.trim(),
      default_daily_minutes: templateForm.default_daily_minutes,
      description: templateForm.description || null,
      duration_days: templateForm.duration_days,
      exam_type: templateForm.exam_type || null,
      name: templateForm.name.trim(),
      settings: {
        ...editingTemplateSettings.value,
        domain_category_id: templateForm.domain_category_id,
      },
      status: templateForm.status,
      version: templateForm.version,
    };
    if (editingTemplateId.value) {
      await updateLearningPlanTemplateApi(editingTemplateId.value, payload);
      message.success('计划模板已更新');
    } else {
      await createLearningPlanTemplateApi(payload);
      message.success('计划模板已创建');
    }
    templateModalOpen.value = false;
    gridApi.query();
  } finally {
    templateSubmitting.value = false;
  }
}

async function removeTemplate(record: LearningPlanTemplateDetail) {
  await deleteLearningPlanTemplateApi(record.id);
  message.success('计划模板已删除，已生成的用户计划不受影响');
  gridApi.query();
}

const contentDrawerOpen = ref(false);
const selectedTemplate = ref<LearningPlanTemplateDetail>();
const stages = ref<LearningPlanTemplateStageDetail[]>([]);
const stageColumns = [
  { dataIndex: 'name', title: '阶段名称' },
  { dataIndex: 'range', title: '天数范围', width: 160 },
  { dataIndex: 'description', title: '说明' },
  { dataIndex: 'operation', title: '操作', width: 140 },
];
const taskGridOptions: VxeTableGridOptions<LearningPlanTemplateTaskDetail> = {
  columns: [
    {
      field: 'relative_day',
      fixed: 'left',
      formatter: ({ cellValue }) => `第 ${cellValue} 天`,
      title: '日期',
      width: 100,
    },
    {
      field: 'title',
      fixed: 'left',
      minWidth: 220,
      slots: { default: 'task_title_default' },
      title: '任务',
    },
    { field: 'stage_name', title: '阶段', width: 130 },
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
      width: 135,
    },
    {
      field: 'goals',
      minWidth: 250,
      slots: { default: 'goals_default' },
      title: '完成指标',
    },
    {
      field: 'knowledge_points',
      minWidth: 220,
      slots: { default: 'knowledge_default' },
      title: '知识点',
    },
    {
      field: 'expected_minutes',
      formatter: ({ cellValue }) => `${cellValue} 分钟`,
      title: '预计用时',
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
  height: 520,
  pagerConfig: { enabled: false },
  proxyConfig: {
    ajax: {
      query: async () =>
        selectedTemplate.value
          ? getLearningPlanTemplateTasksApi(selectedTemplate.value.id)
          : [],
    },
  },
  rowConfig: { isHover: true, keyField: 'id' },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, zoom: true },
};
const [TaskGrid, taskGridApi] = useVbenVxeGrid({
  gridOptions: taskGridOptions,
});

async function loadStages() {
  stages.value = selectedTemplate.value
    ? await getLearningPlanTemplateStagesApi(selectedTemplate.value.id)
    : [];
}

async function openContent(record: LearningPlanTemplateDetail) {
  selectedTemplate.value = record;
  contentDrawerOpen.value = true;
  await loadStages();
  await nextTick();
  taskGridApi.query();
}

async function refreshContent() {
  await loadStages();
  taskGridApi.query();
  gridApi.query();
}

const stageModalOpen = ref(false);
const stageSubmitting = ref(false);
const editingStageId = ref<number>();
const stageForm = reactive({
  description: '',
  end_day: 1,
  name: '',
  order_index: 0,
  start_day: 1,
});

function openCreateStage() {
  editingStageId.value = undefined;
  stageForm.name = '';
  stageForm.start_day = 1;
  stageForm.end_day = selectedTemplate.value?.duration_days ?? 1;
  stageForm.order_index = stages.value.length;
  stageForm.description = '';
  stageModalOpen.value = true;
}

function openEditStage(record: any) {
  editingStageId.value = record.id;
  stageForm.name = record.name;
  stageForm.start_day = record.start_day;
  stageForm.end_day = record.end_day;
  stageForm.order_index = record.order_index;
  stageForm.description = record.description ?? '';
  stageModalOpen.value = true;
}

async function submitStage() {
  if (!selectedTemplate.value || !stageForm.name.trim()) {
    message.warning('请填写阶段名称');
    return;
  }
  if (stageForm.end_day < stageForm.start_day) {
    message.warning('结束天数不能早于开始天数');
    return;
  }
  stageSubmitting.value = true;
  try {
    const payload = {
      description: stageForm.description || null,
      end_day: stageForm.end_day,
      name: stageForm.name.trim(),
      order_index: stageForm.order_index,
      start_day: stageForm.start_day,
    };
    if (editingStageId.value) {
      await updateLearningPlanTemplateStageApi(editingStageId.value, payload);
      message.success('模板阶段已更新');
    } else {
      await createLearningPlanTemplateStageApi({
        ...payload,
        template_id: selectedTemplate.value.id,
      });
      message.success('模板阶段已创建');
    }
    stageModalOpen.value = false;
    await refreshContent();
  } finally {
    stageSubmitting.value = false;
  }
}

async function removeStage(record: any) {
  await deleteLearningPlanTemplateStageApi(record.id);
  message.success('模板阶段已删除，原阶段任务已改为未分阶段');
  await refreshContent();
}

let rowSequence = 0;
const taskModalOpen = ref(false);
const taskSubmitting = ref(false);
const editingTaskId = ref<number>();
const taskForm = reactive({
  action_type: 'custom' as CreateLearningPlanTemplateTaskParams['action_type'],
  description: '',
  expected_minutes: 30,
  goals: [] as GoalForm[],
  knowledge_points: [] as LearningTaskKnowledgePoint[],
  order_index: 0,
  relative_day: 1,
  resource_id: undefined as number | undefined,
  resource_key: '',
  resource_type:
    'none' as CreateLearningPlanTemplateTaskParams['resource_type'],
  resource_version_id: undefined as number | undefined,
  stage_id: undefined as number | undefined,
  title: '',
});
const resourceConfig = reactive({
  ability_level: '',
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
const knowledgeSystems = ref<GetKnowledgeSystemListItem[]>([]);
const knowledgeSystemId = ref<number>();
const knowledgeTree = ref<KnowledgeTreeOption[]>([]);
const knowledgeTreeLoading = ref(false);
const selectedKnowledgePointIds = ref<number[]>([]);
const knowledgeRole = ref<'primary' | 'secondary'>('primary');
const knowledgeIncludeDescendants = ref(false);
const knowledgeWeight = ref(1);
const treeShowChildStrategy = TreeSelect.SHOW_CHILD;
const knowledgeColumns = [
  { dataIndex: 'knowledge_system_name', title: '知识体系' },
  { dataIndex: 'knowledge_point_name', title: '知识点' },
  { dataIndex: 'role', title: '角色', width: 90 },
  { dataIndex: 'include_descendants', title: '包含下级', width: 100 },
  { dataIndex: 'weight', title: '权重', width: 80 },
  { dataIndex: 'operation', title: '操作', width: 80 },
];
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
}

function buildResourceConfig() {
  const value: Record<string, unknown> = {};
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

function resetTaskForm() {
  editingTaskId.value = undefined;
  taskForm.relative_day = 1;
  taskForm.stage_id = undefined;
  taskForm.order_index = 0;
  taskForm.title = '';
  taskForm.action_type = 'custom';
  taskForm.resource_type = 'none';
  taskForm.resource_id = undefined;
  taskForm.resource_key = '';
  taskForm.resource_version_id = undefined;
  taskForm.expected_minutes = 30;
  taskForm.description = '';
  taskForm.knowledge_points = [];
  taskForm.goals = [makeGoal()];
  resetResourceConfig();
  knowledgeDomainCategoryId.value =
    Number(selectedTemplate.value?.settings?.domain_category_id) ||
    publicExamDomainId.value;
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
  await loadKnowledgeSystems();
}

async function openEditTask(record: LearningPlanTemplateTaskDetail) {
  resetTaskForm();
  editingTaskId.value = record.id;
  taskForm.relative_day = record.relative_day;
  taskForm.stage_id = record.stage_id ?? undefined;
  taskForm.order_index = record.order_index;
  taskForm.title = record.title;
  taskForm.action_type = record.action_type;
  taskForm.resource_type = record.resource_type;
  taskForm.resource_id = record.resource_id ?? undefined;
  taskForm.resource_key = record.resource_key ?? '';
  taskForm.resource_version_id = record.resource_version_id ?? undefined;
  taskForm.expected_minutes = record.expected_minutes;
  taskForm.description = record.description ?? '';
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
  loadResourceConfig(record.resource_config);
  taskModalOpen.value = true;
  await loadKnowledgeSystems();
  if (record.resource_type === 'question_bank' && record.resource_id) {
    await onQuestionBankChange(record.resource_id, true);
    if (resourceConfig.selection_mode === 'manual') await loadManualQuestions();
  }
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
  if (!taskForm.resource_id) {
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

async function loadKnowledgeSystems() {
  knowledgeSystems.value = [];
  knowledgeSystemId.value = undefined;
  knowledgeTree.value = [];
  selectedKnowledgePointIds.value = [];
  if (!knowledgeDomainCategoryId.value) return;
  const result = await getKnowledgeSystemsApi({
    domain_category_id: knowledgeDomainCategoryId.value,
    page: 1,
    size: 200,
  });
  knowledgeSystems.value = result.items ?? [];
}

async function onKnowledgeDomainChange() {
  taskForm.knowledge_points = [];
  await loadKnowledgeSystems();
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
  if (!selectedTemplate.value || !taskForm.title.trim()) {
    message.warning('请填写任务标题');
    return;
  }
  if (taskForm.relative_day > selectedTemplate.value.duration_days) {
    message.warning(
      `任务天数不能超过模板周期 ${selectedTemplate.value.duration_days} 天`,
    );
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
    const payload: CreateLearningPlanTemplateTaskParams = {
      action_type: taskForm.action_type,
      description: taskForm.description || null,
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
      relative_day: taskForm.relative_day,
      resource_config: Object.keys(config).length > 0 ? config : null,
      resource_id: taskForm.resource_id || null,
      resource_key: taskForm.resource_key || null,
      resource_type: taskForm.resource_type,
      resource_version_id: taskForm.resource_version_id || null,
      stage_id: taskForm.stage_id || null,
      template_id: selectedTemplate.value.id,
      title: taskForm.title.trim(),
    };
    if (editingTaskId.value) {
      const { template_id: _templateId, ...updatePayload } = payload;
      await updateLearningPlanTemplateTaskApi(
        editingTaskId.value,
        updatePayload,
      );
      message.success('模板任务已更新');
    } else {
      await createLearningPlanTemplateTaskApi(payload);
      message.success('模板任务已创建');
    }
    taskModalOpen.value = false;
    await refreshContent();
  } finally {
    taskSubmitting.value = false;
  }
}

async function removeTask(record: LearningPlanTemplateTaskDetail) {
  await deleteLearningPlanTemplateTaskApi(record.id);
  message.success('模板任务已删除');
  await refreshContent();
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
        <a-button type="primary" @click="openCreateTemplate">新建模板</a-button>
      </template>
      <template #name_default="{ row }">
        <div class="font-medium">{{ row.name }}</div>
        <div class="text-xs text-gray-500">
          {{ row.code }} · V{{ row.version }}
        </div>
      </template>
      <template #exam_default="{ row }">
        {{
          findOption(examTypeOptions, row.exam_type)?.label ||
          row.exam_type ||
          '通用'
        }}
      </template>
      <template #content_default="{ row }">
        <span>{{ row.stage_count }} 个阶段 · {{ row.task_count }} 个任务</span>
      </template>
      <template #status_default="{ row }">
        <a-tag :color="findOption(templateStatusOptions, row.status)?.color">
          {{
            findOption(templateStatusOptions, row.status)?.label || row.status
          }}
        </a-tag>
      </template>
      <template #operation_default="{ row }">
        <a-button type="link" @click="openContent(row)">模板内容</a-button>
        <a-button type="link" @click="openEditTemplate(row)">编辑</a-button>
        <a-popconfirm
          title="确定删除模板？已生成的用户计划不会受影响。"
          @confirm="removeTemplate(row)"
        >
          <a-button danger type="link">删除</a-button>
        </a-popconfirm>
      </template>
    </Grid>

    <a-modal
      v-model:open="templateModalOpen"
      :confirm-loading="templateSubmitting"
      :title="templateModalTitle"
      width="720px"
      @ok="submitTemplate"
    >
      <a-form layout="vertical">
        <div class="grid grid-cols-2 gap-4">
          <a-form-item label="模板编码" required>
            <a-input
              v-model:value="templateForm.code"
              :maxlength="64"
              placeholder="例如：GKS_90D_V1"
            />
          </a-form-item>
          <a-form-item label="模板名称" required>
            <a-input
              v-model:value="templateForm.name"
              :maxlength="255"
              placeholder="例如：国考 90 天系统班"
            />
          </a-form-item>
          <a-form-item label="适用考试">
            <a-select
              v-model:value="templateForm.exam_type"
              :options="examTypeOptions"
            />
          </a-form-item>
          <a-form-item label="学习领域" required>
            <a-select
              v-model:value="templateForm.domain_category_id"
              :options="domainCategoryOptions"
              placeholder="请选择题库知识体系所属领域"
            />
          </a-form-item>
          <a-form-item label="模板状态">
            <a-select
              v-model:value="templateForm.status"
              :options="templateStatusOptions"
            />
          </a-form-item>
          <a-form-item label="周期天数">
            <a-input-number
              v-model:value="templateForm.duration_days"
              :max="3650"
              :min="1"
              style="width: 100%"
            />
          </a-form-item>
          <a-form-item label="默认每日学习时长">
            <a-input-number
              v-model:value="templateForm.default_daily_minutes"
              :max="1440"
              :min="0"
              style="width: 100%"
            />
          </a-form-item>
          <a-form-item label="版本号">
            <a-input-number
              v-model:value="templateForm.version"
              :min="1"
              style="width: 100%"
            />
          </a-form-item>
        </div>
        <a-form-item label="模板说明">
          <a-textarea v-model:value="templateForm.description" :rows="4" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-drawer
      v-model:open="contentDrawerOpen"
      destroy-on-close
      :title="
        selectedTemplate ? `模板内容：${selectedTemplate.name}` : '模板内容'
      "
      width="1280px"
    >
      <a-alert
        class="mb-4"
        message="模板只维护一次。交付时系统会按开始日期复制生成用户计划，之后模板修改不会影响已交付计划。"
        show-icon
        type="info"
      />
      <a-card class="mb-4" size="small" title="学习阶段">
        <template #extra>
          <a-button type="link" @click="openCreateStage">新增阶段</a-button>
        </template>
        <a-table
          :columns="stageColumns"
          :data-source="stages"
          :pagination="false"
          row-key="id"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'range'">
              第 {{ record.start_day }}～{{ record.end_day }} 天
            </template>
            <template v-else-if="column.dataIndex === 'operation'">
              <a-button type="link" @click="openEditStage(record)">
                编辑
              </a-button>
              <a-popconfirm
                title="删除后该阶段的任务会保留并改为未分阶段，确定继续？"
                @confirm="removeStage(record)"
              >
                <a-button danger type="link">删除</a-button>
              </a-popconfirm>
            </template>
          </template>
        </a-table>
      </a-card>

      <TaskGrid>
        <template #toolbar-actions>
          <span class="font-medium">每日任务与完成指标</span>
        </template>
        <template #toolbar-tools>
          <a-button type="primary" @click="openCreateTask">
            新增模板任务
          </a-button>
        </template>
        <template #task_title_default="{ row }">
          <div class="font-medium">{{ row.title }}</div>
          <div class="text-xs text-gray-500">
            当日排序 {{ row.order_index }}
          </div>
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
          {{ formatGoals(row.goals) }}
        </template>
        <template #knowledge_default="{ row }">
          <a-space wrap>
            <a-tag
              v-for="point in row.knowledge_points"
              :key="point.id || point.knowledge_point_id"
            >
              {{ point.knowledge_point_name || point.knowledge_point_id }}
            </a-tag>
            <span v-if="row.knowledge_points.length === 0" class="text-gray-400"
              >未设置</span
            >
          </a-space>
        </template>
        <template #task_operation_default="{ row }">
          <a-button type="link" @click="openEditTask(row)">编辑</a-button>
          <a-popconfirm title="确定删除该模板任务？" @confirm="removeTask(row)">
            <a-button danger type="link">删除</a-button>
          </a-popconfirm>
        </template>
      </TaskGrid>
    </a-drawer>

    <a-modal
      v-model:open="stageModalOpen"
      :confirm-loading="stageSubmitting"
      :title="editingStageId ? '编辑模板阶段' : '新增模板阶段'"
      width="600px"
      @ok="submitStage"
    >
      <a-form layout="vertical">
        <a-form-item label="阶段名称" required>
          <a-input
            v-model:value="stageForm.name"
            :maxlength="128"
            placeholder="基础 / 强化 / 冲刺"
          />
        </a-form-item>
        <div class="grid grid-cols-3 gap-4">
          <a-form-item label="开始天数">
            <a-input-number
              v-model:value="stageForm.start_day"
              :min="1"
              style="width: 100%"
            />
          </a-form-item>
          <a-form-item label="结束天数">
            <a-input-number
              v-model:value="stageForm.end_day"
              :max="selectedTemplate?.duration_days"
              :min="1"
              style="width: 100%"
            />
          </a-form-item>
          <a-form-item label="排序">
            <a-input-number
              v-model:value="stageForm.order_index"
              :min="0"
              style="width: 100%"
            />
          </a-form-item>
        </div>
        <a-form-item label="阶段说明">
          <a-textarea v-model:value="stageForm.description" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="taskModalOpen"
      :confirm-loading="taskSubmitting"
      :title="editingTaskId ? '编辑模板任务' : '新增模板任务'"
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
          <div class="grid grid-cols-3 gap-4">
            <a-form-item label="相对日期" required>
              <a-input-number
                v-model:value="taskForm.relative_day"
                :max="selectedTemplate?.duration_days"
                :min="1"
                style="width: 100%"
              />
            </a-form-item>
            <a-form-item label="所属阶段">
              <a-select
                v-model:value="taskForm.stage_id"
                allow-clear
                :options="
                  stages.map((item) => ({ label: item.name, value: item.id }))
                "
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
                    {{ questionTypeLabel(record.question_type) }}
                  </template>
                  <template v-else-if="column.dataIndex === 'difficulty'">
                    {{ record.difficulty || '未标注' }}
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
            <a-form-item label="需要阅读确认">
              <a-switch v-model:checked="resourceConfig.require_acknowledge" />
            </a-form-item>
          </div>
          <div
            v-else-if="
              ['course', 'course_lesson'].includes(taskForm.resource_type)
            "
            class="grid grid-cols-2 gap-4"
          >
            <a-form-item label="起始位置（秒）">
              <a-input-number
                v-model:value="resourceConfig.start_position_seconds"
                :min="0"
                style="width: 100%"
              />
            </a-form-item>
            <a-form-item label="必须完整学完">
              <a-switch v-model:checked="resourceConfig.must_finish" />
            </a-form-item>
          </div>
          <div
            v-else-if="taskForm.resource_type === 'ability'"
            class="grid grid-cols-3 gap-4"
          >
            <a-form-item label="能力等级">
              <a-input v-model:value="resourceConfig.ability_level" />
            </a-form-item>
            <a-form-item label="训练模式">
              <a-select
                v-model:value="resourceConfig.training_mode"
                :options="[
                  { label: '标准', value: 'standard' },
                  { label: '限时', value: 'timed' },
                  { label: '强化', value: 'intensive' },
                ]"
              />
            </a-form-item>
            <a-form-item label="重复次数">
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
            <a-form-item label="资源提供方">
              <a-input v-model:value="resourceConfig.provider" />
            </a-form-item>
            <a-form-item label="打开方式">
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
                <a-button type="primary" @click="addKnowledgeBindings">
                  应用知识点
                </a-button>
              </a-space>
            </a-form-item>
          </div>
          <a-table
            :columns="knowledgeColumns"
            :data-source="taskForm.knowledge_points"
            :pagination="false"
            row-key="knowledge_point_id"
            size="small"
          >
            <template #bodyCell="{ column, record, index }">
              <template v-if="column.dataIndex === 'role'">
                {{ record.role === 'primary' ? '主要' : '次要' }}
              </template>
              <template v-else-if="column.dataIndex === 'include_descendants'">
                {{ record.include_descendants ? '是' : '否' }}
              </template>
              <template v-else-if="column.dataIndex === 'operation'">
                <a-button
                  danger
                  type="link"
                  @click="taskForm.knowledge_points.splice(index, 1)"
                >
                  移除
                </a-button>
              </template>
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
              </a-button>
            </div>
          </div>
          <a-button
            block
            type="dashed"
            @click="taskForm.goals.push(makeGoal())"
          >
            添加指标
          </a-button>
        </a-card>

        <a-form-item label="任务说明">
          <a-textarea v-model:value="taskForm.description" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>
  </Page>
</template>
