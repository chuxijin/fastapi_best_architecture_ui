<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type {
  CreateMemoryDeckParams,
  MemoryDeckResult,
} from '#/api/memory-card';

import { computed, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createMemoryDeckApi,
  deleteMemoryDeckApi,
  getMemoryDeckApi,
  getMemoryDeckListApi,
  updateMemoryDeckApi,
} from '#/api/memory-card';

import { querySchema, schema, useColumns } from './data';

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<MemoryDeckResult> = {
  rowConfig: { keyField: 'id' },
  height: 'auto',
  toolbarConfig: {
    refresh: { code: 'query' },
    zoom: true,
  },
  columns: useColumns(onActionClick),
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return await getMemoryDeckListApi({
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

interface FormParams extends CreateMemoryDeckParams {
  id?: number;
}

const formData = ref<FormParams>();

const modalTitle = computed(() =>
  formData.value?.id ? '编辑卡组' : '创建卡组',
);

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  schema,
});

const [Modal, modalApi] = useVbenModal({
  title: modalTitle.value,
  onConfirm: async () => {
    try {
      const values = await formApi.getValues<CreateMemoryDeckParams>();
      const id = formData.value?.id;
      if (id) {
        await updateMemoryDeckApi(id, values);
        message.success('更新成功');
      } else {
        await createMemoryDeckApi(values);
        message.success('创建成功');
      }
      modalApi.close();
      onRefresh();
    } catch (error) {
      console.error(error);
    }
  },
  onOpenChange: async (isOpen: boolean) => {
    if (isOpen) {
      const data = modalApi.getData<FormParams>();
      formData.value = data;
      formApi.resetForm();
      if (data) {
        formApi.setValues(data);
      }
    }
  },
});

function onActionClick({ code, row }: OnActionClickParams<MemoryDeckResult>) {
  switch (code) {
    case 'delete': {
      deleteMemoryDeckApi(row.id).then(() => {
        message.success('删除成功');
        onRefresh();
      });
      break;
    }
    case 'edit': {
      getMemoryDeckApi(row.id).then((data) => {
        modalApi.setData(data).open();
      });
      break;
    }
  }
}

function handleCreate() {
  modalApi.setData(undefined).open();
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <a-button type="primary" @click="handleCreate">新建卡组</a-button>
      </template>
    </Grid>
    <Modal>
      <Form />
    </Modal>
  </Page>
</template>
