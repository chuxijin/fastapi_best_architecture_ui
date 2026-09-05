<script setup lang="ts">
import type { VbenFormProps, VbenFormSchema } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  CreateCollectionBankMountParam,
  CreateCollectionParam,
  GetCollectionBankMountDetail,
  GetCollectionCatalogItem,
} from '#/api/qbank-v2/catalog';

import { computed, nextTick, ref } from 'vue';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createCollectionApi,
  createCollectionBankApi,
  deleteCollectionBankApi,
  getCollectionBanksApi,
  getCollectionCatalogApi,
  qbankV2GetAdminBankListApi,
  updateCollectionApi,
  updateCollectionBankApi,
} from '#/api';

import { formSchema, querySchema, useColumns } from './data';

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: { content: '查询' },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<GetCollectionCatalogItem> = {
  rowConfig: { keyField: 'id' },
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
  pagerConfig: { enabled: false },
  treeConfig: { parentField: 'parent_id' },
  columns: useColumns(onActionClick),
  proxyConfig: {
    ajax: {
      query: async () => {
        return await getCollectionCatalogApi();
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

function onRefresh() {
  gridApi.query();
}

const expandAll = () => {
  gridApi.grid?.setAllTreeExpand(true);
};

const collapseAll = () => {
  gridApi.grid?.setAllTreeExpand(false);
};

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: GetCollectionCatalogItem;
}) {
  switch (code) {
    case 'add': {
      modalApi.setData({ parent_id: row.id }).open();
      break;
    }
    case 'banks': {
      openBanksModal(row);
      break;
    }
    case 'delete': {
      message.success(`合集 ${row.name} 已删除`);
      onRefresh();
      break;
    }
    case 'edit': {
      modalApi.setData(row).open();
      break;
    }
  }
}

const [Form, formApi] = useVbenForm({
  wrapperClass: 'md:grid-cols-2',
  showDefaultActions: false,
  schema: formSchema,
});

interface FormCollectionParams extends CreateCollectionParam {
  id?: number;
}

const formData = ref<FormCollectionParams>();

const modalTitle = computed(() => {
  return formData.value?.id ? '编辑合集' : '新建合集';
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-5/12',
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      modalApi.lock();
      const data = await formApi.getValues<CreateCollectionParam>();
      try {
        if (formData.value?.id) {
          await updateCollectionApi(formData.value.id, data);
          message.success('合集更新成功');
        } else {
          await createCollectionApi(data);
          message.success('合集创建成功');
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
      const data = modalApi.getData<FormCollectionParams>();
      formApi.resetForm();
      if (data) {
        formData.value = data;
        formApi.setValues(formData.value);
      } else {
        formData.value = undefined;
      }
    }
  },
});

const selectedCollection = ref<GetCollectionCatalogItem>();
const bankMounts = ref<GetCollectionBankMountDetail[]>([]);
const mountLoading = ref(false);

const mountColumns = [
  { title: '题库 ID', dataIndex: 'bank_id', key: 'bank_id', width: 80 },
  {
    title: '题库名称',
    dataIndex: 'bank_name',
    key: 'bank_name',
    minWidth: 160,
  },
  {
    title: '展示别名',
    dataIndex: 'display_name',
    key: 'display_name',
    width: 140,
  },
  {
    title: '跟随最新版',
    dataIndex: 'follow_latest',
    key: 'follow_latest',
    width: 100,
  },
  { title: '版本号', dataIndex: 'revision_no', key: 'revision_no', width: 80 },
  { title: '排序', dataIndex: 'sort_order', key: 'sort_order', width: 60 },
  { title: '操作', key: 'operation', width: 150 },
];

const banksModalTitle = computed(() =>
  selectedCollection.value
    ? `题库挂载管理 - ${selectedCollection.value.name}`
    : '题库挂载管理',
);

const [BanksModal, banksModalApi] = useVbenModal({
  class: 'w-8/12',
  showCancelButton: false,
  showConfirmButton: false,
  onOpenChange(isOpen) {
    if (!isOpen) {
      selectedCollection.value = undefined;
      bankMounts.value = [];
    }
  },
});

function openBanksModal(collection: GetCollectionCatalogItem) {
  selectedCollection.value = collection;
  loadBanks(collection.id);
  banksModalApi.open();
}

function loadBanks(collectionId: number) {
  mountLoading.value = true;
  getCollectionBanksApi(collectionId).then((mounts) => {
    bankMounts.value = mounts;
    mountLoading.value = false;
  });
}

const bankOptions = ref<{ label: string; value: number }[]>([]);

function loadBankOptions() {
  qbankV2GetAdminBankListApi({ page: 1, size: 100 }).then((res) => {
    const list = res.items || [];
    bankOptions.value = list.map((b) => ({
      label: `${b.name} (${b.code})`,
      value: b.id,
    }));
    mountFormApi.updateSchema([
      {
        componentProps: {
          options: bankOptions.value,
          placeholder: '请选择要挂载的题库',
          showSearch: true,
          optionFilterProp: 'label',
          disabled: !!mountFormData.value?.id,
        },
        fieldName: 'bank_id',
      },
    ]);
  });
}

const mountFormSchema: VbenFormSchema[] = [
  {
    component: 'Select',
    componentProps: {
      options: [],
      placeholder: '请选择要挂载的题库',
      showSearch: true,
      optionFilterProp: 'label',
    },
    fieldName: 'bank_id',
    label: '选择题库',
    rules: 'required',
  },
  {
    component: 'Switch',
    fieldName: 'follow_latest',
    label: '跟随最新版',
    defaultValue: true,
  },
  { component: 'Input', fieldName: 'display_name', label: '展示别名' },
  { component: 'InputNumber', fieldName: 'sort_order', label: '排序' },
];

const [MountForm, mountFormApi] = useVbenForm({
  wrapperClass: 'grid-cols-1',
  showDefaultActions: false,
  schema: mountFormSchema,
});

const mountFormData = ref<any>();
const mountModalTitle = computed(() =>
  mountFormData.value?.id ? '编辑题库挂载' : '新增题库挂载',
);

const [MountModal, mountModalApi] = useVbenModal({
  class: 'w-5/12',
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await mountFormApi.validate();
    if (valid) {
      mountModalApi.lock();
      const data = await mountFormApi.getValues();
      try {
        if (mountFormData.value?.id) {
          await updateCollectionBankApi(
            selectedCollection.value as GetCollectionCatalogItem.id,
            mountFormData.value.id,
            data,
          );
          message.success('挂载更新成功');
        } else {
          await createCollectionBankApi(
            selectedCollection.value as GetCollectionCatalogItem.id,
            data as CreateCollectionBankMountParam,
          );
          message.success('题库挂载成功');
        }
        await mountModalApi.close();
        loadBanks(selectedCollection.value as GetCollectionCatalogItem.id);
      } finally {
        mountModalApi.unlock();
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      nextTick(() => {
        mountFormApi.resetForm();
        loadBankOptions();
        if (mountFormData.value) {
          mountFormApi.setValues(mountFormData.value);
        }
      });
    }
  },
});

function deleteMount(mountId: number) {
  deleteCollectionBankApi(
    selectedCollection.value as GetCollectionCatalogItem.id,
    mountId,
  ).then(() => {
    message.success('挂载已移除');
    loadBanks(selectedCollection.value as GetCollectionCatalogItem.id);
  });
}

function addCollection() {
  modalApi.setData(null).open();
}

function addMount() {
  mountFormData.value = undefined;
  mountModalApi.open();
}

function editMount(record: any) {
  mountFormData.value = record;
  mountModalApi.open();
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <VbenButton @click="addCollection">
          <MaterialSymbolsAdd class="size-5" />
          新增合集
        </VbenButton>
      </template>

      <template #toolbar-tools>
        <a-button class="mr-2" type="primary" @click="expandAll">
          展开全部
        </a-button>
        <a-button type="primary" @click="collapseAll">折叠全部</a-button>
      </template>

      <template #name_default="{ row }">
        <span class="font-medium text-gray-800">{{ row.name }}</span>
        <a-tag v-if="row.banks?.length" color="blue" class="ml-2">
          {{ row.banks.length }} 个题库
        </a-tag>
      </template>
    </Grid>

    <Modal :title="modalTitle">
      <Form />
    </Modal>

    <BanksModal :title="banksModalTitle">
      <div class="p-2">
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm text-gray-500">已挂载题库列表</span>
          <a-button type="primary" size="small" @click="addMount">
            <template #icon><MaterialSymbolsAdd class="size-4" /></template>
            挂载题库
          </a-button>
        </div>
        <a-table
          :data-source="bankMounts"
          :columns="mountColumns"
          :loading="mountLoading"
          row-key="id"
          :pagination="false"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'follow_latest'">
              <a-tag :color="record.follow_latest ? 'green' : 'default'">
                {{ record.follow_latest ? '是' : '否' }}
              </a-tag>
            </template>
            <template v-else-if="column.key === 'operation'">
              <a-space>
                <a-button size="small" type="link" @click="editMount(record)">
                  编辑
                </a-button>
                <a-popconfirm
                  title="确认移除该挂载？"
                  @confirm="deleteMount(record.id)"
                >
                  <a-button size="small" type="link" danger>移除</a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </template>
        </a-table>
      </div>
    </BanksModal>

    <MountModal :title="mountModalTitle">
      <MountForm />
    </MountModal>
  </Page>
</template>
