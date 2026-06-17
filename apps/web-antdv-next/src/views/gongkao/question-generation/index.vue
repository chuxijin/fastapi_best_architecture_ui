<script lang="ts" setup>
import type {
  CreateQuestionGenerationMaterialParams,
  QuestionGenerationCandidateDetail,
  QuestionGenerationCandidateListItem,
  QuestionGenerationCandidateStatus,
  QuestionGenerationMaterialDetail,
  QuestionGenerationMaterialListItem,
  QuestionGenerationMaterialStatus,
  QuestionGenerationTaskDetail,
  QuestionGenerationTaskListItem,
  QuestionGenerationTaskStatus,
} from '#/api/question-generation';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page, VbenButton } from '@vben/common-ui';
import {
  MaterialSymbolsAdd,
  AntDesignReloadOutlined as ReloadOutlined,
} from '@vben/icons';
import { useUserStore } from '@vben/stores';

import { message } from 'ant-design-vue';

import {
  createQuestionGenerationMaterialApi,
  deleteQuestionGenerationCandidatesApi,
  deleteQuestionGenerationMaterialsApi,
  deleteQuestionGenerationTasksApi,
  getQuestionGenerationCandidateApi,
  getQuestionGenerationCandidatesApi,
  getQuestionGenerationMaterialApi,
  getQuestionGenerationMaterialsApi,
  getQuestionGenerationTaskApi,
  getQuestionGenerationTasksApi,
  reviewQuestionGenerationCandidateApi,
  startQuestionGenerationTaskApi,
  updateQuestionGenerationMaterialApi,
} from '#/api/question-generation';

interface OptionMeta<T extends string> {
  color: string;
  label: string;
  value: T;
}

interface MaterialFormState extends CreateQuestionGenerationMaterialParams {
  id?: number;
  status: QuestionGenerationMaterialStatus;
}

type SnapshotRecord = Record<string, unknown>;

const materialStatusOptions: OptionMeta<QuestionGenerationMaterialStatus>[] = [
  { color: 'default', label: '草稿', value: 'draft' },
  { color: 'green', label: '可出题', value: 'usable' },
  { color: 'red', label: '不可用', value: 'unusable' },
  { color: 'orange', label: '待人工复核', value: 'manual_review' },
];

const taskStatusOptions: OptionMeta<QuestionGenerationTaskStatus>[] = [
  { color: 'default', label: '待执行', value: 'pending' },
  { color: 'processing', label: '分析中', value: 'analyzing' },
  { color: 'processing', label: '规划中', value: 'planning' },
  { color: 'processing', label: '生成中', value: 'generating' },
  { color: 'purple', label: '质检中', value: 'reviewing' },
  { color: 'green', label: '已完成', value: 'completed' },
  { color: 'red', label: '失败', value: 'failed' },
];

const taskStageOptions: OptionMeta<string>[] = [
  { color: 'blue', label: '加载命题规则', value: 'load_profile' },
  { color: 'blue', label: '分析文章结构', value: 'analyze_article' },
  { color: 'cyan', label: '挖掘命题片段', value: 'mine_passages' },
  { color: 'cyan', label: '质检命题片段', value: 'review_passages' },
  { color: 'purple', label: '判断适配题型', value: 'plan_question_types' },
  { color: 'purple', label: '质检题型机会', value: 'review_question_types' },
  { color: 'geekblue', label: '规划命题蓝图', value: 'plan_blueprints' },
  { color: 'processing', label: '生成题干解析', value: 'draft_questions' },
  { color: 'processing', label: '设计选项', value: 'design_options' },
  { color: 'orange', label: '成题质检修复', value: 'review_generation' },
];

const candidateStatusOptions: OptionMeta<QuestionGenerationCandidateStatus>[] =
  [
    { color: 'default', label: '草稿', value: 'draft' },
    { color: 'green', label: '质检通过', value: 'qc_passed' },
    { color: 'red', label: '质检失败', value: 'qc_failed' },
    { color: 'blue', label: '已审核', value: 'approved' },
    { color: 'cyan', label: '已发布', value: 'published' },
    { color: 'orange', label: '已驳回', value: 'rejected' },
  ];

const materialColumns: any[] = [
  { dataIndex: 'id', title: 'ID', width: 72 },
  { dataIndex: 'title', title: '素材标题', width: 280 },
  { dataIndex: 'source', title: '来源', width: 160 },
  { dataIndex: 'scope', title: '范围', width: 160 },
  { dataIndex: 'status', title: '状态', width: 120 },
  { dataIndex: 'source_publish_time', title: '来源发布时间', width: 170 },
  { dataIndex: 'tags', title: '标签', width: 210 },
  { dataIndex: 'processed_time', title: '处理时间', width: 170 },
  {
    dataIndex: 'operation',
    fixed: 'right' as const,
    title: '操作',
    width: 300,
  },
];

const taskColumns: any[] = [
  { dataIndex: 'id', title: '任务 ID', width: 90 },
  { dataIndex: 'material_id', title: '素材 ID', width: 90 },
  { dataIndex: 'status', title: '状态', width: 120 },
  { dataIndex: 'progress', title: '进度', width: 160 },
  { dataIndex: 'stage', title: '阶段', width: 130 },
  { dataIndex: 'error_message', title: '错误', width: 220 },
  { dataIndex: 'created_time', title: '创建时间', width: 170 },
  {
    dataIndex: 'operation',
    fixed: 'right' as const,
    title: '操作',
    width: 160,
  },
];

const candidateColumns: any[] = [
  { dataIndex: 'id', title: '候选题 ID', width: 100 },
  { dataIndex: 'task_id', title: '任务 ID', width: 90 },
  { dataIndex: 'material_id', title: '素材 ID', width: 90 },
  { dataIndex: 'question_type', title: '题型', width: 150 },
  { dataIndex: 'question_subtype', title: '细分', width: 140 },
  { dataIndex: 'difficulty', title: '难度', width: 90 },
  { dataIndex: 'status', title: '状态', width: 120 },
  { dataIndex: 'published_question_id', title: '发布题目', width: 110 },
  { dataIndex: 'created_time', title: '创建时间', width: 170 },
  {
    dataIndex: 'operation',
    fixed: 'right' as const,
    title: '操作',
    width: 220,
  },
];

const userStore = useUserStore();
const activeTab = ref('materials');

const materials = ref<QuestionGenerationMaterialListItem[]>([]);
const tasks = ref<QuestionGenerationTaskListItem[]>([]);
const candidates = ref<QuestionGenerationCandidateListItem[]>([]);

const materialLoading = ref(false);
const taskLoading = ref(false);
const candidateLoading = ref(false);

const materialModalOpen = ref(false);
const materialSubmitting = ref(false);
const startModalOpen = ref(false);
const startSubmitting = ref(false);
const materialDrawerOpen = ref(false);
const taskDrawerOpen = ref(false);
const candidateDrawerOpen = ref(false);
const candidateReviewing = ref(false);

const selectedMaterial = ref<null | QuestionGenerationMaterialDetail>(null);
const selectedTask = ref<null | QuestionGenerationTaskDetail>(null);
const selectedCandidate = ref<null | QuestionGenerationCandidateDetail>(null);
const reviewReason = ref('');

const materialFilters = reactive<{
  keyword?: string;
  status?: QuestionGenerationMaterialStatus;
}>({});

const taskFilters = reactive<{
  material_id?: number;
  status?: QuestionGenerationTaskStatus;
}>({});

const candidateFilters = reactive<{
  material_id?: number;
  status?: QuestionGenerationCandidateStatus;
  task_id?: number;
}>({});

const materialForm = reactive<MaterialFormState>(createDefaultMaterialForm());

const startForm = reactive({
  material_id: undefined as number | undefined,
  mini_model_id: '',
  model_id: 'mimo-v2.5-pro',
  provider_id: 5,
});

const materialModalTitle = computed(() =>
  materialForm.id ? '编辑出题素材' : '新增出题素材',
);

const currentUserId = computed(() => userStore.userInfo?.id);
const selectedTaskSnapshot = computed(() =>
  asRecord(selectedTask.value?.state_snapshot),
);
const selectedTaskResultSummary = computed(() =>
  asRecord(selectedTask.value?.result_summary),
);
const selectedTaskUsageSummary = computed(() => {
  const resultUsage = asRecord(selectedTaskResultSummary.value.usage_summary);
  if (Object.keys(resultUsage).length > 0) {
    return resultUsage;
  }

  return asRecord(selectedTaskSnapshot.value.usage_summary);
});
const selectedTaskPassagePlan = computed(() =>
  asRecord(selectedTaskSnapshot.value.passage_plan),
);
const selectedTaskPassages = computed(() => {
  const directPassages = asRecordList(
    selectedTaskSnapshot.value.selected_passages,
  );
  if (directPassages.length > 0) {
    return directPassages;
  }

  return asRecordList(selectedTaskPassagePlan.value.passages);
});
const selectedTaskPassageReviews = computed(() =>
  asRecordList(selectedTaskSnapshot.value.passage_reviews),
);
const selectedTaskDiscardedPassages = computed(() =>
  asRecordList(selectedTaskSnapshot.value.discarded_passages),
);
const selectedTaskTypeOpportunities = computed(() =>
  asRecordList(selectedTaskSnapshot.value.question_type_opportunities),
);
const selectedTaskTypeReviews = computed(() =>
  asRecordList(selectedTaskSnapshot.value.type_reviews),
);
const selectedTaskBlueprints = computed(() =>
  asRecordList(selectedTaskSnapshot.value.blueprints),
);
const selectedTaskQuestionReviews = computed(() =>
  asRecordList(selectedTaskSnapshot.value.question_reviews),
);
const selectedTaskDiscardedCandidates = computed(() =>
  asRecordList(selectedTaskSnapshot.value.discarded_candidates),
);
const taskVisualStats = computed(() => {
  const candidateCount = Number(
    selectedTaskSnapshot.value.candidate_count || 0,
  );
  return [
    { label: '命题片段', value: selectedTaskPassages.value.length },
    { label: '题型机会', value: selectedTaskTypeOpportunities.value.length },
    { label: '命题蓝图', value: selectedTaskBlueprints.value.length },
    { label: '候选题', value: candidateCount },
  ];
});
const currentTaskStageIndex = computed(() => {
  const stage = selectedTask.value?.stage;
  const stageIndex = taskStageOptions.findIndex((item) => item.value === stage);
  if (stageIndex !== -1) {
    return stageIndex;
  }

  return 0;
});

function createDefaultMaterialForm(): MaterialFormState {
  return {
    content: '',
    exam: 'gk',
    province: '',
    section: 'yuyan',
    source: '',
    source_publish_time: undefined,
    source_url: '',
    status: 'draft',
    subject: 'xingce',
    tags: [],
    title: '',
    year: undefined,
  };
}

function resetMaterialForm() {
  Object.assign(materialForm, createDefaultMaterialForm());
}

function findMeta<T extends string>(options: OptionMeta<T>[], value?: T) {
  return options.find((item) => item.value === value);
}

function asRecord(value: unknown): SnapshotRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as SnapshotRecord;
}

function asRecordList(value: unknown): SnapshotRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => item && typeof item === 'object' && !Array.isArray(item))
    .map((item) => item as SnapshotRecord);
}

function formatTaskStage(stage?: null | string) {
  if (!stage) {
    return '-';
  }

  return findMeta(taskStageOptions, stage)?.label ?? stage;
}

function formatUnknown(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (Array.isArray(value)) {
    return (
      value.filter((item) => item !== null && item !== undefined).join('、') ||
      '-'
    );
  }

  if (typeof value === 'object') {
    return formatJson(value);
  }

  return String(value);
}

function formatDurationMs(value: unknown) {
  const durationMs = Number(value || 0);
  if (!durationMs) {
    return '-';
  }

  if (durationMs < 1000) {
    return `${durationMs} ms`;
  }

  const seconds = Math.round(durationMs / 1000);
  if (seconds < 60) {
    return `${seconds} 秒`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes} 分 ${remainingSeconds} 秒`;
}

function formatConfidence(value: unknown) {
  const confidence = Number(value);
  if (Number.isNaN(confidence)) {
    return '-';
  }

  return `${Math.round(confidence * 100)}%`;
}

function getTaskStageState(stage: string) {
  const task = selectedTask.value;
  if (!task) {
    return 'wait';
  }

  const stageIndex = taskStageOptions.findIndex((item) => item.value === stage);
  if (task.status === 'completed') {
    return 'done';
  }
  if (task.status === 'failed' && task.stage === stage) {
    return 'failed';
  }
  if (stageIndex < currentTaskStageIndex.value) {
    return 'done';
  }
  if (stageIndex === currentTaskStageIndex.value) {
    return 'active';
  }

  return 'wait';
}

function getTaskStageStateLabel(stage: string) {
  const state = getTaskStageState(stage);
  const labelMap: Record<string, string> = {
    active: '进行中',
    done: '已完成',
    failed: '失败',
    wait: '待执行',
  };

  return labelMap[state] ?? state;
}

function getReviewDecisionColor(decision: unknown) {
  const normalizedDecision = String(decision || '');
  if (normalizedDecision === 'pass') {
    return 'green';
  }
  if (normalizedDecision === 'revise') {
    return 'orange';
  }
  if (normalizedDecision === 'discard') {
    return 'red';
  }

  return 'default';
}

function formatDateTime(value?: null | string) {
  if (!value) {
    return '-';
  }

  return value.replace('T', ' ').slice(0, 19);
}

function formatJson(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  return JSON.stringify(value, null, 2);
}

function normalizeNumber(value?: number) {
  if (!value) {
    return undefined;
  }

  return value;
}

function stringifyTags(tags?: null | string[]) {
  if (!tags || tags.length === 0) {
    return '-';
  }

  return tags.join('、');
}

function getOptionLabel(option: Record<string, unknown>, index: number) {
  const candidateKeys = ['key', 'label', 'name', 'option', 'id'];
  const matchedKey = candidateKeys.find((key) => option[key]);
  if (matchedKey) {
    return String(option[matchedKey]);
  }

  return String.fromCodePoint(65 + index);
}

function getOptionContent(option: Record<string, unknown>) {
  const candidateKeys = ['content', 'text', 'value', 'title'];
  const matchedKey = candidateKeys.find((key) => option[key]);
  if (matchedKey) {
    return String(option[matchedKey]);
  }

  return formatJson(option);
}

function getCandidatePassage(candidate: QuestionGenerationCandidateDetail) {
  if (candidate.selected_passage?.trim()) {
    return candidate.selected_passage.trim();
  }

  const passage = candidate.passage_meta?.selected_passage;
  if (typeof passage === 'string' && passage.trim()) {
    return passage.trim();
  }

  return '';
}

function getCandidateFullStem(candidate: QuestionGenerationCandidateDetail) {
  const passage = getCandidatePassage(candidate);
  const stem = candidate.stem.trim();
  if (!passage) {
    return stem;
  }
  if (stem.includes(passage)) {
    return stem;
  }
  if (stem && passage.includes(stem.slice(0, 30))) {
    return stem;
  }
  if (!stem) {
    return passage;
  }

  return `${passage}\n\n${stem}`;
}

function buildMaterialPayload() {
  return {
    content: materialForm.content.trim(),
    exam: materialForm.exam || 'gk',
    province: materialForm.province?.trim() || undefined,
    section: materialForm.section || 'yuyan',
    source: materialForm.source?.trim() || undefined,
    source_publish_time: materialForm.source_publish_time,
    source_url: materialForm.source_url?.trim() || undefined,
    status: materialForm.status,
    subject: materialForm.subject || 'xingce',
    tags: materialForm.tags,
    title: materialForm.title.trim(),
    year: materialForm.year,
  };
}

async function loadMaterials() {
  materialLoading.value = true;
  try {
    materials.value = await getQuestionGenerationMaterialsApi({
      exam: 'gk',
      keyword: materialFilters.keyword || undefined,
      section: 'yuyan',
      status: materialFilters.status,
      subject: 'xingce',
    });
  } finally {
    materialLoading.value = false;
  }
}

async function loadTasks() {
  taskLoading.value = true;
  try {
    tasks.value = await getQuestionGenerationTasksApi({
      material_id: normalizeNumber(taskFilters.material_id),
      status: taskFilters.status,
    });
  } finally {
    taskLoading.value = false;
  }
}

async function loadCandidates() {
  candidateLoading.value = true;
  try {
    candidates.value = await getQuestionGenerationCandidatesApi({
      material_id: normalizeNumber(candidateFilters.material_id),
      status: candidateFilters.status,
      task_id: normalizeNumber(candidateFilters.task_id),
    });
  } finally {
    candidateLoading.value = false;
  }
}

async function refreshAll() {
  await Promise.all([loadMaterials(), loadTasks(), loadCandidates()]);
}

function openCreateMaterial() {
  resetMaterialForm();
  materialModalOpen.value = true;
}

async function openEditMaterial(row: unknown) {
  const target = row as QuestionGenerationMaterialListItem;
  const detail = await getQuestionGenerationMaterialApi(target.id);
  resetMaterialForm();
  Object.assign(materialForm, {
    content: detail.content,
    exam: detail.exam,
    id: detail.id,
    province: detail.province ?? '',
    section: detail.section,
    source: detail.source ?? '',
    source_publish_time: detail.source_publish_time ?? undefined,
    source_url: detail.source_url ?? '',
    status: detail.status,
    subject: detail.subject,
    tags: detail.tags ?? [],
    title: detail.title,
    year: detail.year ?? undefined,
  });
  materialModalOpen.value = true;
}

async function submitMaterial() {
  if (!materialForm.title.trim()) {
    message.warning('请填写素材标题');
    return;
  }

  if (!materialForm.content.trim()) {
    message.warning('请填写素材正文');
    return;
  }

  materialSubmitting.value = true;
  try {
    const payload = buildMaterialPayload();
    if (materialForm.id) {
      await updateQuestionGenerationMaterialApi(materialForm.id, payload);
      message.success('素材已更新');
    } else {
      await createQuestionGenerationMaterialApi(payload);
      message.success('素材已创建');
    }
    materialModalOpen.value = false;
    await loadMaterials();
  } finally {
    materialSubmitting.value = false;
  }
}

async function deleteMaterial(row: unknown) {
  const target = row as QuestionGenerationMaterialListItem;
  await deleteQuestionGenerationMaterialsApi([target.id]);
  message.success('素材已删除');
  await refreshAll();
}

async function deleteTask(row: unknown) {
  const target = row as QuestionGenerationTaskListItem;
  await deleteQuestionGenerationTasksApi([target.id]);
  message.success('任务已删除');
  await Promise.all([loadTasks(), loadCandidates()]);
}

async function deleteCandidate(row: unknown) {
  const target = row as QuestionGenerationCandidateListItem;
  await deleteQuestionGenerationCandidatesApi([target.id]);
  message.success('候选题已删除');
  await loadCandidates();
}

async function openMaterialDetail(row: unknown) {
  const target = row as QuestionGenerationMaterialListItem;
  selectedMaterial.value = await getQuestionGenerationMaterialApi(target.id);
  materialDrawerOpen.value = true;
}

function openStartTask(row: unknown) {
  const target = row as QuestionGenerationMaterialListItem;
  startForm.material_id = target.id;
  startForm.provider_id = 5;
  startForm.model_id = 'mimo-v2.5-pro';
  startForm.mini_model_id = '';
  startModalOpen.value = true;
}

async function submitStartTask() {
  if (!startForm.material_id) {
    message.warning('请选择素材');
    return;
  }

  if (!currentUserId.value) {
    message.warning('无法获取当前用户 ID，请重新登录后再试');
    return;
  }

  startSubmitting.value = true;
  try {
    const result = await startQuestionGenerationTaskApi({
      exam: 'gk',
      material_id: startForm.material_id,
      mini_model_id: startForm.mini_model_id || undefined,
      model_id: startForm.model_id,
      provider_id: startForm.provider_id,
      section: 'yuyan',
      subject: 'xingce',
      user_id: currentUserId.value,
    });
    message.success(`任务已创建：#${result.task_id}`);
    startModalOpen.value = false;
    activeTab.value = 'tasks';
    await loadTasks();
  } finally {
    startSubmitting.value = false;
  }
}

async function openTaskDetail(row: unknown) {
  const target = row as QuestionGenerationTaskListItem;
  selectedTask.value = await getQuestionGenerationTaskApi(target.id);
  taskDrawerOpen.value = true;
}

async function openCandidateDetail(row: unknown) {
  const target = row as QuestionGenerationCandidateListItem;
  selectedCandidate.value = await getQuestionGenerationCandidateApi(target.id);
  reviewReason.value = '';
  candidateDrawerOpen.value = true;
}

async function reviewCandidate(row: unknown, status: 'approved' | 'rejected') {
  const target = row as
    | QuestionGenerationCandidateDetail
    | QuestionGenerationCandidateListItem;
  candidateReviewing.value = true;
  try {
    await reviewQuestionGenerationCandidateApi(target.id, {
      reason: reviewReason.value || undefined,
      status,
    });
    message.success(status === 'approved' ? '候选题已通过' : '候选题已驳回');
    candidateDrawerOpen.value = false;
    await loadCandidates();
  } finally {
    candidateReviewing.value = false;
  }
}

onMounted(() => {
  void refreshAll();
});
</script>

<template>
  <Page auto-content-height>
    <div class="qg-page">
      <div class="qg-header">
        <div>
          <div class="qg-title">国考言语 AI 出题管理</div>
          <div class="qg-subtitle">
            素材入库、自动选段出题、任务追踪与候选题审核
          </div>
        </div>
        <div class="qg-header-actions">
          <a-button @click="refreshAll">
            <template #icon><ReloadOutlined /></template>
            刷新
          </a-button>
          <VbenButton type="primary" @click="openCreateMaterial">
            <MaterialSymbolsAdd class="size-5" />
            新增素材
          </VbenButton>
        </div>
      </div>

      <a-tabs v-model:active-key="activeTab" class="qg-tabs">
        <a-tab-pane key="materials" tab="素材库">
          <div class="qg-panel">
            <div class="qg-toolbar">
              <a-input-search
                v-model:value="materialFilters.keyword"
                allow-clear
                placeholder="搜索标题、来源、正文"
                style="width: 280px"
                @search="loadMaterials"
              />
              <a-select
                v-model:value="materialFilters.status"
                allow-clear
                :options="materialStatusOptions"
                placeholder="素材状态"
                style="width: 150px"
                @change="loadMaterials"
              />
            </div>
            <a-table
              :columns="materialColumns"
              :data-source="materials"
              :loading="materialLoading"
              row-key="id"
              size="middle"
              :pagination="{ pageSize: 12, showSizeChanger: true }"
              :scroll="{ x: 1470 }"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'title'">
                  <a-button
                    type="link"
                    class="qg-link-title"
                    @click="openMaterialDetail(record)"
                  >
                    {{ record.title }}
                  </a-button>
                </template>
                <template v-else-if="column.dataIndex === 'scope'">
                  {{ record.exam }} / {{ record.subject }} /
                  {{ record.section }}
                </template>
                <template v-else-if="column.dataIndex === 'status'">
                  <a-tag
                    :color="
                      findMeta(materialStatusOptions, record.status)?.color
                    "
                  >
                    {{
                      findMeta(materialStatusOptions, record.status)?.label ??
                      record.status
                    }}
                  </a-tag>
                </template>
                <template v-else-if="column.dataIndex === 'tags'">
                  <span v-if="!record.tags?.length">-</span>
                  <a-tag v-for="tag in record.tags" v-else :key="tag">
                    {{ tag }}
                  </a-tag>
                </template>
                <template
                  v-else-if="column.dataIndex === 'source_publish_time'"
                >
                  {{ formatDateTime(record.source_publish_time) }}
                </template>
                <template v-else-if="column.dataIndex === 'processed_time'">
                  {{ formatDateTime(record.processed_time) }}
                </template>
                <template v-else-if="column.dataIndex === 'operation'">
                  <a-space>
                    <a-button
                      size="small"
                      type="link"
                      @click="openStartTask(record)"
                    >
                      启动出题
                    </a-button>
                    <a-button
                      size="small"
                      type="link"
                      @click="openEditMaterial(record)"
                    >
                      编辑
                    </a-button>
                    <a-popconfirm
                      title="确定删除该素材？"
                      @confirm="deleteMaterial(record)"
                    >
                      <a-button danger size="small" type="link">删除</a-button>
                    </a-popconfirm>
                  </a-space>
                </template>
              </template>
            </a-table>
          </div>
        </a-tab-pane>

        <a-tab-pane key="tasks" tab="出题任务">
          <div class="qg-panel">
            <div class="qg-toolbar">
              <a-input-number
                v-model:value="taskFilters.material_id"
                :min="1"
                placeholder="素材 ID"
                style="width: 140px"
                @press-enter="loadTasks"
              />
              <a-select
                v-model:value="taskFilters.status"
                allow-clear
                :options="taskStatusOptions"
                placeholder="任务状态"
                style="width: 150px"
                @change="loadTasks"
              />
              <a-button :loading="taskLoading" @click="loadTasks">
                查询
              </a-button>
            </div>
            <a-table
              :columns="taskColumns"
              :data-source="tasks"
              :loading="taskLoading"
              row-key="id"
              size="middle"
              :pagination="{ pageSize: 12, showSizeChanger: true }"
              :scroll="{ x: 1030 }"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'status'">
                  <a-tag
                    :color="findMeta(taskStatusOptions, record.status)?.color"
                  >
                    {{
                      findMeta(taskStatusOptions, record.status)?.label ??
                      record.status
                    }}
                  </a-tag>
                </template>
                <template v-else-if="column.dataIndex === 'progress'">
                  <a-progress
                    :percent="Math.round((record.progress || 0) * 100)"
                    size="small"
                  />
                </template>
                <template v-else-if="column.dataIndex === 'stage'">
                  <a-tag
                    :color="findMeta(taskStageOptions, record.stage)?.color"
                  >
                    {{ formatTaskStage(record.stage) }}
                  </a-tag>
                </template>
                <template v-else-if="column.dataIndex === 'error_message'">
                  <span class="qg-error-text">{{
                    record.error_message || '-'
                  }}</span>
                </template>
                <template v-else-if="column.dataIndex === 'created_time'">
                  {{ formatDateTime(record.created_time) }}
                </template>
                <template v-else-if="column.dataIndex === 'operation'">
                  <a-space>
                    <a-button type="link" @click="openTaskDetail(record)">
                      详情
                    </a-button>
                    <a-popconfirm
                      title="确定删除该任务？"
                      @confirm="deleteTask(record)"
                    >
                      <a-button danger size="small" type="link">删除</a-button>
                    </a-popconfirm>
                  </a-space>
                </template>
              </template>
            </a-table>
          </div>
        </a-tab-pane>

        <a-tab-pane key="candidates" tab="候选题">
          <div class="qg-panel">
            <div class="qg-toolbar">
              <a-input-number
                v-model:value="candidateFilters.task_id"
                :min="1"
                placeholder="任务 ID"
                style="width: 140px"
                @press-enter="loadCandidates"
              />
              <a-input-number
                v-model:value="candidateFilters.material_id"
                :min="1"
                placeholder="素材 ID"
                style="width: 140px"
                @press-enter="loadCandidates"
              />
              <a-select
                v-model:value="candidateFilters.status"
                allow-clear
                :options="candidateStatusOptions"
                placeholder="候选题状态"
                style="width: 160px"
                @change="loadCandidates"
              />
              <a-button :loading="candidateLoading" @click="loadCandidates">
                查询
              </a-button>
            </div>
            <a-table
              :columns="candidateColumns"
              :data-source="candidates"
              :loading="candidateLoading"
              row-key="id"
              size="middle"
              :pagination="{ pageSize: 12, showSizeChanger: true }"
              :scroll="{ x: 1220 }"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'status'">
                  <a-tag
                    :color="
                      findMeta(candidateStatusOptions, record.status)?.color
                    "
                  >
                    {{
                      findMeta(candidateStatusOptions, record.status)?.label ??
                      record.status
                    }}
                  </a-tag>
                </template>
                <template
                  v-else-if="column.dataIndex === 'published_question_id'"
                >
                  {{
                    record.published_question_id
                      ? `#${record.published_question_id}`
                      : '-'
                  }}
                </template>
                <template v-else-if="column.dataIndex === 'created_time'">
                  {{ formatDateTime(record.created_time) }}
                </template>
                <template v-else-if="column.dataIndex === 'operation'">
                  <a-space>
                    <a-button type="link" @click="openCandidateDetail(record)">
                      详情
                    </a-button>
                    <a-button
                      size="small"
                      type="link"
                      @click="reviewCandidate(record, 'approved')"
                    >
                      通过
                    </a-button>
                    <a-button
                      danger
                      size="small"
                      type="link"
                      @click="reviewCandidate(record, 'rejected')"
                    >
                      驳回
                    </a-button>
                    <a-popconfirm
                      title="确定删除该候选题？"
                      @confirm="deleteCandidate(record)"
                    >
                      <a-button danger size="small" type="link">删除</a-button>
                    </a-popconfirm>
                  </a-space>
                </template>
              </template>
            </a-table>
          </div>
        </a-tab-pane>
      </a-tabs>
    </div>

    <a-modal
      v-model:open="materialModalOpen"
      :confirm-loading="materialSubmitting"
      destroy-on-close
      :title="materialModalTitle"
      width="860px"
      @ok="submitMaterial"
    >
      <a-form layout="vertical">
        <div class="qg-form-grid">
          <a-form-item label="素材标题" required>
            <a-input
              v-model:value="materialForm.title"
              placeholder="输入便于检索的标题"
            />
          </a-form-item>
          <a-form-item label="来源">
            <a-input
              v-model:value="materialForm.source"
              placeholder="如 人民日报、半月谈"
            />
          </a-form-item>
          <a-form-item label="来源发布时间">
            <a-date-picker
              v-model:value="materialForm.source_publish_time"
              show-time
              style="width: 100%"
              value-format="YYYY-MM-DDTHH:mm:ss"
            />
          </a-form-item>
          <a-form-item label="年份">
            <a-input-number
              v-model:value="materialForm.year"
              :max="2100"
              :min="1900"
              style="width: 100%"
            />
          </a-form-item>
          <a-form-item label="状态">
            <a-select
              v-model:value="materialForm.status"
              :options="materialStatusOptions"
            />
          </a-form-item>
          <a-form-item label="考试">
            <a-input v-model:value="materialForm.exam" />
          </a-form-item>
          <a-form-item label="科目">
            <a-input v-model:value="materialForm.subject" />
          </a-form-item>
          <a-form-item label="模块">
            <a-input v-model:value="materialForm.section" />
          </a-form-item>
          <a-form-item label="地区">
            <a-input v-model:value="materialForm.province" />
          </a-form-item>
        </div>
        <a-form-item label="来源链接">
          <a-input v-model:value="materialForm.source_url" />
        </a-form-item>
        <a-form-item label="标签">
          <a-select
            v-model:value="materialForm.tags"
            mode="tags"
            placeholder="输入后回车添加标签"
          />
        </a-form-item>
        <a-form-item label="素材正文" required>
          <a-textarea
            v-model:value="materialForm.content"
            :rows="12"
            show-count
            placeholder="粘贴用于命题的原始文段"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="startModalOpen"
      :confirm-loading="startSubmitting"
      destroy-on-close
      title="启动出题任务"
      width="640px"
      @ok="submitStartTask"
    >
      <a-form layout="vertical">
        <a-alert
          message="系统将从文章中自动选择命题片段"
          description="片段可能是整段、段内连续几句，或横跨相邻两个自然段；用户不能手动指定题型或题量。"
          show-icon
          type="info"
        />
        <a-descriptions
          bordered
          class="qg-start-summary"
          size="small"
          :column="1"
        >
          <a-descriptions-item label="素材 ID">
            {{ startForm.material_id }}
          </a-descriptions-item>
          <a-descriptions-item label="考试范围">
            国考 / 行测 / 言语理解
          </a-descriptions-item>
          <a-descriptions-item label="生成策略">
            自动选段，自动决定题型与题量
          </a-descriptions-item>
        </a-descriptions>
      </a-form>
    </a-modal>

    <a-drawer
      v-model:open="materialDrawerOpen"
      destroy-on-close
      placement="right"
      title="素材详情"
      width="760px"
    >
      <template v-if="selectedMaterial">
        <a-descriptions bordered size="small" :column="2">
          <a-descriptions-item label="素材 ID">
            {{ selectedMaterial.id }}
          </a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag
              :color="
                findMeta(materialStatusOptions, selectedMaterial.status)?.color
              "
            >
              {{
                findMeta(materialStatusOptions, selectedMaterial.status)
                  ?.label ?? selectedMaterial.status
              }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="标题" :span="2">
            {{ selectedMaterial.title }}
          </a-descriptions-item>
          <a-descriptions-item label="来源">
            {{ selectedMaterial.source || '-' }}
          </a-descriptions-item>
          <a-descriptions-item label="来源发布时间">
            {{ formatDateTime(selectedMaterial.source_publish_time) }}
          </a-descriptions-item>
          <a-descriptions-item label="年份">
            {{ selectedMaterial.year || '-' }}
          </a-descriptions-item>
          <a-descriptions-item label="系统创建时间">
            {{ formatDateTime(selectedMaterial.created_time) }}
          </a-descriptions-item>
          <a-descriptions-item label="标签" :span="2">
            {{ stringifyTags(selectedMaterial.tags) }}
          </a-descriptions-item>
        </a-descriptions>

        <div class="qg-section-title">素材正文</div>
        <div class="qg-text-block">{{ selectedMaterial.content }}</div>

        <a-alert
          class="qg-detail-tip"
          message="选段结果将在出题任务执行后进入候选题详情"
          show-icon
          type="info"
        />
      </template>
    </a-drawer>

    <a-drawer
      v-model:open="taskDrawerOpen"
      destroy-on-close
      placement="right"
      title="出题任务详情"
      width="920px"
    >
      <template v-if="selectedTask">
        <a-descriptions bordered size="small" :column="2">
          <a-descriptions-item label="任务 ID">
            {{ selectedTask.id }}
          </a-descriptions-item>
          <a-descriptions-item label="素材 ID">
            {{ selectedTask.material_id }}
          </a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag
              :color="findMeta(taskStatusOptions, selectedTask.status)?.color"
            >
              {{
                findMeta(taskStatusOptions, selectedTask.status)?.label ??
                selectedTask.status
              }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="阶段">
            {{ formatTaskStage(selectedTask.stage) }}
          </a-descriptions-item>
          <a-descriptions-item label="题量">
            {{ selectedTask.question_count }}
          </a-descriptions-item>
          <a-descriptions-item label="创建时间">
            {{ formatDateTime(selectedTask.created_time) }}
          </a-descriptions-item>
        </a-descriptions>
        <div class="qg-section-title">任务进度</div>
        <a-progress :percent="Math.round((selectedTask.progress || 0) * 100)" />
        <div v-if="selectedTask.error_message" class="qg-error-box">
          {{ selectedTask.error_message }}
        </div>

        <a-tabs class="qg-detail-tabs">
          <a-tab-pane key="visual" tab="流程概览">
            <div class="qg-stat-grid">
              <div
                v-for="item in taskVisualStats"
                :key="item.label"
                class="qg-stat-item"
              >
                <div class="qg-stat-value">{{ item.value }}</div>
                <div class="qg-muted">{{ item.label }}</div>
              </div>
            </div>

            <div class="qg-usage-grid">
              <div>
                <span class="qg-meta-label">总耗时</span>
                <strong>{{
                  formatDurationMs(
                    selectedTaskUsageSummary.wall_duration_ms ||
                      selectedTaskUsageSummary.duration_ms,
                  )
                }}</strong>
              </div>
              <div>
                <span class="qg-meta-label">LLM 耗时</span>
                <strong>{{
                  formatDurationMs(selectedTaskUsageSummary.llm_duration_ms)
                }}</strong>
              </div>
              <div>
                <span class="qg-meta-label">输入 Token</span>
                <strong>{{
                  formatUnknown(selectedTaskUsageSummary.tokens_in)
                }}</strong>
              </div>
              <div>
                <span class="qg-meta-label">输出 Token</span>
                <strong>{{
                  formatUnknown(selectedTaskUsageSummary.tokens_out)
                }}</strong>
              </div>
              <div>
                <span class="qg-meta-label">总 Token</span>
                <strong>{{
                  formatUnknown(selectedTaskUsageSummary.tokens_total)
                }}</strong>
              </div>
            </div>

            <div class="qg-section-title">执行流程</div>
            <div class="qg-stage-list">
              <div
                v-for="stage in taskStageOptions"
                :key="stage.value"
                class="qg-stage-item"
                :class="`is-${getTaskStageState(stage.value)}`"
              >
                <span class="qg-stage-dot"></span>
                <div class="qg-stage-main">
                  <div class="qg-stage-title">{{ stage.label }}</div>
                  <div class="qg-muted">
                    {{ getTaskStageStateLabel(stage.value) }}
                  </div>
                </div>
              </div>
            </div>

            <div class="qg-section-title">命题片段</div>
            <a-empty
              v-if="selectedTaskPassages.length === 0"
              description="暂无命题片段"
            />
            <div v-else class="qg-visual-list">
              <div
                v-for="passage in selectedTaskPassages"
                :key="String(passage.passage_id || passage.selected_passage)"
                class="qg-visual-item"
              >
                <div class="qg-visual-head">
                  <div>
                    <a-tag color="blue">
                      {{ formatUnknown(passage.passage_id) }}
                    </a-tag>
                    <a-tag v-if="passage.selected_passage_length">
                      {{ passage.selected_passage_length }} 字
                    </a-tag>
                  </div>
                  <div class="qg-muted">
                    置信度 {{ formatConfidence(passage.confidence) }}
                  </div>
                </div>
                <div class="qg-text-block">
                  {{ formatUnknown(passage.selected_passage) }}
                </div>
                <div class="qg-meta-grid">
                  <div>
                    <span class="qg-meta-label">推荐题型</span>
                    <span>{{
                      formatUnknown(
                        passage.recommended_types ||
                          passage.auto_selected_question_types,
                      )
                    }}</span>
                  </div>
                  <div>
                    <span class="qg-meta-label">文段结构</span>
                    <span>{{ formatUnknown(passage.structure) }}</span>
                  </div>
                  <div>
                    <span class="qg-meta-label">核心落点</span>
                    <span>{{ formatUnknown(passage.core_focus) }}</span>
                  </div>
                  <div>
                    <span class="qg-meta-label">选段理由</span>
                    <span>{{
                      formatUnknown(passage.selected_passage_reason)
                    }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="qg-section-title">题型机会</div>
            <a-empty
              v-if="selectedTaskTypeOpportunities.length === 0"
              description="暂无题型机会"
            />
            <div v-else class="qg-compact-list">
              <div
                v-for="item in selectedTaskTypeOpportunities"
                :key="`${item.passage_id}-${item.question_type}-${item.question_subtype}`"
                class="qg-compact-item"
              >
                <div class="qg-visual-head">
                  <div>
                    <a-tag color="blue">
                      {{ formatUnknown(item.passage_id) }}
                    </a-tag>
                    <a-tag color="purple">
                      {{ formatUnknown(item.question_type) }}
                    </a-tag>
                    <a-tag v-if="item.question_subtype">
                      {{ formatUnknown(item.question_subtype) }}
                    </a-tag>
                  </div>
                  <div class="qg-muted">
                    置信度 {{ formatConfidence(item.confidence) }}
                  </div>
                </div>
                <div class="qg-meta-grid">
                  <div>
                    <span class="qg-meta-label">题眼</span>
                    <span>{{ formatUnknown(item.anchor) }}</span>
                  </div>
                  <div>
                    <span class="qg-meta-label">适配理由</span>
                    <span>{{ formatUnknown(item.suitability_reason) }}</span>
                  </div>
                  <div>
                    <span class="qg-meta-label">干扰空间</span>
                    <span>{{ formatUnknown(item.distractor_space) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="qg-section-title">命题蓝图</div>
            <a-empty
              v-if="selectedTaskBlueprints.length === 0"
              description="暂无命题蓝图"
            />
            <div v-else class="qg-compact-list">
              <div
                v-for="blueprint in selectedTaskBlueprints"
                :key="`${blueprint.passage_id}-${blueprint.question_type}-${blueprint.target_focus}`"
                class="qg-compact-item"
              >
                <div class="qg-visual-head">
                  <div>
                    <a-tag color="blue">
                      {{ formatUnknown(blueprint.passage_id) }}
                    </a-tag>
                    <a-tag color="geekblue">
                      {{ formatUnknown(blueprint.question_type) }}
                    </a-tag>
                  </div>
                </div>
                <div class="qg-meta-grid">
                  <div>
                    <span class="qg-meta-label">考查落点</span>
                    <span>{{ formatUnknown(blueprint.target_focus) }}</span>
                  </div>
                  <div>
                    <span class="qg-meta-label">正确项策略</span>
                    <span>{{ formatUnknown(blueprint.correct_strategy) }}</span>
                  </div>
                  <div>
                    <span class="qg-meta-label">干扰项策略</span>
                    <span>{{
                      formatUnknown(blueprint.distractor_strategies)
                    }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="qg-section-title">AI 质检与舍弃记录</div>
            <a-collapse ghost>
              <a-collapse-panel
                key="passage_reviews"
                :header="`片段质检 ${selectedTaskPassageReviews.length}`"
              >
                <a-empty
                  v-if="selectedTaskPassageReviews.length === 0"
                  description="暂无片段质检记录"
                />
                <div v-else class="qg-review-list">
                  <div
                    v-for="item in selectedTaskPassageReviews"
                    :key="`${item.passage_id}-${item.decision}-${item.reason}`"
                    class="qg-review-item"
                  >
                    <a-tag :color="getReviewDecisionColor(item.decision)">
                      {{ formatUnknown(item.decision) }}
                    </a-tag>
                    <span>{{ formatUnknown(item.passage_id) }}</span>
                    <span class="qg-muted">{{
                      formatUnknown(item.reason)
                    }}</span>
                  </div>
                </div>
              </a-collapse-panel>
              <a-collapse-panel
                key="type_reviews"
                :header="`题型质检 ${selectedTaskTypeReviews.length}`"
              >
                <a-empty
                  v-if="selectedTaskTypeReviews.length === 0"
                  description="暂无题型质检记录"
                />
                <div v-else class="qg-review-list">
                  <div
                    v-for="item in selectedTaskTypeReviews"
                    :key="`${item.passage_id}-${item.question_type}-${item.decision}`"
                    class="qg-review-item"
                  >
                    <a-tag :color="getReviewDecisionColor(item.decision)">
                      {{ formatUnknown(item.decision) }}
                    </a-tag>
                    <span>{{ formatUnknown(item.passage_id) }}</span>
                    <span>{{ formatUnknown(item.question_type) }}</span>
                    <span class="qg-muted">{{
                      formatUnknown(item.reason)
                    }}</span>
                  </div>
                </div>
              </a-collapse-panel>
              <a-collapse-panel
                key="question_reviews"
                :header="`成题质检 ${selectedTaskQuestionReviews.length}`"
              >
                <a-empty
                  v-if="selectedTaskQuestionReviews.length === 0"
                  description="暂无成题质检记录"
                />
                <div v-else class="qg-review-list">
                  <div
                    v-for="item in selectedTaskQuestionReviews"
                    :key="`${item.candidate_index}-${item.passage_id}-${item.decision}`"
                    class="qg-review-item"
                  >
                    <a-tag :color="getReviewDecisionColor(item.decision)">
                      {{ formatUnknown(item.decision) }}
                    </a-tag>
                    <span>#{{ formatUnknown(item.candidate_index) }}</span>
                    <span>{{ formatUnknown(item.passage_id) }}</span>
                    <span class="qg-muted">{{
                      formatUnknown(item.reason)
                    }}</span>
                  </div>
                </div>
              </a-collapse-panel>
              <a-collapse-panel
                key="discarded"
                :header="`舍弃记录 ${selectedTaskDiscardedPassages.length + selectedTaskDiscardedCandidates.length}`"
              >
                <div class="qg-review-list">
                  <div
                    v-for="item in selectedTaskDiscardedPassages"
                    :key="`passage-${item.passage_id}-${item.discard_reason}`"
                    class="qg-review-item"
                  >
                    <a-tag color="red">片段</a-tag>
                    <span>{{ formatUnknown(item.passage_id) }}</span>
                    <span class="qg-muted">
                      {{
                        formatUnknown(
                          item.discard_reason || item.review_decision,
                        )
                      }}
                    </span>
                  </div>
                  <div
                    v-for="item in selectedTaskDiscardedCandidates"
                    :key="`candidate-${item.passage_id}-${item.question_type}`"
                    class="qg-review-item"
                  >
                    <a-tag color="red">候选题</a-tag>
                    <span>{{ formatUnknown(item.passage_id) }}</span>
                    <span>{{ formatUnknown(item.question_type) }}</span>
                    <span class="qg-muted">
                      {{
                        formatUnknown(
                          item.discard_reason || item.review_decision,
                        )
                      }}
                    </span>
                  </div>
                </div>
              </a-collapse-panel>
            </a-collapse>
          </a-tab-pane>

          <a-tab-pane key="raw" tab="原始数据">
            <div class="qg-section-title">输入参数</div>
            <a-textarea
              class="qg-json-view"
              :rows="8"
              readonly
              :value="formatJson(selectedTask.input_payload)"
            />
            <div class="qg-section-title">状态快照</div>
            <a-textarea
              class="qg-json-view"
              :rows="12"
              readonly
              :value="formatJson(selectedTask.state_snapshot)"
            />
            <div class="qg-section-title">结果摘要</div>
            <a-textarea
              class="qg-json-view"
              :rows="8"
              readonly
              :value="formatJson(selectedTask.result_summary)"
            />
          </a-tab-pane>
        </a-tabs>
      </template>
    </a-drawer>

    <a-drawer
      v-model:open="candidateDrawerOpen"
      destroy-on-close
      placement="right"
      title="候选题审核"
      width="860px"
    >
      <template v-if="selectedCandidate">
        <div class="qg-candidate-head">
          <div>
            <a-tag
              :color="
                findMeta(candidateStatusOptions, selectedCandidate.status)
                  ?.color
              "
            >
              {{
                findMeta(candidateStatusOptions, selectedCandidate.status)
                  ?.label ?? selectedCandidate.status
              }}
            </a-tag>
            <a-tag color="blue">{{ selectedCandidate.question_type }}</a-tag>
            <a-tag v-if="selectedCandidate.question_subtype">
              {{ selectedCandidate.question_subtype }}
            </a-tag>
          </div>
          <div class="qg-muted">
            候选题 #{{ selectedCandidate.id }} · 任务 #{{
              selectedCandidate.task_id
            }}
          </div>
        </div>

        <div class="qg-section-title">命题依据片段</div>
        <div class="qg-muted">
          片段 {{ selectedCandidate.passage_id || '-' }}
        </div>
        <div class="qg-text-block">
          {{ getCandidatePassage(selectedCandidate) || '-' }}
        </div>

        <div class="qg-section-title">片段元信息</div>
        <a-textarea
          class="qg-json-view"
          :rows="7"
          readonly
          :value="formatJson(selectedCandidate.passage_meta)"
        />

        <div class="qg-section-title">题干</div>
        <div class="qg-text-block">
          {{ getCandidateFullStem(selectedCandidate) }}
        </div>

        <div class="qg-section-title">选项</div>
        <div class="qg-option-list">
          <div
            v-for="(option, index) in selectedCandidate.options"
            :key="index"
            class="qg-option-item"
          >
            <span class="qg-option-label">{{
              getOptionLabel(option, index)
            }}</span>
            <span>{{ getOptionContent(option) }}</span>
          </div>
        </div>

        <div class="qg-section-title">答案</div>
        <a-textarea
          class="qg-json-view"
          :rows="4"
          readonly
          :value="formatJson(selectedCandidate.answer_data)"
        />

        <div class="qg-section-title">解析</div>
        <div class="qg-text-block">{{ selectedCandidate.analysis }}</div>

        <div class="qg-section-title">命题蓝图</div>
        <a-textarea
          class="qg-json-view"
          :rows="10"
          readonly
          :value="formatJson(selectedCandidate.blueprint)"
        />

        <div class="qg-section-title">质检结果</div>
        <a-textarea
          class="qg-json-view"
          :rows="10"
          readonly
          :value="formatJson(selectedCandidate.qc_result)"
        />

        <div class="qg-review-box">
          <a-textarea
            v-model:value="reviewReason"
            :rows="3"
            placeholder="审核意见，可选；驳回时建议填写原因"
          />
          <div class="qg-review-actions">
            <a-button
              :loading="candidateReviewing"
              type="primary"
              @click="reviewCandidate(selectedCandidate, 'approved')"
            >
              审核通过
            </a-button>
            <a-button
              danger
              :loading="candidateReviewing"
              @click="reviewCandidate(selectedCandidate, 'rejected')"
            >
              驳回
            </a-button>
          </div>
        </div>
      </template>
    </a-drawer>
  </Page>
</template>

<style scoped>
.qg-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qg-header {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #fff;
  border: 1px solid #eef0f4;
  border-radius: 8px;
}

.qg-title {
  font-size: 18px;
  font-weight: 650;
  color: #1f2937;
}

.qg-subtitle {
  margin-top: 4px;
  color: #6b7280;
}

.qg-header-actions,
.qg-toolbar,
.qg-review-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.qg-tabs {
  padding: 0 16px 16px;
  background: #fff;
  border: 1px solid #eef0f4;
  border-radius: 8px;
}

.qg-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qg-toolbar {
  justify-content: flex-start;
  padding: 4px 0 12px;
}

.qg-link-title {
  max-width: 260px;
  height: auto;
  padding: 0;
  text-align: left;
  white-space: normal;
}

.qg-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.qg-section-title {
  margin: 18px 0 8px;
  font-size: 15px;
  font-weight: 650;
  color: #1f2937;
}

.qg-text-block {
  padding: 12px;
  line-height: 1.75;
  color: #1f2937;
  white-space: pre-wrap;
  background: #fafafa;
  border: 1px solid #eef0f4;
  border-radius: 6px;
}

.qg-detail-tip {
  margin-top: 16px;
}

.qg-detail-tabs {
  margin-top: 16px;
}

.qg-json-view {
  font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 12px;
}

.qg-error-text {
  color: #cf1322;
}

.qg-error-box {
  padding: 10px 12px;
  margin-top: 12px;
  color: #a8071a;
  background: #fff1f0;
  border: 1px solid #ffccc7;
  border-radius: 6px;
}

.qg-candidate-head {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.qg-muted {
  color: #6b7280;
}

.qg-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.qg-stat-item {
  padding: 12px;
  background: #fafafa;
  border: 1px solid #eef0f4;
  border-radius: 6px;
}

.qg-stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
}

.qg-usage-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;
}

.qg-usage-grid > div {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px solid #eef0f4;
  border-radius: 6px;
}

.qg-usage-grid strong {
  font-size: 15px;
  color: #111827;
}

.qg-stage-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.qg-stage-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  min-height: 58px;
  padding: 10px 12px;
  background: #fafafa;
  border: 1px solid #eef0f4;
  border-radius: 6px;
}

.qg-stage-dot {
  flex: 0 0 auto;
  width: 10px;
  height: 10px;
  margin-top: 5px;
  background: #d1d5db;
  border-radius: 50%;
}

.qg-stage-item.is-done .qg-stage-dot {
  background: #52c41a;
}

.qg-stage-item.is-active {
  border-color: #91caff;
}

.qg-stage-item.is-active .qg-stage-dot {
  background: #1677ff;
}

.qg-stage-item.is-failed {
  background: #fff1f0;
  border-color: #ffccc7;
}

.qg-stage-item.is-failed .qg-stage-dot {
  background: #ff4d4f;
}

.qg-stage-title {
  font-weight: 650;
  color: #1f2937;
}

.qg-stage-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.qg-visual-list,
.qg-compact-list,
.qg-review-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.qg-visual-item,
.qg-compact-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: #fff;
  border: 1px solid #eef0f4;
  border-radius: 6px;
}

.qg-visual-head {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.qg-meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 14px;
  font-size: 13px;
}

.qg-meta-grid > div {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.qg-meta-label {
  color: #6b7280;
}

.qg-review-item {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 8px 10px;
  background: #fafafa;
  border: 1px solid #eef0f4;
  border-radius: 6px;
}

.qg-option-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qg-option-item {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 8px;
  align-items: start;
  padding: 10px 12px;
  background: #fafafa;
  border: 1px solid #eef0f4;
  border-radius: 6px;
}

.qg-option-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-weight: 650;
  color: #0958d9;
  background: #e6f4ff;
  border-radius: 50%;
}

.qg-review-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 18px;
  margin-top: 18px;
  border-top: 1px solid #eef0f4;
}

.qg-review-actions {
  justify-content: flex-end;
}

.qg-start-summary {
  margin-top: 16px;
}

@media (max-width: 768px) {
  .qg-header,
  .qg-candidate-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .qg-form-grid {
    grid-template-columns: 1fr;
  }

  .qg-stat-grid,
  .qg-usage-grid,
  .qg-stage-list,
  .qg-meta-grid {
    grid-template-columns: 1fr;
  }
}
</style>
