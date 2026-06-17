<script lang="ts" setup>
import type { CloudLinkItem, PracticeSourceFormState } from '../common';

import type {
  CreateStudyPlanTemplateParams,
  StudyPlanAbilityCatalogItem,
  StudyPlanTemplateDetail,
  StudyPlanTemplateItemDetail,
  StudyPlanTemplateItemParams,
  StudyPlanTemplateWithItemsDetail,
} from '#/api/study-plan';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Descriptions as ADescriptions,
  DescriptionsItem as ADescriptionsItem,
  message,
} from 'ant-design-vue';

import {
  createStudyPlanTemplateApi,
  createStudyPlanTemplateItemApi,
  deleteStudyPlanTemplateItemApi,
  getStudyPlanAbilityCatalogApi,
  getStudyPlanTemplateApi,
  getStudyPlanTemplatesApi,
  updateStudyPlanTemplateApi,
  updateStudyPlanTemplateItemApi,
} from '#/api/study-plan';

import {
  buildModuleExtra,
  createDefaultPracticeSourceFields,
  findOption,
  formatModuleTarget,
  moduleOptions,
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

interface TemplateForm {
  description?: null | string;
  domain: string;
  duration_days: number;
  id?: number;
  is_active: boolean;
  name: string;
}

interface TemplateItemForm extends PracticeSourceFormState {
  ability_key?: string;
  ability_params: Record<string, unknown>;
  ability_title?: string;
  ability_url?: string;
  cloud_links: CloudLinkItem[];
  day_index: number;
  expected_minutes: number;
  extra_json: string;
  id?: number;
  module_type: StudyPlanTemplateItemParams['module_type'];
  order_index: number;
  ref_id?: null | number;
  ref_type: StudyPlanTemplateItemParams['ref_type'];
  title: string;
}

const templates = ref<StudyPlanTemplateDetail[]>([]);
const loading = ref(false);
const modalOpen = ref(false);
const detailOpen = ref(false);
const submitting = ref(false);
const detailLoading = ref(false);
const detail = ref<null | StudyPlanTemplateWithItemsDetail>(null);
const itemForms = ref<TemplateItemForm[]>([]);
const itemModalOpen = ref(false);
const itemSubmitting = ref(false);
const abilityCatalog = ref<StudyPlanAbilityCatalogItem[]>([]);

const itemForm = reactive<TemplateItemForm>({
  ability_key: '',
  ability_params: {},
  ability_title: '',
  ability_url: '',
  cloud_links: [],
  ...createDefaultPracticeSourceFields(),
  day_index: 1,
  expected_minutes: 15,
  extra_json: '',
  module_type: 'review',
  order_index: 0,
  ref_id: null,
  ref_type: 'content',
  target_accuracy_percent: null,
  target_question_count: null,
  title: '',
});

const form = reactive<TemplateForm>({
  description: '',
  domain: 'civil_service',
  duration_days: 7,
  is_active: true,
  name: '',
});

const modalTitle = computed(() => (form.id ? '编辑模板' : '新建模板'));
const abilityOptions = computed(() =>
  abilityCatalog.value
    .filter((item) => item.supports_study_plan)
    .map((item) => ({
      label: `${item.title} · ${item.category}`,
      value: item.key,
    })),
);

const columns: any[] = [
  { dataIndex: 'id', title: 'ID', width: 80 },
  { dataIndex: 'name', title: '模板名称', minWidth: 260 },
  { dataIndex: 'duration_days', title: '天数', width: 90 },
  { dataIndex: 'domain', title: '领域', width: 140 },
  { dataIndex: 'is_active', title: '状态', width: 90 },
  { dataIndex: 'created_by', title: '创建人', width: 100 },
  { dataIndex: 'created_time', title: '创建时间', width: 180 },
  {
    dataIndex: 'operation',
    fixed: 'right' as const,
    title: '操作',
    width: 150,
  },
];

const itemColumns: any[] = [
  { dataIndex: 'day_index', title: '第几天', width: 90 },
  { dataIndex: 'order_index', title: '顺序', width: 80 },
  { dataIndex: 'module_type', title: '模块', width: 110 },
  { dataIndex: 'title', title: '标题', minWidth: 260 },
  { dataIndex: 'ref', title: '引用', width: 180 },
  { dataIndex: 'expected_minutes', title: '预计分钟', width: 100 },
  { dataIndex: 'target', title: '目标', width: 150 },
  { dataIndex: 'extra', title: '高级配置', width: 260 },
  {
    dataIndex: 'operation',
    fixed: 'right' as const,
    title: '操作',
    width: 150,
  },
];

function createDefaultItem(dayIndex = 1, orderIndex = 0): TemplateItemForm {
  return {
    ability_key: '',
    ability_params: {},
    ability_title: '',
    ability_url: '',
    cloud_links: [],
    ...createDefaultPracticeSourceFields(),
    day_index: dayIndex,
    expected_minutes: 15,
    extra_json: '',
    module_type: 'review',
    order_index: orderIndex,
    ref_id: null,
    ref_type: 'content',
    target_accuracy_percent: null,
    target_question_count: null,
    title: '',
  };
}

function resetForm() {
  form.description = '';
  form.domain = 'civil_service';
  form.duration_days = 7;
  form.id = undefined;
  form.is_active = true;
  form.name = '';
  itemForms.value = [createDefaultItem()];
}

async function loadTemplates() {
  loading.value = true;
  try {
    templates.value = await getStudyPlanTemplatesApi();
  } finally {
    loading.value = false;
  }
}

async function loadAbilityCatalog() {
  abilityCatalog.value = await getStudyPlanAbilityCatalogApi('civil_service');
}

function openCreate() {
  resetForm();
  modalOpen.value = true;
}

function openEdit(template: Record<string, unknown> | StudyPlanTemplateDetail) {
  const targetTemplate = template as StudyPlanTemplateDetail;
  form.description = targetTemplate.description ?? '';
  form.domain = targetTemplate.domain;
  form.duration_days = targetTemplate.duration_days;
  form.id = targetTemplate.id;
  form.is_active = targetTemplate.is_active;
  form.name = targetTemplate.name;
  itemForms.value = [];
  modalOpen.value = true;
}

function addTemplateItem() {
  const last = itemForms.value.at(-1);
  itemForms.value.push(
    createDefaultItem(last?.day_index ?? 1, (last?.order_index ?? -1) + 1),
  );
}

function removeTemplateItem(index: number) {
  itemForms.value.splice(index, 1);
}

function buildItemPayload(item: TemplateItemForm): StudyPlanTemplateItemParams {
  if (!item.title.trim()) {
    throw new Error('请填写模板项标题');
  }
  if (item.module_type === 'ability' && !item.ability_url) {
    throw new Error('请选择能力练习');
  }
  if (item.module_type === 'practice') {
    validatePracticeSourceForm(item);
  }
  if (item.module_type === 'resource') {
    if (item.cloud_links.length === 0) {
      throw new Error('请至少添加一条网盘链接');
    }
    item.cloud_links.forEach((link, idx) => {
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
    item.module_type === 'practice'
      ? resolvePracticeSourceRefId(item)
      : (item.ref_id ?? null);

  return {
    day_index: item.day_index,
    expected_minutes: item.expected_minutes,
    extra: buildModuleExtra(item.module_type, item.extra_json, {
      abilityKey: item.ability_key,
      abilityParams: item.ability_params,
      abilityTitle: item.ability_title,
      abilityUrl: item.ability_url,
      accuracyPercent: item.target_accuracy_percent,
      cloudLinks: item.cloud_links,
      practiceBankLabel: item.practice_bank_label,
      practiceChapterId: item.practice_chapter_id,
      practiceChapterLabel: item.practice_chapter_label,
      practiceKnowledgePoints: item.practice_knowledge_points,
      practiceQuestionIdsText: item.practice_question_ids_text,
      practiceQuestionTypes: item.practice_question_types,
      practiceRegion: item.practice_region,
      practiceShuffle: item.practice_shuffle,
      practiceSourceMode: item.practice_source_mode,
      practiceTimeLimit: item.practice_time_limit,
      practiceYearEnd: item.practice_year_end,
      practiceYearStart: item.practice_year_start,
      questionCount: item.target_question_count,
    }),
    module_type: item.module_type,
    order_index: item.order_index,
    ref_id: refId,
    ref_type: item.module_type === 'practice' ? 'question_set' : item.ref_type,
    title: item.title.trim(),
  };
}

function isPracticeTemplateItem(item: TemplateItemForm) {
  return item.module_type === 'practice';
}

function isAbilityTemplateItem(item: TemplateItemForm) {
  return item.module_type === 'ability';
}

function isResourceTemplateItem(item: TemplateItemForm) {
  return item.module_type === 'resource';
}

function findAbilityCatalogItem(key?: null | string) {
  if (!key) {
    return null;
  }

  return abilityCatalog.value.find((item) => item.key === key) ?? null;
}

function applyAbilityCatalogDefaults(
  item: TemplateItemForm,
  key?: null | string,
) {
  const ability = findAbilityCatalogItem(key ?? item.ability_key);
  if (!ability) {
    item.ability_title = '';
    item.ability_url = '';
    item.ability_params = {};
    return;
  }

  item.ability_key = ability.key;
  item.ability_title = ability.title;
  item.ability_url = ability.url;
  item.expected_minutes = ability.default_minutes;
  item.target_question_count = ability.default_question_count ?? null;
  item.target_accuracy_percent =
    ability.default_accuracy === null || ability.default_accuracy === undefined
      ? null
      : Math.round(ability.default_accuracy * 1000) / 10;
  item.ability_params = {};
  if (!item.title.trim()) {
    item.title = ability.title;
  }
}

function handleAbilityCatalogChange(item: TemplateItemForm, value: unknown) {
  applyAbilityCatalogDefaults(item, typeof value === 'string' ? value : '');
}

function applyTemplateItemModuleDefaults(item: TemplateItemForm) {
  if (item.module_type === 'practice') {
    item.ref_type = 'question_set';
    item.target_accuracy_percent ??= 60;
    item.target_question_count ??= 20;
    return;
  }

  if (item.module_type === 'wrong_review') {
    item.ref_type = 'wrong_dynamic';
    item.ref_id = null;
    return;
  }

  if (item.module_type === 'ability') {
    item.ref_type = 'ability_task';
    item.ref_id = null;
    item.ability_key ||= abilityOptions.value[0]?.value ?? '';
    applyAbilityCatalogDefaults(item);
    return;
  }

  if (item.module_type === 'resource') {
    item.ref_type = 'content';
    item.ref_id = null;
    if (!Array.isArray(item.cloud_links)) {
      item.cloud_links = [];
    }
    return;
  }

  item.ref_type = 'content';
}

function buildItems(): StudyPlanTemplateItemParams[] {
  return itemForms.value.map((item, index) => {
    try {
      return buildItemPayload(item);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`第 ${index + 1} 个模板项：${error.message}`, {
          cause: error,
        });
      }
      throw error;
    }
  });
}

async function submitTemplate() {
  if (!form.name.trim()) {
    message.warning('请填写模板名称');
    return;
  }

  submitting.value = true;
  try {
    if (form.id) {
      await updateStudyPlanTemplateApi(form.id, {
        description: form.description || null,
        duration_days: form.duration_days,
        is_active: form.is_active,
        name: form.name.trim(),
      });
    } else {
      const payload: CreateStudyPlanTemplateParams = {
        description: form.description || null,
        domain: form.domain,
        duration_days: form.duration_days,
        is_active: form.is_active,
        items: buildItems(),
        name: form.name.trim(),
      };
      await createStudyPlanTemplateApi(payload);
    }

    message.success('模板已保存');
    modalOpen.value = false;
    await loadTemplates();
  } catch (error: any) {
    message.warning(error?.message || '模板保存失败');
  } finally {
    submitting.value = false;
  }
}

async function openDetail(
  template: Record<string, unknown> | StudyPlanTemplateDetail,
) {
  const targetTemplate = template as StudyPlanTemplateDetail;
  detailOpen.value = true;
  await loadDetail(targetTemplate.id);
}

async function loadDetail(templateId: number) {
  detailLoading.value = true;
  try {
    detail.value = await getStudyPlanTemplateApi(templateId);
  } finally {
    detailLoading.value = false;
  }
}

function resetItemForm() {
  Object.assign(itemForm, createDefaultPracticeSourceFields());
  itemForm.ability_key = '';
  itemForm.ability_params = {};
  itemForm.ability_title = '';
  itemForm.ability_url = '';
  itemForm.cloud_links = [];
  itemForm.day_index = 1;
  itemForm.expected_minutes = 15;
  itemForm.extra_json = '';
  itemForm.id = undefined;
  itemForm.module_type = 'review';
  itemForm.order_index = detail.value?.items.length ?? 0;
  itemForm.ref_id = null;
  itemForm.ref_type = 'content';
  itemForm.title = '';
}

function openCreateTemplateItem() {
  if (!detail.value) {
    return;
  }

  resetItemForm();
  itemModalOpen.value = true;
}

function openEditTemplateItem(
  item: Record<string, unknown> | StudyPlanTemplateItemDetail,
) {
  const targetItem = item as StudyPlanTemplateItemDetail;
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
  itemForm.day_index = targetItem.day_index;
  itemForm.expected_minutes = targetItem.expected_minutes ?? 15;
  itemForm.extra_json = moduleTarget.extraJson;
  itemForm.id = targetItem.id;
  itemForm.module_type = targetItem.module_type;
  itemForm.order_index = targetItem.order_index;
  itemForm.ref_id = targetItem.ref_id ?? null;
  itemForm.ref_type = targetItem.ref_type;
  itemForm.target_accuracy_percent = moduleTarget.accuracyPercent;
  itemForm.target_question_count = moduleTarget.questionCount;
  itemForm.title = targetItem.title;
  itemModalOpen.value = true;
}

function resolveModuleTarget(
  moduleType: StudyPlanTemplateItemParams['module_type'],
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

async function submitTemplateItem() {
  if (!detail.value) {
    message.warning('请先选择模板');
    return;
  }

  itemSubmitting.value = true;
  try {
    const payload = buildItemPayload(itemForm);
    if (itemForm.id) {
      await updateStudyPlanTemplateItemApi(itemForm.id, payload);
    } else {
      await createStudyPlanTemplateItemApi(detail.value.id, payload);
    }

    message.success('模板项已保存');
    itemModalOpen.value = false;
    await loadDetail(detail.value.id);
    await loadTemplates();
  } catch (error: any) {
    message.warning(error?.message || '模板项保存失败');
  } finally {
    itemSubmitting.value = false;
  }
}

async function deleteTemplateItem(
  item: Record<string, unknown> | StudyPlanTemplateItemDetail,
) {
  if (!detail.value) {
    return;
  }

  const targetItem = item as StudyPlanTemplateItemDetail;
  await deleteStudyPlanTemplateItemApi(targetItem.id);
  message.success('模板项已删除');
  await loadDetail(detail.value.id);
}

function formatDateTime(value?: string) {
  return value ? value.replace('T', ' ').slice(0, 19) : '-';
}

function formatExtra(value?: null | Record<string, unknown>) {
  const text = stringifyJson(value);
  return text || '-';
}

function formatAdvancedExtra(
  moduleType: StudyPlanTemplateItemParams['module_type'],
  value?: null | Record<string, unknown>,
) {
  if (moduleType === 'practice') {
    return splitPracticeTargetExtra(value).extraJson || '-';
  }
  if (moduleType === 'ability') {
    return splitAbilityTargetExtra(value).extraJson || '-';
  }
  if (moduleType === 'resource') {
    return splitResourceTargetExtra(value).extraJson || '-';
  }

  return formatExtra(value);
}

onMounted(() => {
  void loadTemplates();
  void loadAbilityCatalog();
});
</script>

<template>
  <Page auto-content-height>
    <div class="study-template-page">
      <a-alert
        message="当前后端模板列表只返回启用模板；模板项仅支持创建模板时一次性写入。"
        show-icon
        type="info"
      />

      <a-card size="small">
        <div class="toolbar">
          <a-button :loading="loading" @click="loadTemplates">刷新</a-button>
          <a-button type="primary" @click="openCreate">新建模板</a-button>
        </div>
      </a-card>

      <a-card size="small">
        <a-table
          :columns="columns"
          :data-source="templates"
          :loading="loading"
          :pagination="false"
          row-key="id"
          :scroll="{ x: 1050 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'is_active'">
              <a-tag :color="record.is_active ? 'success' : 'default'">
                {{ record.is_active ? '启用' : '停用' }}
              </a-tag>
            </template>
            <template v-else-if="column.dataIndex === 'created_time'">
              {{ formatDateTime(record.created_time) }}
            </template>
            <template v-else-if="column.dataIndex === 'operation'">
              <a-button type="link" @click="openDetail(record)">详情</a-button>
              <a-button type="link" @click="openEdit(record)">编辑</a-button>
            </template>
          </template>
        </a-table>
      </a-card>
    </div>

    <a-modal
      v-model:open="modalOpen"
      :confirm-loading="submitting"
      :title="modalTitle"
      width="980px"
      @ok="submitTemplate"
    >
      <a-form layout="vertical">
        <div class="form-grid">
          <a-form-item label="模板名称" required>
            <a-input v-model:value="form.name" />
          </a-form-item>
          <a-form-item label="覆盖天数" required>
            <a-input-number
              v-model:value="form.duration_days"
              :min="1"
              style="width: 100%"
            />
          </a-form-item>
          <a-form-item label="业务领域">
            <a-input v-model:value="form.domain" :disabled="Boolean(form.id)" />
          </a-form-item>
          <a-form-item label="启用状态">
            <a-switch
              v-model:checked="form.is_active"
              checked-children="启用"
              un-checked-children="停用"
            />
          </a-form-item>
        </div>
        <a-form-item label="模板说明">
          <a-textarea v-model:value="form.description" :rows="3" />
        </a-form-item>

        <template v-if="!form.id">
          <a-divider>初始模板项</a-divider>
          <div class="template-items">
            <div
              v-for="(item, index) in itemForms"
              :key="index"
              class="template-item"
            >
              <div class="template-item-head">
                <span>模板项 {{ index + 1 }}</span>
                <a-button
                  v-if="itemForms.length > 1"
                  danger
                  size="small"
                  type="link"
                  @click="removeTemplateItem(index)"
                >
                  移除
                </a-button>
              </div>
              <a-form layout="vertical">
                <a-form-item label="标题" required>
                  <a-input v-model:value="item.title" />
                </a-form-item>
                <div class="form-grid">
                  <a-form-item label="第几天" required>
                    <a-input-number
                      v-model:value="item.day_index"
                      :max="form.duration_days"
                      :min="1"
                      style="width: 100%"
                    />
                  </a-form-item>
                  <a-form-item label="当天顺序" required>
                    <a-input-number
                      v-model:value="item.order_index"
                      :min="0"
                      style="width: 100%"
                    />
                  </a-form-item>
                  <a-form-item label="模块类型" required>
                    <a-select
                      v-model:value="item.module_type"
                      :options="moduleOptions"
                      @change="applyTemplateItemModuleDefaults(item)"
                    />
                  </a-form-item>
                  <a-form-item
                    v-if="
                      !isPracticeTemplateItem(item) &&
                      !isResourceTemplateItem(item)
                    "
                    label="引用类型"
                    required
                  >
                    <a-select
                      v-model:value="item.ref_type"
                      :options="refTypeOptions"
                    />
                  </a-form-item>
                  <a-form-item
                    v-if="
                      !isPracticeTemplateItem(item) &&
                      !isResourceTemplateItem(item)
                    "
                    label="引用 ID"
                  >
                    <ContentRefPicker
                      v-if="item.ref_type === 'content'"
                      v-model:value="item.ref_id"
                      app-code="gongkao"
                    />
                    <a-input-number
                      v-else
                      v-model:value="item.ref_id"
                      :min="1"
                      style="width: 100%"
                    />
                  </a-form-item>
                  <a-form-item label="预计分钟">
                    <a-input-number
                      v-model:value="item.expected_minutes"
                      :min="0"
                      style="width: 100%"
                    />
                  </a-form-item>
                </div>
                <PracticeSourceBuilder
                  v-if="isPracticeTemplateItem(item)"
                  :form="item"
                />
                <div v-if="isAbilityTemplateItem(item)" class="target-panel">
                  <div class="target-panel-title">能力目标</div>
                  <a-form-item label="能力练习" required>
                    <a-select
                      v-model:value="item.ability_key"
                      :options="abilityOptions"
                      option-filter-prop="label"
                      placeholder="选择小程序能力练习"
                      show-search
                      @change="
                        (value) => handleAbilityCatalogChange(item, value)
                      "
                    />
                  </a-form-item>
                  <div class="form-grid">
                    <a-form-item label="目标题数">
                      <a-input-number
                        v-model:value="item.target_question_count"
                        :min="1"
                        :precision="0"
                        style="width: 100%"
                      />
                    </a-form-item>
                    <a-form-item label="目标正确率（%）">
                      <a-input-number
                        v-model:value="item.target_accuracy_percent"
                        :max="100"
                        :min="0"
                        :precision="1"
                        style="width: 100%"
                      />
                    </a-form-item>
                  </div>
                  <AbilityParamFields
                    v-model="item.ability_params"
                    :schema="
                      findAbilityCatalogItem(item.ability_key)?.param_schema ??
                      null
                    "
                  />
                </div>
                <div v-if="isResourceTemplateItem(item)" class="target-panel">
                  <div class="target-panel-title">网盘资源</div>
                  <CloudLinksEditor v-model="item.cloud_links" />
                </div>
                <a-form-item label="高级配置 JSON">
                  <a-textarea
                    v-model:value="item.extra_json"
                    :rows="3"
                    placeholder='例如 {"knowledge_points":["资料分析"],"question_ids":[1,2,3]}'
                  />
                </a-form-item>
              </a-form>
            </div>
          </div>
          <a-button block @click="addTemplateItem">添加模板项</a-button>
        </template>
      </a-form>
    </a-modal>

    <a-drawer
      v-model:open="detailOpen"
      destroy-on-close
      placement="right"
      title="模板详情"
      width="900px"
    >
      <a-spin :spinning="detailLoading">
        <template v-if="detail">
          <ADescriptions bordered size="small" :column="2">
            <ADescriptionsItem label="模板 ID">
              {{ detail.id }}
            </ADescriptionsItem>
            <ADescriptionsItem label="状态">
              <a-tag :color="detail.is_active ? 'success' : 'default'">
                {{ detail.is_active ? '启用' : '停用' }}
              </a-tag>
            </ADescriptionsItem>
            <ADescriptionsItem label="名称">
              {{ detail.name }}
            </ADescriptionsItem>
            <ADescriptionsItem label="天数">
              {{ detail.duration_days }}
            </ADescriptionsItem>
            <ADescriptionsItem label="领域">
              {{ detail.domain }}
            </ADescriptionsItem>
            <ADescriptionsItem label="创建人">
              {{ detail.created_by }}
            </ADescriptionsItem>
            <ADescriptionsItem label="说明" :span="2">
              {{ detail.description || '-' }}
            </ADescriptionsItem>
          </ADescriptions>

          <div class="drawer-section-head">
            <span class="drawer-section-title">模板项</span>
            <a-button type="primary" @click="openCreateTemplateItem">
              新增模板项
            </a-button>
          </div>
          <a-table
            :columns="itemColumns"
            :data-source="detail.items"
            :pagination="false"
            row-key="id"
            size="small"
            :scroll="{ x: 1250 }"
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
              <template v-else-if="column.dataIndex === 'target'">
                {{ formatModuleTarget(record.module_type, record.extra) }}
              </template>
              <template v-else-if="column.dataIndex === 'extra'">
                <a-typography-paragraph
                  :copyable="
                    formatAdvancedExtra(record.module_type, record.extra) !==
                    '-'
                  "
                  :ellipsis="{ rows: 2, expandable: true, symbol: '展开' }"
                >
                  {{ formatAdvancedExtra(record.module_type, record.extra) }}
                </a-typography-paragraph>
              </template>
              <template v-else-if="column.dataIndex === 'operation'">
                <a-button type="link" @click="openEditTemplateItem(record)">
                  编辑
                </a-button>
                <a-popconfirm
                  title="确定删除该模板项？"
                  @confirm="deleteTemplateItem(record)"
                >
                  <a-button danger type="link">删除</a-button>
                </a-popconfirm>
              </template>
            </template>
          </a-table>
        </template>
      </a-spin>
    </a-drawer>

    <a-modal
      v-model:open="itemModalOpen"
      :confirm-loading="itemSubmitting"
      :title="itemForm.id ? '编辑模板项' : '新增模板项'"
      width="720px"
      :z-index="1100"
      @ok="submitTemplateItem"
    >
      <a-form layout="vertical">
        <a-form-item label="标题" required>
          <a-input v-model:value="itemForm.title" />
        </a-form-item>
        <div class="form-grid">
          <a-form-item label="第几天" required>
            <a-input-number
              v-model:value="itemForm.day_index"
              :max="detail?.duration_days"
              :min="1"
              style="width: 100%"
            />
          </a-form-item>
          <a-form-item label="当天顺序" required>
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
              @change="applyTemplateItemModuleDefaults(itemForm)"
            />
          </a-form-item>
          <a-form-item
            v-if="
              !isPracticeTemplateItem(itemForm) &&
              !isResourceTemplateItem(itemForm)
            "
            label="引用类型"
            required
          >
            <a-select
              v-model:value="itemForm.ref_type"
              :options="refTypeOptions"
            />
          </a-form-item>
          <a-form-item
            v-if="
              !isPracticeTemplateItem(itemForm) &&
              !isResourceTemplateItem(itemForm)
            "
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
        </div>
        <PracticeSourceBuilder
          v-if="isPracticeTemplateItem(itemForm)"
          :form="itemForm"
        />
        <div v-if="isAbilityTemplateItem(itemForm)" class="target-panel">
          <div class="target-panel-title">能力目标</div>
          <a-form-item label="能力练习" required>
            <a-select
              v-model:value="itemForm.ability_key"
              :options="abilityOptions"
              option-filter-prop="label"
              placeholder="选择小程序能力练习"
              show-search
              @change="(value) => handleAbilityCatalogChange(itemForm, value)"
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
        </div>
        <div v-if="isResourceTemplateItem(itemForm)" class="target-panel">
          <div class="target-panel-title">网盘资源</div>
          <CloudLinksEditor v-model="itemForm.cloud_links" />
        </div>
        <a-form-item label="高级配置 JSON">
          <a-textarea
            v-model:value="itemForm.extra_json"
            :rows="4"
            placeholder='例如 {"knowledge_points":["资料分析"],"question_ids":[1,2,3]}'
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </Page>
</template>

<style scoped>
.study-template-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toolbar {
  display: flex;
  gap: 10px;
  align-items: center;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.template-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 48vh;
  padding-right: 4px;
  overflow: auto;
}

.template-item {
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
}

.template-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  font-weight: 600;
}

.target-panel {
  padding: 12px;
  margin-bottom: 16px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
}

.target-panel-title {
  margin-bottom: 8px;
  font-weight: 600;
}

.drawer-section-head {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin: 16px 0 12px;
}

.drawer-section-title {
  font-size: 15px;
  font-weight: 600;
  color: rgb(0 0 0 / 85%);
}
</style>
