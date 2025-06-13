<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';
import type { OnActionClickParams, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AppVersionResult, CreateAppVersionParams } from '#/api';

import { computed, ref, onMounted } from 'vue';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createAppVersionApi,
  deleteAppVersionApi,
  getAppVersionListApi,
  updateAppVersionApi,
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
    const queryAppField = querySchema.find(item => item.fieldName === 'application_id');
    if (queryAppField && queryAppField.componentProps) {
      queryAppField.componentProps.options = options;
    }

    // 更新编辑表单的应用选项
    const schemaAppField = schema.find(item => item.fieldName === 'application_id');
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

const gridOptions: VxeTableGridOptions<AppVersionResult> = {
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
        return await getAppVersionListApi({
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

function onActionClick({ code, row }: OnActionClickParams<AppVersionResult>) {
  switch (code) {
    case 'delete': {
      deleteAppVersionApi(row.id).then(() => {
        message.success({
          content: $t('ui.actionMessage.deleteSuccess', [row.version_name]),
          key: 'action_process_msg',
        });
        onRefresh();
      });
      break;
    }
    case 'edit': {
      modalApi.setData(row).open();
      break;
    }
  }
}

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  schema,
});

interface FormAppVersionParams extends CreateAppVersionParams {
  id?: number;
}

const formData = ref<FormAppVersionParams>();

const modalTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['版本'])
    : $t('ui.actionTitle.create', ['版本']);
});

const [Modal, modalApi] = useVbenModal({
  destroyOnClose: true,
  width: 800,
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      modalApi.lock();
      const data = await formApi.getValues<CreateAppVersionParams>();
      try {
        await (formData.value?.id
          ? updateAppVersionApi(formData.value?.id, data)
          : createAppVersionApi(data));
        await modalApi.close();
        onRefresh();
      } finally {
        modalApi.unlock();
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<FormAppVersionParams>();
      formApi.resetForm();
      if (data) {
        formData.value = data;
        formApi.setValues(data);
      }
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
        <VbenButton @click="() => modalApi.setData(null).open()">
          <MaterialSymbolsAdd class="size-5" />
          新增版本
        </VbenButton>
      </template>
    </Grid>
    <Modal :title="modalTitle">
      <Form />
    </Modal>
  </Page>
</template>
