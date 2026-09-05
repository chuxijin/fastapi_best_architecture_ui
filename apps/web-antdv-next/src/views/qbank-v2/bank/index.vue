<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  BankKind,
  BankVisibility,
  CreateBankParam,
  GetBankListItem,
} from '#/api/qbank-v2/bank';

import { computed, nextTick, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getImportTemplateApi,
  importBankApi,
  qbankV2CreateBankApi,
  qbankV2GetAdminBankListApi,
  qbankV2UpdateBankApi,
} from '#/api/qbank-v2/bank';

import { formSchema, querySchema, useColumns } from './data';

const router = useRouter();
const importVisible = ref(false);
const importLoading = ref(false);
const importFile = ref<File>();
const importForm = ref({
  bank_name: '',
  bank_code: '',
  bank_kind: 'practice',
  collection_id: undefined as number | undefined,
  category_ids: '',
  primary_category_id: undefined as number | undefined,
  description: '',
});

async function downloadTemplate() {
  await getImportTemplateApi();
}

function beforeImportUpload(file: File) {
  importFile.value = file;
  return false;
}

async function submitImport() {
  if (!importFile.value || !importForm.value.bank_name.trim()) {
    message.warning('请选择 XLSX 文件并填写题库名称');
    return;
  }
  const data = new FormData();
  data.append('file', importFile.value);
  Object.entries(importForm.value).forEach(([key, value]) => {
    if (value !== undefined && value !== '') data.append(key, String(value));
  });
  importLoading.value = true;
  try {
    await importBankApi(data);
    message.success('题库导入并发布成功');
    importVisible.value = false;
    importFile.value = undefined;
    onRefresh();
  } finally {
    importLoading.value = false;
  }
}

const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  wrapperClass: 'grid-cols-4',
  submitButtonOptions: { content: '查询' },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<GetBankListItem> = {
  rowConfig: { keyField: 'id', isHover: true },
  height: '100%',
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
        return qbankV2GetAdminBankListApi({
          page: page.currentPage,
          size: page.pageSize,
          keyword: formValues?.keyword,
          bank_kind: formValues?.bank_kind,
        });
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

function onRefresh() {
  gridApi.query();
}

function onActionClick({ code, row }: { code: string; row: GetBankListItem }) {
  switch (code) {
    case 'delete': {
      message.success(`删除成功: ${row.name}`);
      onRefresh();
      break;
    }
    case 'detail': {
      router.push(`/qbank-v2/bank/${row.id}`);
      break;
    }
    case 'edit': {
      modalApi.setData(row).open();
      break;
    }
  }
}

const [Form, formApi] = useVbenForm({
  wrapperClass: 'md:grid-cols-2',
  showDefaultActions: false,
  schema: formSchema,
});

const formData = ref<GetBankListItem | null>(null);
interface BankFormValues {
  code?: string;
  name?: string;
  bank_kind?: BankKind;
  visibility?: BankVisibility;
  description?: string;
}
const modalTitle = computed(() => {
  return formData.value?.id ? '编辑题库' : '新增题库';
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-5/12',
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      modalApi.lock();
      const values = await formApi.getValues<BankFormValues>();
      try {
        if (formData.value?.id) {
          await qbankV2UpdateBankApi(formData.value.id, {
            visibility: values.visibility,
          });
          message.success(`编辑题库成功: ${values.name}`);
        } else {
          await qbankV2CreateBankApi({
            code: values.code as string,
            visibility: values.visibility,
            revision: {
              name: values.name as string,
              bank_kind: values.bank_kind || 'practice',
              description: values.description,
            },
          } as CreateBankParam);
          message.success(`新增题库成功: ${values.name}`);
        }
        await modalApi.close();
        onRefresh();
      } finally {
        modalApi.unlock();
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<Partial<GetBankListItem>>();
      nextTick(() => {
        formApi.resetForm();
        if (data?.id) {
          formData.value = data as GetBankListItem;
          formApi.setValues({
            code: data.code,
            name: data.name,
            bank_kind: data.bank_kind,
            visibility: data.visibility,
          });
        } else {
          formData.value = null;
          formApi.setValues({
            bank_kind: 'practice',
            visibility: 'public',
          });
        }
      });
    }
  },
});
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <a-button @click="downloadTemplate">下载导入模板</a-button>
        <a-button @click="importVisible = true">导入 XLSX</a-button>
        <VbenButton @click="() => modalApi.setData(null).open()">
          <MaterialSymbolsAdd class="size-5" />
          新增题库
        </VbenButton>
      </template>
    </Grid>
    <Modal :title="modalTitle">
      <Form />
    </Modal>
    <a-modal
      v-model:open="importVisible"
      title="导入题库"
      :confirm-loading="importLoading"
      @ok="submitImport"
    >
      <a-form layout="vertical">
        <a-form-item label="XLSX 文件" required>
          <a-upload
            :before-upload="beforeImportUpload"
            :max-count="1"
            accept=".xlsx"
          >
            <a-button>选择文件</a-button>
          </a-upload>
        </a-form-item>
        <a-form-item label="题库名称" required>
          <a-input v-model:value="importForm.bank_name" />
        </a-form-item>
        <a-form-item label="题库编码">
          <a-input v-model:value="importForm.bank_code" />
        </a-form-item>
        <a-form-item label="题库类型">
          <a-select
            v-model:value="importForm.bank_kind"
            :options="[
              { label: '练习', value: 'practice' },
              { label: '试卷', value: 'paper' },
              { label: '模考', value: 'mock' },
            ]"
          />
        </a-form-item>
        <a-form-item label="挂载合集 ID">
          <a-input-number
            v-model:value="importForm.collection_id"
            :min="1"
            class="w-full"
          />
        </a-form-item>
        <a-form-item label="分类 ID（逗号分隔）">
          <a-input v-model:value="importForm.category_ids" />
        </a-form-item>
        <a-form-item label="主分类 ID">
          <a-input-number
            v-model:value="importForm.primary_category_id"
            :min="1"
            class="w-full"
          />
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea v-model:value="importForm.description" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>
  </Page>
</template>
