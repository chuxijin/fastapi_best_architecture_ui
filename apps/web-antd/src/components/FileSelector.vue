<script setup lang="ts">
import type { CoulddriveFileInfo, CoulddriveListFilesParams, CoulddriveListShareFilesParams } from '#/api';

import { ref, computed, watch } from 'vue';
import { message } from 'ant-design-vue';
import { createIconifyIcon } from '@vben/icons';

import { getCoulddriveFileListApi, getCoulddriveShareFileListApi } from '#/api';
import { usePathNavigation } from '#/composables/usePathNavigation';

// 图标
const FolderIcon = createIconifyIcon('mdi:folder');
const FileIcon = createIconifyIcon('mdi:file-document-outline');
const ArrowLeftIcon = createIconifyIcon('mdi:arrow-left');

// Props
interface Props {
  driveType: string;
  authToken: string;
  mode: 'disk' | 'share';
  shareParams?: {
    sourceType: string;
    sourceId: string;
  };
  visible?: boolean;
  title?: string;
  initialPath?: string;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: '选择文件',
  initialPath: '',
});

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean];
  'confirm': [data: { path: string; fileId: string; selectedFiles: CoulddriveFileInfo[] }];
  'cancel': [];
}>();

// 状态
const fileList = ref<CoulddriveFileInfo[]>([]);
const loading = ref(false);
const selectedFiles = ref<Set<string>>(new Set());
const selectedFolder = ref<string>('');

// 分页相关状态
const pagination = ref({
  current: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0
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
  }
});

const {
  currentPath,
  currentFileId,
  breadcrumbPaths,
  canGoBack,
  navigateToPath,
  navigateToFolder,
  goBack,
  resetPath
} = pathNavigation;

// 计算属性
const modalVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
});

// 监听visible变化，重置状态
watch(() => props.visible, (visible) => {
  if (visible) {
    resetSelection();

    // 如果有初始路径，构建完整的面包屑路径
    if (props.initialPath && props.initialPath !== '/' && props.initialPath !== '') {
      buildPathNavigation(props.initialPath);
    } else {
      resetPath();
    }

    loadFileList();
  }
});

// 构建路径导航
function buildPathNavigation(targetPath: string) {
  resetPath(); // 先重置到根目录

  // 分割路径并构建面包屑
  const pathSegments = targetPath.split('/').filter(segment => segment);
  let currentBuildPath = '';

  for (const segment of pathSegments) {
    currentBuildPath += '/' + segment;
    // 为每个路径段添加到历史记录中
    // 注意：这里我们使用默认的file_id，实际使用中可能需要从API获取真实的file_id
    pathNavigation.pathHistory.value.push({
      path: currentBuildPath,
      file_id: '0', // 默认值，实际可能需要API获取
      name: segment
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
        totalPages: response.total_pages || 0
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
      const response = await getCoulddriveShareFileListApi(params, props.authToken);
      fileList.value = response.items || [];

      // 更新分页信息
      pagination.value = {
        current: response.page || 1,
        pageSize: response.size || 20,
        total: response.total || 0,
        totalPages: response.total_pages || 0
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
      totalPages: 0
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
  const selectedFileList = fileList.value.filter(file =>
    selectedFiles.value.has(file.file_id) || file.file_id === selectedFolder.value
  );

  emit('confirm', {
    path: currentPath.value,
    fileId: currentFileId.value,
    selectedFiles: selectedFileList
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
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 格式化时间
function formatDateTime(dateTime: string | number | null): string {
  if (!dateTime) return '';
  try {
    const timestamp = typeof dateTime === 'string' ? parseInt(dateTime) : dateTime;
    if (!isNaN(timestamp) && timestamp > 0) {
      const ms = timestamp.toString().length <= 10 ? timestamp * 1000 : timestamp;
      const date = new Date(ms);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString();
      }
    }
    const date = new Date(dateTime);
    if (!isNaN(date.getTime())) {
      return date.toLocaleString();
    }
    return '';
  } catch {
    return '';
  }
}
</script>

<template>
  <div v-if="modalVisible" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
    <div class="bg-white rounded-lg shadow-xl w-4/5 h-4/5 max-w-4xl max-h-[600px] flex flex-col">
      <!-- 头部 -->
      <div class="flex items-center justify-between p-4 border-b">
        <h3 class="text-lg font-semibold">{{ title }}</h3>
        <button
          @click="cancelSelection"
          class="text-gray-400 hover:text-gray-600"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- 面包屑导航 -->
      <div class="flex items-center gap-2 p-4 bg-gray-50 border-b text-sm">
        <span class="text-gray-600 flex-shrink-0">当前路径:</span>
        <div class="flex-1 min-w-0">
          <div class="bg-white px-2 py-1 rounded border font-mono overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div class="flex items-center whitespace-nowrap">
              <template v-for="(pathItem, index) in breadcrumbPaths" :key="index">
                <button
                  class="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex-shrink-0"
                  @click="navigateToBreadcrumbPath(pathItem)"
                >
                  {{ pathItem.name }}
                </button>
                                  <span v-if="index < breadcrumbPaths.length - 1" class="mx-1 text-gray-400 flex-shrink-0">/</span>
                </template>
              </div>
            </div>
        </div>
        <button
          v-if="canGoBack"
          class="flex items-center gap-1 px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 flex-shrink-0"
          @click="goBackToParent"
        >
          <ArrowLeftIcon class="w-4 h-4" />
          返回上级
        </button>
      </div>

      <!-- 文件列表 -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <div class="flex-1 overflow-auto p-4">
          <div v-if="loading" class="flex items-center justify-center h-32">
            <div class="text-gray-500">加载中...</div>
          </div>
          <div v-else-if="fileList.length === 0" class="flex items-center justify-center h-32">
            <div class="text-gray-500">暂无文件</div>
          </div>
          <div v-else class="grid gap-2">
            <div
              v-for="file in fileList"
              :key="file.file_id"
              class="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer"
              :class="{
                'bg-blue-50 border-blue-200': isFileSelected(file.file_id) || selectedFolder === file.file_id,
              }"
              @click="handleFileClick(file)"
              @dblclick="file.is_folder ? enterFolder(file) : null"
            >
              <!-- 图标 -->
              <div class="flex-shrink-0">
                <FolderIcon v-if="file.is_folder" class="w-6 h-6 text-blue-500" />
                <FileIcon v-else class="w-6 h-6 text-gray-500" />
              </div>

              <!-- 文件信息 -->
              <div class="flex-1 min-w-0">
                <div class="font-medium truncate">{{ file.file_name }}</div>
                <div class="text-sm text-gray-500 flex items-center gap-4">
                  <span v-if="!file.is_folder">{{ formatFileSize(file.file_size || 0) }}</span>
                  <span v-if="file.updated_at">{{ formatDateTime(file.updated_at) }}</span>
                </div>
              </div>

              <!-- 选中状态 -->
              <div class="flex-shrink-0">
                <div
                  v-if="isFileSelected(file.file_id) || selectedFolder === file.file_id"
                  class="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"
                >
                  <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页控件 -->
        <div v-if="pagination.totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <div class="text-sm text-gray-600">
            共 {{ pagination.total }} 项，第 {{ pagination.current }} / {{ pagination.totalPages }} 页
          </div>
          <div class="flex items-center gap-2">
            <button
              :disabled="pagination.current <= 1"
              @click="handlePageChange(pagination.current - 1)"
              class="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  'hover:bg-gray-100': page !== pagination.current
                }"
                class="px-3 py-1 text-sm border rounded min-w-[32px]"
              >
                {{ page }}
              </button>
            </template>
            <template v-else>
              <!-- 复杂分页逻辑 -->
              <button
                v-if="pagination.current > 3"
                @click="handlePageChange(1)"
                class="px-3 py-1 text-sm border rounded hover:bg-gray-100 min-w-[32px]"
              >
                1
              </button>
              <span v-if="pagination.current > 4" class="px-2 text-gray-500">...</span>

              <button
                v-for="page in getVisiblePages()"
                :key="page"
                @click="handlePageChange(page)"
                :class="{
                  'bg-blue-500 text-white': page === pagination.current,
                  'hover:bg-gray-100': page !== pagination.current
                }"
                class="px-3 py-1 text-sm border rounded min-w-[32px]"
              >
                {{ page }}
              </button>

              <span v-if="pagination.current < pagination.totalPages - 3" class="px-2 text-gray-500">...</span>
              <button
                v-if="pagination.current < pagination.totalPages - 2"
                @click="handlePageChange(pagination.totalPages)"
                class="px-3 py-1 text-sm border rounded hover:bg-gray-100 min-w-[32px]"
              >
                {{ pagination.totalPages }}
              </button>
            </template>

            <button
              :disabled="pagination.current >= pagination.totalPages"
              @click="handlePageChange(pagination.current + 1)"
              class="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="flex items-center justify-between p-4 border-t bg-gray-50">
        <div class="text-sm text-gray-600">
          已选择 {{ selectedFiles.size + (selectedFolder ? 1 : 0) }} 项
        </div>
        <div class="flex gap-2">
          <button
            class="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            @click="cancelSelection"
          >
            取消
          </button>
          <button
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            :disabled="selectedFiles.size === 0 && !selectedFolder"
            @click="confirmSelection"
          >
            确认选择
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
