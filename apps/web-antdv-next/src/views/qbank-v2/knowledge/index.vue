<script setup lang="ts">
import type { VbenFormProps, VbenFormSchema } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  CreateKnowledgePointParam,
  CreateKnowledgeSystemParam,
  GetKnowledgePointTreeNode,
  GetKnowledgeSystemListItem,
} from '#/api';

import { computed, nextTick, ref } from 'vue';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createKnowledgePointApi,
  createKnowledgeSystemApi,
  deleteKnowledgePointApi,
  getKnowledgePointsTreeApi,
  getKnowledgeSystemsApi,
  updateKnowledgePointApi,
  updateKnowledgeSystemApi,
} from '#/api';

import { formSchema, querySchema, useColumns } from './data';

const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  wrapperClass: 'grid-cols-1',
  submitButtonOptions: { content: '查询' },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<GetKnowledgeSystemListItem> = {
  rowConfig: { keyField: 'id', isHover: true },
  height: '100%',
  toolbarConfig: { refresh: { code: 'query' }, custom: true, zoom: true },
  columns: useColumns(onActionClick),
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return getKnowledgeSystemsApi({
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
}: {
  code: string;
  row: GetKnowledgeSystemListItem;
}) {
  switch (code) {
    case 'delete': {
      message.success('知识体系已删除');
      onRefresh();
      break;
    }
    case 'edit': {
      systemFormData.value = { ...row };
      systemModalApi.open();
      break;
    }
    case 'tree': {
      selectedSystem.value = row;
      loadTree(row.id);
      break;
    }
  }
}

const [Form, formApi] = useVbenForm({
  wrapperClass: 'md:grid-cols-2',
  showDefaultActions: false,
  schema: formSchema,
});

const systemFormData = ref<CreateKnowledgeSystemParam & { id?: number }>();
const systemModalTitle = computed(() =>
  systemFormData.value?.id ? '编辑知识体系' : '新建知识体系',
);

const [SystemModal, systemModalApi] = useVbenModal({
  class: 'w-5/12',
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      systemModalApi.lock();
      const data = await formApi.getValues<CreateKnowledgeSystemParam>();
      try {
        if (systemFormData.value?.id) {
          await updateKnowledgeSystemApi(systemFormData.value.id, data);
          message.success('体系更新成功');
        } else {
          await createKnowledgeSystemApi(data);
          message.success('体系创建成功');
        }
        await systemModalApi.close();
        onRefresh();
      } finally {
        systemModalApi.unlock();
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      nextTick(() => {
        formApi.resetForm();
        if (systemFormData.value) {
          formApi.setValues(systemFormData.value);
        }
      });
    }
  },
});

function addSystem() {
  systemFormData.value = undefined;
  systemModalApi.open();
}

const selectedSystem = ref<GetKnowledgeSystemListItem>();

async function loadTree(systemId: number) {
  const result: any = await getKnowledgePointsTreeApi(systemId);
  const nodes = result.points || result;
  treeGridApi.grid?.reloadData(nodes);
}

const treeGridOptions: VxeTableGridOptions<any> = {
  rowConfig: { keyField: 'id', isHover: true },
  height: 'auto',
  toolbarConfig: { refresh: { code: 'query' }, zoom: true },
  pagerConfig: { enabled: false },
  treeConfig: { transform: false, childrenField: 'children' },
  columns: [
    { field: 'name', title: '知识点名称', minWidth: 220, treeNode: true },
    { field: 'code', title: '编码', width: 120 },
    { field: 'sort_order', title: '排序', width: 80 },
    { field: 'question_count', title: '题目数', width: 80 },
    { field: 'description', title: '说明', minWidth: 200, showOverflow: true },
    {
      field: 'operation',
      title: '操作',
      width: 220,
      fixed: 'right',
      slots: { default: 'operation_default' },
    },
  ],
};

const treeFormOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: false,
  schema: [],
};

const [TreeGrid, treeGridApi] = useVbenVxeGrid({
  formOptions: treeFormOptions,
  gridOptions: treeGridOptions,
});

const expandAll = () => {
  treeGridApi.grid?.setAllTreeExpand(true);
};

const collapseAll = () => {
  treeGridApi.grid?.setAllTreeExpand(false);
};

const pointFormSchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'code',
    label: '知识点编码',
    rules: 'required',
  },
  {
    component: 'Input',
    fieldName: 'name',
    label: '知识点名称',
    rules: 'required',
  },
  { component: 'InputNumber', fieldName: 'sort_order', label: '排序' },
  {
    component: 'Textarea',
    fieldName: 'description',
    label: '说明',
    componentProps: { rows: 3 },
  },
];

const [PointForm, pointFormApi] = useVbenForm({
  wrapperClass: 'grid-cols-1',
  showDefaultActions: false,
  schema: pointFormSchema,
});

const pointFormData = ref<CreateKnowledgePointParam & { id?: number }>();
const pointModalTitle = computed(() =>
  pointFormData.value?.id ? '编辑知识点' : '新建知识点',
);

const [PointModal, pointModalApi] = useVbenModal({
  class: 'w-5/12',
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await pointFormApi.validate();
    if (valid) {
      pointModalApi.lock();
      const data = await pointFormApi.getValues<CreateKnowledgePointParam>();
      try {
        if (pointFormData.value?.id) {
          await updateKnowledgePointApi(pointFormData.value.id, data);
          message.success('知识点更新成功');
        } else {
          await createKnowledgePointApi(
            (selectedSystem.value as GetKnowledgeSystemListItem).id,
            data,
          );
          message.success('知识点创建成功');
        }
        await pointModalApi.close();
        loadTree((selectedSystem.value as GetKnowledgeSystemListItem).id);
      } finally {
        pointModalApi.unlock();
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      nextTick(() => {
        pointFormApi.resetForm();
        if (pointFormData.value) {
          pointFormApi.setValues(pointFormData.value);
        }
      });
    }
  },
});

function addChildPoint(parent: GetKnowledgePointTreeNode) {
  pointFormData.value = { parent_id: parent.id } as any;
  pointModalApi.open();
}

function addRootPoint() {
  pointFormData.value = undefined;
  pointModalApi.open();
}

function editPoint(point: GetKnowledgePointTreeNode) {
  pointFormData.value = { ...point };
  pointModalApi.open();
}

function deletePoint(point: GetKnowledgePointTreeNode) {
  deleteKnowledgePointApi(point.id).then(() => {
    message.success('知识点已删除');
    loadTree((selectedSystem.value as GetKnowledgeSystemListItem).id);
  });
}
</script>

<template>
  <Page auto-content-height>
    <template v-if="!selectedSystem">
      <Grid>
        <template #toolbar-actions>
          <VbenButton @click="addSystem">
            <MaterialSymbolsAdd class="size-5" />
            新建体系
          </VbenButton>
        </template>
      </Grid>
    </template>
    <template v-else>
      <TreeGrid>
        <template #toolbar-actions>
          <div class="flex items-center gap-3">
            <a-button size="small" @click="selectedSystem = undefined">
              返回体系列表
            </a-button>
            <span class="text-lg font-medium">{{ selectedSystem.name }}</span>
            <a-tag>{{ selectedSystem.version }}</a-tag>
            <VbenButton @click="addRootPoint()">
              <MaterialSymbolsAdd class="size-5" />
              添加根节点
            </VbenButton>
          </div>
        </template>

        <template #toolbar-tools>
          <a-button class="mr-2" type="primary" @click="expandAll">
            展开全部
          </a-button>
          <a-button type="primary" @click="collapseAll">折叠全部</a-button>
        </template>

        <template #operation_default="{ row }">
          <a-button size="small" type="link" @click="addChildPoint(row as any)">
            添加子节点
          </a-button>
          <a-button size="small" type="link" @click="editPoint(row as any)">
            编辑
          </a-button>
          <a-popconfirm
            title="确认删除该知识点？"
            @confirm="deletePoint(row as any)"
          >
            <a-button size="small" type="link" danger>删除</a-button>
          </a-popconfirm>
        </template>
      </TreeGrid>
    </template>

    <SystemModal :title="systemModalTitle">
      <Form />
    </SystemModal>
    <PointModal :title="pointModalTitle">
      <PointForm />
    </PointModal>
  </Page>
</template>
