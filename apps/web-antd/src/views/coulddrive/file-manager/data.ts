import type { VbenFormProps } from '@vben/common-ui';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { computed } from 'vue';

import { $t } from '@vben/locales';
import { DRIVE_TYPE_OPTIONS } from '#/api';

// 查询表单配置
export function getQueryFormConfig(
  accountOptions: any,
  onFormChange: (values: any) => void,
): VbenFormProps {
  return {
    collapsed: false,
    showCollapseButton: false,
    showDefaultActions: false,
    wrapperClass: 'grid-cols-1 md:grid-cols-2 gap-3',
    handleValuesChange: onFormChange,
    schema: [
      {
        component: 'Select',
        componentProps: {
          placeholder: '请选择网盘类型',
          options: DRIVE_TYPE_OPTIONS,
        },
        fieldName: 'type',
        label: '网盘类型',
      },
      {
        component: 'Select',
        componentProps: {
          placeholder: computed(() =>
            accountOptions.value.length ? '请选择关联账号' : '请先选择网盘类型'
          ),
          disabled: computed(() => !accountOptions.value.length),
          options: computed(() => accountOptions.value),
        },
        fieldName: 'user_id',
        label: '关联账号',
      },
    ],
  };
}

// 表格列配置
export function getTableColumns(): VxeGridProps['columns'] {
  return [
    {
      type: 'checkbox',
      width: 60,
    },
    {
      field: 'file_name',
      title: '文件名',
      minWidth: 200,
      align: 'left',
      formatter: ({ row }: { row: any }) => {
        const icon = row.is_folder ? '📁' : '📄';
        return `${icon} ${row.file_name}`;
      },
    },
    {
      field: 'file_size',
      title: '文件大小',
      width: 120,
      align: 'right',
      formatter: ({ row }: { row: any }) => {
        return row.is_folder ? '-' : formatFileSize(row.file_size || 0);
      },
    },
    {
      field: 'created_at',
      title: '创建时间',
      width: 180,
      align: 'center',
      formatter: ({ row }: { row: any }) => {
        return formatDateTime(row.created_at);
      },
    },
    {
      field: 'updated_at',
      title: '修改时间',
      width: 180,
      align: 'center',
      formatter: ({ row }: { row: any }) => {
        return formatDateTime(row.updated_at);
      },
    },
  ];
}

// 文件大小格式化函数
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 时间格式化函数
export function formatDateTime(timestamp: string | number): string {
  if (!timestamp) return '-';

  let ts = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;

  // 如果是13位时间戳（毫秒级），转换为10位（秒级）
  if (ts > 9999999999) {
    ts = Math.floor(ts / 1000);
  }

  return ts ? new Date(ts * 1000).toLocaleString() : '-';
}
