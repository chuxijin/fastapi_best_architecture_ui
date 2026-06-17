<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  VxeGridListeners,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { CreatePageParams, PageResult, UpdatePageParams } from '#/api';

import { computed, ref } from 'vue';

import { Page, useVbenDrawer, VbenButton } from '@vben/common-ui';
import { useAppConfig } from '@vben/hooks';
import { MaterialSymbolsAdd } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Button as AButton,
  Input as AInput,
  message,
  Modal,
} from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createPageApi,
  deletePageApi,
  getPageDetailApi,
  getPageListApi,
  updatePageApi,
} from '#/api';

import { querySchema, schema, useColumns } from './data';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

// 由 apiURL 推导公开访问根地址：去掉 /api 段取 origin，相对路径则用当前站点 origin
const publicBase = computed(() => {
  let origin = '';
  if (/^https?:\/\//.test(apiURL)) {
    const idx = apiURL.indexOf('/api');
    origin = idx === -1 ? apiURL : apiURL.slice(0, idx);
  } else {
    origin = window.location.origin;
  }
  return `${origin.replace(/\/$/, '')}/p/`;
});

function pageUrl(code: string) {
  return `${publicBase.value}${code}`;
}

const formData = ref<Partial<PageResult>>({});
const htmlContent = ref('');

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: { content: $t('common.form.query') },
  schema: querySchema,
};

const checkedRows = ref<PageResult[]>([]);

const gridOptions: VxeTableGridOptions<PageResult> = {
  rowConfig: { keyField: 'id' },
  checkboxConfig: { highlight: true },
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
        return await getPageListApi({
          page: page.currentPage,
          size: page.pageSize,
          ...formValues,
        });
      },
    },
  },
};

const gridEvents: VxeGridListeners<PageResult> = {
  checkboxChange() {
    checkedRows.value = gridApi.grid.getCheckboxRecords(true) as PageResult[];
  },
  checkboxAll() {
    checkedRows.value = gridApi.grid.getCheckboxRecords(true) as PageResult[];
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions,
  gridOptions,
  gridEvents,
});

function onRefresh() {
  gridApi.query();
}

async function handleEdit(row: PageResult) {
  const detail = await getPageDetailApi(row.id);
  drawerApi.setData(detail).open();
}

async function handleCopy(row: PageResult) {
  await navigator.clipboard.writeText(pageUrl(row.code));
  message.success('访问链接已复制');
}

function handlePreview(row: PageResult) {
  window.open(pageUrl(row.code), '_blank');
}

function handleDelete(row: PageResult) {
  Modal.confirm({
    title: '删除确认',
    content: `确认删除页面 [${row.title}] 吗?`,
    okType: 'danger',
    async onOk() {
      await deletePageApi(row.id);
      message.success($t('ui.actionMessage.deleteSuccess', [row.title]));
      onRefresh();
    },
  });
}

function handleBatchDelete() {
  if (checkedRows.value.length === 0) {
    message.warning('请先勾选要删除的页面');
    return;
  }
  Modal.confirm({
    title: '批量删除确认',
    content: `确认删除选中的 ${checkedRows.value.length} 个页面吗?`,
    okType: 'danger',
    async onOk() {
      await Promise.all(checkedRows.value.map((row) => deletePageApi(row.id)));
      message.success($t('ui.actionMessage.operationSuccess'));
      checkedRows.value = [];
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
    ? $t('ui.actionTitle.edit', ['页面'])
    : $t('ui.actionTitle.create', ['页面']);
});

const [Drawer, drawerApi] = useVbenDrawer({
  destroyOnClose: true,
  class: 'w-[920px]',
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    drawerApi.lock();
    try {
      const values = await formApi.getValues<Partial<PageResult>>();
      if (formData.value?.id) {
        const updatePayload: UpdatePageParams = {
          title: values.title,
          html_content: htmlContent.value || '',
          status: values.status ?? 1,
          remark: values.remark,
        };
        await updatePageApi(formData.value.id, updatePayload);
        message.success($t('ui.actionMessage.operationSuccess'));
      } else {
        const createPayload: CreatePageParams = {
          title: values.title as string,
          code: values.code || undefined,
          html_content: htmlContent.value || '',
          remark: values.remark,
        };
        const res = await createPageApi(createPayload);
        message.success(`创建成功，访问标识：${res.code}`);
      }
      drawerApi.close();
      onRefresh();
    } finally {
      drawerApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (!isOpen) return;
    const data = drawerApi.getData<null | PageResult>();
    formApi.resetForm();
    if (data) {
      formData.value = { ...data };
      formApi.setValues({ ...data });
      htmlContent.value = data.html_content || '';
    } else {
      formData.value = {};
      htmlContent.value = '';
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
          新增页面
        </VbenButton>
        <AButton
          class="ml-2"
          danger
          :disabled="checkedRows.length === 0"
          @click="handleBatchDelete"
        >
          批量删除
        </AButton>
      </template>
      <template #visit_default="{ row }">
        <div class="flex items-center gap-2">
          <span class="truncate text-xs text-gray-500">/p/{{ row.code }}</span>
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
      <div class="mt-4">
        <div class="mb-2 font-medium">HTML 内容</div>
        <div class="mb-2 text-xs text-gray-400">
          直接粘贴 HTML。完整文档（含
          &lt;html&gt;）原样渲染，片段会自动套用基础骨架。
        </div>
        <AInput.TextArea
          v-model:value="htmlContent"
          :rows="18"
          placeholder="在此粘贴 HTML 内容..."
          style="font-family: monospace"
        />
      </div>
    </Drawer>
  </Page>
</template>
