<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { MemoryCardResult, MemoryGroupNode } from '#/api/memory-card';

import { computed, h, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createMemoryGroupApi,
  deleteMemoryCardApi,
  deleteMemoryGroupApi,
  getMemoryCardApi,
  getMemoryCardListApi,
  getMemoryDeckGroupsApi,
  getMemoryDeckListApi,
  updateMemoryGroupApi,
} from '#/api/memory-card';

import CardEditorModal from '../components/CardEditorModal.vue';
import { buildQuerySchema, useColumns } from './data';

async function loadDeckOptions() {
  try {
    const data = await getMemoryDeckListApi({ page: 1, size: 200 });
    return (data.items ?? []).map((item: any) => ({
      label: item.name,
      value: item.id,
    }));
  } catch {
    return [];
  }
}

const deckOptions = await loadDeckOptions();

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  schema: buildQuerySchema(),
};

const selectedDeckId = ref<number | undefined>();
const selectedGroupId = ref<number | undefined>();
const groupTree = ref<MemoryGroupNode[]>([]);
const groupsLoading = ref(false);

const gridOptions: VxeTableGridOptions<MemoryCardResult> = {
  rowConfig: { keyField: 'id' },
  height: 'auto',
  toolbarConfig: {
    refresh: { code: 'query' },
    zoom: true,
  },
  columns: useColumns(onActionClick),
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return await getMemoryCardListApi({
          page: page.currentPage,
          size: page.pageSize,
          deck_id: selectedDeckId.value,
          group_id: selectedGroupId.value,
          ...formValues,
        });
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

const editorVisible = ref(false);
const editingRecord = ref<MemoryCardResult | null>(null);

function onRefresh() {
  gridApi.query();
}

async function handleDeckChange(deckId: number | undefined) {
  selectedDeckId.value = deckId;
  selectedGroupId.value = undefined;
  groupTree.value = [];
  if (deckId) {
    await loadGroups(deckId);
  }
  gridApi.query();
}

async function loadGroups(deckId: number) {
  groupsLoading.value = true;
  try {
    groupTree.value = await getMemoryDeckGroupsApi(deckId);
  } catch {
    groupTree.value = [];
  } finally {
    groupsLoading.value = false;
  }
}

function handleSelectGroup(groupId: number | undefined) {
  selectedGroupId.value = groupId;
  gridApi.query();
}

function handleCreateCard() {
  editingRecord.value = null;
  editorVisible.value = true;
}

function handleEditCard(row: MemoryCardResult) {
  getMemoryCardApi(row.id).then((data) => {
    editingRecord.value = data;
    editorVisible.value = true;
  });
}

function onActionClick({ code, row }: OnActionClickParams<MemoryCardResult>) {
  switch (code) {
    case 'delete': {
      deleteMemoryCardApi(row.id).then(() => {
        message.success('删除成功');
        onRefresh();
        if (selectedDeckId.value) loadGroups(selectedDeckId.value);
      });
      break;
    }
    case 'edit': {
      handleEditCard(row);
      break;
    }
  }
}

// ============ 分组管理 ============

interface GroupFormParams {
  id?: number;
  deck_id: number;
  parent_id?: null | number;
  name: string;
}

const groupFormData = ref<GroupFormParams>();

const [GroupForm, groupFormApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  schema: [
    {
      component: 'Input',
      fieldName: 'name',
      label: '分组名称',
      rules: 'required',
      componentProps: {
        placeholder: '如：第一章 / 第一节',
      },
    },
  ],
});

const [GroupModal, groupModalApi] = useVbenModal({
  title: '分组管理',
  onConfirm: async () => {
    try {
      const values = await groupFormApi.getValues<{ name: string }>();
      const data = groupFormData.value as GroupFormParams;
      if (data.id) {
        await updateMemoryGroupApi(data.id, { name: values.name });
        message.success('重命名成功');
      } else {
        await createMemoryGroupApi({
          deck_id: data.deck_id,
          parent_id: data.parent_id ?? null,
          name: values.name,
        });
        message.success('创建成功');
      }
      groupModalApi.close();
      if (selectedDeckId.value) await loadGroups(selectedDeckId.value);
    } catch (error) {
      console.error(error);
    }
  },
  onOpenChange: async (isOpen: boolean) => {
    if (isOpen) {
      groupFormApi.resetForm();
      const data = groupModalApi.getData<GroupFormParams>();
      groupFormData.value = data;
      if (data?.id) {
        groupFormApi.setValues({ name: data.name });
      }
    }
  },
});

function handleCreateGroup(parentId?: number) {
  if (!selectedDeckId.value) return;
  groupModalApi
    .setData({ deck_id: selectedDeckId.value, parent_id: parentId, name: '' })
    .open();
}

function handleRenameGroup(node: MemoryGroupNode) {
  groupModalApi
    .setData({
      id: node.id,
      deck_id: node.deck_id,
      parent_id: node.parent_id,
      name: node.name,
    })
    .open();
}

function handleDeleteGroup(node: MemoryGroupNode) {
  message.warning('删除分组会一并删除其子分组，卡片会移回根目录');
  deleteMemoryGroupApi(node.id).then(() => {
    message.success('删除成功');
    if (selectedGroupId.value === node.id) {
      selectedGroupId.value = undefined;
    }
    if (selectedDeckId.value) loadGroups(selectedDeckId.value);
    gridApi.query();
  });
}

function nodeAction(
  node: MemoryGroupNode,
  action: 'add' | 'delete' | 'rename',
) {
  if (action === 'add') handleCreateGroup(node.id);
  else if (action === 'rename') handleRenameGroup(node);
  else handleDeleteGroup(node);
}

const treeData = computed(() => [
  { key: 'root', title: '根目录' },
  ...mapGroupNodes(groupTree.value),
]);

function mapGroupNodes(nodes: MemoryGroupNode[]): any[] {
  return nodes.map((node) => ({
    ...node,
    key: node.id,
    title: node.name,
    children: node.children?.length ? mapGroupNodes(node.children) : undefined,
  }));
}

function renderTitle(node: any) {
  if (node.key === 'root') {
    return h('span', '根目录');
  }
  return h(
    'span',
    { class: 'group/row flex items-center justify-between gap-1' },
    [
      h('span', { class: 'truncate' }, node.title),
      h(
        'span',
        { class: 'hidden shrink-0 gap-1 text-xs group-hover/row:inline-flex' },
        [
          h(
            'a',
            {
              onClick: (e: any) => {
                e.stopPropagation();
                nodeAction(node, 'add');
              },
            },
            '子',
          ),
          h(
            'a',
            {
              onClick: (e: any) => {
                e.stopPropagation();
                nodeAction(node, 'rename');
              },
            },
            '改',
          ),
          h(
            'a',
            {
              class: 'text-error',
              onClick: (e: any) => {
                e.stopPropagation();
                nodeAction(node, 'delete');
              },
            },
            '删',
          ),
        ],
      ),
    ],
  );
}
</script>

<template>
  <Page auto-content-height>
    <div class="flex h-full w-full gap-4 overflow-hidden">
      <!-- 左侧分组树 -->
      <div class="flex w-60 shrink-0 flex-col rounded-lg border p-3">
        <a-select
          v-model:value="selectedDeckId"
          :options="deckOptions"
          placeholder="请选择卡组"
          allow-clear
          show-search
          option-filter-prop="label"
          @change="handleDeckChange"
        />
        <div
          v-if="selectedDeckId"
          class="mt-3 flex items-center justify-between"
        >
          <span class="text-sm font-medium">分组（章/节）</span>
          <a-button type="link" size="small" @click="handleCreateGroup()">
            新建分组
          </a-button>
        </div>
        <div v-if="selectedDeckId" class="mt-1 flex-1 overflow-y-auto">
          <a-tree
            v-if="!groupsLoading"
            :tree-data="treeData"
            :selected-keys="selectedGroupId ? [selectedGroupId] : ['root']"
            default-expand-all
            :title-render="renderTitle"
            @select="
              (keys: any) =>
                handleSelectGroup(keys[0] === 'root' ? undefined : keys[0])
            "
          />
          <a-spin v-else />
        </div>
      </div>

      <!-- 右侧卡片表格 -->
      <div class="min-w-0 flex-1">
        <Grid>
          <template #toolbar-tools>
            <a-button
              type="primary"
              :disabled="!selectedDeckId"
              @click="handleCreateCard"
            >
              新建记忆卡
            </a-button>
          </template>
        </Grid>
      </div>
    </div>

    <GroupModal>
      <GroupForm />
    </GroupModal>

    <CardEditorModal
      v-model:visible="editorVisible"
      :record="editingRecord"
      :deck-id="selectedDeckId"
      :groups="groupTree"
      @success="onRefresh"
    />
  </Page>
</template>
