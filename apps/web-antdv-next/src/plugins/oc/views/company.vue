<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { OcCompanyForm, OcCompanyResult } from '#/plugins/oc/api';

import { computed, ref } from 'vue';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';
import { $t } from '@vben/locales';

import { message, Modal as AModal } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createCompanyApi,
  deleteCompanyApi,
  getCompanyListApi,
  updateCompanyApi,
} from '#/plugins/oc/api';

import AnnouncementDrawer from './announcement-drawer.vue';
import {
  companyFormSchema,
  companyQuerySchema,
  useCompanyColumns,
} from './data';

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: { content: $t('common.form.query') },
  schema: companyQuerySchema,
};

const gridOptions: VxeTableGridOptions<OcCompanyResult> = {
  rowConfig: { keyField: 'id' },
  height: 'auto',
  toolbarConfig: {
    refresh: true,
    refreshOptions: { code: 'query' },
    custom: true,
    zoom: true,
  },
  columns: useCompanyColumns(onActionClick),
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return await getCompanyListApi({
          page: page.currentPage,
          size: page.pageSize,
          ...formValues,
        });
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

const announcementDrawerRef = ref<InstanceType<typeof AnnouncementDrawer>>();

function onRefresh() {
  gridApi.query();
}

function onActionClick({ code, row }: OnActionClickParams<OcCompanyResult>) {
  switch (code) {
    case 'announcement': {
      announcementDrawerRef.value?.open({ id: row.id, name: row.name });
      break;
    }
    case 'delete': {
      AModal.confirm({
        title: '删除确认',
        content: `确认删除公司 [${row.name}] 吗? 将级联删除其网站与公告数据`,
        okType: 'danger',
        async onOk() {
          await deleteCompanyApi(row.id);
          message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
          onRefresh();
        },
      });
      break;
    }
    case 'edit': {
      modalApi.setData(row).open();
      break;
    }
  }
}

/* 公司 新增/编辑 弹窗 */
const formData = ref<Partial<OcCompanyForm>>({});

const [Form, formApi] = useVbenForm({
  wrapperClass: 'md:grid-cols-2',
  layout: 'vertical',
  showDefaultActions: false,
  schema: companyFormSchema,
});

const modalTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['公司'])
    : $t('ui.actionTitle.create', ['公司']);
});

const [Modal, modalApi] = useVbenModal({
  destroyOnClose: true,
  class: 'w-2/5',
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    modalApi.lock();
    try {
      const data = await formApi.getValues<OcCompanyForm>();
      if (formData.value?.id) {
        await updateCompanyApi(formData.value.id, data);
      } else {
        await createCompanyApi(data);
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
    const data = modalApi.getData<null | OcCompanyResult>();
    formApi.resetForm();
    if (data) {
      formData.value = { ...data };
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
          新增公司
        </VbenButton>
      </template>
    </Grid>
    <Modal :title="modalTitle">
      <Form />
    </Modal>
    <AnnouncementDrawer ref="announcementDrawerRef" />
  </Page>
</template>
