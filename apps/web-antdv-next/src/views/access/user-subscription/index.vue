<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { UserSubscriptionResult } from '#/api/access';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { Form, FormItem, Input, InputNumber, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createUserSubscriptionApi,
  extendSubscriptionApi,
  getSubscriptionTemplateListApi,
  getUserSubscriptionListApi,
  revokeSubscriptionApi,
} from '#/api/access';

import { createSchema, querySchema, useColumns } from './data';

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: { content: $t('common.search') },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<UserSubscriptionResult> = {
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
        return await getUserSubscriptionListApi({
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

const activeRow = ref<null | UserSubscriptionResult>(null);
const extendDays = ref(30);
const extendReason = ref('');
const revokeReason = ref('');

const [ExtendModal, extendModalApi] = useVbenModal({
  title: '续期订阅',
  onConfirm: async () => {
    if (!activeRow.value) {
      return;
    }
    if (extendDays.value <= 0) {
      message.warning('续期天数必须大于 0');
      return;
    }
    try {
      await extendSubscriptionApi(activeRow.value.id, {
        days: extendDays.value,
        reason: extendReason.value,
      });
      message.success('续期成功');
      extendModalApi.close();
      onRefresh();
    } catch (error) {
      console.error(error);
    }
  },
});

const [RevokeModal, revokeModalApi] = useVbenModal({
  title: '撤销订阅',
  onConfirm: async () => {
    if (!activeRow.value) {
      return;
    }
    if (!revokeReason.value) {
      message.warning('请填写撤销原因');
      return;
    }
    try {
      await revokeSubscriptionApi(activeRow.value.id, {
        reason: revokeReason.value,
      });
      message.success('已撤销');
      revokeModalApi.close();
      onRefresh();
    } catch (error) {
      console.error(error);
    }
  },
});

const templateOptions = ref<Array<{ label: string; value: string }>>([]);
const optionPageSize = 200;
let optionsLoaded = false;

async function loadTemplateOptions() {
  if (optionsLoaded) return;
  try {
    const templates: any[] = [];
    let page = 1;

    while (true) {
      const data = await getSubscriptionTemplateListApi({
        page,
        size: optionPageSize,
        status: 'active',
      });
      templates.push(...data.items);

      if (
        templates.length >= data.total ||
        data.items.length < optionPageSize
      ) {
        break;
      }
      page += 1;
    }

    templateOptions.value = templates.map((item) => ({
      label: `${item.code} · ${item.name} (${item.duration_days}天)`,
      value: item.code,
    }));

    await formApi.updateSchema([
      {
        componentProps: {
          allowClear: true,
          optionFilterProp: 'label',
          options: templateOptions.value,
          placeholder: '请选择订阅模板',
          popupMatchSelectWidth: 560,
          showSearch: true,
          style: { width: '100%' },
        },
        fieldName: 'template_code',
      },
    ]);
    optionsLoaded = true;
  } catch (error) {
    console.error('Failed to load templates:', error);
  }
}

const [CreateForm, formApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  schema: createSchema,
});

const [CreateModal, createModalApi] = useVbenModal({
  title: '手动发放用户订阅',
  onConfirm: async () => {
    try {
      const values = await formApi.getValues<any>();
      const payload = {
        user_id: values.user_id,
        template_code: values.template_code,
        valid_period: {
          valid_from: values.valid_from,
          valid_to: values.valid_to || null,
        },
        source: values.source,
        source_ref: values.source_ref || null,
      };
      await createUserSubscriptionApi(payload);
      message.success('用户订阅发放成功');
      createModalApi.close();
      onRefresh();
    } catch (error) {
      console.error(error);
    }
  },
  onOpenChange: async (isOpen: boolean) => {
    if (isOpen) {
      formApi.resetForm();
      const now = new Date();
      // Format as YYYY-MM-DDTHH:mm:ssZ to match schema format
      const isoString = now.toISOString().replace(/\.\d+Z$/, 'Z');
      formApi.setValues({
        valid_from: isoString,
        source: 'admin',
      });
      await loadTemplateOptions();
    }
  },
});

function handleCreate() {
  createModalApi.open();
}

function onActionClick({
  code,
  row,
}: OnActionClickParams<UserSubscriptionResult>) {
  activeRow.value = row;
  switch (code) {
    case 'extend': {
      extendDays.value = 30;
      extendReason.value = '';
      extendModalApi.open();
      break;
    }
    case 'revoke': {
      revokeReason.value = '';
      revokeModalApi.open();
      break;
    }
  }
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <a-button type="primary" @click="handleCreate">手动发放订阅</a-button>
      </template>
    </Grid>
    <ExtendModal>
      <Form layout="vertical">
        <FormItem label="续期天数" required>
          <InputNumber
            v-model:value="extendDays"
            :min="1"
            :max="3650"
            style="width: 100%"
          />
        </FormItem>
        <FormItem label="续期原因">
          <Input v-model:value="extendReason" placeholder="可选, 用于审计" />
        </FormItem>
      </Form>
    </ExtendModal>
    <RevokeModal>
      <Form layout="vertical">
        <FormItem label="撤销原因" required>
          <Input v-model:value="revokeReason" placeholder="必填, 用于审计" />
        </FormItem>
      </Form>
    </RevokeModal>
    <CreateModal>
      <CreateForm />
    </CreateModal>
  </Page>
</template>
