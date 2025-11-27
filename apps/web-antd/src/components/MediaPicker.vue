<script setup lang="ts">
import type { FileInfo } from '#/api';

import { computed, onMounted, ref, watch } from 'vue';

import {
  createIconifyIcon,
  MaterialSymbolsAdd,
  MaterialSymbolsDelete,
} from '@vben/icons';

import { message, Modal } from 'ant-design-vue';

import {
  createFolderApi,
  deleteFileApi,
  getFileListApi,
  uploadFileApi,
} from '#/api';

const props = withDefaults(defineProps<Props>(), {
  open: false,
  multiple: false,
  accept: 'image/*',
  maxSize: 10 * 1024 * 1024,
});
const emit = defineEmits<Emits>();
// 创建需要的图标
const SearchOutlined = createIconifyIcon('material-symbols:search');
const FileImageOutlined = createIconifyIcon('material-symbols:image-outline');
const FileOutlined = createIconifyIcon('material-symbols:description-outline');
const VideoCameraOutlined = createIconifyIcon(
  'material-symbols:video-library-outline',
);
const FileTextOutlined = createIconifyIcon(
  'material-symbols:text-snippet-outline',
);
const FolderOutlined = createIconifyIcon('material-symbols:folder-outline');
const FolderOpenOutlined = createIconifyIcon(
  'material-symbols:folder-open-outline',
);
const CreateNewFolderOutlined = createIconifyIcon(
  'material-symbols:create-new-folder-outline',
);
const HomeOutlined = createIconifyIcon('material-symbols:home-outline');

interface Props {
  open?: boolean;
  multiple?: boolean;
  accept?: string;
  maxSize?: number;
}

interface Emits {
  (e: 'update:open', value: boolean): void;
  (e: 'select', files: FileInfo[]): void;
}

// ============ 状态管理 ============
const loading = ref(false);
const uploading = ref(false);
const fileList = ref<FileInfo[]>([]);
const selectedFiles = ref<FileInfo[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);
const keyword = ref('');
const fileType = ref<string | undefined>(undefined);
const currentFolder = ref<string>(''); // 当前文件夹路径

// 创建文件夹
const showCreateFolderDialog = ref(false);
const newFolderName = ref('');
const creatingFolder = ref(false);

// ============ 计算属性 ============
const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
});

const fileTypeOptions = [
  { label: '全部类型', value: undefined },
  { label: '图片', value: 'image' },
  { label: '视频', value: 'video' },
  { label: '文档', value: 'document' },
  { label: '其他', value: 'other' },
];

// 面包屑路径
const breadcrumbPath = computed(() => {
  if (!currentFolder.value) return [];
  return currentFolder.value.split('/').filter(Boolean);
});

// ============ 数据加载 ============
async function loadFiles() {
  loading.value = true;
  try {
    const result = await getFileListApi({
      page: currentPage.value,
      size: pageSize.value,
      keyword: keyword.value || undefined,
      file_type: fileType.value as any,
      folder: currentFolder.value || undefined,
    });
    fileList.value = result.items;
    total.value = result.total;
  } catch {
    message.error('加载文件列表失败');
  } finally {
    loading.value = false;
  }
}

// ============ 文件夹导航 ============
function navigateToFolder(folderPath: string) {
  currentFolder.value = folderPath;
  currentPage.value = 1;
  loadFiles();
}

function navigateToRoot() {
  navigateToFolder('');
}

function navigateToBreadcrumb(index: number) {
  const path = breadcrumbPath.value.slice(0, index + 1).join('/');
  navigateToFolder(path);
}

function handleItemClick(item: FileInfo) {
  if (item.is_folder) {
    // 进入文件夹
    const newPath = currentFolder.value
      ? `${currentFolder.value}/${item.name}`
      : item.name;
    navigateToFolder(newPath);
  } else {
    // 选择文件
    toggleSelect(item);
  }
}

// ============ 文件操作 ============
function toggleSelect(file: FileInfo) {
  if (file.is_folder) return; // 文件夹不能选择

  const index = selectedFiles.value.findIndex((f) => f.url === file.url);
  if (index === -1) {
    if (props.multiple) {
      selectedFiles.value.push(file);
    } else {
      selectedFiles.value = [file];
    }
  } else {
    selectedFiles.value.splice(index, 1);
  }
}

function isSelected(file: FileInfo): boolean {
  if (file.is_folder) return false;
  return selectedFiles.value.some((f) => f.url === file.url);
}

async function handleDelete(file: FileInfo) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除${file.is_folder ? '文件夹' : '文件'} "${file.name}" 吗？`,
    onOk: async () => {
      try {
        const filePath = currentFolder.value
          ? `${currentFolder.value}/${file.name}`
          : file.name;
        await deleteFileApi(filePath);
        message.success('删除成功');
        await loadFiles();
        // 如果删除的文件在选中列表中，移除它
        if (!file.is_folder) {
          selectedFiles.value = selectedFiles.value.filter(
            (f) => f.url !== file.url,
          );
        }
      } catch {
        message.error('删除失败');
      }
    },
  });
}

// ============ 文件上传 ============
async function handleUpload(file: File) {
  // 文件大小验证
  if (file.size > props.maxSize) {
    message.error(
      `文件大小不能超过 ${Math.round(props.maxSize / 1024 / 1024)}MB`,
    );
    return false;
  }

  uploading.value = true;
  try {
    await uploadFileApi(file);
    message.success('上传成功');
    // 重新加载文件列表
    await loadFiles();
  } catch {
    message.error('上传失败');
  } finally {
    uploading.value = false;
  }

  return false; // 阻止默认上传行为
}

// ============ 创建文件夹 ============
function openCreateFolderDialog() {
  newFolderName.value = '';
  showCreateFolderDialog.value = true;
}

async function handleCreateFolder() {
  if (!newFolderName.value.trim()) {
    message.warning('请输入文件夹名称');
    return;
  }

  creatingFolder.value = true;
  try {
    await createFolderApi(
      newFolderName.value.trim(),
      currentFolder.value || undefined,
    );
    message.success('文件夹创建成功');
    showCreateFolderDialog.value = false;
    await loadFiles();
  } catch (error: any) {
    message.error(error.message || '创建失败');
  } finally {
    creatingFolder.value = false;
  }
}

// ============ 确认选择 ============
function handleConfirm() {
  if (selectedFiles.value.length === 0) {
    message.warning('请先选择文件');
    return;
  }
  emit('select', selectedFiles.value);
  handleClose();
}

function handleClose() {
  isOpen.value = false;
  // 重置选择
  selectedFiles.value = [];
}

// ============ 搜索和筛选 ============
function handleSearch() {
  currentPage.value = 1;
  loadFiles();
}

function handlePageChange(page: number) {
  currentPage.value = page;
  loadFiles();
}

// ============ 生命周期 ============
watch(isOpen, (newVal) => {
  if (newVal) {
    loadFiles();
  }
});

onMounted(() => {
  if (isOpen.value) {
    loadFiles();
  }
});

// ============ 工具函数 ============
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  switch (type) {
    case 'document': {
      return FileTextOutlined;
    }
    case 'folder': {
      return FolderOutlined;
    }
    case 'image': {
      return FileImageOutlined;
    }
    case 'video': {
      return VideoCameraOutlined;
    }
    default: {
      return FileOutlined;
    }
  }
}

// 图片加载完成处理
function handleImageLoad(event: Event) {
  const img = event.target as HTMLImageElement;
  img.classList.add('loaded');
}

// 图片加载错误处理
function handleImageError(event: Event, file: FileInfo) {
  const img = event.target as HTMLImageElement;
  // 替换为占位图标
  const iconContainer = img.parentElement;
  if (iconContainer) {
    img.style.display = 'none';
    // 可以添加一个错误图标或文字提示
    console.warn(`图片加载失败: ${file.name}`);
  }
}
</script>

<template>
  <a-modal
    :visible="isOpen"
    title="选择附件"
    width="80%"
    :footer="null"
    :destroy-on-close="true"
    @cancel="handleClose"
  >
    <div class="media-picker">
      <!-- 面包屑导航 -->
      <div class="media-picker__breadcrumb">
        <a-breadcrumb separator=">">
          <a-breadcrumb-item>
            <a @click="navigateToRoot" class="breadcrumb-link">
              <HomeOutlined class="breadcrumb-icon" />
              根目录
            </a>
          </a-breadcrumb-item>
          <a-breadcrumb-item
            v-for="(folder, index) in breadcrumbPath"
            :key="index"
          >
            <a @click="navigateToBreadcrumb(index)" class="breadcrumb-link">
              {{ folder }}
            </a>
          </a-breadcrumb-item>
        </a-breadcrumb>
      </div>

      <!-- 工具栏 -->
      <div class="media-picker__toolbar">
        <div class="media-picker__search">
          <a-input
            v-model:value="keyword"
            placeholder="搜索文件名"
            style="width: 300px"
            @press-enter="handleSearch"
          >
            <template #prefix>
              <SearchOutlined />
            </template>
          </a-input>
          <a-select
            v-model:value="fileType"
            :options="fileTypeOptions"
            style="width: 150px; margin-left: 12px"
            @change="handleSearch"
          />
        </div>
        <div class="media-picker__actions">
          <a-button @click="openCreateFolderDialog">
            <template #icon><CreateNewFolderOutlined /></template>
            新建文件夹
          </a-button>
          <a-upload
            :before-upload="handleUpload"
            :show-upload-list="false"
            :accept="accept"
          >
            <a-button type="primary" :loading="uploading">
              <template #icon><MaterialSymbolsAdd /></template>
              上传文件
            </a-button>
          </a-upload>
        </div>
      </div>

      <!-- 文件网格 -->
      <div class="media-picker__content">
        <a-spin :spinning="loading">
          <div v-if="fileList.length > 0" class="media-picker__grid">
            <div
              v-for="file in fileList"
              :key="file.name"
              class="media-picker__item"
              :class="{
                'media-picker__item--selected': isSelected(file),
                'media-picker__item--folder': file.is_folder,
              }"
              @click="handleItemClick(file)"
            >
              <!-- 文件/文件夹预览 -->
              <div class="media-picker__preview">
                <component
                  :is="getFileIcon(file.type)"
                  v-if="file.is_folder || file.type !== 'image'"
                  class="media-picker__icon"
                />
                <img
                  v-else
                  :src="file.url"
                  :alt="file.name"
                  loading="lazy"
                  @load="(e) => handleImageLoad(e)"
                  @error="(e) => handleImageError(e, file)"
                />
              </div>

              <!-- 文件信息 -->
              <div class="media-picker__info">
                <div class="media-picker__name" :title="file.name">
                  {{ file.name }}
                </div>
                <div
                  v-if="!file.is_folder && file.size > 0"
                  class="media-picker__meta"
                >
                  {{ formatFileSize(file.size) }}
                </div>
                <div v-else-if="file.is_folder" class="media-picker__meta">
                  文件夹
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="media-picker__actions" @click.stop>
                <a-button
                  type="text"
                  danger
                  size="small"
                  @click="handleDelete(file)"
                >
                  <MaterialSymbolsDelete />
                </a-button>
              </div>

              <!-- 选中标记 -->
              <div v-if="isSelected(file)" class="media-picker__check">
                <span class="media-picker__check-icon">✓</span>
              </div>
            </div>
          </div>
          <a-empty v-else description="暂无文件" />
        </a-spin>
      </div>

      <!-- 分页 -->
      <div v-if="total > 0" class="media-picker__pagination">
        <a-pagination
          v-model:current="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :show-total="(total) => `共 ${total} 项`"
          @change="handlePageChange"
        />
      </div>

      <!-- 底部操作栏 -->
      <div class="media-picker__footer">
        <div class="media-picker__selected">
          已选择 {{ selectedFiles.length }} 个文件
        </div>
        <div class="media-picker__buttons">
          <a-button @click="handleClose">取消</a-button>
          <a-button type="primary" @click="handleConfirm">确定</a-button>
        </div>
      </div>
    </div>

    <!-- 创建文件夹对话框 -->
    <a-modal
      :visible="showCreateFolderDialog"
      title="新建文���夹"
      @ok="handleCreateFolder"
      @cancel="() => (showCreateFolderDialog = false)"
      :confirm-loading="creatingFolder"
    >
      <a-input
        v-model:value="newFolderName"
        placeholder="请输入文件夹名称"
        @press-enter="handleCreateFolder"
      />
    </a-modal>
  </a-modal>
</template>

<style scoped>
.media-picker {
  display: flex;
  flex-direction: column;
  height: 70vh;
}

.media-picker__breadcrumb {
  padding: 12px 16px;
  margin-bottom: 16px;
  background-color: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
}

.breadcrumb-link {
  display: inline-flex;
  align-items: center;
  color: #595959;
  cursor: pointer;
  transition: color 0.3s;
}

.breadcrumb-link:hover {
  color: #1890ff;
}

.breadcrumb-icon {
  margin-right: 4px;
  font-size: 14px;
}

.media-picker__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.media-picker__search {
  display: flex;
  align-items: center;
}

.media-picker__actions {
  display: flex;
  gap: 8px;
}

.media-picker__content {
  flex: 1;
  margin-bottom: 16px;
  overflow-y: auto;
}

.media-picker__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
}

.media-picker__item {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  background: #fff;
  border: 2px solid #f0f0f0;
  border-radius: 8px;
  transition: all 0.3s;
}

.media-picker__item:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
}

.media-picker__item--selected {
  background: #e6f7ff;
  border-color: #1890ff;
}

.media-picker__item--folder {
  border-style: dashed;
}

.media-picker__preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 120px;
  overflow: hidden;
  background: #fafafa;
}

.media-picker__preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #f0f0f0; /* 加载时的背景色 */
  transition: opacity 0.3s; /* 淡入效果 */
}

.media-picker__preview img[loading='lazy'] {
  opacity: 0;
}

.media-picker__preview img[loading='lazy'].loaded {
  opacity: 1;
}

.media-picker__icon {
  font-size: 48px;
  color: #1890ff;
}

.media-picker__info {
  padding: 8px;
}

.media-picker__name {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  font-weight: 500;
  color: #262626;
  white-space: nowrap;
}

.media-picker__meta {
  margin-top: 4px;
  font-size: 12px;
  color: #8c8c8c;
}

.media-picker__item-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.3s;
}

.media-picker__item:hover .media-picker__item-actions {
  opacity: 1;
}

.media-picker__check {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #1890ff;
  border-radius: 50%;
}

.media-picker__check-icon {
  font-size: 14px;
  font-weight: bold;
  color: #fff;
}

.media-picker__pagination {
  display: flex;
  justify-content: center;
  padding: 16px 0;
  border-top: 1px solid #f0f0f0;
}

.media-picker__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.media-picker__selected {
  font-size: 14px;
  color: #595959;
}

.media-picker__buttons {
  display: flex;
  gap: 8px;
}
</style>
