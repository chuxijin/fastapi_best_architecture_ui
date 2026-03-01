<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { AppOrderResult, CreateAppOrderParams } from '#/api';

import { computed, onMounted, ref } from 'vue';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createAppOrderApi,
  deleteAppOrderApi,
  getAppOrderListApi,
  getDeviceList,
  getPackageList,
  updateAppOrderApi,
} from '#/api';

import { querySchema, schema, useColumns } from './data';

// 初始化选项数据
const initSelectOptions = async () => {
  try {
    const [packageRes, deviceRes] = await Promise.all([
      getPackageList({ page: 1, size: 100 }),
      getDeviceList({ page: 1, size: 100 }),
    ]);

    const packageOptions = packageRes.items.map((item: any) => ({
      label: `${item.name} - ¥${item.current_price}`,
      value: item.id,
    }));

    const deviceOptions = deviceRes.items.map((item: any) => ({
      label: `${item.device_name || item.device_id} (${item.ip_address || 'N/A'})`,
      value: item.id,
    }));

    // 安全设置 schema 字段的 options（兼容 object/function）
    const setFieldOptions = (
      fields: any[],
      fieldName: string,
      opts: Array<{ label: string; value: number }>,
    ) => {
      const field = fields.find((i: any) => i.fieldName === fieldName);
      if (!field) return;
      const cp = field.componentProps;
      if (typeof cp === 'function') {
        const original = cp;
        field.componentProps = (value: any, actions: any) => {
          const base = (original as any)(value, actions) || {};
          return { ...base, options: opts } as any;
        };
      } else {
        field.componentProps = { ...(cp as any), options: opts } as any;
      }
    };

    setFieldOptions(schema as any[], 'package_id', packageOptions);
    setFieldOptions(schema as any[], 'device_id', deviceOptions);
  } catch (error) {
    console.error('加载选项数据失败:', error);
  }
};

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: {
    content: $t('common.search'),
  },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<AppOrderResult> = {
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
  columns: useColumns(onActionClick),
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return await getAppOrderListApi({
          page: page.currentPage,
          size: page.pageSize,
          ...formValues,
        });
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

function onRefresh() {
  gridApi.query();
}

function onActionClick({ code, row }: OnActionClickParams<AppOrderResult>) {
  switch (code) {
    case 'delete': {
      deleteAppOrderApi(row.id).then(() => {
        message.success({
          content: $t('ui.actionMessage.deleteSuccess', [row.order_no]),
          key: 'action_process_msg',
        });
        onRefresh();
      });
      break;
    }
    case 'edit': {
      modalApi.setData(row).open();
      break;
    }
  }
}

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  schema,
});

interface FormAppOrderParams extends CreateAppOrderParams {
  id?: number;
}

const formData = ref<FormAppOrderParams>();

const modalTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['订单'])
    : $t('ui.actionTitle.create', ['订单']);
});

const [Modal, modalApi] = useVbenModal({
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      modalApi.lock();
      const data = await formApi.getValues<CreateAppOrderParams>();
      try {
        await (formData.value?.id
          ? updateAppOrderApi(formData.value?.id, data)
          : createAppOrderApi(data));
        await modalApi.close();
        onRefresh();
      } finally {
        modalApi.unlock();
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<FormAppOrderParams>();
      formApi.resetForm();
      if (data) {
        formData.value = data;
        formApi.setValues(data);
      }
    }
  },
});

onMounted(() => {
  initSelectOptions();
});
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <VbenButton @click="() => modalApi.setData(null).open()">
          <MaterialSymbolsAdd class="size-5" />
          新增订单
        </VbenButton>
      </template>
    </Grid>
    <Modal :title="modalTitle">
      <Form />
    </Modal>
  </Page>
</template>
