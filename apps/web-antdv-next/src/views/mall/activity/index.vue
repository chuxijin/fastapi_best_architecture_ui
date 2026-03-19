<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type {
  CreateMallActivityParams,
  CreateMallLadderPriceParams,
  MallActivityResult,
} from '#/api';

import { computed, reactive, ref } from 'vue';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd, MaterialSymbolsDelete } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Button as AButton,
  Divider as ADivider,
  Form as AForm,
  FormItem as AFormItem,
  InputNumber as AInputNumber,
  message,
  Space as ASpace,
} from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  addMallLadderPriceApi,
  createMallActivityApi,
  deleteMallActivityApi,
  deleteMallLadderPriceApi,
  getMallActivityDetailApi,
  getMallActivityListApi,
  updateMallActivityApi,
} from '#/api/mall';

import { querySchema, schema, useColumns } from './data';

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: {
    content: $t('common.form.query'),
  },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<MallActivityResult> = {
  rowConfig: {
    keyField: 'id',
  },
  checkboxConfig: {
    highlight: true,
  },
  height: 'auto',
  toolbarConfig: {
    refresh: true,
    refreshOptions: {
      code: 'query',
    },
    custom: true,
    zoom: true,
  },
  columns: useColumns(onActionClick),
  proxyConfig: {
    ajax: {
      query: async (_params, formValues) => {
        const list = await getMallActivityListApi(formValues);
        return { result: list, page: { total: list.length } };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

function onRefresh() {
  gridApi.query();
}

function onActionClick({ code, row }: OnActionClickParams<MallActivityResult>) {
  switch (code) {
    case 'delete': {
      deleteMallActivityApi(row.id).then(() => {
        message.success(
          $t('ui.actionMessage.deleteSuccess', [row.activity_name]),
        );
        onRefresh();
      });
      break;
    }
    case 'edit': {
      modalApi.setData(row).open();
      break;
    }
  }
}

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  schema,
});

interface FormActivityParams extends CreateMallActivityParams {
  id?: number;
}

const formData = ref<FormActivityParams>();

const modalTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['拼团活动'])
    : $t('ui.actionTitle.create', ['拼团活动']);
});

// ==================== 阶梯价格管理 ====================
const ladderModel = reactive<{
  prices: CreateMallLadderPriceParams[];
}>({
  prices: [{ people_count: 2, price: 0 }],
});

/** 编辑模式下已有阶梯价格的 ID 列表 */
const existingLadderPriceIds = ref<number[]>([]);

function addLadderPrice() {
  if (ladderModel.prices.length >= 10) {
    message.warning('最多添加 10 个阶梯价格');
    return;
  }
  const lastCount = ladderModel.prices.at(-1)?.people_count ?? 1;
  ladderModel.prices.push({
    people_count: lastCount + 1,
    price: 0,
  });
}

function removeLadderPrice(index: number) {
  if (ladderModel.prices.length <= 1) {
    message.warning('至少保留 1 个阶梯价格');
    return;
  }
  ladderModel.prices.splice(index, 1);
}

async function syncLadderPrices(activityId: number) {
  for (const priceId of existingLadderPriceIds.value) {
    await deleteMallLadderPriceApi(priceId);
  }
  for (const item of ladderModel.prices) {
    await addMallLadderPriceApi(activityId, item);
  }
}

const [Modal, modalApi] = useVbenModal({
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;

    if (ladderModel.prices.length === 0) {
      message.warning('请至少添加 1 个阶梯价格');
      return;
    }

    modalApi.lock();
    const data = await formApi.getValues<CreateMallActivityParams>();
    try {
      if (formData.value?.id) {
        await updateMallActivityApi(formData.value.id, data);
        await syncLadderPrices(formData.value.id);
      } else {
        await createMallActivityApi({
          ...data,
          ladder_prices: ladderModel.prices,
        });
      }
      message.success($t('ui.actionMessage.operationSuccess'));
      await modalApi.close();
      onRefresh();
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<FormActivityParams>();
      formApi.resetForm();

      if (data?.id) {
        formData.value = data;
        formApi.setValues(data);

        try {
          const detail = await getMallActivityDetailApi(data.id);
          ladderModel.prices = detail.ladder_prices.map((lp) => ({
            people_count: lp.people_count,
            price: lp.price,
            original_price: lp.original_price,
          }));
          existingLadderPriceIds.value = detail.ladder_prices.map(
            (lp) => lp.id,
          );
        } catch {
          ladderModel.prices = [{ people_count: 2, price: 0 }];
          existingLadderPriceIds.value = [];
        }
      } else {
        formData.value = undefined;
        ladderModel.prices = [{ people_count: 2, price: 0 }];
        existingLadderPriceIds.value = [];
      }
    }
  },
});
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <VbenButton @click="() => modalApi.setData(null).open()">
          <MaterialSymbolsAdd class="size-5" />
          新增活动
        </VbenButton>
      </template>
    </Grid>
    <Modal :title="modalTitle">
      <Form />

      <ADivider>阶梯价格</ADivider>

      <!-- 阶梯价格 - 遵循 antdv-next dynamic-form-items 范式 -->
      <AForm :model="ladderModel" layout="vertical">
        <ASpace
          v-for="(item, index) in ladderModel.prices"
          :key="`ladder-${index}`"
          align="baseline"
          style="display: flex; margin-bottom: 8px"
        >
          <AFormItem
            :name="['prices', index, 'people_count']"
            :rules="[{ required: true, message: '请输入人数' }]"
            label="拼团人数"
          >
            <AInputNumber
              v-model:value="item.people_count"
              :min="2"
              placeholder="≥ 2"
              style="width: 120px"
            />
          </AFormItem>
          <AFormItem
            :name="['prices', index, 'price']"
            :rules="[{ required: true, message: '请输入团购价' }]"
            label="团购价"
          >
            <AInputNumber
              v-model:value="item.price"
              :min="0"
              :precision="2"
              placeholder="0.00"
              prefix="¥"
              style="width: 140px"
            />
          </AFormItem>
          <AFormItem :name="['prices', index, 'original_price']" label="原价">
            <AInputNumber
              v-model:value="item.original_price"
              :min="0"
              :precision="2"
              placeholder="可选"
              prefix="¥"
              style="width: 140px"
            />
          </AFormItem>
          <AFormItem label=" ">
            <MaterialSymbolsDelete
              v-if="ladderModel.prices.length > 1"
              class="size-4 cursor-pointer text-red-500"
              @click="removeLadderPrice(index)"
            />
          </AFormItem>
        </ASpace>

        <AFormItem>
          <AButton
            :disabled="ladderModel.prices.length >= 10"
            block
            type="dashed"
            @click="addLadderPrice"
          >
            <template #icon>
              <MaterialSymbolsAdd class="size-4" />
            </template>
            添加阶梯（{{ ladderModel.prices.length }}/10）
          </AButton>
        </AFormItem>
      </AForm>
    </Modal>
  </Page>
</template>
