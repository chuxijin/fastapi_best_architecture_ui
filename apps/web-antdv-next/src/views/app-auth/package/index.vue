<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { AppPackageResult, CreateAppPackageParams } from '#/api';

import { computed, onMounted, ref } from 'vue';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createAppPackageApi,
  deleteAppPackageApi,
  getApplicationOptions,
  getAppPackageListApi,
  updateAppPackageApi,
} from '#/api';

import { querySchema, schema, useColumns } from './data';

// 初始化应用选项
const initApplicationOptions = async () => {
  try {
    const response = await getApplicationOptions();
    const options = response.map((item: any) => ({
      label: item.name,
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

    // 更新查询和编辑 schema 的应用选项
    setFieldOptions(querySchema as any[], 'application_id', options);
    setFieldOptions(schema as any[], 'application_id', options);
  } catch (error) {
    console.error('加载应用选项失败:', error);
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

const gridOptions: VxeTableGridOptions<AppPackageResult> = {
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
        return await getAppPackageListApi({
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

function onActionClick({ code, row }: OnActionClickParams<AppPackageResult>) {
  switch (code) {
    case 'delete': {
      deleteAppPackageApi(row.id).then(() => {
        message.success({
          content: $t('ui.actionMessage.deleteSuccess', [row.name]),
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

interface FormAppPackageParams extends CreateAppPackageParams {
  id?: number;
}

const formData = ref<FormAppPackageParams>();

const modalTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['套餐'])
    : $t('ui.actionTitle.create', ['套餐']);
});

const [Modal, modalApi] = useVbenModal({
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      modalApi.lock();
      const data = await formApi.getValues<CreateAppPackageParams>();
      try {
        await (formData.value?.id
          ? updateAppPackageApi(formData.value?.id, data)
          : createAppPackageApi(data));
        await modalApi.close();
        onRefresh();
      } finally {
        modalApi.unlock();
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<FormAppPackageParams>();
      formApi.resetForm();
      if (data) {
        formData.value = data;
        formApi.setValues(data);
      }
    }
  },
});

onMounted(() => {
  initApplicationOptions();
});
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <VbenButton @click="() => modalApi.setData(null).open()">
          <MaterialSymbolsAdd class="size-5" />
          新增套餐
        </VbenButton>
      </template>
    </Grid>
    <Modal :title="modalTitle">
      <Form />
    </Modal>
  </Page>
</template>
