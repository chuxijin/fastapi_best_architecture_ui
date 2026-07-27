import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridPropTypes } from '#/adapter/vxe-table';
import type {
  SpatialCubePatternDetail,
  SpatialCubePatternRenderType,
} from '#/api/study-plan';

import { h } from 'vue';

import { z } from '#/adapter/form';

export const renderTypeOptions: Array<{
  label: string;
  value: SpatialCubePatternRenderType;
}> = [
  { label: '内置图案', value: 'builtin' },
  { label: '远程图片', value: 'image' },
];

export const rotationPeriodOptions = [
  { label: '90°（四向等价）', value: 90 },
  { label: '180°（两向等价）', value: 180 },
  { label: '360°（方向敏感）', value: 360 },
];

export const statusOptions = [
  { label: '已启用', value: 'active' },
  { label: '已停用', value: 'inactive' },
];

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: { placeholder: '搜索名称、编码或素材地址' },
    fieldName: 'keyword',
    label: '关键词',
  },
  {
    component: 'Select',
    componentProps: { allowClear: true, options: renderTypeOptions },
    fieldName: 'render_type',
    label: '渲染方式',
  },
  {
    component: 'Select',
    componentProps: { allowClear: true, options: statusOptions },
    fieldName: 'status',
    label: '状态',
  },
];

export const schema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: { maxLength: 64, placeholder: '例如 wave' },
    fieldName: 'code',
    label: '素材编码',
    rules: 'required',
  },
  {
    component: 'Input',
    componentProps: { maxLength: 64, placeholder: '例如 波浪线' },
    fieldName: 'name',
    label: '素材名称',
    rules: 'required',
  },
  {
    component: 'Select',
    componentProps: { options: renderTypeOptions },
    defaultValue: 'builtin',
    fieldName: 'render_type',
    label: '渲染方式',
    rules: 'required',
  },
  {
    component: 'Select',
    componentProps: { options: rotationPeriodOptions },
    defaultValue: 360,
    fieldName: 'rotation_period',
    label: '旋转等价周期',
    rules: 'required',
  },
  {
    component: 'Input',
    componentProps: {
      maxLength: 1024,
      placeholder: 'https://cdn.example.com/cube/wave.webp',
    },
    dependencies: {
      if: (values) => values.render_type === 'image',
      triggerFields: ['render_type'],
    },
    fieldName: 'asset_url',
    label: '远程素材 URL',
    rules: z.string().url('请输入有效的 HTTP 或 HTTPS 地址'),
  },
  {
    component: 'Input',
    componentProps: { maxLength: 64, placeholder: '例如 1 或 2026-07' },
    defaultValue: '1',
    fieldName: 'asset_version',
    label: '素材版本',
    rules: 'required',
  },
  {
    component: 'InputNumber',
    componentProps: { min: 0, precision: 0 },
    defaultValue: 0,
    fieldName: 'sort',
    label: '排序',
  },
  {
    component: 'Switch',
    componentProps: { checkedChildren: '启用', unCheckedChildren: '停用' },
    defaultValue: true,
    fieldName: 'is_active',
    label: '状态',
  },
];

export function useColumns(
  onActionClick: (params: {
    code: 'delete' | 'edit';
    row: SpatialCubePatternDetail;
  }) => void,
): VxeGridPropTypes.Columns {
  return [
    { field: 'sort', title: '排序', width: 76 },
    {
      field: 'preview',
      title: '预览',
      width: 82,
      slots: { default: 'preview' },
    },
    {
      field: 'name',
      title: '素材',
      minWidth: 190,
      slots: { default: 'name' },
    },
    {
      field: 'render_type',
      title: '渲染方式',
      width: 110,
      slots: { default: 'render_type' },
    },
    {
      field: 'asset_url',
      title: '素材地址',
      minWidth: 260,
      showOverflow: 'tooltip',
      slots: { default: 'asset_url' },
    },
    {
      field: 'rotation_period',
      title: '旋转周期',
      width: 110,
      slots: { default: 'rotation_period' },
    },
    { field: 'asset_version', title: '版本', width: 120 },
    {
      field: 'is_active',
      title: '状态',
      width: 90,
      slots: { default: 'is_active' },
    },
    {
      field: 'updated_time',
      title: '更新时间',
      width: 170,
      formatter: ({ cellValue }) =>
        cellValue ? String(cellValue).replace('T', ' ').slice(0, 19) : '-',
    },
    {
      field: 'operation',
      title: '操作',
      width: 130,
      fixed: 'right',
      slots: {
        default: ({ row }) =>
          h('div', { class: 'flex gap-2' }, [
            h(
              'a',
              {
                class: 'text-primary cursor-pointer',
                onClick: () => onActionClick({ code: 'edit', row }),
              },
              '编辑',
            ),
            h(
              'a',
              {
                class: 'text-error cursor-pointer',
                onClick: () => onActionClick({ code: 'delete', row }),
              },
              '删除',
            ),
          ]),
      },
    },
  ];
}
