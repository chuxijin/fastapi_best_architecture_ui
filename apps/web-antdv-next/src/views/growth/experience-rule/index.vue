<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type {
  CreateExperienceRuleParams,
  ExperienceRuleResult,
} from '#/api/growth';

import { computed, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createExperienceRuleApi,
  deleteExperienceRuleApi,
  getExperienceRuleListApi,
  updateExperienceRuleApi,
} from '#/api/growth';

import { querySchema, schema, useColumns } from './data';

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: { content: $t('common.search') },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<ExperienceRuleResult> = {
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
        return await getExperienceRuleListApi({
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

interface FormParams extends CreateExperienceRuleParams {
  id?: number;
}

const formData = ref<FormParams>();

const modalTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', ['经验规则'])
    : $t('ui.actionTitle.create', ['经验规则']),
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
      const values = await formApi.getValues<CreateExperienceRuleParams>();
      const id = formData.value?.id;
      if (id) {
        await updateExperienceRuleApi(id, values);
        message.success({
          content: $t('ui.actionMessage.editSuccess', [values.rule_code]),
          key: 'action_process_msg',
        });
      } else {
        await createExperienceRuleApi(values);
        message.success({
          content: $t('ui.actionMessage.createSuccess', [values.rule_code]),
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
}: OnActionClickParams<ExperienceRuleResult>) {
  switch (code) {
    case 'delete': {
      deleteExperienceRuleApi(row.id).then(() => {
        message.success({
          content: $t('ui.actionMessage.deleteSuccess', [row.rule_code]),
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
        <a-button type="primary" @click="handleCreate">新建规则</a-button>
      </template>
    </Grid>
    <Modal>
      <Form />
    </Modal>
  </Page>
</template>
