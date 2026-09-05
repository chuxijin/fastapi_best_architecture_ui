<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type { OnActionClickParams, VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  CreateMembershipTierParams,
  MembershipTierResult,
  UpdateMembershipTierParams,
} from '#/api/access';

import { computed, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createMembershipTierApi,
  deleteMembershipTierApi,
  getMembershipTierListApi,
  updateMembershipTierApi,
} from '#/api/access';

import { querySchema, schema, useColumns } from './data';

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: { content: $t('common.form.query') },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<MembershipTierResult> = {
  rowConfig: { keyField: 'id' },
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
      query: async ({ page }, formValues) =>
        getMembershipTierListApi({
          page: page.currentPage,
          size: page.pageSize,
          ...formValues,
        }),
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });
const formData = ref<MembershipTierResult>();
const modalTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', ['会员档位'])
    : $t('ui.actionTitle.create', ['会员档位']),
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
      const values = await formApi.getValues<
        CreateMembershipTierParams & UpdateMembershipTierParams
      >();
      if (formData.value?.id) {
        await updateMembershipTierApi(formData.value.id, values);
        message.success('会员档位更新成功');
      } else {
        await createMembershipTierApi(values);
        message.success('会员档位创建成功');
      }
      modalApi.close();
      gridApi.query();
    } catch (error) {
      console.error(error);
    }
  },
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    const data = modalApi.getData<MembershipTierResult>();
    formData.value = data;
    formApi.resetForm();
    if (data) formApi.setValues(data);
  },
});

function onActionClick({ code, row }: OnActionClickParams<MembershipTierResult>) {
  if (code === 'edit') {
    modalApi.setData(row).open();
    return;
  }
  if (code === 'delete') {
    deleteMembershipTierApi(row.id).then(() => {
      message.success('会员档位删除成功');
      gridApi.query();
    });
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
        <a-button type="primary" @click="handleCreate">新建会员档位</a-button>
      </template>
    </Grid>
    <Modal><Form /></Modal>
  </Page>
</template>

