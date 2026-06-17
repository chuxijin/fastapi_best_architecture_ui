<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';
import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type {
  CreateEndpointParam,
  UpdateEndpointParam,
  WebhookEndpoint,
} from '../api';

import { computed, ref } from 'vue';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd, MaterialSymbolsDelete } from '@vben/icons';
import { $t } from '@vben/locales';

import { message, Modal } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';

import {
  createEndpointApi,
  deleteEndpointsApi,
  getEndpointListApi,
  rotateSecretApi,
  testEndpointApi,
  updateEndpointApi,
} from '../api';

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: { content: $t('common.form.query') },
  schema: [
    { component: 'Input', fieldName: 'name', label: '端点名称' },
    {
      component: 'Select',
      fieldName: 'is_active',
      label: '状态',
      componentProps: {
        options: [
          { label: '全部', value: undefined },
          { label: '启用', value: true },
          { label: '禁用', value: false },
        ],
      },
    },
  ],
};

const gridOptions: VxeTableGridOptions<WebhookEndpoint> = {
  rowConfig: { keyField: 'id' },
  checkboxConfig: { highlight: true },
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
    pageSize: 10,
    pageSizes: [10, 20, 50, 100],
  },
  columns: [
    { type: 'checkbox', width: 50 },
    { field: 'uid', title: 'UID', width: 140 },
    { field: 'name', title: '名称', minWidth: 150 },
    {
      field: 'url',
      title: '目标 URL',
      minWidth: 250,
      formatter: ({ cellValue }: { cellValue: string }) => cellValue || '-',
    },
    {
      field: 'event_types',
      title: '订阅事件',
      width: 120,
      formatter: ({ cellValue }: { cellValue: string[] }) =>
        cellValue?.length ? `${cellValue.length} 个` : '-',
    },
    {
      field: 'is_active',
      title: '状态',
      width: 70,
      formatter: ({ cellValue }: { cellValue: boolean }) =>
        cellValue ? '启用' : '禁用',
    },
    {
      field: 'failure_count',
      title: '失败次数',
      width: 90,
      formatter: ({ cellValue }: { cellValue: number }) =>
        cellValue > 0 ? `${cellValue} 次` : '-',
    },
    { field: 'max_retries', title: '最大重试', width: 90 },
    { field: 'timeout_seconds', title: '超时(s)', width: 80 },
    { field: 'last_success_at', title: '最后成功', width: 150 },
    { field: 'last_failure_at', title: '最后失败', width: 150 },
    { field: 'created_time', title: '创建时间', width: 150 },
    { title: '操作', width: 320, slots: { default: 'action' } },
  ],
  proxyConfig: {
    ajax: {
      query: async ({ page }: any, formValues: any) => {
        const params = {
          ...formValues,
          page: page.currentPage,
          size: page.pageSize,
        };
        return await getEndpointListApi(params);
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

function onRefresh() {
  gridApi.query();
}

const currentEndpoint = ref<null | WebhookEndpoint>(null);

const endpointFormTitle = computed(() => {
  return currentEndpoint.value ? '编辑端点' : '新增端点';
});

const [EndpointForm, endpointFormApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  schema: [
    {
      component: 'Input',
      fieldName: 'name',
      label: '端点名称',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'url',
      label: '目标 URL',
      rules: 'required',
    },
    { component: 'Input', fieldName: 'description', label: '描述' },
    {
      component: 'Textarea',
      fieldName: 'event_types',
      label: '订阅事件类型 (JSON 数组)',
      rules: 'required',
      componentProps: {
        rows: 3,
        placeholder: '["com.fba.order.created", "com.fba.payment.*"]',
      },
    },
    {
      component: 'Textarea',
      fieldName: 'headers',
      label: '自定义请求头 (JSON)',
      componentProps: {
        rows: 3,
        placeholder: '{"X-Custom-Header": "value"}',
      },
    },
    {
      component: 'InputNumber',
      fieldName: 'max_retries',
      label: '最大重试次数',
      defaultValue: 5,
      componentProps: { min: 1, max: 10 },
    },
    {
      component: 'InputNumber',
      fieldName: 'timeout_seconds',
      label: '超时秒数',
      defaultValue: 30,
      componentProps: { min: 5, max: 120 },
    },
  ],
});

const [EndpointFormModal, endpointFormModalApi] = useVbenModal({
  class: 'w-3/5',
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await endpointFormApi.validate();
    if (!valid) return;

    endpointFormModalApi.lock();
    const data = await endpointFormApi.getValues();
    try {
      if (typeof data.event_types === 'string') {
        data.event_types = JSON.parse(data.event_types);
      }
      if (typeof data.headers === 'string' && data.headers) {
        data.headers = JSON.parse(data.headers);
      } else if (!data.headers) {
        data.headers = undefined;
      }

      if (currentEndpoint.value) {
        await updateEndpointApi(
          currentEndpoint.value.id,
          data as UpdateEndpointParam,
        );
        message.success('更新端点成功');
      } else {
        await createEndpointApi(data as CreateEndpointParam);
        message.success('创建端点成功');
      }

      endpointFormModalApi.close();
      onRefresh();
    } catch {
      message.error('操作失败');
    } finally {
      endpointFormModalApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      if (currentEndpoint.value) {
        endpointFormApi.setValues({
          ...currentEndpoint.value,
          event_types: JSON.stringify(
            currentEndpoint.value.event_types,
            null,
            2,
          ),
          headers: currentEndpoint.value.headers
            ? JSON.stringify(currentEndpoint.value.headers, null, 2)
            : '',
        });
      } else {
        endpointFormApi.resetForm();
      }
    } else {
      currentEndpoint.value = null;
    }
  },
});

const editEndpoint = (row: WebhookEndpoint) => {
  currentEndpoint.value = row;
  endpointFormModalApi.open();
};

const deleteEndpoint = async (row: WebhookEndpoint) => {
  try {
    await deleteEndpointsApi([row.id]);
    message.success('删除端点成功');
    onRefresh();
  } catch {
    message.error('删除失败');
  }
};

const batchDelete = async () => {
  const rows = gridApi.grid?.getCheckboxRecords();
  if (!rows?.length) {
    message.warning('请选择要删除的端点');
    return;
  }
  try {
    await deleteEndpointsApi(rows.map((r) => r.id));
    message.success('批量删除成功');
    onRefresh();
  } catch {
    message.error('批量删除失败');
  }
};

const handleRotateSecret = (row: WebhookEndpoint) => {
  Modal.confirm({
    title: '轮换密钥',
    content: `确定要轮换端点「${row.name}」的签名密钥吗？旧密钥将立即失效。`,
    onOk: async () => {
      const result = await rotateSecretApi(row.id);
      Modal.success({
        title: '密钥已轮换',
        content: `新密钥: ${result.new_secret}\n\n请妥善保存，关闭后无法再次查看。`,
        width: 500,
      });
    },
  });
};

const handleTestPush = async (row: WebhookEndpoint) => {
  message.loading({ content: '正在测试推送...', key: 'test' });
  try {
    const result = await testEndpointApi(row.id);
    if (result.success) {
      message.success({
        content: `测试成功 (HTTP ${result.status_code})`,
        key: 'test',
      });
    } else {
      message.error({ content: result.message, key: 'test' });
    }
  } catch {
    message.error({ content: '测试推送异常', key: 'test' });
  }
};
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <div class="flex gap-2">
          <VbenButton @click="() => endpointFormModalApi.open()">
            <MaterialSymbolsAdd class="size-5" />
            新增端点
          </VbenButton>
          <VbenButton variant="destructive" @click="batchDelete">
            <MaterialSymbolsDelete class="size-5" />
            批量删除
          </VbenButton>
        </div>
      </template>

      <template #action="{ row }">
        <div class="flex gap-1">
          <VbenButton size="sm" @click="editEndpoint(row)">编辑</VbenButton>
          <VbenButton size="sm" @click="handleTestPush(row)">测试</VbenButton>
          <VbenButton size="sm" @click="handleRotateSecret(row)">
            轮换密钥
          </VbenButton>
          <VbenButton
            size="sm"
            variant="destructive"
            @click="deleteEndpoint(row)"
          >
            删除
          </VbenButton>
        </div>
      </template>
    </Grid>

    <EndpointFormModal :title="endpointFormTitle">
      <EndpointForm />
    </EndpointFormModal>
  </Page>
</template>
