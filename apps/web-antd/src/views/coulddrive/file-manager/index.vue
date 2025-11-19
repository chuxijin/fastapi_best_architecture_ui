<script setup lang="ts">
import type {
  CoulddriveBatchRenameParams, // 导入复制参数类型
  CoulddriveDriveAccountDetail,
  CoulddriveFileInfo,
  CoulddriveListFilesParams,
  CoulddriveMkdirParams, // 导入移动参数类型
  CoulddriveRemoveParams,
  CoulddriveRenameParams, // 导入重命名参数类型
  CoulddriveShareInfo,
  CoulddriveShareParams,
  CoulddriveTransferParams,
  CoulddriveUserListParams,
} from '#/api';

import { computed, h, onMounted, onUnmounted, ref } from 'vue'; // 导入 h 函数

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';

import { message, Modal } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  batchRenameCoulddriveFilesApi, // 导入批量重命名API
  copyCoulddriveFilesApi, // 导入复制API
  createCoulddriveFolderApi,
  createCoulddriveShareApi,
  DRIVE_TYPE_OPTIONS,
  getCoulddriveFileListApi,
  getCoulddriveUserListApi,
  getRuleTemplatesByTypeApi, // 导入获取规则模板API
  moveCoulddriveFilesApi, // 导入移动API
  removeCoulddriveFilesApi,
  renameCoulddriveFileApi, // 导入重命名API
  transferCoulddriveFilesApi,
} from '#/api';
import AccountSelector from '#/components/AccountSelector.vue';
import FileSelector from '#/components/FileSelector.vue';
import FrequentDirectories from '#/components/FrequentDirectories.vue';
import { usePathNavigation } from '#/composables/usePathNavigation';
import { recordDirectoryVisit } from '#/utils/frequentDirectories';

import { getTableColumns } from './data';
import BatchRenameFloatingWindow from './modules/BatchRenameFloatingWindow.vue';
import BatchTransferModal from './modules/BatchTransferModal.vue';
import FrequentShareLinks from './modules/FrequentShareLinks.vue';
import {
  recordShareLinkSave,
  recordShareLinkVisit,
} from './utils/frequentShareLinks';

// 路径导航逻辑
const pathNavigation = usePathNavigation({
  onNavigate: () => {
    gridApi.reload();
  },
  onEnterFolder: () => {
    gridApi.reload();
  },
  onGoBack: () => {
    gridApi.reload();
  },
});

const {
  currentPath,
  currentFileId,
  breadcrumbPaths,
  canGoBack,
  navigateToPath,
  navigateToFolder,
  goBack,
  resetPath,
} = pathNavigation;

// 其他状态管理
const authToken = ref<string>('');
const accountOptions = ref<
  Array<{ cookies: string; label: string; value: number }>
>([]);
const allAccounts = ref<CoulddriveDriveAccountDetail[]>([]);
const accountsLoading = ref(false);
const formData = ref({
  type: '',
  user_id: null as null | number,
});

// 响应式状态
const isMobile = ref(false);

// 检查是否为移动端
function checkMobile() {
  isMobile.value = window.innerWidth < 768;
}

// 窗口大小改变监听
function handleResize() {
  checkMobile();
  // 重新渲染表格以应用新的列配置
  setTimeout(() => {
    gridApi.reload();
  }, 100);
}

// 获取所有账号列表
async function loadAllAccounts() {
  accountsLoading.value = true;
  try {
    const params: CoulddriveUserListParams = {
      is_valid: true,
      page: 1,
      size: 100,
    };

    const response = await getCoulddriveUserListApi(params);
    const accounts = response.items || [];

    // 保存完整的账号信息用于卡片显示
    allAccounts.value = accounts;

    // 保持原有的选项格式用于兼容
    accountOptions.value = accounts.map(
      (account: CoulddriveDriveAccountDetail) => ({
        label: `${account.username || account.user_id} (${account.type})`,
        value: account.id,
        cookies: account.cookies || '',
      }),
    );
  } catch (error) {
    console.error('获取账号列表失败:', error);
    message.error('获取账号列表失败');
    accountOptions.value = [];
    allAccounts.value = [];
  } finally {
    accountsLoading.value = false;
  }
}

// 设置认证Token
async function setAuthTokenFromAccount(accountId: number) {
  const account = allAccounts.value.find((acc) => acc.id === accountId);
  if (account && account.cookies) {
    authToken.value = account.cookies;
  } else {
    message.error('账号认证信息缺失，请重新选择账号');
    authToken.value = '';
  }
}

// 处理账号选择（新的卡片选择器）
async function handleAccountSelect(accountId: number) {
  const selectedAccount = allAccounts.value.find((acc) => acc.id === accountId);
  if (!selectedAccount) {
    message.error('账号信息不存在');
    return;
  }

  formData.value.user_id = accountId;
  formData.value.type = selectedAccount.type; // 根据选择的账号设置网盘类型

  await setAuthTokenFromAccount(accountId);
  resetPath();
  gridApi.reload();

  const accountName =
    selectedAccount.username || selectedAccount.user_id || '账号';
  const driveTypeLabel =
    DRIVE_TYPE_OPTIONS.find((opt) => opt.value === selectedAccount.type)
      ?.label || selectedAccount.type;
  message.success(
    `已选择${driveTypeLabel}账号 ${accountName}，正在加载文件列表...`,
  );
}

// 移除未使用的表单变化处理函数

// 创建表格（不使用查询表单）
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    height: 'auto',
    minHeight: 400,
    rowConfig: { keyField: 'file_id' },
    checkboxConfig: {},
    columnConfig: { resizable: true },
    sortConfig: {
      trigger: 'cell', // 整个单元格都可以触发排序
      multiple: false, // 不支持多列排序
      chronological: false, // 不按时间顺序排序
    },
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
            { code: 'copy', name: '复制', icon: 'mdi:content-copy' },
            { code: 'move', name: '移动', icon: 'mdi:folder-move' },
            { code: 'rename', name: '重命名', icon: 'mdi:rename-box' },
            { code: 'delete', name: '删除', icon: 'mdi:delete' },
            { code: 'share', name: '分享', icon: 'mdi:share' },
          ],
        ],
      },
    },
    columns: getTableColumns(),
    proxyConfig: {
      ajax: {
        query: async (
          { page }: { page: any },
          _formValues: { type?: string; user_id?: null | number },
        ) => {
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

  // 记录目录访问（用于常用目录统计）
  if (formData.value.user_id && path !== '/') {
    const pathParts = path.split('/').filter(Boolean);
    const dirName =
      pathParts.length > 0
        ? pathParts[pathParts.length - 1] || '根目录'
        : '根目录';
    recordDirectoryVisit(
      formData.value.user_id.toString(),
      path,
      dirName,
      fileId || '0',
    );
  }

  navigateToPath(path, fileId);
};

const wrappedNavigateToFolder = (folder: CoulddriveFileInfo) => {
  if (!authToken.value && !formData.value.user_id) {
    message.warning('请先选择关联账号');
    return;
  }

  // 记录目录访问（用于常用目录统计）
  if (formData.value.user_id && folder.is_folder && folder.file_path !== '/') {
    recordDirectoryVisit(
      formData.value.user_id.toString(),
      folder.file_path,
      folder.file_name,
      folder.file_id,
    );
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

// 处理常用目录导航
function handleFrequentDirectoryNavigate(data: {
  fileId: string;
  name: string;
  path: string;
}) {
  if (!authToken.value && !formData.value.user_id) {
    message.warning('请先选择关联账号');
    return;
  }

  // 直接导航到目标目录
  navigateToPath(data.path, data.fileId);

  // 再次记录访问（增加访问计数）
  if (formData.value.user_id) {
    recordDirectoryVisit(
      formData.value.user_id.toString(),
      data.path,
      data.name,
      data.fileId,
    );
  }
}

// 当前正在重命名的文件信息
const currentRenameFile = ref<CoulddriveFileInfo | null>(null);

// 创建重命名表单
const [RenameFileForm, renameFileFormApi] = useVbenForm({
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1', // 添加此行以优化布局
  schema: [
    {
      component: 'Input',
      componentProps: { placeholder: '请输入新的文件或文件夹名称' },
      fieldName: 'new_name',
      label: '新名称',
      rules: 'required',
    },
  ],
});

const [renameFileModal, renameFileModalApi] = useVbenModal({
  title: '重命名',
  destroyOnClose: true,
  centered: true, // 添加此行以使模态框居中
  async onConfirm() {
    if (!currentRenameFile.value) {
      message.error('未选择要重命名的文件');
      return;
    }
    if (!formData.value.type || !formData.value.user_id) {
      message.error('请先选择账号');
      return;
    }

    const { valid } = await renameFileFormApi.validate();
    if (valid) {
      renameFileModalApi.lock();
      const { new_name } = await renameFileFormApi.getValues<{
        new_name: string;
      }>();

      const fileToRename = currentRenameFile.value;
      const params: CoulddriveRenameParams = {
        drive_type: formData.value.type,
        file_id: fileToRename.file_id,
        new_name,
        file_name: fileToRename.file_name, // 原始文件名称
        file_path: fileToRename.file_path, // 原始文件路径
      };

      try {
        const success = await renameCoulddriveFileApi(params, authToken.value);
        if (success) {
          message.success(
            `重命名 "${fileToRename.file_name}" 为 "${new_name}" 成功`,
          );
          await renameFileModalApi.close();
          gridApi.query();
        } else {
          message.error(`重命名 "${fileToRename.file_name}" 失败`);
        }
      } catch (error) {
        console.error('重命名文件失败:', error);
        message.error(`重命名 "${fileToRename.file_name}" 失败`);
      } finally {
        renameFileModalApi.unlock();
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      renameFileFormApi.resetForm();
      if (currentRenameFile.value) {
        renameFileFormApi.setValues({
          new_name: currentRenameFile.value.file_name,
        });
      }
    } else {
      currentRenameFile.value = null; // 关闭时清空当前重命名的文件
    }
  },
});

// 打开重命名模态框
function openRenameModal(file: CoulddriveFileInfo) {
  if (!formData.value.type || !formData.value.user_id) {
    message.warning('请先选择关联账号');
    return;
  }
  currentRenameFile.value = file;
  renameFileModalApi.open();
}

// 批量重命名相关状态
const batchRenameSelectedFiles = ref<CoulddriveFileInfo[]>([]);
const batchRenameTemplates = ref<any[]>([]); // 存储重命名模板
const batchRenameSelectedTemplateId = ref<null | number>(null); // 选中的模板ID
const batchRenameRecursive = ref<boolean>(false); // 是否递归
const batchRenameTargetScope = ref<string>('all'); // 重命名目标

// 悬浮窗状态
const showFloatingWindow = ref(false);
const floatingWindowTaskId = ref('');

// 创建批量重命名表单
const [BatchRenameForm, batchRenameFormApi] = useVbenForm({
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1',
  schema: [
    {
      component: 'RadioGroup',
      fieldName: 'recursive',
      label: '是否递归',
      componentProps: {
        options: [
          { label: '是', value: true },
          { label: '否', value: false },
        ],
        'v-model': batchRenameRecursive,
        onChange: (e: any) => {
          batchRenameRecursive.value = e.target.value;
        },
      },
    },
    {
      component: 'RadioGroup',
      fieldName: 'target_scope',
      label: '重命名目标',
      componentProps: {
        options: [
          { label: '文件', value: 'file' },
          { label: '文件夹', value: 'folder' },
          { label: '所有', value: 'all' },
        ],
        'v-model': batchRenameTargetScope,
        onChange: (e: any) => {
          batchRenameTargetScope.value = e.target.value;
        },
      },
    },
    {
      component: 'Select',
      fieldName: 'template_id',
      label: '选择重命名模板',
      componentProps: {
        options: computed(() => batchRenameTemplates.value),
        allowClear: true,
        placeholder: '请选择重命名规则模板',
        'v-model': batchRenameSelectedTemplateId,
        onChange: (value: null | number) => {
          batchRenameSelectedTemplateId.value = value;
        },
      },
    },
  ],
});

const [batchRenameModal, batchRenameModalApi] = useVbenModal({
  title: '批量重命名',
  destroyOnClose: true,
  centered: true,
  async onConfirm() {
    if (batchRenameSelectedFiles.value.length === 0) {
      message.error('请选择要重命名的文件');
      return;
    }
    if (!formData.value.type || !formData.value.user_id) {
      message.error('请先选择账号');
      return;
    }

    // 先获取表单的当前值，不进行验证
    // const currentValues = batchRenameFormApi.getFieldsValue(); // 该方法不存在，已移除

    // 立即关闭模态框，让用户可以进行其他操作
    await batchRenameModalApi.close();

    // 生成任务ID并显示悬浮窗
    const taskId = Date.now().toString();
    floatingWindowTaskId.value = taskId;
    showFloatingWindow.value = true;

    batchRenameModalApi.lock();
    try {
      // 重新获取选中的文件，防止模态框关闭时被清空
      const currentSelectedFiles = gridApi.grid.getCheckboxRecords(
        true,
      ) as CoulddriveFileInfo[];

      if (currentSelectedFiles.length === 0) {
        message.error('没有选中文件，请重新选择');
        return;
      }

      const params: CoulddriveBatchRenameParams = {
        drive_type: formData.value.type,
        file_infos: currentSelectedFiles.map((file) => ({
          file_id: file.file_id,
          file_path: file.file_path,
          is_folder: file.is_folder,
          file_name: file.file_name,
          parent_id: file.parent_id,
        })),
        recursive: batchRenameRecursive.value,
        target_scope: batchRenameTargetScope.value as 'all' | 'file' | 'folder',
        template_id: batchRenameSelectedTemplateId.value || undefined, // 直接使用选中的模板ID
      };

      // 调用批量重命名API，传递task_id用于SSE进度追踪
      const result = await batchRenameCoulddriveFilesApi(
        { ...params, task_id: taskId },
        authToken.value,
      );

      // 关闭悬浮窗
      showFloatingWindow.value = false;

      if (result.renamed_success > 0) {
        message.success(
          `批量重命名完成！成功：${result.renamed_success} 个，失败：${result.renamed_failed} 个`,
        );
      } else {
        message.warning('没有文件被成功重命名');
      }
      if (result.errors && result.errors.length > 0) {
        Modal.error({
          title: '批量重命名失败详情',
          content: h('div', { class: 'max-h-60 overflow-y-auto' }, [
            result.errors.map((error: string, index: number) =>
              h('p', { key: index }, error),
            ),
          ]),
          width: 600,
        });
      }

      gridApi.query();
    } catch (error) {
      console.error('批量重命名失败:', error);
      message.error('批量重命名失败，请重试');

      // 关闭悬浮窗
      showFloatingWindow.value = false;
    } finally {
      batchRenameModalApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      batchRenameFormApi.resetForm();
      // 初始化表单值
      batchRenameRecursive.value = false;
      batchRenameTargetScope.value = 'all';
      batchRenameSelectedTemplateId.value = null;

      // 加载重命名模板
      loadRenameTemplates();

      // 获取选中的文件
      batchRenameSelectedFiles.value = gridApi.grid.getCheckboxRecords(
        true,
      ) as CoulddriveFileInfo[];

      if (batchRenameSelectedFiles.value.length === 0) {
        message.warning('请选择要批量重命名的文件或文件夹');
        batchRenameModalApi.close(); // 如果没有选中文件，则关闭模态框
      }
    } else {
      batchRenameSelectedFiles.value = [];
      batchRenameTemplates.value = [];
    }
  },
});

// 右键菜单处理
function handleContextMenuClick(code: string, row: CoulddriveFileInfo) {
  switch (code) {
    case 'copy': {
      openCopyModal(row);
      break;
    }
    case 'delete': {
      deleteFile(row.file_id, row.file_name);
      break;
    }
    case 'move': {
      openMoveModal(row);
      break;
    }
    case 'rename': {
      openRenameModal(row); // 调用新的打开重命名模态框函数
      break;
    }
    case 'share': {
      // 检查是否有多个文件被选中
      const selectedRows = gridApi.grid.getCheckboxRecords(
        true,
      ) as CoulddriveFileInfo[];
      if (selectedRows.length > 1) {
        // 如果选中了多个文件，使用批量分享
        openBatchShareModal();
      } else {
        // 否则使用单个分享
        openShareModal(row);
      }
      break;
    }
  }
}

// 删除文件
function deleteFile(fileId: string, fileName: string) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除文件 "${fileName}" 吗？此操作不可恢复。`,
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    onOk() {
      const params: CoulddriveRemoveParams = {
        drive_type: formData.value.type,
        file_ids: [fileId],
      };
      return removeCoulddriveFilesApi(params, authToken.value)
        .then(() => {
          message.success(`删除文件 ${fileName} 成功`);
          gridApi.query();
        })
        .catch((error) => {
          console.error('删除文件失败:', error);
          message.error(`删除文件 ${fileName} 失败`);
        });
    },
  });
}

// 批量删除
function deleteSelectedFiles() {
  const selectedRows = gridApi.grid.getCheckboxRecords(
    true,
  ) as CoulddriveFileInfo[];
  if (selectedRows.length === 0) {
    message.warning('请选择要删除的文件');
    return;
  }

  const fileNames = selectedRows.map((row) => row.file_name).slice(0, 3); // 最多显示3个文件名
  const displayNames =
    fileNames.length < selectedRows.length
      ? `${fileNames.join('、')} 等${selectedRows.length}个文件`
      : fileNames.join('、');

  Modal.confirm({
    title: '确认批量删除',
    content: `确定要删除 ${displayNames} 吗？此操作不可恢复。`,
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    onOk() {
      const params: CoulddriveRemoveParams = {
        drive_type: formData.value.type,
        file_ids: selectedRows.map((row: CoulddriveFileInfo) => row.file_id),
      };

      return removeCoulddriveFilesApi(params, authToken.value)
        .then(() => {
          message.success(`成功删除 ${selectedRows.length} 个文件`);
          gridApi.query();
        })
        .catch((error) => {
          console.error('批量删除文件失败:', error);
          message.error(`批量删除文件失败`);
        });
    },
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
      const { folder_name } = await createFolderFormApi.getValues<{
        folder_name: string;
      }>();
      const params: CoulddriveMkdirParams = {
        drive_type: formData.value.type,
        file_path: `${currentPath.value}/${folder_name}`,
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

// 保存分享文件相关状态
const fileSelectorVisible = ref(false);

// 移动和复制相关状态
const moveFileSelectorVisible = ref(false);
const copyFileSelectorVisible = ref(false);
const currentOperationFiles = ref<CoulddriveFileInfo[]>([]);
const operationType = ref<'copy' | 'move'>('move');

// 批量传输相关状态
const batchTransferModalVisible = ref(false);

// 移除不需要的源文件选择器状态

const shareLink = ref('');

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
      const { share_link } = await saveShareFormApi.getValues<{
        share_link: string;
      }>();
      shareLink.value = share_link;

      // 记录分享链接访问（使用链接作为临时名称，后续会在保存时更新为实际文件名）
      if (formData.value.user_id && share_link) {
        recordShareLinkVisit(
          formData.value.user_id.toString(),
          share_link,
          '分享链接', // 临时名称，保存时会更新
        );
      }

      // 关闭当前模态框，打开文件选择器
      await saveShareModalApi.close();
      fileSelectorVisible.value = true;
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      saveShareFormApi.resetForm();
      // 根据选择的网盘类型更新占位符
      const driveTypeLabel =
        DRIVE_TYPE_OPTIONS.find(
          (option) => option.value === formData.value.type,
        )?.label || '网盘';
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

// 处理常用链接选择
function handleFrequentLinkSelect(data: { name: string; url: string }) {
  // 直接设置分享链接并打开文件选择器
  shareLink.value = data.url;

  // 关闭保存模态框，直接打开文件选择器
  saveShareModalApi.close();
  fileSelectorVisible.value = true;
}

// 处理文件选择确认
async function handleFileSelectConfirm(data: any) {
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
      file_ext: file.file_ext || {},
    }));

    // 提取所有文件的share_fid_tokens
    const shareFidTokens = data.selectedFiles.map(
      (file: CoulddriveFileInfo) => file.file_ext?.share_fid_token || '',
    );

    // 构造转存参数
    const transferParams: CoulddriveTransferParams = {
      drive_type: formData.value.type,
      source_type: 'link', // 分享链接类型
      source_id: shareLink.value,
      source_path: data.currentPath || '/', // 分享文件的当前路径
      target_path: currentPath.value, // 保存到当前目录
      file_ids: data.selectedFiles.map(
        (file: CoulddriveFileInfo) => file.file_id,
      ), // 选中的文件ID列表
      ext: {
        // 展开第一个文件的扩展信息作为基础信息
        ...fileExt,
        // 添加目标目录和文件扩展信息
        to_pdir_fid: currentFileId.value || '0', // 目标目录的file_id
        target_id: currentFileId.value || '0', // 目标目录的file_id（放在ext中）
        pdir_fid: data.fileId || '0', // 分享文件的父目录ID
        files_ext_info: filesExtInfo, // 所有文件的扩展信息
        share_fid_tokens: shareFidTokens, // 所有文件的share_fid_token
      },
    };

    // 调用转存接口
    await transferCoulddriveFilesApi(transferParams, authToken.value);

    message.success(`成功保存 ${data.selectedFiles.length} 个文件到当前目录`);
    fileSelectorVisible.value = false;

    // 记录分享链接保存成功（使用第一个文件名作为显示名称）
    if (formData.value.user_id && shareLink.value && firstFile) {
      recordShareLinkSave(
        formData.value.user_id.toString(),
        shareLink.value,
        firstFile.file_name || '分享文件',
      );
    }

    // 延迟刷新，给服务器一些时间同步数据
    setTimeout(() => {
      gridApi.query();
    }, 1500); // 延迟1.5秒刷新
  } catch (error) {
    console.error('保存文件失败:', error);
    message.error('保存文件失败，请重试');
  }
}

// 处理文件选择取消
function handleFileSelectCancel() {
  fileSelectorVisible.value = false;
}

// 处理分享文件加载完成，更新常用链接标题
function handleShareFilesLoaded(data: {
  firstFileName?: string;
  shareUrl: string;
}) {
  if (formData.value.user_id && data.firstFileName && data.shareUrl) {
    // 更新常用链接的标题为实际文件名
    recordShareLinkVisit(
      formData.value.user_id.toString(),
      data.shareUrl,
      data.firstFileName,
    );
  }
}

// 分享结果相关状态
const shareResultInfo = ref<CoulddriveShareInfo | null>(null);

// 统一的分享状态（支持单个和批量）
const shareQueue = ref<CoulddriveFileInfo[]>([]);
const shareResults = ref<
  Array<{
    error?: string;
    file: CoulddriveFileInfo;
    result?: CoulddriveShareInfo;
    status: 'error' | 'pending' | 'success';
  }>
>([]);
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
        currentSharePassword.value = formValues.need_password
          ? formValues.password
          : '';

        // 关闭设置弹窗，开始执行分享
        await createShareModalApi.close();
        await executeShare(
          shareQueue.value,
          formValues.expired_type,
          formValues.need_password ? formValues.password : undefined,
        );
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
async function executeShare(
  files: CoulddriveFileInfo[],
  expiredType: number,
  password?: string,
) {
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
  shareResults.value = files.map((file) => ({
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

      const result = await createCoulddriveShareApi(
        shareParams,
        authToken.value,
      );

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
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  // 分享完成
  shareProgress.value.isRunning = false;

  const successCount = shareResults.value.filter(
    (r) => r.status === 'success',
  ).length;
  const errorCount = shareResults.value.filter(
    (r) => r.status === 'error',
  ).length;

  if (files.length > 1) {
    message.success(
      `批量分享完成！成功：${successCount}个，失败：${errorCount}个`,
    );
    // 自动关闭进度模态框并显示结果
    shareProgressModalApi.close();
    setTimeout(() => {
      showShareResults();
    }, 300); // 稍微延迟一点让关闭动画完成
  } else {
    if (successCount > 0) {
      message.success('分享创建成功');
      // 单个分享直接显示结果
      const firstSuccess = shareResults.value.find(
        (r) => r.status === 'success' && r.result,
      );
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

  const selectedRows = gridApi.grid.getCheckboxRecords(
    true,
  ) as CoulddriveFileInfo[];
  if (selectedRows.length === 0) {
    message.warning('请选择要分享的文件');
    return;
  }

  shareQueue.value = selectedRows;

  // 设置文件列表显示
  const fileList = selectedRows.map((file) => file.file_name).join('\n');
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

  const driveTypeLabel =
    DRIVE_TYPE_OPTIONS.find((option) => option.value === formData.value.type)
      ?.label || '网盘';

  let shareText = `我用${driveTypeLabel}分享了「${shareResultInfo.value.title}」，点击链接即可保存。打开「${driveTypeLabel}APP」在线查看，支持多种文档格式转换。
链接：${shareResultInfo.value.url}`;

  // 如果用户设置了提取码，添加提取码信息
  if (currentShareHasPassword.value && currentSharePassword.value) {
    shareText += `\n提取码：${currentSharePassword.value}`;
  }

  navigator.clipboard
    .writeText(shareText)
    .then(() => {
      message.success('分享链接已复制到剪贴板');
    })
    .catch(() => {
      message.error('复制失败，请手动复制分享链接');
    });
}

// 复制所有分享结果
function copyAllShareResults() {
  const driveTypeLabel =
    DRIVE_TYPE_OPTIONS.find((option) => option.value === formData.value.type)
      ?.label || '网盘';

  const successResults = shareResults.value.filter(
    (r) => r.status === 'success' && r.result,
  );

  if (successResults.length === 0) {
    message.warning('没有成功的分享链接可复制');
    return;
  }

  const shareTexts = successResults.map((item) => {
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

  navigator.clipboard
    .writeText(allShareText)
    .then(() => {
      message.success('所有分享链接已复制到剪贴板');
    })
    .catch(() => {
      message.error('复制失败，请手动复制分享链接');
    });
}

// 复制单个分享链接
function copySingleShareLink(shareInfo: CoulddriveShareInfo) {
  const driveTypeLabel =
    DRIVE_TYPE_OPTIONS.find((option) => option.value === formData.value.type)
      ?.label || '网盘';

  let shareText = `我用${driveTypeLabel}分享了「${shareInfo.title}」，点击链接即可保存。打开「${driveTypeLabel}APP」在线查看，支持多种文档格式转换。
链接：${shareInfo.url}`;

  // 如果用户设置了提取码，添加提取码信息
  if (currentShareHasPassword.value && currentSharePassword.value) {
    shareText += `\n提取码：${currentSharePassword.value}`;
  }

  navigator.clipboard
    .writeText(shareText)
    .then(() => {
      message.success(`「${shareInfo.title}」分享链接已复制到剪贴板`);
    })
    .catch(() => {
      message.error('复制失败，请手动复制分享链接');
    });
}

function openBatchRenameModal() {
  batchRenameModalApi.open();
}

// 加载重命名模板
async function loadRenameTemplates() {
  if (!formData.value.type) {
    // 只判断网盘类型，不判断用户ID
    batchRenameTemplates.value = [];
    return;
  }

  try {
    const response = await getRuleTemplatesByTypeApi('rename'); // 获取重命名规则模板
    // 假设后端返回的是 RuleTemplateDetail[] 类型
    batchRenameTemplates.value = [
      {
        label: '无重命名规则',
        value: null,
        description: '不使用任何重命名规则',
      },
      ...response.map((template: any) => ({
        label: template.template_name,
        value: template.id,
        description: template.description,
      })),
    ];
  } catch (error) {
    console.error('加载重命名模板失败:', error);
    message.error('加载重命名模板失败');
    batchRenameTemplates.value = [
      {
        label: '无重命名规则',
        value: null,
        description: '不使用任何重命名规则',
      },
    ];
  }
}

// 打开移动文件模态框
function openMoveModal(file: CoulddriveFileInfo) {
  if (!formData.value.type || !formData.value.user_id) {
    message.warning('请先选择关联账号');
    return;
  }

  // 检查是否有多个文件被选中
  const selectedRows = gridApi.grid.getCheckboxRecords(
    true,
  ) as CoulddriveFileInfo[];
  if (selectedRows.length > 1) {
    // 如果选中了多个文件，使用选中的文件
    currentOperationFiles.value = selectedRows;
  } else {
    // 否则使用右键点击的文件
    currentOperationFiles.value = [file];
  }

  operationType.value = 'move';
  moveFileSelectorVisible.value = true;
}

// 打开复制文件模态框
function openCopyModal(file: CoulddriveFileInfo) {
  if (!formData.value.type || !formData.value.user_id) {
    message.warning('请先选择关联账号');
    return;
  }

  // 检查是否有多个文件被选中
  const selectedRows = gridApi.grid.getCheckboxRecords(
    true,
  ) as CoulddriveFileInfo[];
  if (selectedRows.length > 1) {
    // 如果选中了多个文件，使用选中的文件
    currentOperationFiles.value = selectedRows;
  } else {
    // 否则使用右键点击的文件
    currentOperationFiles.value = [file];
  }

  operationType.value = 'copy';
  copyFileSelectorVisible.value = true;
}

// 通用的文件操作处理函数
async function handleFileOperation(data: any, operation: 'copy' | 'move') {
  if (
    !currentOperationFiles.value ||
    currentOperationFiles.value.length === 0
  ) {
    message.warning(
      `没有选择要${operation === 'move' ? '移动' : '复制'}的文件`,
    );
    return;
  }

  try {
    // 判断目标位置：如果用户选择了文件夹，使用该文件夹；否则使用当前路径
    let targetId = data.fileId || '0';
    let targetPath = data.path || '/';

    // 如果用户选择了文件夹作为目标
    if (data.selectedFiles && data.selectedFiles.length > 0) {
      const selectedFolder = data.selectedFiles.find(
        (file: CoulddriveFileInfo) => file.is_folder,
      );
      if (selectedFolder) {
        targetId = selectedFolder.file_id;
        targetPath = selectedFolder.file_path;
        message.info(
          `将${operation === 'move' ? '移动' : '复制'}到文件夹：${selectedFolder.file_name}`,
        );
      }
    }

    const params = {
      drive_type: formData.value.type,
      file_ids: currentOperationFiles.value.map((file) => file.file_id),
      file_paths: currentOperationFiles.value.map((file) => file.file_path),
      target_id: targetId,
      target_path: targetPath,
    };

    const success =
      operation === 'move'
        ? await moveCoulddriveFilesApi(params, authToken.value)
        : await copyCoulddriveFilesApi(params, authToken.value);

    if (success) {
      message.success(
        `成功${operation === 'move' ? '移动' : '复制'} ${currentOperationFiles.value.length} 个文件`,
      );
      if (operation === 'move') {
        moveFileSelectorVisible.value = false;
      } else {
        copyFileSelectorVisible.value = false;
      }
      currentOperationFiles.value = [];
      gridApi.query(); // 刷新文件列表
    } else {
      message.error(`${operation === 'move' ? '移动' : '复制'}文件失败`);
    }
  } catch (error) {
    console.error(`${operation === 'move' ? '移动' : '复制'}文件失败:`, error);
    message.error(`${operation === 'move' ? '移动' : '复制'}文件失败，请重试`);
  }
}

// 处理移动文件确认
async function handleMoveFileConfirm(data: any) {
  await handleFileOperation(data, 'move');
}

// 处理复制文件确认
async function handleCopyFileConfirm(data: any) {
  await handleFileOperation(data, 'copy');
}

// 处理移动/复制文件取消
function handleMoveOrCopyCancel() {
  moveFileSelectorVisible.value = false;
  copyFileSelectorVisible.value = false;
  currentOperationFiles.value = [];
}

// 打开批量传输模态框
function openBatchTransferModal() {
  batchTransferModalVisible.value = true;
}

// 关闭批量传输模态框
function closeBatchTransferModal() {
  batchTransferModalVisible.value = false;
}

// 页面初始化
onMounted(() => {
  checkMobile();
  loadAllAccounts();
  window.addEventListener('resize', handleResize);
});

// 页面销毁时清理事件监听
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<template>
  <Page auto-content-height>
    <div class="flex h-full flex-col">
      <!-- 账号选择器 -->
      <div class="mb-4">
        <div class="mb-2">
          <h3 class="text-sm font-medium text-gray-700">选择账号</h3>
        </div>
        <AccountSelector
          :accounts="allAccounts"
          :selected-account-id="formData.user_id"
          :loading="accountsLoading"
          @select="handleAccountSelect"
        />
      </div>

      <!-- 路径导航 -->
      <div class="mb-4 flex items-center gap-2 text-sm">
        <span class="text-gray-600">当前路径:</span>
        <div class="flex items-center rounded bg-gray-100 px-2 py-1 font-mono">
          <template v-for="(pathItem, index) in breadcrumbPaths" :key="index">
            <button
              class="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
              @click="wrappedNavigateToPath(pathItem.path, pathItem.file_id)"
            >
              {{ pathItem.name }}
            </button>
            <span
              v-if="index < breadcrumbPaths.length - 1"
              class="mx-1 text-gray-400"
              >/</span
            >
          </template>
        </div>
        <button
          v-if="canGoBack"
          class="rounded bg-blue-500 px-2 py-1 text-sm text-white hover:bg-blue-600"
          @click="wrappedGoBack"
        >
          返回上级
        </button>
      </div>

      <!-- 常用目录 -->
      <FrequentDirectories
        :account-id="formData.user_id?.toString()"
        :visible="!!formData.user_id"
        @navigate="handleFrequentDirectoryNavigate"
      />

      <!-- 表格 -->
      <div class="min-h-0 flex-1">
        <Grid>
          <template #toolbar-actions>
            <!-- 移动端显示紧凑按钮 -->
            <div v-if="isMobile" class="flex flex-wrap gap-1">
              <VbenButton
                class="px-2 py-1 text-xs"
                type="primary"
                @click="createFolderModalApi.open()"
              >
                新建
              </VbenButton>
              <VbenButton
                class="px-2 py-1 text-xs"
                type="default"
                style="
                  color: #fff;
                  background-color: #10b981;
                  border-color: #10b981;
                "
                @click="openSaveShareModal"
              >
                保存
              </VbenButton>
              <VbenButton
                class="px-2 py-1 text-xs"
                type="default"
                style="
                  color: #fff;
                  background-color: #f59e0b;
                  border-color: #f59e0b;
                "
                @click="openBatchShareModal"
              >
                分享
              </VbenButton>
              <VbenButton
                class="px-2 py-1 text-xs"
                type="default"
                style="
                  color: #fff;
                  background-color: #6366f1;
                  border-color: #6366f1;
                "
                @click="openBatchRenameModal"
              >
                重命名
              </VbenButton>
              <VbenButton
                class="px-2 py-1 text-xs"
                type="default"
                style="
                  color: #fff;
                  background-color: #ef4444;
                  border-color: #ef4444;
                "
                @click="deleteSelectedFiles"
              >
                删除
              </VbenButton>
              <VbenButton
                class="px-2 py-1 text-xs"
                type="default"
                style="
                  color: #fff;
                  background-color: #8b5cf6;
                  border-color: #8b5cf6;
                "
                @click="openBatchTransferModal"
              >
                批量传输
              </VbenButton>
            </div>

            <!-- 桌面端显示完整按钮 -->
            <template v-else>
              <VbenButton type="primary" @click="createFolderModalApi.open()">
                新建文件夹
              </VbenButton>
              <VbenButton
                type="default"
                style="
                  color: #fff;
                  background-color: #10b981;
                  border-color: #10b981;
                "
                @click="openSaveShareModal"
              >
                保存
              </VbenButton>
              <VbenButton
                type="default"
                style="
                  color: #fff;
                  background-color: #f59e0b;
                  border-color: #f59e0b;
                "
                @click="openBatchShareModal"
              >
                批量分享
              </VbenButton>
              <VbenButton
                type="default"
                style="
                  color: #fff;
                  background-color: #6366f1;
                  border-color: #6366f1;
                "
                @click="openBatchRenameModal"
              >
                批量重命名
              </VbenButton>
              <VbenButton
                type="default"
                style="
                  color: #fff;
                  background-color: #ef4444;
                  border-color: #ef4444;
                "
                @click="deleteSelectedFiles"
              >
                批量删除
              </VbenButton>
              <VbenButton
                type="default"
                style="
                  color: #fff;
                  background-color: #8b5cf6;
                  border-color: #8b5cf6;
                "
                @click="openBatchTransferModal"
              >
                批量复制/移动
              </VbenButton>
            </template>
          </template>
        </Grid>
      </div>
    </div>

    <!-- 创建文件夹弹窗 -->
    <component :is="createFolderModal">
      <CreateFolderForm />
    </component>

    <!-- 保存分享文件弹窗 -->
    <component :is="saveShareModal">
      <div class="space-y-4">
        <!-- 分享链接输入表单 -->
        <SaveShareForm />

        <!-- 常用分享链接 -->
        <FrequentShareLinks
          :account-id="formData.user_id || undefined"
          :visible="!!formData.user_id"
          @select="handleFrequentLinkSelect"
        />
      </div>
    </component>

    <!-- 创建分享弹窗 -->
    <component :is="createShareModal">
      <CreateShareForm />
    </component>

    <!-- 重命名文件弹窗 -->
    <component :is="renameFileModal">
      <RenameFileForm />
    </component>

    <!-- 批量重命名弹窗 -->
    <component :is="batchRenameModal">
      <BatchRenameForm />
    </component>

    <!-- 分享进度弹窗（批量分享时显示） -->
    <component :is="shareProgressModal">
      <div v-if="shareProgress.total > 0" class="text-center">
        <!-- 进度条 -->
        <div class="mb-4">
          <div class="h-2 w-full rounded-full bg-gray-200">
            <div
              class="h-2 rounded-full bg-blue-600 transition-all duration-300"
              :style="{
                width: `${(shareProgress.current / shareProgress.total) * 100}%`,
              }"
            ></div>
          </div>
        </div>

        <!-- 进度文字 -->
        <div class="mb-2 text-sm text-gray-600">
          正在分享第 {{ shareProgress.current }} /
          {{ shareProgress.total }} 个文件
        </div>

        <!-- 当前分享的文件名 -->
        <div
          v-if="
            shareProgress.current > 0 && shareResults[shareProgress.current - 1]
          "
          class="mb-4 text-sm text-gray-800"
        >
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
      <div
        v-if="shareResultInfo && shareResults.length <= 1"
        class="text-center"
      >
        <!-- 成功图标 -->
        <div class="mb-4">
          <div
            class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100"
          >
            <svg
              class="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        <!-- 成功文本 -->
        <div class="mb-6">
          <h3 class="mb-2 text-lg font-medium text-gray-900">
            成功创建分享链接
          </h3>
        </div>

        <!-- 分享链接 -->
        <div class="mb-6 rounded-lg border bg-gray-50 p-3">
          <div class="mb-2 text-sm text-gray-600">分享链接：</div>
          <div class="break-all font-mono text-sm text-gray-800">
            {{ shareResultInfo.url }}
          </div>
        </div>

        <!-- 复制按钮 -->
        <div class="flex justify-center">
          <button
            class="rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600"
            @click="copyShareLink"
          >
            复制链接
          </button>
        </div>
      </div>

      <!-- 批量分享结果 -->
      <div v-else-if="shareResults.length > 1">
        <!-- 统计信息 -->
        <div class="mb-6 text-center">
          <div class="mb-4">
            <div
              class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100"
            >
              <svg
                class="h-8 w-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                />
              </svg>
            </div>
          </div>

          <h3 class="mb-2 text-lg font-medium text-gray-900">批量分享完成</h3>

          <div class="text-sm text-gray-600">
            成功：{{
              shareResults.filter((r: any) => r.status === 'success').length
            }}个， 失败：{{
              shareResults.filter((r: any) => r.status === 'error').length
            }}个
          </div>
        </div>

        <!-- 详细结果列表 -->
        <div class="mb-6 max-h-60 overflow-y-auto">
          <div
            v-for="(item, index) in shareResults"
            :key="index"
            class="flex items-center justify-between border-b border-gray-100 px-3 py-2 last:border-b-0"
          >
            <div class="flex-1 truncate text-sm text-gray-800">
              {{ item.file.file_name }}
            </div>
            <div class="ml-2">
              <span
                v-if="item.status === 'success'"
                class="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs text-green-800"
              >
                <svg
                  class="mr-1 h-3 w-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                成功
              </span>
              <span
                v-else-if="item.status === 'error'"
                class="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs text-red-800"
              >
                <svg
                  class="mr-1 h-3 w-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clip-rule="evenodd"
                  />
                </svg>
                失败
              </span>
            </div>
          </div>
        </div>

        <!-- 成功的分享链接 -->
        <div
          v-if="
            shareResults.some((r: any) => r.status === 'success' && r.result)
          "
          class="mb-6"
        >
          <h4 class="mb-3 text-sm font-medium text-gray-900">分享链接：</h4>
          <div
            class="max-h-40 overflow-y-auto rounded-lg border bg-gray-50 p-3"
          >
            <div
              v-for="(item, index) in shareResults.filter(
                (r: any) => r.status === 'success' && r.result,
              )"
              :key="index"
              class="mb-3 rounded border bg-white p-2 last:mb-0"
            >
              <div class="mb-1 text-xs font-medium text-gray-600">
                {{ item.result?.title }}
              </div>
              <div class="flex items-center gap-2">
                <div class="flex-1 break-all font-mono text-xs text-gray-800">
                  {{ item.result?.url }}
                </div>
                <button
                  class="whitespace-nowrap rounded bg-blue-500 px-2 py-1 text-xs text-white transition-colors hover:bg-blue-600"
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
            v-if="
              shareResults.some((r: any) => r.status === 'success' && r.result)
            "
            class="rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600"
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
        sourceId: shareLink,
      }"
      title="选择要保存的文件"
      @confirm="handleFileSelectConfirm"
      @cancel="handleFileSelectCancel"
      @share-files-loaded="handleShareFilesLoaded"
    />

    <!-- 移动文件选择器 -->
    <FileSelector
      v-model:visible="moveFileSelectorVisible"
      :drive-type="formData.type"
      :auth-token="authToken"
      mode="disk"
      :title="`选择移动目标位置 (${currentOperationFiles.length} 个文件)`"
      @confirm="handleMoveFileConfirm"
      @cancel="handleMoveOrCopyCancel"
    />

    <!-- 复制文件选择器 -->
    <FileSelector
      v-model:visible="copyFileSelectorVisible"
      :drive-type="formData.type"
      :auth-token="authToken"
      mode="disk"
      :title="`选择复制目标位置 (${currentOperationFiles.length} 个文件)`"
      @confirm="handleCopyFileConfirm"
      @cancel="handleMoveOrCopyCancel"
    />

    <!-- 批量传输模态框 -->
    <BatchTransferModal
      v-model:visible="batchTransferModalVisible"
      :all-accounts="allAccounts"
      :is-mobile="isMobile"
      @cancel="closeBatchTransferModal"
    />

    <!-- 批量重命名悬浮窗 -->
    <BatchRenameFloatingWindow
      v-model:visible="showFloatingWindow"
      :task-id="floatingWindowTaskId"
      @close="showFloatingWindow = false"
    />
  </Page>
</template>
