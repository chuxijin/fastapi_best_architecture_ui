<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { BankResult, ChapterParams, ChapterTreeResult } from '#/api';

import { computed, ref } from 'vue';

import { useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createChapterApi,
  deleteChapterApi,
  getChapterTreeApi,
  updateChapterApi,
} from '#/api';

import { formSchema, useColumns } from './chapter-data';

interface Props {
  bankId: number;
  bankInfo: BankResult | null;
}

const props = defineProps<Props>();

const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  wrapperClass: 'grid-cols-1',
  submitButtonOptions: {
    content: '查询',
  },
  schema: [],
};

const gridOptions: VxeTableGridOptions<ChapterTreeResult> = {
  rowConfig: {
    keyField: 'id',
    isHover: true,
  },
  height: '100%',
  toolbarConfig: {
    refresh: { code: 'query' },
    custom: true,
    zoom: true,
  },
  pagerConfig: {
    enabled: false,
  },
  treeConfig: {
    parentField: 'parent_id',
    children: 'children',
    trigger: 'default',
    expandAll: false,
  },
  columns: useColumns(onActionClick),
  proxyConfig: {
    ajax: {
      query: async () => {
        return await getChapterTreeApi({ bank_id: props.bankId });
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

function onRefresh() {
  gridApi.query();
}

const expandAll = () => {
  gridApi.grid?.setAllTreeExpand(true);
};

const collapseAll = () => {
  gridApi.grid?.setAllTreeExpand(false);
};

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: ChapterTreeResult;
}) {
  switch (code) {
    case 'add': {
      modalApi
        .setData({
          parent_id: row.id,
          bank_id: props.bankId,
          level: row.level + 1,
        })
        .open();
      break;
    }
    case 'delete': {
      deleteChapterApi({ ids: [row.id] }).then(() => {
        message.success(`删除章节成功: ${row.name}`);
        onRefresh();
      });
      break;
    }
    case 'edit': {
      modalApi.setData(row).open();
      break;
    }
    case 'import': {
      message.info('题目导入功能开发中');
      break;
    }
    case 'question': {
      message.info('题目管理功能开发中');
      break;
    }
    case 'share': {
      message.info('分享功能开发中');
      break;
    }
  }
}

const [Form, formApi] = useVbenForm({
  wrapperClass: 'grid-cols-1',
  showDefaultActions: false,
  schema: formSchema,
});

const formData = ref<ChapterTreeResult | null>(null);

const modalTitle = computed(() => {
  return formData.value?.id ? '编辑章节' : '添加章节';
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-5/12',
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      modalApi.lock();
      const data = await formApi.getValues<ChapterParams>();
      data.bank_id = props.bankId;
      try {
        if (formData.value?.id) {
          await updateChapterApi(formData.value.id, data);
          message.success(`编辑章节成功: ${data.name}`);
        } else {
          await createChapterApi(data);
          message.success(`添加章节成功: ${data.name}`);
        }
        await modalApi.close();
        onRefresh();
      } finally {
        modalApi.unlock();
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<ChapterTreeResult>();
      formApi.resetForm();
      if (data) {
        formData.value = data;
        formApi.setValues(data);
      } else {
        formData.value = null;
      }
    }
  },
});
</script>

<template>
  <div class="h-full">
    <Grid class="h-full">
      <template #toolbar-actions>
        <VbenButton
          @click="() => modalApi.setData({ bank_id: bankId, level: 1 }).open()"
        >
          <MaterialSymbolsAdd class="size-5" />
          添加章节
        </VbenButton>
      </template>

      <template #toolbar-tools>
        <a-button class="mr-2" type="primary" @click="expandAll">
          展开全部
        </a-button>
        <a-button type="primary" @click="collapseAll">折叠全部</a-button>
      </template>
    </Grid>

    <Modal :title="modalTitle">
      <Form />
    </Modal>
  </div>
</template>
