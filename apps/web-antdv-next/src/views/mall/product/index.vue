<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { CreateMallProductParams, MallProductResult } from '#/api';

import { computed, ref } from 'vue';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createMallProductApi,
  deleteMallProductApi,
  getMallProductListApi,
  updateMallProductApi,
} from '#/api/mall';

import { querySchema, schema, useColumns } from './data';

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: {
    content: $t('common.form.query'),
  },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<MallProductResult> = {
  rowConfig: {
    keyField: 'id',
  },
  checkboxConfig: {
    highlight: true,
  },
  height: 'auto',
  toolbarConfig: {
    refresh: true,
    refreshOptions: {
      code: 'query',
    },
    custom: true,
    zoom: true,
  },
  columns: useColumns(onActionClick),
  proxyConfig: {
    ajax: {
      query: async (_params, formValues) => {
        const list = await getMallProductListApi(formValues);
        return { result: list, page: { total: list.length } };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

function onRefresh() {
  gridApi.query();
}

function onActionClick({ code, row }: OnActionClickParams<MallProductResult>) {
  switch (code) {
    case 'delete': {
      deleteMallProductApi(row.id).then(() => {
        message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
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

interface FormProductParams extends CreateMallProductParams {
  id?: number;
}

const formData = ref<FormProductParams>();

const modalTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['商品'])
    : $t('ui.actionTitle.create', ['商品']);
});

const [Modal, modalApi] = useVbenModal({
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      modalApi.lock();
      const data = await formApi.getValues<CreateMallProductParams>();
      try {
        await (formData.value?.id
          ? updateMallProductApi(formData.value.id, data)
          : createMallProductApi(data));
        message.success($t('ui.actionMessage.operationSuccess'));
        await modalApi.close();
        onRefresh();
      } finally {
        modalApi.unlock();
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<FormProductParams>();
      formApi.resetForm();
      if (data) {
        formData.value = data;
        formApi.setValues(data);
      } else {
        formData.value = undefined;
      }
    }
  },
});
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <VbenButton @click="() => modalApi.setData(null).open()">
          <MaterialSymbolsAdd class="size-5" />
          新增商品
        </VbenButton>
      </template>
    </Grid>
    <Modal :title="modalTitle">
      <Form />
    </Modal>
  </Page>
</template>
