<script lang="ts" setup>
import type { CreateGkContentParams, GkContentListResult } from '#/api';
import type { SysCategoryTreeResult } from '#/api/category';

import { computed, onMounted, ref, createVNode } from 'vue';
import { useRouter } from 'vue-router';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import {
  MaterialSymbolsAdd,
  AntDesignMoreOutlined as MoreOutlined,
  AntDesignEyeOutlined as EyeOutlined,
  AntDesignReloadOutlined as ReloadOutlined,
  AntDesignExclamationCircleOutlined as ExclamationCircleOutlined,
} from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Button as AButton,
  Cascader,
  DatePicker,
  Dropdown,
  Input,
  InputNumber,
  List,
  Menu,
  MenuItem,
  MenuDivider,
  message,
  Pagination,
  Select,
  Switch,
  Tag,
  Modal as AntModal,
} from 'ant-design-vue';

import { getSysCategoryTreeApi } from '#/api/category';
import {
  createGkContentApi,
  deleteGkContentApi,
  getGkContentDetailApi,
  getGkContentListApi,
  updateGkContentApi,
} from '#/api/gongkao';
import HaloEditorWrapper from '#/components/HaloEditor/HaloEditorWrapper.vue';

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

const listData = ref<GkContentListResult[]>([]);
const isLoading = ref(false);
const totalCount = ref(0);
const searchParams = ref({
  page: 1,
  size: 20,
  title: '',
  is_published: undefined as boolean | undefined,
});

const publishedFilterValue = computed<string | undefined>({
  get: () => {
    if (searchParams.value.is_published === true) {
      return 'true';
    }
    if (searchParams.value.is_published === false) {
      return 'false';
    }
    return undefined;
  },
  set: (value) => {
    if (value === 'true') {
      searchParams.value.is_published = true;
      return;
    }
    if (value === 'false') {
      searchParams.value.is_published = false;
      return;
    }
    searchParams.value.is_published = undefined;
  },
});

async function loadData() {
  isLoading.value = true;
  try {
    const res = await getGkContentListApi(searchParams.value);
    listData.value = res.items || [];
    totalCount.value = res.total || 0;
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
}

function onRefresh() {
  loadData();
}

function handleDelete(item: GkContentListResult) {
  AntModal.confirm({
    title: '确定要删除此内容吗？',
    icon: createVNode(ExclamationCircleOutlined),
    content: `将删除《${item.title}》`,
    okText: '确定',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await deleteGkContentApi([item.id]);
        message.success($t('ui.actionMessage.deleteSuccess', [item.title]));
        onRefresh();
      } catch (error) {
        console.error('Delete failed:', error);
      }
    },
  });
}
const router = useRouter();

function handleEdit(item: GkContentListResult) {
  router.push({
    path: `/gongkao/content/editor/${item.id}`,
    query: { pageKey: `gongkao-editor-${item.id}` },
  });
}
async function togglePublish(item: GkContentListResult, status: boolean) {
  try {
    const detail = await getGkContentDetailApi(item.id);
    await updateGkContentApi(item.id, {
      ...detail,
      is_published: status,
    });
    message.success(status ? '已发布' : '已取消发布');
    onRefresh();
  } catch (error) {
    console.error('Publish update failed:', error);
  }
}

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
  loadData();
});
</script>

<template>
  <Page auto-content-height>
    <div class="halo-list-container">
      <div class="halo-toolbar">
        <div class="toolbar-left">
          <Input.Search
            v-model:value="searchParams.title"
            placeholder="搜索文章标题..."
            allow-clear
            style="width: 260px"
            @search="
              () => {
                searchParams.page = 1;
                loadData();
              }
            "
          />
          <Select
            v-model:value="publishedFilterValue"
            placeholder="所有状态"
            allow-clear
            style="width: 140px"
            @change="
              () => {
                searchParams.page = 1;
                loadData();
              }
            "
          >
            <Select.Option value="true">已发布</Select.Option>
            <Select.Option value="false">草稿</Select.Option>
          </Select>
          <AButton @click="onRefresh" class="refresh-btn">
            <template #icon><ReloadOutlined /></template>
          </AButton>
        </div>
        <div class="toolbar-right">
          <VbenButton
            type="primary"
            @click="
              () =>
                router.push({
                  path: '/gongkao/content/editor/new',
                  query: { pageKey: 'gongkao-editor-new' },
                })
            "
          >
            <MaterialSymbolsAdd class="size-5" />
            新建文章
          </VbenButton>
        </div>
      </div>

      <div class="halo-list-body">
        <List
          :loading="isLoading"
          :data-source="listData"
          item-layout="horizontal"
          class="custom-halo-list"
        >
          <template #renderItem="{ item }">
            <List.Item class="halo-list-item" @click="handleEdit(item)">
              <div class="item-content-flex">
                <div class="item-main-info">
                  <div class="item-title-wrapper">
                    <span class="item-title">{{ item.title }}</span>
                    <span
                      v-if="item.is_published"
                      class="status-dot published"
                      title="已发布"
                    ></span>
                    <span v-else class="status-dot draft" title="草稿"></span>
                    <Tag
                      v-if="item.is_pinned"
                      color="orange"
                      size="small"
                      class="ml-2"
                      >置顶</Tag
                    >
                  </div>
                  <div class="item-meta-wrapper">
                    <span class="meta-slug">/{{ item.slug }}</span>
                    <span
                      class="meta-divider"
                      v-if="item.tags && item.tags.length"
                      >·</span
                    >
                    <span
                      class="meta-tags"
                      v-if="item.tags && item.tags.length"
                    >
                      <Tag
                        v-for="tag in item.tags"
                        :key="tag"
                        class="small-tag"
                        >{{ tag }}</Tag
                      >
                    </span>
                  </div>
                </div>

                <div class="item-side-info" @click.stop>
                  <div class="side-stats hidden md:flex">
                    <span class="stat-item" title="浏览量">
                      <EyeOutlined class="icon" />{{ item.view_count || 0 }}
                    </span>
                    <span class="stat-item date-item">
                      {{
                        item.created_time?.split('T')[0] ||
                        item.created_time ||
                        '未知时间'
                      }}
                    </span>
                  </div>

                  <div class="side-actions">
                    <AButton
                      type="link"
                      size="small"
                      @click.stop="handleEdit(item)"
                      >编辑</AButton
                    >
                    <Dropdown placement="bottomRight" :trigger="['click']">
                      <template #overlay>
                        <Menu>
                          <MenuItem
                            v-if="!item.is_published"
                            key="publish"
                            @click="togglePublish(item, true)"
                            >发布内容</MenuItem
                          >
                          <MenuItem
                            v-if="item.is_published"
                            key="unpublish"
                            @click="togglePublish(item, false)"
                            >转为草稿</MenuItem
                          >
                          <MenuDivider />
                          <MenuItem key="delete">
                            <span
                              class="text-red-500"
                              @click="handleDelete(item)"
                              >删除内容</span
                            >
                          </MenuItem>
                        </Menu>
                      </template>
                      <AButton
                        type="text"
                        size="small"
                        class="more-btn"
                        @click.prevent
                      >
                        <MoreOutlined />
                      </AButton>
                    </Dropdown>
                  </div>
                </div>
              </div>
            </List.Item>
          </template>
        </List>
      </div>

      <div class="halo-pagination">
        <Pagination
          v-model:current="searchParams.page"
          v-model:page-size="searchParams.size"
          :total="totalCount"
          show-size-changer
          :show-total="(total) => `共 ${total} 条`"
          @change="loadData"
        />
      </div>
    </div>
  </Page>
</template>

<style scoped>
.content-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* HALO STYLE CSS */
.halo-list-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background-color: transparent;
}

.halo-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgb(0 0 0 / 3%);
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.refresh-btn {
  color: #666;
  border-color: #d9d9d9;
}

.halo-list-body {
  overflow: hidden;
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgb(0 0 0 / 3%);
}

.custom-halo-list .ant-list-item {
  padding: 16px 20px !important;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.2s;
}

.custom-halo-list .ant-list-item:hover {
  background-color: #fcfcfc;
}

.item-content-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.item-main-info {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
}

.item-title-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
}

.item-title {
  font-size: 15px;
  font-weight: 500;
  color: #1f1f1f;
  transition: color 0.2s;
}

.custom-halo-list .ant-list-item:hover .item-title {
  color: #1677ff;
}

.status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-top: 2px;
  border-radius: 50%;
}

.status-dot.published {
  background-color: #52c41a;
  box-shadow: 0 0 0 2px rgb(82 196 26 / 10%);
}

.status-dot.draft {
  background-color: #d9d9d9;
}

.item-meta-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 13px;
  color: #8c8c8c;
}

.meta-slug {
  font-family:
    SFMono-Regular, Consolas, 'Liberation Mono', Menlo, Courier, monospace;
}

.meta-divider {
  color: #e8e8e8;
}

.small-tag {
  padding: 0 6px;
  font-size: 12px;
  line-height: 18px;
  color: #8c8c8c;
  background-color: #f5f5f5;
  border: none;
}

.item-side-info {
  display: flex;
  gap: 24px;
  align-items: center;
}

.side-stats {
  display: flex;
  gap: 16px;
  align-items: center;
  font-size: 13px;
  color: #8c8c8c;
}

.stat-item {
  display: flex;
  gap: 4px;
  align-items: center;
}

.stat-item .icon {
  font-size: 14px;
}

.date-item {
  justify-content: flex-end;
  min-width: 80px;
}

.side-actions {
  display: flex;
  gap: 6px;
  align-items: center;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.custom-halo-list .ant-list-item:hover .side-actions {
  opacity: 1;
}

.more-btn {
  color: #8c8c8c;
}

.more-btn:hover {
  color: #1f1f1f;
  background: #f5f5f5;
}

.halo-pagination {
  display: flex;
  justify-content: flex-end;
  padding: 16px;
  background: white;
  border-top: 1px solid #f0f0f0;
}

.editor-main-area {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 100%;
  padding: 40px 60px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgb(0 0 0 / 3%);
}

.title-input {
  width: 100%;
  padding-bottom: 12px;
  margin-bottom: 24px;
  font-size: 38px;
  font-weight: 700;
  color: #1a1a1a;
  outline: none;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  transition: border-color 0.3s;
}

.title-input::placeholder {
  color: #d1d5db;
}

.title-input:focus {
  border-bottom-color: #f0f0f0;
}

.halo-wrapper-container {
  flex: 1;
  min-height: 500px;
}

.editor-side-panel {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: 16px;
  width: 340px;
  max-height: 85vh;
  padding-right: 8px; /* For scrollbar breathing room */
  overflow-y: auto;
}

/* Scrollbar beautification */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #d9d9d9;
  border-radius: 10px;
}

.side-card {
  padding: 20px;
  background: white;
  border: 1px solid #edf2f7;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgb(0 0 0 / 2%);
}

.card-title {
  padding-bottom: 8px;
  margin-bottom: 16px;
  font-size: 13px;
  font-weight: 700;
  color: #595959;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #f0f0f0;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.setting-row:last-child {
  margin-bottom: 0;
}

.setting-stacked {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.setting-stacked:last-child {
  margin-bottom: 0;
}

.setting-label {
  font-size: 13px;
  font-weight: 500;
  color: #8c8c8c;
}

.tag-editor {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  min-height: 38px;
  padding: 6px 10px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
}
</style>
