<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  CreateLinksDomainParams,
  LinksDomainResult,
  UpdateLinksDomainParams,
} from '#/api';

import { computed, ref } from 'vue';

import { Page, useVbenDrawer, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button as AButton, message, Modal } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createLinksDomainApi,
  deleteLinksDomainApi,
  getLinksDomainListApi,
  updateLinksDomainApi,
} from '#/api';

import { querySchema, schema, useColumns } from './data';

const formData = ref<Partial<LinksDomainResult>>({});

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: { content: $t('common.form.query') },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<LinksDomainResult> = {
  rowConfig: { keyField: 'id' },
  height: 'auto',
  toolbarConfig: {
    refresh: true,
    refreshOptions: { code: 'query' },
    custom: true,
    zoom: true,
  },
  columns: useColumns(),
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return await getLinksDomainListApi({
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

function handleEdit(row: LinksDomainResult) {
  drawerApi.setData(row).open();
}

function handleDelete(row: LinksDomainResult) {
  Modal.confirm({
    title: '删除确认',
    content: `确认删除域名 [${row.domain}] 吗?`,
    okType: 'danger',
    async onOk() {
      await deleteLinksDomainApi(row.id);
      message.success($t('ui.actionMessage.deleteSuccess', [row.domain]));
      onRefresh();
    },
  });
}

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  schema,
});

const drawerTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['域名'])
    : $t('ui.actionTitle.create', ['域名']);
});

const [Drawer, drawerApi] = useVbenDrawer({
  destroyOnClose: true,
  class: 'w-[640px]',
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    drawerApi.lock();
    try {
      const values = await formApi.getValues<Partial<LinksDomainResult>>();
      if (formData.value?.id) {
        const payload: UpdateLinksDomainParams = {
          domain: values.domain,
          domain_type: values.domain_type,
          remark: values.remark,
        };
        await updateLinksDomainApi(formData.value.id, payload);
      } else {
        const payload: CreateLinksDomainParams = {
          domain: values.domain as string,
          domain_type: values.domain_type as 1 | 2 | 3,
          remark: values.remark,
        };
        await createLinksDomainApi(payload);
      }
      message.success($t('ui.actionMessage.operationSuccess'));
      drawerApi.close();
      onRefresh();
    } finally {
      drawerApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (!isOpen) return;
    const data = drawerApi.getData<LinksDomainResult | null>();
    formApi.resetForm();
    if (data) {
      formData.value = { ...data };
      formApi.setValues({ ...data });
    } else {
      formData.value = {};
    }
  },
});
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <VbenButton @click="() => drawerApi.setData(null).open()">
          <MaterialSymbolsAdd class="size-5" />
          新增域名
        </VbenButton>
      </template>
      <template #operation_default="{ row }">
        <div class="flex justify-center gap-2">
          <AButton size="small" type="primary" @click="handleEdit(row)">
            编辑
          </AButton>
          <AButton size="small" danger @click="handleDelete(row)">
            删除
          </AButton>
        </div>
      </template>
    </Grid>
    <Drawer :title="drawerTitle">
      <Form />
    </Drawer>
  </Page>
</template>
