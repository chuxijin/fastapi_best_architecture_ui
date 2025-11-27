<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';

import { VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';

interface Tag {
  id: number;
  name: string;
  color: string;
  description: string;
  sort: number;
  status: number;
  createTime: string;
}

const querySchema: VbenFormProps['schema'] = [
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入标签名称',
    },
    fieldName: 'name',
    label: '标签名称',
  },
];

const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  submitButtonOptions: {
    content: '查询',
  },
  schema: querySchema,
};

const columns = [
  { type: 'checkbox', width: 50 },
  { type: 'seq', width: 60, title: '序号' },
  { field: 'name', title: '标签名称', minWidth: 150 },
  {
    field: 'color',
    title: '颜色',
    width: 120,
    slots: { default: 'color' },
  },
  { field: 'description', title: '描述', minWidth: 200 },
  { field: 'sort', title: '排序', width: 100 },
  {
    field: 'status',
    title: '状态',
    width: 100,
    slots: { default: 'status' },
  },
  { field: 'createTime', title: '创建时间', width: 180 },
  {
    field: 'action',
    title: '操作',
    width: 200,
    fixed: 'right',
    slots: { default: 'action' },
  },
];

const mockData: Tag[] = [
  {
    id: 1,
    name: 'Vue3',
    color: '#42b883',
    description: 'Vue3 框架相关',
    sort: 1,
    status: 1,
    createTime: '2025-01-01 10:00:00',
  },
  {
    id: 2,
    name: 'React',
    color: '#61dafb',
    description: 'React 框架相关',
    sort: 2,
    status: 1,
    createTime: '2025-01-02 10:00:00',
  },
  {
    id: 3,
    name: 'Python',
    color: '#3776ab',
    description: 'Python 编程语言',
    sort: 3,
    status: 1,
    createTime: '2025-01-03 10:00:00',
  },
  {
    id: 4,
    name: 'FastAPI',
    color: '#009688',
    description: 'FastAPI 框架',
    sort: 4,
    status: 1,
    createTime: '2025-01-04 10:00:00',
  },
];

const gridOptions: VxeTableGridOptions<Tag> = {
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
  columns,
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            const filteredData = formValues?.name
              ? mockData.filter((item) => item.name.includes(formValues.name))
              : mockData;

            resolve({
              page: {
                total: filteredData.length,
              },
              result: filteredData,
            });
          }, 300);
        });
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });
const [QueryForm] = useVbenForm(formOptions);

const onActionClick = async (params: OnActionClickParams) => {
  const { action, row } = params;

  if (action === 'edit') {
    message.info(`编辑标签: ${row.name}`);
  } else if (action === 'delete') {
    message.info(`删除标签: ${row.name}`);
  }
};

const handleAdd = () => {
  message.info('添加标签');
};

const handleQuery = async (values: Record<string, any>) => {
  await gridApi.query(values);
};
</script>

<template>
  <div class="h-full p-4">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-semibold">标签管理</h2>
      <VbenButton @click="handleAdd">
        <template #icon>
          <MaterialSymbolsAdd />
        </template>
        添加标签
      </VbenButton>
    </div>

    <QueryForm @submit="handleQuery" />

    <Grid class="mt-4">
      <template #color="{ row }">
        <div class="flex items-center gap-2">
          <div
            class="h-6 w-6 rounded"
            :style="{ backgroundColor: row.color }"
          ></div>
          <span>{{ row.color }}</span>
        </div>
      </template>

      <template #status="{ row }">
        <span :class="row.status === 1 ? 'text-green-600' : 'text-red-600'">
          {{ row.status === 1 ? '启用' : '禁用' }}
        </span>
      </template>

      <template #action="{ row }">
        <VbenButton
          size="small"
          variant="link"
          @click="onActionClick({ action: 'edit', row })"
        >
          编辑
        </VbenButton>
        <VbenButton
          size="small"
          variant="link"
          class="text-red-600"
          @click="onActionClick({ action: 'delete', row })"
        >
          删除
        </VbenButton>
      </template>
    </Grid>
  </div>
</template>
