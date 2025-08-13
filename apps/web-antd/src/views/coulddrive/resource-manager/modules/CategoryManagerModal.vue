<script setup lang="ts">
import type {
  CategoryStatistics,
  CategoryTreeNode,
  CreateCategoryParams,
  UpdateCategoryParams,
} from '#/api';

import { onMounted, ref } from 'vue';

import { useVbenModal, VbenButton, VbenTree } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';

import { message, Modal } from 'ant-design-vue';

import {
  createCategoryApi,
  deleteCategoryApi,
  getCategoryStatisticsApi,
  getCategoryTreeApi,
  updateCategoryApi,
} from '#/api';

const Database = createIconifyIcon('mdi:database');
const Plus = createIconifyIcon('mdi:plus');

const categoryTreeData = ref<CategoryTreeNode[]>([]);
const categoryStats = ref<CategoryStatistics | null>(null);
const editingCategoryId = ref<null | number>(null);

const categoryFormData = ref({
  name: '',
  code: '',
  description: '',
  category_type: 'domain' as 'domain' | 'resource_type' | 'subject',
  parent_id: undefined as number | undefined,
  sort: 0,
  status: 1,
});

const [CategoryEditModal, categoryEditModalApi] = useVbenModal({
  class: 'w-[600px]',
  destroyOnClose: true,
  async onConfirm() {
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
    } catch {
      message.error(editingCategoryId.value ? '更新失败' : '创建失败');
    } finally {
      categoryEditModalApi.unlock();
    }
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const data = categoryEditModalApi.getData();
      if (data && data.id) {
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
    }
  },
});

async function fetchCategoryTree() {
  try {
    const response = await getCategoryTreeApi();
    categoryTreeData.value = response;
  } catch (error) {
    console.error('获取分类树失败:', error);
    message.error('获取分类树失败');
  }
}

async function fetchCategoryStats() {
  try {
    const response = await getCategoryStatisticsApi();
    categoryStats.value = response;
  } catch (error) {
    console.error('获取分类统计失败:', error);
  }
}

function onCreateCategory(parentNode?: CategoryTreeNode) {
  editingCategoryId.value = null;

  let autoCategory: 'domain' | 'resource_type' | 'subject' = 'domain';
  let autoSort = 1;

  if (parentNode) {
    if (parentNode.category_type === 'domain') {
      autoCategory = 'subject';
    } else if (parentNode.category_type === 'subject') {
      autoCategory = 'resource_type';
    } else {
      autoCategory = parentNode.category_type as
        | 'domain'
        | 'resource_type'
        | 'subject';
    }

    if (parentNode.children && parentNode.children.length > 0) {
      const maxSort = Math.max(
        ...parentNode.children.map((child) => child.sort),
      );
      autoSort = maxSort + 1;
    }
  } else if (categoryTreeData.value && categoryTreeData.value.length > 0) {
    const maxSort = Math.max(
      ...categoryTreeData.value.map((node) => node.sort),
    );
    autoSort = maxSort + 1;
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

async function onDeleteCategory(node: CategoryTreeNode) {
  if (node.is_system) {
    message.warning('系统分类不能删除');
    return;
  }
  if (node.children && node.children.length > 0) {
    message.warning('请先删除子分类');
    return;
  }
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
      } catch {
        message.error('删除失败');
      }
    },
  });
}

function getCategoryTypeLabel(type: string) {
  const typeMap: Record<string, string> = {
    domain: '领域',
    subject: '科目',
    resource_type: '资源类型',
  };
  return typeMap[type] || type;
}

function getCategoryTypeColor(type: string) {
  const colorMap: Record<string, string> = {
    domain: 'blue',
    subject: 'green',
    resource_type: 'orange',
  };
  return colorMap[type] || 'default';
}

function transformToTreeData(categories: CategoryTreeNode[]): Array<{
  children?: any[];
  label: string;
  value: number;
}> {
  return categories.map((category) => ({
    ...category,
    label: category.name,
    value: category.id,
    children: category.children
      ? transformToTreeData(category.children)
      : undefined,
  }));
}

function onTreeSelect(_item: any) {}

onMounted(async () => {
  await fetchCategoryTree();
  await fetchCategoryStats();
});

defineExpose({ fetchCategoryTree, fetchCategoryStats });
</script>

<template>
  <div class="space-y-6">
    <div v-if="categoryStats" class="grid grid-cols-2 gap-3 md:grid-cols-3">
      <div class="rounded-lg bg-blue-50 p-3">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <Database class="h-6 w-6 text-blue-500" />
          </div>
          <div class="ml-3">
            <p class="text-xs font-medium text-blue-700">总分类数</p>
            <p class="text-xl font-semibold text-blue-900">
              {{ categoryStats.total_count || 0 }}
            </p>
          </div>
        </div>
      </div>
      <div class="rounded-lg bg-green-50 p-3">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div
              class="flex h-6 w-6 items-center justify-center rounded-full bg-green-100"
            >
              <span class="text-xs font-medium text-green-600">✓</span>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-xs font-medium text-green-700">启用状态</p>
            <p class="text-xl font-semibold text-green-900">
              {{ categoryStats.active_count || 0 }}
            </p>
          </div>
        </div>
      </div>
      <div class="rounded-lg bg-blue-50 p-3">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div
              class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100"
            >
              <span class="text-xs font-medium text-blue-600">🌐</span>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-xs font-medium text-blue-700">领域分类</p>
            <p class="text-xl font-semibold text-blue-900">
              {{ categoryStats.domain_count || 0 }}
            </p>
          </div>
        </div>
      </div>
      <div class="rounded-lg bg-green-50 p-3">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div
              class="flex h-6 w-6 items-center justify-center rounded-full bg-green-100"
            >
              <span class="text-xs font-medium text-green-600">📚</span>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-xs font-medium text-green-700">科目分类</p>
            <p class="text-xl font-semibold text-green-900">
              {{ categoryStats.subject_count || 0 }}
            </p>
          </div>
        </div>
      </div>
      <div class="rounded-lg bg-orange-50 p-3">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div
              class="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100"
            >
              <span class="text-xs font-medium text-orange-600">🔧</span>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-xs font-medium text-orange-700">资源类型</p>
            <p class="text-xl font-semibold text-orange-900">
              {{ categoryStats.resource_type_count || 0 }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between">
      <h4 class="text-lg font-semibold">分类树</h4>
      <VbenButton @click="onCreateCategory()" type="primary">
        <Plus class="mr-1" />新增根分类
      </VbenButton>
    </div>

    <div class="max-h-96 overflow-auto rounded-lg border bg-white p-4">
      <div
        v-if="categoryTreeData.length === 0"
        class="py-8 text-center text-gray-500"
      >
        暂无分类数据
      </div>
      <VbenTree
        v-else
        :tree-data="transformToTreeData(categoryTreeData)"
        :default-expanded-level="2"
        :show-icon="false"
        @select="onTreeSelect"
        class="w-full min-w-0"
      >
        <template #node="{ value: item }">
          <div class="group flex w-full items-center justify-between">
            <div class="flex min-w-0 flex-1 items-center space-x-2">
              <span class="flex-shrink-0 font-medium text-gray-900">{{
                item.name
              }}</span>
              <span
                class="flex-shrink-0 rounded-full px-2 py-1 text-xs"
                :class="{
                  'bg-blue-100 text-blue-800':
                    getCategoryTypeColor(item.category_type) === 'blue',
                  'bg-green-100 text-green-800':
                    getCategoryTypeColor(item.category_type) === 'green',
                  'bg-orange-100 text-orange-800':
                    getCategoryTypeColor(item.category_type) === 'orange',
                  'bg-gray-100 text-gray-800':
                    getCategoryTypeColor(item.category_type) === 'default',
                }"
                >{{ getCategoryTypeLabel(item.category_type) }}</span
              >
              <span
                v-if="item.is_system"
                class="flex-shrink-0 rounded-full bg-red-100 px-2 py-1 text-xs text-red-800"
                >系统</span
              >
              <span
                v-if="item.status === 0"
                class="flex-shrink-0 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-800"
                >停用</span
              >
              <span
                v-if="item.description"
                class="min-w-0 truncate text-xs text-gray-500"
                >{{ item.description }}</span
              >
            </div>
            <div
              class="flex flex-shrink-0 items-center space-x-0.5 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <button
                @click.stop="onEditCategory(item as CategoryTreeNode)"
                class="min-w-0 whitespace-nowrap rounded px-1 py-0.5 text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                title="编辑分类"
              >
                ✏️
              </button>
              <button
                @click.stop="onCreateCategory(item as CategoryTreeNode)"
                class="min-w-0 whitespace-nowrap rounded px-1 py-0.5 text-xs text-green-600 hover:bg-green-50 hover:text-green-800"
                title="新增子分类"
              >
                ➕
              </button>
              <button
                v-if="!item.is_system"
                @click.stop="onDeleteCategory(item as CategoryTreeNode)"
                class="min-w-0 whitespace-nowrap rounded px-1 py-0.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-800"
                title="删除分类"
              >
                🗑️
              </button>
            </div>
          </div>
        </template>
      </VbenTree>
    </div>

    <CategoryEditModal :title="editingCategoryId ? '编辑分类' : '新增分类'">
      <div class="space-y-4">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700"
              >分类名称 *</label
            >
            <input
              v-model="categoryFormData.name"
              type="text"
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="请输入分类名称"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700"
              >分类编码 *</label
            >
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
            <label class="mb-1 block text-sm font-medium text-gray-700"
              >分类类型 *</label
            >
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
            <label class="mb-1 block text-sm font-medium text-gray-700"
              >排序</label
            >
            <input
              v-model.number="categoryFormData.sort"
              type="number"
              min="0"
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="请输入排序值"
            />
          </div>
        </div>

        <div
          v-if="categoryFormData.parent_id"
          class="rounded-lg border border-blue-200 bg-blue-50 p-3"
        >
          <div class="flex items-center space-x-2">
            <div
              class="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500"
            >
              <span class="text-xs text-white">↑</span>
            </div>
            <span class="text-sm font-medium text-blue-700">父分类：</span>
            <span class="text-sm text-blue-800">{{
              categoryTreeData.find((c) => c.id === categoryFormData.parent_id)
                ?.name || '未知分类'
            }}</span>
          </div>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700"
            >描述</label
          >
          <textarea
            v-model="categoryFormData.description"
            rows="3"
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            placeholder="请输入分类描述"
          ></textarea>
        </div>

        <div class="flex items-center">
          <input
            v-model="categoryFormData.status"
            type="checkbox"
            :true-value="1"
            :false-value="0"
            class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label class="ml-2 block text-sm text-gray-900">启用状态</label>
        </div>
      </div>
    </CategoryEditModal>
  </div>
</template>

<style scoped>
.ant-tag {
  margin: 1px;
  border-radius: 4px;
}
</style>
