<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, ref } from 'vue';

import { VbenButton } from '@vben/common-ui';

import { Alert, message, TabPane, Tabs, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

const props = defineProps<{
  bankId: number;
  bankName: string;
}>();

const activeTab = ref('bank');

const tabConfig = {
  bank: {
    title:
      '"题库加入"表示学员是通过管理员添加或购买该题库的激活码（通用激活码）激活的方式成为该题库的学员。',
    getColumns: () => [
      { field: 'id', title: 'ID', width: 80 },
      { field: 'student', title: '学员', minWidth: 150 },
      { field: 'join_info', title: '加入信息', minWidth: 200 },
      { field: 'open_time', title: '开通时间', width: 180 },
      { field: 'expire_time', title: '到期时间', width: 180 },
      {
        field: 'has_agreement',
        title: '已签协议',
        width: 100,
        slots: { default: 'agreement_default' },
      },
      {
        field: 'operation',
        title: '操作',
        align: 'center',
        width: 150,
        fixed: 'right',
        cellRender: {
          attrs: { nameField: 'student', onClick: onActionClick },
          name: 'CellOperation',
          options: [{ code: 'delete', text: '删除' }],
        },
      },
    ],
  },
  class: {
    title: '"班级加入"表示学员是通过加入班级的方式成为该题库的学员。',
    getColumns: () => [
      { field: 'id', title: 'ID', width: 80 },
      { field: 'student', title: '学员', minWidth: 150 },
      { field: 'join_info', title: '加入信息', minWidth: 200 },
      { field: 'expire_time', title: '到期时间', width: 180 },
      {
        field: 'has_agreement',
        title: '已签协议',
        width: 100,
        slots: { default: 'agreement_default' },
      },
      {
        field: 'operation',
        title: '操作',
        align: 'center',
        width: 150,
        fixed: 'right',
        cellRender: {
          attrs: { nameField: 'student', onClick: onActionClick },
          name: 'CellOperation',
          options: [{ code: 'delete', text: '删除' }],
        },
      },
    ],
  },
  vip: {
    title: '"VIP加入"表示学员是通过加入VIP的方式成为该题库的学员。',
    getColumns: () => [
      { field: 'id', title: 'ID', width: 80 },
      { field: 'student', title: '学员', minWidth: 150 },
      { field: 'join_info', title: '加入信息', minWidth: 200 },
      {
        field: 'has_agreement',
        title: '已签协议',
        width: 100,
        slots: { default: 'agreement_default' },
      },
      {
        field: 'operation',
        title: '操作',
        align: 'center',
        width: 150,
        fixed: 'right',
        cellRender: {
          attrs: { nameField: 'student', onClick: onActionClick },
          name: 'CellOperation',
          options: [{ code: 'delete', text: '删除' }],
        },
      },
    ],
  },
};

const currentConfig = computed(() => tabConfig[activeTab.value]);

function onActionClick({ code, row }: { code: string; row: any }) {
  switch (code) {
    case 'delete': {
      message.info(`删除学员功能开发中: ${row.student}`);
      break;
    }
  }
}

const queryFormOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  wrapperClass: 'grid-cols-4',
  submitButtonOptions: {
    content: '查询',
  },
  resetButtonOptions: {
    content: '重置',
  },
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入搜索关键字',
      },
      fieldName: 'keyword',
      label: '',
      formItemClass: 'md:col-span-3',
    },
  ],
};

const gridOptions: VxeTableGridOptions<any> = {
  rowConfig: {
    keyField: 'id',
    isHover: true,
  },
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
  columns: computed(() => currentConfig.value.getColumns()),
  proxyConfig: {
    ajax: {
      query: async (_, formValues) => {
        // TODO: 调用实际的API
        console.log('Query members:', {
          bankId: props.bankId,
          type: activeTab.value,
          keyword: formValues?.keyword,
        });
        return { total: 0, records: [] };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: queryFormOptions,
  gridOptions,
});

function onRefresh() {
  gridApi.query();
}

function handleTabChange(key: string) {
  activeTab.value = key;
  onRefresh();
}
</script>

<template>
  <div class="flex h-full flex-col">
    <Tabs
      v-model:active-key="activeTab"
      class="-mt-4 mb-3"
      @change="handleTabChange"
    >
      <TabPane key="bank" tab="题库加入" />
      <TabPane key="class" tab="班级加入" />
      <TabPane key="vip" tab="VIP加入" />
    </Tabs>

    <Alert :message="currentConfig.title" type="info" show-icon class="mb-3" />

    <div class="flex-1 overflow-hidden">
      <Grid class="h-full">
        <template #toolbar-actions>
          <VbenButton>学员</VbenButton>
        </template>

        <template #agreement_default="{ row }">
          <Tag :color="row.has_agreement ? 'green' : 'default'">
            {{ row.has_agreement ? '是' : '否' }}
          </Tag>
        </template>
      </Grid>
    </div>
  </div>
</template>
