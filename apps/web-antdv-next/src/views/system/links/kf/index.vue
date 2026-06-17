<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  CreateLinksKfItemParams,
  CreateLinksKfParams,
  LinksKfItemResult,
  LinksKfResult,
  UpdateLinksKfItemParams,
  UpdateLinksKfParams,
} from '#/api';

import { computed, ref } from 'vue';

import { Page, useVbenDrawer, useVbenModal, VbenButton } from '@vben/common-ui';
import { useAppConfig } from '@vben/hooks';
import { MaterialSymbolsAdd } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button as AButton, message, Modal } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createLinksKfApi,
  createLinksKfItemApi,
  deleteLinksKfApi,
  deleteLinksKfItemApi,
  getLinksKfItemsApi,
  getLinksKfListApi,
  updateLinksKfApi,
  updateLinksKfItemApi,
} from '#/api';

import {
  itemSchema,
  querySchema,
  schema,
  useColumns,
  useItemColumns,
} from './data';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

const publicBase = computed(() => {
  let origin = '';
  if (/^https?:\/\//.test(apiURL)) {
    const idx = apiURL.indexOf('/api');
    origin = idx === -1 ? apiURL : apiURL.slice(0, idx);
  } else {
    origin = window.location.origin;
  }
  return `${origin.replace(/\/$/, '')}/k/`;
});

function kfUrl(code: string) {
  return `${publicBase.value}${code}`;
}

const formData = ref<Partial<LinksKfResult>>({});
const items = ref<LinksKfItemResult[]>([]);
const itemFormData = ref<Partial<LinksKfItemResult>>({});

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: { content: $t('common.form.query') },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<LinksKfResult> = {
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
        return await getLinksKfListApi({
          page: page.currentPage,
          size: page.pageSize,
          ...formValues,
        });
      },
    },
  },
};

const itemGridOptions: VxeTableGridOptions<LinksKfItemResult> = {
  rowConfig: { keyField: 'id' },
  showOverflow: true,
  border: true,
  columns: useItemColumns(),
  data: [],
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

function onRefresh() {
  gridApi.query();
}

function handleEdit(row: LinksKfResult) {
  drawerApi.setData(row).open();
}

async function handleCopy(row: LinksKfResult) {
  await navigator.clipboard.writeText(kfUrl(row.code));
  message.success('客服码链接已复制');
}

function handlePreview(row: LinksKfResult) {
  window.open(kfUrl(row.code), '_blank');
}

function handleDelete(row: LinksKfResult) {
  Modal.confirm({
    title: '删除确认',
    content: `确认删除客服码 [${row.title}] 吗?子项也会被一并删除。`,
    okType: 'danger',
    async onOk() {
      await deleteLinksKfApi(row.id);
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
    ? $t('ui.actionTitle.edit', ['客服码'])
    : $t('ui.actionTitle.create', ['客服码']);
});

async function refreshItems(kfId: number) {
  items.value = await getLinksKfItemsApi(kfId);
}

const [Drawer, drawerApi] = useVbenDrawer({
  destroyOnClose: true,
  class: 'w-[920px]',
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    drawerApi.lock();
    try {
      const values = await formApi.getValues<Partial<LinksKfResult>>();
      if (formData.value?.id) {
        const payload: UpdateLinksKfParams = {
          title: values.title,
          status: values.status ?? 1,
          online: values.online,
          entry_domain: values.entry_domain,
          redirect_domain: values.redirect_domain,
          landing_domain: values.landing_domain,
          remark: values.remark,
        };
        await updateLinksKfApi(formData.value.id, payload);
        message.success($t('ui.actionMessage.operationSuccess'));
        drawerApi.close();
        onRefresh();
      } else {
        const payload: CreateLinksKfParams = {
          title: values.title as string,
          code: values.code || undefined,
          online: values.online,
          entry_domain: values.entry_domain,
          redirect_domain: values.redirect_domain,
          landing_domain: values.landing_domain,
          remark: values.remark,
        };
        const res = await createLinksKfApi(payload);
        message.success(
          `创建成功，客服码：${res.code}。可继续添加客服二维码。`,
        );
        formData.value = { ...res };
        items.value = [];
        onRefresh();
      }
    } finally {
      drawerApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const data = drawerApi.getData<LinksKfResult | null>();
    formApi.resetForm();
    if (data) {
      formData.value = { ...data };
      formApi.setValues({ ...data });
      await refreshItems(data.id);
    } else {
      formData.value = {};
      items.value = [];
    }
  },
});

const [ItemForm, itemFormApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  schema: itemSchema,
});

const itemModalTitle = computed(() => {
  return itemFormData.value?.id ? '编辑客服二维码' : '添加客服二维码';
});

const [ItemModal, itemModalApi] = useVbenModal({
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await itemFormApi.validate();
    if (!valid) return;
    if (!formData.value?.id) {
      message.warning('请先保存客服码');
      return;
    }
    itemModalApi.lock();
    try {
      const values = await itemFormApi.getValues<Partial<LinksKfItemResult>>();
      if (itemFormData.value?.id) {
        const payload: UpdateLinksKfItemParams = {
          qrcode: values.qrcode,
          leader: values.leader,
          limit: values.limit,
          status: values.status,
        };
        await updateLinksKfItemApi(itemFormData.value.id, payload);
      } else {
        const payload: CreateLinksKfItemParams = {
          kf_id: formData.value.id,
          qrcode: values.qrcode as string,
          leader: values.leader,
          limit: values.limit ?? 200,
        };
        await createLinksKfItemApi(payload);
      }
      message.success($t('ui.actionMessage.operationSuccess'));
      itemModalApi.close();
      await refreshItems(formData.value.id);
    } finally {
      itemModalApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (!isOpen) return;
    const data = itemModalApi.getData<LinksKfItemResult | null>();
    itemFormApi.resetForm();
    if (data) {
      itemFormData.value = { ...data };
      itemFormApi.setValues({ ...data });
    } else {
      itemFormData.value = {};
    }
  },
});

function handleAddItem() {
  itemModalApi.setData(null).open();
}

function handleEditItem(item: LinksKfItemResult) {
  itemModalApi.setData(item).open();
}

function handleDeleteItem(item: LinksKfItemResult) {
  Modal.confirm({
    title: '删除确认',
    content: `确认删除该客服二维码 [${item.leader || '#' + item.id}]?`,
    okType: 'danger',
    async onOk() {
      await deleteLinksKfItemApi(item.id);
      message.success('删除成功');
      if (formData.value?.id) await refreshItems(formData.value.id);
    },
  });
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <VbenButton @click="() => drawerApi.setData(null).open()">
          <MaterialSymbolsAdd class="size-5" />
          新增客服码
        </VbenButton>
      </template>
      <template #visit_default="{ row }">
        <div class="flex items-center gap-2">
          <span class="truncate text-xs text-gray-500">/k/{{ row.code }}</span>
          <AButton size="small" type="link" @click="handleCopy(row)"
            >复制</AButton
          >
          <AButton size="small" type="link" @click="handlePreview(row)"
            >预览</AButton
          >
        </div>
      </template>
      <template #operation_default="{ row }">
        <div class="flex justify-center gap-2">
          <AButton size="small" type="primary" @click="handleEdit(row)"
            >编辑</AButton
          >
          <AButton size="small" danger @click="handleDelete(row)">删除</AButton>
        </div>
      </template>
    </Grid>

    <Drawer :title="drawerTitle">
      <Form />
      <div class="mt-6">
        <div class="mb-2 flex items-center justify-between">
          <span class="font-medium">客服二维码列表</span>
          <AButton
            v-if="formData.id"
            size="small"
            type="primary"
            @click="handleAddItem"
          >
            添加客服
          </AButton>
        </div>
        <div v-if="!formData.id" class="text-xs text-gray-400">
          先保存客服码，保存后可继续添加客服二维码
        </div>
        <div v-else>
          <vxe-grid v-bind="itemGridOptions" :data="items" auto-resize>
            <template #item_op_default="{ row }">
              <AButton size="small" type="link" @click="handleEditItem(row)"
                >编辑</AButton
              >
              <AButton
                size="small"
                type="link"
                danger
                @click="handleDeleteItem(row)"
                >删除</AButton
              >
            </template>
          </vxe-grid>
        </div>
      </div>
    </Drawer>

    <ItemModal :title="itemModalTitle" class="w-[560px]">
      <ItemForm />
    </ItemModal>
  </Page>
</template>
