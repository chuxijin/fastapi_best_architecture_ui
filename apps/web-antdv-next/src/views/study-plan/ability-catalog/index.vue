<script lang="ts" setup>
import type { SysCategoryTreeResult } from '#/api/category';
import type {
  CreateStudyAbilityCatalogParams,
  StudyAbilityBindingRole,
  StudyAbilityCategoryBindingDetail,
  StudyPlanAbilityCatalogItem,
} from '#/api/study-plan';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { message, TreeSelect } from 'ant-design-vue';

import { getSysCategoryTreeApi } from '#/api/category';
import {
  createStudyAbilityBindingApi,
  createStudyAbilityCatalogApi,
  deleteStudyAbilityBindingApi,
  deleteStudyAbilityCatalogApi,
  getStudyAbilityBindingsApi,
  getStudyPlanAbilityCatalogApi,
  updateStudyAbilityBindingApi,
  updateStudyAbilityCatalogApi,
} from '#/api/study-plan';

import { parseJsonObject, stringifyJson } from '../common';

interface CatalogFilter {
  domain: string;
  include_inactive: boolean;
  keyword: string;
}

interface CatalogForm {
  ability_key: string;
  benchmark_seconds?: null | number;
  category: string;
  default_accuracy_percent?: null | number;
  default_minutes: number;
  default_question_count?: null | number;
  description?: null | string;
  domain: string;
  extra_json: string;
  id?: null | number;
  is_active: boolean;
  supports_result: boolean;
  supports_study_plan: boolean;
  title: string;
  url: string;
}

interface BindingForm {
  category_id?: null | number;
  confidence: number;
  id?: null | number;
  is_primary: boolean;
  mode?: null | string;
  role: StudyAbilityBindingRole;
  source: string;
  weight: number;
}

interface CategoryTreeOption {
  children?: CategoryTreeOption[];
  key: number;
  label: string;
  title: string;
  value: number;
}

const treeShowChildStrategy = TreeSelect.SHOW_CHILD;

const filter = reactive<CatalogFilter>({
  domain: 'civil_service',
  include_inactive: true,
  keyword: '',
});

const catalogForm = reactive<CatalogForm>(createDefaultCatalogForm());
const bindingForm = reactive<BindingForm>(createDefaultBindingForm());

const catalogList = ref<StudyPlanAbilityCatalogItem[]>([]);
const bindingList = ref<StudyAbilityCategoryBindingDetail[]>([]);
const categoryTree = ref<CategoryTreeOption[]>([]);
const categoryNameMap = ref<Map<number, string>>(new Map());
const selectedAbilityKey = ref('');
const selectedCatalog = ref<null | StudyPlanAbilityCatalogItem>(null);
const catalogLoading = ref(false);
const bindingLoading = ref(false);
const categoryLoading = ref(false);
const catalogModalOpen = ref(false);
const catalogSubmitting = ref(false);
const bindingModalOpen = ref(false);
const bindingSubmitting = ref(false);

const roleOptions: Array<{
  color: string;
  label: string;
  value: StudyAbilityBindingRole;
}> = [
  { color: 'blue', label: '知识点', value: 'knowledge_point' },
  { color: 'purple', label: '解题思路', value: 'solution_method' },
  { color: 'cyan', label: '能力节点', value: 'ability' },
];

const catalogColumns = [
  { dataIndex: 'title', title: '能力', minWidth: 240 },
  { dataIndex: 'category', title: '分类', width: 120 },
  { dataIndex: 'default_minutes', title: '分钟', width: 80 },
  { dataIndex: 'target', title: '目标', width: 150 },
  { dataIndex: 'benchmark_seconds', title: '速度基准', width: 110 },
  { dataIndex: 'is_active', title: '状态', width: 90 },
  {
    dataIndex: 'operation',
    fixed: 'right' as const,
    title: '操作',
    width: 170,
  },
];

const bindingColumns = [
  { dataIndex: 'category_name', title: '分类节点', minWidth: 220 },
  { dataIndex: 'category_type', title: '类型', width: 120 },
  { dataIndex: 'role', title: '角色', width: 120 },
  { dataIndex: 'mode', title: '模式', width: 120 },
  { dataIndex: 'weight', title: '权重', width: 90 },
  { dataIndex: 'confidence', title: '置信度', width: 100 },
  { dataIndex: 'is_primary', title: '主节点', width: 90 },
  { dataIndex: 'source', title: '来源', width: 100 },
  {
    dataIndex: 'operation',
    fixed: 'right' as const,
    title: '操作',
    width: 150,
  },
];

const catalogModalTitle = computed(() =>
  catalogForm.id ? '编辑能力目录' : '新增能力目录',
);

const bindingModalTitle = computed(() =>
  bindingForm.id ? '编辑分类绑定' : '新增分类绑定',
);

const selectedCatalogTitle = computed(() => {
  if (!selectedCatalog.value) {
    return '分类绑定';
  }
  return `${selectedCatalog.value.title} 分类绑定`;
});

function createDefaultCatalogForm(): CatalogForm {
  return {
    ability_key: '',
    benchmark_seconds: null,
    category: '',
    default_accuracy_percent: null,
    default_minutes: 0,
    default_question_count: null,
    description: '',
    domain: 'civil_service',
    extra_json: '',
    id: null,
    is_active: true,
    supports_result: true,
    supports_study_plan: true,
    title: '',
    url: '',
  };
}

function createDefaultBindingForm(): BindingForm {
  return {
    category_id: null,
    confidence: 1,
    id: null,
    is_primary: false,
    mode: '',
    role: 'ability',
    source: 'manual',
    weight: 1,
  };
}

function resetCatalogForm() {
  Object.assign(catalogForm, createDefaultCatalogForm());
  catalogForm.domain = filter.domain || 'civil_service';
}

function resetBindingForm() {
  Object.assign(bindingForm, createDefaultBindingForm());
}

function toPercent(value?: null | number) {
  if (value === null || value === undefined) {
    return null;
  }
  return Math.round(value * 1000) / 10;
}

function toDecimal(value?: null | number) {
  if (value === null || value === undefined) {
    return null;
  }
  return Math.round(value * 10) / 1000;
}

function formatPercent(value?: null | number) {
  if (value === null || value === undefined) {
    return '-';
  }
  return `${Math.round(value * 1000) / 10}%`;
}

function formatRatio(value?: null | number) {
  if (value === null || value === undefined) {
    return '-';
  }
  return Math.round(value * 100) / 100;
}

function findRoleOption(role?: StudyAbilityBindingRole) {
  return roleOptions.find((item) => item.value === role);
}

function asCatalog(
  record: Record<string, unknown> | StudyPlanAbilityCatalogItem,
) {
  return record as StudyPlanAbilityCatalogItem;
}

function asBinding(
  record: Record<string, unknown> | StudyAbilityCategoryBindingDetail,
) {
  return record as StudyAbilityCategoryBindingDetail;
}

function getCategoryLabel(
  record: Record<string, unknown> | StudyAbilityCategoryBindingDetail,
) {
  const binding = asBinding(record);
  return (
    binding.category_name ||
    binding.category_code ||
    `分类 #${binding.category_id}`
  );
}

function buildCatalogPayload(): CreateStudyAbilityCatalogParams {
  if (!catalogForm.ability_key.trim()) {
    throw new Error('请填写能力标识');
  }
  if (!catalogForm.title.trim()) {
    throw new Error('请填写能力名称');
  }
  if (!catalogForm.category.trim()) {
    throw new Error('请填写能力分类');
  }
  if (!catalogForm.url.trim()) {
    throw new Error('请填写小程序入口 URL');
  }

  return {
    ability_key: catalogForm.ability_key.trim(),
    benchmark_seconds: catalogForm.benchmark_seconds ?? null,
    category: catalogForm.category.trim(),
    default_accuracy: toDecimal(catalogForm.default_accuracy_percent),
    default_minutes: catalogForm.default_minutes ?? 0,
    default_question_count: catalogForm.default_question_count ?? null,
    description: catalogForm.description?.trim() || null,
    domain: catalogForm.domain.trim() || 'civil_service',
    extra: parseJsonObject(catalogForm.extra_json),
    is_active: catalogForm.is_active,
    supports_result: catalogForm.supports_result,
    supports_study_plan: catalogForm.supports_study_plan,
    title: catalogForm.title.trim(),
    url: catalogForm.url.trim(),
  };
}

function convertCategoryTree(items: SysCategoryTreeResult[]) {
  const nameMap = new Map<number, string>();

  const walk = (nodes: SysCategoryTreeResult[]): CategoryTreeOption[] =>
    nodes.map((item) => {
      const typeText = item.type ? ` · ${item.type}` : '';
      const codeText = item.code ? ` · ${item.code}` : '';
      const title = `${item.name}${typeText}${codeText}`;
      nameMap.set(item.id, title);
      return {
        key: item.id,
        label: title,
        title,
        value: item.id,
        children: item.children?.length ? walk(item.children) : undefined,
      };
    });

  const tree = walk(items);
  categoryNameMap.value = nameMap;
  return tree;
}

async function loadCatalog() {
  catalogLoading.value = true;
  try {
    catalogList.value = await getStudyPlanAbilityCatalogApi({
      domain: filter.domain || undefined,
      include_inactive: filter.include_inactive,
      keyword: filter.keyword || undefined,
    });
    if (!selectedAbilityKey.value && catalogList.value.length > 0) {
      selectCatalog(catalogList.value[0]);
    } else if (selectedAbilityKey.value) {
      const nextSelected = catalogList.value.find(
        (item) => item.key === selectedAbilityKey.value,
      );
      selectedCatalog.value = nextSelected ?? null;
      if (!nextSelected) {
        selectedAbilityKey.value = '';
        bindingList.value = [];
      }
    }
  } finally {
    catalogLoading.value = false;
  }
}

async function loadBindings() {
  if (!selectedAbilityKey.value) {
    bindingList.value = [];
    return;
  }

  bindingLoading.value = true;
  try {
    bindingList.value = await getStudyAbilityBindingsApi({
      ability_key: selectedAbilityKey.value,
    });
  } finally {
    bindingLoading.value = false;
  }
}

async function loadCategoryTree() {
  categoryLoading.value = true;
  try {
    const tree = await getSysCategoryTreeApi({
      app_code: 'youanshang',
      status: true,
    });
    categoryTree.value = convertCategoryTree(tree);
  } catch {
    categoryTree.value = [];
    message.warning('分类树加载失败');
  } finally {
    categoryLoading.value = false;
  }
}

function selectCatalog(
  record: Record<string, unknown> | StudyPlanAbilityCatalogItem,
) {
  const catalog = asCatalog(record);
  selectedAbilityKey.value = catalog.key;
  selectedCatalog.value = catalog;
  void loadBindings();
}

function openCreateCatalog() {
  resetCatalogForm();
  catalogModalOpen.value = true;
}

function fillCatalogForm(record: StudyPlanAbilityCatalogItem) {
  catalogForm.ability_key = record.key;
  catalogForm.benchmark_seconds = record.benchmark_seconds ?? null;
  catalogForm.category = record.category;
  catalogForm.default_accuracy_percent = toPercent(record.default_accuracy);
  catalogForm.default_minutes = record.default_minutes;
  catalogForm.default_question_count = record.default_question_count ?? null;
  catalogForm.description = record.description || '';
  catalogForm.domain = record.domain;
  catalogForm.extra_json = stringifyJson(record.extra);
  catalogForm.id = record.id ?? null;
  catalogForm.is_active = record.is_active;
  catalogForm.supports_result = record.supports_result;
  catalogForm.supports_study_plan = record.supports_study_plan;
  catalogForm.title = record.title;
  catalogForm.url = record.url;
}

function openEditCatalog(
  record: Record<string, unknown> | StudyPlanAbilityCatalogItem,
) {
  fillCatalogForm(asCatalog(record));
  catalogModalOpen.value = true;
}

function openPersistCatalog(
  record: Record<string, unknown> | StudyPlanAbilityCatalogItem,
) {
  fillCatalogForm(asCatalog(record));
  catalogForm.id = null;
  catalogModalOpen.value = true;
}

async function submitCatalog() {
  catalogSubmitting.value = true;
  try {
    const payload = buildCatalogPayload();
    if (catalogForm.id) {
      await updateStudyAbilityCatalogApi(catalogForm.id, payload);
      message.success('能力目录已更新');
    } else {
      await createStudyAbilityCatalogApi(payload);
      message.success('能力目录已保存');
    }
    catalogModalOpen.value = false;
    await loadCatalog();
  } catch (error: any) {
    message.warning(error?.message || '能力目录保存失败');
  } finally {
    catalogSubmitting.value = false;
  }
}

async function deleteCatalog(
  record: Record<string, unknown> | StudyPlanAbilityCatalogItem,
) {
  const catalog = asCatalog(record);
  if (!catalog.id) {
    message.warning('静态兜底目录无需删除');
    return;
  }

  await deleteStudyAbilityCatalogApi(catalog.id);
  message.success('能力目录已删除');
  if (selectedAbilityKey.value === catalog.key) {
    selectedAbilityKey.value = '';
    selectedCatalog.value = null;
    bindingList.value = [];
  }
  await loadCatalog();
}

function openCreateBinding() {
  if (!selectedAbilityKey.value) {
    message.warning('请先选择能力目录');
    return;
  }
  resetBindingForm();
  bindingModalOpen.value = true;
}

function openEditBinding(
  record: Record<string, unknown> | StudyAbilityCategoryBindingDetail,
) {
  const binding = asBinding(record);
  bindingForm.category_id = binding.category_id;
  bindingForm.confidence = binding.confidence;
  bindingForm.id = binding.id;
  bindingForm.is_primary = binding.is_primary;
  bindingForm.mode = binding.mode ?? '';
  bindingForm.role = binding.role;
  bindingForm.source = binding.source;
  bindingForm.weight = binding.weight;
  bindingModalOpen.value = true;
}

async function submitBinding() {
  if (!selectedAbilityKey.value) {
    message.warning('请先选择能力目录');
    return;
  }
  if (!bindingForm.category_id) {
    message.warning('请选择分类节点');
    return;
  }

  bindingSubmitting.value = true;
  try {
    const payload = {
      category_id: bindingForm.category_id,
      confidence: bindingForm.confidence,
      is_primary: bindingForm.is_primary,
      mode: bindingForm.mode?.trim() || null,
      role: bindingForm.role,
      source: bindingForm.source.trim() || 'manual',
      weight: bindingForm.weight,
    };
    if (bindingForm.id) {
      await updateStudyAbilityBindingApi(bindingForm.id, payload);
      message.success('分类绑定已更新');
    } else {
      await createStudyAbilityBindingApi({
        ability_key: selectedAbilityKey.value,
        ...payload,
      });
      message.success('分类绑定已保存');
    }
    bindingModalOpen.value = false;
    await loadBindings();
  } finally {
    bindingSubmitting.value = false;
  }
}

async function deleteBinding(
  record: Record<string, unknown> | StudyAbilityCategoryBindingDetail,
) {
  const binding = asBinding(record);
  await deleteStudyAbilityBindingApi(binding.id);
  message.success('分类绑定已删除');
  await loadBindings();
}

onMounted(() => {
  void loadCatalog();
  void loadCategoryTree();
});
</script>

<template>
  <Page auto-content-height>
    <div class="ability-catalog-page">
      <a-card size="small">
        <div class="toolbar">
          <a-input
            v-model:value="filter.domain"
            allow-clear
            placeholder="业务领域"
            style="width: 180px"
            @press-enter="loadCatalog"
          />
          <a-input-search
            v-model:value="filter.keyword"
            allow-clear
            placeholder="能力名称 / key / 分类"
            style="width: 260px"
            @search="loadCatalog"
          />
          <a-checkbox v-model:checked="filter.include_inactive">
            包含停用
          </a-checkbox>
          <a-button :loading="catalogLoading" @click="loadCatalog">
            刷新
          </a-button>
          <a-button type="primary" @click="openCreateCatalog">
            新增能力
          </a-button>
        </div>
      </a-card>

      <div class="workbench">
        <a-card size="small" title="能力目录">
          <a-table
            :columns="catalogColumns"
            :data-source="catalogList"
            :loading="catalogLoading"
            :pagination="{ pageSize: 12, showSizeChanger: true }"
            row-key="key"
            size="small"
            :row-class-name="
              (record) =>
                record.key === selectedAbilityKey ? 'selected-row' : ''
            "
            :scroll="{ x: 960 }"
            @row="(record) => ({ onClick: () => selectCatalog(record) })"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'title'">
                <div class="catalog-title">
                  <span>{{ record.title }}</span>
                  <a-tag v-if="record.is_persisted" color="green">已落库</a-tag>
                  <a-tag v-else>静态</a-tag>
                  <div class="catalog-key">{{ record.key }}</div>
                </div>
              </template>
              <template v-else-if="column.dataIndex === 'target'">
                <div class="target-cell">
                  <span>{{ record.default_question_count ?? '-' }} 题</span>
                  <span>{{ formatPercent(record.default_accuracy) }}</span>
                </div>
              </template>
              <template v-else-if="column.dataIndex === 'benchmark_seconds'">
                {{
                  record.benchmark_seconds
                    ? `${record.benchmark_seconds}s`
                    : '-'
                }}
              </template>
              <template v-else-if="column.dataIndex === 'is_active'">
                <a-tag :color="record.is_active ? 'success' : 'default'">
                  {{ record.is_active ? '启用' : '停用' }}
                </a-tag>
              </template>
              <template v-else-if="column.dataIndex === 'operation'">
                <a-button
                  v-if="record.is_persisted"
                  type="link"
                  @click.stop="openEditCatalog(record)"
                >
                  编辑
                </a-button>
                <a-button
                  v-else
                  type="link"
                  @click.stop="openPersistCatalog(record)"
                >
                  落库
                </a-button>
                <a-popconfirm
                  v-if="record.is_persisted"
                  title="确定删除该能力目录？"
                  @confirm="deleteCatalog(record)"
                >
                  <a-button danger type="link" @click.stop>删除</a-button>
                </a-popconfirm>
              </template>
            </template>
          </a-table>
        </a-card>

        <a-card :title="selectedCatalogTitle" size="small">
          <template #extra>
            <a-button
              :disabled="!selectedAbilityKey"
              size="small"
              type="primary"
              @click="openCreateBinding"
            >
              新增绑定
            </a-button>
          </template>
          <a-empty v-if="!selectedAbilityKey" description="请选择能力目录" />
          <a-table
            v-else
            :columns="bindingColumns"
            :data-source="bindingList"
            :loading="bindingLoading"
            :pagination="{ pageSize: 12, showSizeChanger: true }"
            row-key="id"
            size="small"
            :scroll="{ x: 1000 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'category_name'">
                <div class="category-cell">
                  <span>{{ getCategoryLabel(record) }}</span>
                  <a-tag v-if="record.category_code" color="blue">
                    {{ record.category_code }}
                  </a-tag>
                </div>
              </template>
              <template v-else-if="column.dataIndex === 'category_type'">
                <a-tag>{{ record.category_type || '-' }}</a-tag>
              </template>
              <template v-else-if="column.dataIndex === 'role'">
                <a-tag :color="findRoleOption(record.role)?.color">
                  {{ findRoleOption(record.role)?.label ?? record.role }}
                </a-tag>
              </template>
              <template v-else-if="column.dataIndex === 'mode'">
                {{ record.mode || '通用' }}
              </template>
              <template v-else-if="column.dataIndex === 'weight'">
                {{ formatRatio(record.weight) }}
              </template>
              <template v-else-if="column.dataIndex === 'confidence'">
                {{ formatPercent(record.confidence) }}
              </template>
              <template v-else-if="column.dataIndex === 'is_primary'">
                <a-tag :color="record.is_primary ? 'gold' : 'default'">
                  {{ record.is_primary ? '是' : '否' }}
                </a-tag>
              </template>
              <template v-else-if="column.dataIndex === 'operation'">
                <a-button type="link" @click="openEditBinding(record)">
                  编辑
                </a-button>
                <a-popconfirm
                  title="确定删除该绑定？"
                  @confirm="deleteBinding(record)"
                >
                  <a-button danger type="link">删除</a-button>
                </a-popconfirm>
              </template>
            </template>
          </a-table>
        </a-card>
      </div>
    </div>

    <a-modal
      v-model:open="catalogModalOpen"
      :confirm-loading="catalogSubmitting"
      :title="catalogModalTitle"
      width="760px"
      @ok="submitCatalog"
    >
      <a-form layout="vertical">
        <div class="form-grid">
          <a-form-item label="能力标识" required>
            <a-input
              v-model:value="catalogForm.ability_key"
              :disabled="Boolean(catalogForm.id)"
              placeholder="basic_calculation"
            />
          </a-form-item>
          <a-form-item label="业务领域" required>
            <a-input
              v-model:value="catalogForm.domain"
              placeholder="civil_service"
            />
          </a-form-item>
          <a-form-item label="能力名称" required>
            <a-input v-model:value="catalogForm.title" />
          </a-form-item>
          <a-form-item label="能力分类" required>
            <a-input v-model:value="catalogForm.category" />
          </a-form-item>
        </div>
        <a-form-item label="小程序入口 URL" required>
          <a-input v-model:value="catalogForm.url" />
        </a-form-item>
        <a-form-item label="能力说明">
          <a-textarea v-model:value="catalogForm.description" :rows="3" />
        </a-form-item>
        <div class="form-grid">
          <a-form-item label="默认预计分钟">
            <a-input-number
              v-model:value="catalogForm.default_minutes"
              :min="0"
              :precision="0"
              style="width: 100%"
            />
          </a-form-item>
          <a-form-item label="默认题数">
            <a-input-number
              v-model:value="catalogForm.default_question_count"
              :min="1"
              :precision="0"
              style="width: 100%"
            />
          </a-form-item>
          <a-form-item label="默认正确率（%）">
            <a-input-number
              v-model:value="catalogForm.default_accuracy_percent"
              :max="100"
              :min="0"
              :precision="1"
              style="width: 100%"
            />
          </a-form-item>
          <a-form-item label="速度基准秒">
            <a-input-number
              v-model:value="catalogForm.benchmark_seconds"
              :min="0.01"
              :precision="2"
              style="width: 100%"
            />
          </a-form-item>
        </div>
        <div class="switch-row">
          <a-checkbox v-model:checked="catalogForm.supports_study_plan">
            支持学习计划
          </a-checkbox>
          <a-checkbox v-model:checked="catalogForm.supports_result">
            支持自动结算
          </a-checkbox>
          <a-switch
            v-model:checked="catalogForm.is_active"
            checked-children="启用"
            un-checked-children="停用"
          />
        </div>
        <a-form-item label="扩展配置 JSON">
          <a-textarea
            v-model:value="catalogForm.extra_json"
            :rows="4"
            placeholder='例如 {"modes":["normal","hard"]}'
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="bindingModalOpen"
      :confirm-loading="bindingSubmitting"
      :title="bindingModalTitle"
      width="620px"
      @ok="submitBinding"
    >
      <a-form layout="vertical">
        <a-form-item label="分类节点" required>
          <a-tree-select
            v-model:value="bindingForm.category_id"
            :allow-clear="true"
            :loading="categoryLoading"
            :show-checked-strategy="treeShowChildStrategy"
            :tree-data="categoryTree"
            placeholder="选择 sys_category 节点"
            style="width: 100%"
            tree-default-expand-all
            tree-node-filter-prop="title"
            show-search
          />
        </a-form-item>
        <div class="form-grid">
          <a-form-item label="绑定角色" required>
            <a-select v-model:value="bindingForm.role" :options="roleOptions" />
          </a-form-item>
          <a-form-item label="练习模式">
            <a-input
              v-model:value="bindingForm.mode"
              allow-clear
              placeholder="留空表示通用"
            />
          </a-form-item>
          <a-form-item label="权重">
            <a-input-number
              v-model:value="bindingForm.weight"
              :max="10"
              :min="0.0001"
              :precision="4"
              style="width: 100%"
            />
          </a-form-item>
          <a-form-item label="置信度">
            <a-input-number
              v-model:value="bindingForm.confidence"
              :max="1"
              :min="0"
              :precision="4"
              style="width: 100%"
            />
          </a-form-item>
          <a-form-item label="来源">
            <a-input v-model:value="bindingForm.source" />
          </a-form-item>
          <a-form-item label="主分类">
            <a-switch
              v-model:checked="bindingForm.is_primary"
              checked-children="是"
              un-checked-children="否"
            />
          </a-form-item>
        </div>
      </a-form>
    </a-modal>
  </Page>
</template>

<style scoped>
.ability-catalog-page {
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

.workbench {
  display: grid;
  grid-template-columns: minmax(520px, 0.95fr) minmax(520px, 1.05fr);
  gap: 12px;
}

.catalog-title,
.category-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.catalog-key {
  flex-basis: 100%;
  font-size: 12px;
  color: #8c8c8c;
}

.target-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.switch-row {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  align-items: center;
  margin-bottom: 16px;
}

:deep(.selected-row) td {
  background: #e6f4ff !important;
}

@media (max-width: 1200px) {
  .workbench {
    grid-template-columns: 1fr;
  }
}
</style>
