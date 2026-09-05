<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { GetQuestionListItem } from '#/api';

import { onMounted, ref } from 'vue';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';

import { useDebounceFn } from '@vueuse/core';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { qbankV2GetQuestionListApi } from '#/api';
import { qbankV2GetBankListApi } from '#/api/qbank-v2/bank';

import { querySchema, useColumns } from './data';
import QuestionDetailModal from './detail-modal.vue';
import QuestionFormModal from './form-modal.vue';

const bankLoading = ref(false);
const bankOptions = ref<{ label: string; value: number }[]>([]);

async function fetchBankOptions(keyword?: string) {
  bankLoading.value = true;
  try {
    const res: any = await qbankV2GetBankListApi({
      keyword: keyword?.trim() || undefined,
      size: 100,
    });
    const rawItems =
      res?.items || res?.data?.items || (Array.isArray(res) ? res : []);
    bankOptions.value = rawItems.map((b: any) => ({
      label: `[#${b.id}] ${b.name || b.code || '未命名题库'} (${b.code || b.id})`,
      value: b.id,
    }));
  } catch {
    bankOptions.value = [];
  } finally {
    bankLoading.value = false;
  }
}

const debouncedSearchBank = useDebounceFn((val: string) => {
  fetchBankOptions(val);
}, 300);

onMounted(() => {
  fetchBankOptions();
});

const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  wrapperClass: 'grid-cols-4',
  submitButtonOptions: { content: '查询' },
  schema: [
    {
      component: 'Select',
      fieldName: 'bank_id',
      label: '所属题库',
      componentProps: {
        allowClear: true,
        showSearch: true,
        filterOption: (input: string, option: any) =>
          (option?.label || '').toLowerCase().includes(input.toLowerCase()),
        loading: bankLoading,
        onSearch: (val: string) => debouncedSearchBank(val),
        placeholder: '输入名称/编码/ID搜索',
        options: bankOptions,
      },
    },
    ...querySchema.slice(1),
  ],
};

const gridOptions: VxeTableGridOptions<GetQuestionListItem> = {
  rowConfig: { keyField: 'id', isHover: true },
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
    enabled: true,
    currentPage: 1,
    pageSize: 20,
    pageSizes: [10, 20, 50, 100],
  },
  columns: useColumns(onActionClick),
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return qbankV2GetQuestionListApi({
          page: page.currentPage,
          size: page.pageSize,
          keyword: formValues?.keyword,
          question_type: formValues?.question_type,
          bank_id: formValues?.bank_id,
        });
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

function onRefresh() {
  gridApi.query();
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: GetQuestionListItem;
}) {
  switch (code) {
    case 'detail': {
      openDetailModal(row.id);
      break;
    }
    case 'edit': {
      openEditModal(row.id);
      break;
    }
  }
}

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: QuestionFormModal,
});

function openCreateModal() {
  formModalApi.setData({}).open();
}

function openEditModal(questionId: number) {
  formModalApi.setData({ id: questionId }).open();
}

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: QuestionDetailModal,
});

function openDetailModal(questionId: number) {
  detailModalApi.setData({ id: questionId }).open();
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <VbenButton @click="openCreateModal">
          <MaterialSymbolsAdd class="size-5" />
          新增题目
        </VbenButton>
      </template>
    </Grid>

    <FormModal @success="onRefresh" />
    <DetailModal />
  </Page>
</template>
