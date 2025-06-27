<script setup lang="ts">
import type {
  CoulddriveFileInfo,
  CoulddriveListFilesParams,
  CoulddriveRemoveParams,
  CoulddriveMkdirParams,
  CoulddriveDriveAccountDetail,
  CoulddriveUserListParams,
  CoulddriveTransferParams,
  CoulddriveShareParams,
  CoulddriveShareInfo,
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
  getCoulddriveShareFileListApi,
  transferCoulddriveFilesApi,
  createCoulddriveShareApi,
  DRIVE_TYPE_OPTIONS,
} from '#/api';
import { invalidateCache } from '#/api/request';

import { getQueryFormConfig, getTableColumns } from './data';
import { usePathNavigation } from '#/composables/usePathNavigation';
import FileSelector from '#/components/FileSelector.vue';

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
    height: 'auto',
    maxHeight: 600,
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
      openShareModal(row);
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
    // 清除文件相关缓存
    invalidateCache('file');
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
    // 清除文件相关缓存
    invalidateCache('file');
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
        // 清除文件相关缓存
        invalidateCache('file');
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

// 保存分享文件相关状态
const fileSelectorVisible = ref(false);
const shareLink = ref('');
const loadingShareFiles = ref(false);

// 保存分享文件表单
const [SaveShareForm, saveShareFormApi] = useVbenForm({
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1',
  schema: [
    {
      component: 'Input',
      componentProps: { placeholder: '请输入网盘链接' },
      fieldName: 'share_link',
      label: '网盘链接',
      rules: 'required',
    },
  ],
});

const [saveShareModal, saveShareModalApi] = useVbenModal({
  title: '保存分享文件',
  destroyOnClose: true,
  centered: true,
  async onConfirm() {
    if (!formData.value.type || !formData.value.user_id) {
      message.error('请先选择账号');
      return;
    }

    const { valid } = await saveShareFormApi.validate();
    if (valid) {
      const { share_link } = await saveShareFormApi.getValues<{ share_link: string }>();
      shareLink.value = share_link;

      // 关闭当前模态框，打开文件选择器
      await saveShareModalApi.close();
      fileSelectorVisible.value = true;
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      saveShareFormApi.resetForm();
      // 根据选择的网盘类型更新占位符
      const driveTypeLabel = DRIVE_TYPE_OPTIONS.find(option => option.value === formData.value.type)?.label || '网盘';
      saveShareFormApi.updateSchema([
        {
          component: 'Input',
          componentProps: { placeholder: `请输入${driveTypeLabel}链接` },
          fieldName: 'share_link',
          label: '网盘链接',
          rules: 'required',
        },
      ]);
    }
  },
});

// 打开保存分享文件模态框
function openSaveShareModal() {
  if (!formData.value.type || !formData.value.user_id) {
    message.warning('请先选择账号');
    return;
  }
  saveShareModalApi.open();
}

// 处理文件选择确认
async function handleFileSelectConfirm(data: any) {
  console.log('选择的文件:', data);

  if (!data.selectedFiles || data.selectedFiles.length === 0) {
    message.warning('请选择要保存的文件');
    return;
  }

      try {
    // 从选中的文件中提取转存所需的元数据
    const firstFile = data.selectedFiles[0];
    const fileExt = firstFile.file_ext || {};

    // 构造文件扩展信息，包含每个文件的扩展信息
    const filesExtInfo = data.selectedFiles.map((file: CoulddriveFileInfo) => ({
      file_id: file.file_id,
      file_ext: file.file_ext || {}
    }));

    // 提取所有文件的share_fid_tokens
    const shareFidTokens = data.selectedFiles.map((file: CoulddriveFileInfo) =>
      file.file_ext?.share_fid_token || ''
    );

    // 构造转存参数
    const transferParams: CoulddriveTransferParams = {
      drive_type: formData.value.type,
      source_type: 'link', // 分享链接类型
      source_id: shareLink.value,
      source_path: data.currentPath || '/', // 分享文件的当前路径
      target_path: currentPath.value, // 保存到当前目录
      file_ids: data.selectedFiles.map((file: CoulddriveFileInfo) => file.file_id), // 选中的文件ID列表
      ext: {
        // 展开第一个文件的扩展信息作为基础信息
        ...fileExt,
        // 添加目标目录和文件扩展信息
        to_pdir_fid: currentFileId.value || '0', // 目标目录的file_id
        target_id: currentFileId.value || '0', // 目标目录的file_id（放在ext中）
        pdir_fid: data.fileId || '0', // 分享文件的父目录ID
        files_ext_info: filesExtInfo, // 所有文件的扩展信息
        share_fid_tokens: shareFidTokens, // 所有文件的share_fid_token
      }
    };

            // 调用转存接口
    await transferCoulddriveFilesApi(transferParams, authToken.value);

    message.success(`成功保存 ${data.selectedFiles.length} 个文件到当前目录`);
    fileSelectorVisible.value = false;

    // 清除所有文件相关缓存
    invalidateCache('file');

    // 强制刷新文件列表，确保显示新转存的文件
    try {
      const params = {
        drive_type: formData.value.type,
        file_path: currentPath.value,
        file_id: currentFileId.value,
        page: 1,
        size: 20,
        recursive: false,
      };

      // 使用禁用缓存的配置强制获取最新数据
      await getCoulddriveFileListApi(params, authToken.value, { disableCache: true });

      // 然后再调用正常的刷新
      gridApi.query();
    } catch (error) {
      console.error('强制刷新失败:', error);
      // 如果强制刷新失败，还是调用正常刷新
      gridApi.query();
    }
  } catch (error) {
    console.error('保存文件失败:', error);
    message.error('保存文件失败，请重试');
  }
}

// 处理文件选择取消
function handleFileSelectCancel() {
  fileSelectorVisible.value = false;
}

// 创建分享相关状态
const currentShareFile = ref<CoulddriveFileInfo | null>(null);

// 创建分享表单
const [CreateShareForm, createShareFormApi] = useVbenForm({
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1',
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入文件名',
        disabled: true,
      },
      fieldName: 'file_name',
      label: '文件名',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        options: [
          { label: '1天', value: 1 },
          { label: '7天', value: 7 },
          { label: '30天', value: 30 },
          { label: '永久有效', value: 0 },
        ],
      },
      fieldName: 'expired_type',
      label: '有效期',
      defaultValue: 7,
    },
  ],
});

const [createShareModal, createShareModalApi] = useVbenModal({
  title: '创建分享',
  destroyOnClose: true,
  centered: true,
  async onConfirm() {
    if (!formData.value.type || !formData.value.user_id) {
      message.error('请先选择账号');
      return;
    }

    if (!currentShareFile.value) {
      message.error('没有选择要分享的文件');
      return;
    }

    const { valid } = await createShareFormApi.validate();
    if (valid) {
      createShareModalApi.lock();
      try {
        const formValues = await createShareFormApi.getValues<{
          file_name: string;
          expired_type: number;
        }>();

        const shareParams: CoulddriveShareParams = {
          drive_type: formData.value.type,
          file_name: formValues.file_name,
          file_ids: [currentShareFile.value.file_id],
          expired_type: formValues.expired_type,
        };

        const result = await createCoulddriveShareApi(shareParams, authToken.value);

        // 显示分享结果
        await createShareModalApi.close();
        showShareResult(result);

      } catch (error) {
        console.error('创建分享失败:', error);
        message.error('创建分享失败，请重试');
      } finally {
        createShareModalApi.unlock();
      }
    }
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      currentShareFile.value = null;
    }
  },
});

// 打开分享模态框
function openShareModal(file: CoulddriveFileInfo) {
  if (!formData.value.type || !formData.value.user_id) {
    message.warning('请先选择账号');
    return;
  }

  currentShareFile.value = file;

  // 设置表单默认值
  createShareFormApi.setValues({
    file_name: file.file_name,
    expired_type: 7,
  });

  createShareModalApi.open();
}

// 分享结果相关状态
const shareResultInfo = ref<CoulddriveShareInfo | null>(null);

// 分享结果模态框
const [shareResultModal, shareResultModalApi] = useVbenModal({
  title: '分享文件',
  destroyOnClose: true,
  centered: true,
  showCancelButton: false,
  confirmText: '确定',
  async onConfirm() {
    await shareResultModalApi.close();
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      shareResultInfo.value = null;
    }
  },
});

// 显示分享结果
function showShareResult(shareInfo: CoulddriveShareInfo) {
  shareResultInfo.value = shareInfo;
  shareResultModalApi.open();
}

// 复制分享链接
function copyShareLink() {
  if (!shareResultInfo.value) return;

  const driveTypeLabel = DRIVE_TYPE_OPTIONS.find(option => option.value === formData.value.type)?.label || '网盘';

  const shareText = `我用${driveTypeLabel}分享了「${shareResultInfo.value.title}」，点击链接即可保存。打开「${driveTypeLabel}APP」在线查看，支持多种文档格式转换。
链接：${shareResultInfo.value.url}`;

  navigator.clipboard.writeText(shareText).then(() => {
    message.success('分享链接已复制到剪贴板');
  }).catch(() => {
    message.error('复制失败，请手动复制分享链接');
  });
}


</script>

<template>
  <Page>
    <!-- 查询表单 -->
    <QueryForm class="mb-1" />

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
            class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            @click="openSaveShareModal"
          >
            保存
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

    <!-- 保存分享文件弹窗 -->
    <component :is="saveShareModal">
      <SaveShareForm />
    </component>

    <!-- 创建分享弹窗 -->
    <component :is="createShareModal">
      <CreateShareForm />
    </component>

    <!-- 分享结果弹窗 -->
    <component :is="shareResultModal">
      <div v-if="shareResultInfo" class="text-center">
        <!-- 成功图标 -->
        <div class="mb-4">
          <div class="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        </div>

        <!-- 成功文本 -->
        <div class="mb-6">
          <h3 class="text-lg font-medium text-gray-900 mb-2">成功创建分享链接</h3>
        </div>

        <!-- 分享链接 -->
        <div class="mb-6 p-3 bg-gray-50 rounded-lg border">
          <div class="text-sm text-gray-600 mb-2">分享链接：</div>
          <div class="font-mono text-sm text-gray-800 break-all">
            {{ shareResultInfo.url }}
          </div>
        </div>

        <!-- 复制按钮 -->
        <div class="flex justify-center">
          <button
            class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            @click="copyShareLink"
          >
            复制链接
          </button>
        </div>
      </div>
    </component>

    <!-- 文件选择器 -->
    <FileSelector
      v-model:visible="fileSelectorVisible"
      :drive-type="formData.type"
      :auth-token="authToken"
      mode="share"
      :share-params="{
        sourceType: 'link',
        sourceId: shareLink
      }"
      title="选择要保存的文件"
      @confirm="handleFileSelectConfirm"
      @cancel="handleFileSelectCancel"
    />
  </Page>
</template>
