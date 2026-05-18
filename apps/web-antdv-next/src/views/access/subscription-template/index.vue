<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type {
  CreateSubscriptionTemplateParams,
  SubscriptionTemplateResult,
} from '#/api/access';

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createSubscriptionTemplateApi,
  deleteSubscriptionTemplateApi,
  getSubscriptionTemplateListApi,
  updateSubscriptionTemplateApi,
} from '#/api/access';

import { querySchema, schema, useColumns } from './data';

const router = useRouter();

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: { content: $t('common.search') },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<SubscriptionTemplateResult> = {
  rowConfig: { keyField: 'id' },
  checkboxConfig: { highlight: true },
  height: 'auto',
  exportConfig: {},
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
        return await getSubscriptionTemplateListApi({
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

interface FormParams extends CreateSubscriptionTemplateParams {
  id?: number;
}

const formData = ref<FormParams>();

const modalTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', ['订阅模板'])
    : $t('ui.actionTitle.create', ['订阅模板']),
);

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  schema,
});

const [Modal, modalApi] = useVbenModal({
  title: modalTitle.value,
  fullscreenButton: false,
  onConfirm: async () => {
    try {
      const values =
        await formApi.getValues<CreateSubscriptionTemplateParams>();
      const id = formData.value?.id;
      if (id) {
        await updateSubscriptionTemplateApi(id, values);
        message.success({
          content: $t('ui.actionMessage.editSuccess', [values.code]),
          key: 'action_process_msg',
        });
      } else {
        await createSubscriptionTemplateApi(values);
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
}: OnActionClickParams<SubscriptionTemplateResult>) {
  switch (code) {
    case 'delete': {
      deleteSubscriptionTemplateApi(row.id).then(() => {
        message.success({
          content: $t('ui.actionMessage.deleteSuccess', [row.code]),
          key: 'action_process_msg',
        });
        onRefresh();
      });
      break;
    }
    case 'detail': {
      router.push(`/access/subscription-template/${row.id}`);
      break;
    }
    case 'edit': {
      modalApi.setData(row as any).open();
      break;
    }
    case 'genCode': {
      router.push({
        path: '/app-auth/redeem-code',
        query: { template_code: row.code, reward_type: 'subscription' },
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
        <a-button type="primary" @click="handleCreate">新建订阅模板</a-button>
      </template>
    </Grid>
    <Modal>
      <Form />
    </Modal>
  </Page>
</template>
