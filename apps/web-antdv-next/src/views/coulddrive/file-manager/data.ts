import type { VbenFormProps } from '@vben/common-ui';

import type { VxeGridProps } from '#/adapter/vxe-table';

// 查询表单配置 - 完全禁用表单
export function getQueryFormConfig(): null | VbenFormProps {
  return null; // 返回 null 来完全禁用表单
}

// 检查是否为移动端
function isMobile(): boolean {
  return window.innerWidth < 768; // 768px以下认为是移动端
}

// 表格列配置 - 支持响应式
export function getTableColumns(): VxeGridProps['columns'] {
  const baseColumns: VxeGridProps['columns'] = [
    {
      type: 'checkbox' as const,
      width: isMobile() ? 40 : 60, // 移动端缩小复选框
    },
    {
      field: 'file_name',
      title: '文件名',
      minWidth: isMobile() ? 150 : 200,
      align: 'left' as const,
      sortable: true,
      formatter: ({ row }: { row: any }) => {
        const icon = row.is_folder ? '📁' : '📄';
        return `${icon} ${row.file_name}`;
      },
    },
  ];

  // 移动端只显示文件名，桌面端显示完整信息
  if (!isMobile()) {
    baseColumns.push(
      {
        field: 'file_size',
        title: '文件大小',
        minWidth: 120,
        align: 'right' as const,
        sortable: true,
        formatter: ({ row }: { row: any }) => {
          return row.is_folder ? '-' : formatFileSize(row.file_size || 0);
        },
      },
      {
        field: 'created_at',
        title: '创建时间',
        minWidth: 180,
        align: 'center' as const,
        sortable: true,
        formatter: ({ row }: { row: any }) => {
          return formatDateTime(row.created_at);
        },
      },
      {
        field: 'updated_at',
        title: '修改时间',
        minWidth: 180,
        align: 'center' as const,
        sortable: true,
        formatter: ({ row }: { row: any }) => {
          return formatDateTime(row.updated_at);
        },
      },
    );
  }

  return baseColumns;
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

  if (typeof timestamp === 'string') {
    const date = new Date(timestamp);
    if (!Number.isNaN(date.getTime())) {
      if (date.getFullYear() <= 1971) {
        return '-';
      }

      return date.toLocaleString();
    }
  }

  let ts = typeof timestamp === 'string' ? Number(timestamp) : timestamp;
  if (Number.isNaN(ts)) {
    return '-';
  }

  // 如果是13位时间戳（毫秒级），转换为10位（秒级）
  if (ts > 9_999_999_999) {
    ts = Math.floor(ts / 1000);
  }

  if (!ts) {
    return '-';
  }

  const date = new Date(ts * 1000);
  if (Number.isNaN(date.getTime()) || date.getFullYear() <= 1971) {
    return '-';
  }

  return date.toLocaleString();
}
