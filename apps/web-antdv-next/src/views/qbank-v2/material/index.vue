<script setup lang="ts">
import type { VbenFormProps, VbenFormSchema } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  CreateMaterialAnchorParam,
  GetMaterialAnchorDetail,
  GetMaterialDetail,
  GetMaterialListItem,
  GetMaterialRevisionDetail,
} from '#/api';

import { computed, nextTick, ref } from 'vue';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createMaterialApi,
  createMaterialRevisionApi,
  getMaterialAnchorsApi,
  getMaterialApi,
  getMaterialRevisionsApi,
  publishMaterialRevisionApi,
  qbankV2CreateMaterialAnchorApi,
  qbankV2GetMaterialListApi,
  updateMaterialApi,
  updateMaterialRevisionApi,
} from '#/api';

import AnchorDrawer from './anchor-drawer.vue';
import { formSchema, querySchema, useColumns } from './data';

const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  wrapperClass: 'grid-cols-4',
  submitButtonOptions: { content: '查询' },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<GetMaterialListItem> = {
  rowConfig: { keyField: 'id', isHover: true },
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
  columns: useColumns(onActionClick),
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return qbankV2GetMaterialListApi({
          page: page.currentPage,
          size: page.pageSize,
          keyword: formValues?.keyword,
          revision_status: formValues?.revision_status,
        });
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

const anchorDrawerRef = ref<any>();

function onRefresh() {
  gridApi.query();
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: GetMaterialListItem;
}) {
  switch (code) {
    case 'annotate': {
      anchorDrawerRef.value?.open(row.id);
      break;
    }
    case 'detail': {
      openDetailModal(row.id);
      break;
    }
    case 'edit': {
      openEditModal(row.id);
      break;
    }
  }
}

const [Form, formApi] = useVbenForm({
  wrapperClass: 'md:grid-cols-2',
  showDefaultActions: false,
  schema: formSchema,
});

const formData = ref<any>();
const modalTitle = computed(() =>
  formData.value?.id ? '编辑材料' : '新建材料',
);

async function openEditModal(materialId: number) {
  const detail = await getMaterialApi(materialId);
  formData.value = {
    id: detail.id,
    code: detail.code,
    status: detail.status,
    revision: detail.revision,
    title: detail.revision?.title,
    content: detail.revision?.content,
    source_name: detail.revision?.source_name,
    source_url: detail.revision?.source_url,
  };
  modalApi.open();
}

const [Modal, modalApi] = useVbenModal({
  class: 'w-5/12',
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      modalApi.lock();
      const data = await formApi.getValues();
      try {
        if (formData.value?.id) {
          await updateMaterialApi(formData.value.id, {
            status: formData.value.status || 'active',
          });
          const revisionData = {
            title: data.title,
            content: data.content,
            source_name: data.source_name,
            source_url: data.source_url,
          };
          if (formData.value.revision?.status === 'draft') {
            await updateMaterialRevisionApi(
              formData.value.id,
              formData.value.revision.id,
              revisionData,
            );
          } else {
            await createMaterialRevisionApi(formData.value.id, revisionData);
          }
          message.success('材料更新成功');
        } else {
          await createMaterialApi({
            code: data.code,
            revision: {
              title: data.title,
              content: data.content,
              source_name: data.source_name,
              source_url: data.source_url,
            },
          });
          message.success('材料创建成功');
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
      nextTick(() => {
        formApi.resetForm();
        if (formData.value) {
          formApi.setValues(formData.value);
        }
      });
    }
  },
});

const materialDetail = ref<GetMaterialDetail>();
const currentRevision = ref<GetMaterialRevisionDetail>();
const materialRevisions = ref<GetMaterialRevisionDetail[]>([]);
const anchors = ref<GetMaterialAnchorDetail[]>([]);

const detailModalTitle = computed(() =>
  materialDetail.value?.revision?.title
    ? `材料详情 - ${materialDetail.value.revision.title} (${materialDetail.value.code})`
    : '材料详情',
);

const [DetailModal, detailModalApi] = useVbenModal({
  class: 'w-8/12',
  showCancelButton: false,
  showConfirmButton: false,
  onOpenChange(isOpen) {
    if (!isOpen) {
      materialDetail.value = undefined;
      currentRevision.value = undefined;
      materialRevisions.value = [];
      anchors.value = [];
    }
  },
});

function openDetailModal(materialId: number) {
  loadMaterialDetail(materialId);
  detailModalApi.open();
}

async function loadMaterialDetail(materialId: number) {
  const [detail, revisions] = await Promise.all([
    getMaterialApi(materialId),
    getMaterialRevisionsApi(materialId),
  ]);
  materialDetail.value = detail;
  materialRevisions.value = revisions;
  const r = detail.revision;
  currentRevision.value = r;
  if (r) {
    loadAnchors(r.id);
  }
}

function loadAnchors(revisionId: number) {
  if (!materialDetail.value) return;
  getMaterialAnchorsApi(materialDetail.value.id, revisionId).then((res) => {
    anchors.value = res;
  });
}

function selectRevision(revision: GetMaterialRevisionDetail) {
  currentRevision.value = revision;
  loadAnchors(revision.id);
}

function publishRevision(revisionId: number) {
  if (!materialDetail.value) return;
  publishMaterialRevisionApi(materialDetail.value.id, revisionId).then(() => {
    message.success('版本发布成功');
    loadMaterialDetail(materialDetail.value as GetMaterialDetail.id);
  });
}

const anchorFormSchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'anchor_key',
    label: '锚点键',
    rules: 'required',
  },
  {
    component: 'Input',
    fieldName: 'anchor_type',
    label: '类型',
    rules: 'required',
  },
  { component: 'Textarea', fieldName: 'text', label: '锚点文本' },
  { component: 'Input', fieldName: 'semantic_role', label: '语义角色' },
];

const [AnchorForm, anchorFormApi] = useVbenForm({
  wrapperClass: 'grid-cols-1',
  showDefaultActions: false,
  schema: anchorFormSchema,
});

const [AnchorModal, anchorModalApi] = useVbenModal({
  class: 'w-5/12',
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await anchorFormApi.validate();
    if (valid) {
      anchorModalApi.lock();
      const data = await anchorFormApi.getValues<CreateMaterialAnchorParam>();
      try {
        await qbankV2CreateMaterialAnchorApi(
          materialDetail.value as GetMaterialDetail.id,
          currentRevision.value as GetMaterialRevisionDetail.id,
          data,
        );
        message.success('锚点创建成功');
        await anchorModalApi.close();
        loadAnchors(currentRevision.value as GetMaterialRevisionDetail.id);
      } finally {
        anchorModalApi.unlock();
      }
    }
  },
});

const revisionsColumns = [
  { title: '版本号', dataIndex: 'revision_no', key: 'revision_no', width: 80 },
  { title: '标题', dataIndex: 'title', key: 'title', minWidth: 160 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  {
    title: '发布时间',
    dataIndex: 'published_time',
    key: 'published_time',
    width: 168,
  },
  { title: '操作', key: 'action', width: 160 },
];

const anchorsColumns = [
  { title: '锚点键', dataIndex: 'anchor_key', key: 'anchor_key', width: 140 },
  { title: '类型', dataIndex: 'anchor_type', key: 'anchor_type', width: 120 },
  {
    title: '文本',
    dataIndex: 'text',
    key: 'text',
    minWidth: 200,
    ellipsis: true,
  },
  { title: '状态', dataIndex: 'status', key: 'status', width: 80 },
  {
    title: '创建时间',
    dataIndex: 'created_time',
    key: 'created_time',
    width: 168,
  },
];

function addMaterial() {
  formData.value = undefined;
  modalApi.open();
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <VbenButton @click="addMaterial">
          <MaterialSymbolsAdd class="size-5" />
          新建材料
        </VbenButton>
      </template>
    </Grid>

    <Modal :title="modalTitle">
      <Form />
    </Modal>

    <!-- 材料详情 Modal -->
    <DetailModal :title="detailModalTitle">
      <div class="p-2">
        <a-tabs default-active-key="revisions">
          <a-tab-pane key="revisions" tab="版本">
            <a-table
              :data-source="materialRevisions"
              :columns="revisionsColumns"
              row-key="id"
              :pagination="false"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'action'">
                  <a-space>
                    <a-button
                      size="small"
                      type="link"
                      @click="
                        selectRevision(record as GetMaterialRevisionDetail)
                      "
                    >
                      查看
                    </a-button>
                    <a-button
                      v-if="record.status === 'draft'"
                      size="small"
                      type="link"
                      @click="publishRevision(record.id)"
                    >
                      发布
                    </a-button>
                  </a-space>
                </template>
              </template>
            </a-table>
          </a-tab-pane>
          <a-tab-pane key="anchors" tab="锚点">
            <div class="mb-2">
              <a-button
                size="small"
                type="primary"
                @click="anchorModalApi.open()"
              >
                新建锚点
              </a-button>
            </div>
            <a-table
              :data-source="anchors"
              :columns="anchorsColumns"
              row-key="id"
              :pagination="false"
              size="small"
            />
          </a-tab-pane>
          <a-tab-pane key="content" tab="正文">
            <div
              class="whitespace-pre-wrap bg-gray-50 p-4 rounded max-h-96 overflow-y-auto"
              v-html="currentRevision?.content || '暂无内容'"
            ></div>
          </a-tab-pane>
        </a-tabs>
      </div>
    </DetailModal>

    <AnchorModal title="新建锚点">
      <AnchorForm />
    </AnchorModal>

    <AnchorDrawer ref="anchorDrawerRef" />
  </Page>
</template>
