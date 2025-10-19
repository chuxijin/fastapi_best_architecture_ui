<script setup lang="ts">
import type { FrequentDirectory } from '#/utils/frequentDirectories';

import { computed, watch } from 'vue';

import {
  formatDirectoryName,
  getFrequentDirectories,
} from '#/utils/frequentDirectories';

// Props
interface Props {
  accountId?: string;
  visible?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  accountId: '',
  visible: true,
});

const emit = defineEmits<Emits>();

// Emits
interface Emits {
  (e: 'navigate', data: { fileId: string; name: string; path: string }): void;
}

// 常用目录列表
const frequentDirs = computed<FrequentDirectory[]>(() => {
  if (!props.accountId || !props.visible) {
    return [];
  }
  return getFrequentDirectories(props.accountId);
});

// 处理目录点击
function handleDirectoryClick(dir: FrequentDirectory) {
  emit('navigate', {
    path: dir.path,
    fileId: dir.fileId,
    name: dir.name,
  });
}

// 监听账号变化，重新加载常用目录
watch(
  () => props.accountId,
  () => {
    // 触发重新计算
    // computed会自动响应accountId的变化
  },
  { immediate: true },
);
</script>

<template>
  <div v-if="frequentDirs.length > 0" class="frequent-directories">
    <div class="mb-2 text-xs text-gray-500">常用目录</div>
    <div class="flex flex-wrap gap-2">
      <div
        v-for="dir in frequentDirs"
        :key="dir.path"
        class="frequent-dir-item cursor-pointer rounded-md border border-gray-200 bg-gray-50 px-3 py-1 text-xs transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
        :title="`${dir.path} (访问${dir.visitCount}次)`"
        @click="handleDirectoryClick(dir)"
      >
        <div class="flex items-center space-x-1">
          <svg
            class="h-3 w-3 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
          <span class="truncate">{{
            formatDirectoryName(dir.path, dir.name)
          }}</span>
          <span class="text-gray-400">({{ dir.visitCount }})</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 移动端适配 */
@media (max-width: 768px) {
  .frequent-dir-item {
    min-width: 60px;
    max-width: 150px;
    padding: 4px 8px;
  }

  .frequent-directories .mb-2 {
    margin-bottom: 8px;
  }
}

.frequent-directories {
  margin-bottom: 12px;
}

.frequent-dir-item {
  min-width: 80px;
  max-width: 200px;
}

.frequent-dir-item:hover {
  box-shadow: 0 2px 4px rgb(0 0 0 / 10%);
  transform: translateY(-1px);
}
</style>
