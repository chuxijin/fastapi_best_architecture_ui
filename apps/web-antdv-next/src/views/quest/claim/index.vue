<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { QuestClaimResult } from '#/api';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { Button as AButton } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getQuestClaimListApi } from '#/api';

import { querySchema, useColumns } from './data';
import ReviewDrawer from './ReviewDrawer.vue';

const drawerRef = ref<InstanceType<typeof ReviewDrawer>>();

const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  submitButtonOptions: { content: $t('common.form.query') },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<QuestClaimResult> = {
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
        return await getQuestClaimListApi({
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

function handleReview(row: QuestClaimResult) {
  drawerRef.value?.open(row);
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #operation_default="{ row }">
        <AButton type="primary" size="small" @click="handleReview(row)">
          审核 / 撤销
        </AButton>
      </template>
    </Grid>
    <ReviewDrawer ref="drawerRef" @refresh="onRefresh" />
  </Page>
</template>
