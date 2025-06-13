<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';
import type { OnActionClickParams, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AppRedeemCodeResult, BatchCreateRedeemCodeParams } from '#/api';

import { computed, ref, onMounted } from 'vue';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  batchGenerateRedeemCodesApi,
  deleteAppRedeemCodeApi,
  getAppRedeemCodeListApi,
  getApplicationOptions,
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

    // 更新查询表单的应用选项
    const queryAppField = querySchema.find((item: any) => item.fieldName === 'application_id');
    if (queryAppField && queryAppField.componentProps) {
      queryAppField.componentProps.options = options;
    }

    // 更新编辑表单的应用选项
    const schemaAppField = schema.find((item: any) => item.fieldName === 'application_id');
    if (schemaAppField && schemaAppField.componentProps) {
      schemaAppField.componentProps.options = options;
    }
  } catch (error) {
    console.error('加载应用选项失败:', error);
  }
};

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: {
    content: $t('page.form.query'),
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

function onActionClick({ code, row }: OnActionClickParams<AppRedeemCodeResult>) {
  switch (code) {
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
    case 'copy': {
      navigator.clipboard.writeText(row.code).then(() => {
        message.success('兑换码已复制到剪贴板');
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

const formData = ref<BatchCreateRedeemCodeParams>();

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
