<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SensitiveHitLogResult } from '#/api/sensitive-word';

import { Page } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getSensitiveHitLogListApi } from '#/api/sensitive-word';

import { hitLogQuerySchema, useHitLogColumns } from '../data';

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  schema: hitLogQuerySchema,
};

const gridOptions: VxeTableGridOptions<SensitiveHitLogResult> = {
  rowConfig: { keyField: 'id' },
  height: 'auto',
  toolbarConfig: {
    refresh: { code: 'query' },
    zoom: true,
  },
  columns: useHitLogColumns(),
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return await getSensitiveHitLogListApi({
          page: page.currentPage,
          size: page.pageSize,
          ...formValues,
        });
      },
    },
  },
};

const [Grid] = useVbenVxeGrid({ formOptions, gridOptions });
</script>

<template>
  <Page auto-content-height>
    <Grid />
  </Page>
</template>
