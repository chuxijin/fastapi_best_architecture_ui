<script lang="ts" setup>
import type { CreateGkContentParams } from '#/api';
import type { SysCategoryTreeResult } from '#/api/category';

import { computed, onMounted, ref, h } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { AntDesignEyeOutlined as EyeOutlined } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Button as AButton,
  DatePicker,
  Input,
  InputNumber,
  message,
  Modal,
  Switch,
  Tag,
  Card as ACard,
  Form as AForm,
  FormItem as AFormItem,
} from 'ant-design-vue';

import {
  createGkContentApi,
  getGkContentDetailApi,
  updateGkContentApi,
} from '#/api/gongkao';
import HaloEditorWrapper from '#/components/HaloEditor/HaloEditorWrapper.vue';
import CategoryTreeSelect from '#/components/Category/CategoryTreeSelect.vue';

interface FormContentData extends CreateGkContentParams {
  id?: number;
}
interface CascaderOption { children?: CascaderOption[]; label: string; value: number; }
interface HaloContentMeta {
  content_type: string; daily_date?: string; enable_comment: boolean;
  enable_toc: boolean; toc_depth: number; use_raw_content: boolean;
}

const route = useRoute();
const router = useRouter();

const idParam = route.params.id as string;
const isEdit = idParam && idParam !== 'new';
const contentId = isEdit ? Number(idParam) : undefined;

const formData = ref<FormContentData>(createDefaultFormData());
const contentHtml = ref('');
const contentJson = ref<null | Record<string, any>>(null);
const previewVisible = ref(false);
const haloMeta = ref<HaloContentMeta>(createDefaultHaloMeta());
const tagInput = ref('');

function createDefaultFormData(): FormContentData {
  return {
    title: '', slug: '', tags: [], is_pinned: false,
    is_public: true, is_published: false,
  };
}

function createDefaultHaloMeta(): HaloContentMeta {
  return {
    content_type: '', daily_date: undefined, enable_comment: true,
    enable_toc: true, toc_depth: 0, use_raw_content: false,
  };
}

function normalizeHaloMeta(extra: Record<string, any> | undefined): HaloContentMeta {
  const defaults = createDefaultHaloMeta();
  if (!extra) return defaults;
  const tocDepth = Number(extra.toc_depth);
  return {
    content_type: typeof extra.content_type === 'string' ? extra.content_type : defaults.content_type,
    daily_date: typeof extra.daily_date === 'string' ? extra.daily_date : defaults.daily_date,
    enable_comment: typeof extra.enable_comment === 'boolean' ? extra.enable_comment : defaults.enable_comment,
    enable_toc: typeof extra.enable_toc === 'boolean' ? extra.enable_toc : defaults.enable_toc,
    toc_depth: Number.isFinite(tocDepth) ? tocDepth : defaults.toc_depth,
    use_raw_content: typeof extra.use_raw_content === 'boolean' ? extra.use_raw_content : defaults.use_raw_content,
  };
}

function buildHaloExtra(): Record<string, any> {
  return {
    content_type: haloMeta.value.content_type || undefined,
    daily_date: haloMeta.value.daily_date || undefined,
    enable_comment: haloMeta.value.enable_comment,
    enable_toc: haloMeta.value.enable_toc,
    toc_depth: haloMeta.value.toc_depth,
    use_raw_content: haloMeta.value.use_raw_content,
  };
}

async function loadDetail() {
  if (!isEdit || !contentId) return;
  try {
    const detail = await getGkContentDetailApi(contentId);
    const normalizedMeta = normalizeHaloMeta(detail.extra);

    formData.value = {
      id: detail.id, title: detail.title, slug: detail.slug, summary: detail.summary,
      cover_image: detail.cover_image, category_id: detail.category_id, tags: detail.tags || [],
      is_pinned: detail.is_pinned, is_public: detail.is_public,
      is_published: detail.is_published, publish_time: detail.publish_time,
      extra: normalizedMeta,
    };
    contentJson.value = detail.content_json || null;
    contentHtml.value = detail.content_html || '';
    haloMeta.value = normalizedMeta;
  } catch (err) {
    message.error("加载文章失败");
  }
}

async function handleSave(publishNow: boolean, goBack: boolean = true) {
  if (!formData.value.title?.trim()) { return message.warning('请填写标题'); }
  if (!formData.value.slug?.trim()) { return message.warning('请填写 slug'); }

  try {
    const submitData: CreateGkContentParams = {
      ...formData.value,
      is_published: publishNow || formData.value.is_published,
      content_json: contentJson.value || undefined,
      content_html: contentHtml.value,
      extra: buildHaloExtra(),
      slug: formData.value.slug.trim(),
      title: formData.value.title.trim(),
    };

    if (contentId) {
      await updateGkContentApi(contentId, submitData);
    } else {
      await createGkContentApi(submitData);
    }

    message.success(publishNow ? '发布成功' : '保存草稿成功');
    if (goBack) {
      router.back();
    }
  } catch(e) {
    console.error(e);
  }
}

function getPopupContainer(triggerNode: HTMLElement) { return triggerNode.parentElement ?? document.body; }
function addTag() {
  const tag = tagInput.value.trim();
  if (tag && !formData.value.tags?.includes(tag)) {
    formData.value.tags = [...(formData.value.tags || []), tag];
  }
  tagInput.value = '';
}
function removeTag(tag: string) {
  formData.value.tags = formData.value.tags?.filter((item: string) => item !== tag) || [];
}

function handleGenerateSlug() {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const len = 16;
  formData.value.slug = Array.from(new Uint32Array(len), (val) => charset[val % charset.length]).join('');
  message.success('已自动生成 slug');
}

const previewUrl = ref('');
async function handlePreview() {
  if (!formData.value.slug?.trim()) {
    message.warning('请先填写 Slug 才能预览前台页面');
    return;
  }
  // 预览前进行静默打快照保存，保障 C 端能实时拉到刚改的数据而不退出编辑状态
  await handleSave(false, false);
  
  // 指向当前跑着的 Nuxt 项目
  const cEndDomain = 'http://localhost:3000';
  previewUrl.value = `${cEndDomain}/content/${formData.value.slug}`;
  previewVisible.value = true;
}

// ================= 提取动态大纲 (基于 Tiptap JSON 构建) =================
const tocItems = computed(() => {
  const items: Array<{level: number, title: string}> = [];
  if (!contentJson.value) return items;

  function traverse(node: any) {
    if (node.type === 'heading') {
      const level = node.attrs?.level || 1;
      let text = '';
      if (Array.isArray(node.content)) {
        text = node.content.map((c: any) => c.text || '').join('');
      }
      if (text.trim()) {
        items.push({ level, title: text });
      }
    }
    if (Array.isArray(node.content)) {
      node.content.forEach(traverse);
    }
  }

  traverse(contentJson.value);
  return items;
});

onMounted(async () => {
  await loadDetail();
});
</script>

<template>
  <Page auto-content-height disable-content-margin>
    <!-- 顶栏：返回 + 标题输入 + 操作按钮 -->
    <div class="editor-header">
      <div class="header-left">
        <AButton type="text" @click="router.back()">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
        </AButton>
        <input
          v-model="formData.title"
          class="header-title-input"
          :placeholder="isEdit ? '修改标题...' : '输入文章标题...'"
        />
      </div>
      <div class="header-right">
        <AButton @click="handlePreview" class="flex items-center gap-1 font-medium text-gray-600">
          <template #icon><EyeOutlined class="text-lg" /></template>
          预览
        </AButton>
        <AButton @click="handleSave(false)">保存草稿</AButton>
        <AButton type="primary" @click="handleSave(true)">发布</AButton>
      </div>
    </div>

    <!-- 编辑区：用 calc 硬算高度，跟 Halo 一样 -->
    <div class="editor-body">
      <div class="editor-content-area">
        <HaloEditorWrapper
          height="100%"
          class="editor-wrapper-full"
          v-model="contentHtml"
          v-model:jsonValue="contentJson"
        />
      </div>

      <!-- 侧栏 -->
      <div class="editor-sidebar">
        <AForm layout="vertical">
          <!-- 将大纲模块提前，放到发布设置前面 -->
          <ACard size="small" title="目录与大纲" class="sidebar-card">
            <AFormItem label="启用 TOC" class="mb-3">
              <Switch v-model:checked="haloMeta.enable_toc" />
            </AFormItem>
            <AFormItem v-if="haloMeta.enable_toc" label="自动提取深度" class="mb-3">
              <InputNumber class="w-full" v-model:value="haloMeta.toc_depth" :min="0" :max="6" />
            </AFormItem>

            <!-- 动态大纲视图 -->
            <div class="mt-4 border-t pt-3" v-if="tocItems.length > 0">
              <div class="text-xs text-gray-500 mb-2 font-medium">文章大纲 (实时同步)</div>
              <ul class="m-0 p-0 list-none text-sm max-h-[300px] overflow-y-auto">
                <li
                  v-for="(item, index) in tocItems"
                  :key="index"
                  class="text-gray-600 truncate py-1 hover:text-blue-500 transition-colors"
                  :style="{ paddingLeft: (item.level - 1) * 12 + 'px' }"
                >
                  <span class="opacity-40 mr-1 text-xs">H{{item.level}}</span> {{ item.title }}
                </li>
              </ul>
            </div>
            <div v-else class="mt-4 pt-3 border-t text-xs text-center text-gray-400">
              编辑器内暂无标题
            </div>
          </ACard>

          <ACard size="small" title="发布设置" class="sidebar-card">
            <AFormItem label="公开发布" class="mb-3">
              <Switch v-model:checked="formData.is_published" />
            </AFormItem>
            <AFormItem label="置顶" class="mb-3">
              <Switch v-model:checked="formData.is_pinned" />
            </AFormItem>
            <AFormItem label="允许评论" class="mb-3">
              <Switch v-model:checked="haloMeta.enable_comment" />
            </AFormItem>
            <AFormItem label="发布时间" class="mb-0">
              <DatePicker
                class="w-full"
                v-model:value="formData.publish_time"
                show-time
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DDTHH:mm:ss"
              />
            </AFormItem>
          </ACard>

          <ACard size="small" title="分类与标签" class="sidebar-card">
            <AFormItem label="分类" class="mb-3">
              <CategoryTreeSelect
                v-model:value="formData.category_id"
                appCode="youanshang"
                class="w-full"
              />
            </AFormItem>
            <AFormItem label="Slug" class="mb-3">
              <div class="flex gap-2 w-full">
                <Input v-model:value="formData.slug" placeholder="slug" />
                <AButton @click.stop="handleGenerateSlug">生成</AButton>
              </div>
            </AFormItem>
            <AFormItem label="标签" class="mb-0">
              <div class="tag-editor">
                <span v-for="tag in formData.tags" :key="tag" class="tag-item">
                  {{ tag }}
                  <span class="tag-remove" @click="removeTag(tag)">×</span>
                </span>
                <input
                  v-model="tagInput"
                  class="tag-input"
                  placeholder="回车添加"
                  @keydown.enter.prevent="addTag"
                />
              </div>
            </AFormItem>
          </ACard>

          <ACard size="small" title="SEO" class="sidebar-card">
            <AFormItem label="封面图" class="mb-3">
              <Input v-model:value="formData.cover_image" placeholder="图片链接" allow-clear />
            </AFormItem>
            <AFormItem label="摘要" class="mb-0">
              <Input.TextArea v-model:value="formData.summary" :rows="3" placeholder="文章摘要..." />
            </AFormItem>
          </ACard>


        </AForm>
      </div>
    </div>

    <!-- 预览弹窗：真实 C 端 IFrame 双级联调 -->
    <Modal
      v-model:open="previewVisible"
      :title="formData.title || '文章前端真机联调预览'"
      width="1300px"
      :footer="null"
      :destroyOnClose="true"
    >
      <div style="height: 80vh; width: 100%; border-radius: 8px; overflow: hidden; background: #fff;">
        <div v-if="!previewUrl" class="h-full flex items-center justify-center text-gray-400">
          加载中...
        </div>
        <iframe 
          v-else 
          :src="previewUrl" 
          frameborder="0" 
          style="width:100%; height:100%;"
        ></iframe>
      </div>
    </Modal>
  </Page>
</template>

<style scoped>
/* ===== 顶栏 ===== */
.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}
.header-title-input {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  border: none;
  outline: none;
  background: transparent;
  min-width: 0;
}
.header-title-input::placeholder {
  color: #bfbfbf;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* ===== 编辑区主体：Halo 同款 calc 硬算 ===== */
.editor-body {
  display: flex;
  height: calc(100vh - 52px - 48px); /* 52px顶栏 + 48px Vben框架顶部tab栏 */
  background: #fafafa;
}

.editor-content-area {
  flex: 1;
  min-width: 0;
  background: #fff;
}

.editor-wrapper-full {
  height: 100% !important;
  border: none !important;
  border-radius: 0 !important;
}
.editor-wrapper-full :deep(.legacy-halo-bridge) {
  height: 100% !important;
  border: none !important;
  border-radius: 0 !important;
}

/* ===== 侧栏 ===== */
.editor-sidebar {
  width: 300px;
  flex-shrink: 0;
  overflow-y: auto;
  padding: 16px;
  border-left: 1px solid #f0f0f0;
  background: #fff;
}
.sidebar-card {
  margin-bottom: 12px;
}

/* ===== 标签编辑器 ===== */
.tag-editor {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  min-height: 32px;
  padding: 4px 8px;
  background: #fafafa;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
}
.tag-item {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 1px 6px;
  font-size: 12px;
  color: #1677ff;
  background: #e6f4ff;
  border: 1px solid #91caff;
  border-radius: 4px;
}
.tag-remove { cursor: pointer; opacity: 0.6; }
.tag-remove:hover { opacity: 1; }
.tag-input {
  flex: 1;
  min-width: 60px;
  font-size: 13px;
  outline: none;
  background: transparent;
  border: none;
}


</style>

