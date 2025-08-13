<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { AppRedeemCodeResult, BatchCreateRedeemCodeParams } from '#/api';

import { computed, onMounted } from 'vue';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  batchGenerateRedeemCodesApi,
  deleteAppRedeemCodeApi,
  getApplicationOptions,
  getAppRedeemCodeListApi,
} from '#/api';

import { querySchema, schema, useColumns } from './data';

// 初始化应用选项
const initApplicationOptions = async () => {
  try {
    const response = await getApplicationOptions();
    const options = response.map((item: any) => ({
      label: item.name,
      value: item.id,
    }));

    // 安全设置 schema 字段的 options（兼容 object/function）
    const setFieldOptions = (
      fields: any[],
      fieldName: string,
      opts: Array<{ label: string; value: number }>,
    ) => {
      const field = fields.find((i: any) => i.fieldName === fieldName);
      if (!field) return;
      const cp = field.componentProps;
      if (typeof cp === 'function') {
        const original = cp;
        field.componentProps = (value: any, actions: any) => {
          const base = (original as any)(value, actions) || {};
          return { ...base, options: opts } as any;
        };
      } else {
        field.componentProps = { ...(cp as any), options: opts } as any;
      }
    };

    setFieldOptions(querySchema as any[], 'application_id', options);
    setFieldOptions(schema as any[], 'application_id', options);
  } catch (error) {
    console.error('加载应用选项失败:', error);
  }
};

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: {
    content: $t('common.search'),
  },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<AppRedeemCodeResult> = {
  rowConfig: {
    keyField: 'id',
  },
  checkboxConfig: {
    highlight: true,
  },
  height: 'auto',
  exportConfig: {},
  printConfig: {},
  toolbarConfig: {
    export: true,
    print: true,
    refresh: { code: 'query' },
    custom: true,
    zoom: true,
  },
  columns: useColumns(onActionClick),
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return await getAppRedeemCodeListApi({
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

function onActionClick({
  code,
  row,
}: OnActionClickParams<AppRedeemCodeResult>) {
  switch (code) {
    case 'copy': {
      navigator.clipboard.writeText(row.code).then(() => {
        message.success('兑换码已复制到剪贴板');
      });
      break;
    }
    case 'delete': {
      if (row.is_used) {
        message.warning('已使用的兑换码不能删除');
        return;
      }
      deleteAppRedeemCodeApi(row.id).then(() => {
        message.success({
          content: $t('ui.actionMessage.deleteSuccess', [row.code]),
          key: 'action_process_msg',
        });
        onRefresh();
      });
      break;
    }
  }
}

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2',
  schema,
});

// 当前未用到，删除以消除告警（后续需要时再恢复）

const modalTitle = computed(() => {
  return '批量生成兑换码';
});

const [Modal, modalApi] = useVbenModal({
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      modalApi.lock();
      const data = await formApi.getValues<BatchCreateRedeemCodeParams>();
      try {
        await batchGenerateRedeemCodesApi(data);
        message.success('批量生成兑换码成功');
        await modalApi.close();
        onRefresh();
      } finally {
        modalApi.unlock();
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      formApi.resetForm();
      // 设置默认值
      formApi.setValues({
        max_devices: 1,
        generation_params: {
          count: 10,
          char_types: {
            uppercase: true,
            lowercase: true,
            digits: true,
            special: false,
          },
          key_length: 16,
          separator: '-',
        },
      });
    }
  },
});

onMounted(() => {
  initApplicationOptions();
});
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <VbenButton @click="() => modalApi.open()">
          <MaterialSymbolsAdd class="size-5" />
          批量生成兑换码
        </VbenButton>
      </template>
    </Grid>
    <Modal :title="modalTitle">
      <Form />
    </Modal>
  </Page>
</template>
