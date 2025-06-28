import type { TableColumnsType } from 'ant-design-vue';
import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';

import { $t } from '@vben/locales';
import {
  RESOURCE_DOMAIN_OPTIONS,
  RESOURCE_TYPE_OPTIONS,
  DOMAIN_SUBJECT_MAPPING,
  DRIVE_TYPE_TAG_OPTIONS,
  DRIVE_TYPE_LABEL_MAP,
  DRIVE_TYPE_COLOR_MAP,
  getDomainSubjectMappingApi,
  getSubjectsByDomainApi
} from '#/api';

// 资源状态选项
export const RESOURCE_STATUS_OPTIONS = [
  { label: '正常', value: 1, color: 'green' },
  { label: '停用', value: 0, color: 'red' },
] as const;

// 审核状态选项
export const AUDIT_STATUS_OPTIONS = [
  { label: '待审核', value: 0, color: 'orange' },
  { label: '已通过', value: 1, color: 'green' },
  { label: '已拒绝', value: 2, color: 'red' },
] as const;

// 过期类型选项
export const EXPIRED_TYPE_OPTIONS = [
  { label: '永久', value: 0, color: 'green' },
  { label: '定时', value: 1, color: 'orange' },
] as const;

// 状态颜色映射
export const STATUS_COLOR_MAP = {
  0: 'red',
  1: 'green',
} as const;

// 状态标签映射
export const STATUS_LABEL_MAP = {
  0: '停用',
  1: '正常',
} as const;

// 审核状态颜色映射
export const AUDIT_STATUS_COLOR_MAP = {
  0: 'orange',
  1: 'green',
  2: 'red',
} as const;

// 审核状态标签映射
export const AUDIT_STATUS_LABEL_MAP = {
  0: '待审核',
  1: '已通过',
  2: '已拒绝',
} as const;

// 过期类型颜色映射
export const EXPIRED_TYPE_COLOR_MAP = {
  0: 'green',
  1: 'orange',
} as const;

// 过期类型标签映射
export const EXPIRED_TYPE_LABEL_MAP = {
  0: '永久',
  1: '定时',
} as const;

// 表格列配置
export const RESOURCE_TABLE_COLUMNS: TableColumnsType = [
  {
    title: '主要名字',
    dataIndex: 'main_name',
    key: 'main_name',
    width: 80,
    ellipsis: true,
  },
  {
    title: '标题',
    dataIndex: 'title',
    key: 'title',
    width: 200,
    ellipsis: true,
  },
  {
    title: '领域',
    dataIndex: 'domain',
    key: 'domain',
    width: 100,
  },
  {
    title: '科目',
    dataIndex: 'subject',
    key: 'subject',
    width: 100,
  },
  {
    title: '资源类型',
    dataIndex: 'resource_type',
    key: 'resource_type',
    width: 120,
  },
  {
    title: '网盘类型',
    dataIndex: 'url_type',
    key: 'url_type',
    width: 120,
  },
  {
    title: '浏览量',
    dataIndex: 'view_count',
    key: 'view_count',
    width: 80,
    align: 'center',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 80,
  },
  {
    title: '审核状态',
    dataIndex: 'audit_status',
    key: 'audit_status',
    width: 100,
  },
  {
    title: '链接',
    dataIndex: 'url',
    key: 'url',
    width: 80,
  },
  {
    title: '创建时间',
    dataIndex: 'created_time',
    key: 'created_time',
    width: 180,
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
    fixed: 'right',
  },
];

// 浏览量趋势表格列配置
export const VIEW_TREND_TABLE_COLUMNS: TableColumnsType = [
  {
    title: '记录时间',
    dataIndex: 'record_time',
    key: 'record_time',
    width: 180,
  },
  {
    title: '浏览量',
    dataIndex: 'view_count',
    key: 'view_count',
    width: 120,
    align: 'right',
  },
];

// 默认分页配置
export const DEFAULT_PAGINATION = {
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`,
};

// 默认搜索表单
export const DEFAULT_SEARCH_FORM = {
  keyword: '',
  domain: '',
  subject: '',
  resource_type: '',
  url_type: '',
  status: undefined,
  audit_status: undefined,
  page: 1,
  size: 10,
};

// 默认统计数据
export const DEFAULT_STATISTICS = {
  total_count: 0,
  active_count: 0,
  pending_audit_count: 0,
  approved_count: 0,
  rejected_count: 0,
  deleted_count: 0,
  total_views: 0,
};

// 查询表单配置
export const resourceQuerySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入关键词搜索',
    },
    fieldName: 'keyword',
    label: '关键词',
  },
  {
    component: 'Select',
    componentProps: {
      options: RESOURCE_DOMAIN_OPTIONS,
      placeholder: '请选择领域',
      allowClear: true,
    },
    fieldName: 'domain',
    label: '领域',
  },
  {
    component: 'Select',
    componentProps: {
      placeholder: '请选择科目',
      allowClear: true,
      options: [],
    },
    fieldName: 'subject',
    label: '科目',
  },
  {
    component: 'Select',
    componentProps: {
      options: RESOURCE_TYPE_OPTIONS,
      placeholder: '请选择资源类型',
    },
    fieldName: 'resource_type',
    label: '资源类型',
  },
  {
    component: 'Select',
    componentProps: {
      options: [
        { label: '百度网盘', value: 'BaiduDrive' },
        { label: '夸克网盘', value: 'QuarkDrive' },
        { label: 'Alist网盘', value: 'AlistDrive' },
      ],
      placeholder: '请选择网盘类型',
      allowClear: true,
    },
    fieldName: 'url_type',
    label: '网盘类型',
  },
  {
    component: 'Select',
    componentProps: {
      options: RESOURCE_STATUS_OPTIONS,
      placeholder: '请选择状态',
      allowClear: true,
    },
    fieldName: 'status',
    label: '状态',
  },
  {
    component: 'Select',
    componentProps: {
      options: AUDIT_STATUS_OPTIONS,
      placeholder: '请选择审核状态',
      allowClear: true,
    },
    fieldName: 'audit_status',
    label: '审核状态',
  },
];

// 工具函数
export const getUrlTypeLabel = (type: string) => {
  return DRIVE_TYPE_LABEL_MAP[type as keyof typeof DRIVE_TYPE_LABEL_MAP] || type;
};

export const getUrlTypeColor = (type: string) => {
  return DRIVE_TYPE_COLOR_MAP[type as keyof typeof DRIVE_TYPE_COLOR_MAP] || 'default';
};

export const getStatusLabel = (status: number) => {
  return STATUS_LABEL_MAP[status as keyof typeof STATUS_LABEL_MAP] || '未知';
};

export const getStatusColor = (status: number) => {
  return STATUS_COLOR_MAP[status as keyof typeof STATUS_COLOR_MAP] || 'default';
};

export const getAuditStatusLabel = (status: number) => {
  return AUDIT_STATUS_LABEL_MAP[status as keyof typeof AUDIT_STATUS_LABEL_MAP] || '未知';
};

export const getAuditStatusColor = (status: number) => {
  return AUDIT_STATUS_COLOR_MAP[status as keyof typeof AUDIT_STATUS_COLOR_MAP] || 'default';
};

export const getExpiredTypeLabel = (type: number) => {
  return EXPIRED_TYPE_LABEL_MAP[type as keyof typeof EXPIRED_TYPE_LABEL_MAP] || '未知';
};

export const getExpiredTypeColor = (type: number) => {
  return EXPIRED_TYPE_COLOR_MAP[type as keyof typeof EXPIRED_TYPE_COLOR_MAP] || 'default';
};

// 格式化文件大小
export const formatFileSize = (size: number) => {
  if (!size) return '-';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let index = 0;
  let fileSize = size;

  while (fileSize >= 1024 && index < units.length - 1) {
    fileSize /= 1024;
    index++;
  }

  return `${fileSize.toFixed(2)} ${units[index]}`;
};

// 格式化日期时间
export const formatDateTime = (dateTime: string) => {
  return new Date(dateTime).toLocaleString('zh-CN');
};

export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('复制失败:', error);
    return false;
  }
};

// 表格列配置函数
export function useResourceColumns(
  onActionClick?: OnActionClickFn<any>,
): VxeGridProps['columns'] {
  return [
    {
      type: 'checkbox',
      width: 50,
      align: 'center',
    },
    {
      field: 'id',
      title: 'ID',
      width: 80,
      align: 'center',
    },
    {
      field: 'main_name',
      title: '主要名字',
      minWidth: 120,
      showOverflow: 'tooltip',
    },
    {
      field: 'title',
      title: '标题',
      minWidth: 150,
      showOverflow: 'tooltip',
    },
    {
      field: 'domain',
      title: '领域',
      width: 100,
      align: 'center',
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'blue', label: '教育', value: '教育' },
          { color: 'green', label: '科技', value: '科技' },
          { color: 'orange', label: '影视', value: '影视' },
        ],
      },
    },
    {
      field: 'subject',
      title: '科目',
      minWidth: 100,
      align: 'center',
      showOverflow: 'tooltip',
    },
    {
      field: 'resource_type',
      title: '资源类型',
      width: 100,
      align: 'center',
    },
    {
      field: 'url_type',
      title: '网盘类型',
      width: 100,
      align: 'center',
      cellRender: {
        name: 'CellTag',
        options: [...DRIVE_TYPE_TAG_OPTIONS],
      },
    },
    {
      field: 'view_count',
      title: '浏览量',
      width: 80,
      align: 'center',
      cellRender: {
        name: 'CellText',
      },
    },
    {
      field: 'status',
      title: '状态',
      width: 80,
      align: 'center',
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'red', label: '停用', value: 0 },
          { color: 'green', label: '正常', value: 1 },
        ],
      },
    },
    {
      field: 'audit_status',
      title: '审核状态',
      width: 100,
      align: 'center',
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'orange', label: '待审核', value: 0 },
          { color: 'green', label: '已通过', value: 1 },
          { color: 'red', label: '已拒绝', value: 2 },
          { color: 'green', label: '已通过', value: 4 },
        ],
      },
    },
    {
      field: 'created_time',
      title: '创建时间',
      minWidth: 160,
      align: 'center',
      formatter: ({ row }) => {
        return row.created_time ? new Date(row.created_time).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }) : '-';
      },
    },
    {
      field: 'operation',
      title: $t('page.table.operation'),
      align: 'center',
      fixed: 'right',
      width: 200,
      cellRender: {
        attrs: {
          nameField: 'main_name',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'view',
            text: '查看',
            color: 'primary',
          },
          {
            code: 'trend',
            text: '趋势',
            color: 'success',
          },
          'edit',
          {
            code: 'delete',
            text: '删除',
          },
        ],
      },
    },
  ];
}

// 表单配置函数
export function createResourceFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Select',
      componentProps: {
        options: RESOURCE_DOMAIN_OPTIONS,
        placeholder: '请选择领域',
        onChange: async (value: string, formApi: any) => {
          // 当领域改变时，清空科目并更新科目选项
          formApi.setFieldValue('subject', '');

          if (value) {
            try {
              // 从本地映射获取科目选项
              const subjectOptions = DOMAIN_SUBJECT_MAPPING[value as keyof typeof DOMAIN_SUBJECT_MAPPING] || [];

              // 更新科目字段的选项
              formApi.updateSchema([
                {
                  fieldName: 'subject',
                  componentProps: {
                    options: subjectOptions,
                    placeholder: '请选择科目',
                  },
                },
              ]);
            } catch (error) {
              console.error('获取科目选项失败:', error);
            }
          } else {
            // 清空科目选项
            formApi.updateSchema([
              {
                fieldName: 'subject',
                componentProps: {
                  options: [],
                  placeholder: '请先选择领域',
                },
              },
            ]);
          }
        },
      },
      fieldName: 'domain',
      label: '领域',
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        options: [],
        placeholder: '请先选择领域',
      },
      fieldName: 'subject',
      label: '科目',
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入主要名字',
      },
      fieldName: 'main_name',
      label: '主要名字',
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        options: RESOURCE_TYPE_OPTIONS,
        placeholder: '请选择资源类型',
      },
      fieldName: 'resource_type',
      label: '资源类型',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入资源链接',
        type: 'url',
      },
      fieldName: 'url',
      label: '资源链接',
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        options: [
          { label: '百度网盘', value: 'BaiduDrive' },
          { label: '夸克网盘', value: 'QuarkDrive' },
          { label: 'Alist网盘', value: 'AlistDrive' },
        ],
        placeholder: '请选择网盘类型',
      },
      fieldName: 'url_type',
      label: '网盘类型',
      rules: 'required',
    },
    {
      component: 'InputNumber',
      componentProps: {
        placeholder: '请输入用户ID',
        min: 1,
      },
      fieldName: 'user_id',
      label: '用户ID',
      rules: 'required',
    },
    {
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入描述',
        rows: 3,
      },
      fieldName: 'description',
      label: '描述',
    },
    {
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入资源介绍',
        rows: 3,
      },
      fieldName: 'resource_intro',
      label: '资源介绍',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入图片链接',
        type: 'url',
      },
      fieldName: 'resource_image',
      label: '资源图片',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入提取码',
      },
      fieldName: 'extract_code',
      label: '提取码',
    },
    {
      component: 'Switch',
      fieldName: 'is_temp_file',
      label: '是否为临时文件',
      defaultValue: false,
    },
    {
      component: 'InputNumber',
      componentProps: {
        placeholder: '请输入价格',
        min: 0,
        step: 0.01,
        precision: 2,
      },
      fieldName: 'price',
      label: '价格',
    },
    {
      component: 'InputNumber',
      componentProps: {
        placeholder: '请输入建议价格',
        min: 0,
        step: 0.01,
        precision: 2,
      },
      fieldName: 'suggested_price',
      label: '建议价格',
    },
    {
      component: 'InputNumber',
      componentProps: {
        placeholder: '请输入排序值',
        min: 0,
      },
      fieldName: 'sort',
      label: '排序',
      defaultValue: 0,
    },
    {
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入备注',
        rows: 2,
      },
      fieldName: 'remark',
      label: '备注',
    },
  ];
}

// 保持向后兼容性
export const resourceFormSchema = createResourceFormSchema();
