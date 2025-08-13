<script setup lang="ts">
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  SyncTaskDetail,
  SyncTaskItemListParams,
  SyncTaskListParams,
} from '#/api';

import { computed, ref, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';

import { message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getSyncTaskItemListApi, getSyncTaskListApi } from '#/api';

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  configData: null,
});
const emit = defineEmits<{ 'update:visible': [value: boolean] }>();

const History = createIconifyIcon('mdi:history');
const FileCheck = createIconifyIcon('mdi:file-check');
// const FileRemove = createIconifyIcon('mdi:file-remove');
const FileAlert = createIconifyIcon('mdi:file-alert');
// const Download = createIconifyIcon('mdi:download');

interface Props {
  visible?: boolean;
  configData?: any;
}

const selectedTask = ref<null | SyncTaskDetail>(null);

const statusOptions = [
  { label: '全部', value: '' },
  { label: '等待中', value: 'pending' },
  { label: '执行中', value: 'running' },
  { label: '已完成', value: 'completed' },
  { label: '失败', value: 'failed' },
  { label: '已取消', value: 'cancelled' },
];

const operationTypeOptions = [
  { label: '全部', value: '' },
  { label: '添加', value: 'add' },
  { label: '删除', value: 'delete' },
  { label: '复制', value: 'copy' },
  { label: '移动', value: 'move' },
  { label: '重命名', value: 'rename' },
  { label: '创建', value: 'create' },
];

const selectedTaskStatus = ref('');
const selectedItemStatus = ref('');
const selectedOperationType = ref('');

const modalTitle = computed(() => {
  return props.configData
    ? `同步记录 - ${props.configData.remark || '未命名配置'}`
    : '同步记录';
});

const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    pending: 'default',
    running: 'processing',
    completed: 'success',
    failed: 'error',
    cancelled: 'warning',
  };
  return colorMap[status] || 'default';
};

const getOperationTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    add: 'blue',
    delete: 'red',
    copy: 'green',
    move: 'purple',
    rename: 'orange',
    create: 'cyan',
  };
  return colorMap[type] || 'default';
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}秒`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}小时${minutes}分钟`;
  }
}

function selectTask(task: SyncTaskDetail) {
  selectedTask.value = task;
  selectedItemStatus.value = '';
  selectedOperationType.value = '';
  setTimeout(() => {
    taskItemGridApi.reload();
  }, 100);
}

const taskGridOptions: VxeTableGridOptions = {
  rowConfig: { keyField: 'id' },
  height: 'auto',
  columns: [
    { field: 'id', title: 'ID', width: 80, align: 'center' },
    {
      field: 'status',
      title: '状态',
      width: 100,
      cellRender: {
        name: 'CellTag',
        options: statusOptions.map((o) => ({
          label: o.label,
          value: o.value,
          color: getStatusColor(o.value),
        })),
      },
    },
    {
      field: 'start_time',
      title: '开始时间',
      width: 180,
      formatter: ({ row }) =>
        row.start_time ? new Date(row.start_time).toLocaleString() : '-',
    },
    {
      field: 'dura_time',
      title: '执行时长',
      width: 120,
      formatter: ({ row }) => formatDuration(row.dura_time),
    },
    {
      field: 'task_num',
      title: '任务摘要',
      minWidth: 200,
      showOverflow: 'tooltip',
      formatter: ({ row }) => row.task_num || '-',
    },
    {
      field: 'err_msg',
      title: '错误信息',
      minWidth: 200,
      showOverflow: 'tooltip',
      formatter: ({ row }) => row.err_msg || '-',
    },
    {
      field: 'operation',
      title: '操作',
      width: 100,
      align: 'center',
      fixed: 'right',
      cellRender: {
        name: 'CellOperation',
        attrs: { onClick: ({ row }: any) => selectTask(row) },
        options: [{ code: 'view', text: '查看详情', color: 'primary' }],
      },
    },
  ],
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        if (!props.configData?.id) {
          return {
            items: [],
            total: 0,
            page: 1,
            size: 10,
            total_pages: 0,
            links: {},
          };
        }
        try {
          const params: SyncTaskListParams = {
            status: selectedTaskStatus.value || undefined,
            page: page.currentPage,
            size: page.pageSize,
          };
          return await getSyncTaskListApi(props.configData.id, params);
        } catch (error) {
          console.error('加载任务列表失败:', error);
          message.error('加载任务列表失败');
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

const taskItemGridOptions: VxeTableGridOptions = {
  rowConfig: { keyField: 'id' },
  height: 'auto',
  exportConfig: {},
  toolbarConfig: {
    export: true,
    refresh: { code: 'query' },
    custom: true,
    zoom: true,
  },
  columns: [
    { field: 'id', title: 'ID', width: 80, align: 'center' },
    {
      field: 'type',
      title: '操作类型',
      width: 100,
      cellRender: {
        name: 'CellTag',
        options: operationTypeOptions.map((o) => ({
          label: o.label,
          value: o.value,
          color: getOperationTypeColor(o.value),
        })),
      },
    },
    {
      field: 'file_name',
      title: '文件名',
      width: 200,
      showOverflow: 'tooltip',
    },
    {
      field: 'src_path',
      title: '源路径',
      minWidth: 200,
      showOverflow: 'tooltip',
    },
    {
      field: 'dst_path',
      title: '目标路径',
      minWidth: 200,
      showOverflow: 'tooltip',
    },
    {
      field: 'file_size',
      title: '文件大小',
      width: 120,
      formatter: ({ row }) => formatFileSize(row.file_size),
    },
    {
      field: 'status',
      title: '状态',
      width: 100,
      cellRender: {
        name: 'CellTag',
        options: statusOptions.map((o) => ({
          label: o.label,
          value: o.value,
          color: getStatusColor(o.value),
        })),
      },
    },
    {
      field: 'err_msg',
      title: '错误信息',
      minWidth: 200,
      showOverflow: 'tooltip',
      formatter: ({ row }) => row.err_msg || '-',
    },
  ],
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        if (!selectedTask.value?.id) {
          return {
            items: [],
            total: 0,
            page: 1,
            size: 20,
            total_pages: 0,
            links: {},
          };
        }
        try {
          const params: SyncTaskItemListParams = {
            status: selectedItemStatus.value || undefined,
            operation_type: selectedOperationType.value || undefined,
            page: page.currentPage,
            size: page.pageSize,
          };
          return await getSyncTaskItemListApi(selectedTask.value.id, params);
        } catch (error) {
          console.error('加载任务项列表失败:', error);
          message.error('加载任务项列表失败');
          return {
            items: [],
            total: 0,
            page: 1,
            size: 20,
            total_pages: 0,
            links: {},
          };
        }
      },
    },
  },
};

const [TaskGrid, taskGridApi] = useVbenVxeGrid({
  gridOptions: taskGridOptions,
});
const [TaskItemGrid, taskItemGridApi] = useVbenVxeGrid({
  gridOptions: taskItemGridOptions,
});

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      selectedTask.value = null;
      setTimeout(() => {
        taskGridApi.reload();
      }, 100);
    }
  },
);

watch(selectedTaskStatus, () => {
  setTimeout(() => {
    taskGridApi.reload();
  }, 100);
});

watch([selectedItemStatus, selectedOperationType], () => {
  if (selectedTask.value) {
    setTimeout(() => {
      taskItemGridApi.reload();
    }, 100);
  }
});

// async function exportTaskItems() {
//   if (!selectedTask.value) {
//     message.warning('请先选择一个任务');
//     return;
//   }
//   try {
//     const params: SyncTaskItemListParams = {
//       status: selectedItemStatus.value || undefined,
//       operation_type: selectedOperationType.value || undefined,
//       page: 1,
//       size: 10000,
//     };
//     const response = await getSyncTaskItemListApi(selectedTask.value.id, params);
//     const allTaskItems = response.items;
//     if (!allTaskItems || allTaskItems.length === 0) {
//       message.warning('没有可导出的任务项数据');
//       return;
//     }
//     const csvContent = [
//       'ID,操作类型,文件名,源路径,目标路径,文件大小,状态,错误信息',
//       ...allTaskItems.map((item: SyncTaskItemDetail) =>
//         [
//           item.id,
//           item.type,
//           item.file_name,
//           item.src_path,
//           item.dst_path,
//           formatFileSize(item.file_size),
//           item.status,
//           item.err_msg || '',
//         ]
//           .map((field) => `"${String(field).replaceAll('"', '""')}"`)
//           .join(','),
//       ),
//     ].join('\n');
//     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//     const link = document.createElement('a');
//     link.href = URL.createObjectURL(blob);
//     link.download = `任务项详情_${selectedTask.value.id}_${new Date().toISOString().slice(0, 10)}.csv`;
//     link.click();
//     URL.revokeObjectURL(link.href);
//     message.success('任务项详情导出成功');
//   } catch (error) {
//     console.error('导出任务项详情失败:', error);
//     message.error('导出失败，请稍后重试');
//   }
// }

function handleClose() {
  emit('update:visible', false);
}
</script>

<template>
  <a-modal
    :visible="visible"
    :title="modalTitle"
    width="95%"
    :footer="null"
    :z-index="1000"
    @cancel="handleClose"
  >
    <div class="sync-record-container">
      <div class="task-list-section">
        <a-card size="small" class="task-list-card">
          <template #title>
            <div class="card-title">
              <History class="mr-2" />
              执行历史
            </div>
          </template>
          <template #extra>
            <div class="card-filters">
              <a-select
                v-model:value="selectedTaskStatus"
                placeholder="状态筛选"
                style="width: 120px"
                size="small"
              >
                <a-select-option
                  v-for="option in statusOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </a-select-option>
              </a-select>
            </div>
          </template>
          <TaskGrid />
        </a-card>
      </div>

      <div v-if="selectedTask" class="task-detail-section">
        <a-card size="small" class="task-items-card">
          <template #title>
            <div class="card-title">
              <FileCheck class="mr-2" />
              任务项详情 (任务ID: {{ selectedTask.id }})
            </div>
          </template>
          <template #extra>
            <div class="card-filters">
              <a-select
                v-model:value="selectedItemStatus"
                placeholder="状态筛选"
                style="width: 120px"
                size="small"
              >
                <a-select-option
                  v-for="option in statusOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </a-select-option>
              </a-select>
              <a-select
                v-model:value="selectedOperationType"
                placeholder="操作类型"
                style="width: 120px"
                size="small"
              >
                <a-select-option
                  v-for="option in operationTypeOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </a-select-option>
              </a-select>
            </div>
          </template>
          <TaskItemGrid />
        </a-card>
      </div>

      <div v-else class="empty-state">
        <a-card size="small" class="empty-card">
          <div class="empty-content">
            <FileAlert class="empty-icon" />
            <p class="empty-text">请从上方选择一个任务查看详情</p>
          </div>
        </a-card>
      </div>
    </div>
  </a-modal>
</template>

<style scoped>
.sync-record-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 75vh;
  overflow: hidden;
}

.task-list-section {
  flex: 0 0 40%;
  min-height: 280px;
}

.task-detail-section {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  min-height: 350px;
}

.task-list-card,
.task-items-card,
.empty-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.task-list-card :deep(.ant-card-body),
.task-items-card :deep(.ant-card-body) {
  flex: 1;
  padding: 8px;
  overflow: hidden;
}

.card-title {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
}

.card-filters {
  display: flex;
  gap: 8px;
  align-items: center;
}

.empty-state {
  display: flex;
  flex: 1;
  flex-direction: column;
}

.empty-card {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #999;
}

.empty-icon {
  margin-bottom: 16px;
  font-size: 48px;
  opacity: 0.5;
}

.empty-text {
  margin: 0;
  font-size: 14px;
  opacity: 0.7;
}

.mb-3 {
  margin-bottom: 12px;
}

:deep(.vxe-table) {
  font-size: 12px;
  border: none;
}

:deep(.vxe-table .vxe-header--row) {
  background-color: #fafafa;
}

:deep(.vxe-table .vxe-body--row:hover) {
  background-color: #f5f5f5;
}

:deep(.vxe-table .vxe-cell) {
  padding: 6px 8px;
}

:deep(.vxe-table--tooltip-wrapper),
:deep(.vxe-tooltip--wrapper) {
  z-index: 9999 !important;
}

:global(.vxe-table--tooltip-wrapper) {
  z-index: 9999 !important;
}

:global(.vxe-tooltip--wrapper) {
  z-index: 9999 !important;
}

:global(.vxe-table--tooltip) {
  z-index: 9999 !important;
}
</style>
