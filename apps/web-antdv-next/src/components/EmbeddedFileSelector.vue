<script setup lang="ts">
import type { CoulddriveFileInfo, CoulddriveListFilesParams } from '#/api';

import { onMounted, ref, watch } from 'vue';

import { message } from 'ant-design-vue';

import { getCoulddriveFileListApi } from '#/api';

// Props
interface Props {
  driveType: string;
  authToken: string;
  initialPath?: string;
  navigationOnly?: boolean; // 仅导航模式，不显示复选框
}

const props = withDefaults(defineProps<Props>(), {
  initialPath: '/',
  navigationOnly: false,
});

// Emits
const emit = defineEmits<{
  cancel: [];
  confirm: [
    data: { fileId: string; path: string; selectedFiles: CoulddriveFileInfo[] },
  ];
}>();

// 状态
const loading = ref(false);
const fileList = ref<CoulddriveFileInfo[]>([]);
const selectedFiles = ref<CoulddriveFileInfo[]>([]);
const currentPath = ref(props.initialPath);
const currentFileId = ref('0');

// 加载文件列表
async function loadFiles() {
  if (!props.authToken) return;

  loading.value = true;
  try {
    const params: CoulddriveListFilesParams = {
      drive_type: props.driveType,
      file_path: currentPath.value,
      file_id: currentFileId.value,
      page: 1,
      size: 100,
    };

    const response = await getCoulddriveFileListApi(params, props.authToken);
    fileList.value = response.items || [];
  } catch (error: any) {
    console.error('加载文件列表失败:', error);
    message.error('加载文件列表失败');
    fileList.value = [];
  } finally {
    loading.value = false;
  }
}

// 处理文件点击
function handleFileClick(file: CoulddriveFileInfo) {
  // 导航模式下不支持文件选择
  if (props.navigationOnly) {
    return;
  }
  // 单击选择/取消选择文件或文件夹
  toggleFileSelection(file);
}

// 处理文件双击
function handleFileDoubleClick(file: CoulddriveFileInfo) {
  if (file.is_folder) {
    currentPath.value = file.file_path;
    currentFileId.value = file.file_id;
    selectedFiles.value = []; // 清空选择
    loadFiles();

    // 导航模式下，路径变化时触发确认事件
    if (props.navigationOnly) {
      emit('confirm', {
        fileId: currentFileId.value,
        path: currentPath.value,
        selectedFiles: [],
      });
    }
  }
}

// 向上导航
function navigateUp() {
  const pathParts = currentPath.value.split('/').filter(Boolean);
  if (pathParts.length > 0) {
    pathParts.pop();
    currentPath.value = pathParts.length > 0 ? `/${pathParts.join('/')}` : '/';
    currentFileId.value = '0'; // 重置为根目录ID
    selectedFiles.value = []; // 清空选择
    loadFiles();
  }
}

// 检查文件是否被选中
function isFileSelected(file: CoulddriveFileInfo): boolean {
  return selectedFiles.value.some((f) => f.file_id === file.file_id);
}

// 切换文件选择状态
function toggleFileSelection(file: CoulddriveFileInfo) {
  // 导航模式下不支持文件选择
  if (props.navigationOnly) {
    return;
  }

  const index = selectedFiles.value.findIndex(
    (f) => f.file_id === file.file_id,
  );
  if (index === -1) {
    selectedFiles.value.push(file);
  } else {
    selectedFiles.value.splice(index, 1);
  }

  // 实时触发确认事件
  emit('confirm', {
    fileId: currentFileId.value,
    path: currentPath.value,
    selectedFiles: selectedFiles.value,
  });
}

// 监听props变化
watch(
  () => props.authToken,
  () => {
    if (props.authToken) {
      loadFiles();
    }
  },
);

// 组件挂载时加载文件
onMounted(() => {
  if (props.authToken) {
    loadFiles();

    // 导航模式下，初始化时触发确认事件
    if (props.navigationOnly) {
      emit('confirm', {
        fileId: currentFileId.value,
        path: currentPath.value,
        selectedFiles: [],
      });
    }
  }
});
</script>

<template>
  <div class="embedded-file-selector">
    <!-- 面包屑导航 -->
    <div class="border-b bg-gray-50 p-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <button
            v-if="currentPath !== '/'"
            class="rounded p-1 hover:bg-gray-200"
            @click="navigateUp"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <span class="text-sm font-medium text-gray-700">{{
            currentPath
          }}</span>
        </div>
        <!-- 移除已选择文件数量提示 -->
      </div>
    </div>

    <!-- 文件列表 -->
    <div class="h-60 overflow-y-auto">
      <!-- 加载状态 -->
      <div v-if="loading" class="flex items-center justify-center p-8">
        <div class="text-gray-500">加载中...</div>
      </div>

      <!-- 文件列表 -->
      <div v-else-if="fileList.length > 0" class="divide-y divide-gray-100">
        <div
          v-for="file in fileList"
          :key="file.file_id"
          class="flex cursor-pointer items-center p-3 hover:bg-gray-50"
          @click="handleFileClick(file)"
          @dblclick="handleFileDoubleClick(file)"
        >
          <!-- 复选框 - 导航模式下隐藏复选框 -->
          <input
            v-if="!navigationOnly"
            type="checkbox"
            class="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            :checked="isFileSelected(file)"
            @click.stop="toggleFileSelection(file)"
          />
          <!-- 导航模式下的占位符 -->
          <div v-else class="mr-3 w-4"></div>

          <!-- 文件图标和名称 -->
          <div class="flex min-w-0 flex-1 items-center">
            <span class="mr-2 text-sm">{{ file.is_folder ? '📁' : '📄' }}</span>
            <span class="truncate text-sm text-gray-900">{{
              file.file_name
            }}</span>
          </div>

          <!-- 文件夹导航箭头 -->
          <div v-if="file.is_folder" class="ml-2 text-gray-400">
            <svg
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div
        v-else
        class="flex flex-col items-center justify-center p-8 text-gray-500"
      >
        <div class="text-sm">此目录为空</div>
        <button
          class="mt-2 text-xs text-blue-500 hover:text-blue-700"
          @click="loadFiles"
        >
          重新加载
        </button>
      </div>
    </div>

    <!-- 移除底部操作栏，实时更新选择状态 -->
  </div>
</template>

<style scoped>
.embedded-file-selector {
  overflow: hidden;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
}
</style>
