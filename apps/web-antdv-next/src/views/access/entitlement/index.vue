<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type {
  AccessEntitlementResult,
  CreateAccessEntitlementParams,
} from '#/api/access';

import { computed, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createAccessEntitlementApi,
  deleteAccessEntitlementApi,
  getAccessEntitlementListApi,
  updateAccessEntitlementApi,
} from '#/api/access';

import { querySchema, schema, useColumns } from './data';

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: { content: $t('common.search') },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<AccessEntitlementResult> = {
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
        return await getAccessEntitlementListApi({
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

interface FormParams extends CreateAccessEntitlementParams {
  id?: number;
}

const formData = ref<FormParams>();

const modalTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', ['权益'])
    : $t('ui.actionTitle.create', ['权益']),
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
      const values = await formApi.getValues<CreateAccessEntitlementParams>();
      const id = formData.value?.id;
      if (id) {
        await updateAccessEntitlementApi(id, values);
        message.success({
          content: $t('ui.actionMessage.editSuccess', [values.code]),
          key: 'action_process_msg',
        });
      } else {
        await createAccessEntitlementApi(values);
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

function onActionClick({
  code,
  row,
}: OnActionClickParams<AccessEntitlementResult>) {
  switch (code) {
    case 'delete': {
      deleteAccessEntitlementApi(row.id).then(() => {
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
        <a-button type="primary" @click="handleCreate">新建权益</a-button>
      </template>
    </Grid>
    <Modal>
      <Form />
    </Modal>
  </Page>
</template>
