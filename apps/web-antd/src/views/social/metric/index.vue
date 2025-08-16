<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  CreateSocialWorkMetricParams,
  SocialWorkMetricDetail,
  SocialWorkMetricListParams,
  UpdateSocialWorkMetricParams,
} from '#/api';

import { ref } from 'vue';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { AddData } from '@vben/icons';

import { message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createSocialWorkMetricApi,
  deleteSocialWorkMetricApi,
  getSocialWorkMetricListApi,
  updateSocialWorkMetricApi,
} from '#/api';

const queryFormOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  schema: [
    {
      fieldName: 'work_id',
      label: '作品ID',
      component: 'InputNumber',
      componentProps: { min: 1 },
    },
  ],
};

const columns: any[] = [
  { type: 'checkbox', width: 40 },
  { field: 'id', title: 'ID', minWidth: 80 },
  { field: 'work_id', title: '作品ID', minWidth: 120 },
  { field: 'view_count', title: '浏览量', minWidth: 120 },
  { field: 'like_count', title: '点赞', minWidth: 120 },
  { field: 'favorite_count', title: '收藏', minWidth: 120 },
  { field: 'comment_count', title: '评论', minWidth: 120 },
  { field: 'share_count', title: '分享', minWidth: 120 },
  { field: 'record_time', title: '记录时间', minWidth: 180 },
  { field: 'created_time', title: '创建时间', minWidth: 180 },
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
        const params: SocialWorkMetricListParams = {
          page: page.currentPage,
          size: page.pageSize,
          ...formValues,
        };
        const resp = await getSocialWorkMetricListApi(params);
        return resp;
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: queryFormOptions,
  gridOptions,
});

const defaultForm = (): CreateSocialWorkMetricParams => ({
  work_id: 0,
  view_count: 0,
  like_count: 0,
  favorite_count: 0,
  comment_count: 0,
});
const formData = ref<CreateSocialWorkMetricParams>(defaultForm());
const editingId = ref<null | number>(null);

const [EditModal, editModalApi] = useVbenModal({
  class: 'w-[720px]',
  destroyOnClose: true,
  async onConfirm() {
    editModalApi.lock();
    try {
      if (editingId.value) {
        await updateSocialWorkMetricApi(
          editingId.value,
          formData.value as UpdateSocialWorkMetricParams,
        );
        message.success('更新成功');
      } else {
        await createSocialWorkMetricApi(formData.value);
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
      const data = editModalApi.getData() as null | SocialWorkMetricDetail;
      if (data) {
        editingId.value = data.id;
        formData.value = {
          work_id: data.work_id,
          view_count: data.view_count,
          like_count: data.like_count,
          favorite_count: data.favorite_count,
          comment_count: data.comment_count,
          record_time: data.record_time,
        } as any;
      } else {
        editingId.value = null;
        formData.value = defaultForm();
      }
    }
  },
});

function onCreate() {
  editingId.value = null;
  formData.value = defaultForm();
  editModalApi.setData(null);
  editModalApi.open();
}

async function onDelete(row: SocialWorkMetricDetail) {
  await deleteSocialWorkMetricApi([row.id]);
  message.success('删除成功');
  gridApi.query();
}

// 无操作列
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <VbenButton type="primary" @click="onCreate">
          <AddData class="mr-1" /> 新增数据快照
        </VbenButton>
      </template>
    </Grid>
    <EditModal :title="editingId ? '编辑数据快照' : '新增数据快照'">
      <a-form layout="vertical">
        <a-form-item label="作品ID">
          <a-input-number v-model:value="formData.work_id" :min="1" />
        </a-form-item>
        <a-form-item label="浏览量">
          <a-input-number v-model:value="formData.view_count" :min="0" />
        </a-form-item>
        <a-form-item label="点赞">
          <a-input-number v-model:value="formData.like_count" :min="0" />
        </a-form-item>
        <a-form-item label="收藏">
          <a-input-number v-model:value="formData.favorite_count" :min="0" />
        </a-form-item>
        <a-form-item label="评论">
          <a-input-number v-model:value="formData.comment_count" :min="0" />
        </a-form-item>
        <a-form-item label="记录时间">
          <a-date-picker
            show-time
            v-model:value="(formData as any).record_time"
          />
        </a-form-item>
      </a-form>
    </EditModal>
  </Page>
</template>
