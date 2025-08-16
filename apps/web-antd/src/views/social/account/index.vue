<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type {
  CreateSocialAccountParams,
  SocialAccountDetail,
  SocialAccountListParams,
  UpdateSocialAccountParams,
} from '#/api';

import { h, ref } from 'vue';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { AddData } from '@vben/icons';

import { message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createSocialAccountApi,
  createSocialWorkApi,
  deleteSocialAccountApi,
  getSocialAccountListApi,
  SOCIAL_PLATFORM_OPTIONS,
  updateSocialAccountApi,
} from '#/api';
// import { useVbenModal as usePublishModal } from '@vben/common-ui';

const queryFormOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  schema: [
    {
      fieldName: 'platform',
      label: '平台',
      component: 'Select',
      componentProps: { options: SOCIAL_PLATFORM_OPTIONS, allowClear: true },
    },
    {
      fieldName: 'domain',
      label: '领域',
      component: 'Select',
      componentProps: {
        options: [
          { label: '四六级', value: 'cet' },
          { label: '考研', value: 'kaoyan' },
          { label: '公考', value: 'gongkao' },
          { label: '教资', value: 'jiaozhi' },
          { label: '影视', value: 'yingshi' },
          { label: '招聘', value: 'zhaopin' },
          { label: '玩偶', value: 'wanou' },
        ],
        allowClear: true,
      },
    },
    {
      fieldName: 'name',
      label: '账号名称',
      component: 'Input',
      componentProps: { placeholder: '输入名称' },
    },
  ],
};

const DOMAIN_TAGS: Record<string, { color: string; label: string }> = {
  cet: { label: '四六级', color: 'green' },
  kaoyan: { label: '考研', color: 'blue' },
  gongkao: { label: '公考', color: 'cyan' },
  jiaozhi: { label: '教资', color: 'gold' },
  yingshi: { label: '影视', color: 'purple' },
  zhaopin: { label: '招聘', color: 'orange' },
  wanou: { label: '玩偶', color: 'magenta' },
};

const columns: any[] = [
  { type: 'checkbox' as any, width: 40 },
  { field: 'id', title: 'ID', minWidth: 80 },
  { field: 'name', title: '账号名称', minWidth: 160 },
  { field: 'platform', title: '平台', minWidth: 100 },
  {
    field: 'domain',
    title: '领域',
    minWidth: 120,
    slots: {
      default: ({ row }: any) => {
        const conf = DOMAIN_TAGS[row.domain] || {
          label: row.domain,
          color: 'default',
        };
        return [
          h(
            'span',
            {
              class: 'ant-tag',
              style: 'background:#f0f0f0;border:none;color:#555',
            },
            conf.label,
          ),
        ];
      },
    },
  },
  {
    field: 'homepage',
    title: '主页',
    minWidth: 220,
    slots: {
      default: ({ row }: any) => [
        h(
          'a',
          {
            href: row.homepage,
            target: '_blank',
            class: 'text-blue-600 hover:underline',
          },
          row.homepage,
        ),
      ],
    },
  },
  { field: 'phone', title: '电话', minWidth: 120 },
  { field: 'created_time', title: '创建时间', minWidth: 180 },
  { field: 'updated_time', title: '更新时间', minWidth: 180 },
  {
    field: 'operation',
    title: '操作',
    width: 260,
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
        const params: SocialAccountListParams = {
          page: page.currentPage,
          size: page.pageSize,
          ...formValues,
        };
        const resp = await getSocialAccountListApi(params);
        return resp;
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: queryFormOptions,
  gridOptions,
});

const defaultForm = (): CreateSocialAccountParams => ({
  name: '',
  platform: 'douyin',
  domain: 'cet',
  homepage: '',
  phone: '',
  account_info: {},
});
const formData = ref<CreateSocialAccountParams>(defaultForm());
const editingId = ref<null | number>(null);

const [EditModal, editModalApi] = useVbenModal({
  class: 'w-[640px]',
  destroyOnClose: true,
  async onConfirm() {
    editModalApi.lock();
    try {
      if (editingId.value) {
        await updateSocialAccountApi(
          editingId.value,
          formData.value as UpdateSocialAccountParams,
        );
        message.success('更新成功');
      } else {
        await createSocialAccountApi(formData.value);
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
      const data = editModalApi.getData() as null | SocialAccountDetail;
      if (data) {
        editingId.value = data.id;
        formData.value = {
          name: data.name,
          platform: data.platform as any,
          domain: data.domain,
          homepage: data.homepage,
          phone: data.phone,
          account_info: data.account_info ?? {},
        };
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

async function onDelete(row: SocialAccountDetail) {
  await deleteSocialAccountApi([row.id]);
  message.success('删除成功');
  gridApi.query();
}

function onActionClick({ code, row }: OnActionClickParams) {
  switch (code) {
    case 'delete': {
      onDelete(row as SocialAccountDetail);
      break;
    }
    case 'edit': {
      editModalApi.setData(row);
      editModalApi.open();
      break;
    }
    case 'publish': {
      openPublishModal(row as SocialAccountDetail);
      break;
    }
  }
}

// 发布弹窗（完整表单）
const [PublishModal, publishModalApi] = useVbenModal({
  class: 'w-[720px]',
  destroyOnClose: true,
  async onConfirm() {
    publishModalApi.lock();
    try {
      const data = publishModalApi.getData() as any;
      if (!data?.work_url) {
        message.error('请填写作品地址');
        return;
      }
      await createSocialWorkApi({
        account_id: data.account_id,
        external_id: data.external_id || undefined,
        work_url: data.work_url,
        copywriting: {
          title: data.copywriting?.title || null,
          content: data.copywriting?.content || null,
          topics: data.copywriting?.topics || [],
        },
        published_at: data.published_at,
      } as any);
      message.success('发布成功');
      await publishModalApi.close();
    } finally {
      publishModalApi.unlock();
    }
  },
});

function openPublishModal(account: SocialAccountDetail) {
  publishModalApi.setData({
    account_id: account.id,
    external_id: '',
    work_url: '',
    copywriting: { title: '', content: '', topics: [] },
  });
  publishModalApi.open();
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <VbenButton type="primary" @click="onCreate">
          <AddData class="mr-1" /> 新增账号
        </VbenButton>
      </template>
      <template #operation="{ row }">
        <a-space>
          <a-button
            size="small"
            type="primary"
            @click="onActionClick({ code: 'publish', row })"
          >
            发布
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
    <EditModal :title="editingId ? '编辑账号' : '新增账号'">
      <a-form layout="vertical">
        <a-form-item label="平台">
          <a-select
            v-model:value="formData.platform"
            :options="SOCIAL_PLATFORM_OPTIONS"
          />
        </a-form-item>
        <a-form-item label="领域">
          <a-select
            v-model:value="formData.domain"
            :options="[
              { label: '四六级', value: 'cet' },
              { label: '考研', value: 'kaoyan' },
              { label: '公考', value: 'gongkao' },
              { label: '教资', value: 'jiaozhi' },
              { label: '影视', value: 'yingshi' },
              { label: '招聘', value: 'zhaopin' },
              { label: '玩偶', value: 'wanou' },
            ]"
          />
        </a-form-item>
        <a-form-item label="账号名称">
          <a-input v-model:value="formData.name" />
        </a-form-item>
        <a-form-item label="主页">
          <a-input v-model:value="formData.homepage" />
        </a-form-item>
        <a-form-item label="电话">
          <a-input v-model:value="formData.phone" />
        </a-form-item>
      </a-form>
    </EditModal>

    <!-- 发布作品弹窗 -->
    <PublishModal title="发布作品">
      <a-form layout="vertical">
        <a-form-item label="平台作品ID">
          <a-input
            :value="(publishModalApi.getData() as any)?.external_id"
            @update:value="
              (v: string) =>
                publishModalApi.setData({
                  ...(publishModalApi.getData() as any),
                  external_id: v,
                })
            "
          />
        </a-form-item>
        <a-form-item label="作品地址">
          <a-input
            :value="(publishModalApi.getData() as any)?.work_url"
            @update:value="
              (v: string) =>
                publishModalApi.setData({
                  ...(publishModalApi.getData() as any),
                  work_url: v,
                })
            "
          />
        </a-form-item>

        <a-form-item label="文案标题">
          <a-input
            :value="(publishModalApi.getData() as any)?.copywriting?.title"
            @update:value="
              (v: string) =>
                publishModalApi.setData({
                  ...(publishModalApi.getData() as any),
                  copywriting: {
                    ...((publishModalApi.getData() as any)?.copywriting || {}),
                    title: v,
                  },
                })
            "
          />
        </a-form-item>
        <a-form-item label="文案内容">
          <a-textarea
            rows="5"
            :value="(publishModalApi.getData() as any)?.copywriting?.content"
            @update:value="
              (v: string) =>
                publishModalApi.setData({
                  ...(publishModalApi.getData() as any),
                  copywriting: {
                    ...((publishModalApi.getData() as any)?.copywriting || {}),
                    content: v,
                  },
                })
            "
          />
        </a-form-item>
        <a-form-item label="话题（#分隔或逗号分隔）">
          <a-input
            placeholder="#话题1 #话题2 或 话题1,话题2"
            :value="
              (
                (publishModalApi.getData() as any)?.copywriting?.topics || []
              ).join(' ')
            "
            @update:value="
              (v: string) => {
                const topics = Array.from(
                  new Set(
                    (v || '')
                      .replace(/，/g, ',')
                      .split(/[#,\s,]+/)
                      .map((s) => s.trim())
                      .filter(Boolean),
                  ),
                );
                publishModalApi.setData({
                  ...(publishModalApi.getData() as any),
                  copywriting: {
                    ...((publishModalApi.getData() as any)?.copywriting || {}),
                    topics,
                  },
                });
              }
            "
          />
        </a-form-item>

        <!-- 可视化预览/自动转换 -->
        <div class="rounded-md border bg-gray-50 p-3">
          <div class="mb-2 font-medium">预览</div>
          <div class="text-base font-semibold">
            {{
              (publishModalApi.getData() as any)?.copywriting?.title ||
              '（无标题）'
            }}
          </div>
          <div class="whitespace-pre-wrap text-sm text-gray-700">
            {{
              (publishModalApi.getData() as any)?.copywriting?.content ||
              '（无内容）'
            }}
          </div>
          <div class="mt-2 flex flex-wrap gap-1">
            <a-tag
              v-for="tag in (publishModalApi.getData() as any)?.copywriting
                ?.topics || []"
              :key="tag"
            >
              #{{ tag }}
            </a-tag>
          </div>
        </div>
      </a-form>
    </PublishModal>
  </Page>
</template>
