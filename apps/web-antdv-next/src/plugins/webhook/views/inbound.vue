<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { WebhookEventLog } from '../api';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';

import { h, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { Tag, Tooltip } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

import { getEventLogListApi } from '../api';

const statusMap: Record<number, { color: string; text: string }> = {
  0: { color: 'blue', text: '已接收' },
  1: { color: 'green', text: '已处理' },
  2: { color: 'red', text: '处理失败' },
};

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: { content: $t('common.form.query') },
  schema: [
    { component: 'Input', fieldName: 'source', label: '事件来源' },
    { component: 'Input', fieldName: 'event_type', label: '事件类型' },
    {
      component: 'Select',
      fieldName: 'status',
      label: '状态',
      componentProps: {
        options: [
          { label: '全部', value: undefined },
          { label: '已接收', value: 0 },
          { label: '已处理', value: 1 },
          { label: '处理失败', value: 2 },
        ],
      },
    },
  ],
};

const currentPayload = ref('');
const currentEventId = ref('');

const [PayloadModal, payloadModalApi] = useVbenModal({
  title: '请求体详情',
  class: 'w-3/5',
  destroyOnClose: true,
  onConfirm() {
    payloadModalApi.close();
  },
});

function onActionClick({ code, row }: OnActionClickParams<WebhookEventLog>) {
  if (code === 'view') {
    currentEventId.value = row.event_id || row.uid;
    try {
      currentPayload.value = JSON.stringify(JSON.parse(row.payload), null, 2);
    } catch {
      currentPayload.value = row.payload;
    }
    payloadModalApi.open();
  }
}

const gridOptions: VxeTableGridOptions<WebhookEventLog> = {
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
    { field: 'source', title: '来源', width: 120 },
    { field: 'event_type', title: '事件类型', minWidth: 200 },
    { field: 'event_id', title: '事件 ID', width: 180 },
    {
      field: 'signature_valid',
      title: '签名',
      width: 80,
      slots: {
        default: ({ row }: any) => {
          return h(
            Tag,
            { color: row.signature_valid ? 'green' : 'default' },
            () => (row.signature_valid ? '已验证' : '未验证'),
          );
        },
      },
    },
    {
      field: 'status',
      title: '状态',
      width: 100,
      slots: {
        default: ({ row }: any) => {
          const s = statusMap[row.status] || { color: 'default', text: '未知' };
          return h(Tag, { color: s.color }, () => s.text);
        },
      },
    },
    {
      field: 'error_message',
      title: '错误信息',
      width: 180,
      slots: {
        default: ({ row }: any) => {
          if (!row.error_message)
            return h('span', { class: 'text-gray-400' }, '-');
          return h(Tooltip, { title: row.error_message }, () =>
            h(
              'div',
              {
                style: {
                  maxWidth: '160px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: '#ff4d4f',
                },
              },
              row.error_message,
            ),
          );
        },
      },
    },
    { field: 'source_ip', title: '来源 IP', width: 130 },
    { field: 'processed_at', title: '处理时间', width: 150 },
    { field: 'created_time', title: '创建时间', width: 150 },
    {
      field: 'operation',
      title: $t('common.table.operation'),
      align: 'center',
      fixed: 'right',
      width: 100,
      cellRender: {
        attrs: {
          nameField: 'uid',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'view',
            text: '查看',
          },
        ],
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
        return await getEventLogListApi(params);
      },
    },
  },
};

const [Grid] = useVbenVxeGrid({ formOptions, gridOptions });
</script>

<template>
  <Page auto-content-height>
    <Grid />
    <PayloadModal>
      <div style="margin-bottom: 8px; color: #888">
        事件 ID: {{ currentEventId }}
      </div>
      <pre
        style="
          max-height: 60vh;
          padding: 12px;
          overflow: auto;
          font-size: 13px;
          line-height: 1.5;
          word-break: break-all;
          white-space: pre-wrap;
          background: #f5f5f5;
          border-radius: 6px;
        "
        >{{ currentPayload }}</pre
      >
    </PayloadModal>
  </Page>
</template>
