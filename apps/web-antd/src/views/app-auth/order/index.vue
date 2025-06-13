<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';
import type { OnActionClickParams, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AppOrderResult, CreateAppOrderParams } from '#/api';

import { computed, ref, onMounted } from 'vue';

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
  updateAppOrderApi,
  getPackageList,
  getDeviceList,
} from '#/api';

import { querySchema, schema, useColumns } from './data';

// 初始化选项数据
const initSelectOptions = async () => {
  try {
    const [packageRes, deviceRes] = await Promise.all([
      getPackageList({ page: 1, size: 100 }),
      getDeviceList({ page: 1, size: 100 })
    ]);

    const packageOptions = packageRes.items.map((item: any) => ({
      label: `${item.name} - ¥${item.current_price}`,
      value: item.id,
    }));

    const deviceOptions = deviceRes.items.map((item: any) => ({
      label: `${item.device_name || item.device_id} (${item.ip_address || 'N/A'})`,
      value: item.id,
    }));

    // 更新编辑表单的套餐选项
    const schemaPackageField = schema.find(item => item.fieldName === 'package_id');
    if (schemaPackageField && schemaPackageField.componentProps) {
      schemaPackageField.componentProps.options = packageOptions;
    }

    // 更新编辑表单的设备选项
    const schemaDeviceField = schema.find(item => item.fieldName === 'device_id');
    if (schemaDeviceField && schemaDeviceField.componentProps) {
      schemaDeviceField.componentProps.options = deviceOptions;
    }
  } catch (error) {
    console.error('加载选项数据失败:', error);
  }
};

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: {
    content: $t('page.form.query'),
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
  width: 800,
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
