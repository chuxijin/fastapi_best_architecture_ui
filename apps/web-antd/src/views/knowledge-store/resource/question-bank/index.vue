<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { BankParams, BankResult } from '#/api';

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';

import { Image, message, TabPane, Tabs } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { createBankApi, getBankListApi, updateBankApi } from '#/api';
import {
  formSchema,
  querySchema,
  scopeMap,
  statusMap,
  useColumns,
} from '#/views/knowledge-store/resource/question-bank/data';

const router = useRouter();
const activeTab = ref('list');

const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  wrapperClass: 'grid-cols-4',
  submitButtonOptions: {
    content: '查询',
  },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<BankResult> = {
  rowConfig: {
    keyField: 'id',
    isHover: true,
    height: 120,
  },
  height: '100%',
  exportConfig: {},
  printConfig: {},
  toolbarConfig: {
    export: true,
    print: true,
    refresh: { code: 'query' },
    custom: true,
    zoom: true,
  },
  pagerConfig: {
    enabled: false,
  },
  treeConfig: {
    parentField: 'parent_id',
    children: 'children',
    trigger: 'default',
    expandAll: false,
  },
  columns: useColumns(onActionClick),
  proxyConfig: {
    ajax: {
      query: async (_, formValues) => {
        return await getBankListApi({
          cat_id: formValues?.cat_id,
          status: formValues?.status,
          keyword: formValues?.keyword,
        });
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

function onRefresh() {
  gridApi.query();
}

const expandAll = () => {
  gridApi.grid?.setAllTreeExpand(true);
};

const collapseAll = () => {
  gridApi.grid?.setAllTreeExpand(false);
};

function onActionClick({ code, row }: { code: string; row: BankResult }) {
  switch (code) {
    case 'activation-codes': {
      router.push({
        path: '/knowledge-store/resource/question-bank/operation',
        query: { bankId: row.id, bankName: row.name, tab: 'activation-codes' },
      });
      break;
    }
    case 'add': {
      // 增加子题库：设置父级题库ID和分类
      modalApi.setData({ parent_id: row.id, cat_id: row.cat_id }).open();
      break;
    }
    case 'card-records': {
      router.push({
        path: '/knowledge-store/resource/question-bank/operation',
        query: { bankId: row.id, bankName: row.name, tab: 'card-records' },
      });
      break;
    }
    case 'custom-popup': {
      router.push({
        path: '/knowledge-store/resource/question-bank/operation',
        query: { bankId: row.id, bankName: row.name, tab: 'custom-popup' },
      });
      break;
    }
    case 'daily-practice': {
      router.push({
        path: '/knowledge-store/resource/question-bank/operation',
        query: { bankId: row.id, bankName: row.name, tab: 'daily-practice' },
      });
      break;
    }
    case 'edit': {
      router.push({
        path: '/knowledge-store/resource/question-bank/edit',
        query: { id: row.id },
      });
      break;
    }
    case 'gift-management': {
      router.push({
        path: '/knowledge-store/resource/question-bank/operation',
        query: { bankId: row.id, bankName: row.name, tab: 'gift-management' },
      });
      break;
    }
    case 'group-guide': {
      router.push({
        path: '/knowledge-store/resource/question-bank/operation',
        query: { bankId: row.id, bankName: row.name, tab: 'group-guide' },
      });
      break;
    }
    case 'invitation-cards': {
      router.push({
        path: '/knowledge-store/resource/question-bank/operation',
        query: { bankId: row.id, bankName: row.name, tab: 'invitation-cards' },
      });
      break;
    }
    case 'members': {
      router.push({
        path: '/knowledge-store/resource/question-bank/operation',
        query: { bankId: row.id, bankName: row.name, tab: 'members' },
      });
      break;
    }
    case 'share': {
      message.info('分享功能开发中');
      break;
    }
    case 'text-analysis': {
      router.push({
        path: '/knowledge-store/resource/question-bank/operation',
        query: { bankId: row.id, bankName: row.name, tab: 'text-analysis' },
      });
      break;
    }
    case 'toggle': {
      const newStatus = row.status === 1 ? 0 : 1;
      const action = newStatus === 1 ? '上架' : '下架';
      updateBankApi(row.id, { ...row, status: newStatus }).then(() => {
        message.success(`${action}题库成功: ${row.name}`);
        onRefresh();
      });
      break;
    }
    case 'tools': {
      message.info('工具功能开发中');
      break;
    }
    case 'video-analysis': {
      router.push({
        path: '/knowledge-store/resource/question-bank/operation',
        query: { bankId: row.id, bankName: row.name, tab: 'video-analysis' },
      });
      break;
    }
  }
}

const [Form, formApi] = useVbenForm({
  wrapperClass: 'md:grid-cols-2',
  showDefaultActions: false,
  schema: formSchema,
});

const formData = ref<BankResult | null>(null);

const modalTitle = computed(() => {
  return formData.value?.id ? '编辑题库' : '添加题库';
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-5/12',
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      modalApi.lock();
      const data = await formApi.getValues<BankParams>();
      try {
        if (formData.value?.id) {
          await updateBankApi(formData.value.id, data);
          message.success(`编辑题库成功: ${data.name}`);
        } else {
          await createBankApi(data);
          message.success(`添加题库成功: ${data.name}`);
        }
        await modalApi.close();
        onRefresh();
      } finally {
        modalApi.unlock();
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<BankResult>();
      formApi.resetForm();
      if (data) {
        formData.value = data;
        formApi.setValues(data);
      } else {
        formData.value = null;
      }
    }
  },
});
</script>

<template>
  <Page auto-content-height>
    <Tabs v-model:active-key="activeTab" class="-mb-4">
      <TabPane key="list" tab="题库列表" />
      <TabPane key="recommend" tab="推荐题库" />
      <TabPane key="correction" tab="错题矫正" />
      <TabPane key="alias" tab="题型别名" />
      <TabPane key="settings" tab="题库设置" />
      <TabPane key="search" tab="题目搜索" />
    </Tabs>

    <Grid v-show="activeTab === 'list'" class="mt-0">
      <template #toolbar-actions>
        <VbenButton @click="() => modalApi.setData(null).open()">
          <MaterialSymbolsAdd class="size-5" />
          添加题库
        </VbenButton>
      </template>

      <template #toolbar-tools>
        <a-button class="mr-2" type="primary" @click="expandAll">
          展开全部
        </a-button>
        <a-button type="primary" @click="collapseAll">折叠全部</a-button>
      </template>

      <template #info_default="{ row }">
        <div class="flex items-start gap-3">
          <Image
            :src="row.cover_url || 'https://via.placeholder.com/160x90'"
            :width="160"
            :height="90"
            class="rounded"
            :preview="false"
          />
          <div class="flex-1">
            <div class="mb-1 font-semibold">{{ row.name }}</div>
            <div class="text-muted-foreground mb-1 text-sm">
              编码: {{ row.code }}
            </div>
            <div class="text-muted-foreground mb-1 text-sm">
              {{ row.desc || '暂无描述' }}
            </div>
            <div class="flex gap-4 text-sm">
              <span>题目数: {{ row.q_count }}</span>
              <span>总分: {{ row.total_score }}</span>
              <span>购买数: {{ row.buy_count }}</span>
              <span>范围: {{ scopeMap[row.scope] }}</span>
              <span
                :class="row.status === 1 ? 'text-green-600' : 'text-red-600'"
              >
                {{ statusMap[row.status].label }}
              </span>
            </div>
          </div>
        </div>
      </template>

      <template #detail_default>
        <div class="text-sm">
          <div class="mb-1">所属分类: 暂无</div>
          <div class="mb-1">题库时效: 永久</div>
          <div>子题库数: 0</div>
        </div>
      </template>

      <template #time_default="{ row }">
        <div class="text-sm">
          <div class="mb-1">创建: {{ row.created_time }}</div>
          <div v-if="row.updated_time">更新: {{ row.updated_time }}</div>
        </div>
      </template>
    </Grid>

    <div
      v-show="activeTab === 'recommend'"
      class="p-4 text-center text-gray-500"
    >
      推荐题库功能开发中...
    </div>

    <div
      v-show="activeTab === 'correction'"
      class="p-4 text-center text-gray-500"
    >
      错题矫正功能开发中...
    </div>

    <div v-show="activeTab === 'alias'" class="p-4 text-center text-gray-500">
      题型别名功能开发中...
    </div>

    <div
      v-show="activeTab === 'settings'"
      class="p-4 text-center text-gray-500"
    >
      题库设置功能开发中...
    </div>

    <div v-show="activeTab === 'search'" class="p-4 text-center text-gray-500">
      题目搜索功能开发中...
    </div>

    <Modal :title="modalTitle">
      <Form />
    </Modal>
  </Page>
</template>
