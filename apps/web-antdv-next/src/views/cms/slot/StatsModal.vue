<script lang="ts" setup>
import type { CmsSlotResult, CmsSlotStatsResult } from '#/api';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Descriptions as ADescriptions,
  DescriptionsItem as ADescriptionsItem,
  Select as ASelect,
  SelectOption as ASelectOption,
  Spin as ASpin,
  message,
} from 'ant-design-vue';

import { getCmsSlotStatsApi } from '#/api';

const slot = ref<CmsSlotResult | null>(null);
const days = ref<number>(7);
const stats = ref<CmsSlotStatsResult | null>(null);
const loading = ref(false);

const dayOptions = [
  { label: '近 1 天', value: 1 },
  { label: '近 7 天', value: 7 },
  { label: '近 30 天', value: 30 },
  { label: '近 90 天', value: 90 },
];

async function fetchStats() {
  if (!slot.value) return;
  loading.value = true;
  try {
    const result = await getCmsSlotStatsApi(slot.value.id, days.value);
    stats.value = result;
  } catch (error) {
    message.error('统计加载失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
}

const [Modal, modalApi] = useVbenModal({
  destroyOnClose: true,
  showCancelButton: false,
  showConfirmButton: false,
  onOpenChange(isOpen) {
    if (isOpen) {
      slot.value = modalApi.getData<CmsSlotResult>();
      days.value = 7;
      stats.value = null;
      fetchStats();
    } else {
      slot.value = null;
      stats.value = null;
    }
  },
});

defineExpose({
  open(target: CmsSlotResult) {
    modalApi.setData(target).open();
  },
});

function onDaysChange() {
  fetchStats();
}

function formatCtr(ctr: number): string {
  return `${(ctr * 100).toFixed(2)}%`;
}
</script>

<template>
  <Modal :title="`数据统计 - ${slot?.name ?? ''}`" :width="560">
    <ASpin :spinning="loading">
      <div class="mb-4 flex items-center gap-3">
        <span>时间范围:</span>
        <ASelect v-model:value="days" style="width: 160px" @change="onDaysChange">
          <ASelectOption v-for="opt in dayOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </ASelectOption>
        </ASelect>
      </div>
      <ADescriptions v-if="stats" :column="2" bordered size="small">
        <ADescriptionsItem label="曝光数">{{ stats.show_count }}</ADescriptionsItem>
        <ADescriptionsItem label="点击数">{{ stats.click_count }}</ADescriptionsItem>
        <ADescriptionsItem label="关闭数">{{ stats.close_count }}</ADescriptionsItem>
        <ADescriptionsItem label="点击率(CTR)">{{ formatCtr(stats.ctr) }}</ADescriptionsItem>
      </ADescriptions>
      <div v-else class="text-center text-gray-400 py-8">暂无数据</div>
    </ASpin>
  </Modal>
</template>
