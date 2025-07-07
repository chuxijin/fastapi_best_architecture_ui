<script setup lang="ts">
import type { CoulddriveDriveAccountDetail, CoulddriveUserListParams } from '#/api';
import type { CoulddriveFileInfo, CoulddriveListFilesParams, CoulddriveListShareFilesParams, CoulddriveRelationshipParams } from '#/api';

import { ref, computed, watch, onMounted } from 'vue';
import { message, Modal, Tag, Button, Switch } from 'ant-design-vue';
import { createIconifyIcon } from '@vben/icons';

import {
  createCoulddriveSyncConfigApi,
  updateCoulddriveSyncConfigApi,
  getCoulddriveUserListApi,
  getRuleTemplatesByTypeApi,
  RECURSION_SPEED_OPTIONS,
  SYNC_METHOD_OPTIONS,
  DRIVE_TYPE_OPTIONS,
  getCoulddriveFileListApi,
  getCoulddriveShareFileListApi,
  getCoulddriveRelationshipListApi
} from '#/api';
// 移除usePathNavigation导入，由FileSelector组件处理
import FileSelector from '#/components/FileSelector.vue';

// 创建图标组件
const Settings = createIconifyIcon('mdi:cog');
const ClockOutline = createIconifyIcon('mdi:clock-outline');
const Plus = createIconifyIcon('mdi:plus');
const Play = createIconifyIcon('mdi:play');
const FileDocument = createIconifyIcon('mdi:file-document-outline');

// Props
interface Props {
  visible?: boolean;
  editData?: any;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  editData: null,
});

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean];
  'success': [];
}>();

// 账号选项
const accountOptions = ref<Array<{ label: string; value: number; cookies?: string }>>([]);

// 规则模板选项
const exclusionRuleOptions = ref<Array<{ label: string; value: number | null; description?: string }>>([]);
const renameRuleOptions = ref<Array<{ label: string; value: number | null; description?: string }>>([]);

// 缓存
const accountCache = ref<Map<string, Array<{ label: string; value: number; cookies?: string }>>>(new Map());
const sourceOptionsCache = ref<Map<string, Array<{ label: string; value: string }>>>(new Map());

// 路径选择相关状态
const pathSelectionModalVisible = ref(false);
const pathSelectionMode = ref<'source' | 'target'>('source');
const selectedAccountCookies = ref('');

// 来源选择相关状态
const sourceType = ref('');
const sourceId = ref('');
const sourceOptions = ref<Array<{ label: string; value: string }>>([]);

// 文件选择状态 - 移除，由FileSelector组件处理

// 编辑模式状态
const isEditMode = ref(false);
const editingConfigId = ref<number | null>(null);

// 表单数据
const formData = ref({
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
});

// 移除breadcrumbPaths，由FileSelector组件处理

// 是否需要数值输入
const needsValueInput = computed(() => {
  return ['n_days', 'n_hours', 'n_minutes', 'n_seconds'].includes(formData.value.cron_type);
});

// 是否需要时间输入
const needsTimeInput = computed(() => {
  return ['daily', 'n_days', 'weekly', 'monthly'].includes(formData.value.cron_type);
});

// 是否需要周几选择
const needsWeekdayInput = computed(() => {
  return formData.value.cron_type === 'weekly';
});

// 是否需要月几号选择
const needsDayInput = computed(() => {
  return formData.value.cron_type === 'monthly';
});

// 移除canGoBack，由FileSelector组件处理

// 监听网盘类型变化，自动加载对应账号
watch(() => formData.value.type, async (newType, oldType) => {
  // 只有在用户手动更改类型时才清空账号选择，编辑模式下不清空
  if (oldType && newType !== oldType && !isEditMode.value) {
    formData.value.user_id = null;
    selectedAccountCookies.value = '';
  }
  await loadAccountOptions(newType);
}, { immediate: false });

// 监听账号变化，获取 cookies
watch(() => formData.value.user_id, (newUserId) => {
  if (newUserId) {
    const account = accountOptions.value.find(acc => acc.value === newUserId);
    selectedAccountCookies.value = account?.cookies || '';
  } else {
    selectedAccountCookies.value = '';
  }
}, { immediate: false });

// 监听抽屉打开和编辑数据变化
watch([() => props.visible, () => props.editData], async ([visible, newData]) => {
  if (!visible) return; // 如果抽屉未打开，不处理

  if (newData) {
    isEditMode.value = true;
    editingConfigId.value = newData.id;

    // 填充表单数据
    formData.value = {
      enable: newData.enable,
      remark: newData.remark || '',
      type: newData.type || '',
      src_path: newData.src_path || '',
      src_meta: newData.src_meta || '',
      dst_path: newData.dst_path || '',
      dst_meta: newData.dst_meta || '',
      user_id: newData.user_id || null,
      cron_display: '',
      cron: newData.cron || '',
      cron_type: '',
      cron_value: 1,
      cron_hour: 2,
      cron_minute: 0,
      cron_weekday: 1,
      cron_day: 1,
      speed: newData.speed || 0,
      method: newData.method || 'incremental',
      exclude_template_id: newData.exclude_template_id || null,
      rename_template_id: newData.rename_template_id || null,
      end_time: newData.end_time || null,
    };

    // 解析 src_meta
    if (newData.src_meta) {
      try {
        const srcMeta = JSON.parse(newData.src_meta);
        sourceType.value = srcMeta.source_type || '';
        sourceId.value = srcMeta.source_id || '';
      } catch (error) {
        console.error('解析 src_meta 失败:', error);
      }
    }

    // 解析 cron 表达式
    if (newData.cron) {
      parseCronExpression(newData.cron);
    } else {
      // 如果没有 cron 表达式，设置为手动执行
      formData.value.cron_type = '';
      formData.value.cron_display = '手动执行';
    }

                // 加载相关数据
    if (newData.type) {
      await loadAccountOptions(newData.type);

      // 确保user_id在账号选项加载后重新设置
      formData.value.user_id = newData.user_id;

      // 设置选中账号的cookies
      const selectedAccount = accountOptions.value.find(account => account.value === newData.user_id);
      if (selectedAccount) {
        selectedAccountCookies.value = selectedAccount.cookies || '';
      }
    }

    // 如果有来源类型，加载对应的来源选项
    if (sourceType.value && (sourceType.value === 'friend' || sourceType.value === 'group')) {
      await loadSourceOptions(sourceType.value);
    }
  } else {
    // 只有在新建模式下才重置表单
    resetForm();
  }
}, { immediate: false });

// 获取账号列表
async function loadAccountOptions(type?: string) {
  if (!type) {
    accountOptions.value = [];
    return;
  }

  if (accountCache.value.has(type)) {
    accountOptions.value = accountCache.value.get(type) || [];
    return;
  }

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
    console.error('获取账号列表失败:', error);
    message.error('获取账号列表失败');
    accountOptions.value = [];
  }
}

// 获取排除规则模板
async function loadExclusionRuleOptions() {
  try {
    const response = await getRuleTemplatesByTypeApi('exclusion');
    exclusionRuleOptions.value = [
      { label: '无排除规则', value: null, description: '不使用任何排除规则' },
      ...response.map((template: any) => ({
        label: template.template_name,
        value: template.id,
        description: template.description,
      })),
    ];
  } catch (error) {
    console.error('获取排除规则模板失败:', error);
    exclusionRuleOptions.value = [
      { label: '无排除规则', value: null, description: '不使用任何排除规则' },
    ];
  }
}

// 获取重命名规则模板
async function loadRenameRuleOptions() {
  try {
    const response = await getRuleTemplatesByTypeApi('rename');
    renameRuleOptions.value = [
      { label: '无重命名规则', value: null, description: '不使用任何重命名规则' },
      ...response.map((template: any) => ({
        label: template.template_name,
        value: template.id,
        description: template.description,
      })),
    ];
  } catch (error) {
    console.error('获取重命名规则模板失败:', error);
    renameRuleOptions.value = [
      { label: '无重命名规则', value: null, description: '不使用任何重命名规则' },
    ];
  }
}

// 重建面包屑路径
function rebuildBreadcrumbPaths(targetPath: string) {
  const pathSegments = targetPath.split('/').filter(segment => segment);
  const newBreadcrumbs = [{ path: '/', file_id: '0', name: '根目录' }];

  let currentPath = '';
  for (const segment of pathSegments) {
    currentPath += '/' + segment;
    newBreadcrumbs.push({
      path: currentPath,
      file_id: '0', // 对于中间路径，我们使用默认的file_id
      name: segment
    });
  }

  return newBreadcrumbs;
}

// 路径选择相关函数
async function selectSourcePath() {
  if (!formData.value.type || !formData.value.user_id) {
    message.warning('请先选择网盘类型和关联账号');
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

// 处理来源类型变化
async function onSourceTypeChange(type: string) {
  sourceId.value = '';
  sourceOptions.value = [];

  if (type === 'friend' || type === 'group') {
    await loadSourceOptions(type);
  }
}

// 处理来源ID变化
async function onSourceIdChange(id: string) {
  // 移除具体实现，由FileSelector组件处理
}

// 加载来源选项（好友或群组）
async function loadSourceOptions(type: string) {
  if (!selectedAccountCookies.value) {
    message.error('账号认证信息缺失');
    return;
  }

  const cacheKey = `${formData.value.type}_${type}_${formData.value.user_id}`;

  if (sourceOptionsCache.value.has(cacheKey)) {
    sourceOptions.value = sourceOptionsCache.value.get(cacheKey) || [];
    return;
  }

  try {
    const params: CoulddriveRelationshipParams = {
      drive_type: formData.value.type,
      relationship_type: type as 'friend' | 'group',
      page: 1,
      size: 100,
    };

    const response = await getCoulddriveRelationshipListApi(params, selectedAccountCookies.value);
    const items = response.items || [];

    let options: Array<{ label: string; value: string }> = [];

    if (type === 'friend') {
      options = items.map((item: any) => ({
        label: item.nick_name || item.uname || item.uk,
        value: item.uk.toString(),
      }));
    } else if (type === 'group') {
      options = items.map((item: any) => ({
        label: item.name || item.gid,
        value: item.gid,
      }));
    }

    sourceOptionsCache.value.set(cacheKey, options);
    sourceOptions.value = options;
  } catch (error) {
    console.error('加载来源选项失败:', error);
    message.error('加载来源选项失败');
    sourceOptions.value = [];
  }
}

// 处理文件选择确认
function handleFileSelectConfirm(data: any) {
  if (pathSelectionMode.value === 'source') {
    // 对于源路径，如果有选中的文件夹，使用选中文件夹的路径
    if (data.selectedFiles && data.selectedFiles.length > 0 && data.selectedFiles[0].is_folder) {
      formData.value.src_path = data.selectedFiles[0].file_path;
    } else {
      formData.value.src_path = data.currentPath || data.path;
    }

    if (sourceType.value && sourceId.value) {
      formData.value.src_meta = JSON.stringify({
        source_type: sourceType.value,
        source_id: sourceId.value,
      });
    }
    message.success(`已选择源路径: ${formData.value.src_path}`);
  } else if (pathSelectionMode.value === 'target') {
    // 对于目标路径，如果有选中的文件夹，使用选中文件夹的信息
    if (data.selectedFiles && data.selectedFiles.length > 0 && data.selectedFiles[0].is_folder) {
      const selectedFolder = data.selectedFiles[0];
      formData.value.dst_path = selectedFolder.file_path;
      formData.value.dst_meta = JSON.stringify({
        file_id: selectedFolder.file_id,
      });
    } else {
      // 如果没有选中文件夹，使用当前路径
      formData.value.dst_path = data.currentPath || data.path;
      formData.value.dst_meta = JSON.stringify({
        file_path: data.currentPath || data.path,
        file_id: data.fileId || '0',
      });
    }
    message.success(`已选择目标路径: ${formData.value.dst_path}`);
  }
  pathSelectionModalVisible.value = false;
}

// 处理文件选择取消
function handleFileSelectCancel() {
  pathSelectionModalVisible.value = false;
}

// 移除这些函数，由FileSelector组件处理

// 文件大小格式化
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 格式化时间
function formatDateTime(dateTime: string | number | null): string {
  if (!dateTime) return '';
  try {
    // 如果是数字或数字字符串，当作Unix时间戳处理
    const timestamp = typeof dateTime === 'string' ? parseInt(dateTime) : dateTime;
    if (!isNaN(timestamp) && timestamp > 0) {
      // Unix时间戳通常是秒，如果小于13位则乘以1000转为毫秒
      const ms = timestamp.toString().length <= 10 ? timestamp * 1000 : timestamp;
      const date = new Date(ms);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString();
      }
    }
    // 尝试直接解析为日期
    const date = new Date(dateTime);
    if (!isNaN(date.getTime())) {
      return date.toLocaleString();
    }
    return '';
  } catch {
    return '';
  }
}

// 获取最大值
function getMaxValue() {
  switch (formData.value.cron_type) {
    case 'n_days': return 365;
    case 'n_hours': return 23;
    case 'n_minutes': return 59;
    case 'n_seconds': return 59;
    default: return 100;
  }
}

// 获取单位文本
function getUnitText() {
  switch (formData.value.cron_type) {
    case 'n_days': return '天';
    case 'n_hours': return '小时';
    case 'n_minutes': return '分钟';
    case 'n_seconds': return '秒';
    default: return '';
  }
}

// 获取星期几的显示文本
function getWeekdayText(weekday: number): string {
  const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  return weekdays[weekday - 1] || '周一';
}

// 解析cron表达式
function parseCronExpression(cronExpr: string) {
  if (!cronExpr || cronExpr.trim() === '') {
    formData.value.cron_type = '';
    formData.value.cron_display = '手动执行';
    return;
  }

  const parts = cronExpr.trim().split(/\s+/);

  try {
    if (parts.length === 5) {
      // 标准 5 段 cron 表达式: minute hour day month weekday
      const [minute, hour, day, month, weekday] = parts;

      // 每天执行: 固定分钟和小时，日月周都是 *
      if (day === '*' && month === '*' && weekday === '*' && !minute.includes('/') && !hour.includes('/')) {
        formData.value.cron_type = 'daily';
        formData.value.cron_hour = parseInt(hour);
        formData.value.cron_minute = parseInt(minute);
        formData.value.cron_display = `每天${hour.padStart(2, '0')}:${minute.padStart(2, '0')}执行`;
        return;
      }

      // 每N天执行: 分钟和小时固定，日是 */N 格式
      if (day.includes('/') && month === '*' && weekday === '*') {
        const dayMatch = day.match(/^\*\/(\d+)$/);
        if (dayMatch) {
          formData.value.cron_type = 'n_days';
          formData.value.cron_value = parseInt(dayMatch[1]);
          formData.value.cron_hour = parseInt(hour);
          formData.value.cron_minute = parseInt(minute);
          formData.value.cron_display = `每${dayMatch[1]}天${hour.padStart(2, '0')}:${minute.padStart(2, '0')}执行`;
          return;
        }
      }

      // 每小时执行: 0 * * * *
      if (minute === '0' && hour === '*' && day === '*' && month === '*' && weekday === '*') {
        formData.value.cron_type = 'hourly';
        formData.value.cron_display = '每小时执行';
        return;
      }

      // 每N小时执行: 0 */N * * *
      if (minute === '0' && hour.includes('/') && day === '*' && month === '*' && weekday === '*') {
        const hourMatch = hour.match(/^\*\/(\d+)$/);
        if (hourMatch) {
          formData.value.cron_type = 'n_hours';
          formData.value.cron_value = parseInt(hourMatch[1]);
          formData.value.cron_display = `每${hourMatch[1]}小时执行`;
          return;
        }
      }

      // 每N分钟执行: */N * * * *
      if (minute.includes('/') && hour === '*' && day === '*' && month === '*' && weekday === '*') {
        const minuteMatch = minute.match(/^\*\/(\d+)$/);
        if (minuteMatch) {
          formData.value.cron_type = 'n_minutes';
          formData.value.cron_value = parseInt(minuteMatch[1]);
          formData.value.cron_display = `每${minuteMatch[1]}分钟执行`;
          return;
        }
      }

      // 每周执行: 分钟小时固定，日月是 *，周几固定
      if (day === '*' && month === '*' && !weekday.includes('*') && !minute.includes('/') && !hour.includes('/')) {
        formData.value.cron_type = 'weekly';
        formData.value.cron_hour = parseInt(hour);
        formData.value.cron_minute = parseInt(minute);
        formData.value.cron_weekday = parseInt(weekday);
        const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        const weekdayText = weekdays[parseInt(weekday) - 1] || '周一';
        formData.value.cron_display = `每${weekdayText}${hour.padStart(2, '0')}:${minute.padStart(2, '0')}执行`;
        return;
      }

      // 每月执行: 分钟小时固定，日固定，月和周是 *
      if (!day.includes('*') && month === '*' && weekday === '*' && !minute.includes('/') && !hour.includes('/')) {
        formData.value.cron_type = 'monthly';
        formData.value.cron_hour = parseInt(hour);
        formData.value.cron_minute = parseInt(minute);
        formData.value.cron_day = parseInt(day);
        formData.value.cron_display = `每月${day}号${hour.padStart(2, '0')}:${minute.padStart(2, '0')}执行`;
        return;
      }
    } else if (parts.length === 6) {
      // 6 段 cron 表达式（包含秒）: second minute hour day month weekday
      const [second, minute, hour, day, month, weekday] = parts;

      // 每N秒执行: */N * * * * *
      if (second.includes('/') && minute === '*' && hour === '*' && day === '*' && month === '*' && weekday === '*') {
        const secondMatch = second.match(/^\*\/(\d+)$/);
        if (secondMatch) {
          formData.value.cron_type = 'n_seconds';
          formData.value.cron_value = parseInt(secondMatch[1]);
          formData.value.cron_display = `每${secondMatch[1]}秒执行`;
          return;
        }
      }
    }

    // 如果无法解析，显示原始 cron 表达式
    formData.value.cron_type = '';
    formData.value.cron_display = `自定义: ${cronExpr}`;
  } catch (error) {
    console.error('解析 cron 表达式失败:', error);
    formData.value.cron_type = '';
    formData.value.cron_display = `自定义: ${cronExpr}`;
  }
}

// 更新cron表达式
function updateCronExpression() {
  const type = formData.value.cron_type;
  const value = formData.value.cron_value;
  const hour = formData.value.cron_hour;
  const minute = formData.value.cron_minute;
  const weekday = formData.value.cron_weekday;
  const day = formData.value.cron_day;

  switch (type) {
    case '':
      formData.value.cron = '';
      formData.value.cron_display = '手动执行';
      break;
    case 'daily':
      formData.value.cron = `${minute} ${hour} * * *`;
      formData.value.cron_display = `每天${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}执行`;
      break;
    case 'n_days':
      formData.value.cron = `${minute} ${hour} */${value} * *`;
      formData.value.cron_display = `每${value}天${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}执行`;
      break;
    case 'hourly':
      formData.value.cron = '0 * * * *';
      formData.value.cron_display = '每小时执行';
      break;
    case 'n_hours':
      formData.value.cron = `0 */${value} * * *`;
      formData.value.cron_display = `每${value}小时执行`;
      break;
    case 'n_minutes':
      formData.value.cron = `*/${value} * * * *`;
      formData.value.cron_display = `每${value}分钟执行`;
      break;
    case 'n_seconds':
      formData.value.cron = `*/${value} * * * * *`;
      formData.value.cron_display = `每${value}秒执行`;
      break;
    case 'weekly':
      formData.value.cron = `${minute} ${hour} * * ${weekday}`;
      formData.value.cron_display = `每${getWeekdayText(weekday)}${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}执行`;
      break;
    case 'monthly':
      formData.value.cron = `${minute} ${hour} ${day} * *`;
      formData.value.cron_display = `每月${day}号${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}执行`;
      break;
    default:
      formData.value.cron = '';
      formData.value.cron_display = '';
  }
}

// 重置表单
function resetForm() {
  formData.value = {
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
  isEditMode.value = false;
  editingConfigId.value = null;
  sourceType.value = '';
  sourceId.value = '';
  sourceOptions.value = [];
}

// 提交表单
async function handleSubmit() {
  if (!formData.value.type || !formData.value.src_path || !formData.value.dst_path || !formData.value.user_id) {
    message.error('请填写必填字段');
    return;
  }

  try {
    const {
      cron_display, cron_type, cron_value, cron_hour,
      cron_minute, cron_weekday, cron_day,
      ...submitData
    } = formData.value;

    submitData.cron = submitData.cron || '';

    if (isEditMode.value && editingConfigId.value) {
      await updateCoulddriveSyncConfigApi(editingConfigId.value, submitData as any);
      message.success('同步配置更新成功');
    } else {
      await createCoulddriveSyncConfigApi(submitData as any);
      message.success('同步配置创建成功');
    }

    emit('success');
    handleClose();
  } catch (error) {
    message.error(isEditMode.value ? '更新失败' : '创建失败');
    console.error(error);
  }
}

// 关闭抽屉
function handleClose() {
  emit('update:visible', false);
  // 不在关闭时重置表单，而是在打开新建模式时重置
}

// 组件挂载时加载规则模板选项
onMounted(() => {
  loadExclusionRuleOptions();
  loadRenameRuleOptions();
});
</script>

<template>
  <a-drawer
    :visible="visible"
    :title="isEditMode ? '编辑同步配置' : '新增同步配置'"
    width="800"
    @close="handleClose"
  >
    <div class="space-y-6">
      <!-- 基本信息 -->
      <div class="bg-gray-50 p-4 rounded-lg">
        <h3 class="text-lg font-medium mb-4 flex items-center">
          <Settings class="mr-2" />
          基本信息
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">备注 *</label>
            <a-input
              v-model:value="formData.remark"
              placeholder="请输入配置备注"
              class="w-full"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">网盘类型 *</label>
            <a-select
              v-model:value="formData.type"
              placeholder="请选择网盘类型"
              class="w-full"
            >
              <a-select-option
                v-for="option in DRIVE_TYPE_OPTIONS"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </a-select-option>
            </a-select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">关联账号 *</label>
            <a-select
              v-model:value="formData.user_id"
              placeholder="请选择关联账号"
              class="w-full"
              :loading="!accountOptions.length && formData.type"
            >
              <a-select-option
                v-for="account in accountOptions"
                :key="account.value"
                :value="account.value"
              >
                {{ account.label }}
              </a-select-option>
            </a-select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <a-switch
              v-model:checked="formData.enable"
              checked-children="启用"
              un-checked-children="禁用"
            />
          </div>
        </div>
      </div>

      <!-- 路径配置 -->
      <div class="bg-gray-50 p-4 rounded-lg">
        <h3 class="text-lg font-medium mb-4 flex items-center">
          <FileDocument class="mr-2" />
          路径配置
        </h3>

        <!-- 源路径配置 -->
        <div class="mb-6">
          <h4 class="text-md font-medium mb-3">源路径配置</h4>

          <!-- 来源类型选择 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">来源类型</label>
              <a-select
                v-model:value="sourceType"
                placeholder="请选择来源类型"
                class="w-full"
                @change="onSourceTypeChange"
              >
                <a-select-option value="">我的网盘</a-select-option>
                <a-select-option value="friend">好友分享</a-select-option>
                <a-select-option value="group">群组分享</a-select-option>
                <a-select-option value="link">链接分享</a-select-option>
              </a-select>
            </div>

            <div v-if="sourceType === 'friend' || sourceType === 'group'">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                {{ sourceType === 'friend' ? '选择好友' : '选择群组' }}
              </label>
              <a-select
                v-model:value="sourceId"
                :placeholder="`请选择${sourceType === 'friend' ? '好友' : '群组'}`"
                class="w-full"
                @change="onSourceIdChange"
                :loading="!sourceOptions.length && sourceType"
              >
                <a-select-option
                  v-for="option in sourceOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </a-select-option>
              </a-select>
            </div>

            <div v-if="sourceType === 'link'">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                分享链接
              </label>
              <a-input
                v-model:value="sourceId"
                placeholder="请输入分享链接，如：https://pan.quark.cn/s/xxxxx 或 https://pan.quark.cn/s/xxxxx|password"
                class="w-full"
                @change="onSourceIdChange"
              />
              <div class="text-xs text-gray-500 mt-1">
                支持格式：链接 或 链接|密码（如有密码）
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">源路径 *</label>
            <div class="flex gap-2">
              <a-input
                v-model:value="formData.src_path"
                placeholder="请选择源路径"
                readonly
                class="flex-1"
              />
              <a-button @click="selectSourcePath" type="primary">
                选择路径
              </a-button>
            </div>
          </div>
        </div>

        <!-- 目标路径配置 -->
        <div>
          <h4 class="text-md font-medium mb-3">目标路径配置</h4>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">目标路径 *</label>
            <div class="flex gap-2">
              <a-input
                v-model:value="formData.dst_path"
                placeholder="请选择目标路径"
                readonly
                class="flex-1"
              />
              <a-button @click="selectTargetPath" type="primary">
                选择路径
              </a-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 同步设置 -->
      <div class="bg-gray-50 p-4 rounded-lg">
        <h3 class="text-lg font-medium mb-4 flex items-center">
          <Play class="mr-2" />
          同步设置
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">同步方式</label>
            <a-select
              v-model:value="formData.method"
              class="w-full"
            >
              <a-select-option
                v-for="option in SYNC_METHOD_OPTIONS"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </a-select-option>
            </a-select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">递归速度</label>
            <a-select
              v-model:value="formData.speed"
              class="w-full"
            >
              <a-select-option
                v-for="option in RECURSION_SPEED_OPTIONS"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </a-select-option>
            </a-select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">排除规则模板</label>
            <a-select
              v-model:value="formData.exclude_template_id"
              placeholder="选择排除规则模板"
              class="w-full"
              allow-clear
            >
              <a-select-option
                v-for="option in exclusionRuleOptions"
                :key="option.value"
                :value="option.value"
                :title="option.description"
              >
                {{ option.label }}
              </a-select-option>
            </a-select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">重命名规则模板</label>
            <a-select
              v-model:value="formData.rename_template_id"
              placeholder="选择重命名规则模板"
              class="w-full"
              allow-clear
            >
              <a-select-option
                v-for="option in renameRuleOptions"
                :key="option.value"
                :value="option.value"
                :title="option.description"
              >
                {{ option.label }}
              </a-select-option>
            </a-select>
          </div>
        </div>
      </div>

      <!-- 定时设置 -->
      <div class="bg-gray-50 p-4 rounded-lg">
        <h3 class="text-lg font-medium mb-4 flex items-center">
          <ClockOutline class="mr-2" />
          定时设置
        </h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">定时类型</label>
            <a-select
              v-model:value="formData.cron_type"
              placeholder="请选择定时类型"
              class="w-full"
              @change="updateCronExpression"
            >
              <a-select-option value="">手动执行</a-select-option>
              <a-select-option value="daily">每天执行</a-select-option>
              <a-select-option value="n_days">每N天执行</a-select-option>
              <a-select-option value="hourly">每小时执行</a-select-option>
              <a-select-option value="n_hours">每N小时执行</a-select-option>
              <a-select-option value="n_minutes">每N分钟执行</a-select-option>
              <a-select-option value="n_seconds">每N秒执行</a-select-option>
              <a-select-option value="weekly">每周执行</a-select-option>
              <a-select-option value="monthly">每月执行</a-select-option>
            </a-select>
          </div>

          <!-- 数值输入 -->
          <div v-if="needsValueInput" class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
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

          <!-- 时间输入 -->
          <div v-if="needsTimeInput" class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">小时</label>
              <a-input-number
                v-model:value="formData.cron_hour"
                :min="0"
                :max="23"
                class="w-full"
                @change="updateCronExpression"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">分钟</label>
              <a-input-number
                v-model:value="formData.cron_minute"
                :min="0"
                :max="59"
                class="w-full"
                @change="updateCronExpression"
              />
            </div>
          </div>

          <!-- 星期几选择 -->
          <div v-if="needsWeekdayInput">
            <label class="block text-sm font-medium text-gray-700 mb-1">星期几</label>
            <a-select
              v-model:value="formData.cron_weekday"
              class="w-full"
              @change="updateCronExpression"
            >
              <a-select-option :value="1">周一</a-select-option>
              <a-select-option :value="2">周二</a-select-option>
              <a-select-option :value="3">周三</a-select-option>
              <a-select-option :value="4">周四</a-select-option>
              <a-select-option :value="5">周五</a-select-option>
              <a-select-option :value="6">周六</a-select-option>
              <a-select-option :value="7">周日</a-select-option>
            </a-select>
          </div>

          <!-- 月几号选择 -->
          <div v-if="needsDayInput">
            <label class="block text-sm font-medium text-gray-700 mb-1">每月几号</label>
            <a-input-number
              v-model:value="formData.cron_day"
              :min="1"
              :max="31"
              class="w-full"
              @change="updateCronExpression"
            />
          </div>

          <!-- 显示生成的cron表达式 -->
          <div v-if="formData.cron_display" class="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
            <p class="text-sm text-blue-700">
              <strong>执行计划：</strong>{{ formData.cron_display }}
            </p>
            <p class="text-xs text-blue-600 mt-1">
              <strong>Cron表达式：</strong>{{ formData.cron }}
            </p>
          </div>
        </div>
      </div>

      <!-- 其他设置 -->
      <div class="bg-gray-50 p-4 rounded-lg">
        <h3 class="text-lg font-medium mb-4">其他设置</h3>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
          <a-date-picker
            v-model:value="formData.end_time"
            show-time
            placeholder="选择结束时间（可选）"
            class="w-full"
          />
          <p class="text-xs text-gray-500 mt-1">留空表示永不结束</p>
        </div>
      </div>
    </div>

    <!-- 抽屉底部操作按钮 -->
    <template #footer>
      <div class="flex justify-end space-x-2">
        <a-button @click="handleClose">取消</a-button>
        <a-button type="primary" @click="handleSubmit">
          {{ isEditMode ? '更新' : '创建' }}
        </a-button>
      </div>
    </template>
  </a-drawer>

      <!-- 文件选择器 -->
  <FileSelector
    v-model:visible="pathSelectionModalVisible"
    :drive-type="formData.type"
    :auth-token="selectedAccountCookies"
    :mode="pathSelectionMode === 'source' && sourceType ? 'share' : 'disk'"
    :share-params="pathSelectionMode === 'source' && sourceType ? {
      sourceType: sourceType,
      sourceId: sourceId
    } : undefined"
    :initial-path="pathSelectionMode === 'source' ? formData.src_path : formData.dst_path"
    :title="`选择${pathSelectionMode === 'source' ? '源' : '目标'}路径`"
    @confirm="handleFileSelectConfirm"
    @cancel="handleFileSelectCancel"
  />
</template>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
