<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  MyDriveFeishuCategorySource,
  MyDriveFeishuSheetConfig,
  MyDriveFeishuSheetConfigPayload,
  MyDriveFeishuSheetTask,
} from '#/api';

import { onMounted, ref } from 'vue';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { AddData } from '@vben/icons';

import { message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createMyDriveFeishuConfigApi,
  createMyDriveFeishuTaskApi,
  deleteMyDriveFeishuConfigApi,
  getMyDriveFeishuCategorySourcesApi,
  getMyDriveFeishuConfigsApi,
  getMyDriveFeishuTasksApi,
  updateMyDriveFeishuConfigApi,
} from '#/api';

import {
  createFeishuConfigColumns,
  createFeishuTaskColumns,
  createSourceWeightRow,
  feishuConfigQuerySchema,
  linesToText,
  rowsToWeights,
  sheetMapToText,
  textToLines,
  textToSheetMap,
  uniqueValues,
  weightsToRows,
} from './data';

const configs = ref<MyDriveFeishuSheetConfig[]>([]);
const tasks = ref<MyDriveFeishuSheetTask[]>([]);
const editingConfig = ref<MyDriveFeishuSheetConfig>();
const selectedTaskConfig = ref<MyDriveFeishuSheetConfig>();
const configDrawerOpen = ref(false);
const savingConfig = ref(false);
const runningId = ref<number>();
/** 可选的 app_code + category_type 组合，来自后端聚合 sys_category */
const categorySources = ref<MyDriveFeishuCategorySource[]>([]);

const configForm = ref({
  app_code: '',
  category_type: 'knowledge_point',
  category_options_text: '',
  cron: null as null | string,
  description: '',
  end_time: null as null | string,
  name: '',
  paid_sheets_text: '',
  sheet_map_text: '',
  sheet_url: '',
  /** 来源选项（名称 + 权重），对齐后端 source_weights */
  source_weights_rows: [
    createSourceWeightRow('网络获取', 5),
    createSourceWeightRow('用户推荐', 4),
    createSourceWeightRow('店铺购买', 1),
  ],
});

/** Cron 语义化：与网盘同步配置保持一致的下拉式构造 */
const cronTypeOptions = [
  { label: '手动执行', value: '' },
  { label: '每天执行', value: 'daily' },
  { label: '每小时执行', value: 'hourly' },
  { label: '每 N 分钟', value: 'n_minutes' },
  { label: '每 N 小时', value: 'n_hours' },
  { label: '每周执行', value: 'weekly' },
  { label: '每月执行', value: 'monthly' },
  { label: '自定义 Cron', value: 'custom' },
];

const weekdayOptions = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 7 },
];

const cronForm = ref({
  cronDay: 1,
  cronHour: 3,
  cronMinute: 0,
  cronType: '',
  cronValue: 10,
  cronWeekday: 1,
});

const cronDescription = computedText(() => {
  const form = cronForm.value;
  if (!configForm.value.cron) return '手动执行';
  if (form.cronType === 'daily')
    return `每天 ${padTime(form.cronHour)}:${padTime(form.cronMinute)} 执行`;
  if (form.cronType === 'hourly') return '每小时执行';
  if (form.cronType === 'n_minutes') return `每 ${form.cronValue} 分钟检查一次`;
  if (form.cronType === 'n_hours') return `每 ${form.cronValue} 小时检查一次`;
  if (form.cronType === 'weekly') {
    return `每周 ${weekdayOptions.find((item) => item.value === form.cronWeekday)?.label} ${padTime(form.cronHour)}:${padTime(form.cronMinute)} 执行`;
  }
  if (form.cronType === 'monthly')
    return `每月 ${form.cronDay} 号 ${padTime(form.cronHour)}:${padTime(form.cronMinute)} 执行`;
  return `自定义：${configForm.value.cron}`;
});

const queryFormOptions: VbenFormProps = {
  collapsed: false,
  schema: feishuConfigQuerySchema,
  showCollapseButton: false,
  // 2 个筛选项 + 2 列给「搜索 / 重置」按钮组（actionLayout 默认 rowEnd，固定占最后两列）
  wrapperClass: 'grid-cols-1 md:grid-cols-4',
};

const gridOptions: VxeTableGridOptions = {
  columns: createFeishuConfigColumns(),
  height: 'auto',
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        try {
          const data = await getMyDriveFeishuConfigsApi({
            page: page.currentPage,
            size: page.pageSize,
            ...formValues,
          });
          configs.value = data.items;
          // 顺带刷新任务状态，用于在列表上展示执行中 / 失败
          const taskData = await getMyDriveFeishuTasksApi({
            page: 1,
            size: 100,
          });
          tasks.value = taskData.items;
          return data;
        } catch {
          message.error('获取导出配置失败');
          return { items: [], total: 0 };
        }
      },
    },
  },
  rowConfig: { keyField: 'id' },
  toolbarConfig: {
    custom: true,
    refresh: true,
    refreshOptions: { code: 'query' },
    zoom: true,
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: queryFormOptions,
  gridOptions,
});

const taskGridOptions: VxeTableGridOptions = {
  columns: createFeishuTaskColumns(getConfigName),
  height: '440px',
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        try {
          const data = await getMyDriveFeishuTasksApi({
            page: page.currentPage,
            size: page.pageSize,
            config_id: selectedTaskConfig.value?.id,
          });
          tasks.value = data.items;
          return data;
        } catch {
          message.error('获取导出任务失败');
          return { items: [], total: 0 };
        }
      },
    },
  },
  rowConfig: { keyField: 'id' },
  toolbarConfig: {
    refresh: true,
    refreshOptions: { code: 'query' },
    zoom: true,
  },
};

const [TaskGrid, taskGridApi] = useVbenVxeGrid({
  gridOptions: taskGridOptions,
});
const [TaskModal, taskModalApi] = useVbenModal({
  class: 'w-11/12 max-w-6xl',
  onOpenChange(isOpen) {
    if (isOpen) taskGridApi.query();
  },
});

onMounted(() => {
  gridApi.query();
  loadCategorySources();
});

async function openConfigDrawer(
  config?: MyDriveFeishuSheetConfig,
): Promise<void> {
  editingConfig.value = config;
  configForm.value = {
    app_code: config?.app_code || '',
    category_type: config?.category_type || 'knowledge_point',
    category_options_text: linesToText(config?.category_options || []),
    cron: config?.cron || null,
    description: config?.description || '',
    end_time: config?.end_time || null,
    name: config?.name || '',
    paid_sheets_text: linesToText(config?.paid_sheets || []),
    sheet_map_text: sheetMapToText(config?.sheet_map || {}),
    sheet_url: config?.sheet_url || '',
    source_weights_rows: weightsToRows(config?.source_weights || {}),
  };
  parseCron(config?.cron || '');
  configDrawerOpen.value = true;
}

function copyConfig(config: MyDriveFeishuSheetConfig): void {
  openConfigDrawer({
    ...config,
    id: 0,
    name: `${config.name} - 副本`,
  });
  editingConfig.value = undefined;
}

async function saveConfig(): Promise<void> {
  const values = configForm.value;
  if (!values.name.trim()) {
    message.warning('请输入配置名称');
    return;
  }
  if (!values.app_code.trim()) {
    message.warning('请输入分类来源（app_code）');
    return;
  }
  if (!values.sheet_url.trim()) {
    message.warning('请输入飞书表格地址');
    return;
  }

  const sheetMap = textToSheetMap(values.sheet_map_text);
  if (Object.keys(sheetMap).length === 0) {
    message.warning('资源类型映射不能为空，否则不会有任何资源被导出');
    return;
  }

  const payload: MyDriveFeishuSheetConfigPayload = {
    app_code: values.app_code.trim(),
    category_options: textToLines(values.category_options_text),
    // 未填时按已选应用取第一个候选，避免把空串传给后端（会覆盖默认值）
    category_type:
      values.category_type.trim() ||
      categorySources.value.find(
        (item) => item.app_code === values.app_code.trim(),
      )?.category_type ||
      'knowledge_point',
    cron: values.cron?.trim() || null,
    description: values.description.trim(),
    end_time: values.end_time || null,
    name: values.name.trim(),
    paid_sheets: textToLines(values.paid_sheets_text),
    sheet_map: sheetMap,
    sheet_url: values.sheet_url.trim(),
    source_weights: rowsToWeights(values.source_weights_rows),
  };

  savingConfig.value = true;
  try {
    if (editingConfig.value) {
      await updateMyDriveFeishuConfigApi(editingConfig.value.id, payload);
      message.success('导出配置已更新');
    } else {
      await createMyDriveFeishuConfigApi(payload);
      message.success('导出配置已创建');
    }
    configDrawerOpen.value = false;
    gridApi.query();
  } catch (error: any) {
    message.error(error?.message || '保存导出配置失败');
  } finally {
    savingConfig.value = false;
  }
}

async function toggleConfigStatus(
  config: MyDriveFeishuSheetConfig,
  checked: boolean,
): Promise<void> {
  try {
    await updateMyDriveFeishuConfigApi(config.id, { is_enabled: checked });
    config.is_enabled = checked;
    message.success(`配置已${checked ? '启用' : '停用'}`);
  } catch (error: any) {
    message.error(error?.message || '状态更新失败');
    gridApi.query();
  }
}

async function runConfig(config: MyDriveFeishuSheetConfig): Promise<void> {
  runningId.value = config.id;
  try {
    await createMyDriveFeishuTaskApi(config.id);
    message.success('导出任务已提交');
    gridApi.query();
    if (selectedTaskConfig.value?.id === config.id) taskGridApi.query();
  } catch (error: any) {
    message.error(error?.message || '提交导出任务失败，可能已有进行中的任务');
  } finally {
    runningId.value = undefined;
  }
}

async function removeConfig(config: MyDriveFeishuSheetConfig): Promise<void> {
  try {
    await deleteMyDriveFeishuConfigApi(config.id);
    message.success('导出配置已删除');
    gridApi.query();
  } catch (error: any) {
    message.error(error?.message || '删除导出配置失败');
  }
}

function showTaskRecords(config?: MyDriveFeishuSheetConfig): void {
  selectedTaskConfig.value = config;
  taskModalApi.open();
  taskGridApi.query();
}

function getConfigName(configId: number): string {
  return (
    configs.value.find((item) => item.id === configId)?.name ||
    `配置 #${configId}`
  );
}

/** 列表上展示「最近一次任务的执行状态」 */
function getExecutionStatus(
  configId: number,
): 'completed' | 'failed' | 'idle' | 'pending' | 'running' {
  const task = tasks.value.find((item) => item.config_id === configId);
  return task?.status === 'cancelled' ? 'idle' : (task?.status ?? 'idle');
}

function taskStatusColor(status: MyDriveFeishuSheetTask['status']): string {
  return (
    {
      cancelled: 'default',
      completed: 'success',
      failed: 'error',
      pending: 'processing',
      running: 'processing',
    }[status] || 'default'
  );
}

/** 统计信息 -> 中文摘要 */
function formatStatistics(statistics: Record<string, any>): string {
  if (!statistics || typeof statistics !== 'object') return '-';
  const parts: string[] = [];
  if (statistics.total_inserted !== undefined)
    parts.push(`新增 ${statistics.total_inserted}`);
  if (statistics.total_updated !== undefined)
    parts.push(`更新 ${statistics.total_updated}`);
  const sheets = Array.isArray(statistics.sheets) ? statistics.sheets : [];
  if (sheets.length > 0) {
    const failedCount = sheets.filter(
      (item: any) => item?.status === 'failed',
    ).length;
    parts.push(`子表 ${sheets.length - failedCount}/${sheets.length}`);
  }
  return parts.length > 0 ? parts.join(' · ') : '-';
}

/** 逐子表统计明细，用于展开查看 */
function formatSheetDetail(statistics: Record<string, any>): string {
  const sheets = Array.isArray(statistics?.sheets) ? statistics.sheets : [];
  if (sheets.length === 0) return '';
  return sheets
    .map((item: any) => {
      const name = item?.sheet ?? '未知子表';
      if (item?.status === 'failed') return `${name}: 失败（${item.error}）`;
      return `${name}: 新增 ${item?.inserted ?? 0} / 更新 ${item?.updated ?? 0}`;
    })
    .join('\n');
}

function padTime(value: number): string {
  return value.toString().padStart(2, '0');
}

/** 应用标识候选：聚合接口数据（同名合并计数），并保留当前已填值 */
const appCodeOptions = computedText(() => {
  const counts = new Map<string, number>();
  for (const item of categorySources.value) {
    counts.set(
      item.app_code,
      (counts.get(item.app_code) || 0) + item.category_count,
    );
  }
  const current = configForm.value.app_code.trim();
  if (current && !counts.has(current)) counts.set(current, 0);
  return [...counts.entries()].map(([appCode, count]) => ({
    label: count > 0 ? `${appCode}（${count} 个分类）` : appCode,
    value: appCode,
  }));
});

/** 分类类型候选：按已选应用过滤；保留当前已填值，避免编辑历史配置时被清空 */
const categoryTypeOptions = computedText(() => {
  const appCode = configForm.value.app_code.trim();
  const matched = categorySources.value.filter(
    (item) => !appCode || item.app_code === appCode,
  );
  const source = matched.length > 0 ? matched : categorySources.value;
  const options = source.map((item) => ({
    label: `${item.category_type}（${item.category_count} 个分类）`,
    value: item.category_type,
  }));
  const current = configForm.value.category_type.trim();
  if (current && !options.some((item) => item.value === current)) {
    options.unshift({ label: current, value: current });
  }
  return options;
});

/** 当前选中来源的提示：分类数为 0 说明这份配置取不到任何资源 */
const selectedSourceHint = computedText(() => {
  const appCode = configForm.value.app_code.trim();
  const categoryType = configForm.value.category_type.trim();
  if (!appCode || !categoryType) return '';
  const matched = categorySources.value.find(
    (item) => item.app_code === appCode && item.category_type === categoryType,
  );
  if (!matched) return '该来源暂未在分类表里找到记录，导出结果可能为空。';
  if (matched.category_count === 0)
    return '该来源下暂无分类，导出结果会是 0 条。';
  const samples = matched.sample_names.join('、');
  return `已识别到 ${matched.category_count} 个分类（如 ${samples}），导出时按这些分类圈定资源。`;
});

/** 切换应用时，若原分类类型不属于新应用，则自动切到该应用下的第一个类型 */
function onAppCodeChange(): void {
  const appCode = configForm.value.app_code.trim();
  const types = categorySources.value
    .filter((item) => item.app_code === appCode)
    .map((item) => item.category_type);
  const firstType = types[0];
  if (firstType === undefined) return;
  if (!types.includes(configForm.value.category_type.trim())) {
    configForm.value.category_type = firstType;
  }
}

async function loadCategorySources(): Promise<void> {
  try {
    categorySources.value = await getMyDriveFeishuCategorySourcesApi();
  } catch {
    // 取不到候选时退化为手输，不阻断页面
    categorySources.value = [];
  }
}

/** 来源下拉的可选项：取自「子表映射」里的资源类型 + 已填过的来源，也允许自定义 */
const sourceOptions = computedText(() => {
  const fromMap = uniqueValues(
    Object.keys(textToSheetMap(configForm.value.sheet_map_text || '')),
  );
  const existing = uniqueValues(
    configForm.value.source_weights_rows.map((row) => row.source),
  );
  return uniqueValues([...fromMap, ...existing]).map((value) => ({
    label: value,
    value,
  }));
});

function addSourceWeight(): void {
  configForm.value.source_weights_rows.push(createSourceWeightRow('', 1));
}

function removeSourceWeight(index: number): void {
  const rows = configForm.value.source_weights_rows;
  if (rows.length <= 1) {
    message.warning('至少保留一个来源选项');
    return;
  }
  rows.splice(index, 1);
}

function updateCronExpression(): void {
  const form = cronForm.value;
  const target = configForm.value;
  if (form.cronType === '') target.cron = null;
  if (form.cronType === 'daily')
    target.cron = `${form.cronMinute} ${form.cronHour} * * *`;
  if (form.cronType === 'hourly') target.cron = '0 * * * *';
  if (form.cronType === 'n_minutes')
    target.cron = `*/${form.cronValue} * * * *`;
  if (form.cronType === 'n_hours') target.cron = `0 */${form.cronValue} * * *`;
  if (form.cronType === 'weekly')
    target.cron = `${form.cronMinute} ${form.cronHour} * * ${form.cronWeekday}`;
  if (form.cronType === 'monthly')
    target.cron = `${form.cronMinute} ${form.cronHour} ${form.cronDay} * *`;
}

function parseCron(cron: string): void {
  const form = cronForm.value;
  form.cronType = '';
  form.cronMinute = 0;
  form.cronHour = 3;
  form.cronDay = 1;
  form.cronWeekday = 1;
  form.cronValue = 10;

  const parts = cron.trim().split(/\s+/);
  if (!cron || parts.length !== 5) {
    if (cron) form.cronType = 'custom';
    return;
  }
  const [minute, hour, day, month, weekday] = parts;
  if (
    minute === '0' &&
    hour === '*' &&
    day === '*' &&
    month === '*' &&
    weekday === '*'
  ) {
    form.cronType = 'hourly';
    return;
  }
  if (
    minute.startsWith('*/') &&
    hour === '*' &&
    day === '*' &&
    month === '*' &&
    weekday === '*'
  ) {
    form.cronType = 'n_minutes';
    form.cronValue = Number(minute.replace('*/', '')) || 10;
    return;
  }
  if (
    minute === '0' &&
    hour.startsWith('*/') &&
    day === '*' &&
    month === '*' &&
    weekday === '*'
  ) {
    form.cronType = 'n_hours';
    form.cronValue = Number(hour.replace('*/', '')) || 2;
    return;
  }
  if (day === '*' && month === '*' && weekday === '*') {
    form.cronType = 'daily';
    form.cronMinute = Number(minute) || 0;
    form.cronHour = Number(hour) || 3;
    return;
  }
  if (day === '*' && month === '*') {
    form.cronType = 'weekly';
    form.cronMinute = Number(minute) || 0;
    form.cronHour = Number(hour) || 3;
    form.cronWeekday = Number(weekday) || 1;
    return;
  }
  if (month === '*' && weekday === '*') {
    form.cronType = 'monthly';
    form.cronMinute = Number(minute) || 0;
    form.cronHour = Number(hour) || 3;
    form.cronDay = Number(day) || 1;
    return;
  }
  form.cronType = 'custom';
}
</script>

<script lang="ts">
import { computed } from 'vue';

/** 小工具：给 setup 里 useXXX 之前的 computed 使用 */
function computedText<T>(getter: () => T) {
  return computed(getter);
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <VbenButton @click="openConfigDrawer()">
          <AddData class="size-5" />
          新增导出配置
        </VbenButton>
        <VbenButton @click="showTaskRecords()">任务记录</VbenButton>
      </template>

      <template #name="{ row }">
        <div class="flex flex-col">
          <span class="font-medium">{{ row.name }}</span>
          <span v-if="row.description" class="text-xs text-gray-500">
            {{ row.description }}
          </span>
        </div>
      </template>

      <template #is_enabled="{ row }">
        <a-switch
          :checked="Boolean(row.is_enabled)"
          @change="(checked: boolean) => toggleConfigStatus(row, checked)"
        />
      </template>

      <template #last_synced_at="{ row }">
        <div class="flex flex-col">
          <span>{{ row.last_synced_at || '尚未同步' }}</span>
          <span
            v-if="getExecutionStatus(row.id) !== 'idle'"
            class="text-xs"
            :class="{
              'text-blue-600': getExecutionStatus(row.id) === 'running',
              'text-gray-400': getExecutionStatus(row.id) === 'pending',
              'text-green-600': getExecutionStatus(row.id) === 'completed',
              'text-red-600': getExecutionStatus(row.id) === 'failed',
            }"
          >
            {{
              {
                completed: '上次已完成',
                failed: '上次失败',
                pending: '等待执行',
                running: '执行中',
              }[
                getExecutionStatus(row.id) as
                  | 'completed'
                  | 'failed'
                  | 'pending'
                  | 'running'
              ] || ''
            }}
          </span>
        </div>
      </template>

      <template #operation="{ row }">
        <div class="flex items-center justify-center gap-2">
          <a-button
            :loading="runningId === row.id"
            size="small"
            type="primary"
            @click="runConfig(row)"
          >
            立即导出
          </a-button>
          <a-button size="small" @click="openConfigDrawer(row)">编辑</a-button>
          <a-button size="small" @click="copyConfig(row)">复制</a-button>
          <a-button size="small" @click="showTaskRecords(row)">记录</a-button>
          <a-popconfirm
            title="确定删除此导出配置？"
            @confirm="removeConfig(row)"
          >
            <a-button danger size="small">删除</a-button>
          </a-popconfirm>
        </div>
      </template>
    </Grid>

    <a-drawer
      v-model:open="configDrawerOpen"
      destroy-on-close
      :title="editingConfig ? '编辑导出配置' : '新增导出配置'"
      size="large"
    >
      <div
        class="mb-4 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700"
      >
        一份配置对应一张飞书表格。导入逻辑不区分业务：只要把「分类来源 +
        资源类型映射」填对，公考、考研等场景可以各自建一份配置并存。
      </div>

      <a-form class="space-y-4" layout="vertical">
        <div class="rounded-lg bg-gray-50 p-4">
          <h3 class="mb-4 text-lg font-medium">基础信息</h3>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <a-form-item label="配置名称" required>
              <a-input
                v-model:value="configForm.name"
                :maxlength="128"
                placeholder="例如：公考"
              />
            </a-form-item>
            <a-form-item label="备注说明">
              <a-input
                v-model:value="configForm.description"
                :maxlength="500"
                placeholder="可选，便于日后辨认"
              />
            </a-form-item>
            <a-form-item label="飞书表格地址" required>
              <a-input
                v-model:value="configForm.sheet_url"
                :maxlength="512"
                placeholder="https://xxx.feishu.cn/sheets/xxxxx"
              />
            </a-form-item>
            <a-form-item label="配置结束时间">
              <a-date-picker
                v-model:value="configForm.end_time"
                class="w-full"
                show-time
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </a-form-item>
          </div>
        </div>

        <div class="rounded-lg bg-gray-50 p-4">
          <h3 class="mb-2 text-lg font-medium">分类来源</h3>
          <p class="mb-4 text-xs text-gray-500">
            决定「哪些资源算这份配置的」。导出时按 app_code + type
            圈定分类集合，再用分类圈定资源；因此不同业务即使资源类型重名
            （公考也有「笔记」、考研也有「笔记」），也不会互相串数据。
          </p>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <a-form-item label="应用（app_code）" required>
              <a-auto-complete
                v-model:value="configForm.app_code"
                :maxlength="64"
                :options="appCodeOptions"
                placeholder="请选择应用，如 youanshang"
                @blur="onAppCodeChange"
                @select="onAppCodeChange"
              />
            </a-form-item>
            <a-form-item label="分类类型（category_type）" required>
              <a-auto-complete
                v-model:value="configForm.category_type"
                :maxlength="64"
                :options="categoryTypeOptions"
                placeholder="请选择分类类型，如 knowledge_point"
              />
            </a-form-item>
          </div>
          <a-alert
            v-if="selectedSourceHint"
            :message="selectedSourceHint"
            class="mt-1"
            show-icon
            type="info"
          />
        </div>

        <div class="rounded-lg bg-gray-50 p-4">
          <h3 class="mb-2 text-lg font-medium">子表映射</h3>
          <p class="mb-4 text-xs text-gray-500">
            每行一条「资源类型=子表名称」。多个资源类型可指向同一子表（会自动合并到同一张
            sheet）。未出现在这里的资源类型不会被导出。
          </p>
          <a-form-item label="资源类型 → 子表" required>
            <a-textarea
              v-model:value="configForm.sheet_map_text"
              :rows="7"
              placeholder="笔记=笔记专栏&#10;真题=真题获取&#10;电子书=干货汇总&#10;软件=干货汇总&#10;其他=干货汇总&#10;干货=干货汇总"
              style="font-family: monospace"
            />
          </a-form-item>
        </div>

        <div class="rounded-lg bg-gray-50 p-4">
          <h3 class="mb-2 text-lg font-medium">表格内容</h3>
          <p class="mb-4 text-xs text-gray-500">
            这三项只影响写进飞书表的「分类下拉框」「来源随机值」，不影响取数范围。
          </p>
          <div class="space-y-4">
            <a-form-item label="分类列下拉选项（每行一项）">
              <a-textarea
                v-model:value="configForm.category_options_text"
                :rows="5"
                placeholder="言语理解&#10;判断推理&#10;数量关系"
              />
            </a-form-item>
            <a-form-item label="来源选项（下拉可选项，权重决定抽取概率）">
              <div class="space-y-2">
                <div
                  v-for="(row, index) in configForm.source_weights_rows"
                  :key="row.key"
                  class="flex items-center gap-2"
                >
                  <a-select
                    v-model:value="row.source"
                    :options="sourceOptions"
                    class="flex-1"
                    mode="tags"
                    placeholder="选择或输入来源名称"
                  />
                  <a-input-number
                    v-model:value="row.weight"
                    :max="999"
                    :min="0"
                    class="w-28"
                    placeholder="权重"
                  />
                  <a-button
                    danger
                    size="small"
                    type="text"
                    @click="removeSourceWeight(index)"
                  >
                    删除
                  </a-button>
                </div>
                <a-button
                  block
                  size="small"
                  type="dashed"
                  @click="addSourceWeight"
                >
                  + 新增来源
                </a-button>
                <p class="text-xs text-gray-500">
                  这里的每个来源会同时成为飞书表「来源」列的下拉选项；权重越大越容易被抽到。
                  「店铺购买」只在下方白名单子表中出现，其余子表会自动排除。
                </p>
              </div>
            </a-form-item>
            <a-form-item label="允许出现「店铺购买」的子表（每行一项）">
              <a-textarea
                v-model:value="configForm.paid_sheets_text"
                :rows="4"
                placeholder="真题获取&#10;干货汇总"
              />
            </a-form-item>
          </div>
        </div>

        <div class="rounded-lg bg-gray-50 p-4">
          <h3 class="mb-4 text-lg font-medium">定时设置</h3>
          <div class="space-y-4">
            <a-form-item label="执行计划">
              <a-select
                v-model:value="cronForm.cronType"
                :options="cronTypeOptions"
                @change="updateCronExpression"
              />
            </a-form-item>
            <a-form-item
              v-if="['n_minutes', 'n_hours'].includes(cronForm.cronType)"
              label="间隔"
            >
              <a-input-number
                v-model:value="cronForm.cronValue"
                :max="cronForm.cronType === 'n_minutes' ? 59 : 23"
                :min="1"
                class="w-full"
                @change="updateCronExpression"
              />
            </a-form-item>
            <div
              v-if="['daily', 'weekly', 'monthly'].includes(cronForm.cronType)"
              class="grid gap-3 md:grid-cols-2"
            >
              <a-form-item label="小时">
                <a-input-number
                  v-model:value="cronForm.cronHour"
                  :max="23"
                  :min="0"
                  class="w-full"
                  @change="updateCronExpression"
                />
              </a-form-item>
              <a-form-item label="分钟">
                <a-input-number
                  v-model:value="cronForm.cronMinute"
                  :max="59"
                  :min="0"
                  class="w-full"
                  @change="updateCronExpression"
                />
              </a-form-item>
            </div>
            <a-form-item v-if="cronForm.cronType === 'weekly'" label="星期">
              <a-select
                v-model:value="cronForm.cronWeekday"
                :options="weekdayOptions"
                @change="updateCronExpression"
              />
            </a-form-item>
            <a-form-item v-if="cronForm.cronType === 'monthly'" label="日期">
              <a-input-number
                v-model:value="cronForm.cronDay"
                :max="31"
                :min="1"
                class="w-full"
                @change="updateCronExpression"
              />
            </a-form-item>
            <a-form-item
              v-if="cronForm.cronType === 'custom'"
              label="Cron 表达式"
            >
              <a-input
                v-model:value="configForm.cron"
                placeholder="标准 5 段式，例如：0 3 * * *"
              />
            </a-form-item>
            <a-alert
              :description="
                configForm.cron
                  ? `Cron 表达式：${configForm.cron}（标准 5 段式，如 0 3 * * *）`
                  : '不填写 Cron 时仅支持手动执行'
              "
              :message="`执行计划：${cronDescription}`"
              show-icon
              type="info"
            />
          </div>
        </div>
      </a-form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <a-button @click="configDrawerOpen = false">取消</a-button>
          <a-button :loading="savingConfig" type="primary" @click="saveConfig">
            保存配置
          </a-button>
        </div>
      </template>
    </a-drawer>

    <TaskModal
      :title="
        selectedTaskConfig
          ? `导出任务记录 · ${selectedTaskConfig.name}`
          : '导出任务记录'
      "
    >
      <TaskGrid>
        <template #status="{ row }">
          <a-tag :color="taskStatusColor(row.status)">
            {{
              {
                cancelled: '已取消',
                completed: '已完成',
                failed: '失败',
                pending: '等待中',
                running: '执行中',
              }[
                row.status as
                  | 'cancelled'
                  | 'completed'
                  | 'failed'
                  | 'pending'
                  | 'running'
              ] || row.status
            }}
          </a-tag>
        </template>
        <template #statistics="{ row }">
          <a-tooltip :title="formatSheetDetail(row.statistics)">
            <span class="cursor-help">{{
              formatStatistics(row.statistics)
            }}</span>
          </a-tooltip>
        </template>
        <template #error_message="{ row }">
          <a-typography-text
            v-if="row.error_message"
            :content="row.error_message"
            :ellipsis="{ tooltip: row.error_message }"
            class="text-red-600"
          />
          <span v-else>-</span>
        </template>
      </TaskGrid>
    </TaskModal>
  </Page>
</template>
