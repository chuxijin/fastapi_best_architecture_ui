<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type {
  AccessDomainResult,
  AccessPackResult,
  CreateSubscriptionTemplateParams,
  SubscriptionTemplateResult,
} from '#/api/access';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createSubscriptionTemplateApi,
  deleteSubscriptionTemplateApi,
  getAccessDomainListApi,
  getAccessPackListApi,
  getSubscriptionTemplateDetailApi,
  getSubscriptionTemplateListApi,
  setSubscriptionTemplatePacksApi,
  updateSubscriptionTemplateApi,
} from '#/api/access';

import { querySchema, schema, useColumns } from './data';

const router = useRouter();

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: { content: $t('common.search') },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<SubscriptionTemplateResult> = {
  rowConfig: { keyField: 'id' },
  checkboxConfig: { highlight: true },
  height: 'auto',
  exportConfig: {},
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
        const data = await getSubscriptionTemplateListApi({
          page: page.currentPage,
          size: page.pageSize,
          ...formValues,
        });

        // 补齐 packs 等详细信息以供列表显示
        const items = await Promise.all(
          data.items.map(async (item) => {
            try {
              const detail = await getSubscriptionTemplateDetailApi(item.id);
              // 如果后端将 domain_codes 存在 metadata 中，提取出来方便显示
              const domain_codes =
                (detail as any).metadata?.domain_codes ||
                (detail as any).domain_codes ||
                [];
              return { ...item, ...detail, domain_codes };
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

interface FormParams extends CreateSubscriptionTemplateParams {
  id?: number;
  packs?: AccessPackResult[];
}

const formData = ref<FormParams>();

const modalTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', ['订阅模板'])
    : $t('ui.actionTitle.create', ['订阅模板']),
);

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  schema,
});

const optionPageSize = 200;
let optionsLoaded = false;

async function loadDomainOptions() {
  const domains: AccessDomainResult[] = [];
  let page = 1;

  while (true) {
    const data = await getAccessDomainListApi({
      page,
      size: optionPageSize,
    });
    domains.push(...data.items);

    if (domains.length >= data.total || data.items.length < optionPageSize) {
      break;
    }

    page += 1;
  }

  return domains.map((item) => ({
    label: `${item.code} · ${item.name}`,
    value: item.code,
  }));
}

async function loadPackOptions() {
  const packs: AccessPackResult[] = [];
  let page = 1;

  while (true) {
    const data = await getAccessPackListApi({
      page,
      size: optionPageSize,
      status: 'active',
    });
    packs.push(...data.items);

    if (packs.length >= data.total || data.items.length < optionPageSize) {
      break;
    }

    page += 1;
  }

  return packs.map((item) => ({
    label: `${item.code} · ${item.name}`,
    value: item.code,
  }));
}

async function loadFormOptions() {
  if (optionsLoaded) {
    return;
  }

  const [packOptions, domainOptions] = await Promise.all([
    loadPackOptions(),
    loadDomainOptions(),
  ]);

  await formApi.updateSchema([
    {
      componentProps: {
        allowClear: true,
        listHeight: 360,
        maxTagCount: 'responsive',
        mode: 'multiple',
        optionFilterProp: 'label',
        options: packOptions,
        placeholder: '请选择关联 Pack',
        popupMatchSelectWidth: 560,
        showSearch: true,
        style: { width: '100%' },
      },
      fieldName: 'pack_codes',
    },
    {
      componentProps: {
        allowClear: true,
        listHeight: 360,
        maxTagCount: 'responsive',
        mode: 'multiple',
        optionFilterProp: 'label',
        options: domainOptions,
        placeholder: '请选择关联领域',
        popupMatchSelectWidth: 520,
        showSearch: true,
        style: { width: '100%' },
      },
      fieldName: 'domain_codes',
    },
  ]);

  optionsLoaded = true;
}

const [Modal, modalApi] = useVbenModal({
  title: modalTitle.value,
  fullscreenButton: false,
  onConfirm: async () => {
    try {
      const values =
        await formApi.getValues<CreateSubscriptionTemplateParams>();
      values.pack_codes = values.pack_codes || [];

      // 提取 domain_codes 存入 metadata
      const rawValues = await formApi.getValues();
      const domainCodes = (rawValues as any).domain_codes || [];
      const metadata = {
        ...((values as any).metadata || {}),
        domain_codes: domainCodes,
      };
      (values as any).metadata = metadata;

      const id = formData.value?.id;
      if (id) {
        await updateSubscriptionTemplateApi(id, values);
        await setSubscriptionTemplatePacksApi(id, {
          pack_codes: values.pack_codes,
        });
        message.success({
          content: $t('ui.actionMessage.editSuccess', [values.code]),
          key: 'action_process_msg',
        });
      } else {
        await createSubscriptionTemplateApi(values);
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
      await loadFormOptions();
      const data = modalApi.getData<FormParams>();
      const packCodes =
        data?.pack_codes || data?.packs?.map((pack) => pack.code) || [];
      const domainCodes =
        (data as any)?.metadata?.domain_codes ||
        (data as any)?.domain_codes ||
        [];
      formData.value = data;
      formApi.resetForm();
      if (data) {
        formApi.setValues({
          ...data,
          pack_codes: packCodes,
          domain_codes: domainCodes,
        });
      }
    }
  },
});

function onActionClick({
  code,
  row,
}: OnActionClickParams<SubscriptionTemplateResult>) {
  switch (code) {
    case 'delete': {
      deleteSubscriptionTemplateApi(row.id).then(() => {
        message.success({
          content: $t('ui.actionMessage.deleteSuccess', [row.code]),
          key: 'action_process_msg',
        });
        onRefresh();
      });
      break;
    }
    case 'detail': {
      router.push(`/access/subscription-template/${row.id}`);
      break;
    }
    case 'edit': {
      getSubscriptionTemplateDetailApi(row.id).then((data) => {
        modalApi.setData(data).open();
      });
      break;
    }
    case 'genCode': {
      router.push({
        path: '/app-auth/redeem-code',
        query: { template_code: row.code, reward_type: 'subscription' },
      });
      break;
    }
  }
}

function handleCreate() {
  modalApi.setData(undefined).open();
}

onMounted(() => {
  void loadFormOptions();
});
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <a-button type="primary" @click="handleCreate">新建订阅模板</a-button>
      </template>
    </Grid>
    <Modal>
      <Form />
    </Modal>
  </Page>
</template>
