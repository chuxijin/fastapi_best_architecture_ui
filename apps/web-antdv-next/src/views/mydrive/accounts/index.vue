<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MyDriveAccount, MyDriveAccountPayload } from '#/api';

import { ref } from 'vue';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { AddData } from '@vben/icons';

import { message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createMyDriveAccountApi,
  deleteMyDriveAccountApi,
  getMyDriveAccountsApi,
  syncMyDriveAccountProfileApi,
  updateMyDriveAccountApi,
} from '#/api';

import {
  formatFileSize,
  getProviderOptions,
  getUsagePercent,
  myDriveAccountQuerySchema,
  useMyDriveAccountColumns,
} from './data';

const editingAccount = ref<MyDriveAccount>();
const savingAccount = ref(false);
const accountForm = ref({
  cookie: '',
  displayName: '',
  provider: 'baidu',
});

const queryFormOptions: VbenFormProps = {
  collapsed: false,
  schema: myDriveAccountQuerySchema,
  showCollapseButton: false,
  wrapperClass: 'grid-cols-1 md:grid-cols-4',
};

const gridOptions: VxeTableGridOptions<MyDriveAccount> = {
  columns: useMyDriveAccountColumns(),
  height: 'auto',
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        const response = await getMyDriveAccountsApi();
        const queryValues = formValues || {};
        const items = response.items.filter((account) => {
          return (
            !queryValues.provider || account.provider === queryValues.provider
          );
        });
        return {
          items,
          page: page.currentPage,
          size: page.pageSize,
          total: items.length,
        };
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
const [AccountModal, accountModalApi] = useVbenModal({
  class: 'w-4/5 max-w-2xl',
  destroyOnClose: true,
  async onConfirm() {
    if (!accountForm.value.displayName.trim()) {
      message.warning('请输入显示名称');
      return;
    }
    if (!accountForm.value.cookie.trim()) {
      message.warning('请粘贴网盘 Cookie');
      return;
    }

    const payload: MyDriveAccountPayload = {
      credential: { cookie: accountForm.value.cookie.trim() },
      display_name: accountForm.value.displayName.trim(),
      external_account_id: '',
      provider: accountForm.value.provider,
    };

    savingAccount.value = true;
    accountModalApi.lock();
    try {
      if (editingAccount.value) {
        await updateMyDriveAccountApi(editingAccount.value.id, payload);
        message.success('网盘账户已更新');
      } else {
        await createMyDriveAccountApi(payload);
        message.success('网盘账户已创建');
      }
      await accountModalApi.close();
      gridApi.query();
    } catch {
      message.error('保存网盘账户失败');
    } finally {
      savingAccount.value = false;
      accountModalApi.unlock();
    }
  },
});

function openAccountModal(account?: MyDriveAccount): void {
  editingAccount.value = account;
  accountForm.value = {
    cookie: '',
    displayName: account?.display_name || '',
    provider: account?.provider || 'baidu',
  };
  accountModalApi.open();
}

async function syncProfile(account: MyDriveAccount): Promise<void> {
  try {
    await syncMyDriveAccountProfileApi(account.id);
    message.success('账户资料已同步');
    gridApi.query();
  } catch {
    message.error('同步账户资料失败，请检查 Cookie / 凭证');
  }
}

async function removeAccount(account: MyDriveAccount): Promise<void> {
  try {
    await deleteMyDriveAccountApi(account.id);
    message.success('网盘账户已删除');
    gridApi.query();
  } catch {
    message.error('删除网盘账户失败，请确认没有文件空间正在使用该账户');
  }
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <VbenButton @click="openAccountModal()">
          <AddData class="size-5" />
          添加网盘账户
        </VbenButton>
      </template>

      <template #avatar="{ row }">
        <a-avatar :src="row.avatar_url" :size="40">
          {{ (row.display_name || row.username || row.provider).slice(0, 1) }}
        </a-avatar>
      </template>

      <template #usage="{ row }">
        <div class="space-y-1">
          <a-progress :percent="getUsagePercent(row)" size="small" />
          <div class="text-xs text-slate-500">
            {{ formatFileSize(row.used) }} / {{ formatFileSize(row.quota) }}
          </div>
        </div>
      </template>

      <template #vip="{ row }">
        <a-tag :color="row.vip_level ? 'gold' : 'default'">
          {{ row.vip_level || '普通用户' }}
        </a-tag>
      </template>

      <template #status="{ row }">
        <a-tag :color="row.status === 'active' ? 'success' : 'error'">
          {{ row.status }}
        </a-tag>
      </template>

      <template #operation="{ row }">
        <div class="flex items-center justify-center gap-2">
          <a-button size="small" type="primary" @click="syncProfile(row)">
            同步资料
          </a-button>
          <a-button size="small" @click="openAccountModal(row)">编辑</a-button>
          <a-popconfirm
            title="确定删除此网盘账户？"
            @confirm="removeAccount(row)"
          >
            <a-button danger size="small">删除</a-button>
          </a-popconfirm>
        </div>
      </template>
    </Grid>

    <AccountModal
      :confirm-loading="savingAccount"
      :title="editingAccount ? '编辑网盘账户' : '添加网盘账户'"
    >
      <a-alert
        class="mb-4"
        message="添加文件空间挂载前必须先创建网盘账户。请直接粘贴浏览器里复制出来的完整 Cookie，系统会自动保存为凭证。"
        type="info"
        show-icon
      />
      <a-form layout="vertical">
        <div class="grid gap-x-4 md:grid-cols-2">
          <a-form-item label="网盘类型" required>
            <a-select
              v-model:value="accountForm.provider"
              :disabled="Boolean(editingAccount)"
              :options="getProviderOptions()"
            />
          </a-form-item>
          <a-form-item label="显示名称" required>
            <a-input
              v-model:value="accountForm.displayName"
              :maxlength="128"
              placeholder="例如：我的百度账号"
            />
          </a-form-item>
        </div>
        <a-form-item label="Cookie" required>
          <a-textarea
            v-model:value="accountForm.cookie"
            :auto-size="{ minRows: 5, maxRows: 10 }"
            placeholder="直接粘贴完整 Cookie，例如：BDUSS=...; STOKEN=...; PANWEB=..."
          />
        </a-form-item>
        <div class="text-xs text-slate-500">
          编辑已有账户时，为安全起见不会回显旧
          Cookie；如需更新凭证，请重新粘贴新的 Cookie。
        </div>
      </a-form>
    </AccountModal>
  </Page>
</template>
