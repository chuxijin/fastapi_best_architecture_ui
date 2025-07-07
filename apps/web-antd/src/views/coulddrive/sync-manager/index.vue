<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OnActionClickParams } from '#/adapter/vxe-table';

import { ref, computed } from 'vue';

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
import { invalidateCache } from '#/api/request';
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
  status: 'idle' | 'executing' | 'completed';
  startTime?: Date;
}>>(new Map());

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
    // 设置执行中状态
    executingTasks.value.set(config.id, {
      status: 'executing',
      startTime: new Date()
    });

    message.loading({ content: '正在执行同步任务...', key: `sync_task_${config.id}` });

        // 提交同步任务
    const submitResult = await executeCoulddriveSyncTaskApi(config.id);

    if (submitResult.task_id) {
      // 设置已完成状态
      executingTasks.value.set(config.id, {
        status: 'completed'
      });

      // 检查是否有执行结果
      if (submitResult.status === 'completed' && (submitResult as any).result) {
        const result = (submitResult as any).result;
        if (result.success && result.stats) {
          const stats = result.stats;
          const processed = stats.files_processed || 0;
          const transferred = stats.files_transferred || 0;
          const deleted = stats.files_deleted || 0;
          const folderCreated = stats.folder_created || 0;

          let successMsg = '同步任务执行成功';
          const details = [];

          if (processed > 0) details.push(`处理 ${processed} 个文件`);
          if (transferred > 0) details.push(`转存 ${transferred} 个`);
          if (deleted > 0) details.push(`删除 ${deleted} 个`);
          // if (folderCreated > 0) details.push(`创建 ${folderCreated} 个文件夹`);

          if (details.length > 0) {
            successMsg += `，${details.join('，')}`;
          } else if (processed === 0) {
            successMsg += '，没有文件需要同步';
          }

          message.success({
            content: successMsg,
            key: `sync_task_${config.id}`
          });

          // 同步成功后清除配置缓存，以便刷新最后同步时间等信息
          invalidateCache('config');
        } else {
          const errorMsg = result.error || '同步任务执行失败';
          message.error({
            content: `同步任务失败：${errorMsg}`,
            key: `sync_task_${config.id}`
          });
        }
      } else {
        message.success({
          content: '同步任务已提交成功',
          key: `sync_task_${config.id}`
        });

        // 任务提交成功后也清除配置缓存
        invalidateCache('config');
      }

      // 3秒后重置为空闲状态并刷新表格
      setTimeout(() => {
        executingTasks.value.set(config.id, { status: 'idle' });
        onRefresh(); // 刷新表格数据以显示最新的同步时间等信息
      }, 3000);
    } else {
      // 重置为空闲状态
      executingTasks.value.set(config.id, { status: 'idle' });

      message.error({
        content: '提交同步任务失败',
        key: `sync_task_${config.id}`
      });
    }
  } catch (error) {
    // 重置为空闲状态
    executingTasks.value.set(config.id, { status: 'idle' });

    message.error({
      content: '提交同步任务失败',
      key: `sync_task_${config.id}`
    });
  }
}





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
        <VbenButton @click="openCreateDrawer">
          <AddData class="size-5" />
          新增同步配置
        </VbenButton>
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
        <div class="flex items-center gap-2">
          <template v-if="executingTasks.get(row.id)?.status === 'executing'">
            <a-spin size="small" />
            <span class="text-blue-600">执行中</span>
          </template>
          <template v-else-if="executingTasks.get(row.id)?.status === 'completed'">
            <span class="text-green-600">已完成</span>
          </template>
          <template v-else>
            <span class="text-gray-500">空闲</span>
          </template>
        </div>
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
