<script setup lang="ts">
import type { BankResult } from '#/api';

import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { ColPage, Page } from '@vben/common-ui';
import {
  MaterialSymbolsCalendarMonthOutline,
  MaterialSymbolsDeleteOutline,
  MaterialSymbolsDescriptionOutline,
  MaterialSymbolsEditNoteOutline,
  MaterialSymbolsInfoOutline,
  MaterialSymbolsMenuBookOutline,
  MaterialSymbolsModelTrainingOutline,
  MaterialSymbolsQuizOutline,
  MaterialSymbolsUploadFileOutline,
  MaterialSymbolsWorkspacePremiumOutline,
} from '@vben/icons';

import { Card, message, TabPane, Tabs } from 'ant-design-vue';

import { getBankDetailApi } from '#/api';

import BasicInfo from './components/BasicInfo.vue';
import ChapterManage from './components/ChapterManage.vue';
import QuestionImport from './components/QuestionImport.vue';
import QuestionManage from './components/QuestionManage.vue';

const route = useRoute();
const router = useRouter();

const bankId = computed(() => Number(route.query.id));
const bankInfo = ref<BankResult | null>(null);
const activeTab = ref('basic');
const originalTitle = route.meta.title;

const pendingTips: Record<string, string> = {
  paper: '试卷管理功能开发中',
  'paper-model': '试卷模型功能开发中',
  daily: '每日一练功能开发中',
  certificate: '证书模版功能开发中',
  correction: '错题校正功能开发中',
  delete: '题库删除功能开发中',
};

onMounted(async () => {
  if (!bankId.value || Number.isNaN(bankId.value)) {
    message.error('题库 ID 无效');
    router.push('/knowledge-store/resource/question-bank');
    return;
  }

  try {
    bankInfo.value = await getBankDetailApi(bankId.value);
    updateRouteTitle(bankInfo.value?.name);
  } catch {
    message.error('获取题库信息失败');
    router.back();
  }
});

onBeforeUnmount(() => {
  updateRouteTitle(
    typeof originalTitle === 'string' ? originalTitle : '题库详情管理',
  );
});

function updateRouteTitle(name: string | undefined = '题库详情管理') {
  const title = name;
  route.meta.title = title;
  if (typeof document !== 'undefined') {
    document.title = title;
  }
}

function handleTabChange(key: number | string) {
  const tabKey = String(key);
  activeTab.value = tabKey;
  const tip = pendingTips[tabKey];
  if (tip) {
    message.info(tip);
  }
}

function handleBankInfoUpdate(updatedInfo: BankResult) {
  bankInfo.value = updatedInfo;
  updateRouteTitle(updatedInfo.name);
}
</script>

<template>
  <Page content-class="flex flex-col gap-4">
    <ColPage
      auto-content-height
      :resizable="true"
      :left-width="10"
      :right-width="90"
    >
      <template #left>
        <Card class="nav-card h-full" :bordered="false">
          <Tabs
            v-model:active-key="activeTab"
            tab-position="left"
            class="nav-tabs"
            @change="handleTabChange"
          >
            <TabPane key="basic">
              <template #tab>
                <span class="flex items-center gap-1">
                  <MaterialSymbolsInfoOutline class="size-4" />
                  基本信息
                </span>
              </template>
            </TabPane>
            <TabPane key="chapter">
              <template #tab>
                <span class="flex items-center gap-1">
                  <MaterialSymbolsMenuBookOutline class="size-4" />
                  章节管理
                </span>
              </template>
            </TabPane>
            <TabPane key="question">
              <template #tab>
                <span class="flex items-center gap-1">
                  <MaterialSymbolsQuizOutline class="size-4" />
                  题目管理
                </span>
              </template>
            </TabPane>
            <TabPane key="import">
              <template #tab>
                <span class="flex items-center gap-1">
                  <MaterialSymbolsUploadFileOutline class="size-4" />
                  题目导入
                </span>
              </template>
            </TabPane>
            <TabPane key="paper">
              <template #tab>
                <span class="flex items-center gap-1">
                  <MaterialSymbolsDescriptionOutline class="size-4" />
                  试卷管理
                </span>
              </template>
            </TabPane>
            <TabPane key="paper-model">
              <template #tab>
                <span class="flex items-center gap-1">
                  <MaterialSymbolsModelTrainingOutline class="size-4" />
                  试卷模型
                </span>
              </template>
            </TabPane>
            <TabPane key="daily">
              <template #tab>
                <span class="flex items-center gap-1">
                  <MaterialSymbolsCalendarMonthOutline class="size-4" />
                  每日一练
                </span>
              </template>
            </TabPane>
            <TabPane key="certificate">
              <template #tab>
                <span class="flex items-center gap-1">
                  <MaterialSymbolsWorkspacePremiumOutline class="size-4" />
                  证书模版
                </span>
              </template>
            </TabPane>
            <TabPane key="correction">
              <template #tab>
                <span class="flex items-center gap-1">
                  <MaterialSymbolsEditNoteOutline class="size-4" />
                  错题校正
                </span>
              </template>
            </TabPane>
            <TabPane key="delete">
              <template #tab>
                <span class="flex items-center gap-1 text-red-600">
                  <MaterialSymbolsDeleteOutline class="size-4" />
                  题库删除
                </span>
              </template>
            </TabPane>
          </Tabs>
        </Card>
      </template>

      <div class="panel-wrapper">
        <BasicInfo
          v-if="activeTab === 'basic' && bankInfo"
          :bank-id="bankId"
          :bank-info="bankInfo"
          @update="handleBankInfoUpdate"
        />
        <ChapterManage
          v-else-if="activeTab === 'chapter'"
          :bank-id="bankId"
          :bank-info="bankInfo"
        />
        <QuestionManage
          v-else-if="activeTab === 'question'"
          :bank-id="bankId"
          :bank-info="bankInfo"
        />
        <QuestionImport
          v-else-if="activeTab === 'import'"
          :bank-id="bankId"
          :bank-info="bankInfo"
        />
        <div
          v-else
          class="tab-placeholder"
          :class="{ danger: activeTab === 'delete' }"
        >
          {{ pendingTips[activeTab] || '功能开发中...' }}
        </div>
      </div>
    </ColPage>
  </Page>
</template>

<style scoped>
.nav-card :deep(.ant-card-body) {
  display: flex;
  height: 100%;
  padding: 12px;
}

.nav-tabs {
  flex: 1;
}

.nav-tabs :deep(.ant-tabs-nav) {
  width: auto;
  margin: 0;
}

.nav-tabs :deep(.ant-tabs-tab) {
  justify-content: flex-start;
  padding: 12px;
  margin: 0;
}

.nav-tabs :deep(.ant-tabs-tab + .ant-tabs-tab) {
  margin-top: 0;
}

.nav-tabs :deep(.ant-tabs-content-holder) {
  display: none;
}

.panel-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  overflow-y: auto;
  background-color: var(--card);
  border-radius: var(--radius);
}

.tab-placeholder {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #6b7280;
}

.tab-placeholder.danger {
  color: #dc2626;
}
</style>
