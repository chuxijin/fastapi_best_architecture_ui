<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { AccessPackResult, CreateAccessPackParams } from '#/api/access';

import { computed, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createAccessPackApi,
  deleteAccessPackApi,
  getAccessPackListApi,
  updateAccessPackApi,
} from '#/api/access';

import { querySchema, schema, useColumns } from './data';

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: { content: $t('common.search') },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<AccessPackResult> = {
  rowConfig: { keyField: 'id' },
  checkboxConfig: { highlight: true },
  height: 'auto',
  toolbarConfig: {
    export: true,
    refresh: { code: 'query' },
    custom: true,
    zoom: true,
  },
  columns: useColumns(onActionClick),
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return await getAccessPackListApi({
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

interface FormParams extends CreateAccessPackParams {
  id?: number;
}

const formData = ref<FormParams>();

const modalTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', ['Pack'])
    : $t('ui.actionTitle.create', ['Pack']),
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
      const values = await formApi.getValues<CreateAccessPackParams>();
      const id = formData.value?.id;
      if (id) {
        await updateAccessPackApi(id, values);
        message.success({
          content: $t('ui.actionMessage.editSuccess', [values.code]),
          key: 'action_process_msg',
        });
      } else {
        await createAccessPackApi(values);
        message.success({
          content: $t('ui.actionMessage.createSuccess', [values.code]),
          key: 'action_process_msg',
        });
      }
      modalApi.close();
      onRefresh();
    } catch (error) {
      console.error(error);
    }
  },
  onOpenChange: async (isOpen: boolean) => {
    if (isOpen) {
      const data = modalApi.getData<FormParams | undefined>();
      formData.value = data;
      formApi.resetForm();
      if (data) {
        formApi.setValues(data);
      }
    }
  },
});

function onActionClick({ code, row }: OnActionClickParams<AccessPackResult>) {
  switch (code) {
    case 'delete': {
      deleteAccessPackApi(row.id).then(() => {
        message.success({
          content: $t('ui.actionMessage.deleteSuccess', [row.code]),
          key: 'action_process_msg',
        });
        onRefresh();
      });
      break;
    }
    case 'edit': {
      modalApi.setData(row as any).open();
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
        <a-button type="primary" @click="handleCreate">新建 Pack</a-button>
      </template>
    </Grid>
    <Modal>
      <Form />
    </Modal>
  </Page>
</template>
