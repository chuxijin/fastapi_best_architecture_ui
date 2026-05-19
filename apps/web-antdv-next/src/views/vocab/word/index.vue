<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';
import type { OnActionClickParams, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { VocabWordResult, CreateVocabWordParams } from '#/api/vocab';

import { computed, ref } from 'vue';
import { Page, useVbenModal } from '@vben/common-ui';
import { message, Upload } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { requestClient } from '#/api/request';
import {
  createVocabWordApi,
  deleteVocabWordApi,
  getVocabWordApi,
  getVocabWordListApi,
  updateVocabWordApi,
} from '#/api/vocab';

import { querySchema, schema, useColumns } from './data';

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<VocabWordResult> = {
  rowConfig: { keyField: 'id' },
  height: 'auto',
  toolbarConfig: {
    refresh: { code: 'query' },
    zoom: true,
  },
  columns: useColumns(onActionClick),
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return await getVocabWordListApi({
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

interface FormParams extends CreateVocabWordParams {
  id?: number;
}

const formData = ref<FormParams>();

const modalTitle = computed(() =>
  formData.value?.id ? '编辑单词' : '创建单词',
);

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  schema,
});

const [Modal, modalApi] = useVbenModal({
  title: modalTitle,
  onConfirm: async () => {
    try {
      const values = await formApi.getValues<CreateVocabWordParams>();
      const id = formData.value?.id;
      if (id) {
        await updateVocabWordApi(id, values);
        message.success('更新成功');
      } else {
        await createVocabWordApi(values);
        message.success('创建成功');
      }
      modalApi.close();
      onRefresh();
    } catch (error) {
      console.error(error);
    }
  },
  onOpenChange: async (isOpen: boolean) => {
    if (isOpen) {
      const data = modalApi.getData<FormParams>();
      formData.value = data;
      formApi.resetForm();
      if (data) {
        formApi.setValues(data);
      }
    }
  },
});

function onActionClick({ code, row }: OnActionClickParams<VocabWordResult>) {
  switch (code) {
    case 'delete': {
      deleteVocabWordApi(row.id).then(() => {
        message.success('删除成功');
        onRefresh();
      });
      break;
    }
    case 'edit': {
      getVocabWordApi(row.id).then((data) => {
        modalApi.setData(data).open();
      });
      break;
    }
  }
}

function handleCreate() {
  modalApi.setData(undefined).open();
}

async function handleBeforeUpload(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  try {
    message.loading({ content: '正在导入...', key: 'import' });
    const res = await requestClient.post('/vocab/admin/import-excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    message.success({ content: `导入完成：成功 ${res.success_count}，跳过 ${res.skip_count}，失败 ${res.error_count}`, key: 'import' });
    onRefresh();
  } catch (err: any) {
    message.error({ content: err.message || '导入失败', key: 'import' });
  }
  return false;
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <Upload :before-upload="handleBeforeUpload" :show-upload-list="false" accept=".xlsx">
          <a-button type="default">导入 Excel</a-button>
        </Upload>
        <a-button type="primary" class="ml-2" @click="handleCreate">新建单词</a-button>
      </template>
    </Grid>
    <Modal>
      <Form />
    </Modal>
  </Page>
</template>
