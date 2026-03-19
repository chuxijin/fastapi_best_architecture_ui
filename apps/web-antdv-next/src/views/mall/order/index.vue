<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MallOrderResult } from '#/api';

import { Page } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getMallOrderListApi } from '#/api/mall';

import { querySchema, useColumns } from './data';

const formOptions: VbenFormProps = {
  submitButtonOptions: {
    content: $t('common.form.query'),
  },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<MallOrderResult> = {
  rowConfig: {
    keyField: 'id',
  },
  checkboxConfig: {
    highlight: true,
  },
  height: 'auto',
  toolbarConfig: {
    refresh: true,
    refreshOptions: {
      code: 'query',
    },
    custom: true,
    zoom: true,
  },
  columns: useColumns(),
  proxyConfig: {
    ajax: {
      query: async (_params, formValues) => {
        const list = await getMallOrderListApi(formValues);
        return { result: list, page: { total: list.length } };
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
