<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OnActionClickParams } from '#/adapter/vxe-table';
import type {
  RuleTemplateDetail,
  RuleTemplateListParams,
  CreateRuleTemplateParams,
  UpdateRuleTemplateParams,
} from '#/api';

import { ref, computed, h, watch, nextTick } from 'vue';

import { Page, VbenButton, useVbenModal } from '@vben/common-ui';
import { AddData } from '@vben/icons';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { message, Modal } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getRuleTemplateListApi,
  createRuleTemplateApi,
  updateRuleTemplateApi,
  deleteRuleTemplateApi,
  batchDeleteRuleTemplatesApi,
  toggleRuleTemplateActiveApi,
  useRuleTemplateApi,
  getRuleTemplateStatsApi,
} from '#/api';
import {
  templateQuerySchema,
  useTemplateColumns,
  templateFormSchema,
  getTemplateTypeColor,
  getTemplateTypeLabel,
  getCategoryColor,
  getCategoryLabel,
  RULE_CONFIG_EXAMPLES,
  TEMPLATE_CATEGORY_OPTIONS,
} from './data';
import RuleConfigEditor from './components/RuleConfigEditor.vue';


// 创建图标组件
const Edit = createIconifyIcon('mdi:pencil');
const Delete = createIconifyIcon('mdi:delete');
const Eye = createIconifyIcon('mdi:eye');

// 编辑状态
const editingTemplateId = ref<number | null>(null);

// 开关加载状态
const switchLoadingMap = ref<Map<number, boolean>>(new Map());

// 统计信息
const statsData = ref<any>(null);



// 查询表单配置
const queryFormOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: {
    content: $t('page.form.query'),
  },
  schema: templateQuerySchema,
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
  columns: useTemplateColumns(onActionClick, onStatusChange),
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        try {
          const params: RuleTemplateListParams = {
            page: page.currentPage,
            size: page.pageSize,
            ...formValues,
          };

          const response = await getRuleTemplateListApi(params);

          // 直接返回响应，让VXE表格的全局配置处理数据提取
          return response;
        } catch (error) {
          console.error('❌ 获取规则模板列表失败:', error);
          message.error('获取规则模板列表失败');
          return {
            items: [],
            total: 0,
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
  schema: templateFormSchema,
});

// 处理模板类型变化
function onTemplateTypeChange(newType: string) {
  currentTemplateType.value = newType;
  formData.value.template_type = newType;
}

// 可视化编辑器的值
const ruleConfigValue = ref('{}');
const currentTemplateType = ref('custom');

// 表单数据
const formData = ref({
  template_name: '',
  template_type: 'exclusion',
  description: '',
  category: '',
  tags: [] as string[],
  is_active: true,
});

// 监听模板类型变化，更新默认配置
watch(currentTemplateType, (newType) => {
  // 在新增模式下，不自动填充配置，让用户自己选择
  // 这个监听器主要用于编辑模式下的类型切换
  // 如果需要默认配置，用户可以点击"插入示例配置"按钮
});

// 创建编辑模态框
const [EditModal, editModalApi] = useVbenModal({
  class: 'w-[600px]',
  destroyOnClose: true,
  async onConfirm() {
    // 简单验证
    if (!formData.value.template_name.trim()) {
      message.error('请输入模板名称');
      return;
    }

    editModalApi.lock();
    try {
      // 解析 JSON 配置
      let ruleConfig;
      try {
        ruleConfig = JSON.parse(ruleConfigValue.value || '{}');
      } catch (e) {
        message.error('规则配置格式错误，请输入有效的JSON');
        return;
      }

      // 构造API需要的数据格式
      const apiData: CreateRuleTemplateParams | UpdateRuleTemplateParams = {
        template_name: formData.value.template_name,
        template_type: formData.value.template_type as any,
        description: formData.value.description,
        rule_config: ruleConfig,
        category: (formData.value.category as any) || undefined,
        tags: formData.value.tags,
      };

      if (editingTemplateId.value) {
        // 更新模板
        await updateRuleTemplateApi(editingTemplateId.value, {
          ...apiData,
          is_active: formData.value.is_active,
        } as UpdateRuleTemplateParams);
        message.success('规则模板更新成功');
      } else {
        // 创建模板
        await createRuleTemplateApi(apiData as CreateRuleTemplateParams);
        message.success('规则模板创建成功');
      }

      await editModalApi.close();
      onRefresh();
    } catch (error) {
      message.error(editingTemplateId.value ? '更新失败' : '创建失败');
    } finally {
      editModalApi.unlock();
    }
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const data = editModalApi.getData();
      if (data && data.id) {
        // 编辑模式
        editingTemplateId.value = data.id;
        // 先设置模板类型
        currentTemplateType.value = data.template_type || 'custom';
        // 设置表单数据
        formData.value = {
          template_name: data.template_name || '',
          template_type: data.template_type || 'custom',
          description: data.description || '',
          category: data.category || '',
          tags: data.tags || [],
          is_active: data.is_active ?? true,
        };
        // 最后设置配置值，确保模板类型已经设置好
        // 使用nextTick确保模板类型变化已经被处理
        nextTick(() => {
          ruleConfigValue.value = JSON.stringify(data.rule_config, null, 2);
        });
      } else {
        // 新增模式
        editingTemplateId.value = null;
        currentTemplateType.value = 'exclusion'; // 默认选择排除规则
        // 新增模式下，初始化为空配置，让用户自己填写
        ruleConfigValue.value = '{}';
        // 重置表单数据
        formData.value = {
          template_name: '',
          template_type: 'exclusion',
          description: '',
          category: '',
          tags: [],
          is_active: true,
        };
      }
    } else {
      // 关闭时清理状态
      editingTemplateId.value = null;
      currentTemplateType.value = 'custom';
      ruleConfigValue.value = '{}';
    }
  },
});

// 状态更新处理
async function onStatusChange(row: any, newVal: boolean): Promise<boolean> {
  try {
    await toggleRuleTemplateActiveApi(row.id, newVal);
    message.success(`模板已${newVal ? '启用' : '禁用'}`);
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
    await toggleRuleTemplateActiveApi(row.id, checked);
    message.success(`模板已${checked ? '启用' : '禁用'}`);
    // 更新本地数据
    row.is_active = checked;
  } catch (error) {
    console.error('更新状态失败:', error);
    message.error('状态更新失败');
    // 失败时恢复原状态
    row.is_active = !checked;
  } finally {
    // 清除加载状态
    switchLoadingMap.value.delete(row.id);
  }
}

// 操作处理
function onActionClick({ code, row }: OnActionClickParams) {
  switch (code) {
    case 'view': {
      viewTemplate(row);
      break;
    }
    case 'edit': {
      editTemplate(row);
      break;
    }
    case 'delete': {
      deleteTemplate(row);
      break;
    }
  }
}

// 查看模板
function viewTemplate(template: any) {
  const configContent = renderRuleConfig(template.template_type, template.rule_config);

  Modal.info({
    title: `查看模板: ${template.template_name}`,
    content: h('div', { class: 'space-y-4' }, [
      h('div', { class: 'grid grid-cols-2 gap-4' }, [
        h('div', [
          h('span', { class: 'font-medium text-gray-600' }, '类型: '),
          h('span', { class: 'text-blue-600' }, getTemplateTypeLabel(template.template_type)),
        ]),
        h('div', [
          h('span', { class: 'font-medium text-gray-600' }, '分类: '),
          h('span', { class: 'text-green-600' }, template.category ? getCategoryLabel(template.category) : '无'),
        ]),
      ]),
      h('div', [
        h('span', { class: 'font-medium text-gray-600' }, '描述: '),
        h('span', template.description || '无'),
      ]),
      h('div', { class: 'border-t pt-4' }, [
        h('h4', { class: 'font-medium text-gray-800 mb-3' }, '规则配置'),
        configContent,
      ]),
    ]),
    width: 800,
  });
}

// 渲染规则配置
function renderRuleConfig(templateType: string, ruleConfig: any) {
  switch (templateType) {
    case 'exclusion':
      return renderExclusionConfig(ruleConfig);
    case 'rename':
      return renderRenameConfig(ruleConfig);
    case 'custom':
      return renderCustomConfig(ruleConfig);
    default:
      return h('pre', {
        class: 'bg-gray-50 p-3 rounded border text-sm max-h-60 overflow-auto'
      }, JSON.stringify(ruleConfig, null, 2));
  }
}

// 渲染排除规则配置
function renderExclusionConfig(config: any) {
  // 兼容旧格式：如果有patterns字段，使用patterns；否则使用rules
  const rules = config.rules || config.patterns || [];
  const type = config.type || '';
  const ignoreCase = config.ignore_case;
  const excludeDirs = config.exclude_dirs || [];
  const maxSize = config.max_size;
  const sizeUnit = config.size_unit;

  return h('div', { class: 'space-y-3' }, [
    h('div', [
      h('div', { class: 'font-medium text-sm text-gray-700 mb-2' }, '规则类型:'),
      h('span', { class: 'bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs' }, type || '未指定'),
    ]),
    ...(rules.length > 0 ? [h('div', [
      h('div', { class: 'font-medium text-sm text-gray-700 mb-2' }, '排除规则:'),
      h('div', { class: 'space-y-1' }, rules.map((rule: any) =>
        h('div', { class: 'bg-red-50 px-2 py-1 rounded text-sm border-l-2 border-red-200' }, [
          h('span', { class: 'font-medium' }, `模式: ${rule.pattern}`),
          h('span', { class: 'text-gray-600 ml-2' }, `目标: ${rule.target}`),
          h('span', { class: 'text-gray-600 ml-2' }, `类型: ${rule.item_type}`),
          h('span', { class: 'text-gray-600 ml-2' }, `匹配: ${rule.mode}`),
        ])
      )),
    ])] : []),
    ...(excludeDirs.length > 0 ? [h('div', [
      h('div', { class: 'font-medium text-sm text-gray-700 mb-2' }, '排除目录:'),
      h('div', { class: 'flex flex-wrap gap-1' }, excludeDirs.map((dir: string) =>
        h('span', { class: 'bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs' }, dir)
      )),
    ])] : []),
    ...(maxSize ? [h('div', [
      h('div', { class: 'font-medium text-sm text-gray-700 mb-2' }, '文件大小限制:'),
      h('span', { class: 'bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs' }, `${maxSize}${sizeUnit || ''}`),
    ])] : []),
    ...(typeof ignoreCase === 'boolean' ? [h('div', [
      h('div', { class: 'font-medium text-sm text-gray-700 mb-2' }, '忽略大小写:'),
      h('span', {
        class: ignoreCase ? 'bg-green-100 text-green-800 px-2 py-1 rounded text-xs' : 'bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs'
      }, ignoreCase ? '是' : '否'),
    ])] : []),
  ]);
}

// 渲染重命名规则配置
function renderRenameConfig(config: any) {
  const rules = config.rules || [];
  const type = config.type || '';
  const format = config.format || '';
  const timezone = config.timezone || '';
  const find = config.find || '';
  const replace = config.replace || '';
  const caseType = config.case || '';
  const preserveExtension = config.preserve_extension;

  return h('div', { class: 'space-y-3' }, [
    h('div', [
      h('div', { class: 'font-medium text-sm text-gray-700 mb-2' }, '规则类型:'),
      h('span', { class: 'bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs' }, type || '未指定'),
    ]),
    ...(rules.length > 0 ? [h('div', [
      h('div', { class: 'font-medium text-sm text-gray-700 mb-2' }, '重命名规则:'),
      h('div', { class: 'space-y-1' }, rules.map((rule: any) =>
        h('div', { class: 'bg-yellow-50 px-2 py-1 rounded text-sm border-l-2 border-yellow-200' }, [
          h('span', { class: 'font-medium' }, `正则: ${rule.match_regex}`),
          h('span', { class: 'text-gray-600 ml-2' }, `替换: ${rule.replace_string}`),
          h('span', { class: 'text-gray-600 ml-2' }, `作用域: ${rule.target_scope}`),
          h('span', { class: 'text-gray-600 ml-2' }, `大小写敏感: ${rule.case_sensitive ? '是' : '否'}`),
        ])
      )),
    ])] : []),
    ...(format ? [h('div', [
      h('div', { class: 'font-medium text-sm text-gray-700 mb-2' }, '格式模板:'),
      h('code', { class: 'bg-yellow-50 px-2 py-1 rounded text-sm border' }, format),
    ])] : []),
    ...(find && replace !== undefined ? [h('div', [
      h('div', { class: 'font-medium text-sm text-gray-700 mb-2' }, '字符替换:'),
      h('div', { class: 'bg-yellow-50 p-2 rounded border text-sm' }, [
        h('div', [
          h('span', { class: 'text-gray-600' }, '查找: '),
          h('code', { class: 'bg-gray-100 px-1 rounded' }, find),
        ]),
        h('div', { class: 'mt-1' }, [
          h('span', { class: 'text-gray-600' }, '替换: '),
          h('code', { class: 'bg-gray-100 px-1 rounded' }, replace),
        ]),
      ]),
    ])] : []),
    ...(caseType ? [h('div', [
      h('div', { class: 'font-medium text-sm text-gray-700 mb-2' }, '大小写转换:'),
      h('span', { class: 'bg-green-100 text-green-800 px-2 py-1 rounded text-xs' },
        caseType === 'lower' ? '转为小写' : caseType === 'upper' ? '转为大写' : caseType),
    ])] : []),
    ...(timezone ? [h('div', [
      h('div', { class: 'font-medium text-sm text-gray-700 mb-2' }, '时区:'),
      h('span', { class: 'bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs' }, timezone),
    ])] : []),
    ...(typeof preserveExtension === 'boolean' ? [h('div', [
      h('div', { class: 'font-medium text-sm text-gray-700 mb-2' }, '保留扩展名:'),
      h('span', {
        class: preserveExtension ? 'bg-green-100 text-green-800 px-2 py-1 rounded text-xs' : 'bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs'
      }, preserveExtension ? '是' : '否'),
    ])] : []),
  ]);
}

// 渲染自定义规则配置
function renderCustomConfig(config: any) {
  const type = config.type || '';
  const rules = config.rules || [];
  const action = config.action || '';
  const checkMethod = config.check_method || '';
  const duplicateSuffix = config.duplicate_suffix || '';

  return h('div', { class: 'space-y-3' }, [
    h('div', [
      h('div', { class: 'font-medium text-sm text-gray-700 mb-2' }, '规则类型:'),
      h('span', { class: 'bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs' }, type || '未指定'),
    ]),
    ...(action ? [h('div', [
      h('div', { class: 'font-medium text-sm text-gray-700 mb-2' }, '执行动作:'),
      h('span', { class: 'bg-green-100 text-green-800 px-2 py-1 rounded text-xs' }, action),
    ])] : []),
    ...(checkMethod ? [h('div', [
      h('div', { class: 'font-medium text-sm text-gray-700 mb-2' }, '检查方法:'),
      h('span', { class: 'bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs' }, checkMethod),
    ])] : []),
    ...(duplicateSuffix ? [h('div', [
      h('div', { class: 'font-medium text-sm text-gray-700 mb-2' }, '重复文件后缀:'),
      h('code', { class: 'bg-yellow-50 px-2 py-1 rounded text-sm border' }, duplicateSuffix),
    ])] : []),
    ...(rules.length > 0 ? [h('div', [
      h('div', { class: 'font-medium text-sm text-gray-700 mb-2' }, '分类规则:'),
      h('div', { class: 'space-y-2' }, rules.map((rule: any, index: number) =>
        h('div', { class: 'bg-indigo-50 p-3 rounded border' }, [
          h('div', { class: 'text-sm font-medium text-gray-700' }, `规则 ${index + 1}`),
          h('div', { class: 'mt-1 text-sm' }, [
            h('span', { class: 'text-gray-600' }, '文件扩展名: '),
            h('div', { class: 'mt-1 flex flex-wrap gap-1' }, (rule.extensions || []).map((ext: string) =>
              h('span', { class: 'bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-xs' }, ext)
            )),
          ]),
          h('div', { class: 'mt-2 text-sm' }, [
            h('span', { class: 'text-gray-600' }, '目标文件夹: '),
            h('code', { class: 'bg-gray-100 px-1 rounded' }, rule.target_folder || ''),
          ]),
        ])
      )),
    ])] : []),
  ]);
}

// 编辑模板
function editTemplate(template: any) {
  editModalApi.setData(template);
  editModalApi.open();
}



// 删除模板
async function deleteTemplate(template: any) {
  // 系统模板不允许删除
  if (template.is_system) {
    message.warning('系统模板不允许删除');
    return;
  }

  // 确认删除
  const confirmed = await new Promise((resolve) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除模板 "${template.template_name}" 吗？此操作不可恢复。`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });

  if (confirmed) {
    try {
      await deleteRuleTemplateApi(template.id);
      message.success('删除成功');
      onRefresh();
    } catch (error) {
      message.error('删除失败，请重试');
      console.error(error);
    }
  }
}

// 批量删除
async function batchDeleteTemplates() {
  const selectedRows = (gridApi as any).getCheckboxRecords() as RuleTemplateDetail[];
  if (selectedRows.length === 0) {
    message.warning('请选择要删除的模板');
    return;
  }

  // 检查是否包含系统模板
  const systemTemplates = selectedRows.filter(row => row.is_system);
  if (systemTemplates.length > 0) {
    message.warning('选中的模板包含系统模板，系统模板不允许删除');
    return;
  }

  // 确认删除
  const confirmed = await new Promise((resolve) => {
    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedRows.length} 个模板吗？此操作不可恢复。`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });

  if (confirmed) {
    try {
      const ids = selectedRows.map(row => row.id);
      await batchDeleteRuleTemplatesApi(ids);
      message.success(`成功删除 ${selectedRows.length} 个模板`);
      onRefresh();
    } catch (error) {
      message.error('批量删除失败，请重试');
      console.error(error);
    }
  }
}

// 刷新表格
function onRefresh() {
  gridApi.query();
  loadStats();
}

// 打开新增模态框
function openCreateModal() {
  editingTemplateId.value = null; // 明确设置为null，确保标题显示为"新增规则模板"
  editModalApi.open();
}

// 加载统计信息
async function loadStats() {
  try {
    statsData.value = await getRuleTemplateStatsApi();
  } catch (error) {
    console.error('获取统计信息失败:', error);
  }
}

// 插入示例配置
function insertExampleConfig(type: string) {
  const example = RULE_CONFIG_EXAMPLES[type as keyof typeof RULE_CONFIG_EXAMPLES];
  if (example) {
    const configStr = JSON.stringify(example.config, null, 2);
    formApi.setFieldValue('rule_config_json', configStr);
    message.success(`已插入${example.name}示例配置`);
  }
}

// 页面加载时获取统计信息
loadStats();
</script>

<template>
  <Page auto-content-height>
    <!-- 统计卡片 -->
    <div v-if="statsData" class="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="text-2xl font-bold text-blue-600">{{ statsData.total_count }}</div>
        <div class="text-gray-600">总模板数</div>
      </div>
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="text-2xl font-bold text-green-600">{{ statsData.active_count }}</div>
        <div class="text-gray-600">启用模板</div>
      </div>
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="text-2xl font-bold text-purple-600">{{ statsData.system_count }}</div>
        <div class="text-gray-600">系统模板</div>
      </div>
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="text-2xl font-bold text-orange-600">{{ statsData.user_count }}</div>
        <div class="text-gray-600">用户模板</div>
      </div>
    </div>



    <Grid>
      <template #toolbar-actions>
        <VbenButton @click="openCreateModal">
          <AddData class="size-5" />
          新增模板
        </VbenButton>
        <VbenButton variant="destructive" @click="batchDeleteTemplates">
          <Delete class="size-5" />
          批量删除
        </VbenButton>
      </template>

      <!-- 模板类型插槽 -->
      <template #template_type="{ row }">
        <a-tag :color="getTemplateTypeColor(row.template_type)">
          {{ getTemplateTypeLabel(row.template_type) }}
        </a-tag>
      </template>

      <!-- 分类插槽 -->
      <template #category="{ row }">
        <a-tag v-if="row.category" :color="getCategoryColor(row.category)">
          {{ getCategoryLabel(row.category) }}
        </a-tag>
        <span v-else class="text-gray-400">-</span>
      </template>

      <!-- 标签插槽 -->
      <template #tags="{ row }">
        <div v-if="row.tags && row.tags.length > 0" class="flex flex-wrap gap-1">
          <a-tag v-for="tag in row.tags" :key="tag" size="small">
            {{ tag }}
          </a-tag>
        </div>
        <span v-else class="text-gray-400">-</span>
      </template>

      <!-- 状态插槽 -->
      <template #is_active="{ row }">
        <a-switch
          :checked="Boolean(row.is_active)"
          :loading="switchLoadingMap.get(row.id) || false"
          @change="(checked: boolean) => handleStatusChange(row, checked)"
        />
      </template>

      <!-- 来源插槽 -->
      <template #is_system="{ row }">
        <a-tag :color="row.is_system ? 'blue' : 'green'">
          {{ row.is_system ? '系统' : '用户' }}
        </a-tag>
      </template>

      <!-- 操作插槽 -->
      <template #action="{ row }">
        <div class="flex gap-2">
          <a-tooltip title="查看">
            <a-button type="text" size="small" @click="onActionClick({ code: 'view', row })">
              <Eye class="size-4" />
            </a-button>
          </a-tooltip>
          <a-tooltip title="编辑">
            <a-button type="text" size="small" @click="onActionClick({ code: 'edit', row })">
              <Edit class="size-4" />
            </a-button>
          </a-tooltip>
          <a-tooltip v-if="!row.is_system" title="删除">
            <a-button type="text" danger size="small" @click="onActionClick({ code: 'delete', row })">
              <Delete class="size-4" />
            </a-button>
          </a-tooltip>
        </div>
      </template>
    </Grid>

        <!-- 编辑模态框 -->
    <EditModal :title="editingTemplateId ? '编辑规则模板' : '新增规则模板'">
      <div class="space-y-6">
        <!-- 第一行：模板名称 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">模板名称</label>
          <a-input
            v-model:value="formData.template_name"
            placeholder="请输入模板名称"
            class="w-full"
          />
        </div>

        <!-- 第二行：模板类型 + 分类 -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">模板类型</label>
            <a-select
              v-model:value="formData.template_type"
              placeholder="请选择模板类型"
              class="w-full"
              @change="onTemplateTypeChange"
            >
              <a-select-option value="exclusion">排除规则</a-select-option>
              <a-select-option value="rename">重命名规则</a-select-option>
              <a-select-option value="custom">自定义规则</a-select-option>
            </a-select>
          </div>
                    <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">分类</label>
                                                <a-select
              v-model:value="formData.category"
              placeholder="请选择分类"
              class="w-full"
              allow-clear
            >
              <a-select-option
                v-for="option in TEMPLATE_CATEGORY_OPTIONS"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </a-select-option>
            </a-select>
          </div>
        </div>

        <!-- 第三行：描述 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">描述</label>
          <a-textarea
            v-model:value="formData.description"
            placeholder="请输入模板描述"
            :rows="3"
            class="w-full"
          />
        </div>

        <!-- 第四行：标签 + 状态 -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">标签</label>
            <a-select
              v-model:value="formData.tags"
              mode="tags"
              placeholder="请输入标签，按回车添加"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">状态</label>
            <a-switch
              v-model:checked="formData.is_active"
              checked-children="启用"
              un-checked-children="禁用"
            />
          </div>
        </div>

        <!-- 规则配置 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">规则配置</label>
          <RuleConfigEditor
            v-model="ruleConfigValue"
            :template-type="currentTemplateType"
          />
        </div>
      </div>
    </EditModal>
  </Page>
</template>

<style scoped>
.grid {
  display: grid;
}
</style>
