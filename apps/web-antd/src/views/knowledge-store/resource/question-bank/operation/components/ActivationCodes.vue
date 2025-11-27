<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  ActcodeBatchResult,
  CreateBatchParams,
} from '#/api/knowledge-store';

import { computed, ref } from 'vue';

import { useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';

import { message, TabPane, Tabs, Tag } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createActcodeBatchApi,
  getActcodeBatchListApi,
} from '#/api/knowledge-store';

const props = defineProps<{
  bankId: number;
  bankName: string;
}>();

const activeTab = ref('all');

// 预设模板配置映射
const presetTemplates: Record<string, any> = {
  vip_card: {
    groups: 3,
    group_length: 5,
    separator: '-',
    prefix: 'VIP',
    suffix: '',
    use_digits: true,
    use_letters: true,
    letter_case: 'upper',
    use_special: false,
    special_chars: '',
    exclude_chars: ['O', '0', 'I', '1'],
    exclude_words: [],
    use_checksum: false,
  },
  game_item: {
    groups: 4,
    group_length: 4,
    separator: '-',
    prefix: 'GAME',
    suffix: '',
    use_digits: true,
    use_letters: false,
    letter_case: 'upper',
    use_special: false,
    special_chars: '',
    exclude_chars: [],
    exclude_words: [],
    use_checksum: false,
  },
  coupon: {
    groups: 2,
    group_length: 6,
    separator: '-',
    prefix: 'DC',
    suffix: '',
    use_digits: true,
    use_letters: true,
    letter_case: 'mixed',
    use_special: false,
    special_chars: '',
    exclude_chars: ['O', '0', 'I', '1', 'l'],
    exclude_words: [],
    use_checksum: false,
  },
  short_code: {
    groups: 1,
    group_length: 8,
    separator: '',
    prefix: '',
    suffix: '',
    use_digits: true,
    use_letters: true,
    letter_case: 'upper',
    use_special: false,
    special_chars: '',
    exclude_chars: ['O', '0', 'I', '1'],
    exclude_words: [],
    use_checksum: false,
  },
  high_security: {
    groups: 5,
    group_length: 5,
    separator: '-',
    prefix: '',
    suffix: '',
    use_digits: true,
    use_letters: true,
    letter_case: 'upper',
    use_special: false,
    special_chars: '',
    exclude_chars: ['O', '0', 'I', '1'],
    exclude_words: [],
    use_checksum: true,
  },
};

const queryFormOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  wrapperClass: 'grid-cols-3',
  submitButtonOptions: {
    content: '查询',
  },
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入批次编号或名称',
      },
      fieldName: 'keyword',
      label: '关键词',
      formItemClass: 'md:col-span-1',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        placeholder: '请选择状态',
        options: [
          { label: '启用', value: 1 },
          { label: '停用', value: 0 },
        ],
      },
      fieldName: 'status',
      label: '状态',
      formItemClass: 'md:col-span-1',
    },
  ],
};

const gridOptions: VxeTableGridOptions<ActcodeBatchResult> = {
  rowConfig: {
    keyField: 'id',
    isHover: true,
  },
  height: '100%',
  exportConfig: {},
  printConfig: {},
  toolbarConfig: {
    export: true,
    print: true,
    refresh: { code: 'query' },
    custom: true,
    zoom: true,
  },
  columns: [
    {
      field: 'id',
      title: 'ID',
      width: 80,
    },
    {
      field: 'batch_no',
      title: '批次编号',
      width: 200,
    },
    {
      field: 'name',
      title: '批次名称',
      minWidth: 150,
    },
    {
      field: 'reward_type',
      title: '权益类型',
      width: 120,
    },
    {
      field: 'total_count',
      title: '总数量',
      width: 100,
    },
    {
      field: 'used_count',
      title: '已使用',
      width: 100,
    },
    {
      field: 'status',
      title: '状态',
      width: 100,
      slots: { default: 'status_default' },
    },
    {
      field: 'created_time',
      title: '创建时间',
      width: 180,
    },
    {
      field: 'operation',
      title: '操作',
      align: 'center',
      width: 200,
      fixed: 'right',
      cellRender: {
        attrs: {
          nameField: 'name',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          { code: 'view-codes', text: '查看激活码' },
          { code: 'view-usage', text: '使用记录' },
        ],
      },
    },
  ],
  proxyConfig: {
    ajax: {
      query: async (_, formValues) => {
        const res = await getActcodeBatchListApi({
          app_id: `qbank_${props.bankId}`,
          status: formValues?.status,
          batch_no: formValues?.keyword,
        });
        return res;
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: queryFormOptions,
  gridOptions,
});

function onRefresh() {
  gridApi.query();
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: ActcodeBatchResult;
}) {
  switch (code) {
    case 'view-codes': {
      message.info(`查看激活码功能开发中 - 批次: ${row.name}`);
      break;
    }
    case 'view-usage': {
      message.info(`使用记录功能开发中 - 批次: ${row.name}`);
      break;
    }
  }
}

const createFormSchema = [
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入批次名称',
    },
    fieldName: 'name',
    label: '批次名称',
    rules: 'required',
  },
  {
    component: 'Select',
    componentProps: {
      placeholder: '请选择权益类型',
      options: [
        { label: 'VIP会员', value: 'vip' },
        { label: '积分', value: 'points' },
        { label: '功能解锁', value: 'feature' },
      ],
    },
    fieldName: 'reward_type',
    label: '权益类型',
    rules: 'required',
  },
  {
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入生成数量',
      min: 1,
      max: 10_000,
    },
    fieldName: 'total_count',
    label: '生成数量',
    rules: 'required',
  },
  {
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入天数',
      min: 1,
    },
    fieldName: 'days',
    label: 'VIP天数',
    dependencies: {
      triggerFields: ['reward_type'],
      if: (values) => values.reward_type === 'vip',
    },
    rules: 'required',
  },
  {
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入积分数',
      min: 1,
    },
    fieldName: 'points',
    label: '积分数',
    dependencies: {
      triggerFields: ['reward_type'],
      if: (values) => values.reward_type === 'points',
    },
    rules: 'required',
  },
  {
    component: 'Divider',
    componentProps: {
      orientation: 'left',
      children: '激活码格式配置',
    },
    fieldName: 'divider1',
    label: '',
    formItemClass: 'md:col-span-2',
  },
  {
    component: 'RadioGroup',
    componentProps: {
      options: [
        { label: '使用预设模板', value: 'preset' },
        { label: '自定义配置', value: 'custom' },
      ],
    },
    fieldName: 'config_type',
    label: '配置方式',
    defaultValue: 'preset',
    formItemClass: 'md:col-span-2',
  },
  {
    component: 'Select',
    componentProps: {
      placeholder: '请选择代码模板',
      options: [
        { label: 'VIP会员卡 (VIP-XXXXX-XXXXX-XXXXX)', value: 'vip_card' },
        { label: '游戏道具 (GAME-XXXX-XXXX-XXXX-XXXX)', value: 'game_item' },
        { label: '优惠券 (DC-XXXXXX-XXXXXX)', value: 'coupon' },
        { label: '短码 (XXXXXXXX)', value: 'short_code' },
        {
          label: '高安全 (XXXXX-XXXXX-XXXXX-XXXXX-XXXXX)',
          value: 'high_security',
        },
      ],
    },
    fieldName: 'template',
    label: '预设模板',
    formItemClass: 'md:col-span-2',
    dependencies: {
      triggerFields: ['config_type'],
      if: (values) => values.config_type === 'preset',
    },
  },
  // 自定义配置字段
  {
    component: 'InputNumber',
    componentProps: {
      placeholder: '1-10',
      min: 1,
      max: 10,
    },
    fieldName: 'groups',
    label: '分组数量',
    defaultValue: 3,
    dependencies: {
      triggerFields: ['config_type'],
      if: (values) => values.config_type === 'custom',
    },
  },
  {
    component: 'InputNumber',
    componentProps: {
      placeholder: '3-10',
      min: 3,
      max: 10,
    },
    fieldName: 'group_length',
    label: '每组长度',
    defaultValue: 5,
    dependencies: {
      triggerFields: ['config_type'],
      if: (values) => values.config_type === 'custom',
    },
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '如：-',
      maxlength: 3,
    },
    fieldName: 'separator',
    label: '分隔符',
    defaultValue: '-',
    dependencies: {
      triggerFields: ['config_type'],
      if: (values) => values.config_type === 'custom',
    },
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '如：VIP',
      maxlength: 20,
    },
    fieldName: 'prefix',
    label: '前缀',
    defaultValue: '',
    dependencies: {
      triggerFields: ['config_type'],
      if: (values) => values.config_type === 'custom',
    },
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '如：END',
      maxlength: 20,
    },
    fieldName: 'suffix',
    label: '后缀',
    defaultValue: '',
    dependencies: {
      triggerFields: ['config_type'],
      if: (values) => values.config_type === 'custom',
    },
  },
  {
    component: 'CheckboxGroup',
    componentProps: {
      options: [
        { label: '包含数字', value: 'digits' },
        { label: '包含字母', value: 'letters' },
        { label: '包含特殊符号', value: 'special' },
      ],
    },
    fieldName: 'char_types',
    label: '字符类型',
    defaultValue: ['digits', 'letters'],
    formItemClass: 'md:col-span-2',
    dependencies: {
      triggerFields: ['config_type'],
      if: (values) => values.config_type === 'custom',
    },
  },
  {
    component: 'RadioGroup',
    componentProps: {
      options: [
        { label: '大写', value: 'upper' },
        { label: '小写', value: 'lower' },
        { label: '混合', value: 'mixed' },
      ],
    },
    fieldName: 'letter_case',
    label: '字母大小写',
    defaultValue: 'upper',
    dependencies: {
      triggerFields: ['config_type', 'char_types'],
      if: (values) =>
        values.config_type === 'custom' &&
        values.char_types?.includes('letters'),
    },
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '如：!@#$%',
      maxlength: 20,
    },
    fieldName: 'special_chars',
    label: '特殊符号集合',
    dependencies: {
      triggerFields: ['config_type', 'char_types'],
      if: (values) =>
        values.config_type === 'custom' &&
        values.char_types?.includes('special'),
    },
  },
  {
    component: 'Select',
    componentProps: {
      mode: 'tags',
      placeholder: '输入要排除的字符，如：O 0 I 1',
      maxTagCount: 10,
    },
    fieldName: 'exclude_chars',
    label: '排除字符',
    defaultValue: ['O', '0', 'I', '1'],
    formItemClass: 'md:col-span-2',
    dependencies: {
      triggerFields: ['config_type'],
      if: (values) => values.config_type === 'custom',
    },
  },
  {
    component: 'Select',
    componentProps: {
      mode: 'tags',
      placeholder: '输入敏感词',
    },
    fieldName: 'exclude_words',
    label: '排除敏感词',
    defaultValue: [],
    formItemClass: 'md:col-span-2',
    dependencies: {
      triggerFields: ['config_type'],
      if: (values) => values.config_type === 'custom',
    },
  },
  {
    component: 'Switch',
    componentProps: {
      checkedChildren: '启用',
      unCheckedChildren: '关闭',
    },
    fieldName: 'use_checksum',
    label: '使用校验位',
    defaultValue: false,
    dependencies: {
      triggerFields: ['config_type'],
      if: (values) => values.config_type === 'custom',
    },
  },
];

const [Form, formApi] = useVbenForm({
  wrapperClass: 'md:grid-cols-2',
  showDefaultActions: false,
  schema: createFormSchema,
});

const modalTitle = computed(() => '创建激活码批次');

const [Modal, modalApi] = useVbenModal({
  class: 'w-8/12',
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      modalApi.lock();
      try {
        const values = await formApi.getValues();

        const rewardData: any = {};
        if (values.reward_type === 'vip') {
          rewardData.days = values.days;
        } else if (values.reward_type === 'points') {
          rewardData.points = values.points;
        }

        // 处理激活码配置
        let generatorConfig = null;
        if (values.config_type === 'preset' && values.template) {
          // 使用预设模板：从映射表获取完整配置
          generatorConfig = presetTemplates[values.template];
        } else if (values.config_type === 'custom') {
          // 自定义配置
          generatorConfig = {
            groups: values.groups || 3,
            group_length: values.group_length || 5,
            separator: values.separator || '-',
            prefix: values.prefix || '',
            suffix: values.suffix || '',
            use_digits: values.char_types?.includes('digits') || false,
            use_letters: values.char_types?.includes('letters') || false,
            letter_case: values.letter_case || 'upper',
            use_special: values.char_types?.includes('special') || false,
            special_chars: values.special_chars || '',
            exclude_chars: values.exclude_chars || [],
            exclude_words: values.exclude_words || [],
            use_checksum: values.use_checksum || false,
          };
        }

        const data: CreateBatchParams = {
          app_id: `qbank_${props.bankId}`,
          name: values.name,
          reward_type: values.reward_type,
          reward_data: rewardData,
          total_count: values.total_count,
          generator_config: generatorConfig,
        };

        await createActcodeBatchApi(data);
        message.success(`创建激活码批次成功: ${data.name}`);
        await modalApi.close();
        onRefresh();
      } finally {
        modalApi.unlock();
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      formApi.resetForm();
    }
  },
});
</script>

<template>
  <div class="flex h-full flex-col">
    <Tabs v-model:active-key="activeTab" class="-mt-4 mb-3">
      <TabPane key="all" tab="全部" />
      <TabPane key="unused" tab="未使用" />
      <TabPane key="used" tab="已使用" />
    </Tabs>

    <div class="flex-1 overflow-hidden">
      <Grid class="h-full">
        <template #toolbar-actions>
          <VbenButton @click="() => modalApi.open()">
            <MaterialSymbolsAdd class="size-5" />
            添加激活码
          </VbenButton>
        </template>

        <template #status_default="{ row }">
          <Tag :color="row.status === 1 ? 'green' : 'red'">
            {{ row.status === 1 ? '启用' : '停用' }}
          </Tag>
        </template>
      </Grid>
    </div>

    <Modal :title="modalTitle">
      <Form />
    </Modal>
  </div>
</template>
