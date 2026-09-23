<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type {
  OcAnnouncementForm,
  OcAnnouncementResult,
  OcCompanyResult,
} from '#/plugins/oc/api';

import { computed, ref } from 'vue';

import { useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button as AButton, message, Modal as AModal } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createAnnouncementApi,
  deleteAnnouncementApi,
  getAnnouncementListApi,
  updateAnnouncementApi,
} from '#/plugins/oc/api';

import { announcementFormSchema, useAnnouncementColumns } from './data';

const company = ref<null | Pick<OcCompanyResult, 'id' | 'name'>>(null);

const gridOptions: VxeTableGridOptions<OcAnnouncementResult> = {
  rowConfig: { keyField: 'id' },
  height: 640,
  columns: useAnnouncementColumns(onActionClick),
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        if (!company.value) {
          return { items: [], total: 0 };
        }
        return await getAnnouncementListApi({
          company_id: company.value.id,
          page: page.currentPage,
          size: page.pageSize,
        });
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

const drawerTitle = computed(() =>
  company.value ? `${company.value.name} · 招聘公告` : '招聘公告',
);

function onRefresh() {
  gridApi.query();
}

function onActionClick({
  code,
  row,
}: OnActionClickParams<OcAnnouncementResult>) {
  switch (code) {
    case 'delete': {
      AModal.confirm({
        title: '删除确认',
        content: `确认删除公告 [${row.title}] 吗?`,
        okType: 'danger',
        async onOk() {
          await deleteAnnouncementApi(row.id);
          message.success($t('ui.actionMessage.deleteSuccess', [row.title]));
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

function openLink(url?: null | string) {
  if (url) {
    window.open(url, '_blank');
  }
}

/* 公告 新增/编辑 弹窗 */
const formData = ref<Partial<OcAnnouncementForm>>({});

const [Form, formApi] = useVbenForm({
  wrapperClass: 'md:grid-cols-2',
  layout: 'vertical',
  showDefaultActions: false,
  schema: announcementFormSchema,
});

const modalTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['公告'])
    : $t('ui.actionTitle.create', ['公告']);
});

const [Modal, modalApi] = useVbenModal({
  destroyOnClose: true,
  class: 'w-3/5',
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    modalApi.lock();
    try {
      const data =
        await formApi.getValues<Omit<OcAnnouncementForm, 'company_id'>>();
      const payload = {
        ...data,
        company_id: formData.value.company_id,
      } as OcAnnouncementForm;
      if (formData.value?.id) {
        await updateAnnouncementApi(formData.value.id, payload);
      } else {
        await createAnnouncementApi(payload);
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
    const data = modalApi.getData<null | OcAnnouncementResult>();
    formApi.resetForm();
    if (data) {
      formData.value = { ...data, company_id: data.company_id };
      formApi.setValues(data);
    } else {
      formData.value = company.value ? { company_id: company.value.id } : {};
    }
  },
});

const [Drawer, drawerApi] = useVbenDrawer({
  destroyOnClose: true,
  class: 'w-[1180px]',
  showCancelButton: false,
  showConfirmButton: false,
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData<Pick<OcCompanyResult, 'id' | 'name'>>();
      company.value = data ?? null;
      onRefresh();
    } else {
      company.value = null;
    }
  },
});

defineExpose({
  open(target: Pick<OcCompanyResult, 'id' | 'name'>) {
    drawerApi.setData(target).open();
  },
});
</script>

<template>
  <Drawer :title="drawerTitle">
    <div class="flex h-full flex-col">
      <Grid>
        <template #toolbar-actions>
          <AButton type="primary" @click="() => modalApi.setData(null).open()">
            <MaterialSymbolsAdd class="mr-1 size-5" />
            新增公告
          </AButton>
        </template>
        <template #links="{ row }">
          <div class="flex justify-center gap-1">
            <AButton
              v-if="row.apply_url"
              size="small"
              type="link"
              @click="openLink(row.apply_url)"
            >
              投递
            </AButton>
            <AButton
              v-if="row.notice_url"
              size="small"
              type="link"
              @click="openLink(row.notice_url)"
            >
              公告
            </AButton>
            <span v-if="!row.apply_url && !row.notice_url">-</span>
          </div>
        </template>
      </Grid>
    </div>
    <Modal :title="modalTitle">
      <Form />
    </Modal>
  </Drawer>
</template>
