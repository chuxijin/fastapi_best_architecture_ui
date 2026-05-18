<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type {
  AccessDomainResult,
  CreateAccessDomainParams,
} from '#/api/access';

import { computed, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createAccessDomainApi,
  deleteAccessDomainApi,
  getAccessDomainListApi,
  updateAccessDomainApi,
} from '#/api/access';

import { querySchema, schema, useColumns } from './data';

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: { content: $t('common.search') },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<AccessDomainResult> = {
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
        return await getAccessDomainListApi({
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

interface FormParams extends CreateAccessDomainParams {
  id?: number;
}

const formData = ref<FormParams>();

const modalTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', ['领域'])
    : $t('ui.actionTitle.create', ['领域']),
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
      const values = await formApi.getValues<CreateAccessDomainParams>();
      const id = formData.value?.id;
      if (id) {
        await updateAccessDomainApi(id, values);
        message.success({
          content: $t('ui.actionMessage.editSuccess', [values.code]),
          key: 'action_process_msg',
        });
      } else {
        await createAccessDomainApi(values);
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

function onActionClick({ code, row }: OnActionClickParams<AccessDomainResult>) {
  switch (code) {
    case 'delete': {
      deleteAccessDomainApi(row.id).then(() => {
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
        <a-button type="primary" @click="handleCreate">新建领域</a-button>
      </template>
    </Grid>
    <Modal>
      <Form />
    </Modal>
  </Page>
</template>
