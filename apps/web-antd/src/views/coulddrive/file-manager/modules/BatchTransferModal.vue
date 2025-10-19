<script setup lang="ts">
import type { CoulddriveDriveAccountDetail, CoulddriveFileInfo } from '#/api';

import { ref, watch } from 'vue';

import { message } from 'ant-design-vue';

import {
  cancelCoulddriveShareApi,
  createCoulddriveShareApi,
  getCoulddriveShareFileListApi,
  getDriveTypeLabel,
  removeCoulddriveFilesApi,
  transferCoulddriveFilesApi,
} from '#/api';
import DraggableProgress from '#/components/DraggableProgress.vue';
import EmbeddedFileSelector from '#/components/EmbeddedFileSelector.vue';

// Props
interface Props {
  visible: boolean;
  allAccounts: CoulddriveDriveAccountDetail[];
  isMobile: boolean;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  cancel: [];
  'update:visible': [value: boolean];
}>();

// 状态
const sourceAccount = ref<CoulddriveDriveAccountDetail | null>(null);
const targetAccount = ref<CoulddriveDriveAccountDetail | null>(null);
const sourceFiles = ref<CoulddriveFileInfo[]>([]);
const sourcePath = ref('/');
const targetPath = ref('/');
const sourceFileId = ref('0');
const targetFileId = ref('0');

// 进度条相关
const progressVisible = ref(false);
const progressData = ref({
  operation: '' as 'copy' | 'move',
  currentStep: 0,
  totalSteps: 4,
  stepName: '',
  progress: 0,
  logs: [] as string[],
  shareInfo: null as any,
});

// 选择源账号
function selectSourceAccount(account: CoulddriveDriveAccountDetail) {
  if (!account.is_valid) {
    message.warning('该账号状态异常，无法选择');
    return;
  }
  sourceAccount.value = account;
  sourcePath.value = '/';
  sourceFileId.value = '0';
  sourceFiles.value = []; // 重置选中文件列表
}

// 选择目标账号
function selectTargetAccount(account: CoulddriveDriveAccountDetail) {
  if (!account.is_valid) {
    message.warning('该账号状态异常，无法选择');
    return;
  }
  targetAccount.value = account;
  targetPath.value = '/';
  targetFileId.value = '0';
}

// 处理目标路径确认
function handleTargetPathConfirm(data: any) {
  targetPath.value = data.path;
  targetFileId.value = data.fileId;
}

// 处理源文件选择确认
function handleSourceFilesConfirm(data: any) {
  sourceFiles.value = data.selectedFiles || [];
  sourcePath.value = data.path;
  sourceFileId.value = data.fileId;
}

// 获取进度状态
function getProgressStatus(): 'error' | 'paused' | 'running' | 'success' {
  if (
    progressData.value.stepName.includes('失败') ||
    progressData.value.logs.some((log) => log.includes('❌'))
  ) {
    return 'error';
  } else if (
    progressData.value.stepName.includes('完成') &&
    progressData.value.progress === 100
  ) {
    return 'success';
  } else {
    return 'running';
  }
}

// 处理批量传输
async function handleBatchTransfer(operation: 'copy' | 'move') {
  if (!sourceAccount.value) {
    message.warning('请选择源账号');
    return;
  }

  if (!targetAccount.value) {
    message.warning('请选择目标账号');
    return;
  }

  if (sourceFiles.value.length === 0) {
    message.warning('请先在源路径中选择要传输的文件');
    return;
  }

  // 检查是否为相同类型账号
  if (sourceAccount.value.type !== targetAccount.value.type) {
    message.error('暂不支持不同类型账号之间的传输');
    return;
  }

  // 初始化进度状态
  progressData.value = {
    operation,
    currentStep: 0,
    totalSteps: operation === 'move' ? 4 : 3, // 移动需要删除源文件，多一步；复制不删除源文件
    stepName: '准备中...',
    progress: 0,
    logs: [
      `开始${operation === 'move' ? '移动' : '复制'}${sourceFiles.value.length}个文件`,
    ],
    shareInfo: null,
  };

  // 显示进度条，关闭模态框
  progressVisible.value = true;
  emit('update:visible', false);

  let transferSuccess = false;

  try {
    // 步骤1：创建分享
    await executeTransferStep1_CreateShare();

    // 步骤2：转存文件
    await executeTransferStep2_Transfer();

    // 步骤3：移动操作需要删除源文件
    if (operation === 'move') {
      await executeTransferStep3_DeleteSource();
    }

    transferSuccess = true;

    // 完成
    progressData.value.stepName = '传输完成';
    progressData.value.progress = 100;
    progressData.value.logs.push(
      `${operation === 'move' ? '移动' : '复制'}操作完成`,
    );

    message.success(`${operation === 'move' ? '移动' : '复制'}操作完成`);
  } catch (error: any) {
    console.error(`批量${operation === 'move' ? '移动' : '复制'}失败:`, error);
    progressData.value.stepName = '传输失败';
    progressData.value.logs.push(`传输失败: ${error?.message || '未知错误'}`);
    message.error(
      `${operation === 'move' ? '移动' : '复制'}失败: ${error?.message || '未知错误'}`,
    );
  } finally {
    // 无论成功还是失败，都要取消分享链接
    try {
      if (progressData.value.shareInfo) {
        await executeTransferStep4_CancelShare();
      }
    } catch (cancelError: any) {
      console.error('取消分享失败:', cancelError);
      // 取消分享失败不影响整体结果，只记录日志
    }
  }
}

// 步骤1：创建分享
async function executeTransferStep1_CreateShare() {
  progressData.value.currentStep = 1;
  progressData.value.stepName = '正在进行复制/移动前置操作';
  progressData.value.progress = 25;
  progressData.value.logs.push('正在进行复制/移动前置操作...');

  const shareParams = {
    drive_type: sourceAccount.value!.type,
    file_name: `批量传输_${Date.now()}`,
    file_ids: sourceFiles.value.map((f) => f.file_id),
    expired_type: 1, // 1天有效期
  };

  const shareResult = await createCoulddriveShareApi(
    shareParams,
    sourceAccount.value!.cookies || '',
  );
  progressData.value.shareInfo = shareResult;
}

// 步骤2：转存文件
async function executeTransferStep2_Transfer() {
  progressData.value.currentStep = 2;
  progressData.value.stepName = '正在复制/移动中';
  progressData.value.progress = 50;
  progressData.value.logs.push('正在复制/移动中...');

  const shareListParams = {
    drive_type: targetAccount.value!.type,
    source_type: 'link',
    source_id: progressData.value.shareInfo.url,
    file_path: '/', // 分享链接的根路径
  };

  const shareFileListResponse = await getCoulddriveShareFileListApi(
    shareListParams,
    targetAccount.value!.cookies || '',
  );

  // 处理API响应，正确提取items字段
  let shareFileList: any[] = [];
  if (Array.isArray(shareFileListResponse)) {
    shareFileList = shareFileListResponse;
  } else if (shareFileListResponse && 'items' in shareFileListResponse) {
    shareFileList = shareFileListResponse.items;
  } else if (shareFileListResponse && 'list' in shareFileListResponse) {
    shareFileList = (shareFileListResponse as any).list;
  } else if (shareFileListResponse && 'data' in shareFileListResponse) {
    const data = (shareFileListResponse as any).data;
    if (Array.isArray(data)) {
      shareFileList = data;
    } else if (data && 'list' in data) {
      shareFileList = data.list;
    } else if (data && 'items' in data) {
      shareFileList = data.items;
    }
  }

  if (!shareFileList || shareFileList.length === 0) {
    throw new Error('无法获取分享文件列表');
  }

  // 构建文件扩展信息，包含stoken和share_fid_token
  const filesExtInfo = sourceFiles.value.map((sourceFile) => {
    const shareFile = shareFileList.find(
      (sf: any) => sf.file_id === sourceFile.file_id,
    );
    if (!shareFile) {
      throw new Error(`未找到文件 ${sourceFile.file_name} 的分享信息`);
    }

    return {
      file_id: sourceFile.file_id,
      file_ext: shareFile.file_ext || {},
    };
  });

  // 提取所有文件的share_fid_tokens
  const shareFidTokens = shareFileList.map(
    (file: any) => file.file_ext?.share_fid_token || '',
  );

  // 获取第一个文件的扩展信息作为基础信息
  const firstShareFile = shareFileList[0];
  const firstFileExt = firstShareFile?.file_ext || {};

  const transferParams = {
    drive_type: targetAccount.value!.type,
    source_type: 'link',
    source_id: progressData.value.shareInfo.url,
    source_path: '/', // 分享链接的根路径
    target_path: targetPath.value,
    file_ids: sourceFiles.value.map((f) => f.file_id),
    ext: {
      // 展开第一个文件的扩展信息作为基础信息
      ...firstFileExt,
      // 添加目标目录和文件扩展信息
      to_pdir_fid: targetFileId.value || '0', // 目标目录的file_id
      target_id: targetFileId.value || '0', // 目标目录的file_id（放在ext中）
      pdir_fid: firstShareFile?.parent_id || '0', // 分享文件的父目录ID
      files_ext_info: filesExtInfo, // 所有文件的扩展信息
      share_fid_tokens: shareFidTokens, // 所有文件的share_fid_token
      password: progressData.value.shareInfo.password,
    },
  };

  await transferCoulddriveFilesApi(
    transferParams,
    targetAccount.value!.cookies || '',
  );
}

// 步骤3：删除源文件（仅移动操作）
async function executeTransferStep3_DeleteSource() {
  progressData.value.currentStep = 3;
  progressData.value.stepName = '正在进行复制/移动善后操作';
  progressData.value.progress = 75;
  progressData.value.logs.push('正在进行复制/移动善后操作...');

  const removeParams = {
    drive_type: sourceAccount.value!.type,
    file_ids: sourceFiles.value.map((f) => f.file_id),
  };

  await removeCoulddriveFilesApi(
    removeParams,
    sourceAccount.value!.cookies || '',
  );
}

// 步骤4：取消分享
async function executeTransferStep4_CancelShare() {
  const finalStep = progressData.value.operation === 'move' ? 4 : 3;
  progressData.value.currentStep = finalStep;
  progressData.value.stepName = '正在进行复制/移动善后操作';
  progressData.value.progress = 90;

  try {
    // 调用取消分享API - 后端期望的是shareid_list数组
    const cancelParams = {
      drive_type: sourceAccount.value!.type,
      shareid_list: [progressData.value.shareInfo.share_id], // 注意：这里是数组
    };

    await cancelCoulddriveShareApi(
      cancelParams,
      sourceAccount.value!.cookies || '',
    );
  } catch (error: any) {
    console.error('取消分享失败:', error);
    // 取消分享失败不影响整体结果
  }
}

// 重置状态
function resetState() {
  sourceAccount.value = null;
  targetAccount.value = null;
  sourceFiles.value = [];
  sourcePath.value = '/';
  targetPath.value = '/';
  sourceFileId.value = '0';
  targetFileId.value = '0';
}

// 监听visible变化，重置状态
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      resetState();
    }
  },
);
</script>

<template>
  <div>
    <!-- 批量传输模态框 -->
    <div
      v-if="visible"
      class="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-50"
      @click.self="$emit('cancel')"
    >
      <div
        class="w-full max-w-6xl rounded-lg bg-white p-6 shadow-xl"
        :class="
          isMobile
            ? 'mx-4 max-h-[90vh] overflow-y-auto'
            : 'max-h-[80vh] overflow-y-auto'
        "
      >
        <!-- 模态框标题 -->
        <div class="mb-6 flex items-center justify-between">
          <h2 class="text-xl font-semibold text-gray-800">批量文件传输</h2>
          <button
            class="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            @click="$emit('cancel')"
          >
            <svg
              class="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- 传输布局 -->
        <div
          class="grid gap-6"
          :class="isMobile ? 'grid-cols-1' : 'grid-cols-3'"
        >
          <!-- 左侧：源账号选择 -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-gray-700">源账号</h3>

            <!-- 源账号选择 -->
            <div class="space-y-3">
              <div class="text-sm font-medium text-gray-600">选择源账号</div>
              <div
                class="max-h-40 space-y-2 overflow-y-auto rounded-lg border bg-white p-3"
              >
                <div
                  v-for="account in allAccounts"
                  :key="account.id"
                  class="cursor-pointer rounded-lg border p-3 transition-all duration-200 hover:shadow-sm"
                  :class="{
                    'border-blue-500 bg-blue-50 shadow-sm':
                      sourceAccount?.id === account.id,
                    'border-gray-200 bg-white hover:border-gray-300':
                      sourceAccount?.id !== account.id && account.is_valid,
                    'border-gray-300 bg-gray-50 opacity-60': !account.is_valid,
                  }"
                  @click="selectSourceAccount(account)"
                >
                  <div class="flex items-center space-x-2">
                    <div
                      class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white"
                    >
                      {{
                        (
                          account.username ||
                          account.user_id?.toString() ||
                          '用户'
                        )
                          .charAt(0)
                          .toUpperCase()
                      }}
                    </div>
                    <div class="flex-1">
                      <div class="text-sm font-medium">
                        {{ account.username || account.user_id }}
                      </div>
                      <div class="text-xs text-gray-500">
                        {{ getDriveTypeLabel(account.type) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 源路径和文件选择 -->
            <div v-if="sourceAccount" class="space-y-3">
              <div class="text-sm font-medium text-gray-600">源路径和文件</div>

              <!-- 嵌入式文件选择器 -->
              <EmbeddedFileSelector
                :drive-type="sourceAccount.type"
                :auth-token="sourceAccount.cookies || ''"
                initial-path="/"
                @confirm="handleSourceFilesConfirm"
                @cancel="() => {}"
              />
            </div>
          </div>

          <!-- 中间：传输操作 -->
          <div class="flex flex-col items-center justify-center space-y-6">
            <!-- 传输箭头 -->
            <div class="flex items-center justify-center">
              <svg
                class="h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </div>

            <!-- 操作按钮 -->
            <div class="space-y-3">
              <button
                class="w-full rounded-lg bg-green-500 px-6 py-3 font-medium text-white hover:bg-green-600 disabled:opacity-50"
                :disabled="
                  !sourceAccount || !targetAccount || sourceFiles.length === 0
                "
                @click="handleBatchTransfer('copy')"
              >
                复制文件
              </button>
              <button
                class="w-full rounded-lg bg-blue-500 px-6 py-3 font-medium text-white hover:bg-blue-600 disabled:opacity-50"
                :disabled="
                  !sourceAccount || !targetAccount || sourceFiles.length === 0
                "
                @click="handleBatchTransfer('move')"
              >
                移动文件
              </button>
            </div>
          </div>

          <!-- 右侧：目标账号选择 -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-gray-700">目标位置</h3>

            <!-- 目标账号选择 -->
            <div class="space-y-3">
              <div class="text-sm font-medium text-gray-600">选择目标账号</div>
              <div
                class="max-h-40 space-y-2 overflow-y-auto rounded-lg border bg-white p-3"
              >
                <div
                  v-for="account in allAccounts"
                  :key="account.id"
                  class="cursor-pointer rounded-lg border p-3 transition-all duration-200 hover:shadow-sm"
                  :class="{
                    'border-blue-500 bg-blue-50 shadow-sm':
                      targetAccount?.id === account.id,
                    'border-gray-200 bg-white hover:border-gray-300':
                      targetAccount?.id !== account.id && account.is_valid,
                    'border-gray-300 bg-gray-50 opacity-60': !account.is_valid,
                  }"
                  @click="selectTargetAccount(account)"
                >
                  <div class="flex items-center space-x-2">
                    <div
                      class="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-xs font-semibold text-white"
                    >
                      {{
                        (
                          account.username ||
                          account.user_id?.toString() ||
                          '用户'
                        )
                          .charAt(0)
                          .toUpperCase()
                      }}
                    </div>
                    <div class="flex-1">
                      <div class="text-sm font-medium">
                        {{ account.username || account.user_id }}
                      </div>
                      <div class="text-xs text-gray-500">
                        {{ getDriveTypeLabel(account.type) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 目标路径选择 -->
            <div v-if="targetAccount" class="space-y-3">
              <div class="text-sm font-medium text-gray-600">目标路径</div>

              <!-- 嵌入式文件选择器 - 仅用于导航，不选择文件 -->
              <EmbeddedFileSelector
                :drive-type="targetAccount.type"
                :auth-token="targetAccount.cookies || ''"
                initial-path="/"
                :navigation-only="true"
                @confirm="handleTargetPathConfirm"
                @cancel="() => {}"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 批量传输进度条 -->
    <DraggableProgress
      v-model:visible="progressVisible"
      :title="progressData.operation === 'move' ? '批量移动' : '批量复制'"
      :progress="progressData.progress"
      :current-step="progressData.currentStep"
      :total-steps="progressData.totalSteps"
      :current-step-name="progressData.stepName"
      :logs="progressData.logs"
      :status="getProgressStatus()"
      @close="progressVisible = false"
    />
  </div>
</template>
