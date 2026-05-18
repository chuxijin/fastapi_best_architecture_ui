<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { UserSubscriptionResult } from '#/api/access';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { Form, FormItem, Input, InputNumber, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  extendSubscriptionApi,
  getUserSubscriptionListApi,
  revokeSubscriptionApi,
} from '#/api/access';

import { querySchema, useColumns } from './data';

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: { content: $t('common.search') },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<UserSubscriptionResult> = {
  rowConfig: { keyField: 'id' },
  checkboxConfig: { highlight: true },
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
      query: async ({ page }, formValues) => {
        return await getUserSubscriptionListApi({
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

const activeRow = ref<null | UserSubscriptionResult>(null);
const extendDays = ref(30);
const extendReason = ref('');
const revokeReason = ref('');

const [ExtendModal, extendModalApi] = useVbenModal({
  title: '续期订阅',
  onConfirm: async () => {
    if (!activeRow.value) {
      return;
    }
    if (extendDays.value <= 0) {
      message.warning('续期天数必须大于 0');
      return;
    }
    try {
      await extendSubscriptionApi(activeRow.value.id, {
        days: extendDays.value,
        reason: extendReason.value,
      });
      message.success('续期成功');
      extendModalApi.close();
      onRefresh();
    } catch (error) {
      console.error(error);
    }
  },
});

const [RevokeModal, revokeModalApi] = useVbenModal({
  title: '撤销订阅',
  onConfirm: async () => {
    if (!activeRow.value) {
      return;
    }
    if (!revokeReason.value) {
      message.warning('请填写撤销原因');
      return;
    }
    try {
      await revokeSubscriptionApi(activeRow.value.id, {
        reason: revokeReason.value,
      });
      message.success('已撤销');
      revokeModalApi.close();
      onRefresh();
    } catch (error) {
      console.error(error);
    }
  },
});

function onActionClick({
  code,
  row,
}: OnActionClickParams<UserSubscriptionResult>) {
  activeRow.value = row;
  switch (code) {
    case 'extend': {
      extendDays.value = 30;
      extendReason.value = '';
      extendModalApi.open();
      break;
    }
    case 'revoke': {
      revokeReason.value = '';
      revokeModalApi.open();
      break;
    }
  }
}
</script>

<template>
  <Page auto-content-height>
    <Grid />
    <ExtendModal>
      <Form layout="vertical">
        <FormItem label="续期天数" required>
          <InputNumber
            v-model:value="extendDays"
            :min="1"
            :max="3650"
            style="width: 100%"
          />
        </FormItem>
        <FormItem label="续期原因">
          <Input v-model:value="extendReason" placeholder="可选, 用于审计" />
        </FormItem>
      </Form>
    </ExtendModal>
    <RevokeModal>
      <Form layout="vertical">
        <FormItem label="撤销原因" required>
          <Input v-model:value="revokeReason" placeholder="必填, 用于审计" />
        </FormItem>
      </Form>
    </RevokeModal>
  </Page>
</template>
