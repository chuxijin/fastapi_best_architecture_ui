<script setup lang="ts">
import type { VbenFormSchema } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  CreateBankItemParam,
  CreateBankRevisionParam,
  CreateBankSectionParam,
  GetBankCompositionDetail,
  GetBankDetail,
  GetBankItemDetail,
  GetBankRevisionDetail,
} from '#/api';

import { computed, nextTick, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsArrowBack } from '@vben/icons';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createBankItemApi,
  createBankRevisionApi,
  createBankSectionApi,
  deleteBankItemApi,
  getBankApi,
  getBankCompositionApi,
  getBankCompositionItemsApi,
  getBankRevisionsApi,
  publishBankRevisionApi,
  updateBankItemApi,
  updateBankRevisionApi,
} from '#/api';

const route = useRoute();
const router = useRouter();
const bankId = Number(route.params.id);

const bankDetail = ref<GetBankDetail>();
const activeTab = ref<'composition' | 'revisions'>('revisions');
const selectedRevisionId = ref<number>();

onMounted(async () => {
  bankDetail.value = await getBankApi(bankId);
});

const revisionColumns: NonNullable<
  VxeTableGridOptions<GetBankRevisionDetail>['columns']
> = [
  { field: 'id', title: 'ID', width: 80 },
  { field: 'revision_no', title: '版本号', width: 80 },
  { field: 'name', title: '版本名称', minWidth: 160 },
  {
    field: 'status',
    title: '状态',
    width: 90,
    cellRender: {
      name: 'CellTag',
      options: [
        { color: 'default', label: '草稿', value: 'draft' },
        { color: 'success', label: '已发布', value: 'published' },
        { color: 'warning', label: '已停用', value: 'retired' },
      ],
    },
  },
  { field: 'question_count', title: '题量', width: 70 },
  { field: 'total_score', title: '总分', width: 80 },
  { field: 'duration_minutes', title: '限时(分)', width: 90 },
  { field: 'published_time', title: '发布时间', width: 168 },
  {
    field: 'operation',
    title: '操作',
    align: 'center',
    fixed: 'right' as const,
    width: 200,
  },
];

const revisionsGridOptions: VxeTableGridOptions<GetBankRevisionDetail> = {
  rowConfig: { keyField: 'id', isHover: true },
  height: '100%',
  toolbarConfig: { refresh: { code: 'query' }, custom: true, zoom: true },
  pagerConfig: { enabled: false },
  columns: revisionColumns,
  proxyConfig: {
    ajax: {
      query: async () => {
        const result: any = await getBankRevisionsApi(bankId);
        return result.items || [];
      },
    },
  },
};

const [RevisionsGrid, revisionsGridApi] = useVbenVxeGrid({
  gridOptions: revisionsGridOptions,
});

function loadRevisions() {
  revisionsGridApi.query();
}

function onRevisionAction({
  code,
  row,
}: {
  code: string;
  row: GetBankRevisionDetail;
}) {
  switch (code) {
    case 'compose': {
      selectedRevisionId.value = row.id;
      activeTab.value = 'composition';
      setTimeout(() => compositionGridApi.query(), 0);
      break;
    }
    case 'edit': {
      revisionFormData.value = {
        ...row,
        bank_kind:
          row.bank_kind ||
          bankDetail.value?.current_revision?.bank_kind ||
          'practice',
      };
      revisionModalApi.open();
      break;
    }
    case 'publish': {
      publishBankRevisionApi(bankId, row.id).then(() => {
        message.success('版本发布成功');
        loadRevisions();
      });
      break;
    }
  }
}

const revisionFormSchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'name',
    label: '版本名称',
    rules: 'required',
  },
  {
    component: 'RadioGroup',
    componentProps: {
      options: [
        { label: '练习', value: 'practice' },
        { label: '试卷', value: 'paper' },
        { label: '模考', value: 'mock' },
      ],
    },
    defaultValue: 'practice',
    fieldName: 'bank_kind',
    label: '题库类型',
  },
  {
    component: 'InputNumber',
    fieldName: 'duration_minutes',
    label: '限时(分钟)',
  },
  { component: 'InputNumber', fieldName: 'pass_score', label: '及格分' },
  {
    component: 'Textarea',
    fieldName: 'description',
    label: '描述',
    componentProps: { rows: 3 },
  },
];

const [RevisionForm, revisionFormApi] = useVbenForm({
  wrapperClass: 'grid-cols-1',
  showDefaultActions: false,
  schema: revisionFormSchema,
});

const revisionFormData = ref<any>();
const revisionModalTitle = computed(() =>
  revisionFormData.value?.id ? '编辑版本' : '新建版本',
);

const [RevisionModal, revisionModalApi] = useVbenModal({
  class: 'w-5/12',
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await revisionFormApi.validate();
    if (valid) {
      revisionModalApi.lock();
      const data = await revisionFormApi.getValues();
      try {
        if (revisionFormData.value?.id) {
          await updateBankRevisionApi(bankId, revisionFormData.value.id, data);
          message.success('版本更新成功');
        } else {
          await createBankRevisionApi(bankId, data as CreateBankRevisionParam);
          message.success('版本创建成功');
        }
        await revisionModalApi.close();
        loadRevisions();
      } finally {
        revisionModalApi.unlock();
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      nextTick(() => {
        revisionFormApi.resetForm();
        if (revisionFormData.value) {
          revisionFormApi.setValues(revisionFormData.value);
        }
      });
    }
  },
});

const composition = ref<GetBankCompositionDetail>();

const compositionGridOptions: VxeTableGridOptions<GetBankItemDetail> = {
  rowConfig: { keyField: 'id', isHover: true },
  height: '100%',
  pagerConfig: { enabled: false },
  columns: [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'item_key', title: '题号', width: 90 },
    { field: 'stem_preview', title: '题干预览', minWidth: 200 },
    { field: 'score', title: '分值', width: 70 },
    {
      field: 'is_required',
      title: '必答',
      width: 70,
      formatter: ({ cellValue }: any) => (cellValue ? '是' : '否'),
    },
    {
      field: 'is_active',
      title: '启用',
      width: 70,
      formatter: ({ cellValue }: any) => (cellValue ? '是' : '否'),
    },
    { field: 'exam_year', title: '年份', width: 80 },
    {
      field: 'operation',
      title: '操作',
      align: 'center',
      fixed: 'right',
      width: 150,
    },
  ],
  proxyConfig: {
    ajax: {
      query: async () => {
        if (!selectedRevisionId.value) return [];
        composition.value = await getBankCompositionApi(
          bankId,
          selectedRevisionId.value,
        );
        return getBankCompositionItemsApi(bankId, selectedRevisionId.value);
      },
    },
  },
};

const [CompositionGrid, compositionGridApi] = useVbenVxeGrid({
  gridOptions: compositionGridOptions,
});

function onItemAction({ code, row }: { code: string; row: GetBankItemDetail }) {
  if (code === 'delete') {
    deleteBankItemApi(bankId, selectedRevisionId.value as number, row.id).then(
      () => {
        message.success('题目已移除');
        compositionGridApi.query();
      },
    );
  } else if (code === 'edit') {
    itemFormData.value = { ...row };
    itemModalApi.open();
  }
}

function addRevision() {
  revisionFormData.value = undefined;
  revisionModalApi.open();
}

function addItem() {
  itemFormData.value = undefined;
  itemModalApi.open();
}

const itemFormSchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'item_key',
    label: '题号',
    rules: 'required',
  },
  {
    component: 'InputNumber',
    fieldName: 'question_id',
    label: '题目 ID',
    rules: 'required',
  },
  {
    component: 'InputNumber',
    fieldName: 'score',
    label: '分值',
    defaultValue: 1,
  },
  { component: 'InputNumber', fieldName: 'exam_year', label: '年份' },
  {
    component: 'Switch',
    fieldName: 'is_required',
    label: '必答',
    defaultValue: true,
  },
  {
    component: 'Switch',
    fieldName: 'is_active',
    label: '启用',
    defaultValue: true,
  },
];

const [ItemForm, itemFormApi] = useVbenForm({
  wrapperClass: 'grid-cols-1',
  showDefaultActions: false,
  schema: itemFormSchema,
});

const itemFormData = ref<any>();
const [ItemModal, itemModalApi] = useVbenModal({
  class: 'w-5/12',
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await itemFormApi.validate();
    if (valid) {
      itemModalApi.lock();
      const data = await itemFormApi.getValues();
      try {
        if (itemFormData.value?.id) {
          await updateBankItemApi(
            bankId,
            selectedRevisionId.value as number,
            itemFormData.value.id,
            data,
          );
          message.success('编排项已更新');
        } else {
          await createBankItemApi(
            bankId,
            selectedRevisionId.value as number,
            data as CreateBankItemParam,
          );
          message.success('题目已编排');
        }
        await itemModalApi.close();
        compositionGridApi.query();
      } finally {
        itemModalApi.unlock();
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      nextTick(() => {
        itemFormApi.resetForm();
        if (itemFormData.value) {
          itemFormApi.setValues(itemFormData.value);
        }
      });
    }
  },
});

const sectionFormSchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'code',
    label: '章节编码',
    rules: 'required',
  },
  {
    component: 'Input',
    fieldName: 'name',
    label: '章节名称',
    rules: 'required',
  },
  { component: 'InputNumber', fieldName: 'sort_order', label: '排序' },
];

const [SectionForm, sectionFormApi] = useVbenForm({
  wrapperClass: 'grid-cols-1',
  showDefaultActions: false,
  schema: sectionFormSchema,
});

const [SectionModal, sectionModalApi] = useVbenModal({
  class: 'w-5/12',
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await sectionFormApi.validate();
    if (valid) {
      sectionModalApi.lock();
      const data = await sectionFormApi.getValues<CreateBankSectionParam>();
      try {
        await createBankSectionApi(
          bankId,
          selectedRevisionId.value as number,
          data,
        );
        message.success('章节创建成功');
        await sectionModalApi.close();
        compositionGridApi.query();
      } finally {
        sectionModalApi.unlock();
      }
    }
  },
});
</script>

<template>
  <Page auto-content-height>
    <template #header>
      <div class="flex items-center gap-3 p-4">
        <VbenButton size="sm" @click="router.push('/qbank-v2/bank')">
          <MaterialSymbolsArrowBack class="size-4" />
          返回
        </VbenButton>
        <span class="text-lg font-medium">{{
          bankDetail?.current_revision?.name || '题库详情'
        }}</span>
        <a-tag v-if="bankDetail?.code">{{ bankDetail.code }}</a-tag>
      </div>
    </template>

    <a-tabs v-model:active-key="activeTab" class="px-4">
      <a-tab-pane key="revisions" tab="版本管理">
        <RevisionsGrid>
          <template #toolbar-actions>
            <VbenButton @click="addRevision">
              <MaterialSymbolsAdd class="size-5" />
              新建版本
            </VbenButton>
          </template>
          <template #operation_default="{ row }">
            <a-space>
              <a-button
                size="small"
                type="link"
                @click="onRevisionAction({ code: 'compose', row })"
              >
                编排
              </a-button>
              <a-button
                size="small"
                type="link"
                @click="onRevisionAction({ code: 'edit', row })"
              >
                编辑
              </a-button>
              <a-button
                v-if="row.status === 'draft'"
                size="small"
                type="link"
                @click="onRevisionAction({ code: 'publish', row })"
              >
                发布
              </a-button>
            </a-space>
          </template>
        </RevisionsGrid>
      </a-tab-pane>
      <a-tab-pane
        key="composition"
        tab="题库编排"
        :disabled="!selectedRevisionId"
      >
        <template v-if="selectedRevisionId">
          <div class="mb-2 flex items-center gap-2">
            <span class="text-sm text-muted-foreground"
              >当前版本: {{ selectedRevisionId }}</span
            >
            <a-button
              size="small"
              type="primary"
              @click="sectionModalApi.open()"
            >
              新建章节
            </a-button>
            <a-button size="small" type="primary" @click="addItem">
              添加题目
            </a-button>
          </div>
          <CompositionGrid>
            <template #operation_default="{ row }">
              <a-space>
                <a-button
                  size="small"
                  type="link"
                  @click="onItemAction({ code: 'edit', row })"
                >
                  编辑
                </a-button>
                <a-popconfirm
                  title="确认移除该题目？"
                  @confirm="onItemAction({ code: 'delete', row })"
                >
                  <a-button size="small" type="link" danger>移除</a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </CompositionGrid>
        </template>
        <a-empty v-else description="请先在版本管理中选择一个版本进行编排" />
      </a-tab-pane>
    </a-tabs>

    <RevisionModal :title="revisionModalTitle">
      <RevisionForm />
    </RevisionModal>
    <ItemModal title="编排题目">
      <ItemForm />
    </ItemModal>
    <SectionModal title="新建章节">
      <SectionForm />
    </SectionModal>
  </Page>
</template>
