<script lang="ts" setup>
import type { CoulddriveDriveAccountDetail } from '#/api';
import type {
  McpConfigItem,
  UpsertMcpConfigParam,
} from '#/plugins/mcp_service/api';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { Page, VbenButton } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCoulddriveUserListApi } from '#/api';
import FileSelector from '#/components/FileSelector.vue';
import {
  deleteMcpConfigApi,
  getMcpConfigPagedApi,
  upsertMcpConfigApi,
} from '#/plugins/mcp_service/api';

import { useColumns } from './data';

type Row = McpConfigItem;

const [Grid, gridApi] = useVbenVxeGrid<Row>({
  gridOptions: {
    rowConfig: { keyField: 'id' },
    checkboxConfig: { highlight: true },
    height: 'auto',
    columnConfig: { resizable: true, isCurrent: true, isHover: true },
    columns: useColumns(onActionClick),
    pagerConfig: { enabled: true, pageSize: 10, pageSizes: [10, 20, 50, 100] },
    proxyConfig: {
      ajax: {
        query: async ({
          page,
        }: {
          page: { currentPage: number; pageSize: number };
        }) => {
          return await getMcpConfigPagedApi({
            page: page.currentPage,
            size: page.pageSize,
          });
        },
      },
    },
    toolbarConfig: { refresh: { code: 'query' }, custom: true, zoom: true },
  },
});

const editorOpen = ref(false);
const form = reactive<{
  field: string;
  id?: number;
  mcp: string;
  value: string;
}>({
  mcp: 'resource',
  field: '',
  value: '',
});
const ui = reactive<any>({});
const accountOptions = ref<
  Array<{ cookies: string; label: string; value: number }>
>([]);
const authToken = ref<string>('');
const fileSelectorVisible = ref(false);
const selectedFolderPath = ref<string>('');
const modalTitle = computed(() =>
  form.id ? $t('mcp_service.actions.edit') : $t('mcp_service.actions.create'),
);

function onRefresh() {
  gridApi.query();
}

function openCreate() {
  form.id = undefined;
  form.mcp = 'resource';
  form.field = 'quark_config';
  form.value = '';
  (ui as any).drive_account_id = undefined;
  (ui as any).target_folder_id = undefined;
  editorOpen.value = true;
}

function openEdit(row: Row) {
  form.id = row.id;
  form.mcp = row.mcp;
  form.field = (row as any).field;
  try {
    const parsed =
      typeof (row as any).value === 'object'
        ? (row as any).value
        : JSON.parse((row as any).value || '{}');
    (ui as any).drive_account_id = parsed?.account_id;
    (ui as any).target_folder_id = parsed?.folder_id;
    form.value = JSON.stringify(parsed, null, 2);
  } catch {
    form.value = '';
  }
  editorOpen.value = true;
}

async function onSubmit() {
  try {
    let jsonVal: null | Record<string, any> = null;
    if (form.field.endsWith('_config')) {
      jsonVal = {
        account_id: (ui as any).drive_account_id ?? undefined,
        folder_id: (ui as any).target_folder_id ?? undefined,
      };
    } else {
      try {
        jsonVal = JSON.parse(form.value || '{}');
      } catch {
        jsonVal = {};
      }
    }
    const payload: UpsertMcpConfigParam = {
      mcp: form.mcp,
      field: form.field,
      value: jsonVal || {},
    };
    await upsertMcpConfigApi(payload);
    message.success('已保存');
    editorOpen.value = false;
    onRefresh();
  } catch {
    message.error('保存失败');
  }
}

function onCancel() {
  editorOpen.value = false;
}

onMounted(onRefresh);

async function onDelete(row: Row) {
  if (!row.id) return;
  try {
    await deleteMcpConfigApi(row.id);
    message.success('删除成功');
    onRefresh();
  } catch {
    message.error('删除失败');
  }
}

function onActionClick({ code, row }: { code: string; row: Row }) {
  if (code === 'edit') openEdit(row);
  if (code === 'delete') onDelete(row);
}

// 加载夸克账户列表（有效账号）
async function loadQuarkAccounts() {
  try {
    const res = await getCoulddriveUserListApi({
      type: 'QuarkDrive',
      is_valid: true,
      page: 1,
      size: 100,
    } as any);
    const items = (res?.items || []) as CoulddriveDriveAccountDetail[];
    accountOptions.value = items.map((acc) => ({
      label: `${acc.username || acc.user_id} (${acc.type})`,
      value: acc.id,
      cookies: acc.cookies || '',
    }));
  } catch {
    accountOptions.value = [];
  }
}

// 监听账户选择，设置认证 token（保留选择器功能）
watch(
  () => (ui as any).drive_account_id,
  (val: number | undefined) => {
    const found = accountOptions.value.find((a) => a.value === val);
    authToken.value = found?.cookies || '';
  },
);

// 选择目标目录回调
function onFolderPicked(data: any) {
  const picked =
    Array.isArray(data?.selectedFiles) && data.selectedFiles.length > 0
      ? data.selectedFiles[0]
      : null;
  if (picked?.file_id) {
    (ui as any).target_folder_id = picked.file_id;
  } else if (data?.fileId) {
    (ui as any).target_folder_id = data.fileId;
  }
  selectedFolderPath.value = picked?.file_path || data?.path || '';
  fileSelectorVisible.value = false;
}

// 初始化加载账号
onMounted(() => {
  loadQuarkAccounts();
});
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <div class="flex gap-2">
          <VbenButton type="primary" @click="openCreate">新增配置</VbenButton>
        </div>
      </template>
    </Grid>

    <a-modal
      v-model:open="editorOpen"
      :title="modalTitle"
      @ok="onSubmit"
      @cancel="onCancel"
      width="900px"
    >
      <a-tabs>
        <a-tab-pane key="form" tab="可视化配置">
          <a-form :model="form" layout="vertical">
            <!-- 第一行：MCP 名称 -->
            <a-row :gutter="12">
              <a-col :span="24">
                <a-form-item label="MCP 名称">
                  <a-input
                    v-model:value="form.mcp"
                    :disabled="!!form.id"
                    placeholder="resource"
                  />
                </a-form-item>
              </a-col>
            </a-row>

            <!-- 第二行：配置字段与值 -->
            <a-row :gutter="12">
              <a-col :span="12">
                <a-form-item label="配置字段(field)">
                  <a-input
                    v-model:value="form.field"
                    placeholder="例如: quark_config / baidu_config"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item
                  label="配置值(value) JSON（非 _config 字段时使用）"
                >
                  <a-input
                    v-model:value="form.value"
                    placeholder='例如: {"k":"v"}'
                  />
                </a-form-item>
              </a-col>
            </a-row>

            <!-- 第三行：可选辅助（夸克选择器） -->
            <a-row :gutter="12">
              <a-col :span="12">
                <a-form-item label="夸克账户">
                  <a-select
                    v-model:value="(ui as any).drive_account_id"
                    :options="accountOptions"
                    placeholder="请选择夸克账户"
                    show-search
                    :filter-option="
                      (input: string, option: any) =>
                        (option?.label?.toLowerCase?.() || '').includes(
                          input.toLowerCase(),
                        )
                    "
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="目标目录">
                  <div class="flex items-center gap-2">
                    <a-button
                      type="default"
                      :disabled="!authToken"
                      @click="fileSelectorVisible = true"
                    >
                      选择目录
                    </a-button>
                    <a-input
                      v-model:value="(ui as any).target_folder_id"
                      placeholder="目标目录FID"
                    />
                  </div>
                  <div
                    v-if="selectedFolderPath"
                    class="mt-1 text-xs text-gray-500"
                  >
                    已选择：{{ selectedFolderPath }}
                  </div>
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>
        </a-tab-pane>
      </a-tabs>
    </a-modal>

    <!-- 目录选择器 -->
    <FileSelector
      v-model:visible="fileSelectorVisible"
      drive-type="QuarkDrive"
      :auth-token="authToken"
      mode="disk"
      title="选择目标目录"
      @confirm="onFolderPicked"
      @cancel="() => (fileSelectorVisible = false)"
    />
  </Page>
</template>

<style scoped></style>
