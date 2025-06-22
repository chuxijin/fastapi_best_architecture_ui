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
import { usePathNavigation } from '#/composables/usePathNavigation';

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
const fileListForSelection = ref<CoulddriveFileInfo[]>([]);
const loadingFileList = ref(false);
const selectedAccountCookies = ref('');

// 路径导航逻辑
const pathNavigation = usePathNavigation({
  onNavigate: () => {
    if (pathSelectionMode.value === 'source') {
      loadShareFileList();
    } else if (pathSelectionMode.value === 'target') {
      loadDiskFileList();
    }
  },
  onEnterFolder: () => {
    if (pathSelectionMode.value === 'source') {
      loadShareFileList();
    } else if (pathSelectionMode.value === 'target') {
      loadDiskFileList();
    }
  },
  onGoBack: () => {
    if (pathSelectionMode.value === 'source') {
      loadShareFileList();
    } else if (pathSelectionMode.value === 'target') {
      loadDiskFileList();
    }
  }
});

const {
  currentPath: currentPathForSelection,
  currentFileId: currentFileIdForSelection,
  breadcrumbPaths,
  navigateToPath: navigateToPathForSelection,
  navigateToFolder: navigateToFolderForSelection,
  goBack: goBackForSelection,
  resetPath: resetPathForSelection
} = pathNavigation;

// 来源选择相关状态
const sourceType = ref('');
const sourceId = ref('');
const sourceOptions = ref<Array<{ label: string; value: string }>>([]);

// 文件选择状态
const selectedFiles = ref<Set<string>>(new Set());
const selectedFolder = ref<string>('');

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

// breadcrumbPaths 已在 pathNavigation 中定义

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

// 是否可以返回上级目录
const canGoBack = computed(() => {
  return currentPathForSelection.value !== '/' && breadcrumbPaths.value.length > 1;
});

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

// 监听编辑数据变化
watch(() => props.editData, async (newData) => {
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
    resetForm();
  }
}, { immediate: true });

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

  // 如果已有源路径，使用当前路径作为起点，否则从根目录开始
  if (formData.value.src_path && formData.value.src_path !== '/') {
    // 使用已有的源路径作为起点，并重建面包屑
    const breadcrumbs = rebuildBreadcrumbPaths(formData.value.src_path);
    pathNavigation.pathHistory.value = breadcrumbs;
    navigateToPathForSelection(formData.value.src_path, '0');
  } else {
    resetPathForSelection();
  }

  pathSelectionModalVisible.value = true;

  if (!sourceType.value) {
    sourceId.value = '';
    sourceOptions.value = [];
  } else if (sourceType.value && sourceId.value) {
    await loadShareFileList();
  }
}

async function selectTargetPath() {
  if (!formData.value.type || !formData.value.user_id) {
    message.warning('请先选择网盘类型和关联账号');
    return;
  }

  pathSelectionMode.value = 'target';

  // 如果已有目标路径，使用当前路径作为起点，否则从根目录开始
  if (formData.value.dst_path && formData.value.dst_path !== '/') {
    // 尝试从dst_meta中获取file_id
    let fileId = '0';
    if (formData.value.dst_meta) {
      try {
        const dstMeta = JSON.parse(formData.value.dst_meta);
        fileId = dstMeta.file_id || '0';
      } catch (error) {
        console.error('解析 dst_meta 失败:', error);
      }
    }
    // 使用已有的目标路径和file_id作为起点，并重建面包屑
    const breadcrumbs = rebuildBreadcrumbPaths(formData.value.dst_path);
    pathNavigation.pathHistory.value = breadcrumbs;
    navigateToPathForSelection(formData.value.dst_path, fileId);
  } else {
    resetPathForSelection();
  }

  pathSelectionModalVisible.value = true;
  await loadDiskFileList();
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
  if (sourceType.value && id) {
    currentPathForSelection.value = '/';
    await loadShareFileList();
  }
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

// 加载分享文件列表
async function loadShareFileList() {
  if (!selectedAccountCookies.value) {
    message.error('账号认证信息缺失');
    return;
  }

  if (!sourceType.value || !sourceId.value) {
    message.warning('请先选择来源类型和来源ID');
    return;
  }

  loadingFileList.value = true;
  try {
    const params: CoulddriveListShareFilesParams = {
      drive_type: formData.value.type,
      source_type: sourceType.value as 'friend' | 'group',
      source_id: sourceId.value,
      file_path: currentPathForSelection.value,
      recursive: false,
    };

    const response = await getCoulddriveShareFileListApi(params, selectedAccountCookies.value);
    fileListForSelection.value = response.items || [];
  } catch (error) {
    console.error('加载分享文件列表失败:', error);
    message.error('加载分享文件列表失败');
    fileListForSelection.value = [];
  } finally {
    loadingFileList.value = false;
  }
}

// 加载磁盘文件列表
async function loadDiskFileList() {
  if (!selectedAccountCookies.value) {
    message.error('账号认证信息缺失');
    return;
  }

  loadingFileList.value = true;
  try {
    const params: CoulddriveListFilesParams = {
      drive_type: formData.value.type,
      file_path: currentPathForSelection.value,
      file_id: currentFileIdForSelection.value || undefined, // 传递当前路径对应的file_id
      recursive: false,
    };

    const response = await getCoulddriveFileListApi(params, selectedAccountCookies.value);
    fileListForSelection.value = response.items || [];
  } catch (error) {
    console.error('加载磁盘文件列表失败:', error);
    message.error('加载磁盘文件列表失败');
    fileListForSelection.value = [];
  } finally {
    loadingFileList.value = false;
  }
}

// 进入文件夹
function enterFolder(folder: CoulddriveFileInfo) {
  if (!folder.is_folder) return;

  selectedFiles.value.clear();
  selectedFolder.value = '';
  navigateToFolderForSelection(folder);
}

// 返回上级目录
function goBackInSelection() {
  selectedFiles.value.clear();
  selectedFolder.value = '';
  goBackForSelection();
}

// 确认选择路径
function confirmPathSelection() {
  _confirmPathSelectionAsync();
}

// 确认选择路径（内部异步函数）
async function _confirmPathSelectionAsync() {
  let selectedPath = currentPathForSelection.value;
  let selectedFileInfo = null;

  // 优先检查是否选中了文件夹
  if (selectedFolder.value) {
    const folderFile = fileListForSelection.value.find(file => file.file_id === selectedFolder.value);
    if (folderFile && folderFile.is_folder) {
      selectedPath = folderFile.file_path;
      selectedFileInfo = folderFile;
    }
  }
  // 其次检查是否选中了文件
  else if (selectedFiles.value.size === 1) {
    const selectedFileId = Array.from(selectedFiles.value)[0];
    const selectedFile = fileListForSelection.value.find(file => file.file_id === selectedFileId);
    if (selectedFile && selectedFile.is_folder) {
      selectedPath = selectedFile.file_path;
      selectedFileInfo = selectedFile;
    } else if (selectedFile && !selectedFile.is_folder) {
      selectedPath = currentPathForSelection.value;
      selectedFileInfo = selectedFile;
    }
  }

  if (!selectedPath || selectedPath === '') {
    selectedPath = currentPathForSelection.value || '/';
  }

  if (pathSelectionMode.value === 'source') {
    formData.value.src_path = selectedPath;
    if (sourceType.value && sourceId.value) {
      formData.value.src_meta = JSON.stringify({
        source_type: sourceType.value,
        source_id: sourceId.value,
      });
    }
    pathSelectionModalVisible.value = false;
    message.success(`已选择源路径: ${selectedPath}`);
  } else if (pathSelectionMode.value === 'target') {
    formData.value.dst_path = selectedPath;
    if (selectedFileInfo && selectedFileInfo.is_folder) {
        formData.value.dst_meta = JSON.stringify({
        file_id: selectedFileInfo.file_id,
        });
    } else {
      formData.value.dst_meta = JSON.stringify({
        file_path: selectedPath,
      });
    }
    pathSelectionModalVisible.value = false;
    message.success(`已选择目标路径: ${selectedPath}`);
  }
}

// 取消路径选择
function cancelPathSelection() {
  pathSelectionModalVisible.value = false;
  resetPathForSelection();
  fileListForSelection.value = [];
  selectedFiles.value.clear();
  selectedFolder.value = '';
}

// 切换文件选中状态
function toggleFileSelection(fileId: string) {
  if (selectedFiles.value.has(fileId)) {
    selectedFiles.value.delete(fileId);
  } else {
    selectedFiles.value.add(fileId);
  }
}

// 检查文件是否被选中
function isFileSelected(fileId: string): boolean {
  return selectedFiles.value.has(fileId);
}

// 处理文件点击
function handleFileClick(file: CoulddriveFileInfo) {
  if (file.is_folder) {
    // 文件夹单击选中（用于路径选择）
    selectedFolder.value = file.file_id;
  } else {
    // 文件单击切换选中状态
    toggleFileSelection(file.file_id);
  }
}

// 面包屑导航跳转
function navigateToBreadcrumbPath(path: string) {
  selectedFiles.value.clear();
  selectedFolder.value = '';
  navigateToPathForSelection(path);
}

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
  resetForm();
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

  <!-- 路径选择模态框 -->
  <a-modal
    v-model:visible="pathSelectionModalVisible"
    :title="`选择${pathSelectionMode === 'source' ? '源' : '目标'}路径`"
    width="800px"
    @ok="confirmPathSelection"
    @cancel="cancelPathSelection"
  >
    <!-- 来源类型选择（仅在源路径选择时显示） -->
    <div v-if="pathSelectionMode === 'source'" class="mb-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div v-if="sourceType === 'link'" class="col-span-2">
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
    </div>

    <!-- 面包屑导航 -->
    <div class="mb-4">
      <a-breadcrumb>
        <a-breadcrumb-item
          v-for="(path, index) in breadcrumbPaths"
          :key="index"
        >
          <a
            v-if="index < breadcrumbPaths.length - 1"
            @click="navigateToBreadcrumbPath(path.path)"
            class="text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            {{ path.name }}
          </a>
          <span v-else class="text-gray-600">{{ path.name }}</span>
        </a-breadcrumb-item>
      </a-breadcrumb>
    </div>

    <!-- 操作按钮 -->
    <div class="mb-4 flex justify-between items-center">
      <a-button
        @click="goBackInSelection"
        :disabled="!canGoBack"
        size="small"
      >
        返回上级
      </a-button>
    </div>

    <!-- 文件列表 -->
    <div class="border rounded-lg max-h-96 overflow-y-auto">
      <a-spin :spinning="loadingFileList">
        <div v-if="fileListForSelection.length === 0" class="p-8 text-center text-gray-500">
          <p v-if="pathSelectionMode === 'source' && (!sourceType || !sourceId)">
            请先选择来源类型和来源ID
          </p>
          <p v-else>此目录为空</p>
        </div>

        <div v-else>
          <div
            v-for="file in fileListForSelection"
            :key="file.file_id"
            class="flex items-center p-3 border-b hover:bg-gray-50 cursor-pointer"
            :class="{
              'bg-blue-50': file.is_folder ? selectedFolder === file.file_id : isFileSelected(file.file_id),
              'border-blue-300': file.is_folder ? selectedFolder === file.file_id : isFileSelected(file.file_id)
            }"
            @click="handleFileClick(file)"
            @dblclick="file.is_folder ? enterFolder(file) : null"
          >
            <div class="flex-1 flex items-center">
              <!-- 文件图标 -->
              <div class="mr-3">
                <svg
                  v-if="file.is_folder"
                  class="w-5 h-5 text-blue-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path>
                </svg>
                <svg
                  v-else
                  class="w-5 h-5 text-gray-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"></path>
                </svg>
              </div>

              <!-- 文件信息 -->
              <div class="flex-1">
                <div class="font-medium text-gray-900">{{ file.file_name }}</div>
                                 <div class="text-sm text-gray-500">
                   {{ file.is_folder ? '文件夹' : formatFileSize(file.file_size || 0) }}
                   <span v-if="file.updated_at" class="ml-2">
                    {{ formatDateTime(file.updated_at) }}
                   </span>
                 </div>
              </div>

                            <!-- 选择状态指示器 -->
              <div v-if="!file.is_folder && isFileSelected(file.file_id)" class="ml-3">
                <div class="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </a-spin>
    </div>

    <!-- 选择提示 -->
    <div v-if="selectedFiles.size > 0" class="mt-4 p-3 bg-blue-50 rounded-lg">
      <p class="text-sm text-blue-700">
        已选择 {{ selectedFiles.size }} 个文件
      </p>
    </div>
  </a-modal>
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
