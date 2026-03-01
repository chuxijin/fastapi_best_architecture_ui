<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';
import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type {
  CreateWebhookConfigParam,
  UpdateWebhookConfigParam,
  WebhookConfig,
} from '../api';

import { computed, ref } from 'vue';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd, MaterialSymbolsDelete } from '@vben/icons';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';

import {
  createWebhookConfigApi,
  deleteWebhookConfigsApi,
  getWebhookConfigListApi,
  updateWebhookConfigApi,
  updateWebhookConfigStatusApi,
} from '../api';

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: {
    content: $t('common.form.query'),
  },
  schema: [
    {
      component: 'Input',
      fieldName: 'name',
      label: '配置名称',
    },
    {
      component: 'Input',
      fieldName: 'endpoint_url',
      label: '端点URL',
    },
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

const gridOptions: VxeTableGridOptions<WebhookConfig> = {
  rowConfig: {
    keyField: 'id',
  },
  checkboxConfig: {
    highlight: true,
  },
  height: 'auto',
  autoResize: true,
  columnConfig: {
    resizable: true,
  },
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
    { field: 'id', title: 'ID', width: 60 },
    { field: 'name', title: '配置名称', minWidth: 150 },
    { field: 'endpoint_url', title: '端点URL', minWidth: 250 },
    {
      field: 'secret_key',
      title: '密钥',
      width: 100,
      formatter: ({ cellValue }: { cellValue: null | string }) =>
        cellValue ? '***已设置***' : '未设置',
    },
    {
      field: 'required_headers',
      title: '请求头',
      width: 80,
      formatter: ({ cellValue }: { cellValue: null | Record<string, any> }) =>
        cellValue && Object.keys(cellValue).length > 0
          ? `${Object.keys(cellValue).length}个`
          : '无',
    },
    {
      field: 'allowed_event_types',
      title: '事件类型',
      width: 100,
      formatter: ({ cellValue }: { cellValue: null | string[] }) =>
        cellValue && cellValue.length > 0
          ? `${cellValue.length}个类型`
          : '无限制',
    },
    {
      field: 'is_active',
      title: '状态',
      width: 70,
      formatter: ({ cellValue }: { cellValue: boolean }) =>
        cellValue ? '启用' : '禁用',
    },
    { field: 'created_time', title: '创建时间', width: 150 },
    { field: 'updated_time', title: '更新时间', width: 150 },
    {
      title: '操作',
      width: 200,
      slots: { default: 'action' },
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
        return await getWebhookConfigListApi(params);
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions,
  gridOptions: {
    ...gridOptions,
    columns: [
      ...(gridOptions.columns || []).slice(0, -1),
      {
        title: '操作',
        width: 200,
        slots: { default: 'action' },
      },
    ],
  },
});

function onRefresh() {
  gridApi.query();
}

// 保留操作函数（当前通过 slots 触发，不直接用回调）

// 当前编辑的配置
const currentConfig = ref<null | WebhookConfig>(null);

// 表单标题
const configFormTitle = computed(() => {
  return currentConfig.value ? '编辑配置' : '新增配置';
});

// 配置表单
const [ConfigForm, configFormApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  schema: [
    {
      component: 'Input',
      fieldName: 'name',
      label: '配置名称',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'endpoint_url',
      label: '端点URL',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'secret_key',
      label: '密钥',
    },
    {
      component: 'Textarea',
      fieldName: 'required_headers',
      label: '必需的请求头 (JSON格式)',
      componentProps: {
        rows: 4,
        placeholder: '{"X-API-Key": "your-api-key"}',
      },
    },
    {
      component: 'Textarea',
      fieldName: 'allowed_event_types',
      label: '允许的事件类型 (JSON数组格式)',
      componentProps: {
        rows: 3,
        placeholder: '["user.created", "user.updated"]',
      },
    },
    {
      component: 'Switch',
      fieldName: 'is_active',
      label: '是否启用',
      defaultValue: true,
    },
  ],
});

const [ConfigFormModal, configFormModalApi] = useVbenModal({
  class: 'w-3/5',
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await configFormApi.validate();
    if (valid) {
      configFormModalApi.lock();
      const data = await configFormApi.getValues();
      try {
        // 处理JSON字段
        if (
          data.required_headers &&
          typeof data.required_headers === 'string'
        ) {
          try {
            data.required_headers = JSON.parse(data.required_headers);
          } catch {
            data.required_headers = {};
          }
        }
        if (
          data.allowed_event_types &&
          typeof data.allowed_event_types === 'string'
        ) {
          try {
            data.allowed_event_types = JSON.parse(data.allowed_event_types);
          } catch {
            data.allowed_event_types = [];
          }
        }

        if (currentConfig.value) {
          // 更新
          await updateWebhookConfigApi(
            currentConfig.value.id,
            data as UpdateWebhookConfigParam,
          );
          message.success('更新配置成功');
        } else {
          // 创建
          await createWebhookConfigApi(data as CreateWebhookConfigParam);
          message.success('创建配置成功');
        }

        await configFormModalApi.close();
        onRefresh();
      } catch {
        message.error('操作失败');
      } finally {
        configFormModalApi.unlock();
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      if (currentConfig.value) {
        // 编辑模式，填充表单
        configFormApi.setValues({
          ...currentConfig.value,
          required_headers: currentConfig.value.required_headers
            ? JSON.stringify(currentConfig.value.required_headers, null, 2)
            : '',
          allowed_event_types: currentConfig.value.allowed_event_types
            ? JSON.stringify(currentConfig.value.allowed_event_types, null, 2)
            : '',
        });
      } else {
        // 新增模式，重置表单
        configFormApi.resetForm();
      }
    } else {
      currentConfig.value = null;
    }
  },
});

// 编辑配置
const editConfig = (config: WebhookConfig) => {
  currentConfig.value = config;
  configFormModalApi.open();
};

// 删除配置
const deleteConfig = async (config: WebhookConfig) => {
  try {
    await deleteWebhookConfigsApi([config.id]);
    message.success('删除配置成功');
    onRefresh();
  } catch {
    message.error('删除配置失败');
  }
};

// 切换配置状态
const toggleConfigStatus = async (config: WebhookConfig) => {
  try {
    await updateWebhookConfigStatusApi(config.id, !config.is_active);
    message.success(`${config.is_active ? '禁用' : '启用'}配置成功`);
    onRefresh();
  } catch {
    message.error('更新配置状态失败');
  }
};

// 批量删除配置
const batchDeleteConfigs = async () => {
  const selectedRows = gridApi.grid?.getCheckboxRecords();
  if (!selectedRows || selectedRows.length === 0) {
    message.warning('请选择要删除的配置');
    return;
  }

  const ids = selectedRows.map((row) => row.id);
  try {
    await deleteWebhookConfigsApi(ids);
    message.success('批量删除成功');
    onRefresh();
  } catch {
    message.error('批量删除失败');
  }
};
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <div class="flex gap-2">
          <VbenButton @click="() => configFormModalApi.open()">
            <MaterialSymbolsAdd class="size-5" />
            新增配置
          </VbenButton>
          <VbenButton @click="batchDeleteConfigs" variant="destructive">
            <MaterialSymbolsDelete class="size-5" />
            批量删除
          </VbenButton>
        </div>
      </template>

      <template #action="{ row }">
        <div class="flex gap-1">
          <VbenButton @click="editConfig(row)">编辑</VbenButton>
          <VbenButton
            :variant="row.is_active ? 'destructive' : 'default'"
            @click="toggleConfigStatus(row)"
          >
            {{ row.is_active ? '禁用' : '启用' }}
          </VbenButton>
          <VbenButton variant="destructive" @click="deleteConfig(row)">
            删除
          </VbenButton>
        </div>
      </template>
    </Grid>

    <!-- 配置表单模态框 -->
    <ConfigFormModal :title="configFormTitle">
      <ConfigForm />
    </ConfigFormModal>
  </Page>
</template>

<style scoped>
.webhook-config-management {
  padding: 16px;
}

.mb-4 {
  margin-bottom: 16px;
}

.flex {
  display: flex;
}

.gap-2 {
  gap: 8px;
}
</style>
