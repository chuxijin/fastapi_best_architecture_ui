<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  MyDriveFile,
  MyDriveSyncConfig,
  MyDriveSyncConfigPayload,
  MyDriveSyncRulePayload,
  MyDriveSyncRuleSet,
  MyDriveSyncTask,
  MyDriveSyncTaskItem,
} from '#/api';

import { computed, onMounted, ref } from 'vue';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { AddData } from '@vben/icons';

import { message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  cancelMyDriveSyncTaskApi,
  createMyDriveSyncConfigApi,
  createMyDriveSyncRuleSetApi,
  createMyDriveSyncTaskApi,
  deleteMyDriveSyncConfigApi,
  getMyDriveSpacesApi,
  getMyDriveSyncConfigsApi,
  getMyDriveSyncRuleSetApi,
  getMyDriveSyncRuleSetsApi,
  getMyDriveSyncTaskItemsApi,
  getMyDriveSyncTasksApi,
  updateMyDriveSyncConfigApi,
  updateMyDriveSyncRuleSetApi,
} from '#/api';

import PathSelectorModal from '../components/PathSelectorModal.vue';
import {
  createSyncConfigColumns,
  createSyncTaskColumns,
  syncConfigQuerySchema,
} from './data';

const configs = ref<MyDriveSyncConfig[]>([]);
const spaces = ref<Awaited<ReturnType<typeof getMyDriveSpacesApi>>['items']>(
  [],
);
const ruleSets = ref<
  Awaited<ReturnType<typeof getMyDriveSyncRuleSetsApi>>['items']
>([]);
const tasks = ref<MyDriveSyncTask[]>([]);
const editingConfig = ref<MyDriveSyncConfig>();
const selectedTaskConfig = ref<MyDriveSyncConfig>();
const selectedTask = ref<MyDriveSyncTask>();
const taskItems = ref<MyDriveSyncTaskItem[]>([]);
const editingRuleSet = ref<MyDriveSyncRuleSet>();
const taskItemsLoading = ref(false);
const taskItemsVisible = ref(false);
const configDrawerOpen = ref(false);
const savingConfig = ref(false);
const switchLoadingMap = ref<Map<number, boolean>>(new Map());
const pathSelectorOpen = ref(false);
const pathSelectorMode = ref<'source' | 'target'>('source');
const savingRuleSet = ref(false);
const ruleModalOpen = ref(false);
const ruleManagerOpen = ref(false);
const loadingRuleSetId = ref<number>();
const configForm = ref({
  cron: '',
  cronDay: 1,
  cronHour: 2,
  cronMinute: 0,
  cronType: '',
  cronValue: 10,
  cronWeekday: 1,
  end_time: null as null | string,
  name: '',
  rule_set_id: undefined as number | undefined,
  source_path: '/',
  source_space_id: undefined as number | undefined,
  sync_method: 'incremental' as MyDriveSyncConfigPayload['sync_method'],
  target_path: '/',
  target_space_id: undefined as number | undefined,
});

interface RuleFormItem extends MyDriveSyncRulePayload {
  excludeMode: 'contains' | 'directory' | 'extension' | 'filename' | 'glob';
  renameMode:
    | 'add_prefix'
    | 'regex'
    | 'remove_bracket_prefix'
    | 'remove_prefix'
    | 'replace_text';
  value: string;
  valueExtra: string;
}

const ruleTypeOptions = [
  { label: '排除文件', value: 'exclude' },
  { label: '重命名', value: 'rename' },
];

const excludeModeOptions = [
  { label: '按扩展名排除', value: 'extension' },
  { label: '文件名包含', value: 'contains' },
  { label: '指定文件名', value: 'filename' },
  { label: '指定目录', value: 'directory' },
  { label: '高级通配符', value: 'glob' },
];

const renameModeOptions = [
  { label: '去掉开头文字', value: 'remove_prefix' },
  { label: '去掉方括号前缀', value: 'remove_bracket_prefix' },
  { label: '替换文字', value: 'replace_text' },
  { label: '添加前缀', value: 'add_prefix' },
  { label: '高级正则', value: 'regex' },
];

const ruleSetForm = ref({
  description: '',
  name: '',
  rules: [createEmptyRule()],
});

const ruleSetColumns = [
  { dataIndex: 'name', key: 'name', title: '规则集名称' },
  { dataIndex: 'description', key: 'description', title: '描述' },
  { dataIndex: 'is_enabled', key: 'is_enabled', title: '状态', width: 90 },
  { key: 'operation', title: '操作', width: 90 },
];

const spaceOptions = computed(() =>
  spaces.value.map((space) => ({
    label: `${space.name} · ${getProviderLabel(space.provider)} · ${getSpaceTypeLabel(space.space_type)}`,
    value: space.id,
  })),
);

const targetSpaceOptions = computed(() =>
  spaces.value
    .filter((space) => space.space_type === 'personal')
    .map((space) => ({
      label: `${space.name} · ${space.provider}`,
      value: space.id,
    })),
);

const ruleSetOptions = computed(() =>
  ruleSets.value
    .filter((ruleSet) => ruleSet.is_enabled)
    .map((ruleSet) => ({ label: ruleSet.name, value: ruleSet.id })),
);

const syncMethodOptions = [
  { label: '增量：保留目标已有内容', value: 'incremental' },
  { label: '全量：删除目标多余内容', value: 'full' },
  { label: '覆盖：先清空目标再同步', value: 'overwrite' },
];

const providerLabels: Record<string, string> = {
  baidu: '百度网盘',
  quark: '夸克网盘',
  thunder: '迅雷网盘',
};

const providerTagColors: Record<string, string> = {
  baidu: 'blue',
  quark: 'green',
  thunder: 'orange',
};

const spaceTypeLabels: Record<string, string> = {
  friend: '好友分享',
  group: '群组分享',
  personal: '个人空间',
  share_link: '分享链接',
};

const spaceTypeTagColors: Record<string, string> = {
  friend: 'purple',
  group: 'cyan',
  personal: 'default',
  share_link: 'magenta',
};

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

const cronDescription = computed(() => {
  const form = configForm.value;
  if (!form.cron) return '手动执行';
  if (form.cronType === 'daily')
    return `每天 ${padTime(form.cronHour)}:${padTime(form.cronMinute)} 执行`;
  if (form.cronType === 'hourly') return '每小时执行';
  if (form.cronType === 'n_minutes') return `每 ${form.cronValue} 分钟执行`;
  if (form.cronType === 'n_hours') return `每 ${form.cronValue} 小时执行`;
  if (form.cronType === 'weekly') {
    return `每周 ${weekdayOptions.find((item) => item.value === form.cronWeekday)?.label} ${padTime(form.cronHour)}:${padTime(form.cronMinute)} 执行`;
  }
  if (form.cronType === 'monthly')
    return `每月 ${form.cronDay} 号 ${padTime(form.cronHour)}:${padTime(form.cronMinute)} 执行`;
  return `自定义：${form.cron}`;
});

const queryFormOptions: VbenFormProps = {
  collapsed: false,
  schema: syncConfigQuerySchema,
  showCollapseButton: false,
  wrapperClass: 'grid-cols-2',
};

function describeSpace(spaceId: number): string {
  const space = spaces.value.find((item) => item.id === spaceId);
  return space ? `${space.name} · ` : `空间 #${spaceId} · `;
}

function getSpaceProvider(
  spaceId: number,
): null | { provider: string; spaceType: string } {
  const space = spaces.value.find((item) => item.id === spaceId);
  if (!space) return null;
  return { provider: space.provider, spaceType: space.space_type };
}

function getProviderLabel(provider: string): string {
  return providerLabels[provider] || provider;
}

function getProviderTagColor(provider: string): string {
  return providerTagColors[provider] || 'default';
}

function getSpaceTypeLabel(spaceType: string): string {
  return spaceTypeLabels[spaceType] || spaceType;
}

function getSpaceTypeTagColor(spaceType: string): string {
  return spaceTypeTagColors[spaceType] || 'default';
}

function getExecutionStatus(
  configId: number,
): 'cancelled' | 'completed' | 'failed' | 'idle' | 'pending' | 'running' {
  const task = tasks.value.find((item) => item.config_id === configId);
  if (!task) return 'idle';
  return task.status;
}

function getConfigName(configId: number): string {
  return (
    configs.value.find((item) => item.id === configId)?.name ||
    `配置 #${configId}`
  );
}

function createEmptyRule(): RuleFormItem {
  return {
    excludeMode: 'extension',
    is_enabled: true,
    pattern: '',
    replacement: '',
    renameMode: 'remove_bracket_prefix',
    rule_type: 'exclude',
    sort_order: 0,
    value: '',
    valueExtra: '',
  };
}

function parseEscapedRegExpLiteral(pattern: string): null | string {
  const specialCharacters = new Set([
    '$',
    '(',
    ')',
    '*',
    '+',
    '.',
    '?',
    '[',
    '\\',
    ']',
    '^',
    '{',
    '|',
    '}',
  ]);
  let value = '';
  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];
    if (character === '\\') {
      const nextCharacter = pattern[index + 1];
      if (!nextCharacter || !specialCharacters.has(nextCharacter)) return null;
      value += nextCharacter;
      index += 1;
    } else {
      if (specialCharacters.has(character)) return null;
      value += character;
    }
  }
  return value;
}

function createRuleFormItem(rule: MyDriveSyncRulePayload): RuleFormItem {
  const formItem = {
    ...createEmptyRule(),
    is_enabled: rule.is_enabled,
    pattern: rule.pattern,
    replacement: rule.replacement,
    rule_type: rule.rule_type,
    sort_order: rule.sort_order,
  };

  if (rule.rule_type === 'exclude') {
    const globCharacters = /[*?[\]{}]/;
    if (/^\*\.[^*?[\]{}]+$/.test(rule.pattern)) {
      formItem.excludeMode = 'extension';
      formItem.value = rule.pattern.slice(2);
    } else if (
      rule.pattern.endsWith('/') &&
      !globCharacters.test(rule.pattern.slice(0, -1))
    ) {
      formItem.excludeMode = 'directory';
      formItem.value = rule.pattern.slice(0, -1);
    } else if (
      rule.pattern.startsWith('*') &&
      rule.pattern.endsWith('*') &&
      !globCharacters.test(rule.pattern.slice(1, -1))
    ) {
      formItem.excludeMode = 'contains';
      formItem.value = rule.pattern.slice(1, -1);
    } else if (globCharacters.test(rule.pattern)) {
      formItem.excludeMode = 'glob';
      formItem.value = rule.pattern;
    } else {
      formItem.excludeMode = 'filename';
      formItem.value = rule.pattern;
    }
    return formItem;
  }

  if (rule.pattern === String.raw`^\[[^\]]+\]\s*` && !rule.replacement) {
    formItem.renameMode = 'remove_bracket_prefix';
  } else if (
    rule.pattern === '^(.+)$' &&
    rule.replacement.endsWith(String.raw`\1`)
  ) {
    formItem.renameMode = 'add_prefix';
    formItem.value = rule.replacement.slice(0, -2);
  } else {
    const removePrefixSuffix = String.raw`\s*`;
    const removePrefixValue =
      !rule.replacement &&
      rule.pattern.startsWith('^') &&
      rule.pattern.endsWith(removePrefixSuffix)
        ? parseEscapedRegExpLiteral(
            rule.pattern.slice(1, -removePrefixSuffix.length),
          )
        : null;
    const replaceTextValue = parseEscapedRegExpLiteral(rule.pattern);
    formItem.renameMode =
      removePrefixValue === null
        ? replaceTextValue === null
          ? 'regex'
          : 'replace_text'
        : 'remove_prefix';
    formItem.value = removePrefixValue ?? replaceTextValue ?? rule.pattern;
    formItem.valueExtra = rule.replacement;
  }
  return formItem;
}

function escapeRegExp(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

function normalizeExtension(value: string): string {
  const extension = value.trim().replace(/^\*?\.?/, '');
  if (!extension) return '';
  return `*.${extension}`;
}

function buildRulePayload(
  rule: RuleFormItem,
  sortOrder: number,
): MyDriveSyncRulePayload | null {
  const value = rule.value.trim();
  const valueExtra = rule.valueExtra.trim();
  if (rule.rule_type === 'exclude') {
    const patternMap = {
      contains: value ? `*${value}*` : '',
      directory: value ? `${value.replace(/\/+$/, '')}/` : '',
      extension: normalizeExtension(value),
      filename: value,
      glob: value,
    };
    const pattern = patternMap[rule.excludeMode];
    if (!pattern) return null;
    return {
      is_enabled: rule.is_enabled,
      pattern,
      replacement: '',
      rule_type: 'exclude',
      sort_order: sortOrder,
    };
  }

  if (rule.renameMode === 'remove_bracket_prefix') {
    return {
      is_enabled: rule.is_enabled,
      pattern: String.raw`^\[[^\]]+\]\s*`,
      replacement: '',
      rule_type: 'rename',
      sort_order: sortOrder,
    };
  }
  if (rule.renameMode === 'remove_prefix') {
    if (!value) return null;
    return {
      is_enabled: rule.is_enabled,
      pattern: String.raw`^${escapeRegExp(value)}\s*`,
      replacement: '',
      rule_type: 'rename',
      sort_order: sortOrder,
    };
  }
  if (rule.renameMode === 'replace_text') {
    if (!value) return null;
    return {
      is_enabled: rule.is_enabled,
      pattern: escapeRegExp(value),
      replacement: valueExtra,
      rule_type: 'rename',
      sort_order: sortOrder,
    };
  }
  if (rule.renameMode === 'add_prefix') {
    if (!value) return null;
    return {
      is_enabled: rule.is_enabled,
      pattern: '^(.+)$',
      replacement: String.raw`${value}\1`,
      rule_type: 'rename',
      sort_order: sortOrder,
    };
  }
  if (!value) return null;
  return {
    is_enabled: rule.is_enabled,
    pattern: value,
    replacement: valueExtra,
    rule_type: 'rename',
    sort_order: sortOrder,
  };
}

function getRuleValuePlaceholder(rule: RuleFormItem): string {
  if (rule.rule_type === 'exclude') {
    return {
      contains: '例如：草稿',
      directory: '例如：node_modules',
      extension: '例如：tmp 或 .tmp',
      filename: '例如：desktop.ini',
      glob: '例如：cache/**/*.tmp',
    }[rule.excludeMode];
  }
  return {
    add_prefix: '例如：【公开课】',
    regex: '请输入 Python 正则表达式',
    remove_bracket_prefix: '无需填写',
    remove_prefix: '例如：【公开课】',
    replace_text: '要替换的文字，例如：试看',
  }[rule.renameMode];
}

async function getSyncConfigPage(
  page: { currentPage: number; pageSize: number },
  formValues?: Record<string, string>,
) {
  try {
    const queryValues = formValues || {};
    const hasQuery = Boolean(queryValues.name || queryValues.sync_method);
    const configData = await getMyDriveSyncConfigsApi({
      page: hasQuery ? 1 : page.currentPage,
      size: hasQuery ? 1000 : page.pageSize,
    });
    const filteredItems = hasQuery
      ? configData.items.filter((config) => {
          const nameMatches =
            !queryValues.name || config.name.includes(queryValues.name);
          const methodMatches =
            !queryValues.sync_method ||
            config.sync_method === queryValues.sync_method;
          return nameMatches && methodMatches;
        })
      : configData.items;
    const startIndex = (page.currentPage - 1) * page.pageSize;
    const items = hasQuery
      ? filteredItems.slice(startIndex, startIndex + page.pageSize)
      : filteredItems;
    configs.value = items;

    const [spaceData, ruleSetData] = await Promise.allSettled([
      getMyDriveSpacesApi(),
      getMyDriveSyncRuleSetsApi(),
    ]);
    if (spaceData.status === 'fulfilled') spaces.value = spaceData.value.items;
    if (ruleSetData.status === 'fulfilled')
      ruleSets.value = ruleSetData.value.items;

    const taskData = await getMyDriveSyncTasksApi();
    tasks.value = taskData.items;

    return {
      ...configData,
      items,
      total: hasQuery ? filteredItems.length : configData.total,
    };
  } catch (error) {
    console.error('获取同步配置列表失败:', error);
    message.error('获取同步配置列表失败');
    return { items: [], total: 0 };
  }
}

const gridOptions: VxeTableGridOptions = {
  checkboxConfig: { highlight: true },
  columns: createSyncConfigColumns(describeSpace),
  height: 'auto',
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) =>
        getSyncConfigPage(page, formValues),
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
  columns: createSyncTaskColumns(getConfigName),
  height: '500px',
  proxyConfig: {
    ajax: {
      query: async () => {
        try {
          const response = await getMyDriveSyncTasksApi();
          tasks.value = response.items;
          const items = selectedTaskConfig.value
            ? response.items.filter(
                (item) => item.config_id === selectedTaskConfig.value?.id,
              )
            : response.items;
          return { ...response, items, total: items.length };
        } catch {
          message.error('获取同步任务失败');
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
});

async function openConfigModal(config?: MyDriveSyncConfig): Promise<void> {
  editingConfig.value = config;
  configDrawerOpen.value = true;
  configForm.value = {
    cron: config?.cron || '',
    cronDay: 1,
    cronHour: 2,
    cronMinute: 0,
    cronType: '',
    cronValue: 10,
    cronWeekday: 1,
    end_time: config?.end_time || null,
    name: config?.name || '',
    rule_set_id: config?.rule_set_id || undefined,
    source_path: config?.source_path || '/',
    source_space_id: config?.source_space_id,
    sync_method: config?.sync_method || 'incremental',
    target_path: config?.target_path || '/',
    target_space_id: config?.target_space_id,
  };
  parseCron(config?.cron || '');
}

async function saveConfig(): Promise<void> {
  const values = configForm.value;
  if (!values.name.trim()) {
    message.warning('请输入同步名称');
    return;
  }
  if (!values.source_space_id || !values.target_space_id) {
    message.warning('请选择来源和目标文件空间');
    return;
  }
  if (values.source_space_id === values.target_space_id) {
    message.warning('来源和目标文件空间不能相同');
    return;
  }

  savingConfig.value = true;
  try {
    const payload: MyDriveSyncConfigPayload = {
      rule_set_id: values.rule_set_id || null,
      source_space_id: values.source_space_id,
      sync_method: values.sync_method,
      target_space_id: values.target_space_id,
      cron: values.cron?.trim() || null,
      end_time: values.end_time || null,
      name: values.name.trim(),
      source_path: values.source_path?.trim() || '/',
      target_path: values.target_path?.trim() || '/',
    };
    if (editingConfig.value) {
      await updateMyDriveSyncConfigApi(editingConfig.value.id, payload);
      message.success('同步配置已更新');
    } else {
      await createMyDriveSyncConfigApi(payload);
      message.success('同步配置已创建');
    }
    configDrawerOpen.value = false;
    gridApi.query();
  } catch {
    message.error('保存同步配置失败');
  } finally {
    savingConfig.value = false;
  }
}

async function toggleConfigStatus(
  config: MyDriveSyncConfig,
  checked: boolean,
): Promise<void> {
  switchLoadingMap.value.set(config.id, true);
  try {
    await updateMyDriveSyncConfigApi(config.id, { is_enabled: checked });
    config.is_enabled = checked;
    message.success(`配置已${checked ? '启用' : '停用'}`);
  } catch {
    message.error('状态更新失败');
  } finally {
    switchLoadingMap.value.delete(config.id);
  }
}

function copyConfig(config: MyDriveSyncConfig): void {
  openConfigModal({ ...config, id: 0, name: `${config.name} - 副本` });
  editingConfig.value = undefined;
}

function showTaskRecords(config?: MyDriveSyncConfig): void {
  selectedTaskConfig.value = config;
  taskModalApi.open();
  taskGridApi.query();
}

function openPathSelector(mode: 'source' | 'target'): void {
  const spaceId =
    mode === 'source'
      ? configForm.value.source_space_id
      : configForm.value.target_space_id;
  if (!spaceId) {
    message.warning(
      mode === 'source' ? '请先选择来源空间' : '请先选择目标空间',
    );
    return;
  }
  pathSelectorMode.value = mode;
  pathSelectorOpen.value = true;
}

function confirmPath(value: {
  file: MyDriveFile | null;
  fileId: null | string;
  path: string;
}): void {
  if (pathSelectorMode.value === 'source') {
    configForm.value.source_path = value.path;
    return;
  }
  configForm.value.target_path = value.path;
}

function getPathSelectorSpaceId(): number | undefined {
  return pathSelectorMode.value === 'source'
    ? configForm.value.source_space_id
    : configForm.value.target_space_id;
}

function padTime(value: number): string {
  return value.toString().padStart(2, '0');
}

function updateCronExpression(): void {
  const form = configForm.value;
  if (form.cronType === '') form.cron = '';
  if (form.cronType === 'daily')
    form.cron = `${form.cronMinute} ${form.cronHour} * * *`;
  if (form.cronType === 'hourly') form.cron = '0 * * * *';
  if (form.cronType === 'n_minutes') form.cron = `*/${form.cronValue} * * * *`;
  if (form.cronType === 'n_hours') form.cron = `0 */${form.cronValue} * * *`;
  if (form.cronType === 'weekly')
    form.cron = `${form.cronMinute} ${form.cronHour} * * ${form.cronWeekday}`;
  if (form.cronType === 'monthly')
    form.cron = `${form.cronMinute} ${form.cronHour} ${form.cronDay} * *`;
}

function parseCron(cron: string): void {
  const parts = cron.trim().split(/\s+/);
  if (!cron) {
    configForm.value.cronType = '';
    return;
  }
  if (parts.length !== 5) {
    configForm.value.cronType = 'custom';
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
    configForm.value.cronType = 'hourly';
    return;
  }
  if (
    minute.startsWith('*/') &&
    hour === '*' &&
    day === '*' &&
    month === '*' &&
    weekday === '*'
  ) {
    configForm.value.cronType = 'n_minutes';
    configForm.value.cronValue = Number(minute.replace('*/', '')) || 10;
    return;
  }
  if (
    minute === '0' &&
    hour.startsWith('*/') &&
    day === '*' &&
    month === '*' &&
    weekday === '*'
  ) {
    configForm.value.cronType = 'n_hours';
    configForm.value.cronValue = Number(hour.replace('*/', '')) || 2;
    return;
  }
  if (day === '*' && month === '*' && weekday === '*') {
    configForm.value.cronType = 'daily';
    configForm.value.cronMinute = Number(minute) || 0;
    configForm.value.cronHour = Number(hour) || 2;
    return;
  }
  if (day === '*' && month === '*') {
    configForm.value.cronType = 'weekly';
    configForm.value.cronMinute = Number(minute) || 0;
    configForm.value.cronHour = Number(hour) || 2;
    configForm.value.cronWeekday = Number(weekday) || 1;
    return;
  }
  if (month === '*' && weekday === '*') {
    configForm.value.cronType = 'monthly';
    configForm.value.cronMinute = Number(minute) || 0;
    configForm.value.cronHour = Number(hour) || 2;
    configForm.value.cronDay = Number(day) || 1;
    return;
  }
  configForm.value.cronType = 'custom';
}

async function openRuleModal(ruleSet?: MyDriveSyncRuleSet): Promise<void> {
  editingRuleSet.value = ruleSet;
  if (ruleSet) {
    loadingRuleSetId.value = ruleSet.id;
    try {
      const detail = await getMyDriveSyncRuleSetApi(ruleSet.id);
      ruleSetForm.value = {
        description: detail.description,
        name: detail.name,
        rules:
          detail.rules.length > 0
            ? detail.rules
                .toSorted((left, right) => left.sort_order - right.sort_order)
                .map((rule) => createRuleFormItem(rule))
            : [createEmptyRule()],
      };
      ruleModalOpen.value = true;
    } catch {
      editingRuleSet.value = undefined;
      message.error('获取规则集详情失败');
    } finally {
      loadingRuleSetId.value = undefined;
    }
    return;
  }

  ruleSetForm.value = {
    description: '',
    name: '',
    rules: [createEmptyRule()],
  };
  ruleModalOpen.value = true;
}

function editSelectedRuleSet(): void {
  const selectedRuleSet = ruleSets.value.find(
    (item) => item.id === configForm.value.rule_set_id,
  );
  if (selectedRuleSet) openRuleModal(selectedRuleSet);
}

function editRuleSetFromTable(record: Record<string, unknown>): void {
  const selectedRuleSet = ruleSets.value.find((item) => item.id === record.id);
  if (selectedRuleSet) openRuleModal(selectedRuleSet);
}

function addRule(): void {
  ruleSetForm.value.rules.push({
    ...createEmptyRule(),
    sort_order: ruleSetForm.value.rules.length,
  });
}

function removeRule(index: number): void {
  ruleSetForm.value.rules.splice(index, 1);
  ruleSetForm.value.rules.forEach((rule, ruleIndex) => {
    rule.sort_order = ruleIndex;
  });
}

async function saveRuleSet(): Promise<void> {
  if (!ruleSetForm.value.name.trim()) {
    message.warning('请输入规则集名称');
    return;
  }
  const rules = ruleSetForm.value.rules
    .map((rule, index) => buildRulePayload(rule, index))
    .filter((rule): rule is MyDriveSyncRulePayload => rule !== null);
  if (rules.length === 0) {
    message.warning('请至少添加一条规则');
    return;
  }

  savingRuleSet.value = true;
  try {
    const payload = {
      description: ruleSetForm.value.description.trim(),
      name: ruleSetForm.value.name.trim(),
      rules,
    };
    if (editingRuleSet.value) {
      await updateMyDriveSyncRuleSetApi(editingRuleSet.value.id, payload);
      message.success('同步规则集已更新');
    } else {
      await createMyDriveSyncRuleSetApi(payload);
      message.success('同步规则集已创建');
    }
    ruleModalOpen.value = false;
    gridApi.query();
  } catch {
    message.error('保存同步规则集失败');
  } finally {
    savingRuleSet.value = false;
  }
}

async function runConfig(config: MyDriveSyncConfig): Promise<void> {
  try {
    await createMyDriveSyncTaskApi(config.id);
    message.success('同步任务已提交');
    taskGridApi.query();
    gridApi.query();
  } catch {
    message.error('提交同步任务失败，可能已有进行中的任务');
  }
}

async function removeConfig(config: MyDriveSyncConfig): Promise<void> {
  try {
    await deleteMyDriveSyncConfigApi(config.id);
    message.success('同步配置已删除');
    gridApi.query();
  } catch {
    message.error('删除同步配置失败');
  }
}

function formatStatistics(statistics: Record<string, number>): string {
  return `完成 ${statistics.completed || 0} · 失败 ${statistics.failed || 0} · 跳过 ${statistics.skipped || 0}`;
}

function taskStatusColor(status: MyDriveSyncTask['status']): string {
  return {
    cancelled: 'default',
    completed: 'success',
    failed: 'error',
    pending: 'processing',
    running: 'processing',
  }[status];
}

async function cancelTask(task: MyDriveSyncTask): Promise<void> {
  try {
    await cancelMyDriveSyncTaskApi(task.id);
    message.success('已请求取消同步任务');
    taskGridApi.query();
  } catch {
    message.error('取消同步任务失败');
  }
}

async function showTaskItems(task: MyDriveSyncTask): Promise<void> {
  selectedTask.value = task;
  taskItemsVisible.value = true;
  taskItemsLoading.value = true;
  try {
    const response = await getMyDriveSyncTaskItemsApi(task.id);
    taskItems.value = response.items;
  } catch {
    taskItems.value = [];
    message.error('获取同步任务明细失败');
  } finally {
    taskItemsLoading.value = false;
  }
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <VbenButton @click="openConfigModal()">
          <AddData class="size-5" />
          新增同步配置
        </VbenButton>
        <VbenButton @click="openRuleModal()">添加规则集</VbenButton>
        <VbenButton @click="ruleManagerOpen = true">管理规则集</VbenButton>
        <VbenButton @click="showTaskRecords()">任务记录</VbenButton>
      </template>
      <template #is_enabled="{ row }">
        <a-switch
          :checked="Boolean(row.is_enabled)"
          :loading="switchLoadingMap.get(row.id) || false"
          @change="(checked: boolean) => toggleConfigStatus(row, checked)"
        />
      </template>
      <template #execution_status="{ row }">
        <div class="flex items-center justify-center gap-2">
          <template v-if="getExecutionStatus(row.id) === 'pending'">
            <span class="text-orange-500">等待中</span>
          </template>
          <template v-else-if="getExecutionStatus(row.id) === 'running'">
            <a-spin size="small" />
            <span class="text-blue-600">执行中</span>
          </template>
          <template v-else-if="getExecutionStatus(row.id) === 'completed'">
            <span class="text-green-600">已完成</span>
          </template>
          <template v-else-if="getExecutionStatus(row.id) === 'failed'">
            <span class="text-red-600">失败</span>
          </template>
          <template v-else-if="getExecutionStatus(row.id) === 'cancelled'">
            <span class="text-gray-400">已取消</span>
          </template>
          <template v-else>
            <span class="text-gray-500">空闲</span>
          </template>
        </div>
      </template>
      <template #space_type="{ row }">
        <div
          v-if="getSpaceProvider(row.source_space_id)"
          class="flex items-center justify-center gap-1"
        >
          <a-tag
            :color="
              getProviderTagColor(
                getSpaceProvider(row.source_space_id)?.provider || '',
              )
            "
          >
            {{
              getProviderLabel(
                getSpaceProvider(row.source_space_id)?.provider || '',
              )
            }}
          </a-tag>
          <a-tag
            :color="
              getSpaceTypeTagColor(
                getSpaceProvider(row.source_space_id)?.spaceType || '',
              )
            "
          >
            {{
              getSpaceTypeLabel(
                getSpaceProvider(row.source_space_id)?.spaceType || '',
              )
            }}
          </a-tag>
        </div>
        <span v-else>-</span>
      </template>
      <template #operation="{ row }">
        <div class="flex items-center justify-center gap-2">
          <a-button size="small" type="primary" @click="runConfig(row)"
            >
执行
</a-button
          >
          <a-button size="small" @click="openConfigModal(row)">编辑</a-button>
          <a-button size="small" type="primary" @click="copyConfig(row)"
            >
复制
</a-button
          >
          <a-button size="small" @click="showTaskRecords(row)">记录</a-button>
          <a-popconfirm
            title="确定删除此同步配置？"
            @confirm="removeConfig(row)"
          >
            <a-button danger size="small">删除</a-button>
          </a-popconfirm>
        </div>
      </template>
    </Grid>

    <a-drawer
      v-model:open="configDrawerOpen"
      :title="editingConfig ? '编辑同步配置' : '新增同步配置'"
      size="large"
      destroy-on-close
    >
      <div
        class="mb-4 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700"
      >
        配置来源空间、目标个人空间、同步目录和同步策略。来源和目标不能相同，外部分享空间只能作为来源。
      </div>
      <a-form class="space-y-4" layout="vertical">
        <div class="rounded-lg bg-gray-50 p-4">
          <h3 class="mb-4 text-lg font-medium">基础信息</h3>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <a-form-item label="同步名称" required>
              <a-input
                v-model:value="configForm.name"
                :maxlength="128"
                placeholder="例如：百度课程备份"
              />
            </a-form-item>
            <a-form-item label="规则集">
              <div class="flex gap-2">
                <a-select
                  v-model:value="configForm.rule_set_id"
                  allow-clear
                  class="min-w-0 flex-1"
                  :options="ruleSetOptions"
                  placeholder="不使用规则集"
                />
                <a-button
                  :disabled="!configForm.rule_set_id"
                  @click="editSelectedRuleSet"
                  >
编辑
</a-button
                >
              </div>
            </a-form-item>
          </div>
        </div>

        <div class="rounded-lg bg-gray-50 p-4">
          <h3 class="mb-4 text-lg font-medium">路径配置</h3>
          <div class="mb-6">
            <h4 class="mb-3 text-base font-medium">源路径配置</h4>
            <a-form-item label="来源文件空间" required>
              <a-select
                v-model:value="configForm.source_space_id"
                :options="spaceOptions"
                placeholder="选择来源空间"
              />
            </a-form-item>
            <a-form-item label="来源目录">
              <div class="flex gap-2">
                <a-input
                  v-model:value="configForm.source_path"
                  class="flex-1"
                  readonly
                />
                <a-button type="primary" @click="openPathSelector('source')"
                  >
选择路径
</a-button
                >
              </div>
            </a-form-item>
          </div>
          <div>
            <h4 class="mb-3 text-base font-medium">目标路径配置</h4>
            <a-form-item label="目标个人空间" required>
              <a-select
                v-model:value="configForm.target_space_id"
                :options="targetSpaceOptions"
                placeholder="选择目标个人空间"
              />
            </a-form-item>
            <a-form-item label="目标目录">
              <div class="flex gap-2">
                <a-input
                  v-model:value="configForm.target_path"
                  class="flex-1"
                  readonly
                />
                <a-button type="primary" @click="openPathSelector('target')"
                  >
选择路径
</a-button
                >
              </div>
            </a-form-item>
          </div>
        </div>

        <div class="rounded-lg bg-gray-50 p-4">
          <h3 class="mb-4 text-lg font-medium">同步设置</h3>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <a-form-item label="同步模式" required>
              <a-select
                v-model:value="configForm.sync_method"
                :options="syncMethodOptions"
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
          <h3 class="mb-4 text-lg font-medium">定时设置</h3>
          <div class="space-y-4">
            <a-form-item label="执行计划">
              <a-select
                v-model:value="configForm.cronType"
                :options="cronTypeOptions"
                @change="updateCronExpression"
              />
            </a-form-item>
            <a-form-item
              v-if="['n_minutes', 'n_hours'].includes(configForm.cronType)"
              label="间隔"
            >
              <a-input-number
                v-model:value="configForm.cronValue"
                :min="1"
                :max="configForm.cronType === 'n_minutes' ? 59 : 23"
                class="w-full"
                @change="updateCronExpression"
              />
            </a-form-item>
            <div
              v-if="
                ['daily', 'weekly', 'monthly'].includes(configForm.cronType)
              "
              class="grid gap-3 md:grid-cols-2"
            >
              <a-form-item label="小时">
                <a-input-number
                  v-model:value="configForm.cronHour"
                  :min="0"
                  :max="23"
                  class="w-full"
                  @change="updateCronExpression"
                />
              </a-form-item>
              <a-form-item label="分钟">
                <a-input-number
                  v-model:value="configForm.cronMinute"
                  :min="0"
                  :max="59"
                  class="w-full"
                  @change="updateCronExpression"
                />
              </a-form-item>
            </div>
            <a-form-item v-if="configForm.cronType === 'weekly'" label="星期">
              <a-select
                v-model:value="configForm.cronWeekday"
                :options="weekdayOptions"
                @change="updateCronExpression"
              />
            </a-form-item>
            <a-form-item v-if="configForm.cronType === 'monthly'" label="日期">
              <a-input-number
                v-model:value="configForm.cronDay"
                :min="1"
                :max="31"
                class="w-full"
                @change="updateCronExpression"
              />
            </a-form-item>
            <a-form-item
              v-if="configForm.cronType === 'custom'"
              label="Cron 表达式"
            >
              <a-input
                v-model:value="configForm.cron"
                placeholder="例如：0 0 * * *"
              />
            </a-form-item>
            <a-alert
              :message="`执行计划：${cronDescription}`"
              :description="
                configForm.cron
                  ? `Cron 表达式：${configForm.cron}`
                  : '不填写 Cron 时仅手动执行'
              "
              type="info"
              show-icon
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

    <PathSelectorModal
      v-model:open="pathSelectorOpen"
      :space-id="getPathSelectorSpaceId()"
      :path="
        pathSelectorMode === 'source'
          ? configForm.source_path
          : configForm.target_path
      "
      :title="pathSelectorMode === 'source' ? '选择来源目录' : '选择目标目录'"
      @confirm="confirmPath"
    />

    <a-drawer
      v-model:open="ruleManagerOpen"
      destroy-on-close
      size="large"
      title="规则集管理"
    >
      <template #extra>
        <a-button type="primary" @click="openRuleModal()">新增规则集</a-button>
      </template>
      <a-table
        :columns="ruleSetColumns"
        :data-source="ruleSets"
        :pagination="false"
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'description'">
            <a-typography-text ellipsis>
{{
              record.description || '-'
            }}
</a-typography-text>
          </template>
          <template v-else-if="column.key === 'is_enabled'">
            <a-tag :color="record.is_enabled ? 'success' : 'default'">
              {{ record.is_enabled ? '启用' : '停用' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'operation'">
            <a-button
              :loading="loadingRuleSetId === record.id"
              size="small"
              type="link"
              @click="editRuleSetFromTable(record)"
            >
              编辑
            </a-button>
          </template>
        </template>
      </a-table>
    </a-drawer>

    <a-modal
      v-model:open="ruleModalOpen"
      :confirm-loading="savingRuleSet"
      :title="editingRuleSet ? '编辑同步规则集' : '添加同步规则集'"
      width="860px"
      @ok="saveRuleSet"
    >
      <a-form layout="vertical">
        <div class="grid gap-x-4 md:grid-cols-2">
          <a-form-item label="规则集名称" required>
            <a-input
              v-model:value="ruleSetForm.name"
              :maxlength="128"
              placeholder="例如：课程文件过滤规则"
            />
          </a-form-item>
          <a-form-item label="规则集描述">
            <a-input
              v-model:value="ruleSetForm.description"
              :maxlength="500"
              placeholder="可选"
            />
          </a-form-item>
        </div>
        <div class="mb-2 flex items-center justify-between">
          <span class="font-medium text-slate-700">规则列表</span>
          <a-button size="small" type="primary" @click="addRule"
            >
新增规则
</a-button
          >
        </div>
        <div class="space-y-3">
          <div
            v-for="(rule, index) in ruleSetForm.rules"
            :key="index"
            class="rounded-xl border border-slate-200 bg-slate-50 p-3"
          >
            <div
              class="grid gap-3 md:grid-cols-[130px_160px_minmax(0,1fr)_minmax(0,1fr)_80px]"
            >
              <a-select
                v-model:value="rule.rule_type"
                :options="ruleTypeOptions"
              />
              <a-select
                v-if="rule.rule_type === 'exclude'"
                v-model:value="rule.excludeMode"
                :options="excludeModeOptions"
              />
              <a-select
                v-else
                v-model:value="rule.renameMode"
                :options="renameModeOptions"
              />
              <a-input
                v-model:value="rule.value"
                :disabled="
                  rule.rule_type === 'rename' &&
                  rule.renameMode === 'remove_bracket_prefix'
                "
                :placeholder="getRuleValuePlaceholder(rule)"
              />
              <a-input
                v-model:value="rule.valueExtra"
                :disabled="
                  rule.rule_type !== 'rename' ||
                  !['regex', 'replace_text'].includes(rule.renameMode)
                "
                placeholder="替换为；仅替换文字/高级正则需要"
              />
              <a-button
                danger
                :disabled="ruleSetForm.rules.length === 1"
                @click="removeRule(index)"
              >
                删除
              </a-button>
            </div>
            <div class="mt-2 text-xs text-slate-500">
              <template v-if="rule.rule_type === 'exclude'">
                排除规则会在同步前跳过匹配的文件或目录。
              </template>
              <template v-else>
                重命名规则会在复制前调整文件名，按规则顺序命中第一条后停止。
              </template>
            </div>
            <a-checkbox v-model:checked="rule.is_enabled" class="mt-2"
              >
启用规则
</a-checkbox
            >
          </div>
        </div>
      </a-form>
    </a-modal>

    <TaskModal title="同步任务记录">
      <TaskGrid>
        <template #status="{ row }">
          <a-tag :color="taskStatusColor(row.status)">{{ row.status }}</a-tag>
        </template>
        <template #statistics="{ row }">
{{
          formatStatistics(row.statistics)
        }}
</template>
        <template #operation="{ row }">
          <a-button size="small" @click="showTaskItems(row)">明细</a-button>
          <a-button
            v-if="['pending', 'running'].includes(row.status)"
            danger
            size="small"
            @click="cancelTask(row)"
          >
            取消
          </a-button>
        </template>
      </TaskGrid>
    </TaskModal>

    <a-modal
      v-model:open="taskItemsVisible"
      :footer="null"
      :title="`任务明细 #${selectedTask?.id || ''}`"
      width="1080px"
    >
      <a-spin :spinning="taskItemsLoading" class="block">
        <a-table
          :columns="[
            { title: '操作', dataIndex: 'operation', width: 120 },
            {
              title: '文件',
              dataIndex: 'file_name',
              width: 220,
              ellipsis: true,
            },
            { title: '源路径', dataIndex: 'source_path', ellipsis: true },
            { title: '目标路径', dataIndex: 'target_path', ellipsis: true },
            { title: '大小', dataIndex: 'file_size', width: 100 },
            { title: '状态', dataIndex: 'status', width: 100 },
            {
              title: '错误',
              dataIndex: 'error_message',
              width: 180,
              ellipsis: true,
            },
          ]"
          :data-source="taskItems"
          :pagination="false"
          row-key="id"
          :scroll="{ y: 480 }"
          size="small"
        />
      </a-spin>
    </a-modal>
  </Page>
</template>
