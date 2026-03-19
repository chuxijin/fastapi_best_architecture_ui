<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MallTeamResult } from '#/api';

import { Page } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getMallTeamListApi } from '#/api/mall';

import { querySchema, useColumns } from './data';

const formOptions: VbenFormProps = {
  submitButtonOptions: {
    content: $t('common.form.query'),
  },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<MallTeamResult> = {
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
        if (!formValues?.activity_id) {
          return { result: [], page: { total: 0 } };
        }
        const list = await getMallTeamListApi(formValues);
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
