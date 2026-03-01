<script setup lang="ts">
import type {
  CoulddriveFileInfo,
  CoulddriveListFilesParams,
  CoulddriveListShareFilesParams,
} from '#/api';

import { computed, h, nextTick, ref, watch } from 'vue';

import { VbenTree } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';

import { message } from 'ant-design-vue';

import { getCoulddriveFileListApi, getCoulddriveShareFileListApi } from '#/api';

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: '选择文件',
  initialPath: '',
  multiple: true,
  shareParams: () => ({ sourceId: '', sourceType: '' }),
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
const FolderOpenIcon = createIconifyIcon('mdi:folder-open');

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
  multiple?: boolean; // 是否支持多选
}

// 树节点接口
interface TreeNode {
  key: string;
  title: string;
  isLeaf?: boolean;
  children?: TreeNode[];
  raw?: CoulddriveFileInfo;
  path?: string;
  icon?: any;
  selectable?: boolean;
  checkable?: boolean;
}

// 状态
const treeData = ref<TreeNode[]>([]);
const expandedKeys = ref<string[]>([]);
const selectedKeys = ref<string[]>([]);
const checkedKeys = ref<string[]>([]);
const loading = ref(false);
const loadingNodes = ref<Set<string>>(new Set());

// 文件映射，用于快速查找
const fileMap = ref<Map<string, CoulddriveFileInfo>>(new Map());

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
      resetState();
      loadRootFiles();
    }
  },
);

// 重置状态
function resetState() {
  treeData.value = [];
  expandedKeys.value = [];
  selectedKeys.value = [];
  checkedKeys.value = [];
  fileMap.value.clear();
  loadingNodes.value.clear();
}

// 加载根目录文件
async function loadRootFiles() {
  if (!props.authToken) {
    message.error('账号认证信息缺失');
    return;
  }

  loading.value = true;
  try {
    const files = await loadFiles('/');
    treeData.value = buildTreeNodes(files, '/');

    // 如果有初始路径，展开到该路径
    if (props.initialPath && props.initialPath !== '/') {
      await expandToPath(props.initialPath);
    }
  } catch (error) {
    console.error('加载根目录失败:', error);
    message.error('加载文件列表失败');
  } finally {
    loading.value = false;
  }
}

// 加载指定路径的文件
async function loadFiles(path: string): Promise<CoulddriveFileInfo[]> {
  const fileId = getFileIdFromPath(path);

  if (props.mode === 'disk') {
    const params: CoulddriveListFilesParams = {
      drive_type: props.driveType,
      file_path: path,
      file_id: fileId,
      page: 1,
      size: 200, // 后端API限制最大200
    };
    const response = await getCoulddriveFileListApi(params, props.authToken);
    return response.items || [];
  } else if (props.mode === 'share' && props.shareParams) {
    const params: CoulddriveListShareFilesParams = {
      drive_type: props.driveType,
      source_type: props.shareParams.sourceType,
      source_id: props.shareParams.sourceId,
      file_path: path,
      page: 1,
      size: 200, // 后端API限制最大200
    };
    const response = await getCoulddriveShareFileListApi(
      params,
      props.authToken,
    );
    return response.items || [];
  }

  return [];
}

// 从路径获取文件ID（简化实现）
function getFileIdFromPath(path: string): string {
  // 这里可以根据实际需求实现路径到文件ID的映射
  // 目前使用默认值
  return path === '/' ? '0' : '0';
}

// 构建树节点
function buildTreeNodes(
  files: CoulddriveFileInfo[],
  basePath: string,
): TreeNode[] {
  return files.map((file) => {
    const key = `${basePath}${file.file_name}`.replaceAll(/\/+/g, '/');
    const fullPath = file.file_path || key;

    // 存储文件信息到映射中
    fileMap.value.set(key, file);

    const node: TreeNode = {
      key,
      title: file.file_name,
      isLeaf: !file.is_folder,
      path: fullPath,
      raw: file,
      selectable: true,
      checkable: !file.is_folder, // 只有文件可以被勾选
    };

    return node;
  });
}

// 异步加载子节点
async function onLoadData(node: TreeNode): Promise<void> {
  if (!node.raw?.is_folder || node.children) {
    return;
  }

  const nodeKey = node.key;
  loadingNodes.value.add(nodeKey);

  try {
    const files = await loadFiles(node.path || node.key);
    const children = buildTreeNodes(files, node.path || node.key);

    // 更新树数据
    updateNodeChildren(treeData.value, nodeKey, children);

    // 触发树组件更新
    await nextTick();
  } catch (error) {
    console.error('加载子节点失败:', error);
    message.error('加载文件夹内容失败');
  } finally {
    loadingNodes.value.delete(nodeKey);
  }
}

// 更新节点的子节点
function updateNodeChildren(
  nodes: TreeNode[],
  targetKey: string,
  children: TreeNode[],
): boolean {
  for (const node of nodes) {
    if (node.key === targetKey) {
      node.children = children;
      return true;
    }
    if (
      node.children &&
      updateNodeChildren(node.children, targetKey, children)
    ) {
      return true;
    }
  }
  return false;
}

// 展开到指定路径
async function expandToPath(targetPath: string) {
  const pathSegments = targetPath.split('/').filter(Boolean);
  let currentPath = '';

  for (const segment of pathSegments) {
    currentPath += `/${segment}`;
    const nodeKey = currentPath.replaceAll(/\/+/g, '/');

    // 展开当前节点
    if (!expandedKeys.value.includes(nodeKey)) {
      expandedKeys.value.push(nodeKey);

      // 查找并加载该节点
      const node = findNodeByKey(treeData.value, nodeKey);
      if (node && node.raw?.is_folder) {
        await onLoadData(node);
      }
    }
  }
}

// 根据key查找节点
function findNodeByKey(nodes: TreeNode[], key: string): null | TreeNode {
  for (const node of nodes) {
    if (node.key === key) {
      return node;
    }
    if (node.children) {
      const found = findNodeByKey(node.children, key);
      if (found) return found;
    }
  }
  return null;
}

// 处理节点选择
// 更新勾选 keys，统一为字符串数组
function onUpdateCheckedKeys(
  keys: string[] | { checked: string[]; halfChecked: string[] },
) {
  checkedKeys.value = Array.isArray(keys) ? keys : keys.checked;
}

// 处理节点勾选
function onCheck(
  checked: string[] | { checked: string[]; halfChecked: string[] },
) {
  const keys = Array.isArray(checked) ? checked : checked.checked;
  // 过滤掉文件夹，只保留文件
  checkedKeys.value = keys.filter((key) => {
    const file = fileMap.value.get(key);
    return file && !file.is_folder;
  });
}

// 处理节点展开
// 依赖 :load-data 懒加载，无需额外 expand 事件处理

// 获取已选择的文件
function getSelectedFiles(): CoulddriveFileInfo[] {
  const keys = Array.isArray(checkedKeys.value)
    ? checkedKeys.value
    : checkedKeys.value;
  return keys
    .map((key) => fileMap.value.get(key))
    .filter((file): file is CoulddriveFileInfo => !!file && !file.is_folder);
}

// 确认选择
function confirmSelection() {
  const selectedFiles = getSelectedFiles();

  if (selectedFiles.length === 0) {
    message.warning('请选择至少一个文件');
    return;
  }

  // 获取当前路径（可以是最后选择的文件的路径）
  const lastFile = selectedFiles[selectedFiles.length - 1];
  const currentPath = lastFile?.file_path || '/';
  const currentFileId = getFileIdFromPath(currentPath);

  emit('confirm', {
    path: currentPath,
    fileId: currentFileId,
    selectedFiles,
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

// 自定义树节点渲染
function renderTreeNode({ node }: { node: TreeNode }) {
  const file = node.raw;
  if (!file) return node.title;

  return h('div', { class: 'flex items-center justify-between w-full pr-2' }, [
    h('div', { class: 'flex items-center gap-2 flex-1 min-w-0' }, [
      h('span', { class: 'flex-shrink-0' }, [
        file.is_folder
          ? expandedKeys.value.includes(node.key)
            ? h(FolderOpenIcon, { class: 'w-4 h-4 text-blue-500' })
            : h(FolderIcon, { class: 'w-4 h-4 text-blue-500' })
          : h(FileIcon, { class: 'w-4 h-4 text-gray-500' }),
      ]),
      h('span', { class: 'truncate font-medium' }, file.file_name),
    ]),
    !file.is_folder && file.file_size
      ? h(
          'span',
          { class: 'text-xs text-gray-500 flex-shrink-0 ml-2' },
          formatFileSize(file.file_size),
        )
      : null,
  ]);
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

      <!-- 说明文字 -->
      <div class="m-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
        <div class="text-sm text-blue-800">
          <div class="mb-1 font-medium">使用说明：</div>
          <ul class="list-inside list-disc space-y-1 text-xs">
            <li>点击文件夹图标可展开/收起文件夹</li>
            <li>勾选文件前的复选框来选择文件</li>
            <li>文件夹不能被选择，只能选择文件</li>
            <li v-if="multiple">支持多选，可以选择多个文件</li>
            <li v-else>单选模式，只能选择一个文件</li>
          </ul>
        </div>
      </div>

      <!-- 文件树 -->
      <div
        class="mx-4 flex-1 overflow-hidden rounded-lg border border-gray-200"
      >
        <div v-if="loading" class="flex h-32 items-center justify-center">
          <div class="text-gray-500">加载中...</div>
        </div>
        <div
          v-else-if="treeData.length === 0"
          class="flex h-32 items-center justify-center"
        >
          <div class="text-gray-500">暂无文件</div>
        </div>
        <div v-else class="h-full overflow-auto p-2">
          <VbenTree
            :tree-data="treeData"
            :expanded-keys="expandedKeys"
            :selected-keys="selectedKeys"
            :checked-keys="checkedKeys"
            :checkable="multiple"
            :selectable="true"
            :load-data="onLoadData"
            :show-icon="false"
            block-node
            @check="onCheck"
            @update:expanded-keys="(keys: string[]) => (expandedKeys = keys)"
            @update:selected-keys="(keys: string[]) => (selectedKeys = keys)"
            @update:checked-keys="onUpdateCheckedKeys"
          >
            <template #title="slotProps">
              <component :is="() => renderTreeNode(slotProps)" />
            </template>
          </VbenTree>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="flex items-center justify-between border-t bg-gray-50 p-4">
        <div class="text-sm text-gray-600">
          <span v-if="multiple">
            已选择
            {{
              checkedKeys.filter((key: string) => {
                const file = fileMap.get(key);
                return file && !file.is_folder;
              }).length
            }}
            个文件
          </span>
          <span v-else>
            {{
              selectedKeys.length > 0
                ? `已选择: ${fileMap.get(selectedKeys[0] || '')?.file_name || ''}`
                : '请选择一个文件'
            }}
          </span>
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
            :disabled="
              multiple
                ? checkedKeys.filter((key: string) => {
                    const file = fileMap.get(key);
                    return file && !file.is_folder;
                  }).length === 0
                : selectedKeys.length === 0
            "
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
:deep(.vben-tree .ant-tree-node-content-wrapper) {
  width: 100%;
}

:deep(.vben-tree .ant-tree-title) {
  width: 100%;
}

:deep(.vben-tree .ant-tree-node-content-wrapper:hover) {
  background-color: #f5f5f5;
}

:deep(.vben-tree .ant-tree-node-selected) {
  background-color: #e6f7ff !important;
}
</style>
