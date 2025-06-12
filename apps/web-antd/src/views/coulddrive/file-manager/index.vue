<script setup lang="ts">
import type {
  CoulddriveFileInfo,
  CoulddriveListFilesParams,
  CoulddriveRemoveParams,
  CoulddriveMkdirParams,
  CoulddriveDriveAccountDetail,
  CoulddriveUserListParams,
} from '#/api';

import { ref, computed } from 'vue';

import { Page } from '@vben/common-ui';
import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getCoulddriveFileListApi,
  removeCoulddriveFilesApi,
  createCoulddriveFolderApi,
  getCoulddriveUserListApi,
  DRIVE_TYPE_OPTIONS,
} from '#/api';

import { getQueryFormConfig, getTableColumns } from './data';
import { usePathNavigation } from '#/composables/usePathNavigation';

// 路径导航逻辑
const pathNavigation = usePathNavigation({
  onNavigate: () => {
    gridApi.query();
  },
  onEnterFolder: () => {
    gridApi.query();
  },
  onGoBack: () => {
    gridApi.query();
  }
});

const {
  currentPath,
  currentFileId,
  breadcrumbPaths,
  canGoBack,
  navigateToPath,
  navigateToFolder,
  goBack,
  resetPath
} = pathNavigation;

// 其他状态管理
const authToken = ref<string>('');
const accountOptions = ref<Array<{ label: string; value: number; cookies: string }>>([]);
const formData = ref({
  type: '',
  user_id: null as number | null,
});

// 获取账号列表
async function loadAccountOptions(type?: string) {
  if (!type) {
    accountOptions.value = [];
    return;
  }

  try {
    const params: CoulddriveUserListParams = {
      type,
      is_valid: true,
      page: 1,
      size: 100,
    };

    const response = await getCoulddriveUserListApi(params);
    const accounts = response.items || [];

    accountOptions.value = accounts.map((account: CoulddriveDriveAccountDetail) => ({
      label: `${account.username || account.user_id} (${account.type})`,
      value: account.id,
      cookies: account.cookies || '',
    }));
  } catch (error) {
    console.error('获取账号列表失败:', error);
    message.error('获取账号列表失败');
    accountOptions.value = [];
  }
}

// 设置认证Token
async function setAuthTokenFromAccount(accountId: number) {
  const account = accountOptions.value.find(acc => acc.value === accountId);
  if (account && account.cookies) {
    authToken.value = account.cookies;
  } else {
    message.error('账号认证信息缺失，请重新选择账号');
    authToken.value = '';
  }
}

// 表单变化处理
const handleFormChange = async (values: any) => {
  if (values.type && values.type !== formData.value.type) {
    formData.value.type = values.type;
    accountOptions.value = [];
    formData.value.user_id = null;

    await queryFormApi.setValues({
      type: values.type,
      user_id: null
    });

    await loadAccountOptions(values.type);
    const driveTypeLabel = DRIVE_TYPE_OPTIONS.find(option => option.value === values.type)?.label || values.type;
    message.info(`已切换到${driveTypeLabel}，请重新选择关联账号`);
  }

  if (values.user_id !== formData.value.user_id) {
    formData.value.user_id = values.user_id || null;

    if (values.user_id) {
      await setAuthTokenFromAccount(values.user_id);
      resetPath();
      gridApi.query();
      message.success('已选择账号，正在加载文件列表...');
    } else {
      authToken.value = '';
    }
  }
};

// 创建查询表单
const [QueryForm, queryFormApi] = useVbenForm(
  getQueryFormConfig(accountOptions, handleFormChange)
);

// 创建表格
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    height: 600,
    rowConfig: { keyField: 'file_id' },
    checkboxConfig: {},
    toolbarConfig: {
      refresh: { code: 'query' },
      export: true,
      print: true,
      custom: true,
      zoom: true,
    },
    menuConfig: {
      body: {
        options: [
          [
            { code: 'delete', name: '删除', icon: 'mdi:delete' },
            { code: 'share', name: '分享', icon: 'mdi:share' },
            { code: 'rename', name: '重命名', icon: 'mdi:rename-box' },
          ],
        ],
      },
    },
    columns: getTableColumns(),
    proxyConfig: {
      ajax: {
                 query: async ({ page }: { page: any }) => {
           if (!authToken.value && !formData.value.user_id) {
             message.warning('请先选择关联账号');
             return { items: [], total: 0 };
           }

           const params: CoulddriveListFilesParams = {
             drive_type: formData.value.type,
             file_path: currentPath.value,
             file_id: currentFileId.value,
             page: page.currentPage,
             size: page.pageSize,
           };
           return await getCoulddriveFileListApi(params, authToken.value);
         },
      },
    },
  },
  gridEvents: {
    cellDblclick: ({ row }: { row: CoulddriveFileInfo }) => {
      if (row.is_folder) {
        wrappedNavigateToFolder(row);
      }
    },
    menuClick: ({ menu, row }: { menu: any; row: CoulddriveFileInfo }) => {
      handleContextMenuClick(menu.code, row);
    },
  },
});

// 包装导航函数，添加权限检查
const wrappedNavigateToPath = (path: string, fileId: string = '0') => {
  if (!authToken.value && !formData.value.user_id) {
    message.warning('请先选择关联账号');
    return;
  }
  navigateToPath(path, fileId);
};

const wrappedNavigateToFolder = (folder: CoulddriveFileInfo) => {
  if (!authToken.value && !formData.value.user_id) {
    message.warning('请先选择关联账号');
    return;
  }
  navigateToFolder(folder);
};

const wrappedGoBack = () => {
  if (!authToken.value && !formData.value.user_id) {
    message.warning('请先选择关联账号');
    return;
  }
  goBack();
};

// 右键菜单处理
function handleContextMenuClick(code: string, row: CoulddriveFileInfo) {
  switch (code) {
    case 'delete':
      deleteFile(row.file_id, row.file_name);
      break;
    case 'share':
      message.info(`分享功能开发中: ${row.file_name}`);
      break;
    case 'rename':
      message.info(`重命名功能开发中: ${row.file_name}`);
      break;
  }
}

// 删除文件
function deleteFile(fileId: string, fileName: string) {
  const params: CoulddriveRemoveParams = {
    drive_type: formData.value.type,
    file_ids: [fileId],
  };
  removeCoulddriveFilesApi(params, authToken.value).then(() => {
    message.success(`删除文件 ${fileName} 成功`);
    gridApi.query();
  });
}

// 批量删除
function deleteSelectedFiles() {
  const selectedRows = (gridApi as any).getCheckboxRecords() as CoulddriveFileInfo[];
  if (selectedRows.length === 0) {
    message.warning('请选择要删除的文件');
    return;
  }

  const params: CoulddriveRemoveParams = {
    drive_type: formData.value.type,
    file_ids: selectedRows.map((row: CoulddriveFileInfo) => row.file_id),
  };

  removeCoulddriveFilesApi(params, authToken.value).then(() => {
    message.success(`成功删除 ${selectedRows.length} 个文件`);
    gridApi.query();
  });
}

// 创建文件夹
const [CreateFolderForm, createFolderFormApi] = useVbenForm({
  showDefaultActions: false,
  schema: [
    {
      component: 'Input',
      componentProps: { placeholder: '请输入文件夹名称' },
      fieldName: 'folder_name',
      label: '文件夹名称',
      rules: 'required',
    },
  ],
});

const [createFolderModal, createFolderModalApi] = useVbenModal({
  title: '创建文件夹',
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await createFolderFormApi.validate();
    if (valid) {
      createFolderModalApi.lock();
      const { folder_name } = await createFolderFormApi.getValues<{ folder_name: string }>();
      const params: CoulddriveMkdirParams = {
        drive_type: formData.value.type,
        file_path: currentPath.value + '/' + folder_name,
        file_name: folder_name,
      };
      try {
        await createCoulddriveFolderApi(params, authToken.value);
        await createFolderModalApi.close();
        message.success('创建文件夹成功');
        gridApi.query();
      } finally {
        createFolderModalApi.unlock();
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      createFolderFormApi.resetForm();
    }
  },
});


</script>

<template>
  <Page>
    <!-- 路径导航 -->
    <div class="mb-4 flex items-center gap-2 text-sm">
      <span class="text-gray-600">当前路径:</span>
      <div class="flex items-center bg-gray-100 px-2 py-1 rounded font-mono">
        <template v-for="(pathItem, index) in breadcrumbPaths" :key="index">
          <button
            class="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
            @click="wrappedNavigateToPath(pathItem.path, pathItem.file_id)"
          >
            {{ pathItem.name }}
          </button>
          <span v-if="index < breadcrumbPaths.length - 1" class="mx-1 text-gray-400">/</span>
        </template>
      </div>
      <button
        v-if="canGoBack"
        class="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        @click="wrappedGoBack"
      >
        返回上级
      </button>
    </div>

    <!-- 查询表单 -->
    <QueryForm class="mb-4" />

    <!-- 表格 -->
    <Grid>
      <template #toolbar-actions>
        <div class="flex gap-2">
          <button
            class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            @click="createFolderModalApi.open()"
          >
            新建文件夹
          </button>
          <button
            class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            @click="deleteSelectedFiles"
          >
            批量删除
          </button>
        </div>
      </template>
    </Grid>

    <!-- 创建文件夹弹窗 -->
    <component :is="createFolderModal">
      <CreateFolderForm />
    </component>
  </Page>
</template>
