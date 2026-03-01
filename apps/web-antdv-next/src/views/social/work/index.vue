<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  CreateSocialWorkParams,
  SocialWorkDetail,
  SocialWorkListParams,
  UpdateSocialWorkParams,
} from '#/api';

import { h, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createSocialWorkApi,
  deleteSocialWorkApi,
  getSocialWorkListApi,
  updateSocialWorkApi,
} from '#/api';

import SocialTrendModal from './SocialTrendModal.vue';

const queryFormOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  schema: [
    {
      fieldName: 'account_id',
      label: '账号ID',
      component: 'InputNumber',
      componentProps: { min: 1 },
    },
    { fieldName: 'external_id', label: '平台作品ID', component: 'Input' },
  ],
};

function deriveTitle(row: any): string {
  const t = row?.copywriting?.title;
  if (t && typeof t === 'string') {
    const v = t.trim();
    return v.length > 0 ? v : '';
  }
  return '';
}

const columns: any[] = [
  { type: 'checkbox' as any, width: 40 },
  {
    field: 'title',
    title: '标题',
    minWidth: 200,
    slots: { default: ({ row }: any) => [h('span', {}, deriveTitle(row))] },
  },
  { field: 'external_id', title: '平台作品ID', minWidth: 160 },
  {
    field: 'work_url',
    title: '作品地址',
    minWidth: 280,
    slots: {
      default: ({ row }: any) => [
        h(
          'a',
          {
            href: row.work_url,
            target: '_blank',
            class: 'text-blue-600 hover:underline',
          },
          row.work_url,
        ),
      ],
    },
  },
  { field: 'latest_view_count', title: '最新浏览量', minWidth: 120 },
  { field: 'latest_like_count', title: '最新点赞', minWidth: 120 },
  { field: 'latest_favorite_count', title: '最新收藏', minWidth: 120 },
  { field: 'latest_comment_count', title: '最新评论', minWidth: 120 },
  { field: 'latest_share_count', title: '最新分享', minWidth: 120 },
  { field: 'published_at', title: '发布时间', minWidth: 180 },
  {
    field: 'operation',
    title: '操作',
    width: 240,
    fixed: 'right',
    slots: { default: 'operation' },
  },
];

const gridOptions: VxeTableGridOptions = {
  height: 'auto',
  minHeight: 400,
  rowConfig: { keyField: 'id' },
  checkboxConfig: { highlight: true },
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
        const params: SocialWorkListParams = {
          page: page.currentPage,
          size: page.pageSize,
          ...formValues,
        };
        const resp = await getSocialWorkListApi(params);
        return resp;
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: queryFormOptions,
  gridOptions,
});

const defaultForm = (): CreateSocialWorkParams => ({
  account_id: 0,
  work_url: '',
  copywriting: {},
});
const formData = ref<CreateSocialWorkParams>(defaultForm());
const editingId = ref<null | number>(null);

const [EditModal, editModalApi] = useVbenModal({
  class: 'w-[720px]',
  destroyOnClose: true,
  async onConfirm() {
    editModalApi.lock();
    try {
      if (editingId.value) {
        await updateSocialWorkApi(
          editingId.value,
          formData.value as UpdateSocialWorkParams,
        );
        message.success('更新成功');
      } else {
        await createSocialWorkApi(formData.value);
        message.success('创建成功');
      }
      await editModalApi.close();
      gridApi.query();
    } finally {
      editModalApi.unlock();
    }
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const data = editModalApi.getData() as null | SocialWorkDetail;
      if (data) {
        editingId.value = data.id;
        formData.value = {
          account_id: data.account_id,
          work_url: data.work_url,
          external_id: data.external_id,
          copywriting: data.copywriting ?? {},
          published_at: data.published_at,
        } as any;
      } else {
        editingId.value = null;
        formData.value = defaultForm();
      }
    }
  },
});

// 无新增按钮，发布入口在账号页

async function onDelete(row: SocialWorkDetail) {
  await deleteSocialWorkApi([row.id]);
  message.success('删除成功');
  gridApi.query();
}

function onActionClick({ code, row }: any) {
  switch (code) {
    case 'delete': {
      onDelete(row as SocialWorkDetail);
      break;
    }
    case 'edit': {
      editModalApi.setData(row);
      editModalApi.open();
      break;
    }
    case 'trend': {
      openTrend(row as SocialWorkDetail);
      break;
    }
  }
}

// 趋势查看（独立组件）
const trendRef = ref<InstanceType<typeof SocialTrendModal> | null>(null);
function openTrend(row: SocialWorkDetail) {
  trendRef.value?.openWith(row.id);
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions></template>
      <template #operation="{ row }">
        <a-space>
          <a-button
            size="small"
            type="primary"
            @click="onActionClick({ code: 'trend', row })"
          >
            查看趋势
          </a-button>
          <a-button size="small" @click="onActionClick({ code: 'edit', row })">
            编辑
          </a-button>
          <a-button
            size="small"
            danger
            @click="onActionClick({ code: 'delete', row })"
          >
            删除
          </a-button>
        </a-space>
      </template>
    </Grid>
    <EditModal :title="editingId ? '编辑作品' : '新增作品'">
      <a-form layout="vertical">
        <a-form-item label="作品地址">
          <a-input v-model:value="formData.work_url" />
        </a-form-item>
      </a-form>
    </EditModal>
    <SocialTrendModal ref="trendRef" :work-id="null" />
  </Page>
</template>
