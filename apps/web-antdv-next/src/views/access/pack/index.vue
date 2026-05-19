<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type {
  AccessEntitlementResult,
  AccessPackItemResult,
  AccessPackResult,
  CreateAccessPackParams,
  SetAccessPackItemParams,
} from '#/api/access';

import { computed, onMounted, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createAccessPackApi,
  deleteAccessPackApi,
  getAccessEntitlementListApi,
  getAccessPackApi,
  getAccessPackListApi,
  setAccessPackItemsApi,
  updateAccessPackApi,
} from '#/api/access';

import { querySchema, schema, useColumns } from './data';

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: { content: $t('common.search') },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<AccessPackResult> = {
  rowConfig: { keyField: 'id' },
  checkboxConfig: { highlight: true },
  height: 'auto',
  toolbarConfig: {
    export: true,
    refresh: { code: 'query' },
    custom: true,
    zoom: true,
  },
  columns: useColumns(onActionClick),
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        const data = await getAccessPackListApi({
          page: page.currentPage,
          size: page.pageSize,
          ...formValues,
        });
        const items = await Promise.all(
          data.items.map(async (item) => {
            try {
              return await getAccessPackApi(item.id);
            } catch {
              return item;
            }
          }),
        );
        return { ...data, items };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

function onRefresh() {
  gridApi.query();
}

interface FormParams extends CreateAccessPackParams {
  id?: number;
  items?: AccessPackItemResult[];
}

interface PackItemForm {
  entitlement_code: string;
  value_int: null | number;
  cycle_type?: string;
}

const formData = ref<FormParams>();
const entitlementOptions = ref<Array<{ label: string; value: string }>>([]);
const entitlements = ref<AccessEntitlementResult[]>([]);
const packItems = ref<PackItemForm[]>([]);
const selectedEntitlementCode = ref<string>();

const modalTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', ['Pack'])
    : $t('ui.actionTitle.create', ['Pack']),
);

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  schema,
});

const entitlementPageSize = 200;

let entitlementOptionsLoaded = false;

async function loadEntitlementOptions() {
  if (entitlementOptionsLoaded) {
    return;
  }

  const nextEntitlements: AccessEntitlementResult[] = [];
  const options: Array<{ label: string; value: string }> = [];
  let page = 1;

  while (true) {
    const data = await getAccessEntitlementListApi({
      page,
      size: entitlementPageSize,
      status: 'active',
    });

    nextEntitlements.push(...data.items);

    if (
      nextEntitlements.length >= data.total ||
      data.items.length < entitlementPageSize
    ) {
      break;
    }

    page += 1;
  }

  options.push(
    ...nextEntitlements.map((item) => ({
      label: `${item.code} · ${item.name} (${item.category})`,
      value: item.code,
    })),
  );

  entitlements.value = nextEntitlements;
  entitlementOptions.value = options;
  entitlementOptionsLoaded = true;
}

function getEntitlement(code: string) {
  return entitlements.value.find((item) => item.code === code);
}

function getDefaultValueInt(code: string) {
  const entitlement = getEntitlement(code);
  if (entitlement?.category === 'quota' || entitlement?.metric === 'count') {
    return 1;
  }
  return null;
}

function handleAddPackItem() {
  if (!selectedEntitlementCode.value) {
    return;
  }

  const exists = packItems.value.some(
    (item) => item.entitlement_code === selectedEntitlementCode.value,
  );
  if (exists) {
    selectedEntitlementCode.value = undefined;
    return;
  }

  packItems.value.push({
    entitlement_code: selectedEntitlementCode.value,
    value_int: getDefaultValueInt(selectedEntitlementCode.value),
  });
  selectedEntitlementCode.value = undefined;
}

function handleRemovePackItem(index: number) {
  packItems.value.splice(index, 1);
}

function normalizePackItems(): SetAccessPackItemParams[] {
  return packItems.value
    .filter((item) => item.entitlement_code)
    .map((item) => {
      const meta: Record<string, any> = {};
      if (item.cycle_type) {
        meta.cycle_type = item.cycle_type;
      }
      return {
        entitlement_code: item.entitlement_code,
        value_int: item.value_int,
        value_meta: meta,
      };
    });
}

function setPackItems(items?: AccessPackItemResult[]) {
  packItems.value = (items || []).map((item) => ({
    entitlement_code: item.entitlement_code,
    value_int: item.value_int,
    cycle_type: item.value_meta?.cycle_type,
  }));
}

const [Modal, modalApi] = useVbenModal({
  title: modalTitle.value,
  onConfirm: async () => {
    try {
      const values = await formApi.getValues<CreateAccessPackParams>();
      const items = normalizePackItems();
      if (items.length === 0) {
        message.warning('请至少添加一个权益');
        return;
      }

      const id = formData.value?.id;
      if (id) {
        await updateAccessPackApi(id, values);
        await setAccessPackItemsApi(id, { items });
        message.success({
          content: $t('ui.actionMessage.editSuccess', [values.code]),
          key: 'action_process_msg',
        });
      } else {
        const created = await createAccessPackApi(values);
        await setAccessPackItemsApi(created.id, { items });
        message.success({
          content: $t('ui.actionMessage.createSuccess', [values.code]),
          key: 'action_process_msg',
        });
      }
      modalApi.close();
      onRefresh();
    } catch (error) {
      console.error(error);
    }
  },
  onOpenChange: async (isOpen: boolean) => {
    if (isOpen) {
      await loadEntitlementOptions();
      const data = modalApi.getData<FormParams>();
      formData.value = data;
      formApi.resetForm();
      setPackItems(data?.items);
      if (data) {
        formApi.setValues(data);
      }
    }
  },
});

function onActionClick({ code, row }: OnActionClickParams<AccessPackResult>) {
  switch (code) {
    case 'delete': {
      deleteAccessPackApi(row.id).then(() => {
        message.success({
          content: $t('ui.actionMessage.deleteSuccess', [row.code]),
          key: 'action_process_msg',
        });
        onRefresh();
      });
      break;
    }
    case 'edit': {
      getAccessPackApi(row.id).then((data) => {
        modalApi.setData(data).open();
      });
      break;
    }
  }
}

function handleCreate() {
  packItems.value = [];
  selectedEntitlementCode.value = undefined;
  modalApi.setData(undefined).open();
}

onMounted(() => {
  void loadEntitlementOptions();
});
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <a-button type="primary" @click="handleCreate">新建 Pack</a-button>
      </template>
    </Grid>
    <Modal>
      <Form />
      <div class="pack-item-editor">
        <div class="pack-item-editor__header">
          <span>权益配额</span>
          <div class="pack-item-editor__adder">
            <a-select
              v-model:value="selectedEntitlementCode"
              :options="entitlementOptions"
              allow-clear
              option-filter-prop="label"
              placeholder="选择要添加的权益"
              show-search
              :popup-match-select-width="560"
            />
            <a-button type="primary" @click="handleAddPackItem">
              添加权益
            </a-button>
          </div>
        </div>
        <div v-if="packItems.length > 0" class="pack-item-editor__list">
          <div
            v-for="(item, index) in packItems"
            :key="`${item.entitlement_code}-${index}`"
            class="pack-item-editor__row"
          >
            <a-select
              v-model:value="item.entitlement_code"
              :options="entitlementOptions"
              option-filter-prop="label"
              placeholder="权益"
              show-search
              :popup-match-select-width="560"
            />
            <a-input-number
              v-model:value="item.value_int"
              :min="1"
              placeholder="次数/额度"
            />
            <a-select
              v-model:value="item.cycle_type"
              placeholder="周期"
              allow-clear
              style="width: 100px"
              :options="[
                { label: '每日', value: 'daily' },
                { label: '每周', value: 'weekly' },
                { label: '每月', value: 'monthly' },
                { label: '每年', value: 'yearly' },
                { label: '终身', value: 'lifetime' },
              ]"
            />
            <a-button danger @click="handleRemovePackItem(index)"
              >删除</a-button
            >
          </div>
        </div>
        <a-empty v-else description="暂无权益" />
      </div>
    </Modal>
  </Page>
</template>

<style scoped>
.pack-item-editor {
  margin-top: 16px;
}

.pack-item-editor__header {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  font-weight: 500;
}

.pack-item-editor__adder {
  display: grid;
  grid-template-columns: minmax(0, 420px) auto;
  gap: 8px;
}

.pack-item-editor__list {
  display: grid;
  gap: 8px;
}

.pack-item-editor__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 140px 100px auto;
  gap: 8px;
  align-items: center;
}
</style>
