<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  CreateLinksDwzParams,
  LinksDwzResult,
  UpdateLinksDwzParams,
} from '#/api';

import { computed, ref } from 'vue';

import { Page, useVbenDrawer, VbenButton } from '@vben/common-ui';
import { useAppConfig } from '@vben/hooks';
import { MaterialSymbolsAdd } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button as AButton, message, Modal } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createLinksDwzApi,
  deleteLinksDwzApi,
  getLinksDwzListApi,
  updateLinksDwzApi,
} from '#/api';

import { querySchema, schema, useColumns } from './data';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

const publicBase = computed(() => {
  let origin = '';
  if (/^https?:\/\//.test(apiURL)) {
    const idx = apiURL.indexOf('/api');
    origin = idx === -1 ? apiURL : apiURL.slice(0, idx);
  } else {
    origin = window.location.origin;
  }
  return `${origin.replace(/\/$/, '')}/c/`;
});

function dwzUrl(code: string) {
  return `${publicBase.value}${code}`;
}

const formData = ref<Partial<LinksDwzResult>>({});

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: { content: $t('common.form.query') },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<LinksDwzResult> = {
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
        return await getLinksDwzListApi({
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

function handleEdit(row: LinksDwzResult) {
  drawerApi.setData(row).open();
}

async function handleCopy(row: LinksDwzResult) {
  await navigator.clipboard.writeText(dwzUrl(row.code));
  message.success('短链已复制');
}

function handlePreview(row: LinksDwzResult) {
  window.open(dwzUrl(row.code), '_blank');
}

function handleDelete(row: LinksDwzResult) {
  Modal.confirm({
    title: '删除确认',
    content: `确认删除短网址 [${row.title || row.code}] 吗?`,
    okType: 'danger',
    async onOk() {
      await deleteLinksDwzApi(row.id);
      message.success(
        $t('ui.actionMessage.deleteSuccess', [row.title || row.code]),
      );
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
    ? $t('ui.actionTitle.edit', ['短网址'])
    : $t('ui.actionTitle.create', ['短网址']);
});

const [Drawer, drawerApi] = useVbenDrawer({
  destroyOnClose: true,
  class: 'w-[720px]',
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    drawerApi.lock();
    try {
      const values = await formApi.getValues<Partial<LinksDwzResult>>();
      if (formData.value?.id) {
        const payload: UpdateLinksDwzParams = {
          original_url: values.original_url,
          title: values.title,
          status: values.status ?? 1,
          entry_domain: values.entry_domain,
          redirect_domain: values.redirect_domain,
          landing_domain: values.landing_domain,
          remark: values.remark,
        };
        await updateLinksDwzApi(formData.value.id, payload);
        message.success($t('ui.actionMessage.operationSuccess'));
      } else {
        const payload: CreateLinksDwzParams = {
          original_url: values.original_url as string,
          title: values.title,
          code: values.code || undefined,
          entry_domain: values.entry_domain,
          redirect_domain: values.redirect_domain,
          landing_domain: values.landing_domain,
          remark: values.remark,
        };
        const res = await createLinksDwzApi(payload);
        message.success(`创建成功，短码：${res.code}`);
      }
      drawerApi.close();
      onRefresh();
    } finally {
      drawerApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (!isOpen) return;
    const data = drawerApi.getData<LinksDwzResult | null>();
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
          新增短网址
        </VbenButton>
      </template>
      <template #visit_default="{ row }">
        <div class="flex items-center gap-2">
          <span class="truncate text-xs text-gray-500">/c/{{ row.code }}</span>
          <AButton size="small" type="link" @click="handleCopy(row)">
            复制
          </AButton>
          <AButton size="small" type="link" @click="handlePreview(row)">
            预览
          </AButton>
        </div>
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
