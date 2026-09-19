<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MyDriveResource, MyDriveResourcePayload } from '#/api';

import { computed, onMounted, ref, watch } from 'vue';

import { Page, VbenButton } from '@vben/common-ui';
import { AddData } from '@vben/icons';

import { message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  cancelMyDriveResourceShareApi,
  createMyDriveResourceApi,
  deleteMyDriveResourceApi,
  getMyDriveAccountsApi,
  getMyDriveResourcesApi,
  getMyDriveResourceViewTrendApi,
  rebuildMyDriveResourceShareApi,
  refreshMyDriveResourceShareApi,
  updateMyDriveResourceApi,
} from '#/api';
import { parseShareLink } from '#/utils/share';

import {
  createResourceColumns,
  getCategoryTreeOptions,
  RESOURCE_TYPE_OPTIONS,
  resourceQuerySchema,
} from './data';
import ResourceImageUploaders from './modules/ResourceImageUploaders.vue';

const drawerOpen = ref(false);
const saving = ref(false);
const editingResource = ref<MyDriveResource>();
const accounts = ref<{ label: string; value: number }[]>([]);
const categoryTree = ref<any[]>([]);
const form = ref(createEmptyForm());
const trendOpen = ref(false);
const trendLoading = ref(false);
const trendResource = ref<MyDriveResource>();
const trendData = ref<
  { id: number; record_time: string; view_count: number }[]
>([]);
const resourceImageText = computed({
  get: () =>
    form.value.images
      .map((image) => String(image || '').trim())
      .filter(Boolean)
      .join('\n'),
  set: (value: string) => {
    form.value.images = value
      .split(/\r?\n/)
      .map((image) => image.trim())
      .filter(Boolean);
  },
});

watch(
  () => form.value.share.share_url,
  (newVal) => {
    if (!newVal) return;
    const parsed = parseShareLink(newVal);
    if (parsed) {
      if (parsed.url !== newVal.trim()) {
        form.value.share.share_url = parsed.url;
      }
      if (parsed.passcode) {
        form.value.share.extract_code = parsed.passcode;
      }
    }
  },
);

const queryFormOptions: VbenFormProps = {
  collapsed: false,
  schema: resourceQuerySchema,
  showCollapseButton: false,
  wrapperClass: 'grid-cols-4',
};

const gridOptions: VxeTableGridOptions = {
  columns: createResourceColumns(),
  height: 'auto',
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        try {
          return await getMyDriveResourcesApi({
            page: page.currentPage,
            size: page.pageSize,
            ...formValues,
          });
        } catch {
          message.error('获取资源列表失败');
          return { items: [], total: 0 };
        }
      },
    },
  },
  rowConfig: { keyField: 'id' },
  toolbarConfig: {
    custom: true,
    refresh: true,
    refreshOptions: { code: 'query' },
    zoom: true,
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: queryFormOptions,
  gridOptions,
});

function createEmptyForm(): MyDriveResourcePayload {
  return {
    audit_status: 'approved',
    category_id: undefined as unknown as number,
    content: '',
    description: '',
    images: [],
    org_name: '',
    resource_expired_at: null,
    resource_type: '',
    share: {
      account_id: null,
      expires_in_days: 0,
      extract_code: '',
      file_id: '',
      file_name: '',
      file_path: '',
      file_size: null,
      file_type: '',
      is_directory: false,
      provider: 'quark',
      share_audit_status: 'unknown',
      share_expired_at: null,
      share_id: '',
      share_key: '',
      share_meta: {},
      share_status: 'unknown',
      share_title: '',
      share_url: '',
      source_ref: {},
      source_type: 'imported_link',
    },
    sort: 0,
    status: 'enabled',
    tags: [],
    temp_policy: 0,
    title: '',
  };
}

onMounted(async () => {
  categoryTree.value = await getCategoryTreeOptions();
  try {
    const accountData = await getMyDriveAccountsApi();
    accounts.value = accountData.items.map((account) => ({
      label: `${account.display_name || account.username || account.external_account_id} (${account.provider})`,
      value: account.id,
    }));
  } catch {
    accounts.value = [];
  }
});

function openDrawer(resource?: MyDriveResource): void {
  editingResource.value = resource;
  if (!resource) {
    form.value = createEmptyForm();
    drawerOpen.value = true;
    return;
  }
  form.value = {
    audit_status: resource.audit_status,
    category_id: resource.category_id,
    content: resource.content,
    description: resource.description,
    images: resource.images,
    org_name: resource.org_name,
    resource_expired_at: resource.resource_expired_at,
    resource_type: resource.resource_type,
    share: resource.share || createEmptyForm().share,
    sort: resource.sort,
    status: resource.status,
    tags: resource.tags,
    temp_policy: resource.temp_policy,
    title: resource.title,
  };
  drawerOpen.value = true;
}

function validateForm(): boolean {
  if (!form.value.title.trim()) {
    message.warning('请输入资源标题');
    return false;
  }
  if (!form.value.category_id) {
    message.warning('请选择分类');
    return false;
  }
  if (!form.value.resource_type.trim()) {
    message.warning('请选择资源类型');
    return false;
  }
  if (!form.value.share.provider.trim() || !form.value.share.share_url.trim()) {
    message.warning('请输入网盘类型和分享链接');
    return false;
  }
  if (!form.value.share.account_id) {
    message.warning('请选择关联账号，否则分享链接无法解析');
    return false;
  }
  return true;
}

async function saveResource(): Promise<void> {
  if (!validateForm()) return;
  saving.value = true;
  try {
    if (editingResource.value) {
      await updateMyDriveResourceApi(editingResource.value.id, form.value);
      message.success('资源已更新');
    } else {
      await createMyDriveResourceApi(form.value);
      message.success('资源已创建');
    }
    drawerOpen.value = false;
    gridApi.query();
  } catch {
    message.error('保存资源失败');
  } finally {
    saving.value = false;
  }
}

function appendResourceImages(images: string[]): void {
  form.value.images = [
    ...new Set([...form.value.images.map(String), ...images]),
  ];
}

function removeResourceImage(image: string): void {
  form.value.images = form.value.images.filter((item) => item !== image);
}

async function removeResource(resource: MyDriveResource): Promise<void> {
  try {
    await deleteMyDriveResourceApi(resource.id);
    message.success('资源已删除');
    gridApi.query();
  } catch {
    message.error('删除资源失败');
  }
}

async function refreshShare(resource: MyDriveResource): Promise<void> {
  try {
    await refreshMyDriveResourceShareApi(resource.id);
    message.success('分享信息已刷新');
    gridApi.query();
  } catch {
    message.error('刷新分享信息失败');
  }
}

async function rebuildShare(resource: MyDriveResource): Promise<void> {
  try {
    await rebuildMyDriveResourceShareApi(resource.id);
    message.success('分享链接已重新创建');
    gridApi.query();
  } catch {
    message.error('重新创建分享失败');
  }
}

async function cancelShare(resource: MyDriveResource): Promise<void> {
  try {
    await cancelMyDriveResourceShareApi(resource.id);
    message.success('分享链接已取消');
    gridApi.query();
  } catch {
    message.error('取消分享链接失败');
  }
}

async function openTrend(resource: MyDriveResource): Promise<void> {
  trendResource.value = resource;
  trendOpen.value = true;
  trendLoading.value = true;
  try {
    const data = await getMyDriveResourceViewTrendApi(resource.id);
    trendData.value = data.items;
  } catch {
    trendData.value = [];
    message.error('获取趋势数据失败');
  } finally {
    trendLoading.value = false;
  }
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <VbenButton @click="openDrawer()">
          <AddData class="size-5" />
          新增资源
        </VbenButton>
      </template>
      <template #operation="{ row }">
        <div class="flex items-center justify-center gap-2">
          <a-button size="small" @click="openTrend(row)">趋势</a-button>
          <a-button size="small" @click="refreshShare(row)">刷新</a-button>
          <a-button size="small" @click="rebuildShare(row)">重建</a-button>
          <a-popconfirm
            title="确定取消此资源的分享链接？"
            @confirm="cancelShare(row)"
          >
            <a-button danger size="small">取消分享</a-button>
          </a-popconfirm>
          <a-button size="small" type="primary" @click="openDrawer(row)">
            编辑
          </a-button>
          <a-popconfirm title="确定删除此资源？" @confirm="removeResource(row)">
            <a-button danger size="small">删除</a-button>
          </a-popconfirm>
        </div>
      </template>
    </Grid>

    <a-drawer
      v-model:open="drawerOpen"
      :title="editingResource ? '编辑资源' : '新增资源'"
      size="large"
    >
      <a-form class="space-y-4" layout="vertical">
        <div class="rounded-lg bg-gray-50 p-4">
          <h3 class="mb-4 text-lg font-medium">资源信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <a-form-item label="分类 ID" required>
              <a-tree-select
                v-model:value="form.category_id"
                allow-clear
                class="w-full"
                :field-names="{
                  label: 'label',
                  value: 'value',
                  children: 'children',
                }"
                placeholder="请选择分类"
                :tree-data="categoryTree"
              />
            </a-form-item>
            <a-form-item label="资源类型" required>
              <a-select
                v-model:value="form.resource_type"
                :options="RESOURCE_TYPE_OPTIONS"
                placeholder="请选择资源类型"
              />
            </a-form-item>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <a-form-item label="资源标题" required>
              <a-input v-model:value="form.title" />
            </a-form-item>
            <a-form-item label="机构/老师">
              <a-input v-model:value="form.org_name" />
            </a-form-item>
          </div>
          <a-form-item label="资源介绍">
            <a-textarea v-model:value="form.description" :rows="3" />
          </a-form-item>
          <a-form-item label="资源图片（每行一个）">
            <a-textarea
              v-model:value="resourceImageText"
              :rows="3"
              placeholder="上传文件后自动生成，也可以每行填写一个图片链接"
            />
          </a-form-item>
          <ResourceImageUploaders @images="appendResourceImages" />
          <div v-if="form.images.length > 0" class="mt-4 flex flex-wrap gap-3">
            <div
              v-for="image in form.images"
              :key="String(image)"
              class="group relative"
            >
              <img
                :src="String(image)"
                alt="资源缩略图"
                class="h-20 w-28 rounded border object-cover"
              />
              <a-button
                class="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100"
                danger
                size="small"
                @click="removeResourceImage(String(image))"
              >
                移除
              </a-button>
            </div>
          </div>
        </div>

        <div class="rounded-lg bg-gray-50 p-4">
          <h3 class="mb-4 text-lg font-medium">分享链接</h3>
          <a-form-item label="分享链接" required>
            <a-input
              v-model:value="form.share.share_url"
              placeholder="粘贴完整分享链接，提取码自动解析"
            />
          </a-form-item>
          <div class="grid grid-cols-2 gap-4">
            <a-form-item label="关联账号">
              <a-select
                v-model:value="form.share.account_id"
                allow-clear
                :options="accounts"
                placeholder="解析/刷新/重建时使用"
              />
            </a-form-item>
            <a-form-item label="网盘类型" required>
              <a-select
                v-model:value="form.share.provider"
                :options="[
                  { label: '百度', value: 'baidu' },
                  { label: '夸克', value: 'quark' },
                  { label: '迅雷', value: 'thunder' },
                ]"
              />
            </a-form-item>
          </div>
        </div>

        <div class="rounded-lg bg-gray-50 p-4">
          <h3 class="mb-4 text-lg font-medium">状态设置</h3>
          <div class="grid grid-cols-3 gap-4">
            <a-form-item label="状态">
              <a-select
                v-model:value="form.status"
                :options="[
                  { label: '启用', value: 'enabled' },
                  { label: '停用', value: 'disabled' },
                ]"
              />
            </a-form-item>
            <a-form-item label="临时策略">
              <a-select
                v-model:value="form.temp_policy"
                :options="[
                  { label: '无操作', value: 0 },
                  { label: '定时删除', value: 1 },
                  { label: '到期前刷新 7 天', value: 2 },
                  { label: '定时更新分享信息', value: 3 },
                ]"
              />
            </a-form-item>
            <a-form-item label="排序">
              <a-input-number
                v-model:value="form.sort"
                class="w-full"
                :min="0"
              />
            </a-form-item>
          </div>
        </div>
      </a-form>
      <template #footer>
        <div class="flex justify-end gap-2">
          <a-button @click="drawerOpen = false">取消</a-button>
          <a-button :loading="saving" type="primary" @click="saveResource">
            保存
          </a-button>
        </div>
      </template>
    </a-drawer>

    <a-modal
      v-model:open="trendOpen"
      :footer="null"
      :title="`浏览趋势 - ${trendResource?.title || ''}`"
      width="760px"
    >
      <a-spin :spinning="trendLoading">
        <div class="space-y-4">
          <div class="grid grid-cols-3 gap-3">
            <div class="rounded-lg bg-slate-50 p-3">
              <div class="text-xs text-slate-500">当前浏览</div>
              <div class="text-xl font-semibold">
                {{ trendResource?.view_count || 0 }}
              </div>
            </div>
            <div class="rounded-lg bg-slate-50 p-3">
              <div class="text-xs text-slate-500">记录点</div>
              <div class="text-xl font-semibold">{{ trendData.length }}</div>
            </div>
            <div class="rounded-lg bg-slate-50 p-3">
              <div class="text-xs text-slate-500">最新记录</div>
              <div class="text-sm font-medium">
                {{ trendData[trendData.length - 1]?.record_time || '-' }}
              </div>
            </div>
          </div>
          <div class="h-72 rounded-lg border bg-white p-4">
            <div
              v-if="trendData.length === 0"
              class="flex h-full items-center justify-center text-slate-400"
            >
              暂无趋势数据
            </div>
            <div v-else class="flex h-full items-end gap-2">
              <div
                v-for="item in trendData"
                :key="item.id"
                class="flex flex-1 flex-col items-center gap-2"
              >
                <div
                  class="w-full rounded-t bg-blue-500"
                  :style="{
                    height: `${Math.max(8, Math.min(220, item.view_count * 8))}px`,
                  }"
                ></div>
                <div class="max-w-16 truncate text-[10px] text-slate-500">
                  {{ item.view_count }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </a-spin>
    </a-modal>
  </Page>
</template>
