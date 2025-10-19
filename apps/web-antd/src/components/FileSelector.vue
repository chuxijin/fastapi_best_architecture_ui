/* eslint-disable vue/html-closing-bracket-newline */
<script setup lang="ts">
import type {
  CoulddriveFileInfo,
  CoulddriveListFilesParams,
  CoulddriveListShareFilesParams,
} from '#/api';

import { computed, ref, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';

import { message } from 'ant-design-vue';

import {
  createCoulddriveFolderApi,
  getCoulddriveFileListApi,
  getCoulddriveShareFileListApi,
} from '#/api';
import { usePathNavigation } from '#/composables/usePathNavigation';

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: '选择文件',
  initialPath: '',
  shareParams: undefined,
});
// Emits
const emit = defineEmits<{
  cancel: [];
  confirm: [
    data: { fileId: string; path: string; selectedFiles: CoulddriveFileInfo[] },
  ];
  'update:visible': [value: boolean];
}>();
// 图标
const FolderIcon = createIconifyIcon('mdi:folder');
const FileIcon = createIconifyIcon('mdi:file-document-outline');
const ArrowLeftIcon = createIconifyIcon('mdi:arrow-left');
const FolderPlusIcon = createIconifyIcon('mdi:folder-plus');

// Props
interface Props {
  driveType: string;
  authToken: string;
  mode: 'disk' | 'share';
  shareParams?: {
    sourceId: string;
    sourceType: string;
  };
  visible?: boolean;
  title?: string;
  initialPath?: string;
}

// 状态
const fileList = ref<CoulddriveFileInfo[]>([]);
const loading = ref(false);
const selectedFiles = ref<Set<string>>(new Set());
const selectedFolders = ref<Set<string>>(new Set()); // 改为多选文件夹
const selectedFolder = ref<string>(''); // 保留兼容性

// 新建文件夹相关状态
const showCreateFolderModal = ref(false);
const newFolderName = ref('');
const isCreatingFolder = ref(false);

// 分页相关状态
const pagination = ref({
  current: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0,
});

// 路径导航逻辑
const pathNavigation = usePathNavigation({
  onNavigate: () => {
    loadFileList();
  },
  onEnterFolder: () => {
    loadFileList();
  },
  onGoBack: () => {
    loadFileList();
  },
});

const {
  currentPath,
  currentFileId,
  breadcrumbPaths,
  canGoBack,
  navigateToPath,
  navigateToFolder,
  goBack,
  resetPath,
} = pathNavigation;

// 计算属性
const modalVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

// 监听visible变化，重置状态
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      resetSelection();

      // 如果有初始路径，构建完整的面包屑路径
      if (
        props.initialPath &&
        props.initialPath !== '/' &&
        props.initialPath !== ''
      ) {
        buildPathNavigation(props.initialPath);
      } else {
        resetPath();
      }

      loadFileList();
    }
  },
);

// 构建路径导航
function buildPathNavigation(targetPath: string) {
  resetPath(); // 先重置到根目录

  // 分割路径并构建面包屑
  const pathSegments = targetPath.split('/').filter(Boolean);
  let currentBuildPath = '';

  for (const segment of pathSegments) {
    currentBuildPath += `/${segment}`;
    // 为每个路径段添加到历史记录中
    // 注意：这里我们使用默认的file_id，实际使用中可能需要从API获取真实的file_id
    pathNavigation.pathHistory.value.push({
      path: currentBuildPath,
      file_id: '0', // 默认值，实际可能需要API获取
      name: segment,
    });
  }

  // 设置当前路径
  if (pathSegments.length > 0) {
    pathNavigation.currentPath.value = targetPath;
    pathNavigation.currentFileId.value = '0'; // 默认值
  }
}

// 加载文件列表
async function loadFileList(page = 1) {
  if (!props.authToken) {
    message.error('账号认证信息缺失');
    return;
  }

  loading.value = true;
  try {
    if (props.mode === 'disk') {
      const params: CoulddriveListFilesParams = {
        drive_type: props.driveType,
        file_path: currentPath.value,
        file_id: currentFileId.value || undefined,
        page,
        size: pagination.value.pageSize,
      };
      const response = await getCoulddriveFileListApi(params, props.authToken);
      fileList.value = response.items || [];

      // 更新分页信息
      pagination.value = {
        current: response.page || 1,
        pageSize: response.size || 20,
        total: response.total || 0,
        totalPages: response.total_pages || 0,
      };
    } else if (props.mode === 'share' && props.shareParams) {
      const params: CoulddriveListShareFilesParams = {
        drive_type: props.driveType,
        source_type: props.shareParams.sourceType,
        source_id: props.shareParams.sourceId,
        file_path: currentPath.value,
        page,
        size: pagination.value.pageSize,
      };
      const response = await getCoulddriveShareFileListApi(
        params,
        props.authToken,
      );
      fileList.value = response.items || [];

      // 更新分页信息
      pagination.value = {
        current: response.page || 1,
        pageSize: response.size || 20,
        total: response.total || 0,
        totalPages: response.total_pages || 0,
      };
    }
  } catch (error) {
    console.error('加载文件列表失败:', error);
    message.error('加载文件列表失败');
    fileList.value = [];
    // 重置分页信息
    pagination.value = {
      current: 1,
      pageSize: 20,
      total: 0,
      totalPages: 0,
    };
  } finally {
    loading.value = false;
  }
}

// 进入文件夹
function enterFolder(folder: CoulddriveFileInfo) {
  if (!folder.is_folder) return;
  resetSelection();
  // 重置分页到第一页
  pagination.value.current = 1;
  navigateToFolder(folder);
}

// 返回上级
function goBackToParent() {
  resetSelection();
  // 重置分页到第一页
  pagination.value.current = 1;
  goBack();
}

// 重置选择
function resetSelection() {
  selectedFiles.value.clear();
  selectedFolders.value.clear();
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

// 切换文件夹选中状态
function toggleFolderSelection(folderId: string) {
  if (selectedFolders.value.has(folderId)) {
    selectedFolders.value.delete(folderId);
  } else {
    selectedFolders.value.add(folderId);
  }
}

// 检查文件是否被选中
function isFileSelected(fileId: string): boolean {
  return selectedFiles.value.has(fileId);
}

// 检查文件夹是否被选中
function isFolderSelected(folderId: string): boolean {
  return selectedFolders.value.has(folderId);
}

// 处理文件点击
function handleFileClick(file: CoulddriveFileInfo) {
  if (file.is_folder) {
    // 文件夹现在也支持多选
    toggleFolderSelection(file.file_id);
    // 保持兼容性，设置最后选中的文件夹
    selectedFolder.value = file.file_id;
  } else {
    toggleFileSelection(file.file_id);
  }
}

// 面包屑导航跳转
function navigateToBreadcrumbPath(pathItem: any) {
  resetSelection();
  // 重置分页到第一页
  pagination.value.current = 1;
  navigateToPath(pathItem.path, pathItem.file_id);
}

// 处理分页变化
function handlePageChange(page: number) {
  pagination.value.current = page;
  loadFileList(page);
}

// 获取可见的页码
function getVisiblePages(): number[] {
  const current = pagination.value.current;
  const total = pagination.value.totalPages;
  const pages: number[] = [];

  // 显示当前页前后各2页
  const start = Math.max(1, current - 2);
  const end = Math.min(total, current + 2);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return pages;
}

// 确认选择
function confirmSelection() {
  const selectedFileList = fileList.value.filter(
    (file) =>
      selectedFiles.value.has(file.file_id) ||
      selectedFolders.value.has(file.file_id),
  );

  emit('confirm', {
    path: currentPath.value,
    fileId: currentFileId.value,
    selectedFiles: selectedFileList,
  });
}

// 取消选择
function cancelSelection() {
  emit('cancel');
}

// 文件大小格式化
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

// 格式化时间
function formatDateTime(dateTime: null | number | string): string {
  if (!dateTime) return '';
  try {
    const timestamp =
      typeof dateTime === 'string' ? Number.parseInt(dateTime) : dateTime;
    if (!Number.isNaN(timestamp) && Number(timestamp) > 0) {
      const ms =
        timestamp!.toString().length <= 10
          ? Number(timestamp) * 1000
          : Number(timestamp);
      const date = new Date(ms);
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleString();
      }
    }
    const date = new Date(dateTime);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString();
    }
    return '';
  } catch {
    return '';
  }
}

// 打开新建文件夹模态框
function openCreateFolderModal() {
  showCreateFolderModal.value = true;
  newFolderName.value = '';
}

// 关闭新建文件夹模态框
function closeCreateFolderModal() {
  showCreateFolderModal.value = false;
  newFolderName.value = '';
}

// 创建文件夹
async function createFolder() {
  if (!newFolderName.value.trim()) {
    message.error('请输入文件夹名称');
    return;
  }

  isCreatingFolder.value = true;
  try {
    const folderPath =
      currentPath.value === '/'
        ? `/${newFolderName.value.trim()}`
        : `${currentPath.value}/${newFolderName.value.trim()}`;

    await createCoulddriveFolderApi(
      {
        drive_type: props.driveType,
        file_path: folderPath,
        parent_id: currentFileId.value || '0',
        file_name: newFolderName.value.trim(),
        return_if_exist: true,
      },
      props.authToken,
    );

    message.success('文件夹创建成功');
    closeCreateFolderModal();
    // 刷新文件列表
    await loadFileList();
  } catch (error: any) {
    console.error('创建文件夹失败:', error);
    message.error(`创建文件夹失败: ${error?.message || '未知错误'}`);
  } finally {
    isCreatingFolder.value = false;
  }
}
</script>

<template>
  <div
    v-if="modalVisible"
    class="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50"
  >
    <div
      class="flex h-4/5 max-h-[600px] w-4/5 max-w-4xl flex-col rounded-lg bg-white shadow-xl"
    >
      <!-- 头部 -->
      <div class="flex items-center justify-between border-b p-4">
        <h3 class="text-lg font-semibold">{{ title }}</h3>
        <button
          @click="cancelSelection"
          class="text-gray-400 hover:text-gray-600"
        >
          <svg
            class="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- 面包屑导航 -->
      <div class="flex items-center gap-2 border-b bg-gray-50 p-4 text-sm">
        <span class="flex-shrink-0 text-gray-600">当前路径:</span>
        <div class="min-w-0 flex-1">
          <div
            class="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 overflow-x-auto rounded border bg-white px-2 py-1 font-mono"
          >
            <div class="flex items-center whitespace-nowrap">
              <template
                v-for="(pathItem, index) in breadcrumbPaths"
                :key="index"
              >
                <button
                  class="flex-shrink-0 cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
                  @click="navigateToBreadcrumbPath(pathItem)"
                >
                  {{ pathItem.name }}
                </button>
                <span
                  v-if="index < breadcrumbPaths.length - 1"
                  class="mx-1 flex-shrink-0 text-gray-400"
                  >/</span
                >
              </template>
            </div>
          </div>
        </div>
        <div class="flex flex-shrink-0 items-center gap-2">
          <button
            v-if="mode === 'disk'"
            class="flex items-center gap-1 rounded bg-green-500 px-2 py-1 text-sm text-white hover:bg-green-600"
            @click="openCreateFolderModal"
          >
            <FolderPlusIcon class="h-4 w-4" />
            新建文件夹
          </button>
          <button
            v-if="canGoBack"
            class="flex items-center gap-1 rounded bg-blue-500 px-2 py-1 text-sm text-white hover:bg-blue-600"
            @click="goBackToParent"
          >
            <ArrowLeftIcon class="h-4 w-4" />
            返回上级
          </button>
        </div>
      </div>

      <!-- 文件列表 -->
      <div class="flex flex-1 flex-col overflow-hidden">
        <div class="flex-1 overflow-auto p-4">
          <div v-if="loading" class="flex h-32 items-center justify-center">
            <div class="text-gray-500">加载中...</div>
          </div>
          <div
            v-else-if="fileList.length === 0"
            class="flex h-32 items-center justify-center"
          >
            <div class="text-gray-500">暂无文件</div>
          </div>
          <div v-else class="grid gap-2">
            <div
              v-for="file in fileList"
              :key="file.file_id"
              class="flex cursor-pointer items-center gap-3 rounded border p-3 hover:bg-gray-50"
              :class="{
                'border-blue-200 bg-blue-50':
                  isFileSelected(file.file_id) ||
                  isFolderSelected(file.file_id),
              }"
              @click="handleFileClick(file)"
              @dblclick="file.is_folder ? enterFolder(file) : null"
            >
              <!-- 图标 -->
              <div class="flex-shrink-0">
                <FolderIcon
                  v-if="file.is_folder"
                  class="h-6 w-6 text-blue-500"
                />
                <FileIcon v-else class="h-6 w-6 text-gray-500" />
              </div>

              <!-- 文件信息 -->
              <div class="min-w-0 flex-1">
                <div class="truncate font-medium">{{ file.file_name }}</div>
                <div class="flex items-center gap-4 text-sm text-gray-500">
                  <span v-if="!file.is_folder">{{
                    formatFileSize(file.file_size || 0)
                  }}</span>
                  <span v-if="file.updated_at">{{
                    formatDateTime(file.updated_at)
                  }}</span>
                </div>
              </div>

              <!-- 选中状态 -->
              <div class="flex-shrink-0">
                <div
                  v-if="
                    isFileSelected(file.file_id) ||
                    isFolderSelected(file.file_id)
                  "
                  class="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500"
                >
                  <svg
                    class="h-3 w-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页控件 -->
        <div
          v-if="pagination.totalPages > 1"
          class="flex items-center justify-between border-t bg-gray-50 px-4 py-3"
        >
          <div class="text-sm text-gray-600">
            共 {{ pagination.total }} 项，第 {{ pagination.current }} /
            {{ pagination.totalPages }} 页
          </div>
          <div class="flex items-center gap-2">
            <button
              :disabled="pagination.current <= 1"
              @click="handlePageChange(pagination.current - 1)"
              class="rounded border px-3 py-1 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              上一页
            </button>

            <!-- 页码按钮 -->
            <template v-if="pagination.totalPages <= 7">
              <button
                v-for="page in pagination.totalPages"
                :key="page"
                @click="handlePageChange(page)"
                :class="{
                  'bg-blue-500 text-white': page === pagination.current,
                  'hover:bg-gray-100': page !== pagination.current,
                }"
                class="min-w-[32px] rounded border px-3 py-1 text-sm"
              >
                {{ page }}
              </button>
            </template>
            <template v-else>
              <!-- 复杂分页逻辑 -->
              <button
                v-if="pagination.current > 3"
                @click="handlePageChange(1)"
                class="min-w-[32px] rounded border px-3 py-1 text-sm hover:bg-gray-100"
              >
                1
              </button>
              <span v-if="pagination.current > 4" class="px-2 text-gray-500"
                >...</span
              >

              <button
                v-for="page in getVisiblePages()"
                :key="page"
                @click="handlePageChange(page)"
                :class="{
                  'bg-blue-500 text-white': page === pagination.current,
                  'hover:bg-gray-100': page !== pagination.current,
                }"
                class="min-w-[32px] rounded border px-3 py-1 text-sm"
              >
                {{ page }}
              </button>

              <span
                v-if="pagination.current < pagination.totalPages - 3"
                class="px-2 text-gray-500"
                >...</span
              >
              <button
                v-if="pagination.current < pagination.totalPages - 2"
                @click="handlePageChange(pagination.totalPages)"
                class="min-w-[32px] rounded border px-3 py-1 text-sm hover:bg-gray-100"
              >
                {{ pagination.totalPages }}
              </button>
            </template>

            <button
              :disabled="pagination.current >= pagination.totalPages"
              @click="handlePageChange(pagination.current + 1)"
              class="rounded border px-3 py-1 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="flex items-center justify-between border-t bg-gray-50 p-4">
        <div class="text-sm text-gray-600">
          已选择 {{ selectedFiles.size + selectedFolders.size }} 项
        </div>
        <div class="flex gap-2">
          <button
            class="rounded border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-50"
            @click="cancelSelection"
          >
            取消
          </button>
          <button
            class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
            :disabled="selectedFiles.size === 0 && selectedFolders.size === 0"
            @click="confirmSelection"
          >
            确认选择
          </button>
        </div>
      </div>
    </div>

    <!-- 新建文件夹模态框 -->
    <div
      v-if="showCreateFolderModal && mode === 'disk'"
      class="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-50"
    >
      <div class="w-96 rounded-lg bg-white p-6 shadow-xl">
        <h3 class="mb-4 text-lg font-semibold">新建文件夹</h3>

        <div class="mb-4">
          <label class="mb-2 block text-sm font-medium text-gray-700">
            文件夹名称
          </label>
          <input
            v-model="newFolderName"
            type="text"
            class="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="请输入文件夹名称"
            @keyup.enter="createFolder"
            @keyup.escape="closeCreateFolderModal"
          />
        </div>

        <div class="flex justify-end gap-2">
          <button
            class="rounded border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-50"
            @click="closeCreateFolderModal"
            :disabled="isCreatingFolder"
          >
            取消
          </button>
          <button
            class="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600 disabled:opacity-50"
            @click="createFolder"
            :disabled="isCreatingFolder || !newFolderName.trim()"
          >
            {{ isCreatingFolder ? '创建中...' : '创建' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 自定义滚动条样式 */
.scrollbar-thin {
  scrollbar-width: thin;
}

.scrollbar-thin::-webkit-scrollbar {
  height: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
