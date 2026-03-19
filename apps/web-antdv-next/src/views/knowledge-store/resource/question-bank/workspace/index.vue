<script setup lang="ts">
import type { MenuProps } from 'ant-design-vue';
import type { BankResult } from '#/api';

import { computed, h, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import {
  MaterialSymbolsArticleOutline,
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

import { Button, Card, Empty, Menu, message, Tag } from 'ant-design-vue';

import { getBankDetailApi } from '#/api';
import {
  scopeMap,
  statusMap,
} from '#/views/knowledge-store/resource/question-bank/data';

import BasicInfo from './components/BasicInfo.vue';
import ChapterManage from './components/ChapterManage.vue';
import MaterialManage from './components/MaterialManage.vue';
import QuestionImport from './components/QuestionImport.vue';
import QuestionManage from './components/QuestionManage.vue';

const route = useRoute();
const router = useRouter();

const originalTitle = route.meta.title;
const bankInfo = ref<BankResult | null>(null);
const loading = ref(false);

const sectionLabelMap = {
  overview: '概览',
  basic: '基本信息',
  chapter: '章节管理',
  question: '题目管理',
  import: '题目导入',
  material: '材料管理',
  paper: '试卷管理',
  'paper-model': '试卷模型',
  daily: '每日一练',
  certificate: '证书模板',
  correction: '错题校正',
  delete: '删除题库',
} as const;

type SectionKey = keyof typeof sectionLabelMap;

const sectionKeys = new Set<string>(Object.keys(sectionLabelMap));

const pendingTips: Partial<Record<SectionKey, string>> = {
  paper: '试卷管理功能开发中',
  'paper-model': '试卷模型功能开发中',
  daily: '每日一练功能开发中',
  certificate: '证书模板功能开发中',
  correction: '错题校正功能开发中',
  delete: '删除题库功能开发中',
};

const bankId = computed(() => Number(route.params.id ?? route.query.id));

const workspacePageKey = computed(() => {
  if (!bankId.value || Number.isNaN(bankId.value)) {
    return undefined;
  }
  return `question-bank-workspace-${bankId.value}`;
});

const activeSection = computed<SectionKey>(() => {
  const tab = String(route.params.tab ?? 'overview');
  if (sectionKeys.has(tab)) {
    return tab as SectionKey;
  }
  return 'overview';
});

const overviewStats = computed(() => {
  const current = bankInfo.value;
  if (!current) {
    return [];
  }

  return [
    { label: '题目总数', value: current.q_count_cache || 0 },
    { label: '总分', value: current.total_score_cache || 0 },
    { label: '购买数', value: current.buy_count || 0 },
    { label: '状态', value: statusMap[current.status]?.label || '未知' },
  ];
});

const menuItems = computed<MenuProps['items']>(() => [
  {
    key: 'overview',
    label: '概览',
    icon: h(MaterialSymbolsInfoOutline, { class: 'size-4' }),
  },
  {
    type: 'group',
    label: '内容建设',
    children: [
      {
        key: 'basic',
        label: '基本信息',
        icon: h(MaterialSymbolsEditNoteOutline, { class: 'size-4' }),
      },
      {
        key: 'chapter',
        label: '章节管理',
        icon: h(MaterialSymbolsMenuBookOutline, { class: 'size-4' }),
      },
      {
        key: 'question',
        label: '题目管理',
        icon: h(MaterialSymbolsQuizOutline, { class: 'size-4' }),
      },
      {
        key: 'material',
        label: '材料管理',
        icon: h(MaterialSymbolsArticleOutline, { class: 'size-4' }),
      },
      {
        key: 'import',
        label: '题目导入',
        icon: h(MaterialSymbolsUploadFileOutline, { class: 'size-4' }),
      },
    ],
  },
  {
    type: 'group',
    label: '扩展内容',
    children: [
      {
        key: 'paper',
        label: '试卷管理',
        icon: h(MaterialSymbolsDescriptionOutline, { class: 'size-4' }),
      },
      {
        key: 'paper-model',
        label: '试卷模型',
        icon: h(MaterialSymbolsModelTrainingOutline, { class: 'size-4' }),
      },
      {
        key: 'daily',
        label: '每日一练',
        icon: h(MaterialSymbolsCalendarMonthOutline, { class: 'size-4' }),
      },
    ],
  },
  {
    type: 'group',
    label: '高级操作',
    children: [
      {
        key: 'certificate',
        label: '证书模板',
        icon: h(MaterialSymbolsWorkspacePremiumOutline, { class: 'size-4' }),
      },
      {
        key: 'correction',
        label: '错题校正',
        icon: h(MaterialSymbolsEditNoteOutline, { class: 'size-4' }),
      },
      {
        key: 'delete',
        label: '删除题库',
        icon: h(MaterialSymbolsDeleteOutline, { class: 'size-4' }),
        danger: true,
      },
    ],
  },
]);

function buildSectionRoute(section: SectionKey) {
  const nextQuery = workspacePageKey.value
    ? { pageKey: workspacePageKey.value }
    : undefined;

  return {
    path: `/knowledge-store/resource/question-bank/${bankId.value}/${section}`,
    query: nextQuery,
  };
}

function updateRouteTitle(name?: string) {
  const sectionTitle = sectionLabelMap[activeSection.value];
  const title = name ? `${name} - ${sectionTitle}` : '题库工作台';
  route.meta.title = title;
  if (typeof document !== 'undefined') {
    document.title = title;
  }
}

function handleBankInfoUpdate(updatedInfo: BankResult) {
  bankInfo.value = updatedInfo;
}

function goToSection(section: SectionKey) {
  if (!bankId.value || Number.isNaN(bankId.value)) {
    return;
  }
  router.push(buildSectionRoute(section));
}

function handleMenuClick({ key }: { key: string }) {
  if (!sectionKeys.has(key)) {
    return;
  }

  goToSection(key as SectionKey);

  const tip = pendingTips[key as SectionKey];
  if (tip) {
    message.info(tip);
  }
}

watch(
  () => route.params.tab,
  (tab) => {
    if (tab && !sectionKeys.has(String(tab)) && bankId.value) {
      router.replace(buildSectionRoute('overview'));
    }
  },
  { immediate: true },
);

watch(
  [bankId, workspacePageKey, () => route.query.pageKey],
  ([value, pageKey, currentPageKey]) => {
    if (
      !value ||
      Number.isNaN(value) ||
      !pageKey ||
      currentPageKey === pageKey
    ) {
      return;
    }

    router.replace({
      path: route.path,
      query: { pageKey },
    });
  },
  { immediate: true },
);

watch(
  bankId,
  async (value) => {
    if (!value || Number.isNaN(value)) {
      message.error('题库 ID 无效');
      router.push('/knowledge-store/resource/question-bank');
      return;
    }

    loading.value = true;
    try {
      bankInfo.value = await getBankDetailApi(value);
    } catch {
      message.error('获取题库信息失败');
      router.back();
    } finally {
      loading.value = false;
    }
  },
  { immediate: true },
);

watch(
  [() => bankInfo.value?.name, activeSection],
  () => {
    updateRouteTitle(bankInfo.value?.name);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  const title =
    typeof originalTitle === 'string' ? originalTitle : '题库工作台';
  route.meta.title = title;
  if (typeof document !== 'undefined') {
    document.title = title;
  }
});
</script>

<template>
  <Page auto-content-height content-class="flex h-full min-h-0 flex-col gap-4">
    <Card class="workspace-header" :bordered="false">
      <div class="workspace-header__main">
        <div class="min-w-0 flex-1">
          <div class="workspace-header__eyebrow">题库工作台</div>
          <div class="workspace-header__title-row">
            <h1 class="workspace-header__title">
              {{ bankInfo?.name || '加载题库中...' }}
            </h1>
            <Tag
              v-if="bankInfo"
              :color="statusMap[bankInfo.status]?.color || 'default'"
            >
              {{ statusMap[bankInfo.status]?.label || '未知' }}
            </Tag>
            <Tag v-if="bankInfo" color="blue">
              {{ scopeMap[bankInfo.scope] || '未设置范围' }}
            </Tag>
          </div>
          <div class="workspace-header__meta">
            <span>编码：{{ bankInfo?.code || '-' }}</span>
            <span>题目数：{{ bankInfo?.q_count_cache || 0 }}</span>
            <span
              >更新时间：{{
                bankInfo?.updated_time || bankInfo?.created_time || '-'
              }}</span
            >
          </div>
          <p class="workspace-header__desc">
            {{
              bankInfo?.desc || '围绕当前题库完成基础配置、内容建设与后续扩展。'
            }}
          </p>
        </div>
        <div class="workspace-header__actions">
          <Button @click="goToSection('question')">题目管理</Button>
          <Button type="primary" @click="goToSection('import')"
            >题目导入</Button
          >
          <Button
            @click="router.push('/knowledge-store/resource/question-bank')"
          >
            返回列表
          </Button>
        </div>
      </div>
    </Card>

    <div class="workspace-body">
      <div class="workspace-shell">
        <Card class="workspace-nav" :bordered="false">
          <Menu
            mode="inline"
            :items="menuItems"
            :selectedKeys="[activeSection]"
            class="workspace-menu"
            @click="handleMenuClick"
          />
        </Card>

        <div class="workspace-panel">
          <div v-if="loading" class="panel-placeholder">题库信息加载中...</div>

          <Empty
            v-else-if="!bankInfo"
            description="暂未获取到题库信息"
            class="panel-empty"
          />

          <div
            v-else-if="activeSection === 'overview'"
            class="workspace-overview"
          >
            <div class="overview-grid">
              <Card
                v-for="item in overviewStats"
                :key="item.label"
                :bordered="false"
                class="overview-stat"
              >
                <div class="overview-stat__label">{{ item.label }}</div>
                <div class="overview-stat__value">{{ item.value }}</div>
              </Card>
            </div>

            <Card :bordered="false" class="overview-card">
              <template #title>快捷入口</template>
              <div class="overview-shortcuts">
                <Button @click="goToSection('basic')">编辑基本信息</Button>
                <Button @click="goToSection('chapter')">维护章节</Button>
                <Button type="primary" @click="goToSection('question')"
                  >管理题目</Button
                >
                <Button @click="goToSection('material')">管理材料</Button>
                <Button @click="goToSection('import')">导入题目</Button>
              </div>
            </Card>

            <Card :bordered="false" class="overview-card">
              <template #title>题库概况</template>
              <div class="overview-detail-grid">
                <div>
                  <label>题库名称</label>
                  <p>{{ bankInfo.name }}</p>
                </div>
                <div>
                  <label>题库编码</label>
                  <p>{{ bankInfo.code }}</p>
                </div>
                <div>
                  <label>访问范围</label>
                  <p>{{ scopeMap[bankInfo.scope] || '-' }}</p>
                </div>
                <div>
                  <label>创建时间</label>
                  <p>{{ bankInfo.created_time || '-' }}</p>
                </div>
              </div>
            </Card>
          </div>

          <div v-else-if="activeSection === 'basic'" class="workspace-section">
            <BasicInfo
              :bank-id="bankId"
              :bank-info="bankInfo"
              @update="handleBankInfoUpdate"
            />
          </div>
          <div
            v-else-if="activeSection === 'chapter'"
            class="workspace-section"
          >
            <ChapterManage :bank-id="bankId" :bank-info="bankInfo" />
          </div>
          <div
            v-else-if="activeSection === 'question'"
            class="workspace-section"
          >
            <QuestionManage :bank-id="bankId" :bank-info="bankInfo" />
          </div>
          <div v-else-if="activeSection === 'import'" class="workspace-section">
            <QuestionImport :bank-id="bankId" />
          </div>
          <div
            v-else-if="activeSection === 'material'"
            class="workspace-section"
          >
            <MaterialManage :bank-id="bankId" :bank-info="bankInfo" />
          </div>

          <div
            v-else
            class="panel-placeholder"
            :class="{ danger: activeSection === 'delete' }"
          >
            {{ pendingTips[activeSection] || '功能开发中...' }}
          </div>
        </div>
      </div>
    </div>
  </Page>
</template>

<style scoped>
.workspace-header :deep(.ant-card-body) {
  padding: 20px 24px;
}

.workspace-header__main {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
}

.workspace-header__eyebrow {
  margin-bottom: 8px;
  font-size: 12px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.workspace-header__title-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.workspace-header__title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  color: #0f172a;
}

.workspace-header__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 10px;
  font-size: 13px;
  color: #64748b;
}

.workspace-header__desc {
  margin: 12px 0 0;
  font-size: 14px;
  color: #475569;
}

.workspace-header__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.workspace-body {
  flex: 1;
  min-height: 0;
}

.workspace-shell {
  display: flex;
  gap: 16px;
  height: 100%;
  min-height: 0;
}

.workspace-nav {
  flex-shrink: 0;
  width: 240px;
}

.workspace-nav :deep(.ant-card-body) {
  height: 100%;
  padding: 12px;
  overflow: hidden;
}

.workspace-menu {
  height: 100%;
  overflow-y: auto;
  border-inline-end: none;
}

.workspace-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 16px;
  overflow: hidden;
  background: linear-gradient(180deg, #fffdf8 0%, #fff 100%);
  border-radius: var(--radius);
}

.panel-placeholder {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  font-size: 14px;
  color: #64748b;
}

.panel-placeholder.danger {
  color: #dc2626;
}

.panel-empty {
  margin: auto 0;
}

.workspace-section {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.workspace-section > * {
  flex: 1;
  min-height: 0;
}

.workspace-overview {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.overview-stat :deep(.ant-card-body) {
  padding: 20px;
}

.overview-stat__label {
  font-size: 13px;
  color: #64748b;
}

.overview-stat__value {
  margin-top: 10px;
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
}

.overview-card {
  margin-top: 16px;
}

.overview-shortcuts {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.overview-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.overview-detail-grid label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: #64748b;
}

.overview-detail-grid p {
  margin: 0;
  font-size: 14px;
  color: #0f172a;
}

@media (max-width: 1200px) {
  .overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .workspace-header__main {
    flex-direction: column;
  }

  .workspace-header__actions {
    justify-content: flex-start;
  }

  .workspace-shell {
    flex-direction: column;
  }

  .workspace-nav {
    width: 100%;
  }

  .overview-grid,
  .overview-detail-grid {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
}
</style>
