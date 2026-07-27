<script setup lang="ts">
import type { MyDriveFile } from '#/api';

import { ref, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';

import { message } from 'ant-design-vue';

import {
  getMyDriveAccountPersonalFilesApi,
  getMyDriveSpaceFilesApi,
  previewMyDriveSpaceFilesApi,
} from '#/api';

const props = withDefaults(
  defineProps<{
    accountId?: number;
    fileId?: null | string;
    maxHeight?: number;
    open: boolean;
    path?: string;
    previewParams?: Omit<
      Parameters<typeof previewMyDriveSpaceFilesApi>[0],
      'file_id' | 'path'
    >;
    spaceId?: number;
    title?: string;
  }>(),
  {
    accountId: undefined,
    fileId: null,
    maxHeight: 420,
    path: '/',
    previewParams: undefined,
    spaceId: undefined,
    title: '选择目录',
  },
);

const emit = defineEmits<{
  confirm: [
    value: { file: MyDriveFile | null; fileId: null | string; path: string },
  ];
  'update:open': [open: boolean];
}>();

const FolderIcon = createIconifyIcon('mdi:folder');

const loading = ref(false);
const files = ref<MyDriveFile[]>([]);
const directoryStack = ref<MyDriveFile[]>([]);
const selectedPath = ref('/');
const selectedFileId = ref<null | string>(null);
const selectedFile = ref<MyDriveFile | null>(null);

async function loadFiles(
  path = '/',
  fileId: null | string = null,
): Promise<void> {
  if (!props.accountId && !props.spaceId && !props.previewParams) return;
  loading.value = true;
  try {
    const result = props.previewParams
      ? await previewMyDriveSpaceFilesApi({
          ...props.previewParams,
          file_id: fileId,
          path,
        })
      : props.spaceId
        ? await getMyDriveSpaceFilesApi(props.spaceId, path, fileId)
        : await getMyDriveAccountPersonalFilesApi(
            props.accountId as number,
            path,
            fileId,
          );
    files.value = result.items.filter((file) => file.is_directory);
    selectedPath.value = path;
    selectedFileId.value = fileId;
  } catch {
    files.value = [];
    message.error('加载目录失败，请检查账号凭证');
  } finally {
    loading.value = false;
  }
}

async function enterDirectory(file: MyDriveFile): Promise<void> {
  directoryStack.value.push(file);
  selectedFile.value = file;
  await loadFiles(file.path, file.file_id);
}

async function selectRoot(): Promise<void> {
  directoryStack.value = [];
  selectedFile.value = null;
  await loadFiles('/', null);
}

async function selectBreadcrumb(index: number): Promise<void> {
  const target = directoryStack.value[index];
  directoryStack.value = directoryStack.value.slice(0, index + 1);
  selectedFile.value = target;
  await loadFiles(target.path, target.file_id);
}

function closeModal(): void {
  emit('update:open', false);
}

function confirmPath(): void {
  emit('confirm', {
    file: selectedFile.value,
    fileId: selectedFileId.value,
    path: selectedPath.value,
  });
  closeModal();
}

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return;
    directoryStack.value = [];
    selectedPath.value = props.path || '/';
    selectedFileId.value = props.fileId || null;
    selectedFile.value = null;
    await loadFiles(selectedPath.value, selectedFileId.value);
  },
);
</script>

<template>
  <a-modal
    :open="open"
    :title="title"
    :z-index="3000"
    width="720px"
    @cancel="closeModal"
    @ok="confirmPath"
  >
    <div
      class="mb-3 flex items-center gap-1 overflow-x-auto text-sm text-slate-500"
    >
      <button
        class="shrink-0 rounded-md px-1.5 py-0.5 hover:bg-indigo-50 hover:text-indigo-600"
        @click="selectRoot"
      >
        根目录
      </button>
      <template v-for="(item, index) in directoryStack" :key="item.file_id">
        <span class="text-slate-300">/</span>
        <button
          class="max-w-40 shrink-0 truncate rounded-md px-1.5 py-0.5 hover:bg-indigo-50 hover:text-indigo-600"
          @click="selectBreadcrumb(index)"
        >
          {{ item.name }}
        </button>
      </template>
    </div>
    <a-spin :spinning="loading">
      <div
        class="overflow-y-auto rounded-xl border border-slate-100 p-2"
        :style="{ maxHeight: `${maxHeight}px` }"
      >
        <button
          class="mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
          :class="selectedPath === '/' ? 'bg-indigo-50 text-indigo-700' : ''"
          @click="selectRoot"
        >
          <FolderIcon class="text-lg text-indigo-500" />
          <span>根目录</span>
        </button>
        <a-empty
          v-if="files.length === 0"
          class="py-12"
          description="当前目录没有子目录"
        />
        <button
          v-for="file in files"
          :key="file.file_id"
          class="mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
          :class="
            selectedPath === file.path ? 'bg-indigo-50 text-indigo-700' : ''
          "
          @click="enterDirectory(file)"
        >
          <FolderIcon class="text-lg text-indigo-500" />
          <span class="truncate">{{ file.name }}</span>
        </button>
      </div>
    </a-spin>
    <div class="mt-3 text-xs text-slate-500">当前选择：{{ selectedPath }}</div>
  </a-modal>
</template>
