<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type {
  AgisoBatchRule,
  CreateRedeemBatchParams,
  RedeemBatchResult,
  SubscriptionTemplateResult,
} from '#/api/access';

import { computed, onMounted, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createRedeemBatchApi,
  getAgisoBatchRulesApi,
  getRedeemBatchDetailApi,
  getRedeemBatchListApi,
  getSubscriptionTemplateListApi,
  setAgisoBatchRulesApi,
  updateRedeemBatchApi,
} from '#/api/access';

import { querySchema, schema, useColumns } from './data';

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: { content: $t('common.search') },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<RedeemBatchResult> = {
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
        return await getRedeemBatchListApi({
          page: page.currentPage,
          size: page.pageSize,
          ...formValues,
        });
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

interface FormParams extends CreateRedeemBatchParams {
  id?: number;
  status?: number;
}

const formData = ref<FormParams>();
const rules = ref<AgisoBatchRule[]>([]);
const rulesLoading = ref(false);
const templateOptions = ref<Array<{ label: string; value: string }>>([]);
const batchOptions = ref<Array<{ label: string; value: number }>>([]);

const modalTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', ['兑换批次'])
    : $t('ui.actionTitle.create', ['兑换批次']),
);

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  schema,
});

const optionPageSize = 200;
let optionsLoaded = false;

async function loadTemplateOptions() {
  const templates: SubscriptionTemplateResult[] = [];
  let page = 1;

  while (true) {
    const data = await getSubscriptionTemplateListApi({
      page,
      size: optionPageSize,
      status: 'active',
    });
    templates.push(...data.items);

    if (templates.length >= data.total || data.items.length < optionPageSize) {
      break;
    }
    page += 1;
  }

  templateOptions.value = templates.map((item) => ({
    label: `${item.code} · ${item.name}`,
    value: item.code,
  }));
}

async function loadBatchOptions() {
  const batches: RedeemBatchResult[] = [];
  let page = 1;

  while (true) {
    const data = await getRedeemBatchListApi({
      page,
      size: optionPageSize,
      status: 1,
    });
    batches.push(...data.items);

    if (batches.length >= data.total || data.items.length < optionPageSize) {
      break;
    }
    page += 1;
  }

  batchOptions.value = batches.map((item) => ({
    label: `${item.id} · ${item.name} · ${item.template_code || '-'}`,
    value: item.id,
  }));
}

async function loadFormOptions() {
  if (optionsLoaded) {
    return;
  }

  await Promise.all([loadTemplateOptions(), loadBatchOptions()]);
  await formApi.updateSchema([
    {
      componentProps: {
        allowClear: true,
        optionFilterProp: 'label',
        options: templateOptions.value,
        placeholder: '选择订阅模板',
        popupMatchSelectWidth: 560,
        showSearch: true,
        style: { width: '100%' },
      },
      fieldName: 'template_code',
    },
  ]);
  optionsLoaded = true;
}

function onRefresh() {
  gridApi.query();
  void loadBatchOptions();
}

async function loadRules() {
  rulesLoading.value = true;
  try {
    rules.value = await getAgisoBatchRulesApi();
  } finally {
    rulesLoading.value = false;
  }
}

function handleAddRule() {
  rules.value.push({
    platform: 'AldsXhs',
    keyword: '',
    batch_id: undefined as unknown as number,
  });
}

function handleRemoveRule(index: number) {
  rules.value.splice(index, 1);
}

async function handleSaveRules() {
  const nextRules = rules.value.filter(
    (item) => item.platform && item.keyword && item.batch_id,
  );
  await setAgisoBatchRulesApi({ rules: nextRules });
  message.success('阿奇索规则已保存');
  await loadRules();
}

const [RulesModal, rulesModalApi] = useVbenModal({
  title: '阿奇索匹配规则',
  class: 'redeem-rules-modal',
  onConfirm: async () => {
    await handleSaveRules();
    rulesModalApi.close();
  },
  onOpenChange: async (isOpen: boolean) => {
    if (isOpen) {
      await Promise.all([loadBatchOptions(), loadRules()]);
    }
  },
});

const [Modal, modalApi] = useVbenModal({
  title: modalTitle.value,
  onConfirm: async () => {
    try {
      const values = await formApi.getValues<FormParams>();
      const id = formData.value?.id;
      if (id) {
        await updateRedeemBatchApi(id, values);
        message.success({
          content: $t('ui.actionMessage.editSuccess', [values.name]),
          key: 'action_process_msg',
        });
      } else {
        await createRedeemBatchApi(values);
        message.success({
          content: $t('ui.actionMessage.createSuccess', [values.name]),
          key: 'action_process_msg',
        });
      }
      optionsLoaded = false;
      modalApi.close();
      onRefresh();
    } catch (error) {
      console.error(error);
    }
  },
  onOpenChange: async (isOpen: boolean) => {
    if (isOpen) {
      await loadFormOptions();
      const data = modalApi.getData<FormParams>();
      formData.value = data;
      formApi.resetForm();
      if (data) {
        formApi.setValues(data);
      }
    }
  },
});

function onActionClick({ code, row }: OnActionClickParams<RedeemBatchResult>) {
  if (code === 'edit') {
    getRedeemBatchDetailApi(row.id).then((data) => {
      modalApi.setData(data).open();
    });
  }
}

function handleCreate() {
  modalApi.setData(undefined).open();
}

function openRulesModal() {
  rulesModalApi.open();
}

onMounted(async () => {
  await loadFormOptions();
});
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <a-button @click="openRulesModal">阿奇索规则</a-button>
        <a-button type="primary" @click="handleCreate">
          新建兑换批次
        </a-button>
      </template>
    </Grid>

    <Modal>
      <Form />
    </Modal>

    <RulesModal>
      <div class="redeem-rules">
        <div class="redeem-rules__header">
          <span class="redeem-rules__desc">
            平台和商品关键词命中后，把订单号写入对应兑换批次
          </span>
          <a-button @click="handleAddRule">添加规则</a-button>
        </div>

        <a-spin :spinning="rulesLoading">
          <div v-if="rules.length > 0" class="redeem-rules__list">
            <div
              v-for="(item, index) in rules"
              :key="`${item.platform}-${index}`"
              class="redeem-rules__row"
            >
              <a-input
                v-model:value="item.platform"
                placeholder="平台，如 AldsXhs"
              />
              <a-input
                v-model:value="item.keyword"
                placeholder="商品/规格关键词"
              />
              <a-select
                v-model:value="item.batch_id"
                :options="batchOptions"
                option-filter-prop="label"
                placeholder="关联兑换批次"
                show-search
                :popup-match-select-width="640"
              />
              <a-button danger @click="handleRemoveRule(index)">删除</a-button>
            </div>
          </div>
          <a-empty v-else description="暂无匹配规则" />
        </a-spin>
      </div>
    </RulesModal>
  </Page>
</template>

<style scoped>
.redeem-rules {
  min-width: 0;
  max-height: 62vh;
  overflow: auto;
}

.redeem-rules__header {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.redeem-rules__desc {
  color: #6b7280;
  line-height: 22px;
}

.redeem-rules__list {
  display: grid;
  gap: 8px;
}

.redeem-rules__row {
  display: grid;
  grid-template-columns: 160px minmax(220px, 1fr) minmax(360px, 1.2fr) 72px;
  gap: 8px;
  align-items: center;
  min-width: 820px;
}

@media (max-width: 900px) {
  .redeem-rules__header {
    display: grid;
  }

  .redeem-rules__row {
    grid-template-columns: minmax(0, 1fr);
  }
}

:global(.redeem-rules-modal) {
  width: min(1040px, calc(100vw - 48px)) !important;
}
</style>
