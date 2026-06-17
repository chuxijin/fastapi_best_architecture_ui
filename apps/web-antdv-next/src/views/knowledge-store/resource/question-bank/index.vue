<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { BankMountResult, BankParams, BankResult } from '#/api';

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';

import { Image, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createBankApi,
  createBankMountApi,
  deleteBankMountApi,
  getBankListApi,
  getBankMountListApi,
  updateBankApi,
  updateBankMountApi,
} from '#/api';
import {
  formSchema,
  querySchema,
  scopeMap,
  statusMap,
  useColumns,
} from '#/views/knowledge-store/resource/question-bank/data';

const router = useRouter();

const bankTypeMap: Record<number, string> = {
  1: '习题',
  2: '试卷',
  3: '合集',
};

const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  wrapperClass: 'grid-cols-4',
  submitButtonOptions: {
    content: '查询',
  },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<BankResult> = {
  rowConfig: {
    keyField: 'id',
    isHover: true,
    height: 120,
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
  pagerConfig: {
    enabled: false,
  },
  treeConfig: {
    parentField: 'parent_id',
    children: 'children',
    trigger: 'default',
    expandAll: false,
  },
  columns: useColumns(onActionClick),
  proxyConfig: {
    ajax: {
      query: async (_, formValues) => {
        return await getBankListApi({
          cat_id: formValues?.cat_id,
          status: formValues?.status,
          keyword: formValues?.keyword,
          bank_type: formValues?.bank_type,
        });
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

function toBankParams(
  values: Partial<BankParams>,
  base?: Partial<BankResult>,
): BankParams {
  return {
    cat_id: Number(values.cat_id ?? base?.cat_id ?? 0),
    name: values.name ?? base?.name ?? '',
    code: values.code ?? base?.code ?? '',
    desc: values.desc ?? base?.desc ?? null,
    cover_url: values.cover_url ?? base?.cover_url ?? null,
    difficulty: values.difficulty ?? base?.difficulty ?? null,
    bank_type: Number(values.bank_type ?? base?.bank_type ?? 1),
    scene_mask: Number(values.scene_mask ?? base?.scene_mask ?? 1),
    parent_id: values.parent_id ?? base?.parent_id ?? null,
    chapter_source_bank_id:
      values.chapter_source_bank_id ?? base?.chapter_source_bank_id ?? null,
    status: Number(values.status ?? base?.status ?? 1),
    scope: Number(values.scope ?? base?.scope ?? 1),
  };
}

function onRefresh() {
  gridApi.query();
}

const expandAll = () => {
  gridApi.grid?.setAllTreeExpand(true);
};

const collapseAll = () => {
  gridApi.grid?.setAllTreeExpand(false);
};

function onActionClick({ code, row }: { code: string; row: BankResult }) {
  switch (code) {
    case 'activation-codes': {
      router.push({
        path: '/knowledge-store/resource/question-bank/operation',
        query: { bankId: row.id, bankName: row.name, tab: 'activation-codes' },
      });
      break;
    }
    case 'add': {
      modalApi.setData({ parent_id: row.id, cat_id: row.cat_id }).open();
      break;
    }
    case 'card-records': {
      router.push({
        path: '/knowledge-store/resource/question-bank/operation',
        query: { bankId: row.id, bankName: row.name, tab: 'card-records' },
      });
      break;
    }
    case 'custom-popup': {
      router.push({
        path: '/knowledge-store/resource/question-bank/operation',
        query: { bankId: row.id, bankName: row.name, tab: 'custom-popup' },
      });
      break;
    }
    case 'daily-practice': {
      router.push({
        path: '/knowledge-store/resource/question-bank/operation',
        query: { bankId: row.id, bankName: row.name, tab: 'daily-practice' },
      });
      break;
    }
    case 'edit': {
      router.push({
        path: `/knowledge-store/resource/question-bank/${row.id}/overview`,
        query: { pageKey: `question-bank-workspace-${row.id}` },
      });
      break;
    }
    case 'gift-management': {
      router.push({
        path: '/knowledge-store/resource/question-bank/operation',
        query: { bankId: row.id, bankName: row.name, tab: 'gift-management' },
      });
      break;
    }
    case 'group-guide': {
      router.push({
        path: '/knowledge-store/resource/question-bank/operation',
        query: { bankId: row.id, bankName: row.name, tab: 'group-guide' },
      });
      break;
    }
    case 'invitation-cards': {
      router.push({
        path: '/knowledge-store/resource/question-bank/operation',
        query: { bankId: row.id, bankName: row.name, tab: 'invitation-cards' },
      });
      break;
    }
    case 'members': {
      router.push({
        path: '/knowledge-store/resource/question-bank/operation',
        query: { bankId: row.id, bankName: row.name, tab: 'members' },
      });
      break;
    }
    case 'mount': {
      mountModalApi.setData(row).open();
      break;
    }
    case 'share': {
      message.info('分享功能开发中');
      break;
    }
    case 'text-analysis': {
      router.push({
        path: '/knowledge-store/resource/question-bank/operation',
        query: { bankId: row.id, bankName: row.name, tab: 'text-analysis' },
      });
      break;
    }
    case 'toggle': {
      const newStatus = row.status === 1 ? 0 : 1;
      const action = newStatus === 1 ? '上架' : '下架';
      updateBankApi(row.id, toBankParams({ status: newStatus }, row)).then(
        () => {
          message.success(`${action}内容成功: ${row.name}`);
          onRefresh();
        },
      );
      break;
    }
    case 'tools': {
      message.info('工具功能开发中');
      break;
    }
    case 'video-analysis': {
      router.push({
        path: '/knowledge-store/resource/question-bank/operation',
        query: { bankId: row.id, bankName: row.name, tab: 'video-analysis' },
      });
      break;
    }
  }
}

const [Form, formApi] = useVbenForm({
  wrapperClass: 'md:grid-cols-2',
  showDefaultActions: false,
  schema: formSchema,
});

const formData = ref<BankResult | null>(null);

const modalTitle = computed(() => {
  return formData.value?.id ? '编辑内容' : '添加内容';
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-5/12',
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      modalApi.lock();
      const values = await formApi.getValues<Partial<BankParams>>();
      const payload = toBankParams(values, formData.value || undefined);
      try {
        if (formData.value?.id) {
          await updateBankApi(formData.value.id, payload);
          message.success(`编辑内容成功: ${payload.name}`);
        } else {
          await createBankApi(payload);
          message.success(`添加内容成功: ${payload.name}`);
        }
        await modalApi.close();
        onRefresh();
      } finally {
        modalApi.unlock();
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<Partial<BankResult>>();
      formApi.resetForm();
      if (data?.id) {
        formData.value = data as BankResult;
        formApi.setValues(data);
      } else {
        formData.value = null;
        formApi.setValues({
          bank_type: data?.bank_type ?? 1,
          cat_id: data?.cat_id,
          parent_id: data?.parent_id ?? null,
          scope: 1,
          status: 1,
        });
      }
    }
  },
});

const currentMountItem = ref<BankResult | null>(null);
const mountList = ref<BankMountResult[]>([]);
const availableCollections = ref<BankResult[]>([]);
const selectedCollectionId = ref<number>();
const mountSortOrder = ref(0);
const mountLoading = ref(false);
const collectionLoading = ref(false);
const createMountLoading = ref(false);
const updateMountLoadingMap = ref<Record<number, boolean>>({});

const mountColumns = [
  { title: '合集', dataIndex: 'collection_name', key: 'collection' },
  { title: '排序', dataIndex: 'sort_order', key: 'sort_order', width: 120 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  {
    title: '创建时间',
    dataIndex: 'created_time',
    key: 'created_time',
    width: 180,
  },
  { title: '操作', key: 'operation', width: 120 },
];

const mountedCollectionIds = computed(() => {
  return new Set(mountList.value.map((item) => item.collection_id));
});

const collectionOptions = computed(() => {
  const currentId = currentMountItem.value?.id;
  return availableCollections.value.map((item) => ({
    disabled: item.id === currentId || mountedCollectionIds.value.has(item.id),
    label: `${item.name}（ID: ${item.id}）`,
    value: item.id,
  }));
});

function flattenBanks(nodes: BankResult[], result: BankResult[] = []) {
  for (const node of nodes) {
    result.push(node);
    if (node.children?.length) {
      flattenBanks(node.children, result);
    }
  }
  return result;
}

function getBankTypeLabel(bankType?: null | number) {
  if (!bankType) {
    return '未知';
  }
  return bankTypeMap[bankType] || '未知';
}

function selectFirstAvailableCollection() {
  const option = collectionOptions.value.find((item) => !item.disabled);
  selectedCollectionId.value = option?.value;
}

async function loadMounts(itemId: number) {
  mountLoading.value = true;
  try {
    mountList.value = await getBankMountListApi({ item_id: itemId });
  } finally {
    mountLoading.value = false;
  }
}

async function loadAvailableCollections() {
  collectionLoading.value = true;
  try {
    const data = await getBankListApi({ bank_type: 3, status: 1 });
    availableCollections.value = flattenBanks(data);
  } finally {
    collectionLoading.value = false;
  }
}

async function loadMountModalData(row: BankResult) {
  selectedCollectionId.value = undefined;
  mountSortOrder.value = 0;
  await Promise.all([loadMounts(row.id), loadAvailableCollections()]);
  selectFirstAvailableCollection();
}

async function onCreateMount() {
  if (!currentMountItem.value) {
    return;
  }
  if (!selectedCollectionId.value) {
    message.warning('请选择要挂载到的合集');
    return;
  }
  createMountLoading.value = true;
  try {
    await createBankMountApi({
      collection_id: selectedCollectionId.value,
      item_id: currentMountItem.value.id,
      sort_order: mountSortOrder.value,
      status: 1,
    });
    message.success('挂载合集成功');
    await loadMountModalData(currentMountItem.value);
    onRefresh();
  } finally {
    createMountLoading.value = false;
  }
}

async function onUpdateMount(
  record: BankMountResult | Record<string, unknown>,
) {
  const mountRecord = record as BankMountResult;
  updateMountLoadingMap.value = {
    ...updateMountLoadingMap.value,
    [mountRecord.id]: true,
  };
  try {
    await updateBankMountApi(mountRecord.id, {
      sort_order: mountRecord.sort_order,
      status: mountRecord.status,
    });
    message.success('更新挂载成功');
    if (currentMountItem.value) {
      await loadMounts(currentMountItem.value.id);
      onRefresh();
    }
  } finally {
    updateMountLoadingMap.value = {
      ...updateMountLoadingMap.value,
      [mountRecord.id]: false,
    };
  }
}

async function onMountStatusChange(
  record: BankMountResult | Record<string, unknown>,
  checked: boolean,
) {
  const mountRecord = record as BankMountResult;
  mountRecord.status = checked ? 1 : 0;
  await onUpdateMount(mountRecord);
}

async function onDeleteMount(
  record: BankMountResult | Record<string, unknown>,
) {
  const mountRecord = record as BankMountResult;
  await deleteBankMountApi({ ids: [mountRecord.id] });
  message.success('移除挂载成功');
  if (currentMountItem.value) {
    await loadMountModalData(currentMountItem.value);
    onRefresh();
  }
}

const [MountModal, mountModalApi] = useVbenModal({
  class: 'w-7/12',
  destroyOnClose: true,
  async onConfirm() {
    await mountModalApi.close();
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = mountModalApi.getData<BankResult>();
      currentMountItem.value = data;
      if (data?.id) {
        loadMountModalData(data);
      }
    } else {
      currentMountItem.value = null;
      mountList.value = [];
      availableCollections.value = [];
      selectedCollectionId.value = undefined;
      updateMountLoadingMap.value = {};
    }
  },
});
</script>

<template>
  <Page auto-content-height>
    <Grid class="mt-0">
      <template #toolbar-actions>
        <VbenButton @click="() => modalApi.setData(null).open()">
          <MaterialSymbolsAdd class="size-5" />
          添加内容
        </VbenButton>
      </template>

      <template #toolbar-tools>
        <a-button class="mr-2" type="primary" @click="expandAll">
          展开全部
        </a-button>
        <a-button type="primary" @click="collapseAll">折叠全部</a-button>
      </template>

      <template #info_default="{ row }">
        <div class="flex items-start gap-3">
          <Image
            :src="row.cover_url || 'https://via.placeholder.com/160x90'"
            :width="160"
            :height="90"
            class="rounded"
            :preview="false"
          />
          <div class="flex-1">
            <div class="mb-1 font-semibold">{{ row.name }}</div>
            <div class="mb-1 text-sm text-muted-foreground">
              编码: {{ row.code }}
            </div>
            <div class="mb-1 text-sm text-muted-foreground">
              类型: {{ getBankTypeLabel(row.bank_type) }}
            </div>
            <div class="mb-1 text-sm text-muted-foreground">
              {{ row.desc || '暂无描述' }}
            </div>
            <div class="flex gap-4 text-sm">
              <span>
                {{ row.bank_type === 3 ? '内容数' : '题目数' }}:
                {{ row.q_count_cache }}
              </span>
              <span>总分: {{ row.total_score_cache }}</span>
              <span>购买数: {{ row.buy_count }}</span>
              <span>范围: {{ scopeMap[row.scope] }}</span>
              <span
                :class="row.status === 1 ? 'text-green-600' : 'text-red-600'"
              >
                {{ statusMap[row.status]?.label || '未知' }}
              </span>
            </div>
          </div>
        </div>
      </template>

      <template #detail_default>
        <div class="text-sm">
          <div class="mb-1">所属分类: 暂无</div>
          <div class="mb-1">内容时效: 永久</div>
          <div>子内容数: 0</div>
        </div>
      </template>

      <template #time_default="{ row }">
        <div class="text-sm">
          <div class="mb-1">创建: {{ row.created_time }}</div>
          <div v-if="row.updated_time">更新: {{ row.updated_time }}</div>
        </div>
      </template>
    </Grid>

    <Modal :title="modalTitle">
      <Form />
    </Modal>

    <MountModal title="挂载合集">
      <div class="space-y-4">
        <div v-if="currentMountItem" class="rounded border p-3">
          <div class="font-medium">{{ currentMountItem.name }}</div>
          <div class="mt-1 text-sm text-muted-foreground">
            ID: {{ currentMountItem.id }} · 类型:
            {{ getBankTypeLabel(currentMountItem.bank_type) }} · 编码:
            {{ currentMountItem.code }}
          </div>
        </div>

        <div class="flex flex-wrap items-end gap-3">
          <div class="min-w-72 flex-1">
            <div class="mb-1 text-sm text-muted-foreground">选择合集</div>
            <a-select
              v-model:value="selectedCollectionId"
              allow-clear
              class="w-full"
              :loading="collectionLoading"
              :options="collectionOptions"
              placeholder="请选择要挂载到的合集"
              show-search
              :filter-option="
                (input, option) =>
                  String(option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
              "
            />
          </div>
          <div class="w-32">
            <div class="mb-1 text-sm text-muted-foreground">排序</div>
            <a-input-number
              v-model:value="mountSortOrder"
              class="w-full"
              :min="0"
            />
          </div>
          <a-button
            type="primary"
            :loading="createMountLoading"
            @click="onCreateMount"
          >
            添加挂载
          </a-button>
        </div>

        <a-table
          :columns="mountColumns"
          :data-source="mountList"
          :loading="mountLoading"
          :pagination="false"
          row-key="id"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'collection'">
              <div class="font-medium">
                {{ record.collection_name || `合集 ${record.collection_id}` }}
              </div>
              <div class="text-xs text-muted-foreground">
                ID: {{ record.collection_id }}
              </div>
            </template>
            <template v-else-if="column.key === 'sort_order'">
              <a-input-number
                v-model:value="record.sort_order"
                class="w-24"
                :min="0"
              />
            </template>
            <template v-else-if="column.key === 'status'">
              <a-switch
                :checked="record.status === 1"
                checked-children="启用"
                un-checked-children="停用"
                @change="(checked) => onMountStatusChange(record, checked)"
              />
            </template>
            <template v-else-if="column.key === 'operation'">
              <a-space>
                <a-button
                  size="small"
                  type="link"
                  :loading="updateMountLoadingMap[record.id]"
                  @click="onUpdateMount(record)"
                >
                  保存
                </a-button>
                <a-popconfirm
                  title="确认移除这个挂载关系？"
                  @confirm="onDeleteMount(record)"
                >
                  <a-button danger size="small" type="link">移除</a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </template>
        </a-table>
      </div>
    </MountModal>
  </Page>
</template>
