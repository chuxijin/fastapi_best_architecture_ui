<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { CreateQuestParams, QuestResult, UpdateQuestParams } from '#/api';

import { computed, ref } from 'vue';

import { Page, useVbenDrawer, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createQuestApi,
  deleteQuestApi,
  getQuestListApi,
  updateQuestApi,
} from '#/api';
import HaloEditorWrapper from '#/components/HaloEditor/HaloEditorWrapper.vue';

import { querySchema, schema, useColumns } from './data';

interface FormQuestData extends Partial<CreateQuestParams> {
  id?: number;
  reward_data_text?: string;
}

const formData = ref<FormQuestData>({});
const detailHtml = ref('');

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: { content: $t('common.form.query') },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<QuestResult> = {
  rowConfig: { keyField: 'id' },
  height: 'auto',
  toolbarConfig: {
    refresh: true,
    refreshOptions: { code: 'query' },
    custom: true,
    zoom: true,
  },
  columns: useColumns(onActionClick),
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return await getQuestListApi({
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

function onActionClick({ code, row }: OnActionClickParams<QuestResult>) {
  switch (code) {
    case 'delete': {
      deleteQuestApi(row.id).then(() => {
        message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
        onRefresh();
      });
      break;
    }
    case 'edit': {
      drawerApi.setData(row).open();
      break;
    }
  }
}

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  schema,
});

const drawerTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['任务'])
    : $t('ui.actionTitle.create', ['任务']);
});

function parseRewardData(text?: string): Record<string, any> | undefined {
  if (!text || !text.trim()) return undefined;
  try {
    const parsed = JSON.parse(text);
    return typeof parsed === 'object' && parsed !== null ? parsed : undefined;
  } catch {
    throw new Error('奖励数据 JSON 格式错误');
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
      const values = await formApi.getValues<FormQuestData>();
      let rewardData: Record<string, any> | undefined;
      try {
        rewardData = parseRewardData(values.reward_data_text);
      } catch (error) {
        message.error((error as Error).message);
        return;
      }
      const payload: CreateQuestParams = {
        code: values.code as string,
        name: values.name as string,
        brief: values.brief as string,
        info: values.info,
        detail: detailHtml.value || undefined,
        cover_image: values.cover_image,
        start_time: values.start_time,
        end_time: values.end_time,
        status: values.status,
        total_quota: values.total_quota,
        max_claims_per_user: values.max_claims_per_user,
        claim_expire_seconds: values.claim_expire_seconds,
        submission_required: values.submission_required,
        review_required: values.review_required,
        reward_type: values.reward_type,
        reward_data: rewardData,
        sort: values.sort,
      };
      if (formData.value?.id) {
        await updateQuestApi(formData.value.id, payload as UpdateQuestParams);
      } else {
        await createQuestApi(payload);
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
    const data = drawerApi.getData<QuestResult | null>();
    formApi.resetForm();
    if (data) {
      formData.value = { ...data };
      const rewardDataText = data.reward_data
        ? JSON.stringify(data.reward_data, null, 2)
        : '';
      formApi.setValues({ ...data, reward_data_text: rewardDataText });
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
          新增任务
        </VbenButton>
      </template>
    </Grid>
    <Drawer :title="drawerTitle">
      <Form />
      <div class="mt-4">
        <div class="mb-2 font-medium">任务详情(富文本)</div>
        <HaloEditorWrapper
          v-model="detailHtml"
          :height="420"
          placeholder="请输入任务详情内容..."
        />
      </div>
    </Drawer>
  </Page>
</template>
