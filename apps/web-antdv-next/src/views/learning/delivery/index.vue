<script setup lang="ts">
import type { VbenFormProps, VbenFormSchema } from '@vben/common-ui';

import type { VisualFieldRow } from '../utils';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  CreateLearningDeliveryParams,
  LearningDeliveryDetail,
  LearningPlanTemplateDetail,
} from '#/api';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createLearningDeliveryApi,
  getLearningDeliveriesApi,
  getLearningPlanTemplatesApi,
  getSysUserListApi,
  instantiateLearningDeliveryPlanApi,
  publishLearningDeliveryApi,
  updateLearningDeliveryApi,
} from '#/api';

import VisualFieldEditor from '../components/VisualFieldEditor.vue';
import { objectToVisualFields, visualFieldsToObject } from '../utils';

type Option = { label: string; value: number | string };

const sourceTypeOptions = [
  { label: '外部订单', value: 'external_order' },
  { label: '人工录入', value: 'manual' },
  { label: '赠送', value: 'gift' },
  { label: '内部安排', value: 'internal' },
  { label: '其他', value: 'other' },
];
const statusOptions = [
  { color: 'default', label: '待处理', value: 'pending' },
  { color: 'processing', label: '制定中', value: 'drafting' },
  { color: 'cyan', label: '已验收', value: 'validated' },
  { color: 'success', label: '已交付', value: 'delivered' },
  { color: 'error', label: '已取消', value: 'canceled' },
];
const examTypeOptions = [
  { label: '国家公务员考试', value: 'national_civil_service' },
  { label: '省级公务员考试', value: 'provincial_civil_service' },
  { label: '事业单位考试', value: 'public_institution' },
  { label: '选调生考试', value: 'selected_graduate' },
  { label: '其他考试', value: 'other' },
];
const levelOptions = [
  { label: '零基础', value: 'beginner' },
  { label: '基础薄弱', value: 'weak' },
  { label: '具备基础', value: 'intermediate' },
  { label: '冲刺提升', value: 'advanced' },
];

const REQUIREMENT_KEYS = [
  'current_level',
  'current_score',
  'daily_minutes',
  'exam_date',
  'exam_name',
  'exam_type',
  'notes',
  'strengths',
  'study_preferences',
  'target_score',
  'weaknesses',
];
const SOURCE_META_KEYS = [
  'acquisition_source',
  'contact_method',
  'package_name',
  'payment_amount',
  'payment_currency',
  'salesperson',
];

const today = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};
const findOption = (options: any[], value: unknown) =>
  options.find((item) => item.value === value);

const userOptions = ref<Option[]>([]);
const templates = ref<LearningPlanTemplateDetail[]>([]);
const templateOptions = computed(() =>
  templates.value.map((item) => ({
    label: `${item.name}（${item.duration_days} 天 / ${item.task_count} 个任务）`,
    value: item.id,
  })),
);

const querySchema: VbenFormSchema[] = [
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      optionFilterProp: 'label',
      placeholder: '请选择接收用户',
      showSearch: true,
    },
    fieldName: 'user_id',
    label: '接收用户',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: statusOptions,
      placeholder: '请选择状态',
    },
    fieldName: 'status',
    label: '交付状态',
  },
  {
    component: 'Input',
    componentProps: { allowClear: true, placeholder: '淘宝、微信、小红书等' },
    fieldName: 'source_channel',
    label: '来源渠道',
  },
];

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: querySchema,
  showCollapseButton: false,
  submitButtonOptions: { content: '查询' },
};

const gridOptions: VxeTableGridOptions<LearningDeliveryDetail> = {
  columns: [
    { field: 'seq', fixed: 'left', title: '序号', type: 'seq', width: 60 },
    {
      field: 'delivery_no',
      fixed: 'left',
      minWidth: 220,
      slots: { default: 'delivery_no_default' },
      title: '交付单',
    },
    {
      field: 'user',
      slots: { default: 'user_default' },
      title: '接收用户',
      width: 190,
    },
    {
      field: 'source',
      slots: { default: 'source_default' },
      title: '外部来源',
      width: 230,
    },
    {
      field: 'status',
      slots: { default: 'status_default' },
      title: '状态',
      width: 100,
    },
    {
      field: 'plan',
      slots: { default: 'plan_default' },
      title: '关联计划',
      width: 220,
    },
    {
      field: 'requirements',
      minWidth: 280,
      slots: { default: 'requirements_default' },
      title: '定制需求',
    },
    { field: 'assigned_to', title: '负责人 ID', width: 105 },
    { field: 'created_time', title: '创建时间', width: 168 },
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
        getLearningDeliveriesApi(formValues),
    },
  },
  rowConfig: { isHover: true, keyField: 'id' },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, zoom: true },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

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

async function loadTemplates() {
  templates.value = await getLearningPlanTemplatesApi({ status: 'active' });
}

const modalOpen = ref(false);
const submitting = ref(false);
const editingId = ref<number>();
const createPlan = ref(true);
const form = reactive({
  assigned_to: undefined as number | undefined,
  external_customer_ref: '',
  external_order_no: '',
  plan_description: '',
  plan_end_date: undefined as string | undefined,
  plan_start_date: today(),
  plan_template_id: undefined as number | undefined,
  plan_title: '',
  remark: '',
  source_channel: '',
  source_type: 'external_order' as CreateLearningDeliveryParams['source_type'],
  status: 'pending' as LearningDeliveryDetail['status'],
  user_id: undefined as number | undefined,
});
const requirementsForm = reactive({
  current_level: '',
  current_score: undefined as number | undefined,
  customFields: [] as VisualFieldRow[],
  daily_minutes: 120,
  exam_date: undefined as string | undefined,
  exam_name: '',
  exam_type: 'national_civil_service',
  notes: '',
  strengths: [] as string[],
  study_preferences: [] as string[],
  target_score: undefined as number | undefined,
  weaknesses: [] as string[],
});
const sourceMetaForm = reactive({
  acquisition_source: '',
  contact_method: '',
  customFields: [] as VisualFieldRow[],
  package_name: '',
  payment_amount: undefined as number | undefined,
  payment_currency: 'CNY',
  salesperson: '',
});

const modalTitle = computed(() =>
  editingId.value ? '编辑计划交付单' : '新建计划交付单',
);

function resetRequirements() {
  requirementsForm.current_level = '';
  requirementsForm.current_score = undefined;
  requirementsForm.customFields = [];
  requirementsForm.daily_minutes = 120;
  requirementsForm.exam_date = undefined;
  requirementsForm.exam_name = '';
  requirementsForm.exam_type = 'national_civil_service';
  requirementsForm.notes = '';
  requirementsForm.strengths = [];
  requirementsForm.study_preferences = [];
  requirementsForm.target_score = undefined;
  requirementsForm.weaknesses = [];
}

function resetSourceMeta() {
  sourceMetaForm.acquisition_source = '';
  sourceMetaForm.contact_method = '';
  sourceMetaForm.customFields = [];
  sourceMetaForm.package_name = '';
  sourceMetaForm.payment_amount = undefined;
  sourceMetaForm.payment_currency = 'CNY';
  sourceMetaForm.salesperson = '';
}

function resetForm() {
  editingId.value = undefined;
  form.user_id = undefined;
  form.source_type = 'external_order';
  form.source_channel = '';
  form.external_order_no = '';
  form.external_customer_ref = '';
  form.assigned_to = undefined;
  form.remark = '';
  form.status = 'pending';
  createPlan.value = true;
  form.plan_title = '';
  form.plan_template_id = undefined;
  form.plan_start_date = today();
  form.plan_end_date = undefined;
  form.plan_description = '';
  resetRequirements();
  resetSourceMeta();
}

function openCreate() {
  resetForm();
  modalOpen.value = true;
}

function loadRequirements(value: null | Record<string, unknown> | undefined) {
  resetRequirements();
  if (!value) return;
  requirementsForm.current_level = String(value.current_level ?? '');
  requirementsForm.current_score =
    value.current_score === null || value.current_score === undefined
      ? undefined
      : Number(value.current_score);
  requirementsForm.daily_minutes = Number(value.daily_minutes ?? 120);
  requirementsForm.exam_date = value.exam_date
    ? String(value.exam_date)
    : undefined;
  requirementsForm.exam_name = String(value.exam_name ?? '');
  requirementsForm.exam_type = String(
    value.exam_type ?? 'national_civil_service',
  );
  requirementsForm.notes = String(value.notes ?? '');
  requirementsForm.strengths = Array.isArray(value.strengths)
    ? value.strengths.map(String)
    : [];
  requirementsForm.study_preferences = Array.isArray(value.study_preferences)
    ? value.study_preferences.map(String)
    : [];
  requirementsForm.target_score =
    value.target_score === null || value.target_score === undefined
      ? undefined
      : Number(value.target_score);
  requirementsForm.weaknesses = Array.isArray(value.weaknesses)
    ? value.weaknesses.map(String)
    : [];
  requirementsForm.customFields = objectToVisualFields(value, REQUIREMENT_KEYS);
}

function loadSourceMeta(value: null | Record<string, unknown> | undefined) {
  resetSourceMeta();
  if (!value) return;
  sourceMetaForm.acquisition_source = String(value.acquisition_source ?? '');
  sourceMetaForm.contact_method = String(value.contact_method ?? '');
  sourceMetaForm.package_name = String(value.package_name ?? '');
  sourceMetaForm.payment_amount =
    value.payment_amount === null || value.payment_amount === undefined
      ? undefined
      : Number(value.payment_amount);
  sourceMetaForm.payment_currency = String(value.payment_currency ?? 'CNY');
  sourceMetaForm.salesperson = String(value.salesperson ?? '');
  sourceMetaForm.customFields = objectToVisualFields(value, SOURCE_META_KEYS);
}

function openEdit(record: LearningDeliveryDetail) {
  resetForm();
  editingId.value = record.id;
  form.user_id = record.user_id ?? undefined;
  form.source_type = record.source_type;
  form.source_channel = record.source_channel ?? '';
  form.external_order_no = record.external_order_no ?? '';
  form.external_customer_ref = record.external_customer_ref ?? '';
  form.assigned_to = record.assigned_to ?? undefined;
  form.remark = record.remark ?? '';
  form.status = record.status;
  loadRequirements(record.requirements);
  loadSourceMeta(record.source_meta);
  createPlan.value = false;
  modalOpen.value = true;
}

function buildRequirements() {
  return {
    ...visualFieldsToObject(requirementsForm.customFields),
    current_level: requirementsForm.current_level || undefined,
    current_score: requirementsForm.current_score,
    daily_minutes: requirementsForm.daily_minutes,
    exam_date: requirementsForm.exam_date,
    exam_name: requirementsForm.exam_name || undefined,
    exam_type: requirementsForm.exam_type,
    notes: requirementsForm.notes || undefined,
    strengths: requirementsForm.strengths,
    study_preferences: requirementsForm.study_preferences,
    target_score: requirementsForm.target_score,
    weaknesses: requirementsForm.weaknesses,
  };
}

function buildSourceMeta() {
  return {
    ...visualFieldsToObject(sourceMetaForm.customFields),
    acquisition_source: sourceMetaForm.acquisition_source || undefined,
    contact_method: sourceMetaForm.contact_method || undefined,
    package_name: sourceMetaForm.package_name || undefined,
    payment_amount: sourceMetaForm.payment_amount,
    payment_currency: sourceMetaForm.payment_currency || undefined,
    salesperson: sourceMetaForm.salesperson || undefined,
  };
}

function removeUndefined(value: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  );
}

async function submit() {
  if (
    createPlan.value &&
    (!form.user_id || (!form.plan_template_id && !form.plan_title.trim()))
  ) {
    message.warning(
      '同步创建计划时，请选择接收用户，并选择模板或填写空白计划标题',
    );
    return;
  }
  if (form.plan_end_date && form.plan_end_date < form.plan_start_date) {
    message.warning('计划结束日期不能早于开始日期');
    return;
  }
  submitting.value = true;
  try {
    const requirements = removeUndefined(buildRequirements());
    const sourceMeta = removeUndefined(buildSourceMeta());
    const payload: CreateLearningDeliveryParams = {
      assigned_to: form.assigned_to || null,
      external_customer_ref: form.external_customer_ref || null,
      external_order_no: form.external_order_no || null,
      remark: form.remark || null,
      requirements: Object.keys(requirements).length > 0 ? requirements : null,
      source_channel: form.source_channel || null,
      source_meta: Object.keys(sourceMeta).length > 0 ? sourceMeta : null,
      source_type: form.source_type,
      user_id: form.user_id || null,
    };
    if (editingId.value) {
      await updateLearningDeliveryApi(editingId.value, {
        ...payload,
        status: form.status,
      });
      message.success('交付单已更新');
    } else {
      if (createPlan.value) {
        payload.plan = {
          description: form.plan_description || null,
          end_date: form.plan_end_date || null,
          start_date: form.plan_start_date,
          template_id: form.plan_template_id || null,
          title: form.plan_title.trim() || null,
        };
      }
      await createLearningDeliveryApi(payload);
      message.success('交付单已创建');
    }
    modalOpen.value = false;
    gridApi.query();
  } finally {
    submitting.value = false;
  }
}

async function publish(record: LearningDeliveryDetail) {
  await publishLearningDeliveryApi(record.id);
  message.success('交付已发布，关联草稿计划已激活');
  gridApi.query();
}

function formatRequirements(value: null | Record<string, unknown> | undefined) {
  if (!value) return '未填写';
  const parts = [
    value.exam_name || findOption(examTypeOptions, value.exam_type)?.label,
    value.exam_date ? `考试 ${value.exam_date}` : '',
    value.daily_minutes ? `每天 ${value.daily_minutes} 分钟` : '',
    value.target_score ? `目标 ${value.target_score}` : '',
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : '已填写定制需求';
}

onMounted(() => {
  void Promise.all([loadUsers(), loadTemplates()]);
});

const instantiateModalOpen = ref(false);
const instantiateSubmitting = ref(false);
const instantiateDelivery = ref<LearningDeliveryDetail>();
const instantiateForm = reactive({
  description: '',
  start_date: today(),
  template_id: undefined as number | undefined,
  title: '',
});

function openInstantiate(record: LearningDeliveryDetail) {
  if (!record.user_id) {
    message.warning('请先编辑交付单并绑定接收用户');
    return;
  }
  instantiateDelivery.value = record;
  instantiateForm.template_id = undefined;
  instantiateForm.start_date = today();
  instantiateForm.title = '';
  instantiateForm.description = '';
  instantiateModalOpen.value = true;
}

async function submitInstantiate() {
  if (!instantiateDelivery.value || !instantiateForm.template_id) {
    message.warning('请选择计划模板');
    return;
  }
  instantiateSubmitting.value = true;
  try {
    await instantiateLearningDeliveryPlanApi(instantiateDelivery.value.id, {
      description: instantiateForm.description || null,
      start_date: instantiateForm.start_date,
      template_id: instantiateForm.template_id,
      title: instantiateForm.title.trim() || null,
    });
    message.success('已从模板生成完整用户计划和每日任务');
    instantiateModalOpen.value = false;
    gridApi.query();
  } finally {
    instantiateSubmitting.value = false;
  }
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <a-button type="primary" @click="openCreate">新建交付单</a-button>
      </template>
      <template #delivery_no_default="{ row }">
        <div class="font-medium">{{ row.delivery_no }}</div>
        <div class="text-xs text-gray-500">
          {{
            findOption(sourceTypeOptions, row.source_type)?.label ||
            row.source_type
          }}
        </div>
      </template>
      <template #user_default="{ row }">
        <template v-if="row.user_id">
          <div>{{ row.nickname || row.username || `用户 ${row.user_id}` }}</div>
          <div class="text-xs text-gray-500">
            {{ row.username || `ID ${row.user_id}` }}
          </div>
        </template>
        <a-tag v-else color="warning">待绑定</a-tag>
      </template>
      <template #source_default="{ row }">
        <div>{{ row.source_channel || '无渠道' }}</div>
        <div class="text-xs text-gray-500">
          订单：{{ row.external_order_no || '-' }}
        </div>
        <div class="text-xs text-gray-500">
          客户：{{ row.external_customer_ref || '-' }}
        </div>
      </template>
      <template #status_default="{ row }">
        <a-tag :color="findOption(statusOptions, row.status)?.color">
          {{ findOption(statusOptions, row.status)?.label || row.status }}
        </a-tag>
      </template>
      <template #plan_default="{ row }">
        <template v-if="row.plan_id">
          <div>{{ row.plan_title || `计划 ${row.plan_id}` }}</div>
          <div class="text-xs text-gray-500">
            {{ row.template_name ? `模板：${row.template_name} · ` : '' }}计划
            ID {{ row.plan_id }} · {{ row.task_count }} 个任务
          </div>
        </template>
        <a-tag v-else>尚未创建计划</a-tag>
      </template>
      <template #requirements_default="{ row }">
        <a-tooltip :title="formatRequirements(row.requirements)">
          <div class="line-clamp-2 text-xs">
            {{ formatRequirements(row.requirements) }}
          </div>
        </a-tooltip>
      </template>
      <template #operation_default="{ row }">
        <a-button type="link" @click="openEdit(row)">编辑</a-button>
        <a-button v-if="!row.plan_id" type="link" @click="openInstantiate(row)">
          生成计划
        </a-button>
        <a-popconfirm
          v-if="row.status !== 'delivered' && row.status !== 'canceled'"
          title="发布后会激活关联的草稿计划，确定继续？"
          @confirm="publish(row)"
        >
          <a-button type="link">发布</a-button>
        </a-popconfirm>
      </template>
    </Grid>

    <a-modal
      v-model:open="modalOpen"
      :confirm-loading="submitting"
      :title="modalTitle"
      width="900px"
      @ok="submit"
    >
      <a-form layout="vertical">
        <a-tabs>
          <a-tab-pane key="source" tab="订单与客户">
            <a-alert
              class="mb-4"
              message="外部订单只记录渠道和订单号，不依赖站内商城订单。相同渠道 + 外部订单号不可重复。"
              show-icon
              type="info"
            />
            <div class="grid grid-cols-2 gap-4">
              <a-form-item label="接收用户">
                <a-select
                  v-model:value="form.user_id"
                  allow-clear
                  :options="userOptions"
                  option-filter-prop="label"
                  placeholder="可稍后绑定用户"
                  show-search
                />
              </a-form-item>
              <a-form-item label="交付来源">
                <a-select
                  v-model:value="form.source_type"
                  :options="sourceTypeOptions"
                />
              </a-form-item>
              <a-form-item label="来源渠道">
                <a-input
                  v-model:value="form.source_channel"
                  placeholder="淘宝、微信、小红书、线下等"
                />
              </a-form-item>
              <a-form-item label="外部订单号">
                <a-input v-model:value="form.external_order_no" />
              </a-form-item>
              <a-form-item label="外部客户标识">
                <a-input
                  v-model:value="form.external_customer_ref"
                  placeholder="昵称、手机号后四位或外部联系人 ID"
                />
              </a-form-item>
              <a-form-item label="负责人">
                <a-select
                  v-model:value="form.assigned_to"
                  allow-clear
                  :options="userOptions"
                  option-filter-prop="label"
                  show-search
                />
              </a-form-item>
              <a-form-item v-if="editingId" label="交付状态">
                <a-select
                  v-model:value="form.status"
                  :options="statusOptions"
                />
              </a-form-item>
            </div>
            <a-form-item label="备注">
              <a-textarea v-model:value="form.remark" :rows="3" />
            </a-form-item>
          </a-tab-pane>

          <a-tab-pane key="requirements" tab="定制需求">
            <div class="grid grid-cols-2 gap-4">
              <a-form-item label="考试类型">
                <a-select
                  v-model:value="requirementsForm.exam_type"
                  :options="examTypeOptions"
                />
              </a-form-item>
              <a-form-item label="考试名称">
                <a-input
                  v-model:value="requirementsForm.exam_name"
                  placeholder="例如：2027 国家公务员考试"
                />
              </a-form-item>
              <a-form-item label="考试日期">
                <a-date-picker
                  v-model:value="requirementsForm.exam_date"
                  style="width: 100%"
                  value-format="YYYY-MM-DD"
                />
              </a-form-item>
              <a-form-item label="每天可学习时长">
                <a-input-number
                  v-model:value="requirementsForm.daily_minutes"
                  :min="0"
                  :max="1440"
                  style="width: 100%"
                />
              </a-form-item>
              <a-form-item label="当前水平">
                <a-select
                  v-model:value="requirementsForm.current_level"
                  allow-clear
                  :options="levelOptions"
                />
              </a-form-item>
              <a-form-item label="当前成绩">
                <a-input-number
                  v-model:value="requirementsForm.current_score"
                  :min="0"
                  style="width: 100%"
                />
              </a-form-item>
              <a-form-item label="目标成绩">
                <a-input-number
                  v-model:value="requirementsForm.target_score"
                  :min="0"
                  style="width: 100%"
                />
              </a-form-item>
            </div>
            <a-form-item label="薄弱模块">
              <a-select
                v-model:value="requirementsForm.weaknesses"
                mode="tags"
                placeholder="输入模块后回车，例如：资料分析"
                :token-separators="[',', '，']"
              />
            </a-form-item>
            <a-form-item label="优势模块">
              <a-select
                v-model:value="requirementsForm.strengths"
                mode="tags"
                placeholder="输入模块后回车"
                :token-separators="[',', '，']"
              />
            </a-form-item>
            <a-form-item label="学习偏好">
              <a-select
                v-model:value="requirementsForm.study_preferences"
                mode="tags"
                placeholder="例如：早晨学习、周末模考、视频优先"
                :token-separators="[',', '，']"
              />
            </a-form-item>
            <a-form-item label="补充说明">
              <a-textarea v-model:value="requirementsForm.notes" :rows="3" />
            </a-form-item>
            <a-divider title-placement="start">其他需求字段</a-divider>
            <VisualFieldEditor v-model="requirementsForm.customFields" />
          </a-tab-pane>

          <a-tab-pane key="commercial" tab="成交信息">
            <div class="grid grid-cols-2 gap-4">
              <a-form-item label="购买套餐">
                <a-input
                  v-model:value="sourceMetaForm.package_name"
                  placeholder="例如：90 天定制计划"
                />
              </a-form-item>
              <a-form-item label="成交金额">
                <a-input-number
                  v-model:value="sourceMetaForm.payment_amount"
                  :min="0"
                  style="width: 100%"
                />
              </a-form-item>
              <a-form-item label="币种">
                <a-select
                  v-model:value="sourceMetaForm.payment_currency"
                  :options="[
                    { label: '人民币 CNY', value: 'CNY' },
                    { label: '美元 USD', value: 'USD' },
                  ]"
                />
              </a-form-item>
              <a-form-item label="销售负责人">
                <a-input v-model:value="sourceMetaForm.salesperson" />
              </a-form-item>
              <a-form-item label="获客来源">
                <a-input
                  v-model:value="sourceMetaForm.acquisition_source"
                  placeholder="直播、社群、转介绍等"
                />
              </a-form-item>
              <a-form-item label="联系方式">
                <a-input
                  v-model:value="sourceMetaForm.contact_method"
                  placeholder="微信、电话或其他方式"
                />
              </a-form-item>
            </div>
            <a-divider title-placement="start">其他成交字段</a-divider>
            <VisualFieldEditor v-model="sourceMetaForm.customFields" />
          </a-tab-pane>

          <a-tab-pane v-if="!editingId" key="plan" tab="同步创建计划">
            <div
              class="mb-4 flex items-center justify-between rounded border p-3"
            >
              <div>
                <div class="font-medium">同步创建学习计划</div>
                <div class="text-xs text-gray-500">
                  选择模板后会一次生成完整每日任务；也可以不选模板创建空白计划。
                </div>
              </div>
              <a-switch v-model:checked="createPlan" />
            </div>
            <template v-if="createPlan">
              <a-form-item label="计划模板">
                <a-select
                  v-model:value="form.plan_template_id"
                  allow-clear
                  :options="templateOptions"
                  option-filter-prop="label"
                  placeholder="选择后自动生成阶段、每日任务、知识点和完成指标"
                  show-search
                />
              </a-form-item>
              <a-form-item
                :label="
                  form.plan_template_id ? '计划标题（可选覆盖）' : '计划标题'
                "
                :required="!form.plan_template_id"
              >
                <a-input
                  v-model:value="form.plan_title"
                  placeholder="不填写时使用模板名称"
                />
              </a-form-item>
              <div class="grid grid-cols-2 gap-4">
                <a-form-item label="开始日期" required>
                  <a-date-picker
                    v-model:value="form.plan_start_date"
                    style="width: 100%"
                    value-format="YYYY-MM-DD"
                  />
                </a-form-item>
                <a-form-item v-if="!form.plan_template_id" label="结束日期">
                  <a-date-picker
                    v-model:value="form.plan_end_date"
                    style="width: 100%"
                    value-format="YYYY-MM-DD"
                  />
                </a-form-item>
              </div>
              <a-form-item label="计划说明">
                <a-textarea v-model:value="form.plan_description" :rows="3" />
              </a-form-item>
            </template>
          </a-tab-pane>
        </a-tabs>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="instantiateModalOpen"
      :confirm-loading="instantiateSubmitting"
      title="从模板生成交付计划"
      width="680px"
      @ok="submitInstantiate"
    >
      <a-alert
        class="mb-4"
        message="系统会复制模板中的阶段、每日任务、知识点和完成指标，生成后可在计划管理中继续微调。"
        show-icon
        type="info"
      />
      <a-form layout="vertical">
        <a-form-item label="计划模板" required>
          <a-select
            v-model:value="instantiateForm.template_id"
            :options="templateOptions"
            option-filter-prop="label"
            placeholder="请选择已启用模板"
            show-search
          />
        </a-form-item>
        <div class="grid grid-cols-2 gap-4">
          <a-form-item label="开始日期" required>
            <a-date-picker
              v-model:value="instantiateForm.start_date"
              style="width: 100%"
              value-format="YYYY-MM-DD"
            />
          </a-form-item>
          <a-form-item label="计划标题（可选覆盖）">
            <a-input
              v-model:value="instantiateForm.title"
              placeholder="不填写时使用模板名称"
            />
          </a-form-item>
        </div>
        <a-form-item label="计划说明（可选覆盖）">
          <a-textarea v-model:value="instantiateForm.description" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>
  </Page>
</template>
