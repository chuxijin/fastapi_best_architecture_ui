<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <div class="flex gap-2">
          <VbenButton @click="() => testModalApi.open()">
            <SendIcon class="size-5" />
            测试 Webhook
          </VbenButton>
          <VbenButton @click="retryFailed">
            <RefreshIcon class="size-5" />
            重试失败事件
          </VbenButton>
          <VbenButton @click="batchDelete" variant="destructive">
            <MaterialSymbolsDelete class="size-5" />
            批量删除
          </VbenButton>
        </div>
      </template>
    </Grid>

    <!-- 测试 Webhook 模态框 -->
    <TestModal title="测试 Webhook 事件">
      <TestForm />
    </TestModal>

    <!-- 查看详情模态框 -->
    <ViewModal title="Webhook 事件详情">
      <ViewForm />
    </ViewModal>


  </Page>
</template>

<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';
import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { OnActionClickParams } from '#/adapter/vxe-table';
import type { WebhookEvent, WebhookReceiveParam } from '../api';

import { computed, ref } from 'vue';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd, MaterialSymbolsDelete, createIconifyIcon } from '@vben/icons';

// 创建图标组件
const SendIcon = createIconifyIcon('material-symbols:send-outline');
const RefreshIcon = createIconifyIcon('material-symbols:refresh-rounded');
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getWebhookListApi,
  deleteWebhookApi,
  retryFailedWebhooksApi,
  sendTestWebhookApi,
} from '../api';

import { querySchema, testSchema, useColumns } from './data';

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: {
    content: $t('common.form.query'),
  },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<WebhookEvent> = {
  rowConfig: {
    keyField: 'id',
  },
  checkboxConfig: {
    highlight: true,
  },
  height: 'auto',
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
    pageSize: 10,
    pageSizes: [10, 20, 50, 100],
  },
  resizeConfig: {
    refreshDelay: 250,
  },
  scrollX: {
    enabled: true,
  },
  scrollY: {
    enabled: true,
  },
  columnConfig: {
    resizable: true,
    isCurrent: true,
    isHover: true,
  },
  columns: useColumns(onActionClick),
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        const params = {
          ...formValues,
          page: page.currentPage,
          size: page.pageSize,
        };
        return await getWebhookListApi(params);
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

function onRefresh() {
  gridApi.query();
}

function onActionClick({ code, row }: OnActionClickParams<WebhookEvent>) {
  switch (code) {
    case 'delete': {
      deleteWebhookApi([row.id]).then(() => {
        message.success({
          content: $t('ui.actionMessage.deleteSuccess', [row.event_type]),
          key: 'action_process_msg',
        });
        onRefresh();
      });
      break;
    }
    case 'view': {
      viewModalApi.setData(row).open();
      break;
    }
    case 'retry': {
      // 重试单个webhook事件
      retryFailedWebhooksApi().then(() => {
        message.success('重试操作完成');
        onRefresh();
      }).catch(() => {
        message.error('重试操作失败');
      });
      break;
    }
  }
}

// 测试表单
const [TestForm, testFormApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  schema: testSchema,
});

const [TestModal, testModalApi] = useVbenModal({
  class: 'w-3/5',
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await testFormApi.validate();
    if (valid) {
      testModalApi.lock();
      const data = await testFormApi.getValues<WebhookReceiveParam>();
      try {
        // 尝试解析JSON数据
        if (typeof data.data === 'string') {
          try {
            data.data = JSON.parse(data.data);
          } catch {
            // 如果解析失败，保持原字符串
          }
        }
        await sendTestWebhookApi(data);
        message.success('测试Webhook发送成功');
        await testModalApi.close();
        onRefresh();
      } catch (error) {
        message.error('测试Webhook发送失败');
      } finally {
        testModalApi.unlock();
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      testFormApi.resetForm();
    }
  },
});

// 查看详情表单
const [ViewForm, viewFormApi] = useVbenForm({
  layout: 'vertical',
  wrapperClass: 'grid-cols-1 md:grid-cols-3',
  showDefaultActions: false,
  schema: [
    // 第一行：ID、事件类型、来源
    {
      component: 'Input',
      fieldName: 'id',
      label: 'ID',
      componentProps: {
        readonly: true,
      },
    },
    {
      component: 'Input',
      fieldName: 'event_type',
      label: '事件类型',
      componentProps: {
        readonly: true,
      },
    },
    {
      component: 'Input',
      fieldName: 'source',
      label: '事件来源',
      componentProps: {
        readonly: true,
      },
    },
    // 第二行：处理状态、重试次数、处理时间
    {
      component: 'Select',
      fieldName: 'status',
      label: '处理状态',
      componentProps: {
        disabled: true,
        options: [
          { label: '失败', value: 0 },
          { label: '成功', value: 1 },
          { label: '待处理', value: 2 },
        ],
      },
    },
    {
      component: 'InputNumber',
      fieldName: 'retry_count',
      label: '重试次数',
      componentProps: {
        readonly: true,
      },
    },
    {
      component: 'Input',
      fieldName: 'processed_at',
      label: '处理时间',
      componentProps: {
        readonly: true,
      },
    },
    // 第三行：错误信息（单独一行）
    {
      component: 'Input',
      fieldName: 'error_message',
      label: '错误信息',
      formItemClass: 'col-span-3',
      componentProps: {
        readonly: true,
      },
    },
    // 第四行：请求头（高度调高）
    {
      component: 'Textarea',
      fieldName: 'headers',
      label: '请求头',
      formItemClass: 'col-span-3',
      componentProps: {
        readonly: true,
        rows: 8,
      },
    },
    // 第五行：事件数据（高度调低）
    {
      component: 'Textarea',
      fieldName: 'payload',
      label: '事件数据',
      formItemClass: 'col-span-3',
      componentProps: {
        readonly: true,
        rows: 4,
      },
    },
  ],
});

const [ViewModal, viewModalApi] = useVbenModal({
  class: 'w-1/2 webhook-detail-modal',
  destroyOnClose: true,
  footer: false,
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = viewModalApi.getData<WebhookEvent>();
      if (data) {
        viewFormApi.setValues({
          ...data,
          headers: JSON.stringify(data.headers, null, 2),
        });
      }
    }
  },
});

// 批量删除选中的记录
const batchDelete = async () => {
  const selectedRows = gridApi.grid?.getCheckboxRecords();
  if (!selectedRows || selectedRows.length === 0) {
    message.warning('请选择要删除的记录');
    return;
  }

  const ids = selectedRows.map(row => row.id);
  try {
    await deleteWebhookApi(ids);
    message.success('批量删除成功');
    onRefresh();
  } catch (error) {
    message.error('批量删除失败');
  }
};

// 重试失败的webhook
const retryFailed = async () => {
  try {
    await retryFailedWebhooksApi();
    message.success('重试操作完成');
    onRefresh();
  } catch (error) {
    message.error('重试操作失败');
  }
};


</script>

<style scoped>
.webhook-management {
  padding: 16px;
}

.mb-4 {
  margin-bottom: 16px;
}

.mb-2 {
  margin-bottom: 8px;
}

.ml-2 {
  margin-left: 8px;
}

.mt-4 {
  margin-top: 16px;
}

pre {
  background: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  max-height: 200px;
  overflow-y: auto;
}

/* 详情模态框基础样式 */
:deep(.webhook-detail-modal) {
  .ant-modal-body {
    padding: 20px !important;
  }
}

/* 额外的通用样式确保布局生效 */
:deep(.webhook-detail-modal) {
  .ant-modal-body {
    padding: 20px !important;
  }

  .ant-form-item {
    margin-bottom: 16px !important;
  }

  .ant-form-item-label {
    font-weight: 500 !important;
  }

  /* 针对文本域的特殊处理 */
  .ant-input[readonly] {
    background-color: #f5f5f5 !important;
    cursor: default !important;
  }

  textarea.ant-input[readonly] {
    resize: vertical !important;
  }
}
</style>
