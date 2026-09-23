import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type {
  OcAnnouncementResult,
  OcCompanyResult,
  OcWebsiteResult,
} from '#/plugins/oc/api';

import { $t } from '@vben/locales';

/** 招聘类型选项（源站筛选器权威分类） */
export const recruitmentTypeOptions = [
  { label: '秋招', value: '秋招' },
  { label: '秋招提前批', value: '秋招提前批' },
  { label: '秋招补录', value: '秋招补录' },
  { label: '春招', value: '春招' },
  { label: '春招补录', value: '春招补录' },
  { label: '实习', value: '实习' },
  { label: '暑期实习', value: '暑期实习' },
  { label: '日常实习', value: '日常实习' },
  { label: '社招', value: '社招' },
];

/* ============ 公司列表 ============ */

/** 公司类型选项（源站筛选器权威分类） */
export const companyTypeOptions = [
  { label: '央国企', value: '央国企' },
  { label: '民企', value: '民企' },
  { label: '事业单位', value: '事业单位' },
  { label: '银行', value: '银行' },
  { label: '外企/合资', value: '外企/合资' },
  { label: '社会机构', value: '社会机构' },
];

/** 行业选项（源站行业列聚合分类） */
export const industryOptions = [
  // 信息科技
  { label: '互联网/人工智能', value: '互联网/人工智能' },
  { label: '科技', value: '科技' },
  { label: '互联网', value: '互联网' },
  { label: 'IT/互联网', value: 'IT/互联网' },
  { label: '软件技术', value: '软件技术' },
  { label: '游戏', value: '游戏' },
  { label: '电商/跨境电商', value: '电商/跨境电商' },
  { label: '智能硬件/机器人', value: '智能硬件/机器人' },
  { label: '电子/半导体', value: '电子/半导体' },
  { label: '通信服务/电信运营', value: '通信服务/电信运营' },
  // 金融
  { label: '银行/金融', value: '银行/金融' },
  { label: '银行/国有行', value: '银行/国有行' },
  { label: '金融/证券', value: '金融/证券' },
  { label: '金融', value: '金融' },
  // 医药生物
  { label: '生物医药', value: '生物医药' },
  { label: '生物制药/生命科学', value: '生物制药/生命科学' },
  // 能源化工
  { label: '能源/电力', value: '能源/电力' },
  { label: '新能源', value: '新能源' },
  { label: '石油石化/化学化工', value: '石油石化/化学化工' },
  { label: '矿产/钢铁', value: '矿产/钢铁' },
  // 装备制造
  { label: '机械装备/电气系统', value: '机械装备/电气系统' },
  { label: '车企/汽车零部件', value: '车企/汽车零部件' },
  { label: '电器/家电', value: '电器/家电' },
  {
    label: '高端装备与国防科技/航空航天',
    value: '高端装备与国防科技/航空航天',
  },
  // 建筑地产
  { label: '建筑地产/市政工程', value: '建筑地产/市政工程' },
  { label: '地产/建筑', value: '地产/建筑' },
  { label: '物业/产业园', value: '物业/产业园' },
  // 消费
  { label: '消费', value: '消费' },
  { label: '快消零售/食品', value: '快消零售/食品' },
  { label: '服装/纺织', value: '服装/纺织' },
  { label: '酒店/餐饮', value: '酒店/餐饮' },
  { label: '烟草制品/烟草制造业', value: '烟草制品/烟草制造业' },
  { label: '造纸/纸制品', value: '造纸/纸制品' },
  // 商业服务
  { label: '专业服务', value: '专业服务' },
  { label: '商务服务/咨询', value: '商务服务/咨询' },
  {
    label: '多元化综合业务集团公司/投资集团',
    value: '多元化综合业务集团公司/投资集团',
  },
  { label: '进出口贸易/供应链', value: '进出口贸易/供应链' },
  { label: '物流/供应链', value: '物流/供应链' },
  { label: '交通运输/物流仓储', value: '交通运输/物流仓储' },
  // 教育科研文化
  { label: '教育', value: '教育' },
  { label: '教育培训/在线教育', value: '教育培训/在线教育' },
  { label: '文化/传媒', value: '文化/传媒' },
  { label: '传媒/直播', value: '传媒/直播' },
  { label: '学术科研/研究所', value: '学术科研/研究所' },
  // 公共与其他
  { label: '事业单位', value: '事业单位' },
  { label: '行政事业/公共服务', value: '行政事业/公共服务' },
  { label: '农林/畜牧', value: '农林/畜牧' },
  { label: '其他', value: '其他' },
];

export const companyQuerySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'name',
    label: '公司名称',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: companyTypeOptions,
      placeholder: $t('ui.placeholder.select'),
    },
    fieldName: 'company_type',
    label: '公司类型',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      showSearch: true,
      optionFilterProp: 'label',
      options: industryOptions,
      placeholder: $t('ui.placeholder.select'),
    },
    fieldName: 'industry',
    label: '所属行业',
  },
  {
    component: 'Input',
    fieldName: 'location',
    label: '地点',
  },
];

export function useCompanyColumns(
  onActionClick?: OnActionClickFn<OcCompanyResult>,
): VxeGridProps['columns'] {
  return [
    {
      field: 'seq',
      title: $t('common.table.id'),
      type: 'seq',
      width: 50,
      fixed: 'left',
    },
    {
      field: 'name',
      title: '公司名称',
      minWidth: 160,
      fixed: 'left',
    },
    {
      field: 'company_type',
      title: '公司类型',
      width: 100,
      formatter({ cellValue }) {
        return cellValue || '未知';
      },
      cellRender: {
        name: 'CellTag',
      },
    },
    {
      field: 'industry',
      title: '所属行业',
      minWidth: 130,
      showOverflow: 'ellipsis',
      formatter({ cellValue }) {
        return cellValue || '-';
      },
    },
    {
      field: 'company_size',
      title: '规模',
      width: 90,
      formatter({ cellValue }) {
        return cellValue || '-';
      },
    },
    {
      field: 'location',
      title: '地点',
      minWidth: 120,
      showOverflow: 'ellipsis',
      formatter({ cellValue }) {
        return cellValue || '-';
      },
    },
    {
      field: 'websites',
      title: '网站数',
      width: 80,
      align: 'center',
      formatter({ row }) {
        return row.websites?.length ?? 0;
      },
    },
    {
      field: 'created_time',
      title: $t('common.table.created_time'),
      width: 168,
    },
    {
      field: 'operation',
      title: $t('common.table.operation'),
      align: 'center',
      fixed: 'right',
      width: 200,
      cellRender: {
        attrs: {
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'announcement',
            text: '公告',
          },
          'edit',
          'delete',
        ],
      },
    },
  ];
}

export const companyFormSchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'name',
    label: '公司名称',
    rules: 'required',
  },
  {
    component: 'Input',
    fieldName: 'short_name',
    label: '公司简称',
  },
  {
    component: 'Select',
    fieldName: 'company_type',
    label: '公司类型',
    componentProps: {
      allowClear: true,
      options: companyTypeOptions,
      placeholder: $t('ui.placeholder.select'),
    },
  },
  {
    component: 'Select',
    fieldName: 'industry',
    label: '所属行业',
    componentProps: {
      allowClear: true,
      showSearch: true,
      optionFilterProp: 'label',
      options: industryOptions,
      placeholder: $t('ui.placeholder.select'),
    },
  },
  {
    component: 'Input',
    fieldName: 'company_size',
    label: '公司规模',
  },
  {
    component: 'Input',
    fieldName: 'location',
    label: '地点',
  },
  {
    component: 'Textarea',
    formItemClass: 'md:col-span-2',
    fieldName: 'remark',
    label: '备注',
    componentProps: {
      rows: 3,
    },
  },
];

/* ============ 网站列表 ============ */

export const websiteQuerySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'company_name',
    label: '公司名称',
  },
  {
    component: 'Input',
    fieldName: 'name',
    label: '网站名称',
  },
  {
    component: 'Input',
    fieldName: 'url',
    label: '网站链接',
  },
];

export function useWebsiteColumns(
  onActionClick?: OnActionClickFn<OcWebsiteResult>,
): VxeGridProps['columns'] {
  return [
    {
      field: 'seq',
      title: $t('common.table.id'),
      type: 'seq',
      width: 50,
      fixed: 'left',
    },
    {
      field: 'company_name',
      title: '所属公司',
      minWidth: 160,
      fixed: 'left',
    },
    {
      field: 'name',
      title: '网站名称',
      minWidth: 150,
      showOverflow: 'ellipsis',
      formatter({ cellValue }) {
        return cellValue || '-';
      },
    },
    {
      field: 'url',
      title: '网站链接',
      minWidth: 220,
      showOverflow: 'tooltip',
      slots: { default: 'url' },
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 120,
      showOverflow: 'ellipsis',
      formatter({ cellValue }) {
        return cellValue || '-';
      },
    },
    {
      field: 'created_time',
      title: $t('common.table.created_time'),
      width: 168,
    },
    {
      field: 'operation',
      title: $t('common.table.operation'),
      align: 'center',
      fixed: 'right',
      width: 120,
      cellRender: {
        attrs: {
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: ['edit', 'delete'],
      },
    },
  ];
}

export const websiteFormSchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'url',
    label: '网站链接',
    rules: 'required',
    componentProps: {
      placeholder: 'https://...',
    },
  },
  {
    component: 'Input',
    fieldName: 'name',
    label: '网站名称',
    componentProps: {
      placeholder: '官网/投递入口/招聘公告等',
    },
  },
  {
    component: 'Textarea',
    fieldName: 'remark',
    label: '备注',
    componentProps: {
      rows: 3,
    },
  },
];

/* ============ 招聘公告（公司抽屉内） ============ */

export function useAnnouncementColumns(
  onActionClick?: OnActionClickFn<OcAnnouncementResult>,
): VxeGridProps['columns'] {
  return [
    {
      field: 'seq',
      title: $t('common.table.id'),
      type: 'seq',
      width: 50,
      fixed: 'left',
    },
    {
      field: 'title',
      title: '公告标题',
      minWidth: 170,
      showOverflow: 'tooltip',
      fixed: 'left',
    },
    {
      field: 'recruitment_type',
      title: '招聘类型',
      width: 95,
      cellRender: {
        name: 'CellTag',
      },
    },
    {
      field: 'recruit_target',
      title: '招聘对象',
      width: 110,
      showOverflow: 'tooltip',
      formatter({ cellValue }) {
        return cellValue || '-';
      },
    },
    {
      field: 'positions',
      title: '岗位',
      minWidth: 150,
      showOverflow: 'tooltip',
      formatter({ cellValue }) {
        return cellValue || '-';
      },
    },
    {
      field: 'location',
      title: '地点',
      width: 110,
      showOverflow: 'tooltip',
      formatter({ cellValue }) {
        return cellValue || '-';
      },
    },
    {
      field: 'source_update_date',
      title: '源站更新',
      width: 100,
      formatter({ cellValue }) {
        return cellValue || '-';
      },
    },
    {
      field: 'end_time',
      title: '截止时间',
      width: 100,
      formatter({ cellValue }) {
        return cellValue || '招满为止';
      },
    },
    {
      field: 'links',
      title: '链接',
      width: 110,
      align: 'center',
      slots: { default: 'links' },
    },
    {
      field: 'operation',
      title: $t('common.table.operation'),
      align: 'center',
      fixed: 'right',
      width: 110,
      cellRender: {
        attrs: {
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: ['edit', 'delete'],
      },
    },
  ];
}

export const announcementFormSchema: VbenFormSchema[] = [
  {
    component: 'Input',
    formItemClass: 'md:col-span-2',
    fieldName: 'title',
    label: '公告标题',
    rules: 'required',
  },
  {
    component: 'Select',
    fieldName: 'recruitment_type',
    label: '招聘类型',
    rules: 'required',
    componentProps: {
      allowClear: true,
      showSearch: true,
      options: recruitmentTypeOptions,
    },
  },
  {
    component: 'Input',
    fieldName: 'recruit_target',
    label: '招聘对象',
    componentProps: {
      placeholder: '如 2027届',
    },
  },
  {
    component: 'Input',
    fieldName: 'positions',
    label: '岗位名称',
  },
  {
    component: 'Input',
    fieldName: 'start_time',
    label: '开始时间',
    componentProps: {
      placeholder: 'YYYY-MM-DD',
    },
  },
  {
    component: 'Input',
    fieldName: 'end_time',
    label: '截止时间',
    componentProps: {
      placeholder: 'YYYY-MM-DD',
    },
  },
  {
    component: 'Input',
    fieldName: 'location',
    label: '工作地点',
  },
  {
    component: 'Input',
    fieldName: 'referral_code',
    label: '内推码',
  },
  {
    component: 'Input',
    fieldName: 'exam_info',
    label: '笔试情况',
  },
  {
    component: 'Input',
    fieldName: 'source_update_date',
    label: '源站更新日期',
    componentProps: {
      placeholder: 'YYYY-MM-DD',
    },
  },
  {
    component: 'Input',
    formItemClass: 'md:col-span-2',
    fieldName: 'apply_url',
    label: '投递链接',
    componentProps: {
      placeholder: 'https://...',
    },
  },
  {
    component: 'Input',
    formItemClass: 'md:col-span-2',
    fieldName: 'notice_url',
    label: '公告链接',
    componentProps: {
      placeholder: 'https://...',
    },
  },
  {
    component: 'Textarea',
    formItemClass: 'md:col-span-2',
    fieldName: 'remark',
    label: '备注',
    componentProps: {
      rows: 3,
    },
  },
];
