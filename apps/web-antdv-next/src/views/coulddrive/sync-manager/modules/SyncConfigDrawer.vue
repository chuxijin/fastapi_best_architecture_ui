<script setup lang="ts">
import type {
  CoulddriveDriveAccountDetail,
  CoulddriveRelationshipParams,
  CoulddriveUserListParams,
} from '#/api';

import { computed, onMounted, ref, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';

import { message } from 'ant-design-vue';

import {
  createCoulddriveSyncConfigApi,
  DictEnum,
  getCoulddriveRelationshipListApi,
  getCoulddriveUserListApi,
  getDictOptions,
  getRuleTemplatesByTypeApi,
  RECURSION_SPEED_OPTIONS,
  SYNC_METHOD_OPTIONS,
  updateCoulddriveSyncConfigApi,
} from '#/api';
import FileSelector from '#/components/FileSelector.vue';

import { useCronScheduler } from '../composables/useCronScheduler';

interface Props {
  visible?: boolean;
  editData?: any;
}

interface SelectOption<T = number | string> {
  label: string;
  value: T;
}

interface RuleTemplateOption extends SelectOption<null | number> {
  description?: string;
}

interface SyncConfigFormData {
  enable: boolean;
  remark: string;
  type: string;
  src_path: string;
  src_meta: string;
  dst_path: string;
  dst_meta: string;
  user_id: null | number;
  cron_display: string;
  cron: string;
  cron_type: string;
  cron_value: number;
  cron_hour: number;
  cron_minute: number;
  cron_weekday: number;
  cron_day: number;
  speed: number;
  method: string;
  exclude_template_id: null | number;
  rename_template_id: null | number;
  end_time: null | string;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  editData: null,
});

const emit = defineEmits<{
  success: [];
  'update:visible': [value: boolean];
}>();

const Settings = createIconifyIcon('mdi:cog');
const ClockOutline = createIconifyIcon('mdi:clock-outline');
const Play = createIconifyIcon('mdi:play');
const FileDocument = createIconifyIcon('mdi:file-document-outline');

const accountOptions = ref<Array<SelectOption<number> & { cookies?: string }>>(
  [],
);
const accountCache = ref<
  Map<string, Array<SelectOption<number> & { cookies?: string }>>
>(new Map());
const accountLoading = ref(false);

const exclusionRuleOptions = ref<RuleTemplateOption[]>([]);
const renameRuleOptions = ref<RuleTemplateOption[]>([]);

const sourceOptions = ref<Array<SelectOption<string>>>([]);
const sourceOptionsCache = ref<Map<string, Array<SelectOption<string>>>>(
  new Map(),
);
const sourceLoading = ref(false);

const pathSelectionModalVisible = ref(false);
const pathSelectionMode = ref<'source' | 'target'>('source');
const selectedAccountCookies = ref('');

const sourceType = ref('');
const sourceId = ref('');

const isEditMode = ref(false);
const editingConfigId = ref<null | number>(null);
const hydratingForm = ref(false);

const formData = ref<SyncConfigFormData>(createDefaultFormData());

const driveTypeOptions = computed(() => {
  return getDictOptions(DictEnum.DRIVE_TYPE).map((option) => ({
    label: option.label,
    value: String(option.value),
  }));
});

const sourceTypeOptions: Array<SelectOption<string>> = [
  { label: '我的网盘', value: '' },
  { label: '好友分享', value: 'friend' },
  { label: '群组分享', value: 'group' },
  { label: '分享链接', value: 'link' },
];

const cronTypeOptions: Array<SelectOption<string>> = [
  { label: '手动执行', value: '' },
  { label: '每天执行', value: 'daily' },
  { label: '每 N 天执行', value: 'n_days' },
  { label: '每小时执行', value: 'hourly' },
  { label: '每 N 小时执行', value: 'n_hours' },
  { label: '每 N 分钟执行', value: 'n_minutes' },
  { label: '每 N 秒执行', value: 'n_seconds' },
  { label: '每周执行', value: 'weekly' },
  { label: '每月执行', value: 'monthly' },
];

const weekdayOptions: Array<SelectOption<number>> = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 7 },
];

const syncMethodOptions = computed(() => {
  return SYNC_METHOD_OPTIONS.map((option) => ({
    description: option.description,
    label: option.label,
    value: option.value,
  }));
});

const recursionSpeedOptions = computed(() => {
  return RECURSION_SPEED_OPTIONS.map((option) => ({
    key: option.key,
    label: option.label,
    value: option.value,
  }));
});

const exclusionRuleSelectOptions = computed(() => {
  return exclusionRuleOptions.value.map((option) => ({
    label: option.label,
    value: option.value,
  }));
});

const renameRuleSelectOptions = computed(() => {
  return renameRuleOptions.value.map((option) => ({
    label: option.label,
    value: option.value,
  }));
});

const {
  needsValueInput,
  needsTimeInput,
  needsWeekdayInput,
  needsDayInput,
  getMaxValue,
  getUnitText,
  parseCronExpression,
  updateCronExpression,
} = useCronScheduler(formData);

watch(
  () => formData.value.type,
  async (newType, oldType) => {
    if (hydratingForm.value) {
      return;
    }

    if (oldType && newType !== oldType) {
      formData.value.user_id = null;
      accountOptions.value = [];
      selectedAccountCookies.value = '';
      resetSourceSelection();
    }

    await loadAccountOptions(newType);
  },
);

watch(
  () => formData.value.user_id,
  async (newUserId, oldUserId) => {
    const selectedAccount = accountOptions.value.find(
      (account) => account.value === newUserId,
    );
    selectedAccountCookies.value = selectedAccount?.cookies || '';

    if (!hydratingForm.value && oldUserId && newUserId !== oldUserId) {
      resetSourceSelection();
    }

    if (
      !hydratingForm.value &&
      selectedAccountCookies.value &&
      (sourceType.value === 'friend' || sourceType.value === 'group')
    ) {
      await loadSourceOptions(sourceType.value);
    }
  },
);

watch(
  [() => props.visible, () => props.editData],
  async ([visible, editData]) => {
    if (!visible) {
      return;
    }

    hydratingForm.value = true;

    try {
      if (editData) {
        await initializeEditForm(editData);
        return;
      }

      resetForm();
    } finally {
      hydratingForm.value = false;
    }
  },
  { immediate: false },
);

watch(
  () => props.visible,
  (visible) => {
    if (!visible) {
      resetForm();
    }
  },
);

function createDefaultFormData(): SyncConfigFormData {
  return {
    enable: true,
    remark: '',
    type: '',
    src_path: '',
    src_meta: '',
    dst_path: '',
    dst_meta: '',
    user_id: null,
    cron_display: '',
    cron: '',
    cron_type: '',
    cron_value: 1,
    cron_hour: 2,
    cron_minute: 0,
    cron_weekday: 1,
    cron_day: 1,
    speed: 0,
    method: 'incremental',
    exclude_template_id: null,
    rename_template_id: null,
    end_time: null,
  };
}

function resetSourceSelection() {
  sourceType.value = '';
  sourceId.value = '';
  sourceOptions.value = [];
  formData.value.src_path = '';
  formData.value.src_meta = '';
}

function resetForm() {
  formData.value = createDefaultFormData();
  isEditMode.value = false;
  editingConfigId.value = null;
  accountOptions.value = [];
  selectedAccountCookies.value = '';
  resetSourceSelection();
}

async function initializeEditForm(editData: any) {
  resetForm();

  isEditMode.value = true;
  editingConfigId.value = editData.id ?? null;

  formData.value = {
    enable: Boolean(editData.enable),
    remark: editData.remark || '',
    type: editData.type || '',
    src_path: editData.src_path || '',
    src_meta: editData.src_meta || '',
    dst_path: editData.dst_path || '',
    dst_meta: editData.dst_meta || '',
    user_id: editData.user_id || null,
    cron_display: '',
    cron: editData.cron || '',
    cron_type: '',
    cron_value: 1,
    cron_hour: 2,
    cron_minute: 0,
    cron_weekday: 1,
    cron_day: 1,
    speed: editData.speed ?? 0,
    method: editData.method || 'incremental',
    exclude_template_id: editData.exclude_template_id || null,
    rename_template_id: editData.rename_template_id || null,
    end_time: editData.end_time || null,
  };

  if (editData.src_meta) {
    try {
      const srcMeta = JSON.parse(editData.src_meta);
      sourceType.value = srcMeta.source_type || '';
      sourceId.value = srcMeta.source_id || '';
    } catch (error) {
      console.error('解析来源元数据失败:', error);
    }
  }

  if (editData.cron) {
    parseCronExpression(editData.cron);
  } else {
    formData.value.cron_type = '';
    formData.value.cron_display = '手动执行';
  }

  if (editData.type) {
    await loadAccountOptions(editData.type);
    formData.value.user_id = editData.user_id || null;

    const selectedAccount = accountOptions.value.find(
      (account) => account.value === editData.user_id,
    );
    selectedAccountCookies.value = selectedAccount?.cookies || '';
  }

  if (
    selectedAccountCookies.value &&
    sourceType.value &&
    (sourceType.value === 'friend' || sourceType.value === 'group')
  ) {
    await loadSourceOptions(sourceType.value);
  }
}

async function loadAccountOptions(type?: string) {
  if (!type) {
    accountOptions.value = [];
    return;
  }

  if (accountCache.value.has(type)) {
    accountOptions.value = accountCache.value.get(type) || [];
    return;
  }

  accountLoading.value = true;

  try {
    const params: CoulddriveUserListParams = {
      type,
      is_valid: true,
      page: 1,
      size: 100,
    };
    const response = await getCoulddriveUserListApi(params);
    const accounts = response.items || [];

    const options = accounts.map((account: CoulddriveDriveAccountDetail) => ({
      label: `${account.username || account.user_id} (${account.type})`,
      value: account.id,
      cookies: account.cookies,
    }));

    accountCache.value.set(type, options);
    accountOptions.value = options;
  } catch (error) {
    console.error('获取关联账号失败:', error);
    message.error('获取关联账号失败');
    accountOptions.value = [];
  } finally {
    accountLoading.value = false;
  }
}

async function loadExclusionRuleOptions() {
  try {
    const response = await getRuleTemplatesByTypeApi('exclusion');
    exclusionRuleOptions.value = [
      {
        label: '不使用排除规则',
        value: null,
        description: '同步时不过滤任何文件',
      },
      ...response.map((template: any) => ({
        label: template.template_name,
        value: template.id,
        description: template.description,
      })),
    ];
  } catch (error) {
    console.error('获取排除规则模板失败:', error);
    exclusionRuleOptions.value = [
      {
        label: '不使用排除规则',
        value: null,
        description: '同步时不过滤任何文件',
      },
    ];
  }
}

async function loadRenameRuleOptions() {
  try {
    const response = await getRuleTemplatesByTypeApi('rename');
    renameRuleOptions.value = [
      {
        label: '不使用重命名规则',
        value: null,
        description: '同步时保留原始文件名',
      },
      ...response.map((template: any) => ({
        label: template.template_name,
        value: template.id,
        description: template.description,
      })),
    ];
  } catch (error) {
    console.error('获取重命名规则模板失败:', error);
    renameRuleOptions.value = [
      {
        label: '不使用重命名规则',
        value: null,
        description: '同步时保留原始文件名',
      },
    ];
  }
}

async function onSourceTypeChange(type: string) {
  sourceType.value = type;
  sourceId.value = '';
  sourceOptions.value = [];
  formData.value.src_path = '';
  formData.value.src_meta = '';

  if (type === 'friend' || type === 'group') {
    await loadSourceOptions(type);
  }
}

function onSourceIdChange() {
  formData.value.src_path = '';
  formData.value.src_meta = '';
}

async function loadSourceOptions(type: string) {
  if (!selectedAccountCookies.value || !formData.value.user_id) {
    sourceOptions.value = [];
    return;
  }

  const cacheKey = `${formData.value.type}_${type}_${formData.value.user_id}`;

  if (sourceOptionsCache.value.has(cacheKey)) {
    sourceOptions.value = sourceOptionsCache.value.get(cacheKey) || [];
    return;
  }

  sourceLoading.value = true;

  try {
    const params: CoulddriveRelationshipParams = {
      drive_type: formData.value.type,
      relationship_type: type as 'friend' | 'group',
      page: 1,
      size: 100,
    };

    const response = await getCoulddriveRelationshipListApi(
      params,
      selectedAccountCookies.value,
    );
    const items = response.items || [];

    const options =
      type === 'friend'
        ? items.map((item: any) => ({
            label: item.nick_name || item.uname || String(item.uk),
            value: String(item.uk),
          }))
        : items.map((item: any) => ({
            label: item.name || String(item.gid),
            value: String(item.gid),
          }));

    sourceOptionsCache.value.set(cacheKey, options);
    sourceOptions.value = options;
  } catch (error) {
    console.error('获取来源选项失败:', error);
    message.error('获取来源选项失败');
    sourceOptions.value = [];
  } finally {
    sourceLoading.value = false;
  }
}

async function selectSourcePath() {
  if (!formData.value.type || !formData.value.user_id) {
    message.warning('请先选择网盘类型和关联账号');
    return;
  }

  if (sourceType.value && !sourceId.value) {
    message.warning(
      sourceType.value === 'link'
        ? '请先填写分享链接'
        : '请先选择来源对象后再选择路径',
    );
    return;
  }

  pathSelectionMode.value = 'source';
  pathSelectionModalVisible.value = true;
}

async function selectTargetPath() {
  if (!formData.value.type || !formData.value.user_id) {
    message.warning('请先选择网盘类型和关联账号');
    return;
  }

  pathSelectionMode.value = 'target';
  pathSelectionModalVisible.value = true;
}

function handleFileSelectConfirm(data: any) {
  if (pathSelectionMode.value === 'source') {
    const sourcePath =
      data.selectedFiles &&
      data.selectedFiles.length > 0 &&
      data.selectedFiles[0].is_folder
        ? data.selectedFiles[0].file_path
        : data.currentPath || data.path;

    formData.value.src_path = sourcePath;
    formData.value.src_meta = JSON.stringify({
      source_id: sourceId.value,
      source_type: sourceType.value,
    });

    message.success(`已选择源路径：${formData.value.src_path}`);
  } else {
    if (
      data.selectedFiles &&
      data.selectedFiles.length > 0 &&
      data.selectedFiles[0].is_folder
    ) {
      const selectedFolder = data.selectedFiles[0];
      formData.value.dst_path = selectedFolder.file_path;
      formData.value.dst_meta = JSON.stringify({
        file_id: selectedFolder.file_id,
      });
    } else {
      const currentPath = data.currentPath || data.path;
      formData.value.dst_path = currentPath;
      formData.value.dst_meta = JSON.stringify({
        file_id: data.fileId || '0',
        file_path: currentPath,
      });
    }

    message.success(`已选择目标路径：${formData.value.dst_path}`);
  }

  pathSelectionModalVisible.value = false;
}

function handleFileSelectCancel() {
  pathSelectionModalVisible.value = false;
}

function getPopupContainer(triggerNode: HTMLElement) {
  return triggerNode.parentElement ?? document.body;
}

async function handleSubmit() {
  if (
    !formData.value.remark.trim() ||
    !formData.value.type ||
    !formData.value.user_id ||
    !formData.value.src_path ||
    !formData.value.dst_path
  ) {
    message.error('请填写完整的必填信息');
    return;
  }

  const submitData = {
    enable: formData.value.enable,
    remark: formData.value.remark.trim(),
    type: formData.value.type,
    src_path: formData.value.src_path,
    src_meta: formData.value.src_meta || '',
    dst_path: formData.value.dst_path,
    dst_meta: formData.value.dst_meta || '',
    user_id: formData.value.user_id,
    cron: formData.value.cron || '',
    speed: formData.value.speed,
    method: formData.value.method as any,
    exclude_template_id: formData.value.exclude_template_id,
    rename_template_id: formData.value.rename_template_id,
    end_time: formData.value.end_time || null,
  };

  try {
    if (isEditMode.value && editingConfigId.value !== null) {
      await updateCoulddriveSyncConfigApi(
        editingConfigId.value,
        submitData as any,
      );
      message.success('同步配置更新成功');
    } else {
      await createCoulddriveSyncConfigApi(submitData as any);
      message.success('同步配置创建成功');
    }

    emit('success');
    handleClose();
  } catch (error) {
    console.error('提交同步配置失败:', error);
    message.error(isEditMode.value ? '更新失败' : '创建失败');
  }
}

function handleClose() {
  emit('update:visible', false);
}

onMounted(() => {
  getDictOptions(DictEnum.DRIVE_TYPE);
  loadExclusionRuleOptions();
  loadRenameRuleOptions();
});
</script>

<template>
  <a-drawer
    :open="visible"
    :title="isEditMode ? '编辑同步配置' : '新增同步配置'"
    :size="800"
    @close="handleClose"
  >
    <div class="space-y-6">
      <div class="rounded-lg bg-gray-50 p-4">
        <h3 class="mb-4 flex items-center text-lg font-medium">
          <Settings class="mr-2" />
          基本信息
        </h3>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              备注 *
            </label>
            <a-input
              v-model:value="formData.remark"
              placeholder="请输入配置备注"
              class="w-full"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              网盘类型 *
            </label>
            <a-select
              v-model:value="formData.type"
              placeholder="请选择网盘类型"
              class="w-full"
              :get-popup-container="getPopupContainer"
              :options="driveTypeOptions"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              关联账号 *
            </label>
            <a-select
              v-model:value="formData.user_id"
              placeholder="请选择关联账号"
              class="w-full"
              show-search
              option-filter-prop="label"
              :loading="accountLoading"
              :get-popup-container="getPopupContainer"
              :options="accountOptions"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              状态
            </label>
            <a-switch
              v-model:checked="formData.enable"
              checked-children="启用"
              un-checked-children="禁用"
            />
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-gray-50 p-4">
        <h3 class="mb-4 flex items-center text-lg font-medium">
          <FileDocument class="mr-2" />
          路径配置
        </h3>

        <div class="mb-6">
          <h4 class="mb-3 text-base font-medium">源路径配置</h4>

          <div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">
                来源类型
              </label>
              <a-select
                v-model:value="sourceType"
                placeholder="请选择来源类型"
                class="w-full"
                :get-popup-container="getPopupContainer"
                :options="sourceTypeOptions"
                @change="onSourceTypeChange"
              />
            </div>

            <div v-if="sourceType === 'friend' || sourceType === 'group'">
              <label class="mb-1 block text-sm font-medium text-gray-700">
                {{ sourceType === 'friend' ? '分享好友' : '分享群组' }}
              </label>
              <a-select
                v-model:value="sourceId"
                :placeholder="
                  sourceType === 'friend' ? '请选择分享好友' : '请选择分享群组'
                "
                class="w-full"
                show-search
                option-filter-prop="label"
                :loading="sourceLoading"
                :get-popup-container="getPopupContainer"
                :options="sourceOptions"
                @change="onSourceIdChange"
              />
            </div>

            <div v-if="sourceType === 'link'">
              <label class="mb-1 block text-sm font-medium text-gray-700">
                分享链接
              </label>
              <a-input
                v-model:value="sourceId"
                placeholder="请输入分享链接，支持 link 或 link|密码"
                class="w-full"
                @change="onSourceIdChange"
              />
              <div class="mt-1 text-xs text-gray-500">
                示例：`https://pan.quark.cn/s/xxxxx` 或
                `https://pan.quark.cn/s/xxxxx|1234`
              </div>
            </div>
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              源路径 *
            </label>
            <div class="flex gap-2">
              <a-input
                v-model:value="formData.src_path"
                placeholder="请选择源路径"
                readonly
                class="flex-1"
              />
              <a-button type="primary" @click="selectSourcePath">
                选择路径
              </a-button>
            </div>
          </div>
        </div>

        <div>
          <h4 class="mb-3 text-base font-medium">目标路径配置</h4>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              目标路径 *
            </label>
            <div class="flex gap-2">
              <a-input
                v-model:value="formData.dst_path"
                placeholder="请选择目标路径"
                readonly
                class="flex-1"
              />
              <a-button type="primary" @click="selectTargetPath">
                选择路径
              </a-button>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-gray-50 p-4">
        <h3 class="mb-4 flex items-center text-lg font-medium">
          <Play class="mr-2" />
          同步设置
        </h3>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              同步方式
            </label>
            <a-select
              v-model:value="formData.method"
              class="w-full"
              :get-popup-container="getPopupContainer"
              :options="syncMethodOptions"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              递归速度
            </label>
            <a-select
              v-model:value="formData.speed"
              class="w-full"
              :get-popup-container="getPopupContainer"
              :options="recursionSpeedOptions"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              排除规则模板
            </label>
            <a-select
              v-model:value="formData.exclude_template_id"
              placeholder="请选择排除规则模板"
              class="w-full"
              allow-clear
              :get-popup-container="getPopupContainer"
              :options="exclusionRuleSelectOptions"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              重命名规则模板
            </label>
            <a-select
              v-model:value="formData.rename_template_id"
              placeholder="请选择重命名规则模板"
              class="w-full"
              allow-clear
              :get-popup-container="getPopupContainer"
              :options="renameRuleSelectOptions"
            />
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-gray-50 p-4">
        <h3 class="mb-4 flex items-center text-lg font-medium">
          <ClockOutline class="mr-2" />
          定时设置
        </h3>

        <div class="space-y-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              定时类型
            </label>
            <a-select
              v-model:value="formData.cron_type"
              placeholder="请选择定时类型"
              class="w-full"
              :get-popup-container="getPopupContainer"
              :options="cronTypeOptions"
              @change="updateCronExpression"
            />
          </div>

          <div v-if="needsValueInput" class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">
                间隔{{ getUnitText() }}
              </label>
              <a-input-number
                v-model:value="formData.cron_value"
                :min="1"
                :max="getMaxValue()"
                class="w-full"
                @change="updateCronExpression"
              />
            </div>
          </div>

          <div v-if="needsTimeInput" class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">
                小时
              </label>
              <a-input-number
                v-model:value="formData.cron_hour"
                :min="0"
                :max="23"
                class="w-full"
                @change="updateCronExpression"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">
                分钟
              </label>
              <a-input-number
                v-model:value="formData.cron_minute"
                :min="0"
                :max="59"
                class="w-full"
                @change="updateCronExpression"
              />
            </div>
          </div>

          <div v-if="needsWeekdayInput">
            <label class="mb-1 block text-sm font-medium text-gray-700">
              星期
            </label>
            <a-select
              v-model:value="formData.cron_weekday"
              class="w-full"
              :get-popup-container="getPopupContainer"
              :options="weekdayOptions"
              @change="updateCronExpression"
            />
          </div>

          <div v-if="needsDayInput">
            <label class="mb-1 block text-sm font-medium text-gray-700">
              每月第几天
            </label>
            <a-input-number
              v-model:value="formData.cron_day"
              :min="1"
              :max="31"
              class="w-full"
              @change="updateCronExpression"
            />
          </div>

          <div
            v-if="formData.cron_display"
            class="rounded border-l-4 border-blue-400 bg-blue-50 p-3"
          >
            <p class="text-sm text-blue-700">
              <strong>执行计划：</strong>{{ formData.cron_display }}
            </p>
            <p class="mt-1 text-xs text-blue-600">
              <strong>Cron 表达式：</strong>{{ formData.cron }}
            </p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-gray-50 p-4">
        <h3 class="mb-4 text-lg font-medium">其他设置</h3>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">
            结束时间
          </label>
          <a-date-picker
            v-model:value="formData.end_time"
            show-time
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择结束时间，可留空"
            class="w-full"
            :get-popup-container="getPopupContainer"
          />
          <p class="mt-1 text-xs text-gray-500">留空表示长期有效</p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end space-x-2">
        <a-button @click="handleClose">取消</a-button>
        <a-button type="primary" @click="handleSubmit">
          {{ isEditMode ? '更新' : '创建' }}
        </a-button>
      </div>
    </template>
  </a-drawer>

  <FileSelector
    v-model:visible="pathSelectionModalVisible"
    :drive-type="formData.type"
    :auth-token="selectedAccountCookies"
    :mode="pathSelectionMode === 'source' && sourceType ? 'share' : 'disk'"
    :share-params="
      pathSelectionMode === 'source' && sourceType
        ? {
            sourceType,
            sourceId,
          }
        : undefined
    "
    :initial-path="
      pathSelectionMode === 'source' ? formData.src_path : formData.dst_path
    "
    :title="`选择${pathSelectionMode === 'source' ? '源' : '目标'}路径`"
    @confirm="handleFileSelectConfirm"
    @cancel="handleFileSelectCancel"
  />
</template>
