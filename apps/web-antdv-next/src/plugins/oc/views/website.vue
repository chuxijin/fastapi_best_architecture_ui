<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type {
  OcCompanyResult,
  OcWebsiteForm,
  OcWebsiteResult,
} from '#/plugins/oc/api';

import { computed, onMounted, ref } from 'vue';

import { useDebounceFn } from '@vueuse/core';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';
import { $t } from '@vben/locales';

import { message, Modal as AModal } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createWebsiteApi,
  deleteWebsiteApi,
  getCompanyListApi,
  getWebsiteListApi,
  updateWebsiteApi,
} from '#/plugins/oc/api';

import {
  useWebsiteColumns,
  websiteFormSchema,
  websiteQuerySchema,
} from './data';

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: { content: $t('common.form.query') },
  schema: websiteQuerySchema,
};

const gridOptions: VxeTableGridOptions<OcWebsiteResult> = {
  rowConfig: { keyField: 'id' },
  height: 'auto',
  toolbarConfig: {
    refresh: true,
    refreshOptions: { code: 'query' },
    custom: true,
    zoom: true,
  },
  columns: useWebsiteColumns(onActionClick),
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return await getWebsiteListApi({
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

function openLink(url: string) {
  window.open(url, '_blank');
}

function onActionClick({ code, row }: OnActionClickParams<OcWebsiteResult>) {
  switch (code) {
    case 'delete': {
      AModal.confirm({
        title: '删除确认',
        content: `确认删除网站 [${row.name || row.url}] 吗?`,
        okType: 'danger',
        async onOk() {
          await deleteWebsiteApi(row.id);
          message.success(
            $t('ui.actionMessage.deleteSuccess', [row.name || row.url]),
          );
          onRefresh();
        },
      });
      break;
    }
    case 'edit': {
      modalApi.setData(row).open();
    }
  }
}

/* 网站 新增/编辑 弹窗 */
const formData = ref<Partial<OcWebsiteForm>>({});

/** 公司远程搜索选项 */
const companyOptions = ref<{ label: string; value: number }[]>([]);
const companyLoading = ref(false);

async function fetchCompanyOptions(keyword?: string) {
  companyLoading.value = true;
  try {
    const res = await getCompanyListApi({
      name: keyword?.trim() || undefined,
      size: 50,
    });
    companyOptions.value = res.items.map((c: OcCompanyResult) => ({
      label: c.name,
      value: c.id,
    }));
  } catch {
    companyOptions.value = [];
  } finally {
    companyLoading.value = false;
  }
}

const debouncedSearchCompany = useDebounceFn((val: string) => {
  fetchCompanyOptions(val);
}, 300);

onMounted(() => {
  fetchCompanyOptions();
});

const [Form, formApi] = useVbenForm({
  wrapperClass: 'md:grid-cols-2',
  layout: 'vertical',
  showDefaultActions: false,
  schema: [
    {
      component: 'Select',
      fieldName: 'company_id',
      label: '所属公司',
      rules: 'required',
      componentProps: {
        allowClear: true,
        showSearch: true,
        filterOption: false,
        loading: companyLoading,
        onSearch: (val: string) => debouncedSearchCompany(val),
        options: companyOptions,
        placeholder: '输入公司名称搜索',
      },
    },
    ...websiteFormSchema,
  ],
});

const modalTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['网站'])
    : $t('ui.actionTitle.create', ['网站']);
});

const [Modal, modalApi] = useVbenModal({
  destroyOnClose: true,
  class: 'w-2/5',
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    modalApi.lock();
    try {
      const data = await formApi.getValues<OcWebsiteForm>();
      if (formData.value?.id) {
        await updateWebsiteApi(formData.value.id, data);
      } else {
        await createWebsiteApi(data);
      }
      message.success($t('ui.actionMessage.operationSuccess'));
      await modalApi.close();
      onRefresh();
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (!isOpen) return;
    const data = modalApi.getData<null | OcWebsiteResult>();
    formApi.resetForm();
    if (data) {
      formData.value = { ...data };
      // 确保当前公司出现在选项中
      if (!companyOptions.value.some((o) => o.value === data.company_id)) {
        companyOptions.value.unshift({
          label: data.company_name,
          value: data.company_id,
        });
      }
      formApi.setValues(data);
    } else {
      formData.value = {};
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
          新增网站
        </VbenButton>
      </template>
      <template #url="{ row }">
        <a
          class="text-primary truncate hover:underline"
          :href="row.url"
          target="_blank"
          rel="noopener noreferrer"
          @click.prevent="openLink(row.url)"
        >
          {{ row.url }}
        </a>
      </template>
    </Grid>
    <Modal :title="modalTitle">
      <Form />
    </Modal>
  </Page>
</template>
