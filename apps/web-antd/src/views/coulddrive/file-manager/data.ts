import type { VbenFormProps } from '@vben/common-ui';

import type { VxeGridProps } from '#/adapter/vxe-table';

// 查询表单配置 - 完全禁用表单
export function getQueryFormConfig(): null | VbenFormProps {
  return null; // 返回 null 来完全禁用表单
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
      sortable: true,
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
      sortable: true,
      formatter: ({ row }: { row: any }) => {
        return row.is_folder ? '-' : formatFileSize(row.file_size || 0);
      },
    },
    {
      field: 'created_at',
      title: '创建时间',
      width: 180,
      align: 'center',
      sortable: true,
      formatter: ({ row }: { row: any }) => {
        return formatDateTime(row.created_at);
      },
    },
    {
      field: 'updated_at',
      title: '修改时间',
      width: 180,
      align: 'center',
      sortable: true,
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
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

// 时间格式化函数
export function formatDateTime(timestamp: number | string): string {
  if (!timestamp) return '-';

  let ts =
    typeof timestamp === 'string' ? Number.parseInt(timestamp) : timestamp;

  // 如果是13位时间戳（毫秒级），转换为10位（秒级）
  if (ts > 9_999_999_999) {
    ts = Math.floor(ts / 1000);
  }

  return ts ? new Date(ts * 1000).toLocaleString() : '-';
}
