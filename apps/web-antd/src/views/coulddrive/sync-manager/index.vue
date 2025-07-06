<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OnActionClickParams } from '#/adapter/vxe-table';

import { ref, computed, onMounted, onUnmounted } from 'vue';

import { Page, VbenButton, useVbenModal } from '@vben/common-ui';
import { AddData } from '@vben/icons';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { message, Switch } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getCoulddriveSyncConfigListApi,
  createCoulddriveSyncConfigApi,
  updateCoulddriveSyncConfigApi,
  deleteCoulddriveSyncConfigApi,
  executeCoulddriveSyncTaskApi,
  getAsyncTaskStatusApi,
} from '#/api';
import {
  syncConfigQuerySchema,
  useSyncConfigColumns,
  syncConfigFormSchema,
} from '#/views/coulddrive/sync-manager/data';

// 导入抽屉组件
import SyncDrawer from './sync-drawer.vue';

// 导入记录查看组件
import SyncRecordModal from './sync-record-modal.vue';

// 创建图标组件
const Play = createIconifyIcon('mdi:play');
const FileDocument = createIconifyIcon('mdi:file-document-outline');

// 记录查看相关状态
const recordModalVisible = ref(false);
const selectedConfigForRecord = ref<any>(null);

// 编辑状态
const editingConfigId = ref<number | null>(null);

// 抽屉状态
const drawerVisible = ref(false);
const drawerEditData = ref<any>(null);

// 开关加载状态
const switchLoadingMap = ref<Map<number, boolean>>(new Map());

// 任务执行状态
const executingTasks = ref<Map<number, {
  taskId: string;
  polling: boolean;
  startTime: Date;
  progress?: string;
}>>(new Map());

// 当前时间，用于实时更新运行时间显示
const currentTime = ref(new Date());

// 查询表单配置
const queryFormOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: {
    content: $t('page.form.query'),
  },
  schema: syncConfigQuerySchema,
};

// 表格配置
const gridOptions: VxeTableGridOptions = {
  rowConfig: {
    keyField: 'id',
  },
  checkboxConfig: {
    highlight: true,
  },
  height: 'auto',
  exportConfig: {},
  printConfig: {},
  toolbarConfig: {
    export: true,
    print: true,
    refresh: { code: 'query' },
    custom: true,
    zoom: true,
  },
  columns: useSyncConfigColumns(onActionClick, onStatusChange),
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        try {
          const params = {
            page: page.currentPage,
            size: page.pageSize,
            ...formValues,
          };
          return await getCoulddriveSyncConfigListApi(params);
        } catch (error) {
          message.error('获取同步配置列表失败');
          return {
            items: [],
            total: 0,
            page: 1,
            size: 10,
            total_pages: 0,
            links: {},
          };
        }
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: queryFormOptions,
  gridOptions
});

// 编辑表单配置
const [Form, formApi] = useVbenForm({
  wrapperClass: 'grid-cols-1 md:grid-cols-2',
  showDefaultActions: false,
  schema: syncConfigFormSchema,
});

// 创建编辑模态框（用于快速编辑）
const [EditModal, editModalApi] = useVbenModal({
  class: 'w-4/5 max-w-4xl',
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      editModalApi.lock();
      try {
        const formData = await formApi.getValues();

        // 构造API需要的数据格式
        const apiData = {
          enable: formData.enable ?? true,
          remark: formData.remark || '',
          type: formData.type || '',
          src_path: formData.src_path || '',
          src_meta: formData.src_meta || '',
          dst_path: formData.dst_path || '',
          dst_meta: formData.dst_meta || '',
          user_id: formData.user_id || null,
          cron: formData.cron || '',
          speed: formData.speed ?? 0,
          method: formData.method || 'incremental',
          exclude: formData.exclude || '',
          rename: formData.rename || '',
          end_time: formData.end_time || null,
        };

        if (editingConfigId.value) {
          await updateCoulddriveSyncConfigApi(editingConfigId.value, apiData);
          message.success('同步配置更新成功');
        }

        await editModalApi.close();
        onRefresh();
      } catch (error) {
        message.error('更新失败');
      } finally {
        editModalApi.unlock();
      }
    }
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const data = editModalApi.getData();
      if (data) {
        editingConfigId.value = data.id;
        formApi.setValues(data);
      }
    }
  },
});

// 状态更新处理
async function onStatusChange(row: any, newVal: boolean): Promise<boolean> {
  try {
    await updateCoulddriveSyncConfigApi(row.id, { enable: newVal });
    message.success(`配置已${newVal ? '启用' : '禁用'}`);
    return true;
  } catch (error) {
    console.error('更新状态失败:', error);
    message.error('状态更新失败');
    return false;
  }
}

// 处理开关状态变更
async function handleStatusChange(row: any, checked: boolean) {
  // 设置加载状态
  switchLoadingMap.value.set(row.id, true);

  try {
    await updateCoulddriveSyncConfigApi(row.id, { enable: checked });
    message.success(`配置已${checked ? '启用' : '禁用'}`);
    // 更新本地数据
    row.enable = checked;
  } catch (error) {
    console.error('更新状态失败:', error);
    message.error('状态更新失败');
    // 失败时恢复原状态
    row.enable = !checked;
  } finally {
    // 清除加载状态
    switchLoadingMap.value.delete(row.id);
  }
}

// 操作处理
function onActionClick({ code, row }: OnActionClickParams) {
  switch (code) {
    case 'execute': {
      executeSync(row);
      break;
    }
    case 'edit': {
      openEditDrawer(row);
      break;
    }
    case 'copy': {
      copyConfig(row);
      break;
    }
    case 'logs': {
      showLogs(row);
      break;
    }
    case 'delete': {
      deleteConfig(row);
      break;
    }
  }
}

// 执行同步
async function executeSync(config: any) {
  try {
    // 检查是否已经有任务在执行
    if (executingTasks.value.has(config.id)) {
      message.warning('该配置的同步任务正在执行中，请稍后再试');
      return;
    }

        // 设置执行中状态
    executingTasks.value.set(config.id, {
      taskId: `executing_${config.id}`,
      polling: false,
      startTime: new Date(),
      progress: '正在执行同步任务...'
    });

    message.loading({ content: '正在执行同步任务...', key: `sync_task_${config.id}` });

    // 提交同步任务
    const submitResult = await executeCoulddriveSyncTaskApi(config.id);

    if (submitResult.task_id) {
            // 检查是否已经完成（直接执行模式）
      if (submitResult.status === 'completed' && submitResult.result) {
        // 清除执行中状态
        executingTasks.value.delete(config.id);

        // 任务已经完成，直接显示结果
        const result = submitResult.result;
        if (result.success) {
          const stats = result.stats;
          let successMsg = '同步任务执行成功';

          if (stats) {
            const processed = stats.files_processed || 0;
            const transferred = stats.files_transferred || 0;
            const deleted = stats.files_deleted || 0;

            if (transferred > 0 || deleted > 0) {
              successMsg += `，处理 ${processed} 个文件，转存 ${transferred} 个，删除 ${deleted} 个`;
            } else {
              successMsg += '，文件已是最新状态';
            }
          }

          message.success({
            content: successMsg,
            key: `sync_task_${config.id}`
          });
        } else {
          const errorMsg = result.error || '同步任务执行失败';
          message.error({
            content: `同步任务失败：${errorMsg}`,
            key: `sync_task_${config.id}`
          });
        }

        onRefresh();
      } else {
        // 异步执行模式，记录任务状态并开始轮询
        executingTasks.value.set(config.id, {
          taskId: submitResult.task_id,
          polling: true,
          startTime: new Date(),
          progress: '正在初始化...'
        });

        message.success({
          content: '同步任务已提交，正在后台执行...',
          key: `sync_task_${config.id}`
        });

        // 开始轮询任务状态
        pollTaskStatus(config.id, submitResult.task_id);
      }
        } else {
      // 清除执行中状态
      executingTasks.value.delete(config.id);
      message.error({
        content: '提交同步任务失败',
        key: `sync_task_${config.id}`
      });
    }
  } catch (error) {
    // 清除执行中状态
    executingTasks.value.delete(config.id);
    message.error({
      content: '提交同步任务失败',
      key: `sync_task_${config.id}`
    });
  }
}

// 轮询任务状态
async function pollTaskStatus(configId: number, taskId: string) {
  const task = executingTasks.value.get(configId);
  if (!task || !task.polling) {
    return;
  }

  try {
    const statusResult = await getAsyncTaskStatusApi(taskId);

    if (statusResult.ready) {
      // 任务完成
      executingTasks.value.delete(configId);

      if (statusResult.successful && statusResult.result?.success) {
        const stats = statusResult.result.stats;
        let successMsg = '同步任务执行成功';

        if (stats) {
          const processed = stats.files_processed || 0;
          const transferred = stats.files_transferred || 0;
          const deleted = stats.files_deleted || 0;

          if (transferred > 0 || deleted > 0) {
            successMsg += `，处理 ${processed} 个文件，转存 ${transferred} 个，删除 ${deleted} 个`;
          } else {
            successMsg += '，文件已是最新状态';
          }
        }

        message.success({
          content: successMsg,
          key: `sync_task_${configId}`
        });
      } else {
        const errorMsg = statusResult.error || statusResult.result?.error || '同步任务执行失败';
        message.error({
          content: `同步任务失败：${errorMsg}`,
          key: `sync_task_${configId}`
        });
      }

      onRefresh();
    } else {
      // 任务还在执行，更新进度信息
      const task = executingTasks.value.get(configId);
      if (task) {
        // 根据任务状态更新进度描述
        switch (statusResult.status) {
          case 'PENDING':
            task.progress = '等待执行...';
            break;
          case 'STARTED':
            task.progress = '正在执行...';
            break;
          case 'PROGRESS':
            task.progress = '处理中...';
            break;
          default:
            task.progress = '执行中...';
        }
      }

      // 继续轮询
      setTimeout(() => pollTaskStatus(configId, taskId), 3000); // 3秒后再次检查
    }
  } catch (error) {
    // 轮询出错，停止轮询
    executingTasks.value.delete(configId);
    message.error({
      content: '查询任务状态失败',
      key: `sync_task_${configId}`
    });
  }
}

// 停止任务轮询
function stopTaskPolling(configId: number) {
  const task = executingTasks.value.get(configId);
  if (task) {
    task.polling = false;
    executingTasks.value.delete(configId);
  }
}

// 计算任务运行时间
function getRunningTime(configId: number): string {
  const task = executingTasks.value.get(configId);
  if (!task) return '';

  // 使用响应式的当前时间
  const now = currentTime.value;
  const diff = now.getTime() - task.startTime.getTime();
  const seconds = Math.max(0, Math.floor(diff / 1000)); // 确保不会出现负数
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}时${minutes % 60}分${seconds % 60}秒`;
  } else if (minutes > 0) {
    return `${minutes}分${seconds % 60}秒`;
  } else {
    return `${seconds}秒`;
  }
}

// 启动定时器更新当前时间
let timeUpdateInterval: NodeJS.Timeout | null = null;

// 组件挂载时启动定时器
onMounted(() => {
  timeUpdateInterval = setInterval(() => {
    currentTime.value = new Date();
  }, 1000); // 每秒更新一次
});

// 组件卸载时清理定时器
onUnmounted(() => {
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval);
    timeUpdateInterval = null;
  }
});

// 显示日志
function showLogs(config: any) {
  selectedConfigForRecord.value = config;
  recordModalVisible.value = true;
}

// 复制配置
async function copyConfig(config: any) {
  try {
    // 构造复制的数据，排除id和时间戳字段
    const copyData = {
      enable: config.enable ?? true,
      remark: `${config.remark}_副本`,
      type: config.type || '',
      src_path: config.src_path || '',
      src_meta: config.src_meta || '',
      dst_path: config.dst_path || '',
      dst_meta: config.dst_meta || '',
      user_id: config.user_id || null,
      cron: config.cron || '',
      speed: config.speed ?? 0,
      method: config.method || 'incremental',
      exclude: config.exclude || '',
      rename: config.rename || '',
      end_time: config.end_time || null,
    };

    await createCoulddriveSyncConfigApi(copyData);
    message.success(`配置 ${config.remark} 复制成功`);
    onRefresh();
  } catch (error) {
    console.error('复制配置失败:', error);
    message.error('复制配置失败');
  }
}

// 删除配置
async function deleteConfig(config: any) {
  try {
    await deleteCoulddriveSyncConfigApi(config.id);
    message.success(`删除配置 ${config.remark} 成功`);
    onRefresh();
  } catch (error) {
    message.error('删除配置失败');
  }
}

// 刷新表格
function onRefresh() {
  gridApi.query();
}

// 打开新增抽屉
function openCreateDrawer() {
  drawerEditData.value = null;
  drawerVisible.value = true;
}

// 打开编辑抽屉
function openEditDrawer(data: any) {
  drawerEditData.value = data;
  drawerVisible.value = true;
}

// 抽屉成功回调
function onDrawerSuccess() {
  drawerVisible.value = false;
  onRefresh();
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
                <div class="flex items-center justify-between w-full">
          <VbenButton @click="openCreateDrawer">
            <AddData class="size-5" />
            新增同步配置
          </VbenButton>

          <!-- 全局任务状态 -->
          <div v-if="executingTasks.size > 0" class="flex items-center gap-2 text-blue-600">
            <a-spin size="small" />
            <span>{{ executingTasks.size }} 个任务执行中</span>
          </div>
        </div>
      </template>

      <!-- 自定义开关列 -->
      <template #enable="{ row }">
        <a-switch
          :checked="Boolean(row.enable)"
          :loading="switchLoadingMap.get(row.id) || false"
          @change="(checked: boolean) => handleStatusChange(row, checked)"
        />
      </template>

            <!-- 执行状态列 -->
      <template #execution_status="{ row }">
        <div v-if="executingTasks.has(row.id)" class="flex flex-col gap-1">
          <div class="flex items-center gap-2">
            <a-spin size="small" />
            <span class="text-blue-600">执行中</span>
          </div>
          <div class="text-xs text-gray-500">
            {{ executingTasks.get(row.id)?.progress || '处理中...' }}
          </div>
          <div class="text-xs text-gray-400">
            已运行: {{ getRunningTime(row.id) }}
          </div>
          <a-button
            size="small"
            type="text"
            danger
            class="text-xs"
            @click="stopTaskPolling(row.id)"
          >
            停止监控
          </a-button>
        </div>
        <span v-else class="text-gray-500">空闲</span>
      </template>
    </Grid>

    <!-- 编辑模态框 -->
    <EditModal title="编辑同步配置">
      <Form />
    </EditModal>

    <!-- 同步配置抽屉 -->
    <SyncDrawer
      v-model:visible="drawerVisible"
      :edit-data="drawerEditData"
      @success="onDrawerSuccess"
    />

    <!-- 记录查看弹窗 -->
    <SyncRecordModal
      v-model:visible="recordModalVisible"
      :config-data="selectedConfigForRecord"
    />
  </Page>
</template>
