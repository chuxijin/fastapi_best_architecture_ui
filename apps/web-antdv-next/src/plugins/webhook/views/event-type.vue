<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';
import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type {
  CreateEventTypeParam,
  UpdateEventTypeParam,
  WebhookEventType,
} from '../api';

import { computed, ref } from 'vue';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd, MaterialSymbolsDelete } from '@vben/icons';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';

import {
  createEventTypeApi,
  deleteEventTypesApi,
  getEventTypeListApi,
  updateEventTypeApi,
} from '../api';

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: { content: $t('common.form.query') },
  schema: [
    { component: 'Input', fieldName: 'category', label: '分类' },
    {
      component: 'Select',
      fieldName: 'is_active',
      label: '状态',
      componentProps: {
        options: [
          { label: '全部', value: undefined },
          { label: '启用', value: true },
          { label: '禁用', value: false },
        ],
      },
    },
  ],
};

const gridOptions: VxeTableGridOptions<WebhookEventType> = {
  rowConfig: { keyField: 'id' },
  checkboxConfig: { highlight: true },
  height: 'auto',
  autoResize: true,
  columnConfig: { resizable: true },
  exportConfig: {},
  printConfig: {},
  toolbarConfig: {
    export: true,
    print: true,
    refresh: { code: 'query' },
    custom: true,
    zoom: true,
  },
  pagerConfig: {
    enabled: true,
    pageSize: 20,
    pageSizes: [10, 20, 50, 100],
  },
  columns: [
    { type: 'checkbox', width: 50 },
    { field: 'type_key', title: '事件类型标识', minWidth: 250 },
    { field: 'category', title: '分类', width: 120 },
    { field: 'description', title: '描述', minWidth: 200 },
    {
      field: 'is_active',
      title: '状态',
      width: 70,
      formatter: ({ cellValue }: { cellValue: boolean }) =>
        cellValue ? '启用' : '禁用',
    },
    { field: 'created_time', title: '创建时间', width: 150 },
    { title: '操作', width: 160, slots: { default: 'action' } },
  ],
  proxyConfig: {
    ajax: {
      query: async ({ page }: any, formValues: any) => {
        const params = {
          ...formValues,
          page: page.currentPage,
          size: page.pageSize,
        };
        return await getEventTypeListApi(params);
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

function onRefresh() {
  gridApi.query();
}

const currentEventType = ref<null | WebhookEventType>(null);

const formTitle = computed(() => {
  return currentEventType.value ? '编辑事件类型' : '新增事件类型';
});

const [EventTypeForm, eventTypeFormApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  schema: [
    {
      component: 'Input',
      fieldName: 'type_key',
      label: '事件类型标识',
      rules: 'required',
      componentProps: { placeholder: 'com.fba.order.created' },
    },
    {
      component: 'Input',
      fieldName: 'category',
      label: '分类',
      rules: 'required',
      componentProps: { placeholder: 'order / payment / user / system' },
    },
    { component: 'Input', fieldName: 'description', label: '描述' },
    {
      component: 'Switch',
      fieldName: 'is_active',
      label: '是否启用',
      defaultValue: true,
    },
  ],
});

const [EventTypeFormModal, eventTypeFormModalApi] = useVbenModal({
  class: 'w-2/5',
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await eventTypeFormApi.validate();
    if (!valid) return;

    eventTypeFormModalApi.lock();
    const data = await eventTypeFormApi.getValues();
    try {
      if (currentEventType.value) {
        await updateEventTypeApi(
          currentEventType.value.id,
          data as UpdateEventTypeParam,
        );
        message.success('更新成功');
      } else {
        await createEventTypeApi(data as CreateEventTypeParam);
        message.success('创建成功');
      }
      eventTypeFormModalApi.close();
      onRefresh();
    } catch {
      message.error('操作失败');
    } finally {
      eventTypeFormModalApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      if (currentEventType.value) {
        eventTypeFormApi.setValues({ ...currentEventType.value });
      } else {
        eventTypeFormApi.resetForm();
      }
    } else {
      currentEventType.value = null;
    }
  },
});

const editEventType = (row: WebhookEventType) => {
  currentEventType.value = row;
  eventTypeFormModalApi.open();
};

const deleteEventType = async (row: WebhookEventType) => {
  try {
    await deleteEventTypesApi([row.id]);
    message.success('删除成功');
    onRefresh();
  } catch {
    message.error('删除失败');
  }
};

const batchDelete = async () => {
  const rows = gridApi.grid?.getCheckboxRecords();
  if (!rows?.length) {
    message.warning('请选择要删除的事件类型');
    return;
  }
  try {
    await deleteEventTypesApi(rows.map((r) => r.id));
    message.success('批量删除成功');
    onRefresh();
  } catch {
    message.error('批量删除失败');
  }
};
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <div class="flex gap-2">
          <VbenButton @click="() => eventTypeFormModalApi.open()">
            <MaterialSymbolsAdd class="size-5" />
            新增事件类型
          </VbenButton>
          <VbenButton variant="destructive" @click="batchDelete">
            <MaterialSymbolsDelete class="size-5" />
            批量删除
          </VbenButton>
        </div>
      </template>

      <template #action="{ row }">
        <div class="flex gap-1">
          <VbenButton size="sm" @click="editEventType(row)">编辑</VbenButton>
          <VbenButton
            size="sm"
            variant="destructive"
            @click="deleteEventType(row)"
          >
            删除
          </VbenButton>
        </div>
      </template>
    </Grid>

    <EventTypeFormModal :title="formTitle">
      <EventTypeForm />
    </EventTypeFormModal>
  </Page>
</template>
