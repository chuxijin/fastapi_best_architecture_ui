<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  CmsSlotResult,
  CreateCmsSlotParams,
  UpdateCmsSlotParams,
} from '#/api';

import { computed, ref } from 'vue';

import { Page, useVbenDrawer, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button as AButton, message, Modal } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createCmsSlotApi,
  deleteCmsSlotApi,
  getCmsSlotListApi,
  updateCmsSlotApi,
} from '#/api';
import HaloEditorWrapper from '#/components/HaloEditor/HaloEditorWrapper.vue';

import { querySchema, schema, useColumns } from './data';
import StatsModal from './StatsModal.vue';

interface FormSlotData extends Partial<CreateCmsSlotParams> {
  id?: number;
  jump_extra_text?: string;
  target_extra_text?: string;
  extra_text?: string;
}

const formData = ref<FormSlotData>({});
const detailHtml = ref('');
const statsModalRef = ref<InstanceType<typeof StatsModal>>();

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: { content: $t('common.form.query') },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<CmsSlotResult> = {
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
        return await getCmsSlotListApi({
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

function handleEdit(row: CmsSlotResult) {
  drawerApi.setData(row).open();
}

function handleStats(row: CmsSlotResult) {
  statsModalRef.value?.open(row);
}

function handleDelete(row: CmsSlotResult) {
  Modal.confirm({
    title: '删除确认',
    content: `确认删除运营位 [${row.name}] 吗?`,
    okType: 'danger',
    async onOk() {
      await deleteCmsSlotApi(row.id);
      message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
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
    ? $t('ui.actionTitle.edit', ['运营位'])
    : $t('ui.actionTitle.create', ['运营位']);
});

function tryParseJson(text?: string): Record<string, any> | undefined {
  if (!text || !text.trim()) return undefined;
  try {
    const parsed = JSON.parse(text);
    return typeof parsed === 'object' && parsed !== null ? parsed : undefined;
  } catch {
    throw new Error(
      'JSON 格式错误, 请检查 jump_extra / target_extra / extra 字段',
    );
  }
}

const [Drawer, drawerApi] = useVbenDrawer({
  destroyOnClose: true,
  class: 'w-[860px]',
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    drawerApi.lock();
    try {
      const values = await formApi.getValues<FormSlotData>();
      let jumpExtra: Record<string, any> | undefined;
      let targetExtra: Record<string, any> | undefined;
      let extra: Record<string, any> | undefined;
      try {
        jumpExtra = tryParseJson(values.jump_extra_text);
        targetExtra = tryParseJson(values.target_extra_text);
        extra = tryParseJson(values.extra_text);
      } catch (error) {
        message.error((error as Error).message);
        return;
      }
      const payload: CreateCmsSlotParams = {
        code: values.code as string,
        name: values.name as string,
        slot_type: values.slot_type as string,
        scene: values.scene as string,
        title: values.title,
        subtitle: values.subtitle,
        image_url: values.image_url,
        detail: detailHtml.value || undefined,
        jump_type: values.jump_type,
        jump_target: values.jump_target,
        jump_extra: jumpExtra,
        start_time: values.start_time,
        end_time: values.end_time,
        status: values.status,
        priority: values.priority,
        target_user_type: values.target_user_type,
        target_min_member_level: values.target_min_member_level,
        target_extra: targetExtra,
        max_show_per_user: values.max_show_per_user,
        max_show_per_day_per_user: values.max_show_per_day_per_user,
        close_dismiss_count: values.close_dismiss_count,
        can_close: values.can_close,
        extra,
      };
      if (formData.value?.id) {
        await updateCmsSlotApi(
          formData.value.id,
          payload as UpdateCmsSlotParams,
        );
      } else {
        await createCmsSlotApi(payload);
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
    const data = drawerApi.getData<CmsSlotResult | null>();
    formApi.resetForm();
    if (data) {
      formData.value = { ...data };
      formApi.setValues({
        ...data,
        jump_extra_text: data.jump_extra
          ? JSON.stringify(data.jump_extra, null, 2)
          : '',
        target_extra_text: data.target_extra
          ? JSON.stringify(data.target_extra, null, 2)
          : '',
        extra_text: data.extra ? JSON.stringify(data.extra, null, 2) : '',
      });
      detailHtml.value = data.detail || '';
    } else {
      formData.value = {};
      detailHtml.value = '';
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
          新增运营位
        </VbenButton>
      </template>
      <template #operation_default="{ row }">
        <div class="flex justify-center gap-2">
          <AButton size="small" type="primary" @click="handleEdit(row)">
            编辑
          </AButton>
          <AButton size="small" @click="handleStats(row)">统计</AButton>
          <AButton size="small" danger @click="handleDelete(row)">删除</AButton>
        </div>
      </template>
    </Grid>
    <Drawer :title="drawerTitle">
      <Form />
      <div class="mt-4">
        <div class="mb-2 font-medium">详情(富文本)</div>
        <HaloEditorWrapper
          v-model="detailHtml"
          :height="420"
          placeholder="请输入运营位详情..."
        />
      </div>
    </Drawer>
    <StatsModal ref="statsModalRef" />
  </Page>
</template>
