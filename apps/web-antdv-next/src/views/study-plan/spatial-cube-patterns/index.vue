<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type {
  CreateSpatialCubePatternParams,
  SpatialCubePatternDetail,
  SpatialCubePatternQueryParams,
  SpatialCubePatternRenderType,
  SpatialCubePatternRotationPeriod,
} from '#/api/study-plan';

import { computed, ref } from 'vue';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';
import { $t } from '@vben/locales';

import { Modal as AntModal, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createSpatialCubePatternApi,
  deleteSpatialCubePatternApi,
  getSpatialCubePatternsApi,
  updateSpatialCubePatternApi,
} from '#/api/study-plan';

import { querySchema, schema, useColumns } from './data';

type PatternQuery = Omit<SpatialCubePatternQueryParams, 'page' | 'size'>;

interface PatternForm extends CreateSpatialCubePatternParams {
  asset_version: string;
  id?: number;
  is_active: boolean;
  render_type: SpatialCubePatternRenderType;
  rotation_period: SpatialCubePatternRotationPeriod;
  sort: number;
}

const BUILTIN_PATTERN_CODES = new Set([
  'arrow',
  'bar',
  'chevron',
  'circle',
  'corner',
  'crescent',
  'cross',
  'diamond',
  'dot',
  'parallel',
  'plus-tilt',
  'slash',
  'square',
  'triangle',
]);

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: { content: $t('common.form.query') },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<SpatialCubePatternDetail> = {
  rowConfig: { keyField: 'id' },
  height: 'auto',
  pagerConfig: {
    currentPage: 1,
    pageSize: 20,
    pageSizes: [10, 20, 50, 100],
  },
  toolbarConfig: {
    refresh: { code: 'query' },
    custom: true,
    zoom: true,
  },
  columns: useColumns(onActionClick),
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return await getSpatialCubePatternsApi({
          page: page.currentPage,
          size: page.pageSize,
          ...(formValues as PatternQuery),
        });
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

const formData = ref<PatternForm>();

const modalTitle = computed(() =>
  formData.value?.id ? '编辑六面体素材' : '新增六面体素材',
);

const [Form, formApi] = useVbenForm({
  wrapperClass: 'grid-cols-1 md:grid-cols-2',
  layout: 'vertical',
  showDefaultActions: false,
  schema,
});

const [Modal, modalApi] = useVbenModal({
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }

    modalApi.lock();
    try {
      const values = await formApi.getValues<PatternForm>();
      const payload = buildPayload(values);
      if (formData.value?.id) {
        await updateSpatialCubePatternApi(formData.value.id, payload);
        message.success('六面体素材已更新');
      } else {
        await createSpatialCubePatternApi(payload);
        message.success('六面体素材已创建');
      }
      await modalApi.close();
      gridApi.query();
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }

    const data = modalApi.getData<PatternForm>();
    formData.value = data;
    await formApi.resetForm();
    if (data) {
      await formApi.setValues({ ...data, asset_url: data.asset_url ?? '' });
    }
  },
});

function buildPayload(values: PatternForm): CreateSpatialCubePatternParams {
  return {
    asset_url: values.render_type === 'image' ? values.asset_url?.trim() : null,
    asset_version: values.asset_version.trim(),
    code: values.code.trim(),
    is_active: values.is_active,
    name: values.name.trim(),
    render_type: values.render_type,
    rotation_period: values.rotation_period,
    sort: values.sort,
  };
}

function onActionClick({
  code,
  row,
}: OnActionClickParams<SpatialCubePatternDetail>): void {
  if (code === 'edit') {
    modalApi.setData(row).open();
    return;
  }

  if (code === 'delete') {
    AntModal.confirm({
      title: '删除确认',
      content: `确认删除素材“${row.name}”吗？`,
      okType: 'danger',
      async onOk() {
        await deleteSpatialCubePatternApi(row.id);
        message.success(`素材“${row.name}”已删除`);
        gridApi.query();
      },
    });
  }
}

function isKnownBuiltin(code: string): boolean {
  return BUILTIN_PATTERN_CODES.has(code);
}

function imageStyle(assetUrl?: null | string): Record<string, string> {
  if (!assetUrl) {
    return {};
  }
  return { backgroundImage: `url(${JSON.stringify(assetUrl)})` };
}
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="六面体素材">
      <template #toolbar-actions>
        <VbenButton @click="() => modalApi.setData(null).open()">
          <MaterialSymbolsAdd class="size-5" />
          新增素材
        </VbenButton>
      </template>

      <template #preview="{ row }">
        <div
          v-if="row.render_type === 'image'"
          class="pattern-preview pattern-preview--image"
          :style="imageStyle(row.asset_url)"
        ></div>
        <div
          v-else
          class="pattern-preview pattern-preview--builtin"
          :class="`pattern-${row.code}`"
        >
          <span v-if="!isKnownBuiltin(row.code)" class="preview-code">
            {{ row.code.slice(0, 2).toUpperCase() }}
          </span>
        </div>
      </template>

      <template #name="{ row }">
        <div class="name-cell">
          <strong>{{ row.name }}</strong>
          <code>{{ row.code }}</code>
        </div>
      </template>

      <template #render_type="{ row }">
        <a-tag :color="row.render_type === 'image' ? 'blue' : 'default'">
          {{ row.render_type === 'image' ? '远程图片' : '内置图案' }}
        </a-tag>
      </template>

      <template #asset_url="{ row }">
        <a
          v-if="row.asset_url"
          class="asset-link"
          :href="row.asset_url"
          rel="noreferrer"
          target="_blank"
        >
          {{ row.asset_url }}
        </a>
        <span v-else class="muted-text">本地 CSS 图案</span>
      </template>

      <template #rotation_period="{ row }">
        <a-tag color="purple">{{ row.rotation_period }}°</a-tag>
      </template>

      <template #is_active="{ row }">
        <a-badge
          :status="row.is_active ? 'success' : 'default'"
          :text="row.is_active ? '启用' : '停用'"
        />
      </template>
    </Grid>

    <Modal :title="modalTitle">
      <Form />
    </Modal>
  </Page>
</template>

<style scoped>
.name-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.name-cell code {
  width: fit-content;
  padding: 1px 5px;
  color: var(--ant-color-text-secondary, #666);
  background: var(--ant-color-fill-tertiary, #f5f5f5);
  border-radius: 4px;
}

.asset-link {
  display: block;
  max-width: 420px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.muted-text {
  color: var(--ant-color-text-secondary, #8c8c8c);
}

.pattern-preview {
  position: relative;
  box-sizing: border-box;
  width: 48px;
  height: 48px;
  overflow: hidden;
  color: #111827;
  background-color: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
}

.pattern-preview--image {
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
}

.preview-code {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 700;
  color: #8c8c8c;
}

.pattern-corner::before,
.pattern-corner::after,
.pattern-parallel::before,
.pattern-parallel::after,
.pattern-cross::before,
.pattern-cross::after,
.pattern-plus-tilt::before,
.pattern-plus-tilt::after {
  position: absolute;
  content: '';
  background: currentcolor;
}

.pattern-corner::before {
  top: 21%;
  left: 35%;
  width: 7%;
  height: 58%;
}

.pattern-corner::after {
  top: 72%;
  left: 35%;
  width: 36%;
  height: 7%;
}

.pattern-slash::before,
.pattern-bar::before {
  position: absolute;
  top: 47%;
  left: 17%;
  width: 66%;
  height: 7%;
  content: '';
  background: currentcolor;
}

.pattern-slash::before {
  transform: rotate(-45deg);
}

.pattern-parallel::before,
.pattern-parallel::after {
  top: 47%;
  left: 21%;
  width: 58%;
  height: 6%;
}

.pattern-parallel::before {
  transform: translateY(-28%);
}

.pattern-parallel::after {
  transform: translateY(28%);
}

.pattern-circle::before,
.pattern-square::before,
.pattern-diamond::before,
.pattern-triangle::before {
  position: absolute;
  inset: 24%;
  box-sizing: border-box;
  content: '';
  border: 3px solid currentcolor;
}

.pattern-circle::before {
  border-radius: 50%;
}

.pattern-diamond::before {
  transform: rotate(45deg);
}

.pattern-triangle::before {
  inset: 20% 23%;
  background: currentcolor;
  border: 0;
  clip-path: polygon(50% 5%, 95% 90%, 5% 90%);
}

.pattern-triangle::after {
  position: absolute;
  inset: 31% 34% 29%;
  content: '';
  background: #fff;
  clip-path: polygon(50% 5%, 95% 90%, 5% 90%);
}

.pattern-cross::before,
.pattern-cross::after,
.pattern-plus-tilt::before,
.pattern-plus-tilt::after {
  top: 47%;
  left: 20%;
  width: 60%;
  height: 7%;
}

.pattern-cross::after {
  transform: rotate(90deg);
}

.pattern-plus-tilt::before {
  transform: rotate(45deg);
}

.pattern-plus-tilt::after {
  transform: rotate(-45deg);
}

.pattern-dot::before {
  position: absolute;
  inset: 37%;
  content: '';
  background: currentcolor;
  border-radius: 50%;
}

.pattern-arrow::before {
  position: absolute;
  inset: 24%;
  display: grid;
  place-items: center;
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  content: '→';
}

.pattern-chevron::before {
  position: absolute;
  top: 28%;
  left: 30%;
  width: 40%;
  height: 40%;
  content: '';
  border-right: 3px solid currentcolor;
  border-bottom: 3px solid currentcolor;
  transform: rotate(45deg);
}

.pattern-crescent::before {
  position: absolute;
  inset: 23%;
  content: '';
  background: currentcolor;
  border-radius: 50%;
}

.pattern-crescent::after {
  position: absolute;
  inset: 18% 14% 28% 34%;
  content: '';
  background: #fff;
  border-radius: 50%;
}
</style>
