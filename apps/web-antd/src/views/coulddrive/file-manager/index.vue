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

    // 重置认证token和目录
    authToken.value = '';
    resetPath();

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
      resetPath();
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
      // 检查是否有多个文件被选中
      const selectedRows = gridApi.grid.getCheckboxRecords(true) as CoulddriveFileInfo[];
      if (selectedRows.length > 1) {
        // 如果选中了多个文件，使用批量分享
        openBatchShareModal();
      } else {
        // 否则使用单个分享
        openShareModal(row);
      }
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
  const selectedRows = gridApi.grid.getCheckboxRecords(true) as CoulddriveFileInfo[];
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

// 分享结果相关状态
const shareResultInfo = ref<CoulddriveShareInfo | null>(null);

// 统一的分享状态（支持单个和批量）
const shareQueue = ref<CoulddriveFileInfo[]>([]);
const shareResults = ref<Array<{
  file: CoulddriveFileInfo;
  result?: CoulddriveShareInfo;
  error?: string;
  status: 'pending' | 'success' | 'error';
}>>([]);
const shareProgress = ref({
  current: 0,
  total: 0,
  isRunning: false,
});

// 记录当前分享是否设置了提取码
const currentShareHasPassword = ref(false);
// 记录用户实际输入的提取码
const currentSharePassword = ref('');

// 创建分享表单（支持单个和批量）
const [CreateShareForm, createShareFormApi] = useVbenForm({
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1',
  schema: [
    {
      component: 'Textarea',
      componentProps: {
        placeholder: '选中的文件',
        disabled: true,
        rows: 3,
      },
      fieldName: 'file_list',
      label: '文件列表',
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
    {
      component: 'Switch',
      componentProps: {
        checkedChildren: '开启',
        unCheckedChildren: '关闭',
      },
      fieldName: 'need_password',
      label: '是否需要提取码',
      defaultValue: false,
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入4位提取码',
        maxlength: 4,
        showCount: true,
      },
      fieldName: 'password',
      label: '提取码',
      defaultValue: 'zyas',
      dependencies: {
        show: ({ need_password }) => need_password === true,
        triggerFields: ['need_password'],
      },
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

    if (shareQueue.value.length === 0) {
      message.error('没有选择要分享的文件');
      return;
    }

    const { valid } = await createShareFormApi.validate();
    if (valid) {
      createShareModalApi.lock();
      try {
        const formValues = await createShareFormApi.getValues<{
          expired_type: number;
          need_password: boolean;
          password: string;
        }>();

                // 记录是否设置了提取码和实际的提取码
        currentShareHasPassword.value = formValues.need_password;
        currentSharePassword.value = formValues.need_password ? formValues.password : '';



        // 关闭设置弹窗，开始执行分享
        await createShareModalApi.close();
        await executeShare(shareQueue.value, formValues.expired_type, formValues.need_password ? formValues.password : undefined);

      } catch (error) {
        console.error('分享失败:', error);
        message.error('分享失败，请重试');
      } finally {
        createShareModalApi.unlock();
      }
    }
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      // 不要在这里清空shareQueue，因为onConfirm还需要使用它
      // shareQueue.value = [];
      // 也不要重置分享状态，因为后续的分享结果模态框还需要使用这些状态
      // shareResults.value = [];
      // shareProgress.value = { current: 0, total: 0, isRunning: false };
      // currentShareHasPassword.value = false;
      // currentSharePassword.value = '';
    }
  },
});

// 分享进度弹窗（批量分享时显示）
const [shareProgressModal, shareProgressModalApi] = useVbenModal({
  title: '分享进度',
  destroyOnClose: false,
  centered: true,
  showCancelButton: false,
  confirmText: '查看结果',
  closable: false,
  async onConfirm() {
    if (!shareProgress.value.isRunning) {
      await shareProgressModalApi.close();
      showShareResults();
    }
  },
});

// 统一的分享结果模态框
const [shareResultModal, shareResultModalApi] = useVbenModal({
  title: '分享结果',
  destroyOnClose: true,
  centered: true,
  showCancelButton: false,
  confirmText: '确定',
  async onConfirm() {
    await shareResultModalApi.close();
    // 在确认关闭时才重置状态
    shareResultInfo.value = null;
    shareResults.value = [];
    shareProgress.value = { current: 0, total: 0, isRunning: false };
    currentShareHasPassword.value = false;
    currentSharePassword.value = '';
  },
});

// 统一的分享执行函数
async function executeShare(files: CoulddriveFileInfo[], expiredType: number, password?: string) {
  if (!files || files.length === 0) {
    message.error('没有选择要分享的文件');
    return;
  }

  if (!formData.value.type) {
    message.error('请先选择网盘类型');
    return;
  }

  if (!authToken.value) {
    message.error('认证信息缺失，请重新选择账号');
    return;
  }

  // 初始化分享状态
  shareResults.value = files.map(file => ({
    file,
    status: 'pending' as const,
  }));

  shareProgress.value = {
    current: 0,
    total: files.length,
    isRunning: true,
  };

  // 如果是批量分享（多个文件），显示进度弹窗
  if (files.length > 1) {
    shareProgressModalApi.open();
  }

  // 逐个分享文件
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file) continue;

    shareProgress.value.current = i + 1;

    try {
      const shareParams: CoulddriveShareParams = {
        drive_type: formData.value.type,
        file_name: file.file_name,
        file_ids: [file.file_id],
        expired_type: expiredType,
        ...(password && { password }),
      };

      const result = await createCoulddriveShareApi(shareParams, authToken.value);

      // 更新结果
      if (shareResults.value[i]) {
        shareResults.value[i] = {
          file,
          result,
          status: 'success',
        };
      }

    } catch (error) {
      console.error(`分享文件 ${file.file_name} 失败:`, error);

      // 更新错误结果
      if (shareResults.value[i]) {
        shareResults.value[i] = {
          file,
          error: error instanceof Error ? error.message : '分享失败',
          status: 'error',
        };
      }
    }

    // 如果不是最后一个文件，等待3秒
    if (i < files.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

    // 分享完成
  shareProgress.value.isRunning = false;

  const successCount = shareResults.value.filter(r => r.status === 'success').length;
  const errorCount = shareResults.value.filter(r => r.status === 'error').length;

    if (files.length > 1) {
    message.success(`批量分享完成！成功：${successCount}个，失败：${errorCount}个`);
    // 自动关闭进度模态框并显示结果
    shareProgressModalApi.close();
    setTimeout(() => {
      showShareResults();
    }, 300); // 稍微延迟一点让关闭动画完成
  } else {
    if (successCount > 0) {
      message.success('分享创建成功');
      // 单个分享直接显示结果
      const firstSuccess = shareResults.value.find(r => r.status === 'success' && r.result);
      if (firstSuccess && firstSuccess.result) {
        showShareResult(firstSuccess.result);
        return; // 单个分享不需要显示批量结果
      }
    } else {
      message.error('分享创建失败');
    }
    // 单个分享失败的情况也显示结果
    showShareResults();
  }
}

// 显示分享结果
function showShareResults() {
  shareResultModalApi.open();
}

// 打开单个分享模态框
function openShareModal(file: CoulddriveFileInfo) {
  if (!formData.value.type || !formData.value.user_id) {
    message.warning('请先选择账号');
    return;
  }

  shareQueue.value = [file];

  // 设置表单默认值
  createShareFormApi.setValues({
    file_list: file.file_name,
    expired_type: 7,
    need_password: false,
    password: 'zyas',
  });

  createShareModalApi.open();
}

// 打开批量分享模态框
function openBatchShareModal() {
  if (!formData.value.type || !formData.value.user_id) {
    message.warning('请先选择账号');
    return;
  }

  const selectedRows = gridApi.grid.getCheckboxRecords(true) as CoulddriveFileInfo[];
  if (selectedRows.length === 0) {
    message.warning('请选择要分享的文件');
    return;
  }

  shareQueue.value = selectedRows;

  // 设置文件列表显示
  const fileList = selectedRows.map(file => file.file_name).join('\n');
  createShareFormApi.setValues({
    file_list: fileList,
    expired_type: 7,
    need_password: false,
    password: 'zyas',
  });

  createShareModalApi.open();
}

// 显示分享结果（兼容旧的单个分享）
function showShareResult(shareInfo: CoulddriveShareInfo) {
  shareResultInfo.value = shareInfo;
  shareResultModalApi.open();
}

// 复制分享链接
function copyShareLink() {
  if (shareResults.value.length > 1) {
    copyAllShareResults();
  } else if (shareResultInfo.value) {
    copySingleShareResult();
  }
}

// 复制单个分享结果
function copySingleShareResult() {
  if (!shareResultInfo.value) return;

  const driveTypeLabel = DRIVE_TYPE_OPTIONS.find(option => option.value === formData.value.type)?.label || '网盘';

  let shareText = `我用${driveTypeLabel}分享了「${shareResultInfo.value.title}」，点击链接即可保存。打开「${driveTypeLabel}APP」在线查看，支持多种文档格式转换。
链接：${shareResultInfo.value.url}`;



  // 如果用户设置了提取码，添加提取码信息
  if (currentShareHasPassword.value && currentSharePassword.value) {
    shareText += `\n提取码：${currentSharePassword.value}`;
  }

  navigator.clipboard.writeText(shareText).then(() => {
    message.success('分享链接已复制到剪贴板');
  }).catch(() => {
    message.error('复制失败，请手动复制分享链接');
  });
}

// 复制所有分享结果
function copyAllShareResults() {
  const driveTypeLabel = DRIVE_TYPE_OPTIONS.find(option => option.value === formData.value.type)?.label || '网盘';

  const successResults = shareResults.value.filter(r => r.status === 'success' && r.result);

  if (successResults.length === 0) {
    message.warning('没有成功的分享链接可复制');
    return;
  }

  const shareTexts = successResults.map(item => {
    const result = item.result!;
    let shareText = `我用${driveTypeLabel}分享了「${result.title}」，点击链接即可保存。打开「${driveTypeLabel}APP」在线查看，支持多种文档格式转换。
链接：${result.url}`;

    // 如果用户设置了提取码，添加提取码信息
    if (currentShareHasPassword.value && currentSharePassword.value) {
      shareText += `\n提取码：${currentSharePassword.value}`;
    }

    return shareText;
  });

  const allShareText = shareTexts.join('\n\n---\n\n');

  navigator.clipboard.writeText(allShareText).then(() => {
    message.success('所有分享链接已复制到剪贴板');
  }).catch(() => {
    message.error('复制失败，请手动复制分享链接');
  });
}

// 复制单个分享链接
function copySingleShareLink(shareInfo: CoulddriveShareInfo) {
  const driveTypeLabel = DRIVE_TYPE_OPTIONS.find(option => option.value === formData.value.type)?.label || '网盘';

  let shareText = `我用${driveTypeLabel}分享了「${shareInfo.title}」，点击链接即可保存。打开「${driveTypeLabel}APP」在线查看，支持多种文档格式转换。
链接：${shareInfo.url}`;

  // 如果用户设置了提取码，添加提取码信息
  if (currentShareHasPassword.value && currentSharePassword.value) {
    shareText += `\n提取码：${currentSharePassword.value}`;
  }

  navigator.clipboard.writeText(shareText).then(() => {
    message.success(`「${shareInfo.title}」分享链接已复制到剪贴板`);
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
            class="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            @click="openBatchShareModal"
          >
            批量分享
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

    <!-- 分享进度弹窗（批量分享时显示） -->
    <component :is="shareProgressModal">
      <div v-if="shareProgress.total > 0" class="text-center">
        <!-- 进度条 -->
        <div class="mb-4">
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${(shareProgress.current / shareProgress.total) * 100}%` }"
            ></div>
          </div>
        </div>

        <!-- 进度文字 -->
        <div class="text-sm text-gray-600 mb-2">
          正在分享第 {{ shareProgress.current }} / {{ shareProgress.total }} 个文件
        </div>

        <!-- 当前分享的文件名 -->
        <div v-if="shareProgress.current > 0 && shareResults[shareProgress.current - 1]" class="text-sm text-gray-800 mb-4">
          {{ shareResults[shareProgress.current - 1]?.file.file_name }}
        </div>

        <!-- 等待提示 -->
        <div v-if="shareProgress.isRunning" class="text-xs text-gray-500">
          每个文件间隔3秒分享，请耐心等待...
        </div>
      </div>
    </component>

    <!-- 统一的分享结果弹窗 -->
    <component :is="shareResultModal">
      <!-- 单个分享结果 -->
      <div v-if="shareResultInfo && shareResults.length <= 1" class="text-center">
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

      <!-- 批量分享结果 -->
      <div v-else-if="shareResults.length > 1">
        <!-- 统计信息 -->
        <div class="text-center mb-6">
          <div class="mb-4">
            <div class="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
              </svg>
            </div>
          </div>

          <h3 class="text-lg font-medium text-gray-900 mb-2">批量分享完成</h3>

          <div class="text-sm text-gray-600">
            成功：{{ shareResults.filter((r: any) => r.status === 'success').length }}个，
            失败：{{ shareResults.filter((r: any) => r.status === 'error').length }}个
          </div>
        </div>

        <!-- 详细结果列表 -->
        <div class="max-h-60 overflow-y-auto mb-6">
          <div v-for="(item, index) in shareResults" :key="index" class="flex items-center justify-between py-2 px-3 border-b border-gray-100 last:border-b-0">
            <div class="flex-1 text-sm text-gray-800 truncate">
              {{ item.file.file_name }}
            </div>
            <div class="ml-2">
              <span v-if="item.status === 'success'" class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                成功
              </span>
              <span v-else-if="item.status === 'error'" class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                </svg>
                失败
              </span>
            </div>
          </div>
        </div>

        <!-- 成功的分享链接 -->
        <div v-if="shareResults.filter((r: any) => r.status === 'success' && r.result).length > 0" class="mb-6">
          <h4 class="text-sm font-medium text-gray-900 mb-3">分享链接：</h4>
          <div class="max-h-40 overflow-y-auto bg-gray-50 rounded-lg p-3 border">
            <div v-for="(item, index) in shareResults.filter((r: any) => r.status === 'success' && r.result)" :key="index" class="mb-3 last:mb-0 p-2 bg-white rounded border">
              <div class="text-xs text-gray-600 mb-1 font-medium">{{ item.result?.title }}</div>
              <div class="flex items-center gap-2">
                <div class="font-mono text-xs text-gray-800 break-all flex-1">{{ item.result?.url }}</div>
                <button
                  class="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors whitespace-nowrap"
                  @click="item.result && copySingleShareLink(item.result)"
                >
                  复制
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 复制按钮 -->
        <div class="flex justify-center">
          <button
            v-if="shareResults.filter((r: any) => r.status === 'success' && r.result).length > 0"
            class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            @click="copyShareLink"
          >
            复制所有链接
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
