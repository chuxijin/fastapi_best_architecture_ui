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

interface MaterialPackage {
  id: number;
  title: string;
  category: string;
  fileCount: number;
  size: string;
  price: number;
  downloadCount: number;
  status: number;
  createTime: string;
}

const querySchema: VbenFormProps['schema'] = [
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入资料包名称',
    },
    fieldName: 'title',
    label: '资料包名称',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入分类',
    },
    fieldName: 'category',
    label: '分类',
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
  { field: 'title', title: '资料包名称', minWidth: 200 },
  { field: 'category', title: '分类', width: 120 },
  { field: 'fileCount', title: '文件数量', width: 100 },
  { field: 'size', title: '大小', width: 100 },
  { field: 'price', title: '价格（元）', width: 120 },
  { field: 'downloadCount', title: '下载次数', width: 120 },
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
    width: 250,
    fixed: 'right',
    slots: { default: 'action' },
  },
];

const mockData: MaterialPackage[] = [
  {
    id: 1,
    title: 'Python 全栈开发资料包',
    category: '后端开发',
    fileCount: 45,
    size: '2.3 GB',
    price: 299,
    downloadCount: 1280,
    status: 1,
    createTime: '2025-01-01 10:00:00',
  },
  {
    id: 2,
    title: 'Vue3 项目实战资料包',
    category: '前端开发',
    fileCount: 32,
    size: '1.8 GB',
    price: 199,
    downloadCount: 2340,
    status: 1,
    createTime: '2025-01-02 10:00:00',
  },
  {
    id: 3,
    title: 'MySQL 性能优化资料包',
    category: '数据库',
    fileCount: 28,
    size: '1.2 GB',
    price: 249,
    downloadCount: 890,
    status: 1,
    createTime: '2025-01-03 10:00:00',
  },
  {
    id: 4,
    title: 'FastAPI 微服务架构资料包',
    category: '后端开发',
    fileCount: 38,
    size: '1.9 GB',
    price: 349,
    downloadCount: 560,
    status: 1,
    createTime: '2025-01-04 10:00:00',
  },
  {
    id: 5,
    title: 'Docker 容器化部署资料包',
    category: '运维',
    fileCount: 25,
    size: '980 MB',
    price: 179,
    downloadCount: 1120,
    status: 1,
    createTime: '2025-01-05 10:00:00',
  },
];

const gridOptions: VxeTableGridOptions<MaterialPackage> = {
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
            let filteredData = mockData;

            if (formValues?.title) {
              filteredData = filteredData.filter((item) =>
                item.title.includes(formValues.title),
              );
            }

            if (formValues?.category) {
              filteredData = filteredData.filter((item) =>
                item.category.includes(formValues.category),
              );
            }

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

  switch (action) {
    case 'delete': {
      message.info(`删除资料包: ${row.title}`);

      break;
    }
    case 'edit': {
      message.info(`编辑资料包: ${row.title}`);

      break;
    }
    case 'view': {
      message.info(`查看资料包: ${row.title}`);

      break;
    }
    // No default
  }
};

const handleAdd = () => {
  message.info('添加资料包');
};

const handleQuery = async (values: Record<string, any>) => {
  await gridApi.query(values);
};
</script>

<template>
  <div class="h-full p-4">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-semibold">资料包管理</h2>
      <VbenButton @click="handleAdd">
        <template #icon>
          <MaterialSymbolsAdd />
        </template>
        添加资料包
      </VbenButton>
    </div>

    <QueryForm @submit="handleQuery" />

    <Grid class="mt-4">
      <template #status="{ row }">
        <span :class="row.status === 1 ? 'text-green-600' : 'text-red-600'">
          {{ row.status === 1 ? '上架' : '下架' }}
        </span>
      </template>

      <template #action="{ row }">
        <VbenButton
          size="small"
          variant="link"
          @click="onActionClick({ action: 'view', row })"
        >
          查看
        </VbenButton>
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
