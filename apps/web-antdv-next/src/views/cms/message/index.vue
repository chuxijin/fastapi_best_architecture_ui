<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CreateUserMessageParams, UserMessageResult } from '#/api';

import { computed, ref } from 'vue';

import { Page, useVbenDrawer, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button as AButton, message, Modal } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createUserMessageApi,
  deleteUserMessageApi,
  getUserMessageListApi,
  updateUserMessageApi,
} from '#/api';
import HaloEditorWrapper from '#/components/HaloEditor/HaloEditorWrapper.vue';

import { querySchema, schema, useColumns } from './data';

const formData = ref<Partial<UserMessageResult>>({});
const contentHtml = ref('');

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: { content: $t('common.form.query') },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<UserMessageResult> = {
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
        return await getUserMessageListApi({
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

function handleEdit(row: UserMessageResult) {
  drawerApi.setData(row).open();
}

function handleDelete(row: UserMessageResult) {
  Modal.confirm({
    title: '删除确认',
    content: `确认删除消息 [${row.title}] 吗?`,
    okType: 'danger',
    async onOk() {
      await deleteUserMessageApi(row.id);
      message.success($t('ui.actionMessage.deleteSuccess', [row.title]));
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
    ? $t('ui.actionTitle.edit', ['消息'])
    : $t('ui.actionTitle.create', ['消息']);
});

const [Drawer, drawerApi] = useVbenDrawer({
  destroyOnClose: true,
  class: 'w-[860px]',
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    drawerApi.lock();
    try {
      const values = await formApi.getValues<Partial<UserMessageResult>>();
      const payload: CreateUserMessageParams = {
        title: values.title as string,
        content: contentHtml.value || '',
        target_type: values.target_type ?? 'all',
        user_id: values.target_type === 'user' ? values.user_id : undefined,
        message_type: values.message_type ?? 'system',
        link_url: values.link_url || undefined,
        status: values.status ?? 1,
        publish_time: values.publish_time || undefined,
        expire_time: values.expire_time || undefined,
      };
      if (formData.value?.id) {
        await updateUserMessageApi(formData.value.id, payload);
      } else {
        await createUserMessageApi(payload);
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
    const data = drawerApi.getData<null | UserMessageResult>();
    formApi.resetForm();
    if (data) {
      formData.value = { ...data };
      formApi.setValues({
        ...data,
      });
      contentHtml.value = data.content || '';
    } else {
      formData.value = {};
      contentHtml.value = '';
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
          新增消息
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
      <div class="mt-4">
        <div class="mb-2 font-medium">消息内容(富文本)</div>
        <HaloEditorWrapper
          v-model="contentHtml"
          :height="420"
          placeholder="请输入消息内容..."
        />
      </div>
    </Drawer>
  </Page>
</template>
