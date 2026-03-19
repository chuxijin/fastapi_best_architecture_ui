<script setup lang="ts">
import type { BankParams, BankResult } from '#/api';

import { watch } from 'vue';

import { Card, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { getBankDetailApi, updateBankApi } from '#/api';

import { basicInfoSchema } from '../basic-info-schema';

interface Props {
  bankId: number;
  bankInfo: BankResult | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  update: [bankInfo: BankResult];
}>();

const [BasicForm, basicFormApi] = useVbenForm({
  wrapperClass: 'grid-cols-1 gap-4 md:grid-cols-2',
  showDefaultActions: false,
  schema: basicInfoSchema,
});

function toBankParams(
  values: Partial<BankParams>,
  base?: BankResult,
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
    status: Number(values.status ?? base?.status ?? 1),
    scope: Number(values.scope ?? base?.scope ?? 1),
  };
}

function loadBankData(data: BankResult) {
  basicFormApi.setValues({
    bank_type: data.bank_type,
    cat_id: data.cat_id,
    code: data.code,
    cover_url: data.cover_url,
    desc: data.desc,
    difficulty: data.difficulty,
    name: data.name,
    parent_id: data.parent_id,
    scene_mask: data.scene_mask,
    scope: data.scope,
    status: data.status,
  });
}

watch(
  () => props.bankInfo,
  (bankInfo) => {
    if (!bankInfo) {
      return;
    }
    loadBankData(bankInfo);
  },
  { immediate: true },
);

async function handleSaveBasic() {
  const { valid } = await basicFormApi.validate();
  if (!valid) {
    return;
  }

  if (!props.bankInfo) {
    message.warning('题库信息尚未加载完成');
    return;
  }

  const values = await basicFormApi.getValues<Partial<BankParams>>();
  const payload = toBankParams(values, props.bankInfo);

  if (payload.parent_id === props.bankId) {
    message.warning('父题库不能选择自己，已自动清空');
    payload.parent_id = null;
  }

  await updateBankApi(props.bankId, payload);
  const latest = await getBankDetailApi(props.bankId);
  loadBankData(latest);
  emit('update', latest);
  message.success('保存成功');
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <Card title="基本信息">
      <BasicForm />

      <div class="mt-4 flex justify-end">
        <a-button type="primary" @click="handleSaveBasic">保存</a-button>
      </div>
    </Card>
  </div>
</template>
