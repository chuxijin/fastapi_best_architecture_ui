<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';
import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { WebhookDelivery } from '../api';

import { h } from 'vue';

import { Page, VbenButton } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

import {
  getDeliveryListApi,
  processPendingApi,
  retryDeliveryApi,
} from '../api';

const statusMap: Record<number, { color: string; text: string }> = {
  0: { color: 'default', text: '待投递' },
  1: { color: 'green', text: '成功' },
  2: { color: 'red', text: '失败' },
  3: { color: 'orange', text: '重试中' },
};

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: { content: $t('common.form.query') },
  schema: [
    { component: 'Input', fieldName: 'event_type', label: '事件类型' },
    {
      component: 'Select',
      fieldName: 'status',
      label: '投递状态',
      componentProps: {
        options: [
          { label: '全部', value: undefined },
          { label: '待投递', value: 0 },
          { label: '成功', value: 1 },
          { label: '失败', value: 2 },
          { label: '重试中', value: 3 },
        ],
      },
    },
  ],
};

const gridOptions: VxeTableGridOptions<WebhookDelivery> = {
  rowConfig: { keyField: 'id' },
  height: 'auto',
  autoResize: true,
  columnConfig: { resizable: true },
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
    pageSize: 20,
    pageSizes: [10, 20, 50, 100],
  },
  columns: [
    { field: 'uid', title: 'UID', width: 140 },
    { field: 'event_type', title: '事件类型', minWidth: 180 },
    { field: 'event_id', title: '事件 ID', width: 180 },
    {
      field: 'status',
      title: '状态',
      width: 90,
      slots: {
        default: ({ row }: any) => {
          const s = statusMap[row.status] || { color: 'default', text: '未知' };
          return h(Tag, { color: s.color }, () => s.text);
        },
      },
    },
    {
      field: 'response_code',
      title: 'HTTP 码',
      width: 90,
      formatter: ({ cellValue }: { cellValue: null | number }) =>
        cellValue ? String(cellValue) : '-',
    },
    { field: 'attempt_count', title: '尝试次数', width: 90 },
    { field: 'next_retry_at', title: '下次重试', width: 150 },
    { field: 'completed_at', title: '完成时间', width: 150 },
    { field: 'created_time', title: '创建时间', width: 150 },
    {
      title: '操作',
      width: 120,
      slots: {
        default: ({ row }: any) => {
          return h('div', { class: 'flex gap-1' }, [
            row.status === 2 || row.status === 3
              ? h(
                  VbenButton,
                  {
                    size: 'sm',
                    onClick: () => handleRetry(row),
                  },
                  () => '重试',
                )
              : null,
          ]);
        },
      },
    },
  ],
  proxyConfig: {
    ajax: {
      query: async ({ page }: any, formValues: any) => {
        const params = {
          ...formValues,
          page: page.currentPage,
          size: page.pageSize,
        };
        return await getDeliveryListApi(params);
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

function onRefresh() {
  gridApi.query();
}

const handleRetry = async (row: WebhookDelivery) => {
  try {
    await retryDeliveryApi(row.id);
    message.success('已重置为待投递状态');
    onRefresh();
  } catch {
    message.error('重试失败');
  }
};

const handleProcessPending = async () => {
  message.loading({ content: '正在处理...', key: 'process' });
  try {
    const result = await processPendingApi(50);
    message.success({ content: result.message, key: 'process' });
    onRefresh();
  } catch {
    message.error({ content: '处理失败', key: 'process' });
  }
};
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <VbenButton @click="handleProcessPending">处理待投递</VbenButton>
      </template>
    </Grid>
  </Page>
</template>
