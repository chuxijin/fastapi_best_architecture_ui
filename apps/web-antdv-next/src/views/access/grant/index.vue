<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { AccessEntitlementResult, DirectGrantResult } from '#/api/access';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createDirectGrantApi,
  deleteDirectGrantApi,
  getAccessEntitlementListApi,
  getDirectGrantListApi,
} from '#/api/access';

import { createSchema, querySchema, useColumns } from './data';

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: { content: $t('common.search') },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<DirectGrantResult> = {
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
        return await getDirectGrantListApi({
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

const entitlementOptions = ref<Array<{ label: string; value: string }>>([]);
const optionPageSize = 200;
let optionsLoaded = false;

async function loadEntitlementOptions() {
  if (optionsLoaded) return;
  try {
    const entitlements: AccessEntitlementResult[] = [];
    let page = 1;

    while (true) {
      const data = await getAccessEntitlementListApi({
        page,
        size: optionPageSize,
        status: 'active',
      });
      entitlements.push(...data.items);

      if (
        entitlements.length >= data.total ||
        data.items.length < optionPageSize
      ) {
        break;
      }
      page += 1;
    }

    entitlementOptions.value = entitlements.map((item) => ({
      label: `${item.code} · ${item.name} (${item.category})`,
      value: item.code,
    }));

    await formApi.updateSchema([
      {
        componentProps: {
          allowClear: true,
          optionFilterProp: 'label',
          options: entitlementOptions.value,
          placeholder: '请选择授予的权益',
          popupMatchSelectWidth: 560,
          showSearch: true,
          style: { width: '100%' },
        },
        fieldName: 'entitlement_code',
      },
    ]);
    optionsLoaded = true;
  } catch (e) {
    console.error('Failed to load entitlements:', e);
  }
}

const [CreateForm, formApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  schema: createSchema,
});

const [CreateModal, createModalApi] = useVbenModal({
  title: '手动授予权益',
  onConfirm: async () => {
    try {
      const values = await formApi.getValues<any>();
      const payload = {
        user_id: values.user_id,
        entitlement_code: values.entitlement_code,
        valid_period: {
          valid_from: values.valid_from,
          valid_to: values.valid_to || null,
        },
        source: values.source,
      };
      await createDirectGrantApi(payload);
      message.success('权益直接授予成功');
      createModalApi.close();
      onRefresh();
    } catch (error) {
      console.error(error);
    }
  },
  onOpenChange: async (isOpen: boolean) => {
    if (isOpen) {
      formApi.resetForm();
      const now = new Date();
      const isoString = now.toISOString().replace(/\.\d+Z$/, 'Z');
      formApi.setValues({
        valid_from: isoString,
        source: 'admin',
      });
      await loadEntitlementOptions();
    }
  },
});

function handleCreate() {
  createModalApi.open();
}

function onActionClick({ code, row }: OnActionClickParams<DirectGrantResult>) {
  if (code === 'revoke') {
    deleteDirectGrantApi(row.id).then(() => {
      message.success('权益授予已撤销');
      onRefresh();
    });
  }
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <a-button type="primary" @click="handleCreate">手动授予权益</a-button>
      </template>
    </Grid>
    <CreateModal>
      <CreateForm />
    </CreateModal>
  </Page>
</template>
