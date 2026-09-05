<script lang="ts" setup>
import type { AIImageItem, UnifiedMediaData } from '#/api';

import { reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Alert as AAlert,
  Avatar as AAvatar,
  Button as AButton,
  Card as ACard,
  Col as ACol,
  Empty as AEmpty,
  Image as AImage,
  Input as AInput,
  Row as ARow,
  Select as ASelect,
  Space as ASpace,
  Spin as ASpin,
  Statistic as AStatistic,
  Tabs as ATabs,
  Tag as ATag,
  TypographyParagraph as ATypographyParagraph,
  message,
} from 'ant-design-vue';

import { generateImageApi, parseMediaApi, recreateMediaApi } from '#/api';

// ----------------- 状态定义 -----------------
const parseInput = ref('');
const parseLoading = ref(false);
const mediaData = ref<null | UnifiedMediaData>(null);

// 选定的参考图状态
const selectedRefImage = ref('');
const selectedRefIndex = ref<null | number>(null);

// AI 生图状态
const activeTab = ref<'free' | 'recreate'>('recreate');
const genLoading = ref(false);
const generatedImages = ref<AIImageItem[]>([]);
const generatedPrompt = ref('');
const activeProviderName = ref('');
const genElapsedSeconds = ref(0);

// 一键二创配置
const recreateForm = reactive({
  custom_prompt: '',
  style: undefined as string | undefined,
  model: 'gpt-image-2',
  size: '1024x1792',
});

// 自由生图配置
const freeForm = reactive({
  prompt: '',
  model: 'gpt-image-2',
  size: '1024x1792',
  quality: 'standard',
});

// 教育笔记【内容图】专属风格预设
const stylePresets = [
  {
    label: '🚫 无风格预设 (自由创作·仅依据自定义要求与原笔记)',
    value: '',
  },
  {
    label: '📖 笔记本实拍翻页感 (排版清晰·真实纸质质感)',
    value:
      '高清真实的备考笔记本内页实拍质感，淡色网格背景，黑色与蓝色钢笔字迹排版，重点部分有黄色荧光笔轻微高亮，清爽无杂乱，专业学生笔记质感',
  },
  {
    label: '📋 考点对照与分栏表格图 (结构对比·一目了然)',
    value:
      '专业教育讲义正文分栏排版风格，左右双栏对比，清晰的知识点表格架构，黑灰红三色重点标注，平面设计排版感，清晰整洁',
  },
  {
    label: '🗂️ 极简白底高清讲义风 (黑白红三色·考点突出)',
    value:
      '干净纯白背景的高清教研讲义排版风格，段落分明，留白充裕，搭配简洁的章节小图标与警示线，现代极简出版物视觉质感',
  },
  {
    label: '📝 错题重难点逐题解析卡 (题干+解析+名师提示)',
    value:
      '教育错题与典型例题深度解析卡片风格，题干区搭配答案解析折叠框，边角有便签纸名师划重点提示，结构逻辑极其清晰',
  },
  {
    label: '🧩 知识体系递进流程图 (步骤递进·逻辑严密)',
    value:
      '知识点步骤递进流程图风格，清晰的1-2-3圆形数字标牌与线条连接，扁平简约设计，层级分明，视觉引导流畅',
  },
  {
    label: '🌿 极简莫兰迪护眼笔记图 (护眼底色·自律学习)',
    value:
      '温润舒适的莫兰迪低饱和色系笔记内页，干净柔和，段落规整，极简知识点摘要排版，治愈系自律学习博主质感',
  },
  {
    label: '📒 小红书爆款大字报封面 (大面积留白·首图专用)',
    value:
      '小红书爆款教育大字报封面风格，明快高饱和几何色块，中间留出超大面积干净的留白区域供文字排版叠加，搭配醒目的划线重点框',
  },
];

// 尺寸预设
const sizeOptions = [
  { label: '9:16 竖屏 (1024x1792) - 适合小红书/抖音图文', value: '1024x1792' },
  { label: '3:4 竖屏 (1200x1600) - 小红书经典画幅', value: '1200x1600' },
  { label: '1:1 正方形 (1024x1024) - 通用方形插图', value: '1024x1024' },
  { label: '16:9 横屏 (1792x1024) - 课件/文章宽幅插图', value: '1792x1024' },
];

// 模型预设（锁定智画创专属生图模型）
const modelOptions = [
  { label: '智画创专属 (gpt-image-2)', value: 'gpt-image-2' },
];

// ----------------- 交互逻辑 -----------------

// 解析作品
async function handleParse() {
  if (!parseInput.value.trim()) {
    message.warning('请先粘贴小红书或抖音分享链接或文本');
    return;
  }
  parseLoading.value = true;
  try {
    const res = await parseMediaApi({ url_or_text: parseInput.value });
    mediaData.value = res;
    message.success('作品解析成功！');

    // 默认自动将第 1 张图片设为参考图
    if (res.images?.length) {
      selectedRefImage.value = res.images[0];
      selectedRefIndex.value = 1;
    } else {
      selectedRefImage.value = '';
      selectedRefIndex.value = null;
    }

    // 带入自由生图的提示词
    if (!freeForm.prompt) {
      freeForm.prompt =
        (res.title ? `${res.title} ` : '') + (res.content || '');
    }
  } catch (error: any) {
    message.error(error?.message || '解析失败，请检查链接或网络');
  } finally {
    parseLoading.value = false;
  }
}

// 设为生图参考图
function selectAsReference(imgUrl: string, idx: number) {
  selectedRefImage.value = imgUrl;
  selectedRefIndex.value = idx + 1;
  message.success(`已成功将第 ${idx + 1} 张图片设为二创参考图！`);
}

// 清除参考图
function clearReference() {
  selectedRefImage.value = '';
  selectedRefIndex.value = null;
  message.info('已清除参考图设置');
}

// 快速填入示例链接
function fillSample(type: 'douyin' | 'xhs') {
  if (type === 'xhs') {
    parseInput.value =
      'https://www.xiaohongshu.com/explore/6a78a26b0000000022032674';
  } else {
    parseInput.value =
      '7.92 复制打开抖音，看看【xxx】的作品 https://v.douyin.com/iAN9abcd/';
  }
}

// 复制文本
function copyToClipboard(text: string, tip = '复制成功') {
  if (!text) return;
  navigator.clipboard
    .writeText(text)
    .then(() => {
      message.success(tip);
    })
    .catch(() => {
      message.error('复制失败，请手动选择复制');
    });
}

// 下载图片
function downloadImage(url: string, filename = 'image.png') {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.target = '_blank';
  document.body.append(a);
  a.click();
  a.remove();
}

// 一键二创流水线
async function handleOneClickRecreate() {
  if (!parseInput.value.trim()) {
    message.warning('请先输入要二创的笔记作品链接');
    return;
  }
  genLoading.value = true;
  try {
    const res = await recreateMediaApi({
      url_or_text: parseInput.value,
      prompt_style: recreateForm.style || undefined,
      custom_prompt: recreateForm.custom_prompt || undefined,
      model: recreateForm.model,
      size: recreateForm.size,
      reference_image_url: selectedRefImage.value || undefined,
    });
    mediaData.value = res.original_media;
    generatedImages.value = res.generated_images.map((url) => ({ url }));
    generatedPrompt.value = res.generated_prompt;
    activeProviderName.value = res.provider_name;
    genElapsedSeconds.value = res.elapsed_seconds;
    message.success(
      `二创生图成功！由 [${res.provider_name}] 提供服务，耗时 ${res.elapsed_seconds}s`,
    );
  } catch (error: any) {
    message.error(error?.message || '二创失败，中转站生图异常');
  } finally {
    genLoading.value = false;
  }
}

// 自由生图
async function handleFreeGenerate() {
  if (!freeForm.prompt.trim()) {
    message.warning('请输入画面提示词');
    return;
  }
  genLoading.value = true;
  try {
    const res = await generateImageApi({
      prompt: freeForm.prompt,
      model: freeForm.model,
      size: freeForm.size,
      quality: freeForm.quality,
      image_url: selectedRefImage.value || undefined,
      n: 1,
    });
    generatedImages.value = res.images;
    generatedPrompt.value = freeForm.prompt;
    activeProviderName.value = res.provider_name;
    genElapsedSeconds.value = res.elapsed_seconds;
    message.success(
      `生图成功！由 [${res.provider_name}] 提供服务，耗时 ${res.elapsed_seconds}s`,
    );
  } catch (error: any) {
    message.error(error?.message || '生图失败，中转站响应异常');
  } finally {
    genLoading.value = false;
  }
}
</script>

<template>
  <Page auto-content-height content-class="p-3 h-full overflow-hidden">
    <ARow :gutter="[16, 16]" class="h-full">
      <!-- ================= 左侧：平台笔记解析看板 ================= -->
      <ACol :lg="12" :span="24" class="h-full">
        <ACard
          :bordered="false"
          class="studio-card shadow-sm"
          title="🔍 笔记作品解析"
        >
          <template #extra>
            <ASpace>
              <AButton size="small" type="link" @click="fillSample('xhs')">
                填入小红书示例
              </AButton>
              <AButton size="small" type="link" @click="fillSample('douyin')">
                填入抖音示例
              </AButton>
            </ASpace>
          </template>

          <!-- 链接输入区 -->
          <div class="mb-4">
            <AInput.TextArea
              v-model:value="parseInput"
              :auto-size="{ minRows: 2, maxRows: 4 }"
              allow-clear
              placeholder="请粘贴小红书或抖音笔记链接，支持直接粘贴APP中复制的整段文案..."
            />
            <div class="mt-3 flex justify-end gap-2">
              <AButton :disabled="!parseInput" @click="parseInput = ''">
                清空
              </AButton>
              <AButton
                :loading="parseLoading"
                type="primary"
                @click="handleParse"
              >
                🚀 开始解析笔记
              </AButton>
            </div>
          </div>

          <!-- 解析状态与结果 -->
          <ASpin :spinning="parseLoading">
            <div v-if="mediaData" class="space-y-4">
              <!-- 作者与平台标识 -->
              <div
                class="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
              >
                <div class="flex items-center gap-3">
                  <AAvatar :size="48" :src="mediaData.author?.avatar">
                    {{ mediaData.author?.name?.slice(0, 1) || '作' }}
                  </AAvatar>
                  <div>
                    <div class="text-base font-semibold">
                      {{ mediaData.author?.name || '匿名创作者' }}
                    </div>
                    <div
                      class="flex items-center gap-2 pt-1 text-xs text-gray-500"
                    >
                      <ATag
                        :color="
                          mediaData.platform === 'xhs' ? 'magenta' : 'volcano'
                        "
                      >
                        {{ mediaData.platform === 'xhs' ? '小红书' : '抖音' }}
                      </ATag>
                      <ATag color="blue">
                        {{
                          mediaData.media_type === 'video'
                            ? '短视频'
                            : '图文笔记'
                        }}
                      </ATag>
                    </div>
                  </div>
                </div>
                <div v-if="mediaData.stats" class="flex gap-4 pr-2 text-center">
                  <AStatistic
                    :value="mediaData.stats.like_count ?? 0"
                    title="获赞"
                  />
                  <AStatistic
                    :value="mediaData.stats.collect_count ?? 0"
                    title="收藏"
                  />
                  <AStatistic
                    :value="mediaData.stats.comment_count ?? 0"
                    title="评论"
                  />
                </div>
              </div>

              <!-- 作品标题与文案 -->
              <ACard size="small" title="📝 笔记文案内容">
                <template #extra>
                  <AButton
                    size="small"
                    type="link"
                    @click="copyToClipboard(mediaData.content, '文案已复制')"
                  >
                    复制全文
                  </AButton>
                </template>
                <div
                  v-if="mediaData.title"
                  class="mb-2 text-sm font-bold text-gray-800 dark:text-gray-100"
                >
                  {{ mediaData.title }}
                </div>
                <ATypographyParagraph
                  :ellipsis="{ rows: 4, expandable: true, symbol: '展开全文' }"
                  class="text-xs text-gray-600 dark:text-gray-300"
                >
                  {{ mediaData.content }}
                </ATypographyParagraph>
                <!-- 话题标签 -->
                <div
                  v-if="mediaData.tags?.length"
                  class="mt-2 flex flex-wrap gap-1"
                >
                  <ATag
                    v-for="tag in mediaData.tags"
                    :key="tag"
                    color="processing"
                  >
                    #{{ tag }}
                  </ATag>
                </div>
              </ACard>

              <!-- 媒体展示：图文图集 (支持直接选定某张作为参考图) -->
              <div v-if="mediaData.images?.length" class="space-y-2">
                <div
                  class="flex items-center justify-between text-sm font-medium"
                >
                  <span
                    >🖼️ 原笔记内容图片 (共
                    {{ mediaData.images.length }} 张)</span
                  >
                  <span
                    class="text-xs text-amber-600 dark:text-amber-400 font-normal"
                  >
                    💡 点击下方「选为参考图」可直接以此图版式进行二创
                  </span>
                </div>
                <AImage.PreviewGroup>
                  <div class="grid grid-cols-3 gap-2.5">
                    <div
                      v-for="(imgUrl, idx) in mediaData.images"
                      :key="idx"
                      class="group relative overflow-hidden rounded-md border transition-all"
                      :class="[
                        selectedRefImage === imgUrl
                          ? 'border-2 border-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-900'
                          : 'border-gray-200 dark:border-gray-700',
                      ]"
                    >
                      <!-- 选定参考图徽标 -->
                      <div
                        v-if="selectedRefImage === imgUrl"
                        class="absolute left-1 top-1 z-10 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow"
                      >
                        ✓ 当前参考图
                      </div>

                      <AImage
                        :src="imgUrl"
                        class="aspect-[3/4] h-full w-full object-cover"
                      />

                      <!-- 悬浮操作浮层 -->
                      <div
                        class="absolute bottom-0 left-0 right-0 flex flex-col gap-1 bg-black/75 p-1.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <AButton
                          block
                          size="small"
                          :type="
                            selectedRefImage === imgUrl ? 'primary' : 'default'
                          "
                          class="!text-[11px] !h-6"
                          @click.stop="selectAsReference(imgUrl, idx)"
                        >
                          {{
                            selectedRefImage === imgUrl
                              ? '✓ 已选为参考图'
                              : '📌 选为参考图'
                          }}
                        </AButton>
                        <div
                          class="flex justify-between px-1 text-[11px] text-gray-300"
                        >
                          <span
                            class="cursor-pointer hover:text-white"
                            @click="copyToClipboard(imgUrl, '图片直链已复制')"
                            >复制链接</span
                          >
                          <span
                            class="cursor-pointer hover:text-white"
                            @click="
                              downloadImage(imgUrl, `note_img_${idx + 1}.jpg`)
                            "
                            >下载原图</span
                          >
                        </div>
                      </div>
                    </div>
                  </div>
                </AImage.PreviewGroup>
              </div>

              <!-- 媒体展示：短视频 -->
              <div v-if="mediaData.video_url" class="space-y-2">
                <div class="text-sm font-medium">🎬 无水印视频源</div>
                <div
                  class="rounded-lg border border-gray-100 bg-black/5 p-3 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div class="flex items-center justify-between">
                    <span class="truncate pr-4 text-xs text-gray-500">{{
                      mediaData.video_url
                    }}</span>
                    <ASpace>
                      <AButton
                        size="small"
                        type="link"
                        @click="
                          copyToClipboard(mediaData.video_url, '视频链接已复制')
                        "
                      >
                        复制直链
                      </AButton>
                      <a :href="mediaData.video_url" target="_blank">
                        <AButton size="small" type="primary"
                          >在新窗口播放/下载</AButton
                        >
                      </a>
                    </ASpace>
                  </div>
                </div>
              </div>
            </div>

            <!-- 空状态提示 -->
            <div v-else class="py-12">
              <AEmpty
                description="在上方粘贴同行笔记链接，提取无水印内容图片并作为二创底图"
              />
            </div>
          </ASpin>
        </ACard>
      </ACol>

      <!-- ================= 右侧：教育内容图 AI 二创工坊 ================= -->
      <ACol :lg="12" :span="24" class="h-full">
        <ACard
          :bordered="false"
          class="studio-card shadow-sm"
          title="📚 教育内容图 AI 二创工坊（智画创专属通道）"
        >
          <!-- 参考图挂载展示卡片 -->
          <div
            class="mb-4 rounded-lg border border-gray-200 bg-slate-50 p-3 dark:border-gray-700 dark:bg-gray-800"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <span class="text-xs font-bold text-gray-700 dark:text-gray-200"
                  >🖼️ 绑定二创参考图：</span
                >
                <span
                  v-if="selectedRefImage"
                  class="text-xs text-emerald-600 dark:text-emerald-400 font-medium"
                >
                  已关联原笔记【第 {{ selectedRefIndex }} 张】作为构图参考垫图
                </span>
                <span v-else class="text-xs text-gray-400">
                  (未指定参考图，可在左侧图片上点击「选为参考图」，或在下方输入自定义图片
                  URL)
                </span>
              </div>
              <AButton
                v-if="selectedRefImage"
                danger
                size="small"
                type="link"
                @click="clearReference"
              >
                取消参考图
              </AButton>
            </div>

            <!-- 参考图预览与输入条 -->
            <div v-if="selectedRefImage" class="mt-2.5 flex items-center gap-3">
              <AImage
                :height="60"
                :src="selectedRefImage"
                :width="60"
                class="rounded border border-gray-300 object-cover"
              />
              <div class="flex-1 overflow-hidden">
                <div class="truncate text-xs text-gray-500">
                  {{ selectedRefImage }}
                </div>
                <div class="text-[11px] text-gray-400 pt-0.5">
                  ✨ AI 将严格参照此图的排版布局与知识逻辑结构进行重绘二创
                </div>
              </div>
            </div>

            <!-- 自定义参考图输入 -->
            <div v-else class="mt-2 flex gap-2">
              <AInput
                v-model:value="selectedRefImage"
                placeholder="或粘贴自定义参考图外链 URL (http://...)"
                size="small"
              />
              <AButton
                size="small"
                type="dashed"
                :disabled="!selectedRefImage"
                @click="
                  selectedRefIndex = 0;
                  message.success('自定义参考图已锁定');
                "
              >
                锁定参考图
              </AButton>
            </div>
          </div>

          <ATabs v-model:active-key="activeTab">
            <!-- 模式一：一键二创 -->
            <ATabs.TabPane key="recreate" tab="⚡ 一键笔记内容图二创">
              <div class="space-y-4">
                <AAlert
                  message="内容图二创模式：融合原笔记知识点与参考图版式，生成专用于教育笔记正文的高清知识卡片、对比图或解析插图。"
                  show-icon
                  type="info"
                />

                <!-- 自定义提示词输入 -->
                <div>
                  <div class="mb-1 flex items-center justify-between">
                    <label
                      class="text-xs font-semibold text-gray-700 dark:text-gray-200"
                    >
                      自定义二创提示词 / 补充要求 (可选)
                    </label>
                    <AButton
                      v-if="mediaData?.content"
                      size="small"
                      type="link"
                      @click="
                        recreateForm.custom_prompt =
                          (mediaData.title ? `${mediaData.title} ` : '') +
                          mediaData.content
                      "
                    >
                      带入左侧笔记文案
                    </AButton>
                  </div>
                  <AInput.TextArea
                    v-model:value="recreateForm.custom_prompt"
                    :auto-size="{ minRows: 2, maxRows: 4 }"
                    allow-clear
                    placeholder="可输入具体二创重绘要求，例如：重点突出考点2与考点3的对比，增加手绘红笔批注，版式左右分栏，右侧留出错题解析框..."
                  />
                </div>

                <!-- 视觉风格预设 (可选) -->
                <div>
                  <div class="mb-1 flex items-center justify-between">
                    <label
                      class="text-xs font-semibold text-gray-700 dark:text-gray-200"
                    >
                      内容图视觉风格预设 (可选，可留空)
                    </label>
                    <span
                      v-if="!recreateForm.style"
                      class="text-[11px] text-gray-400"
                      >当前：不使用预设风格</span
                    >
                  </div>
                  <ASelect
                    v-model:value="recreateForm.style"
                    :options="stylePresets"
                    allow-clear
                    class="w-full"
                    placeholder="可留空，或选择特定风格模板"
                  />
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      class="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-200"
                      >画面尺寸/比例</label
                    >
                    <ASelect
                      v-model:value="recreateForm.size"
                      :options="sizeOptions"
                      class="w-full"
                    />
                  </div>
                  <div>
                    <label
                      class="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-200"
                      >生图模型</label
                    >
                    <ASelect
                      v-model:value="recreateForm.model"
                      :options="modelOptions"
                      class="w-full"
                    />
                  </div>
                </div>

                <div class="pt-2">
                  <AButton
                    :disabled="!parseInput && !selectedRefImage"
                    :loading="genLoading"
                    block
                    size="large"
                    type="primary"
                    @click="handleOneClickRecreate"
                  >
                    ✨ 一键生成二创内容图
                  </AButton>
                </div>
              </div>
            </ATabs.TabPane>

            <!-- 模式二：自由生图 -->
            <ATabs.TabPane key="free" tab="🖌️ 自由灵感生图">
              <div class="space-y-4">
                <div>
                  <div class="mb-1 flex items-center justify-between">
                    <label
                      class="text-xs font-semibold text-gray-700 dark:text-gray-200"
                      >生图提示词 (Prompt)</label
                    >
                    <AButton
                      v-if="mediaData?.content"
                      size="small"
                      type="link"
                      @click="
                        freeForm.prompt =
                          (mediaData.title ? `${mediaData.title} ` : '') +
                          mediaData.content
                      "
                    >
                      带入左侧笔记文案
                    </AButton>
                  </div>
                  <AInput.TextArea
                    v-model:value="freeForm.prompt"
                    :auto-size="{ minRows: 3, maxRows: 5 }"
                    placeholder="输入教育笔记内容图构图描述，例如：清晰的知识点对比图，左右双栏结构，黑白红三色重点突出，纸质笔记本质感..."
                  />
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      class="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-200"
                      >画面尺寸</label
                    >
                    <ASelect
                      v-model:value="freeForm.size"
                      :options="sizeOptions"
                      class="w-full"
                    />
                  </div>
                  <div>
                    <label
                      class="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-200"
                      >生图模型</label
                    >
                    <ASelect
                      v-model:value="freeForm.model"
                      :options="modelOptions"
                      class="w-full"
                    />
                  </div>
                </div>

                <div class="pt-2">
                  <AButton
                    :disabled="!freeForm.prompt.trim()"
                    :loading="genLoading"
                    block
                    size="large"
                    type="primary"
                    @click="handleFreeGenerate"
                  >
                    🎨 立即生成图片
                  </AButton>
                </div>
              </div>
            </ATabs.TabPane>
          </ATabs>

          <!-- 统一生图结果画廊展示区 -->
          <div class="mt-6 border-t border-gray-100 pt-4 dark:border-gray-700">
            <div class="mb-3 flex items-center justify-between">
              <span class="text-sm font-bold">🖼️ 二创出图结果</span>
              <span
                v-if="activeProviderName"
                class="text-xs text-emerald-600 dark:text-emerald-400"
              >
                已由服务节点 [{{ activeProviderName }}] 产出 · 耗时
                {{ genElapsedSeconds }}s
              </span>
            </div>

            <ASpin
              :spinning="genLoading"
              tip="AI 正在参考原图版式进行构图渲染，请稍候..."
            >
              <div v-if="generatedImages.length > 0" class="space-y-4">
                <!-- 生成的提示词展示 -->
                <div
                  v-if="generatedPrompt"
                  class="rounded bg-gray-50 p-2.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                >
                  <span class="font-semibold">使用 Prompt: </span
                  >{{ generatedPrompt }}
                </div>

                <!-- 生成的大图展示 -->
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div
                    v-for="(item, idx) in generatedImages"
                    :key="idx"
                    class="group relative overflow-hidden rounded-lg border border-gray-200 shadow-sm dark:border-gray-700"
                  >
                    <AImage :src="item.url" class="h-72 w-full object-cover" />
                    <div class="p-2">
                      <div class="flex justify-between">
                        <AButton
                          size="small"
                          type="link"
                          @click="copyToClipboard(item.url, '图片直链已复制')"
                        >
                          复制直链
                        </AButton>
                        <AButton
                          size="small"
                          type="primary"
                          @click="
                            downloadImage(
                              item.url,
                              `ai_note_content_${idx + 1}.png`,
                            )
                          "
                        >
                          下载内容图
                        </AButton>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 尚未生成时的占位 -->
              <div v-else class="py-12">
                <AEmpty
                  description="在左侧选定参考图并点击上方按钮，开启教育内容图二创"
                />
              </div>
            </ASpin>
          </div>
        </ACard>
      </ACol>
    </ARow>
  </Page>
</template>

<style scoped>
.studio-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.studio-card :deep(.ant-card-body) {
  flex: 1;
  min-height: 0;
  padding: 16px;
  overflow-y: auto;
}

/* 精致细滚动条 */
.studio-card :deep(.ant-card-body)::-webkit-scrollbar {
  width: 6px;
}

.studio-card :deep(.ant-card-body)::-webkit-scrollbar-thumb {
  background-color: rgb(0 0 0 / 15%);
  border-radius: 4px;
}

.studio-card :deep(.ant-card-body)::-webkit-scrollbar-thumb:hover {
  background-color: rgb(0 0 0 / 28%);
}

.studio-card :deep(.ant-card-body)::-webkit-scrollbar-track {
  background-color: transparent;
}

:deep(.ant-image) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
