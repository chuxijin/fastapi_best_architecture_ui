<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { CreateGkContentParams, GkContentListResult } from '#/api';
import type { SysCategoryTreeResult } from '#/api/category';

import { computed, onMounted, ref } from 'vue';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Cascader,
  DatePicker,
  Input,
  InputNumber,
  message,
  Switch,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getSysCategoryTreeApi } from '#/api/category';
import {
  createGkContentApi,
  deleteGkContentApi,
  getGkContentDetailApi,
  getGkContentListApi,
  updateGkContentApi,
} from '#/api/gongkao';
import HaloEditorWrapper from '#/components/HaloEditor/HaloEditorWrapper.vue';

import { querySchema, useColumns } from './data';

interface FormContentData extends CreateGkContentParams {
  id?: number;
}

interface CascaderOption {
  children?: CascaderOption[];
  label: string;
  value: number;
}

interface HaloContentMeta {
  content_type: string;
  daily_date?: string;
  enable_comment: boolean;
  enable_toc: boolean;
  toc_depth: number;
  use_raw_content: boolean;
}

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: {
    content: $t('common.form.query'),
  },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<GkContentListResult> = {
  rowConfig: {
    keyField: 'id',
  },
  checkboxConfig: {
    highlight: true,
  },
  height: 'auto',
  toolbarConfig: {
    refresh: true,
    refreshOptions: { code: 'query' },
    custom: true,
    zoom: true,
  },
  columns: useColumns(onActionClick),
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return await getGkContentListApi({
          page: page.currentPage,
          size: page.pageSize,
          ...formValues,
        });
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

const formData = ref<FormContentData>(createDefaultFormData());
const contentHtml = ref('');
const contentJson = ref<null | Record<string, any>>(null);
const haloMeta = ref<HaloContentMeta>(createDefaultHaloMeta());
const selectedCategoryPath = ref<number[]>([]);
const tagInput = ref('');
const categoryTree = ref<CascaderOption[]>([]);
const categoryPathMap = new Map<number, number[]>();

const modalTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['内容'])
    : $t('ui.actionTitle.create', ['内容']);
});

function createDefaultFormData(): FormContentData {
  return {
    title: '',
    slug: '',
    tags: [],
    is_pinned: false,
    is_public: true,
    is_published: false,
  };
}

function createDefaultHaloMeta(): HaloContentMeta {
  return {
    content_type: '',
    daily_date: undefined,
    enable_comment: true,
    enable_toc: true,
    toc_depth: 0,
    use_raw_content: false,
  };
}

function normalizeHaloMeta(
  extra: Record<string, any> | undefined,
): HaloContentMeta {
  const defaults = createDefaultHaloMeta();
  if (!extra) {
    return defaults;
  }

  const tocDepth = Number(extra.toc_depth);

  return {
    content_type:
      typeof extra.content_type === 'string'
        ? extra.content_type
        : defaults.content_type,
    daily_date:
      typeof extra.daily_date === 'string'
        ? extra.daily_date
        : defaults.daily_date,
    enable_comment:
      typeof extra.enable_comment === 'boolean'
        ? extra.enable_comment
        : defaults.enable_comment,
    enable_toc:
      typeof extra.enable_toc === 'boolean'
        ? extra.enable_toc
        : defaults.enable_toc,
    toc_depth: Number.isFinite(tocDepth) ? tocDepth : defaults.toc_depth,
    use_raw_content:
      typeof extra.use_raw_content === 'boolean'
        ? extra.use_raw_content
        : defaults.use_raw_content,
  };
}

function buildHaloExtra(): Record<string, any> {
  const extra: Record<string, any> = {
    content_type: haloMeta.value.content_type || undefined,
    daily_date: haloMeta.value.daily_date || undefined,
    enable_comment: haloMeta.value.enable_comment,
    enable_toc: haloMeta.value.enable_toc,
    toc_depth: haloMeta.value.toc_depth,
    use_raw_content: haloMeta.value.use_raw_content,
  };
  return extra;
}

function resetForm() {
  formData.value = createDefaultFormData();
  contentHtml.value = '';
  contentJson.value = null;
  haloMeta.value = createDefaultHaloMeta();
  selectedCategoryPath.value = [];
  tagInput.value = '';
}

function onRefresh() {
  gridApi.query();
}

const [Modal, modalApi] = useVbenModal({
  destroyOnClose: true,
  async onConfirm() {
    if (!formData.value.title?.trim()) {
      message.warning('请填写标题');
      return;
    }

    if (!formData.value.slug?.trim()) {
      message.warning('请填写 slug');
      return;
    }

    modalApi.lock();

    try {
      const extra = buildHaloExtra();
      const submitData: CreateGkContentParams = {
        ...formData.value,
        content_json: contentJson.value || undefined,
        content_html: contentHtml.value,
        extra,
        slug: formData.value.slug.trim(),
        title: formData.value.title.trim(),
      };

      if (formData.value.id) {
        await updateGkContentApi(formData.value.id, submitData);
      } else {
        await createGkContentApi(submitData);
      }

      message.success($t('ui.actionMessage.operationSuccess'));
      await modalApi.close();
      onRefresh();
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }

    const data = modalApi.getData<{ id?: number }>();
    resetForm();

    if (!data?.id) {
      return;
    }

    const detail = await getGkContentDetailApi(data.id);
    const categoryPath = getCategoryPath(detail.category_id);
    const normalizedMeta = normalizeHaloMeta(detail.extra);

    selectedCategoryPath.value = categoryPath || [];
    formData.value = {
      id: detail.id,
      title: detail.title,
      slug: detail.slug,
      summary: detail.summary,
      cover_image: detail.cover_image,
      category_id: detail.category_id,
      tags: detail.tags || [],
      is_pinned: detail.is_pinned,
      is_public: detail.is_public,
      is_published: detail.is_published,
      publish_time: detail.publish_time,
      extra: normalizedMeta,
    };
    contentJson.value = detail.content_json || null;
    contentHtml.value = detail.content_html || '';
    haloMeta.value = normalizedMeta;
  },
});

function onActionClick({
  code,
  row,
}: OnActionClickParams<GkContentListResult>) {
  switch (code) {
    case 'delete': {
      deleteGkContentApi([row.id]).then(() => {
        message.success($t('ui.actionMessage.deleteSuccess', [row.title]));
        onRefresh();
      });
      break;
    }
    case 'edit': {
      modalApi.setData({ id: row.id }).open();
      break;
    }
  }
}

function addTag() {
  const tag = tagInput.value.trim();

  if (tag && !formData.value.tags?.includes(tag)) {
    formData.value.tags = [...(formData.value.tags || []), tag];
  }

  tagInput.value = '';
}

function removeTag(tag: string) {
  formData.value.tags =
    formData.value.tags?.filter((item) => item !== tag) || [];
}

function generateSlug(length: number = 16) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomValues = new Uint32Array(length);

  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(randomValues);
  } else {
    for (let index = 0; index < length; index += 1) {
      randomValues[index] = Math.floor(Math.random() * charset.length);
    }
  }

  formData.value.slug = Array.from(randomValues, (value) => {
    return charset[value % charset.length];
  }).join('');
}

function handleGenerateSlug() {
  generateSlug();
  message.success('已自动生成 slug');
}

function convertToCascaderOptions(
  tree: SysCategoryTreeResult[],
  parentPath: number[] = [],
): CascaderOption[] {
  return tree.map((node) => {
    const currentPath = [...parentPath, node.id];
    categoryPathMap.set(node.id, currentPath);

    return {
      value: node.id,
      label: node.name,
      children:
        node.children && node.children.length > 0
          ? convertToCascaderOptions(node.children, currentPath)
          : undefined,
    };
  });
}

function handleCategoryChange(value: Array<number | string>) {
  if (value.length === 0) {
    selectedCategoryPath.value = [];
    formData.value.category_id = undefined;
    return;
  }

  selectedCategoryPath.value = value.map(Number);
  formData.value.category_id = Number(value[value.length - 1]);
}

function getCategoryPath(categoryId: number | undefined): number[] | undefined {
  if (!categoryId) {
    return undefined;
  }

  return categoryPathMap.get(categoryId);
}

function getPopupContainer(triggerNode: HTMLElement) {
  return triggerNode.parentElement ?? document.body;
}

async function loadCategories() {
  try {
    const tree = await getSysCategoryTreeApi({
      app_code: 'gongkao',
      status: true,
    });
    categoryPathMap.clear();
    categoryTree.value = convertToCascaderOptions(tree);
  } catch (error) {
    console.error('加载分类失败:', error);
  }
}

onMounted(() => {
  loadCategories();
});
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <VbenButton @click="() => modalApi.setData(null).open()">
          <MaterialSymbolsAdd class="size-5" />
          新增内容
        </VbenButton>
      </template>
    </Grid>

    <Modal :title="modalTitle" class="w-[1200px]">
      <div class="content-form">
        <div class="form-section">
          <div class="section-title">基础信息</div>

          <div class="form-grid">
            <div class="form-item form-item-span-2">
              <label class="form-label">标题 *</label>
              <Input
                v-model:value="formData.title"
                placeholder="请输入标题"
                size="large"
              />
            </div>

            <div class="form-item">
              <label class="form-label">别名 (slug) *</label>
              <div class="slug-field">
                <Input
                  v-model:value="formData.slug"
                  placeholder="请输入 slug，或点击右侧自动生成"
                  :maxlength="16"
                  allow-clear
                />
                <a-button type="primary" @click.stop="handleGenerateSlug">
                  自动生成
                </a-button>
              </div>
            </div>

            <div class="form-item">
              <label class="form-label">分类</label>
              <Cascader
                v-model:value="selectedCategoryPath"
                :options="categoryTree"
                placeholder="请选择分类"
                change-on-select
                style="width: 100%"
                :get-popup-container="getPopupContainer"
                :show-search="{
                  filter: (inputValue, path) =>
                    path.some((option) =>
                      String(option.label)
                        .toLowerCase()
                        .includes(inputValue.toLowerCase()),
                    ),
                }"
                @change="handleCategoryChange"
              />
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="section-title">摘要与标签</div>

          <div class="form-item">
            <label class="form-label">摘要</label>
            <Input.TextArea
              v-model:value="formData.summary"
              placeholder="文章摘要，可选"
              :auto-size="{ minRows: 2, maxRows: 5 }"
              show-count
            />
          </div>

          <div class="form-item">
            <label class="form-label">封面图 URL</label>
            <Input
              v-model:value="formData.cover_image"
              placeholder="https://example.com/cover.jpg"
              allow-clear
            />
          </div>

          <div class="form-item">
            <label class="form-label">标签</label>
            <div class="tag-editor">
              <span v-for="tag in formData.tags" :key="tag" class="tag-item">
                {{ tag }}
                <span class="tag-remove" @click="removeTag(tag)">×</span>
              </span>
              <input
                v-model="tagInput"
                class="tag-input"
                placeholder="输入标签后回车"
                @keydown.enter.prevent="addTag"
              />
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="section-title">文章元数据（Halo）</div>

          <div class="form-grid">
            <div class="form-item">
              <label class="form-label">内容类型</label>
              <Input
                v-model:value="haloMeta.content_type"
                placeholder="例如：news / policy / guide"
                allow-clear
              />
            </div>

            <div class="form-item">
              <label class="form-label">业务日期</label>
              <DatePicker
                v-model:value="haloMeta.daily_date"
                value-format="YYYY-MM-DD"
                placeholder="选择日期，可选"
                style="width: 100%"
                :get-popup-container="getPopupContainer"
              />
            </div>

            <div class="form-item">
              <label class="form-label">目录深度</label>
              <InputNumber
                v-model:value="haloMeta.toc_depth"
                :min="0"
                :max="6"
                style="width: 100%"
              />
            </div>

            <div class="form-item">
              <label class="form-label">行为开关</label>
              <div class="meta-switches">
                <div class="control-item">
                  <label>启用目录</label>
                  <Switch v-model:checked="haloMeta.enable_toc" />
                </div>
                <div class="control-item">
                  <label>启用评论</label>
                  <Switch v-model:checked="haloMeta.enable_comment" />
                </div>
                <div class="control-item">
                  <label>原始内容模式</label>
                  <Switch v-model:checked="haloMeta.use_raw_content" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="section-title">发布设置</div>

          <div class="form-row form-controls">
            <div class="control-item">
              <label>发布</label>
              <Switch v-model:checked="formData.is_published" />
            </div>
            <div class="control-item">
              <label>公开</label>
              <Switch v-model:checked="formData.is_public" />
            </div>
            <div class="control-item">
              <label>置顶</label>
              <Switch v-model:checked="formData.is_pinned" />
            </div>
            <div class="control-item control-item-date">
              <label>发布时间</label>
              <DatePicker
                v-model:value="formData.publish_time"
                show-time
                value-format="YYYY-MM-DD HH:mm:ss"
                placeholder="选择发布时间"
                style="width: 220px"
                :get-popup-container="getPopupContainer"
              />
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="section-title">正文内容</div>

          <div class="form-item">
            <label class="form-label">内容</label>
            <HaloEditorWrapper
              v-model="contentHtml"
              v-model:json-value="contentJson"
              :height="500"
            />
          </div>
        </div>
      </div>
    </Modal>
  </Page>
</template>

<style scoped>
.content-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f1f1f;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.form-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-item-span-2 {
  grid-column: span 2;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.slug-field {
  display: flex;
  gap: 8px;
  align-items: center;
}

.slug-field :deep(.ant-input-affix-wrapper),
.slug-field :deep(.ant-input) {
  flex: 1;
}

.form-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
}

.control-item {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 13px;
}

.control-item-date {
  margin-left: auto;
}

.meta-switches {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
}

.tag-editor {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  min-height: 36px;
  padding: 6px 10px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
}

.tag-item {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 2px 10px;
  font-size: 12px;
  color: #1677ff;
  background: #e6f4ff;
  border: 1px solid #91caff;
  border-radius: 4px;
}

.tag-remove {
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  opacity: 0.6;
}

.tag-remove:hover {
  opacity: 1;
}

.tag-input {
  flex: 1;
  min-width: 100px;
  font-size: 13px;
  outline: none;
  background: transparent;
  border: none;
}

@media (max-width: 900px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-item-span-2 {
    grid-column: span 1;
  }

  .slug-field {
    flex-direction: column;
    align-items: stretch;
  }

  .form-controls {
    flex-direction: column;
    align-items: flex-start;
  }

  .meta-switches {
    flex-direction: column;
    width: 100%;
  }

  .control-item-date {
    margin-left: 0;
  }
}
</style>


