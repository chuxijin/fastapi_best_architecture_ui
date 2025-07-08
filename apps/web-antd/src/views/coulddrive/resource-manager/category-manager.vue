<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';
import type {
  CategoryTreeNode,
  CreateCategoryParams,
  UpdateCategoryParams,
  CategoryStatistics,
} from '#/api';

import { ref, onMounted } from 'vue';

import { VbenButton, useVbenModal } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';

import { message, Modal } from 'ant-design-vue';

import {
  getCategoryTreeApi,
  createCategoryApi,
  updateCategoryApi,
  deleteCategoryApi,
  getCategoryStatisticsApi,
} from '#/api';

// 创建图标组件
const Database = createIconifyIcon('mdi:database');
const Plus = createIconifyIcon('mdi:plus');

// 分类管理相关状态
const categoryTreeData = ref<CategoryTreeNode[]>([]);
const categoryStats = ref<CategoryStatistics | null>(null);
const editingCategoryId = ref<number | null>(null);
const expandedKeys = ref<string[]>([]);
const selectedKeys = ref<string[]>([]);

// 分类表单数据
const categoryFormData = ref({
  name: '',
  code: '',
  description: '',
  category_type: 'domain' as 'domain' | 'subject' | 'resource_type',
  parent_id: undefined as number | undefined,
  sort: 0,
  status: 1,
});

// 创建分类编辑模态框
const [CategoryEditModal, categoryEditModalApi] = useVbenModal({
  class: 'w-[600px]',
  destroyOnClose: true,
  async onConfirm() {
    // 验证必填字段
    if (!categoryFormData.value.name.trim()) {
      message.error('请输入分类名称');
      return;
    }
    if (!categoryFormData.value.code.trim()) {
      message.error('请输入分类编码');
      return;
    }
    if (!categoryFormData.value.category_type) {
      message.error('请选择分类类型');
      return;
    }

    categoryEditModalApi.lock();
    try {
      const apiData: CreateCategoryParams | UpdateCategoryParams = {
        name: categoryFormData.value.name,
        code: categoryFormData.value.code,
        description: categoryFormData.value.description,
        category_type: categoryFormData.value.category_type,
        parent_id: categoryFormData.value.parent_id,
        sort: categoryFormData.value.sort,
        status: categoryFormData.value.status,
      };



      if (editingCategoryId.value) {
        await updateCategoryApi(editingCategoryId.value, apiData);
        message.success('分类更新成功');
      } else {
        await createCategoryApi(apiData as CreateCategoryParams);
        message.success('分类创建成功');
      }

      await categoryEditModalApi.close();
      await fetchCategoryTree();
      await fetchCategoryStats();
    } catch (error: any) {
      message.error(editingCategoryId.value ? '更新失败' : '创建失败');
    } finally {
      categoryEditModalApi.unlock();
    }
  },
    onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const data = categoryEditModalApi.getData();

      if (data && data.id) {
        // 编辑模式：使用传入的数据
        editingCategoryId.value = data.id;
        Object.assign(categoryFormData.value, {
          name: data.name,
          code: data.code,
          description: data.description || '',
          category_type: data.category_type,
          parent_id: data.parent_id,
          sort: data.sort,
          status: data.status,
        });
      }
      // 新增模式：不重置数据，保持 onCreateCategory 中设置的值
      // 因为 onCreateCategory 已经正确设置了 categoryFormData
    }
  },
});

// 获取分类树数据
async function fetchCategoryTree() {
  try {
    const response = await getCategoryTreeApi();
    categoryTreeData.value = response;
    // 默认展开第一级节点
    expandedKeys.value = response.map(item => item.id.toString());
  } catch (error) {
    console.error('获取分类树失败:', error);
    message.error('获取分类树失败');
  }
}

// 获取分类统计信息
async function fetchCategoryStats() {
  try {
    const response = await getCategoryStatisticsApi();
    categoryStats.value = response;
  } catch (error) {
    console.error('获取分类统计失败:', error);
  }
}

// 新增分类
function onCreateCategory(parentNode?: CategoryTreeNode) {
  editingCategoryId.value = null;

  // 智能填充分类信息
  let autoCategory = 'domain';
  let autoSort = 1;

  if (parentNode) {
    // 如果有父节点，根据父节点类型确定子分类类型
    if (parentNode.category_type === 'domain') {
      autoCategory = 'subject'; // 领域下创建科目
    } else if (parentNode.category_type === 'subject') {
      autoCategory = 'resource_type'; // 科目下创建资源类型（如果需要的话）
    } else {
      autoCategory = parentNode.category_type; // 其他情况保持相同类型
    }

    // 计算同级分类的最大排序值 + 1
    if (parentNode.children && parentNode.children.length > 0) {
      const maxSort = Math.max(...parentNode.children.map(child => child.sort));
      autoSort = maxSort + 1;
    }
  } else {
    // 如果没有父节点，根据现有根节点计算排序
    if (categoryTreeData.value && categoryTreeData.value.length > 0) {
      const maxSort = Math.max(...categoryTreeData.value.map(node => node.sort));
      autoSort = maxSort + 1;
    }
  }

  Object.assign(categoryFormData.value, {
    name: '',
    code: '',
    description: '',
    category_type: autoCategory,
    parent_id: parentNode?.id,
    sort: autoSort,
    status: 1,
  });

    categoryEditModalApi.setData(null);
  categoryEditModalApi.open();
}

// 编辑分类
function onEditCategory(node: CategoryTreeNode) {
  editingCategoryId.value = node.id;
  Object.assign(categoryFormData.value, {
    name: node.name,
    code: node.code,
    description: node.description || '',
    category_type: node.category_type,
    parent_id: node.parent_id,
    sort: node.sort,
    status: node.status,
  });
  categoryEditModalApi.setData(node);
  categoryEditModalApi.open();
}

// 删除分类
async function onDeleteCategory(node: CategoryTreeNode) {
  if (node.is_system) {
    message.warning('系统分类不能删除');
    return;
  }

  if (node.children && node.children.length > 0) {
    message.warning('请先删除子分类');
    return;
  }

  // 显示确认对话框
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除分类 "${node.name}" 吗？此操作不可撤销。`,
    okText: '确定',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await deleteCategoryApi(node.id);
        message.success('删除成功');
        await fetchCategoryTree();
        await fetchCategoryStats();
      } catch (error) {
        message.error('删除失败');
      }
    },
  });
}

// 获取分类类型标签
function getCategoryTypeLabel(type: string) {
  const typeMap = {
    domain: '领域',
    subject: '科目',
    resource_type: '资源类型',
  };
  return typeMap[type as keyof typeof typeMap] || type;
}

// 获取分类类型颜色
function getCategoryTypeColor(type: string) {
  const colorMap = {
    domain: 'blue',
    subject: 'green',
    resource_type: 'orange',
  };
  return colorMap[type as keyof typeof colorMap] || 'default';
}

// 根据ID获取分类名称
function getParentCategoryName(parentId: number): string {
  const findCategory = (categories: CategoryTreeNode[], id: number): CategoryTreeNode | null => {
    for (const category of categories) {
      if (category.id === id) {
        return category;
      }
      if (category.children && category.children.length > 0) {
        const found = findCategory(category.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const parentCategory = findCategory(categoryTreeData.value, parentId);
  return parentCategory ? `${parentCategory.name} (${parentCategory.code})` : '未知分类';
}

// 初始化数据
onMounted(async () => {
  await fetchCategoryTree();
  await fetchCategoryStats();
});

// 暴露方法给父组件
defineExpose({
  fetchCategoryTree,
  fetchCategoryStats,
});

// 分类树项组件
const CategoryTreeItem = {
  name: 'CategoryTreeItem',
  props: {
    node: {
      type: Object,
      required: true,
    },
  },
  emits: ['edit', 'delete', 'add-child'],
  setup(props: any, { emit }: any) {
    const expanded = ref(true);

    const toggleExpanded = () => {
      expanded.value = !expanded.value;
    };

    const handleEdit = () => {
      emit('edit', props.node);
    };

    const handleDelete = () => {
      emit('delete', props.node);
    };

    const handleAddChild = () => {
      emit('add-child', props.node);
    };

    // 为递归组件创建事件处理函数
    const handleChildEdit = (node: any) => {
      emit('edit', node);
    };

    const handleChildDelete = (node: any) => {
      emit('delete', node);
    };

    const handleChildAddChild = (node: any) => {
      emit('add-child', node);
    };

    return {
      expanded,
      toggleExpanded,
      handleEdit,
      handleDelete,
      handleAddChild,
      handleChildEdit,
      handleChildDelete,
      handleChildAddChild,
      getCategoryTypeLabel,
      getCategoryTypeColor,
    };
  },
  template: `
    <div class="border rounded-lg p-3 bg-gray-50">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <button
            v-if="node.children && node.children.length > 0"
            @click="toggleExpanded"
            class="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <span v-if="expanded">▼</span>
            <span v-else>▶</span>
          </button>
          <div v-else class="w-4"></div>

          <div class="flex items-center space-x-2">
            <span class="font-medium text-gray-900">{{ node.name }}</span>
            <span class="text-xs px-2 py-1 rounded-full"
                  :class="getCategoryTypeColor(node.category_type) === 'blue' ? 'bg-blue-100 text-blue-800' :
                         getCategoryTypeColor(node.category_type) === 'green' ? 'bg-green-100 text-green-800' :
                         getCategoryTypeColor(node.category_type) === 'orange' ? 'bg-orange-100 text-orange-800' :
                         'bg-gray-100 text-gray-800'">
              {{ getCategoryTypeLabel(node.category_type) }}
            </span>
            <span class="text-xs text-gray-500">{{ node.code }}</span>
            <span v-if="node.is_system" class="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
              系统
            </span>
            <span v-if="node.status === 0" class="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
              停用
            </span>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <button
            @click="handleEdit"
            class="text-blue-600 hover:text-blue-800 text-sm"
          >
            编辑
          </button>
          <button
            @click="handleAddChild"
            class="text-green-600 hover:text-green-800 text-sm"
          >
            新增子分类
          </button>
          <button
            v-if="!node.is_system"
            @click="handleDelete"
            class="text-red-600 hover:text-red-800 text-sm"
          >
            删除
          </button>
        </div>
      </div>

      <div v-if="node.description" class="mt-2 text-sm text-gray-600">
        {{ node.description }}
      </div>

      <div
        v-if="node.children && node.children.length > 0 && expanded"
        class="mt-3 ml-6 space-y-2"
      >
        <CategoryTreeItem
          v-for="child in node.children"
          :key="child.id"
          :node="child"
          @edit="handleChildEdit"
          @delete="handleChildDelete"
          @add-child="handleChildAddChild"
        />
      </div>
    </div>
  `,
};
</script>

<template>
  <div class="space-y-6">
    <!-- 统计信息 -->
    <div v-if="categoryStats" class="grid grid-cols-1 gap-4 md:grid-cols-5">
      <div class="rounded-lg bg-blue-50 p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <Database class="h-8 w-8 text-blue-500" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-blue-700">总分类数</p>
            <p class="text-2xl font-semibold text-blue-900">
              {{ categoryStats.total_count || 0 }}
            </p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-green-50 p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <span class="text-green-600 text-sm font-medium">✓</span>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-green-700">启用状态</p>
            <p class="text-2xl font-semibold text-green-900">
              {{ categoryStats.active_count || 0 }}
            </p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-blue-50 p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span class="text-blue-600 text-sm font-medium">🌐</span>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-blue-700">领域分类</p>
                         <p class="text-2xl font-semibold text-blue-900">
               {{ categoryStats.by_type?.domain || 0 }}
             </p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-green-50 p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <span class="text-green-600 text-sm font-medium">📚</span>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-green-700">科目分类</p>
                         <p class="text-2xl font-semibold text-green-900">
               {{ categoryStats.by_type?.subject || 0 }}
             </p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-orange-50 p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
              <span class="text-orange-600 text-sm font-medium">🔧</span>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-orange-700">资源类型</p>
                         <p class="text-2xl font-semibold text-orange-900">
               {{ categoryStats.by_type?.resource_type || 0 }}
             </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex justify-between items-center">
      <h4 class="text-lg font-semibold">分类树</h4>
      <VbenButton @click="onCreateCategory()" type="primary">
        <Plus class="mr-1" />
        新增根分类
      </VbenButton>
    </div>

    <!-- 分类树 -->
    <div class="bg-white rounded-lg border p-4 max-h-96 overflow-auto">
      <div v-if="categoryTreeData.length === 0" class="text-center text-gray-500 py-8">
        暂无分类数据
      </div>
      <div v-else>
        <div v-for="node in categoryTreeData" :key="node.id" class="mb-2">
          <CategoryTreeItem
            :node="node"
            @edit="onEditCategory"
            @delete="onDeleteCategory"
            @add-child="onCreateCategory"
          />
        </div>
      </div>
    </div>

    <!-- 分类编辑模态框 -->
    <CategoryEditModal :title="editingCategoryId ? '编辑分类' : '新增分类'">
      <div class="space-y-4">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">分类名称 *</label>
            <input
              v-model="categoryFormData.name"
              type="text"
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="请输入分类名称"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">分类编码 *</label>
            <input
              v-model="categoryFormData.code"
              type="text"
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="请输入分类编码"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">分类类型 *</label>
            <select
              v-model="categoryFormData.category_type"
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              :disabled="!!editingCategoryId"
            >
              <option value="domain">领域</option>
              <option value="subject">科目</option>
              <option value="resource_type">资源类型</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">排序</label>
            <input
              v-model.number="categoryFormData.sort"
              type="number"
              min="0"
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="请输入排序值"
            />
          </div>
        </div>

        <!-- 父分类显示 -->
        <div v-if="categoryFormData.parent_id" class="rounded-lg bg-blue-50 p-3 border border-blue-200">
          <div class="flex items-center space-x-2">
            <div class="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center">
              <span class="text-white text-xs">↑</span>
            </div>
            <span class="text-sm font-medium text-blue-700">父分类：</span>
            <span class="text-sm text-blue-800">{{ getParentCategoryName(categoryFormData.parent_id) }}</span>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
          <textarea
            v-model="categoryFormData.description"
            rows="3"
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            placeholder="请输入分类描述"
          />
        </div>

        <div class="flex items-center">
          <input
            v-model="categoryFormData.status"
            type="checkbox"
            :true-value="1"
            :false-value="0"
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label class="ml-2 block text-sm text-gray-900">启用状态</label>
        </div>
      </div>
    </CategoryEditModal>
  </div>
</template>

<style scoped>
/* 优化标签显示 */
.ant-tag {
  margin: 1px;
  border-radius: 4px;
}
</style>
