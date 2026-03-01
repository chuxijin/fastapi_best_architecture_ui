<script setup lang="ts">
import type { FrequentShareLink } from '../utils/frequentShareLinks';

import { computed, watch } from 'vue';

import {
  formatShareLinkName,
  getFrequentShareLinks,
} from '../utils/frequentShareLinks';

// Props
interface Props {
  accountId?: number | string;
  visible?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  accountId: undefined,
  visible: true,
});

const emit = defineEmits<Emits>();

// Emits
interface Emits {
  (e: 'select', data: { name: string; url: string }): void;
}

// 常用分享链接列表
const frequentLinks = computed<FrequentShareLink[]>(() => {
  if (!props.accountId || !props.visible) {
    return [];
  }

  return getFrequentShareLinks(props.accountId.toString());
});

// 处理链接点击
function handleLinkClick(link: FrequentShareLink) {
  emit('select', {
    url: link.url,
    name: link.name,
  });
}

// 监听accountId变化，重新获取数据
watch(
  () => props.accountId,
  () => {
    // 数据会通过computed自动更新
  },
);
</script>

<template>
  <div v-if="frequentLinks.length > 0" class="frequent-share-links">
    <div class="mb-2 text-xs text-gray-500">常用分享链接</div>
    <div class="space-y-2">
      <div
        v-for="link in frequentLinks"
        :key="link.url"
        class="frequent-link-item cursor-pointer rounded-lg border border-gray-200 bg-white p-3 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm"
        :title="`${link.name}\n${link.url}\n访问${link.visitCount}次，保存${link.saveCount}次`"
        @click="handleLinkClick(link)"
      >
        <div class="flex items-start space-x-2">
          <svg
            class="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          <div class="min-w-0 flex-1">
            <div class="truncate font-medium text-gray-900">
              {{ formatShareLinkName(link.name, link.url) }}
            </div>
            <div class="mt-1 text-xs text-gray-500">
              {{
                link.saveCount > 0
                  ? `保存${link.saveCount}次`
                  : `访问${link.visitCount}次`
              }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 移动端适配 */
@media (max-width: 768px) {
  .frequent-link-item {
    min-width: 60px;
    max-width: 150px;
    padding: 4px 8px;
  }

  .frequent-share-links .mb-2 {
    margin-bottom: 8px;
  }
}

.frequent-share-links {
  margin-bottom: 12px;
}

.frequent-link-item {
  min-width: 80px;
  max-width: 200px;
}

.frequent-link-item:hover {
  box-shadow: 0 2px 4px rgb(0 0 0 / 10%);
  transform: translateY(-1px);
}
</style>
