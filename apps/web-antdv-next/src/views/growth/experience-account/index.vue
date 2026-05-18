<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type {
  ExperienceAccountResult,
  ExperienceRecordResult,
} from '#/api/growth';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import {
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Table,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  consumeExperienceApi,
  getExperienceAccountListApi,
  getExperienceRecordListApi,
  grantExperienceApi,
} from '#/api/growth';

import { querySchema, useColumns } from './data';

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: { content: $t('common.search') },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<ExperienceAccountResult> = {
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
        return await getExperienceAccountListApi({
          page: page.currentPage,
          size: page.pageSize,
          ...formValues,
        });
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

function onRefresh() {
  gridApi.query();
}

const activeRow = ref<ExperienceAccountResult | null>(null);
const expDelta = ref(0);
const expReason = ref('');

const recordsLoading = ref(false);
const records = ref<ExperienceRecordResult[]>([]);

const [GrantModal, grantModalApi] = useVbenModal({
  title: '手动发放经验',
  onConfirm: async () => {
    if (!activeRow.value) {
      return;
    }
    if (expDelta.value <= 0) {
      message.warning('发放数量必须大于 0');
      return;
    }
    if (!expReason.value) {
      message.warning('请填写原因');
      return;
    }
    try {
      await grantExperienceApi({
        user_id: activeRow.value.user_id,
        family_code: activeRow.value.family_code,
        exp_delta: expDelta.value,
        reason: expReason.value,
      });
      message.success('发放成功');
      grantModalApi.close();
      onRefresh();
    } catch (error) {
      console.error(error);
    }
  },
});

const [ConsumeModal, consumeModalApi] = useVbenModal({
  title: '手动扣减经验',
  onConfirm: async () => {
    if (!activeRow.value) {
      return;
    }
    if (expDelta.value <= 0) {
      message.warning('扣减数量必须大于 0');
      return;
    }
    if (!expReason.value) {
      message.warning('请填写原因');
      return;
    }
    try {
      await consumeExperienceApi({
        user_id: activeRow.value.user_id,
        family_code: activeRow.value.family_code,
        exp_delta: expDelta.value,
        reason: expReason.value,
      });
      message.success('扣减成功');
      consumeModalApi.close();
      onRefresh();
    } catch (error) {
      console.error(error);
    }
  },
});

const [RecordsModal, recordsModalApi] = useVbenModal({
  title: '经验流水',
  showConfirmButton: false,
});

async function loadRecords(row: ExperienceAccountResult): Promise<void> {
  recordsLoading.value = true;
  try {
    const res = await getExperienceRecordListApi({
      user_id: row.user_id,
      family_code: row.family_code,
      page: 1,
      size: 50,
    });
    records.value = (res?.items || []) as ExperienceRecordResult[];
  } catch (error) {
    console.error('加载流水失败:', error);
    records.value = [];
  } finally {
    recordsLoading.value = false;
  }
}

const recordColumns = [
  { title: 'ID', dataIndex: 'id', width: 70 },
  { title: '类型', dataIndex: 'op_type', width: 100 },
  { title: '变化', dataIndex: 'exp_delta', width: 80 },
  { title: '余额', dataIndex: 'exp_after', width: 90 },
  { title: '来源', dataIndex: 'source', width: 100 },
  { title: '原因', dataIndex: 'reason' },
  { title: '时间', dataIndex: 'created_time', width: 170 },
];

function onActionClick({
  code,
  row,
}: OnActionClickParams<ExperienceAccountResult>) {
  activeRow.value = row;
  switch (code) {
    case 'consume': {
      expDelta.value = 0;
      expReason.value = '';
      consumeModalApi.open();
      break;
    }
    case 'grant': {
      expDelta.value = 0;
      expReason.value = '';
      grantModalApi.open();
      break;
    }
    case 'records': {
      records.value = [];
      void loadRecords(row);
      recordsModalApi.open();
      break;
    }
  }
}
</script>

<template>
  <Page auto-content-height>
    <Grid />

    <GrantModal>
      <Form layout="vertical">
        <FormItem label="发放数量" required>
          <InputNumber v-model:value="expDelta" :min="1" style="width: 100%" />
        </FormItem>
        <FormItem label="原因" required>
          <Input
            v-model:value="expReason"
            placeholder="用于审计, 例如: 运营活动补发"
          />
        </FormItem>
      </Form>
    </GrantModal>

    <ConsumeModal>
      <Form layout="vertical">
        <FormItem label="扣减数量" required>
          <InputNumber v-model:value="expDelta" :min="1" style="width: 100%" />
        </FormItem>
        <FormItem label="原因" required>
          <Input
            v-model:value="expReason"
            placeholder="用于审计, 例如: 违规处罚"
          />
        </FormItem>
      </Form>
    </ConsumeModal>

    <RecordsModal>
      <Table
        :data-source="records"
        :columns="recordColumns"
        :loading="recordsLoading"
        :pagination="{ pageSize: 10 }"
        row-key="id"
        size="small"
      />
    </RecordsModal>
  </Page>
</template>
