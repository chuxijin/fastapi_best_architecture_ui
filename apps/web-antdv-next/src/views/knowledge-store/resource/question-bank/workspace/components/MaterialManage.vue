<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { BankResult } from '#/api';

import { computed, onMounted, ref } from 'vue';

import { useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { requestClient } from '#/api/request';
import { renderMarkdownSafe } from '#/utils/markdown-renderer';

interface Material {
  id: number;
  bank_id: number;
  title: string;
  content: string;
  source: null | string;
  year: null | number;
  sort_order: number;
  is_active: boolean;
  created_time: string;
}

interface Props {
  bankId: number;
  bankInfo: BankResult | null;
}

const props = defineProps<Props>();

const formData = ref<null | Partial<Material>>(null);

const modalTitle = computed(() =>
  formData.value?.id ? '编辑材料' : '添加材料',
);

const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  wrapperClass: 'grid-cols-1 md:grid-cols-4',
  submitButtonOptions: {
    content: '查询',
  },
  schema: [
    {
      component: 'Input',
      fieldName: 'keyword',
      label: '关键字',
      componentProps: {
        placeholder: '搜索标题/来源',
        allowClear: true,
      },
    },
    {
      component: 'InputNumber',
      fieldName: 'year',
      label: '年份',
      componentProps: {
        placeholder: '年份',
        style: { width: '100%' },
      },
    },
    {
      component: 'Select',
      fieldName: 'is_active',
      label: '状态',
      componentProps: {
        placeholder: '全部',
        allowClear: true,
        options: [
          { label: '启用', value: true },
          { label: '禁用', value: false },
        ],
      },
    },
  ],
};

const gridOptions: VxeTableGridOptions<Material> = {
  rowConfig: {
    keyField: 'id',
    isHover: true,
  },
  height: 'auto',
  toolbarConfig: {
    refresh: { code: 'query' },
    custom: true,
    zoom: true,
  },
  pagerConfig: {
    enabled: true,
    currentPage: 1,
    pageSize: 20,
    pageSizes: [10, 20, 50, 100],
  },
  columns: [
    { title: '序号', type: 'seq', width: 60 },
    { title: '标题', field: 'title', minWidth: 200, showOverflow: true },
    { title: '来源', field: 'source', width: 120 },
    { title: '年份', field: 'year', width: 80 },
    { title: '排序', field: 'sort_order', width: 80 },
    {
      title: '状态',
      field: 'is_active',
      width: 80,
      slots: { default: 'is_active_default' },
    },
    { title: '创建时间', field: 'created_time', width: 180 },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      slots: { default: 'action_default' },
    },
  ],
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        const res = await requestClient.get<Material[]>(
          '/api/v1/qbank/materials',
          {
            params: {
              bank_id: props.bankId,
              page: page.currentPage,
              size: page.pageSize,
              ...formValues,
            },
          },
        );
        return {
          total: res?.length || 0,
          items: res || [],
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

const [MaterialForm, materialFormApi] = useVbenForm({
  wrapperClass: 'grid-cols-1',
  showDefaultActions: false,
  schema: [
    {
      component: 'Input',
      fieldName: 'title',
      label: '标题',
      rules: 'required',
      componentProps: {
        placeholder: '请输入材料标题',
      },
    },
    {
      component: 'Textarea',
      fieldName: 'content',
      label: '内容',
      rules: 'required',
      componentProps: {
        placeholder: '请输入材料内容',
        rows: 10,
      },
    },
    {
      component: 'Input',
      fieldName: 'source',
      label: '来源',
      componentProps: {
        placeholder: '如：2024年国考',
      },
    },
    {
      component: 'InputNumber',
      fieldName: 'year',
      label: '年份',
      componentProps: {
        placeholder: '如：2024',
        style: { width: '100%' },
      },
    },
    {
      component: 'InputNumber',
      fieldName: 'sort_order',
      label: '排序',
      componentProps: {
        placeholder: '数字越小越靠前',
        style: { width: '100%' },
      },
      defaultValue: 0,
    },
    {
      component: 'Switch',
      fieldName: 'is_active',
      label: '状态',
      defaultValue: true,
    },
  ],
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-7/12',
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await materialFormApi.validate();
    if (valid) {
      modalApi.lock();
      try {
        const data = await materialFormApi.getValues<Material>();
        data.bank_id = props.bankId;

        if (formData.value?.id) {
          await requestClient.put(
            `/api/v1/qbank/materials/${formData.value.id}`,
            data,
          );
          message.success('更新材料成功');
        } else {
          await requestClient.post('/api/v1/qbank/materials', data);
          message.success('添加材料成功');
        }

        await modalApi.close();
        onRefresh();
      } catch (error: any) {
        message.error(error?.message || '操作失败');
      } finally {
        modalApi.unlock();
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<Material>();
      materialFormApi.resetForm();
      if (data) {
        formData.value = data;
        materialFormApi.setValues(data);
      } else {
        formData.value = null;
        materialFormApi.setValues({
          is_active: true,
          sort_order: 0,
        });
      }
    }
  },
});

const previewData = ref<Material | null>(null);
const [PreviewModal, previewModalApi] = useVbenModal({
  class: 'w-8/12',
  title: '材料预览',
  footer: false,
  destroyOnClose: true,
});

const renderedMaterialContent = computed(() =>
  renderMarkdownSafe(previewData.value?.content || ''),
);

onMounted(() => {
  // 初始化加载
});

function onRefresh() {
  gridApi.query();
}

function handleAdd() {
  modalApi.setData(null).open();
}

async function handleEdit(row: Material) {
  modalApi.setData(row).open();
}

async function handlePreview(row: Material) {
  try {
    const detail = await requestClient.get<Material>(
      `/api/v1/qbank/materials/${row.id}`,
    );
    previewData.value = detail;
    previewModalApi.open();
  } catch {
    message.error('获取材料详情失败');
  }
}

async function handleDelete(row: Material) {
  try {
    await requestClient.delete('/api/v1/qbank/materials', {
      data: { ids: [row.id] },
    });
    message.success('删除材料成功');
    onRefresh();
  } catch (error: any) {
    message.error(error?.message || '删除失败');
  }
}
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <Grid class="h-full min-h-0">
      <template #toolbar-actions>
        <VbenButton @click="handleAdd">
          <MaterialSymbolsAdd class="size-5" />
          添加材料
        </VbenButton>
      </template>

      <template #is_active_default="{ row }">
        <span
          class="inline-block rounded px-2 py-1 text-xs font-medium"
          :class="
            row.is_active
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700'
          "
        >
          {{ row.is_active ? '启用' : '禁用' }}
        </span>
      </template>

      <template #action_default="{ row }">
        <div class="flex items-center gap-2">
          <a class="text-blue-600 hover:text-blue-800" @click="handleEdit(row)"
            >编辑</a
          >
          <a
            class="text-blue-600 hover:text-blue-800"
            @click="handlePreview(row)"
            >预览</a
          >
          <a class="text-red-500 hover:text-red-700" @click="handleDelete(row)"
            >删除</a
          >
        </div>
      </template>
    </Grid>

    <Modal :title="modalTitle">
      <MaterialForm />
    </Modal>

    <PreviewModal>
      <div v-if="previewData" class="space-y-6">
        <div class="rounded-lg bg-gray-50 p-4">
          <h4 class="text-md mb-4 font-semibold">基本信息</h4>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >标题</label
              >
              <p class="text-sm text-gray-900">{{ previewData.title }}</p>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >来源</label
              >
              <p class="text-sm text-gray-900">
                {{ previewData.source || '-' }}
              </p>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >年份</label
              >
              <p class="text-sm text-gray-900">{{ previewData.year || '-' }}</p>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >状态</label
              >
              <p class="text-sm text-gray-900">
                {{ previewData.is_active ? '启用' : '禁用' }}
              </p>
            </div>
          </div>
        </div>

        <div class="rounded-lg bg-gray-50 p-4">
          <h4 class="text-md mb-4 font-semibold">材料内容</h4>
          <div
            class="markdown-content max-h-96 overflow-y-auto rounded border bg-white p-4 text-sm text-gray-900"
            v-html="renderedMaterialContent"
          ></div>
        </div>
      </div>
      <template #footer>
        <div class="flex items-center justify-end space-x-2">
          <button
            class="rounded bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700"
            @click="previewModalApi.close()"
          >
            确定
          </button>
        </div>
      </template>
    </PreviewModal>
  </div>
</template>

<style scoped>
:deep(.markdown-content p) {
  margin: 0.5em 0;
}

:deep(.markdown-content img),
:deep(.markdown-image) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}
</style>
