<script lang="ts" setup>
import type { CloudLinkItem, PracticeSourceFormState } from '../common';

import type {
  CreateStudyPlanItemParams,
  StudyPlanAbilityCatalogItem,
  StudyPlanDetail,
  StudyPlanItemDetail,
  StudyPlanProgress,
  UpdateStudyPlanParams,
} from '#/api/study-plan';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import {
  createBlankStudyPlanApi,
  createStudyPlanFromTemplateApi,
  createStudyPlanItemApi,
  deleteStudyPlanItemApi,
  getMentorStudyPlanItemsApi,
  getMentorStudyPlanProgressApi,
  getMentorStudyPlansApi,
  getStudyPlanAbilityCatalogApi,
  getStudyPlanTemplatesApi,
  updateStudyPlanApi,
  updateStudyPlanItemApi,
} from '#/api/study-plan';

import {
  buildModuleExtra,
  createDefaultPracticeSourceFields,
  findOption,
  formatAccuracy,
  formatDurationSeconds,
  formatModuleTarget,
  itemStatusOptions,
  moduleOptions,
  planStatusOptions,
  refTypeOptions,
  resolvePracticeSourceRefId,
  splitAbilityTargetExtra,
  splitPracticeTargetExtra,
  splitResourceTargetExtra,
  stringifyJson,
  validatePracticeSourceForm,
} from '../common';
import AbilityParamFields from '../components/AbilityParamFields.vue';
import CloudLinksEditor from '../components/CloudLinksEditor.vue';
import ContentRefPicker from '../components/ContentRefPicker.vue';
import PracticeSourceBuilder from '../components/PracticeSourceBuilder.vue';

interface PlanForm {
  domain: string;
  end_date: string;
  id?: number;
  start_date: string;
  status?: StudyPlanDetail['status'];
  template_id?: null | number;
  title: string;
  user_id?: null | number;
}

interface ItemForm extends PracticeSourceFormState {
  ability_key?: string;
  ability_params: Record<string, unknown>;
  ability_title?: string;
  ability_url?: string;
  cloud_links: CloudLinkItem[];
  expected_minutes: number;
  extra_json: string;
  id?: number;
  module_type: CreateStudyPlanItemParams['module_type'];
  order_index: number;
  plan_date: string;
  ref_id?: null | number;
  ref_type: CreateStudyPlanItemParams['ref_type'];
  status?: StudyPlanItemDetail['status'];
  title: string;
}

interface TemplateOption {
  label: string;
  value: number;
}

const today = new Date().toISOString().slice(0, 10);
const studentId = ref<null | number>(null);
const plans = ref<StudyPlanDetail[]>([]);
const progressMap = ref<Record<number, StudyPlanProgress>>({});
const planLoading = ref(false);

const selectedPlan = ref<null | StudyPlanDetail>(null);
const items = ref<StudyPlanItemDetail[]>([]);
const itemLoading = ref(false);
const itemDrawerOpen = ref(false);

const planModalMode = ref<'create' | 'edit'>('create');
const planModalOpen = ref(false);
const planCreateMode = ref<'blank' | 'template'>('template');
const planSubmitting = ref(false);
const templateOptions = ref<TemplateOption[]>([]);

const itemModalOpen = ref(false);
const itemSubmitting = ref(false);
const abilityCatalog = ref<StudyPlanAbilityCatalogItem[]>([]);

const planForm = reactive<PlanForm>({
  domain: 'civil_service',
  end_date: today,
  start_date: today,
  template_id: null,
  title: '',
  user_id: null,
});

const itemForm = reactive<ItemForm>({
  ability_key: '',
  ability_params: {},
  ability_title: '',
  ability_url: '',
  cloud_links: [],
  ...createDefaultPracticeSourceFields(),
  expected_minutes: 15,
  extra_json: '',
  module_type: 'review',
  order_index: 0,
  plan_date: today,
  ref_id: null,
  ref_type: 'content',
  target_accuracy_percent: null,
  target_question_count: null,
  title: '',
});

const planColumns: any[] = [
  { dataIndex: 'id', title: 'ID', width: 80 },
  { dataIndex: 'title', title: '计划标题', width: 240 },
  { dataIndex: 'user_id', title: '学员 ID', width: 100 },
  { dataIndex: 'date_range', title: '日期范围', width: 210 },
  { dataIndex: 'status', title: '状态', width: 100 },
  { dataIndex: 'progress', title: '完成进度', width: 140 },
  { dataIndex: 'template_id', title: '模板 ID', width: 100 },
  { dataIndex: 'created_time', title: '创建时间', width: 180 },
  {
    dataIndex: 'operation',
    fixed: 'right' as const,
    title: '操作',
    width: 120,
  },
];

const itemColumns: any[] = [
  { dataIndex: 'id', title: 'ID', width: 80 },
  { dataIndex: 'plan_date', title: '日期', width: 120 },
  { dataIndex: 'order_index', title: '顺序', width: 80 },
  { dataIndex: 'module_type', title: '模块', width: 110 },
  { dataIndex: 'title', title: '标题', width: 260 },
  { dataIndex: 'ref', title: '引用', width: 170 },
  { dataIndex: 'expected_minutes', title: '预计分钟', width: 100 },
  { dataIndex: 'target', title: '目标', width: 150 },
  { dataIndex: 'actual_duration', title: '实际耗时', width: 120 },
  { dataIndex: 'accuracy', title: '正确率', width: 150 },
  { dataIndex: 'status', title: '状态', width: 100 },
  {
    dataIndex: 'operation',
    fixed: 'right' as const,
    title: '操作',
    width: 150,
  },
];

const selectedProgress = computed(() => {
  if (!selectedPlan.value) {
    return null;
  }

  return progressMap.value[selectedPlan.value.id] ?? null;
});

const planModalTitle = computed(() => {
  if (planModalMode.value === 'edit') {
    return '编辑计划';
  }
  return planCreateMode.value === 'template'
    ? '基于模板创建计划'
    : '创建空计划';
});

const isPracticeItemForm = computed(() => itemForm.module_type === 'practice');
const isAbilityItemForm = computed(() => itemForm.module_type === 'ability');
const isResourceItemForm = computed(() => itemForm.module_type === 'resource');

const abilityOptions = computed(() =>
  abilityCatalog.value
    .filter((item) => item.supports_study_plan)
    .map((item) => ({
      label: `${item.title} · ${item.category}`,
      value: item.key,
    })),
);

function resetPlanForm() {
  planForm.domain = 'civil_service';
  planForm.end_date = today;
  planForm.id = undefined;
  planForm.start_date = today;
  planForm.status = undefined;
  planForm.template_id = templateOptions.value[0]?.value ?? null;
  planForm.title = '';
  planForm.user_id = studentId.value;
}

function resetItemForm(plan?: StudyPlanDetail) {
  itemForm.ability_key = '';
  itemForm.ability_params = {};
  itemForm.ability_title = '';
  itemForm.ability_url = '';
  itemForm.cloud_links = [];
  Object.assign(itemForm, createDefaultPracticeSourceFields());
  itemForm.expected_minutes = 15;
  itemForm.extra_json = '';
  itemForm.id = undefined;
  itemForm.module_type = 'review';
  itemForm.order_index = items.value.length;
  itemForm.plan_date = plan?.start_date ?? today;
  itemForm.ref_id = null;
  itemForm.ref_type = 'content';
  itemForm.status = undefined;
  itemForm.title = '';
}

async function loadTemplates() {
  const templates = await getStudyPlanTemplatesApi();
  templateOptions.value = templates.map((item) => ({
    label: `${item.id} · ${item.name}（${item.duration_days} 天）`,
    value: item.id,
  }));
}

async function loadAbilityCatalog() {
  abilityCatalog.value = await getStudyPlanAbilityCatalogApi('civil_service');
}

async function queryPlans() {
  if (!studentId.value) {
    message.warning('请先输入学员 ID');
    return;
  }

  planLoading.value = true;
  try {
    const data = await getMentorStudyPlansApi(studentId.value);
    plans.value = data;
    const progressPairs = await Promise.all(
      data.map(async (plan) => {
        try {
          return [
            plan.id,
            await getMentorStudyPlanProgressApi(plan.id),
          ] as const;
        } catch {
          return [plan.id, { completed: 0, percent: 0, total: 0 }] as const;
        }
      }),
    );
    progressMap.value = Object.fromEntries(progressPairs);
  } finally {
    planLoading.value = false;
  }
}

function openCreatePlan(mode: 'blank' | 'template') {
  planModalMode.value = 'create';
  planCreateMode.value = mode;
  resetPlanForm();
  planModalOpen.value = true;
}

function openEditPlan(plan: Record<string, unknown> | StudyPlanDetail) {
  const targetPlan = plan as StudyPlanDetail;
  planModalMode.value = 'edit';
  planForm.domain = targetPlan.domain;
  planForm.end_date = targetPlan.end_date;
  planForm.id = targetPlan.id;
  planForm.start_date = targetPlan.start_date;
  planForm.status = targetPlan.status;
  planForm.template_id = targetPlan.template_id ?? null;
  planForm.title = targetPlan.title;
  planForm.user_id = targetPlan.user_id;
  planModalOpen.value = true;
}

async function submitPlan() {
  if (planForm.end_date < planForm.start_date) {
    message.warning('结束日期不能早于起始日期');
    return;
  }
  if (!planForm.user_id) {
    message.warning('请填写学员 ID');
    return;
  }
  if (!planForm.title.trim()) {
    message.warning('请填写计划标题');
    return;
  }

  planSubmitting.value = true;
  try {
    if (planModalMode.value === 'edit') {
      if (!planForm.id) {
        message.warning('缺少计划 ID');
        return;
      }

      const payload: UpdateStudyPlanParams = {
        end_date: planForm.end_date,
        start_date: planForm.start_date,
        status: planForm.status,
        title: planForm.title.trim(),
      };
      await updateStudyPlanApi(planForm.id, payload);
      message.success('计划已更新');
      planModalOpen.value = false;
      studentId.value = planForm.user_id;
      await queryPlans();
      return;
    }

    if (planCreateMode.value === 'template') {
      if (!planForm.template_id) {
        message.warning('请选择模板');
        return;
      }

      await createStudyPlanFromTemplateApi({
        start_date: planForm.start_date,
        template_id: planForm.template_id,
        title: planForm.title.trim(),
        user_id: planForm.user_id,
      });
    } else {
      await createBlankStudyPlanApi({
        domain: planForm.domain,
        end_date: planForm.end_date,
        start_date: planForm.start_date,
        template_id: planForm.template_id ?? null,
        title: planForm.title.trim(),
        user_id: planForm.user_id,
      });
    }

    message.success('计划创建成功');
    planModalOpen.value = false;
    studentId.value = planForm.user_id;
    await queryPlans();
  } finally {
    planSubmitting.value = false;
  }
}

async function openItems(plan: Record<string, unknown> | StudyPlanDetail) {
  const targetPlan = plan as StudyPlanDetail;
  selectedPlan.value = targetPlan;
  itemDrawerOpen.value = true;
  itemLoading.value = true;
  try {
    const [itemList, progress] = await Promise.all([
      getMentorStudyPlanItemsApi(targetPlan.id),
      getMentorStudyPlanProgressApi(targetPlan.id),
    ]);
    items.value = itemList;
    progressMap.value = { ...progressMap.value, [targetPlan.id]: progress };
  } finally {
    itemLoading.value = false;
  }
}

function openCreateItem() {
  if (!selectedPlan.value) {
    return;
  }

  resetItemForm(selectedPlan.value);
  itemModalOpen.value = true;
}

function openEditItem(item: Record<string, unknown> | StudyPlanItemDetail) {
  const targetItem = item as StudyPlanItemDetail;
  const moduleTarget = resolveModuleTarget(
    targetItem.module_type,
    targetItem.extra ?? null,
    targetItem.ref_id ?? null,
  );
  Object.assign(itemForm, createDefaultPracticeSourceFields());
  if (targetItem.module_type === 'practice') {
    Object.assign(itemForm, moduleTarget);
  }
  itemForm.ability_key = moduleTarget.abilityKey;
  itemForm.ability_params = moduleTarget.abilityParams ?? {};
  itemForm.ability_title = moduleTarget.abilityTitle;
  itemForm.ability_url = moduleTarget.abilityUrl;
  itemForm.cloud_links = moduleTarget.cloudLinks ?? [];
  itemForm.expected_minutes = targetItem.expected_minutes;
  itemForm.extra_json = moduleTarget.extraJson;
  itemForm.id = targetItem.id;
  itemForm.module_type = targetItem.module_type;
  itemForm.order_index = targetItem.order_index;
  itemForm.plan_date = targetItem.plan_date;
  itemForm.ref_id = targetItem.ref_id ?? null;
  itemForm.ref_type = targetItem.ref_type;
  itemForm.status = targetItem.status;
  itemForm.target_accuracy_percent = moduleTarget.accuracyPercent;
  itemForm.target_question_count = moduleTarget.questionCount;
  itemForm.title = targetItem.title;
  itemModalOpen.value = true;
}

function resolveModuleTarget(
  moduleType: CreateStudyPlanItemParams['module_type'],
  extra?: null | Record<string, unknown>,
  refId?: null | number,
) {
  if (moduleType === 'practice') {
    return {
      ...splitPracticeTargetExtra(extra, refId),
      abilityKey: '',
      abilityParams: {} as Record<string, unknown>,
      abilityTitle: '',
      abilityUrl: '',
      cloudLinks: [] as CloudLinkItem[],
    };
  }

  if (moduleType === 'ability') {
    const abilityKey =
      typeof extra?.ability_key === 'string' ? extra.ability_key : '';
    const catalog = findAbilityCatalogItem(abilityKey);
    const knownParamNames = catalog?.param_schema
      ? Object.keys(catalog.param_schema)
      : [];
    return {
      ...splitAbilityTargetExtra(extra, knownParamNames),
      cloudLinks: [] as CloudLinkItem[],
    };
  }

  if (moduleType === 'resource') {
    const resourceTarget = splitResourceTargetExtra(extra);
    return {
      abilityKey: '',
      abilityParams: {} as Record<string, unknown>,
      abilityTitle: '',
      abilityUrl: '',
      accuracyPercent: null,
      cloudLinks: resourceTarget.cloudLinks,
      extraJson: resourceTarget.extraJson,
      questionCount: null,
    };
  }

  return {
    abilityKey: '',
    abilityParams: {} as Record<string, unknown>,
    abilityTitle: '',
    abilityUrl: '',
    accuracyPercent: null,
    cloudLinks: [] as CloudLinkItem[],
    extraJson: stringifyJson(extra ?? null),
    questionCount: null,
  };
}

function findAbilityCatalogItem(key?: null | string) {
  if (!key) {
    return null;
  }

  return abilityCatalog.value.find((item) => item.key === key) ?? null;
}

function applyAbilityCatalogDefaults(key?: null | string) {
  const ability = findAbilityCatalogItem(key);
  if (!ability) {
    itemForm.ability_title = '';
    itemForm.ability_url = '';
    itemForm.ability_params = {};
    return;
  }

  itemForm.ability_key = ability.key;
  itemForm.ability_title = ability.title;
  itemForm.ability_url = ability.url;
  itemForm.expected_minutes = ability.default_minutes;
  itemForm.target_question_count = ability.default_question_count ?? null;
  itemForm.target_accuracy_percent =
    ability.default_accuracy === null || ability.default_accuracy === undefined
      ? null
      : Math.round(ability.default_accuracy * 1000) / 10;
  itemForm.ability_params = {};
  if (!itemForm.title.trim()) {
    itemForm.title = ability.title;
  }
}

function handleAbilityCatalogChange(value: unknown) {
  applyAbilityCatalogDefaults(typeof value === 'string' ? value : '');
}

function applyItemModuleDefaults() {
  if (itemForm.module_type === 'practice') {
    itemForm.ref_type = 'question_set';
    itemForm.target_accuracy_percent ??= 60;
    itemForm.target_question_count ??= 20;
    return;
  }

  if (itemForm.module_type === 'wrong_review') {
    itemForm.ref_type = 'wrong_dynamic';
    itemForm.ref_id = null;
    return;
  }

  if (itemForm.module_type === 'ability') {
    itemForm.ref_type = 'ability_task';
    itemForm.ref_id = null;
    itemForm.ability_key ||= abilityOptions.value[0]?.value ?? '';
    applyAbilityCatalogDefaults(itemForm.ability_key);
    return;
  }

  if (itemForm.module_type === 'resource') {
    itemForm.ref_type = 'content';
    itemForm.ref_id = null;
    if (!Array.isArray(itemForm.cloud_links)) {
      itemForm.cloud_links = [];
    }
    return;
  }

  itemForm.ref_type = 'content';
}

function buildItemPayload(): CreateStudyPlanItemParams {
  if (!selectedPlan.value) {
    throw new Error('请先选择计划');
  }
  if (!itemForm.title.trim()) {
    throw new Error('请填写模块标题');
  }
  if (itemForm.module_type === 'ability' && !itemForm.ability_url) {
    throw new Error('请选择能力练习');
  }
  if (itemForm.module_type === 'practice') {
    validatePracticeSourceForm(itemForm);
  }
  if (itemForm.module_type === 'resource') {
    if (itemForm.cloud_links.length === 0) {
      throw new Error('请至少添加一条网盘链接');
    }
    itemForm.cloud_links.forEach((link, idx) => {
      if (!link.title.trim()) {
        throw new Error(`第 ${idx + 1} 条链接缺少标题`);
      }
      if (!link.url.trim()) {
        throw new Error(`第 ${idx + 1} 条链接缺少 URL`);
      }
      try {
        const parsed = new URL(link.url.trim());
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          throw new Error('protocol');
        }
      } catch {
        throw new Error(
          `第 ${idx + 1} 条链接 URL 必须以 http:// 或 https:// 开头`,
        );
      }
    });
  }

  const refId =
    itemForm.module_type === 'practice'
      ? resolvePracticeSourceRefId(itemForm)
      : (itemForm.ref_id ?? null);

  return {
    expected_minutes: itemForm.expected_minutes,
    extra: buildModuleExtra(itemForm.module_type, itemForm.extra_json, {
      abilityKey: itemForm.ability_key,
      abilityParams: itemForm.ability_params,
      abilityTitle: itemForm.ability_title,
      abilityUrl: itemForm.ability_url,
      accuracyPercent: itemForm.target_accuracy_percent,
      cloudLinks: itemForm.cloud_links,
      practiceBankLabel: itemForm.practice_bank_label,
      practiceChapterId: itemForm.practice_chapter_id,
      practiceChapterLabel: itemForm.practice_chapter_label,
      practiceKnowledgePoints: itemForm.practice_knowledge_points,
      practiceQuestionIdsText: itemForm.practice_question_ids_text,
      practiceQuestionTypes: itemForm.practice_question_types,
      practiceRegion: itemForm.practice_region,
      practiceShuffle: itemForm.practice_shuffle,
      practiceSourceMode: itemForm.practice_source_mode,
      practiceTimeLimit: itemForm.practice_time_limit,
      practiceYearEnd: itemForm.practice_year_end,
      practiceYearStart: itemForm.practice_year_start,
      questionCount: itemForm.target_question_count,
    }),
    module_type: itemForm.module_type,
    order_index: itemForm.order_index,
    plan_date: itemForm.plan_date,
    plan_id: selectedPlan.value.id,
    ref_id: refId,
    ref_type:
      itemForm.module_type === 'practice' ? 'question_set' : itemForm.ref_type,
    title: itemForm.title.trim(),
  };
}

async function submitItem() {
  itemSubmitting.value = true;
  try {
    const payload = buildItemPayload();
    if (itemForm.id) {
      await updateStudyPlanItemApi(itemForm.id, {
        ...payload,
        status: itemForm.status,
      });
    } else {
      await createStudyPlanItemApi(payload);
    }

    message.success('计划项已保存');
    itemModalOpen.value = false;
    if (selectedPlan.value) {
      await openItems(selectedPlan.value);
      await queryPlans();
    }
  } catch (error: any) {
    message.warning(error?.message || '计划项保存失败');
  } finally {
    itemSubmitting.value = false;
  }
}

async function deleteItem(item: Record<string, unknown> | StudyPlanItemDetail) {
  const targetItem = item as StudyPlanItemDetail;
  await deleteStudyPlanItemApi(targetItem.id);
  message.success('计划项已删除');
  if (selectedPlan.value) {
    await openItems(selectedPlan.value);
    await queryPlans();
  }
}

function formatDateTime(value?: string) {
  return value ? value.replace('T', ' ').slice(0, 19) : '-';
}

onMounted(() => {
  void loadTemplates();
  void loadAbilityCatalog();
});
</script>

<template>
  <Page auto-content-height>
    <div class="study-plan-page">
      <a-card size="small">
        <div class="toolbar">
          <a-input-number
            v-model:value="studentId"
            :min="1"
            placeholder="学员用户 ID"
            style="width: 180px"
            @press-enter="queryPlans"
          />
          <a-button :loading="planLoading" type="primary" @click="queryPlans">
            查询计划
          </a-button>
          <a-button @click="openCreatePlan('template')">
            基于模板创建
          </a-button>
          <a-button @click="openCreatePlan('blank')">创建空计划</a-button>
        </div>
      </a-card>

      <a-card size="small">
        <a-table
          :columns="planColumns"
          :data-source="plans"
          :loading="planLoading"
          :pagination="false"
          row-key="id"
          size="middle"
          :scroll="{ x: 1220 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'date_range'">
              {{ record.start_date }} ~ {{ record.end_date }}
            </template>
            <template v-else-if="column.dataIndex === 'status'">
              <a-tag
                :color="findOption(planStatusOptions, record.status)?.color"
              >
                {{
                  findOption(planStatusOptions, record.status)?.label ??
                  record.status
                }}
              </a-tag>
            </template>
            <template v-else-if="column.dataIndex === 'progress'">
              <a-progress
                :percent="progressMap[record.id]?.percent ?? 0"
                size="small"
              />
            </template>
            <template v-else-if="column.dataIndex === 'created_time'">
              {{ formatDateTime(record.created_time) }}
            </template>
            <template v-else-if="column.dataIndex === 'operation'">
              <a-button type="link" @click="openEditPlan(record)">
                编辑
              </a-button>
              <a-button type="link" @click="openItems(record)">计划项</a-button>
            </template>
          </template>
        </a-table>
      </a-card>
    </div>

    <a-modal
      v-model:open="planModalOpen"
      :confirm-loading="planSubmitting"
      :title="planModalTitle"
      width="640px"
      @ok="submitPlan"
    >
      <a-form layout="vertical">
        <a-form-item v-if="planModalMode === 'create'" label="创建方式">
          <a-segmented
            v-model:value="planCreateMode"
            :options="[
              { label: '模板计划', value: 'template' },
              { label: '空计划', value: 'blank' },
            ]"
          />
        </a-form-item>
        <a-form-item label="学员用户 ID" required>
          <a-input-number
            v-model:value="planForm.user_id"
            :disabled="planModalMode === 'edit'"
            :min="1"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="计划标题" required>
          <a-input
            v-model:value="planForm.title"
            placeholder="例如 国考数量关系 7 天冲刺"
          />
        </a-form-item>
        <a-form-item
          v-if="planCreateMode === 'template'"
          label="计划模板"
          required
        >
          <a-select
            v-model:value="planForm.template_id"
            :options="templateOptions"
            option-filter-prop="label"
            show-search
          />
        </a-form-item>
        <a-form-item label="起始日期" required>
          <a-date-picker
            v-model:value="planForm.start_date"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </a-form-item>
        <template v-if="planCreateMode === 'blank'">
          <a-form-item label="结束日期" required>
            <a-date-picker
              v-model:value="planForm.end_date"
              style="width: 100%"
              value-format="YYYY-MM-DD"
            />
          </a-form-item>
          <a-form-item label="业务领域">
            <a-input v-model:value="planForm.domain" />
          </a-form-item>
        </template>
        <a-form-item v-if="planModalMode === 'edit'" label="计划状态">
          <a-select
            v-model:value="planForm.status"
            :options="planStatusOptions"
            style="width: 100%"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-drawer
      v-model:open="itemDrawerOpen"
      destroy-on-close
      placement="right"
      title="计划项管理"
      width="920px"
    >
      <template v-if="selectedPlan">
        <div class="drawer-header">
          <div>
            <div class="drawer-title">{{ selectedPlan.title }}</div>
            <div class="drawer-meta">
              学员 {{ selectedPlan.user_id }} · {{ selectedPlan.start_date }} ~
              {{ selectedPlan.end_date }}
            </div>
          </div>
          <a-button type="primary" @click="openCreateItem">新增计划项</a-button>
        </div>
        <a-progress
          v-if="selectedProgress"
          :percent="selectedProgress.percent"
          class="mb-4"
        />
        <a-table
          :columns="itemColumns"
          :data-source="items"
          :loading="itemLoading"
          :pagination="false"
          row-key="id"
          size="small"
          :scroll="{ x: 1500 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'module_type'">
              <a-tag
                :color="findOption(moduleOptions, record.module_type)?.color"
              >
                {{
                  findOption(moduleOptions, record.module_type)?.label ??
                  record.module_type
                }}
              </a-tag>
            </template>
            <template v-else-if="column.dataIndex === 'ref'">
              {{ record.ref_type }} #{{ record.ref_id ?? '-' }}
            </template>
            <template v-else-if="column.dataIndex === 'status'">
              <a-tag
                :color="findOption(itemStatusOptions, record.status)?.color"
              >
                {{
                  findOption(itemStatusOptions, record.status)?.label ??
                  record.status
                }}
              </a-tag>
            </template>
            <template v-else-if="column.dataIndex === 'target'">
              {{ formatModuleTarget(record.module_type, record.extra) }}
            </template>
            <template v-else-if="column.dataIndex === 'actual_duration'">
              {{
                formatDurationSeconds(record.latest_record?.duration_seconds)
              }}
            </template>
            <template v-else-if="column.dataIndex === 'accuracy'">
              {{
                formatAccuracy(
                  record.latest_record?.correct_count,
                  record.latest_record?.total_count,
                )
              }}
            </template>
            <template v-else-if="column.dataIndex === 'operation'">
              <a-button type="link" @click="openEditItem(record)">
                编辑
              </a-button>
              <a-popconfirm
                title="确定删除该计划项？"
                @confirm="deleteItem(record)"
              >
                <a-button danger type="link">删除</a-button>
              </a-popconfirm>
            </template>
          </template>
        </a-table>
      </template>
    </a-drawer>

    <a-modal
      v-model:open="itemModalOpen"
      :confirm-loading="itemSubmitting"
      :title="itemForm.id ? '编辑计划项' : '新增计划项'"
      width="720px"
      @ok="submitItem"
    >
      <a-form layout="vertical">
        <a-form-item label="标题" required>
          <a-input v-model:value="itemForm.title" />
        </a-form-item>
        <div class="form-grid">
          <a-form-item label="计划日期" required>
            <a-date-picker
              v-model:value="itemForm.plan_date"
              style="width: 100%"
              value-format="YYYY-MM-DD"
            />
          </a-form-item>
          <a-form-item label="当日顺序" required>
            <a-input-number
              v-model:value="itemForm.order_index"
              :min="0"
              style="width: 100%"
            />
          </a-form-item>
          <a-form-item label="模块类型" required>
            <a-select
              v-model:value="itemForm.module_type"
              :options="moduleOptions"
              @change="applyItemModuleDefaults"
            />
          </a-form-item>
          <a-form-item
            v-if="!isPracticeItemForm && !isResourceItemForm"
            label="引用类型"
            required
          >
            <a-select
              v-model:value="itemForm.ref_type"
              :options="refTypeOptions"
            />
          </a-form-item>
          <a-form-item
            v-if="!isPracticeItemForm && !isResourceItemForm"
            label="引用 ID"
          >
            <ContentRefPicker
              v-if="itemForm.ref_type === 'content'"
              v-model:value="itemForm.ref_id"
              app-code="gongkao"
            />
            <a-input-number
              v-else
              v-model:value="itemForm.ref_id"
              :min="1"
              style="width: 100%"
            />
          </a-form-item>
          <a-form-item label="预计分钟">
            <a-input-number
              v-model:value="itemForm.expected_minutes"
              :min="0"
              style="width: 100%"
            />
          </a-form-item>
          <a-form-item v-if="itemForm.id" label="状态">
            <a-select
              v-model:value="itemForm.status"
              :options="itemStatusOptions"
              allow-clear
            />
          </a-form-item>
        </div>
        <PracticeSourceBuilder v-if="isPracticeItemForm" :form="itemForm" />
        <a-card
          v-if="isAbilityItemForm"
          class="target-card"
          size="small"
          title="能力目标"
        >
          <a-form-item label="能力练习" required>
            <a-select
              v-model:value="itemForm.ability_key"
              :options="abilityOptions"
              option-filter-prop="label"
              placeholder="选择小程序能力练习"
              show-search
              @change="handleAbilityCatalogChange"
            />
          </a-form-item>
          <div class="form-grid">
            <a-form-item label="目标题数">
              <a-input-number
                v-model:value="itemForm.target_question_count"
                :min="1"
                :precision="0"
                style="width: 100%"
              />
            </a-form-item>
            <a-form-item label="目标正确率（%）">
              <a-input-number
                v-model:value="itemForm.target_accuracy_percent"
                :max="100"
                :min="0"
                :precision="1"
                style="width: 100%"
              />
            </a-form-item>
          </div>
          <AbilityParamFields
            v-model="itemForm.ability_params"
            :schema="
              findAbilityCatalogItem(itemForm.ability_key)?.param_schema ?? null
            "
          />
        </a-card>
        <a-card
          v-if="isResourceItemForm"
          class="target-card"
          size="small"
          title="网盘资源"
        >
          <CloudLinksEditor v-model="itemForm.cloud_links" />
        </a-card>
        <a-form-item label="高级配置 JSON">
          <a-textarea
            v-model:value="itemForm.extra_json"
            :rows="5"
            placeholder='例如 {"knowledge_points":["资料分析"],"question_ids":[1,2,3]}'
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </Page>
</template>

<style scoped>
.study-plan-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.drawer-header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}

.drawer-title {
  font-size: 16px;
  font-weight: 600;
}

.drawer-meta {
  margin-top: 4px;
  color: #8c8c8c;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.target-card {
  margin-bottom: 16px;
}
</style>
