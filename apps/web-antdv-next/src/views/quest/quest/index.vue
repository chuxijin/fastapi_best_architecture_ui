<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { CreateQuestParams, QuestResult, UpdateQuestParams } from '#/api';

import { computed, nextTick, ref, watch } from 'vue';

import dayjs from 'dayjs';
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

import { querySchema, rewardFieldMap, schema, useColumns } from './data';

interface FormQuestData extends Partial<CreateQuestParams> {
  id?: number;
  reward_amount?: number;
  reward_days?: number;
  reward_feature_code?: string;
}

const formData = ref<FormQuestData>({});
const detailHtml = ref('');
const currentRewardType = ref('points');

const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  wrapperClass: 'grid-cols-3',
  actionWrapperClass: 'col-start-3',
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

watch(
  () => formData.value.reward_type,
  (val) => {
    currentRewardType.value = val || 'points';
    nextTick(() => toggleRewardFields());
  },
);

const currentRewardFields = computed(() => {
  return rewardFieldMap[currentRewardType.value] || [];
});

function toggleRewardFields() {
  const container = document.querySelector('.reward-fields-container');
  if (!container) return;
  container.className = `reward-fields-container reward-type-${currentRewardType.value}`;
}

function buildRewardData(values: FormQuestData): Record<string, any> | undefined {
  switch (values.reward_type) {
    case 'points': {
      const amount = values.reward_amount;
      if (!amount || amount <= 0) return undefined;
      return { amount };
    }
    case 'vip': {
      const days = values.reward_days;
      if (!days || days <= 0) return undefined;
      return { days };
    }
    case 'feature': {
      const code = values.reward_feature_code?.trim();
      if (!code) return undefined;
      return { feature_code: code };
    }
    default:
      return undefined;
  }
}

function decomposeRewardData(rewardType: string, rewardData?: Record<string, any>) {
  if (!rewardData) return {};
  switch (rewardType) {
    case 'points':
      return { reward_amount: rewardData.amount };
    case 'vip':
      return { reward_days: rewardData.days };
    case 'feature':
      return { reward_feature_code: rewardData.feature_code };
    default:
      return {};
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
        rewardData = buildRewardData(values);
      } catch (error) {
        message.error((error as Error).message);
        return;
      }
      const payload: CreateQuestParams = {
        code: values.code as string,
        quest_type: values.quest_type as string,
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
      const decomposed = decomposeRewardData(data.reward_type, data.reward_data);
      const formatted: Record<string, any> = { ...data, ...decomposed };
      if (data.start_time) {
        formatted.start_time = dayjs(data.start_time).format('YYYY-MM-DD HH:mm:ss');
      }
      if (data.end_time) {
        formatted.end_time = dayjs(data.end_time).format('YYYY-MM-DD HH:mm:ss');
      }
      formApi.setValues(formatted);
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
      <div class="reward-fields-container" :class="`reward-type-${currentRewardType}`">
        <Form />
      </div>
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

<style scoped>
.reward-fields-container :deep(.reward-field) {
  display: none;
}
.reward-type-points :deep(.reward-field-points) {
  display: block;
}
.reward-type-vip :deep(.reward-field-vip) {
  display: block;
}
.reward-type-feature :deep(.reward-field-feature) {
  display: block;
}
.reward-type-chaoji_course :deep(.reward-field-chaoji_course) {
  display: block;
}
</style>
