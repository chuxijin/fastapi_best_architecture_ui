<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Card, Menu, MenuItem } from 'ant-design-vue';

import ActivationCodes from './components/ActivationCodes.vue';
import Members from './components/Members.vue';

const route = useRoute();
const router = useRouter();

const bankId = computed(() => Number(route.query.bankId) || 0);
const bankName = computed(() => String(route.query.bankName || '题库'));

const activeTab = ref(String(route.query.tab || 'activation-codes'));

watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab) {
      activeTab.value = String(newTab);
    }
  },
);

const menuItems = [
  { key: 'members', label: '题库学员', component: Members },
  { key: 'activation-codes', label: '题库激活码', component: ActivationCodes },
  { key: 'video-analysis', label: '解析视频', component: null },
  { key: 'text-analysis', label: '文字解析', component: null },
  { key: 'invitation-cards', label: '题库邀请卡', component: null },
  { key: 'group-guide', label: '引导加群', component: null },
  { key: 'gift-management', label: '赠品管理', component: null },
  { key: 'daily-practice', label: '每日刷题记录', component: null },
  { key: 'card-records', label: '邀请卡记录', component: null },
  { key: 'custom-popup', label: '专属弹窗', component: null },
];

const currentComponent = computed(() => {
  const item = menuItems.find((m) => m.key === activeTab.value);
  return item?.component;
});

const currentLabel = computed(() => {
  const item = menuItems.find((m) => m.key === activeTab.value);
  return item?.label || '';
});

const selectedKeys = computed(() => [activeTab.value]);

function handleMenuClick({ key }: { key: string }) {
  router.push({
    path: route.path,
    query: {
      ...route.query,
      tab: key,
    },
  });
}

function goBack() {
  router.push('/knowledge-store/resource/question-bank');
}
</script>

<template>
  <Page auto-content-height content-class="p-0">
    <div class="flex h-full">
      <!-- 左侧菜单 -->
      <Card class="w-48 flex-shrink-0" :bordered="false">
        <template #title>
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold">题库运营</span>
            <a-button type="link" size="small" @click="goBack">返回</a-button>
          </div>
        </template>
        <Menu
          :selected-keys="selectedKeys"
          mode="inline"
          :bordered="false"
          @click="handleMenuClick"
        >
          <MenuItem v-for="item in menuItems" :key="item.key">
            {{ item.label }}
          </MenuItem>
        </Menu>
      </Card>

      <!-- 右侧内容区 -->
      <div class="flex flex-1 flex-col bg-gray-50 p-4">
        <Card :title="`${bankName} - ${currentLabel}`" class="flex-1">
          <template #default>
            <div class="h-full">
              <component
                :is="currentComponent"
                v-if="currentComponent"
                :bank-id="bankId"
                :bank-name="bankName"
              />
              <div v-else class="py-20 text-center text-gray-400">
                {{ currentLabel }}功能开发中...
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </Page>
</template>

<style scoped>
:deep(.ant-card) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

:deep(.ant-card-head) {
  flex-shrink: 0;
  min-height: 48px;
}

:deep(.ant-card-body) {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 16px;
  overflow: hidden;
}
</style>
