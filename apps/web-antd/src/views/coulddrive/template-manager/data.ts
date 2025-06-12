import type { VbenFormProps } from '@vben/common-ui';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { h } from 'vue';

import { $t } from '@vben/locales';

import { Tag, Switch } from 'ant-design-vue';

import { TEMPLATE_TYPE_OPTIONS, TEMPLATE_CATEGORY_OPTIONS } from '#/api/coulddrive';

// 重新导出以供组件使用
export { TEMPLATE_TYPE_OPTIONS, TEMPLATE_CATEGORY_OPTIONS };

// 查询表单配置
export const templateQuerySchema: VbenFormProps['schema'] = [
  {
    component: 'Select',
    componentProps: {
      placeholder: '请选择模板类型',
      options: [
        { label: '全部类型', value: '' },
        ...TEMPLATE_TYPE_OPTIONS,
      ],
      allowClear: true,
    },
    fieldName: 'template_type',
    label: '模板类型',
  },
  {
    component: 'Select',
    componentProps: {
      placeholder: '请选择分类',
      options: [
        { label: '全部分类', value: '' },
        ...TEMPLATE_CATEGORY_OPTIONS,
      ],
      allowClear: true,
    },
    fieldName: 'category',
    label: '分类',
  },
  {
    component: 'Select',
    componentProps: {
      placeholder: '请选择状态',
      options: [
        { label: '全部状态', value: '' },
        { label: '启用', value: true },
        { label: '禁用', value: false },
      ],
      allowClear: true,
    },
    fieldName: 'is_active',
    label: '状态',
  },
  {
    component: 'Select',
    componentProps: {
      placeholder: '请选择模板来源',
      options: [
        { label: '全部来源', value: '' },
        { label: '系统模板', value: true },
        { label: '用户模板', value: false },
      ],
      allowClear: true,
    },
    fieldName: 'is_system',
    label: '模板来源',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入关键词搜索模板名称或描述',
    },
    fieldName: 'keyword',
    label: '关键词',
  },
];

// 表格列配置
export function useTemplateColumns(onActionClick: (params: any) => void, onStatusChange: (row: any, newVal: boolean) => Promise<boolean>) {
  const columns: VxeGridProps['columns'] = [
    {
      type: 'checkbox',
      width: 50,
    },
    {
      field: 'id',
      title: 'ID',
      width: 80,
      sortable: true,
    },
    {
      field: 'template_name',
      title: '模板名称',
      minWidth: 150,
      showOverflow: 'tooltip',
    },
    {
      field: 'template_type',
      title: '模板类型',
      width: 120,
      slots: { default: 'template_type' },
    },
    {
      field: 'category',
      title: '分类',
      width: 120,
      slots: { default: 'category' },
    },
    {
      field: 'description',
      title: '描述',
      minWidth: 200,
      showOverflow: 'tooltip',
    },
    {
      field: 'tags',
      title: '标签',
      width: 150,
      slots: { default: 'tags' },
    },
    {
      field: 'is_active',
      title: '状态',
      width: 80,
      slots: { default: 'is_active' },
    },
    {
      field: 'is_system',
      title: '来源',
      width: 80,
      slots: { default: 'is_system' },
    },
    {
      field: 'usage_count',
      title: '使用次数',
      width: 100,
      sortable: true,
    },
    {
      title: '操作',
      width: 150,
      fixed: 'right',
      slots: { default: 'action' },
    },
  ];

  return columns;
}

// 模板表单配置
export const templateFormSchema: VbenFormProps['schema'] = [
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入模板名称',
      maxlength: 100,
      showCount: true,
    },
    fieldName: 'template_name',
    label: '模板名称',
    rules: 'required',
  },
  {
    component: 'Select',
    componentProps: {
      placeholder: '请选择模板类型',
      options: TEMPLATE_TYPE_OPTIONS,
    },
    fieldName: 'template_type',
    label: '模板类型',
    rules: 'required',
  },
  {
    component: 'Select',
    componentProps: {
      placeholder: '请选择分类',
      options: TEMPLATE_CATEGORY_OPTIONS,
      allowClear: true,
    },
    fieldName: 'category',
    label: '分类',
  },
  {
    component: 'Textarea',
    componentProps: {
      placeholder: '请输入模板描述',
      rows: 3,
      maxlength: 500,
      showCount: true,
    },
    fieldName: 'description',
    label: '描述',
  },
  {
    component: 'Select',
    componentProps: {
      placeholder: '请选择或输入标签',
      mode: 'tags',
      allowClear: true,
      options: [
        { label: '常用', value: '常用' },
        { label: '推荐', value: '推荐' },
        { label: '高效', value: '高效' },
        { label: '安全', value: '安全' },
        { label: '实验性', value: '实验性' },
      ],
    },
    fieldName: 'tags',
    label: '标签',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '规则配置将通过可视化编辑器设置',
      disabled: true,
    },
    fieldName: 'rule_config_json',
    label: '规则配置',
    rules: 'required',
    help: '请使用下方的可视化编辑器配置规则',
  },
  {
    component: 'Switch',
    componentProps: {
      checkedChildren: '启用',
      unCheckedChildren: '禁用',
    },
    fieldName: 'is_active',
    label: '状态',
    defaultValue: true,
  },
];

// 获取模板类型标签颜色
export function getTemplateTypeColor(type: string): string {
  const colorMap: Record<string, string> = {
    exclusion: 'red',
    rename: 'blue',
    custom: 'green',
  };
  return colorMap[type] || 'default';
}

// 获取模板类型标签文本
export function getTemplateTypeLabel(type: string): string {
  const option = TEMPLATE_TYPE_OPTIONS.find(opt => opt.value === type);
  return option?.label || type;
}

// 获取分类标签颜色
export function getCategoryColor(category: string): string {
  const colorMap: Record<string, string> = {
    file_filter: 'orange',
    path_processing: 'cyan',
    content_matching: 'purple',
    system_preset: 'geekblue',
    user_custom: 'magenta',
  };
  return colorMap[category] || 'default';
}

// 获取分类标签文本
export function getCategoryLabel(category: string): string {
  const option = TEMPLATE_CATEGORY_OPTIONS.find(opt => opt.value === category);
  return option?.label || category;
}

// 规则配置示例
export const RULE_CONFIG_EXAMPLES = {
  exclusion: {
    name: '排除临时文件',
    config: {
      rules: [
        {
          pattern: 'tmp',
          target: 'extension',
          item_type: 'any',
          mode: 'contains',
          case_sensitive: false
        },
        {
          pattern: 'temp',
          target: 'extension',
          item_type: 'any',
          mode: 'contains',
          case_sensitive: false
        }
      ]
    }
  },
  rename: {
    name: '文件名标准化',
    config: {
      rules: [
        {
          match_regex: '\\s+',
          replace_string: '_',
          target_scope: 'name',
          case_sensitive: false
        }
      ]
    }
  },
  custom: {
    name: '自定义规则',
    config: {
      type: 'custom',
      script: 'function process(item) { return item; }',
      parameters: {}
    }
  }
};
