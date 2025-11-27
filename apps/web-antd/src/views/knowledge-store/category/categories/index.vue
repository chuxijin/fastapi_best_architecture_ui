<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CategoryParams, CategoryTreeResult } from '#/api';

import { computed, ref } from 'vue';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createQbankCategoryApi,
  deleteQbankCategoryApi,
  getQbankCategoryTreeApi,
  updateQbankCategoryApi,
} from '#/api';
import {
  catTypeMap,
  formSchema,
  querySchema,
  useColumns,
} from '#/views/knowledge-store/category/categories/data';

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: {
    content: '查询',
  },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<CategoryTreeResult> = {
  rowConfig: {
    keyField: 'id',
    isHover: true,
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
  pagerConfig: {
    enabled: false,
  },
  treeConfig: {
    parentField: 'parent_id',
    children: 'children',
    trigger: 'row',
    expandAll: false,
  },
  columns: useColumns(onActionClick),
  proxyConfig: {
    ajax: {
      query: async (_, formValues) => {
        const data = await getQbankCategoryTreeApi({
          cat_type: formValues?.cat_type,
          is_active: formValues?.is_active,
        });

        // 清理 children: null 字段
        const cleanData = (items: any[]): any[] => {
          return items.map((item) => {
            const cleaned = { ...item };
            if (cleaned.children === null) {
              delete cleaned.children;
            } else if (Array.isArray(cleaned.children)) {
              cleaned.children = cleanData(cleaned.children);
            }
            return cleaned;
          });
        };

        return cleanData(data);
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

function onRefresh() {
  gridApi.query();
}

const expandAll = () => {
  gridApi.grid?.setAllTreeExpand(true);
};

const collapseAll = () => {
  gridApi.grid?.setAllTreeExpand(false);
};

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: CategoryTreeResult;
}) {
  switch (code) {
    case 'add': {
      modalApi.setData({ parent_id: row.id }).open();
      break;
    }
    case 'delete': {
      deleteQbankCategoryApi({ ids: [row.id] }).then(() => {
        message.success(`删除分类成功: ${row.name}`);
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
  wrapperClass: 'md:grid-cols-2',
  showDefaultActions: false,
  schema: formSchema,
});

const formData = ref<CategoryTreeResult | null>(null);

const modalTitle = computed(() => {
  return formData.value?.id ? '编辑分类' : '添加分类';
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-5/12',
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      modalApi.lock();
      const data = await formApi.getValues<CategoryParams>();
      try {
        if (formData.value?.id) {
          await updateQbankCategoryApi(formData.value.id, data);
          message.success(`编辑分类成功: ${data.name}`);
        } else {
          await createQbankCategoryApi(data);
          message.success(`添加分类成功: ${data.name}`);
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
      const data = modalApi.getData<CategoryTreeResult>();
      formApi.resetForm();
      if (data) {
        formData.value = data;
        formApi.setValues(data);
      } else {
        formData.value = null;
      }
    }
  },
});
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <VbenButton @click="() => modalApi.setData(null).open()">
          <MaterialSymbolsAdd class="size-5" />
          添加分类
        </VbenButton>
      </template>

      <template #toolbar-tools>
        <a-button class="mr-2" type="primary" @click="expandAll">
          展开全部
        </a-button>
        <a-button type="primary" @click="collapseAll">折叠全部</a-button>
      </template>

      <template #cat_type="{ row }">
        <span>{{ catTypeMap[row.cat_type] }}</span>
      </template>

      <template #status="{ row }">
        <span :class="row.is_active ? 'text-green-600' : 'text-red-600'">
          {{ row.is_active ? '启用' : '禁用' }}
        </span>
      </template>
    </Grid>

    <Modal :title="modalTitle">
      <Form />
    </Modal>
  </Page>
</template>
