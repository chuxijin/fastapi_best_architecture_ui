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
const allAccounts = ref<CoulddriveDriveAccountDetail[]>([]); // 存储所有账户
const accountOptions = ref<
  Array<{ cookies: string; label: string; value: number }>
>([]);
const authToken = ref<string>('');
const fileSelectorVisible = ref(false);
const selectedFolderPath = ref<string>('');
const modalTitle = computed(() =>
  form.id ? $t('mcp_service.actions.edit') : $t('mcp_service.actions.create'),
);

const currentDriveType = computed(() => {
  if (form.field === 'quark_config') return 'QuarkDrive';
  if (form.field === 'baidu_config') return 'BaiduDrive';
  return ''; // 默认值或者其他情况
});

const driveAccountLabel = computed(() => {
  if (currentDriveType.value === 'QuarkDrive') return '夸克账户';
  if (currentDriveType.value === 'BaiduDrive') return '百度账户';
  return '网盘账户'; // 默认标签
});

const fieldOptions = computed(() => [
  { label: '夸克网盘配置', value: 'quark_config' },
  { label: '百度网盘配置', value: 'baidu_config' },
]);

function onRefresh() {
  gridApi.query();
}

function openCreate() {
  form.id = undefined;
  form.mcp = 'resource';
  form.field = 'quark_config'; // 默认选择夸克配置
  form.value = '';
  (ui as any).drive_account_id = undefined;
  (ui as any).target_folder_id = undefined;
  selectedFolderPath.value = '';
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
    // 确保selectedFolderPath在编辑时也能正确显示
    // 这里可能需要额外逻辑来从folder_id反查path，暂时留空
    selectedFolderPath.value = ''; // 清空，或者实现反查逻辑
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

// 初始加载所有账户
async function loadAllAccounts() {
  try {
    const res = await getCoulddriveUserListApi({
      page: 1,
      size: 100,
      is_valid: true,
    } as any);
    allAccounts.value = (res?.items || []) as CoulddriveDriveAccountDetail[];
  } catch (error: any) {
    message.error(`加载账户失败: ${error.message}`);
    allAccounts.value = [];
  }
}

// 根据当前选中的网盘类型筛选账户
watch(
  currentDriveType,
  (newType) => {
    if (newType) {
      accountOptions.value = allAccounts.value
        .filter((acc) => acc.type === newType)
        .map((acc) => ({
          label: `${acc.username || acc.user_id} (${acc.type})`,
          value: acc.id,
          cookies: acc.cookies || '',
        }));
    } else {
      accountOptions.value = [];
    }
    // 切换类型时清空已选账户和目录
    (ui as any).drive_account_id = undefined;
    (ui as any).target_folder_id = newType === 'BaiduDrive' ? '/' : undefined; // 百度网盘默认根路径为 '/'，夸克为空
    selectedFolderPath.value = newType === 'BaiduDrive' ? '/' : ''; // 确保显示路径也同步更新
  },
  { immediate: true }, // 立即执行一次，初始化账户列表
);

// 监听账户选择，设置认证 token
watch(
  () => (ui as any).drive_account_id,
  (val: number | undefined) => {
    const found = accountOptions.value.find((a) => a.value === val);
    authToken.value = found?.cookies || '';
  },
);

// 选择目标目录回调
function onFolderPicked(data: any) {
  console.log('onFolderPicked called with:', data);
  const picked =
    Array.isArray(data?.selectedFiles) && data.selectedFiles.length > 0
      ? data.selectedFiles[0]
      : null;

  if (currentDriveType.value === 'BaiduDrive') {
    // 百度网盘使用路径
    (ui as any).target_folder_id = picked?.file_path || data?.path || '';
  } else if (currentDriveType.value === 'QuarkDrive') {
    // 夸克网盘使用文件ID
    (ui as any).target_folder_id = picked?.file_id || '';
  }
  selectedFolderPath.value = picked?.file_path || data?.path || '';
  fileSelectorVisible.value = false;
}

// 初始化加载所有账户
onMounted(() => {
  loadAllAccounts();
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
                  <a-select
                    v-model:value="form.field"
                    :options="fieldOptions"
                    placeholder="请选择配置字段"
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
                <a-form-item :label="driveAccountLabel">
                  <a-select
                    v-model:value="(ui as any).drive_account_id"
                    :options="accountOptions"
                    :placeholder="`请选择${driveAccountLabel}`"
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
      :drive-type="currentDriveType"
      :auth-token="authToken"
      mode="disk"
      title="选择目标目录"
      @confirm="onFolderPicked"
      @cancel="() => (fileSelectorVisible = false)"
    />
  </Page>
</template>

<style scoped></style>
