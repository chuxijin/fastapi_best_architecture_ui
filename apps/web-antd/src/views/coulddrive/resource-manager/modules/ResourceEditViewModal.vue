<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */
import { computed, defineEmits, defineProps } from 'vue';

import { getDriveTypeColor, getDriveTypeLabel } from '#/api';

const props = defineProps<{
  accountOptions?: ReadonlyArray<{
    cookies?: string;
    label: string;
    value: number;
  }>;
  domainOptions?: Array<{ label: string; value: string }>;
  driveTypeOptions?: ReadonlyArray<{ label: string; value: string }>;
  formData: any; // 使用父组件的对象以保持双向绑定
  getTempModeLabel?: (mode: null | number | undefined) => string;
  isRecognizing?: boolean;
  mode: 'edit' | 'view';
  onCopy?: (text: string) => Promise<void>;
  onCopyShare?: (data: any) => Promise<void>;
  onDomainChange?: (domain: string) => void;
  onImageError?: (e: Event) => void;
  onSmartRecognition?: () => void;
  onUrlTypeChange?: (urlType: string) => void;
  recognitionUrl?: string;
  resourceTypeOptions?: Array<{ label: string; value: string }>;
  showRecognition?: boolean;
  subjectOptions?: Array<{ label: string; value: string }>;
  tempModes?: Array<{ label: string; value: number }>;
}>();

const emit = defineEmits<{
  (e: 'update:recognitionUrl', v: string): void;
}>();

const isEdit = computed(() => props.mode === 'edit');

const driveTypeLabel = computed(() =>
  getDriveTypeLabel(props.formData?.url_type || ''),
);
const driveTypeClass = computed(() => {
  const color = getDriveTypeColor(props.formData?.url_type || '');
  if (color === 'blue') return 'bg-blue-100 text-blue-800';
  if (color === 'green') return 'bg-green-100 text-green-800';
  if (color === 'orange') return 'bg-orange-100 text-orange-800';
  return 'bg-gray-100 text-gray-800';
});

function updateRecognitionUrl(v: string) {
  emit('update:recognitionUrl', v);
}
</script>

<template>
  <div class="space-y-4">
    <!-- 编辑态 -->
    <template v-if="isEdit">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700"
            >备注</label
          >
          <input
            v-model="formData.remark"
            type="text"
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            placeholder="请输入备注"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700"
            >临时处理模式</label
          >
          <select
            v-model.number="formData.is_temp_file"
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          >
            <option
              v-for="opt in tempModes"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700"
            >资源链接 *</label
          >
          <input
            v-model="formData.url"
            type="url"
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            placeholder="请输入资源链接"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700"
            >提取码</label
          >
          <input
            v-model="formData.extract_code"
            type="text"
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            placeholder="请输入提取码"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700"
            >领域 *</label
          >
          <select
            v-model="formData.domain"
            @change="
              (e: Event) =>
                onDomainChange &&
                onDomainChange((e.target as HTMLSelectElement).value)
            "
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          >
            <option value="">请选择领域</option>
            <option
              v-for="option in domainOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700"
            >科目 *</label
          >
          <select
            v-model="formData.subject"
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            :disabled="!formData.domain"
          >
            <option value="">
              {{ formData.domain ? '请选择科目' : '请先选择领域' }}
            </option>
            <option
              v-for="option in subjectOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700"
            >主要名字 *</label
          >
          <input
            v-model="formData.main_name"
            type="text"
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            placeholder="请输入主要名字"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700"
            >资源类型</label
          >
          <select
            v-model="formData.resource_type"
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          >
            <option value="">请选择资源类型</option>
            <option
              v-for="option in resourceTypeOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700"
            >网盘类型 *</label
          >
          <select
            v-model="formData.url_type"
            @change="
              (e: Event) =>
                onUrlTypeChange &&
                onUrlTypeChange((e.target as HTMLSelectElement).value)
            "
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          >
            <option value="">请选择网盘类型</option>
            <option
              v-for="drive in driveTypeOptions"
              :key="drive.value"
              :value="drive.value"
            >
              {{ drive.label }}
            </option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700"
            >关联账号 *</label
          >
          <select
            v-model="formData.user_id"
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            :disabled="(accountOptions?.length || 0) === 0"
          >
            <option :value="null">
              {{
                (accountOptions?.length || 0) > 0
                  ? '请选择关联账号'
                  : '请先选择网盘类型'
              }}
            </option>
            <option
              v-for="account in accountOptions"
              :key="account.value"
              :value="account.value"
            >
              {{ account.label }}
            </option>
          </select>
        </div>
      </div>

      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700">描述</label>
        <textarea
          v-model="formData.description"
          rows="3"
          class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          placeholder="请输入描述"
        ></textarea>
      </div>

      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700"
          >资源介绍</label
        >
        <textarea
          v-model="formData.resource_intro"
          rows="3"
          class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          placeholder="请输入资源介绍"
        ></textarea>
      </div>

      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700"
          >资源图片</label
        >
        <input
          v-model="formData.resource_image"
          type="url"
          class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          placeholder="请输入图片链接"
        />
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700"
            >价格</label
          >
          <input
            v-model.number="formData.price"
            type="number"
            step="0.01"
            min="0"
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            placeholder="请输入价格"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700"
            >建议价格</label
          >
          <input
            v-model.number="formData.suggested_price"
            type="number"
            step="0.01"
            min="0"
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            placeholder="请输入建议价格"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700"
            >排序</label
          >
          <input
            v-model.number="formData.sort"
            type="number"
            min="0"
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            placeholder="请输入排序值"
          />
        </div>
      </div>

      <div v-if="showRecognition" class="border-t pt-4">
        <div class="space-y-3">
          <div>
            <h4 class="flex items-center text-sm font-medium text-gray-700">
              <svg
                class="mr-2 h-4 w-4 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              智能识别
            </h4>
            <p class="mt-1 text-xs text-gray-500">
              根据分享文本自动识别并填充资源信息，支持夸克网盘、百度网盘等
            </p>
          </div>

          <div class="space-y-2">
            <div class="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p class="mb-1 text-xs font-medium text-blue-700">
                📝 示例格式：
              </p>
              <p class="text-xs leading-relaxed text-blue-600">
                我用夸克网盘分享了「【20】26信号与系统」，点击链接即可保存。打开「夸克APP」，无需下载在线播放视频，畅享原画5倍速，支持电视投屏。<br />
                链接：https://pan.quark.cn/s/0a8af5b41c3c
              </p>
            </div>

            <textarea
              :value="recognitionUrl"
              @input="
                (e: Event) =>
                  updateRecognitionUrl((e.target as HTMLTextAreaElement).value)
              "
              rows="4"
              class="w-full resize-none rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="请粘贴完整的分享文本，包含资源名称和分享链接..."
            ></textarea>

            <div class="flex items-center justify-between">
              <div class="text-xs text-gray-500">
                <span class="inline-flex items-center">
                  <svg
                    class="mr-1 h-3 w-3 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  支持自动提取：资源名称、网盘类型、分享链接、提取码
                </span>
              </div>

              <button
                @click="onSmartRecognition && onSmartRecognition()"
                :disabled="isRecognizing || !recognitionUrl?.trim()"
                class="flex items-center space-x-2 rounded-lg px-4 py-2 text-white shadow-sm transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
                :style="{
                  'min-height': '40px',
                  'min-width': '120px',
                  background:
                    isRecognizing || !recognitionUrl?.trim()
                      ? '#9ca3af'
                      : 'linear-gradient(to right, #3b82f6, #2563eb)',
                }"
                @mouseenter="
                  (e) => {
                    if (!isRecognizing && recognitionUrl?.trim() && e.target) {
                      (e.target as HTMLElement).style.background =
                        'linear-gradient(to right, #2563eb, #1d4ed8)';
                    }
                  }
                "
                @mouseleave="
                  (e) => {
                    if (!isRecognizing && recognitionUrl?.trim() && e.target) {
                      (e.target as HTMLElement).style.background =
                        'linear-gradient(to right, #3b82f6, #2563eb)';
                    }
                  }
                "
              >
                <svg
                  v-if="isRecognizing"
                  class="h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <svg
                  v-else
                  class="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span>{{ isRecognizing ? '识别中...' : '开始识别' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 浏览态 -->
    <template v-else>
      <div class="space-y-6">
        <div class="rounded-lg bg-gray-50 p-4">
          <h4 class="text-md mb-4 font-semibold">基本信息</h4>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >主要名字</label
              >
              <p class="text-sm text-gray-900">{{ formData.main_name }}</p>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >标题</label
              >
              <p class="text-sm text-gray-900">{{ formData.title || '无' }}</p>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >领域</label
              >
              <p class="text-sm text-gray-900">{{ formData.domain }}</p>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >科目</label
              >
              <p class="text-sm text-gray-900">{{ formData.subject }}</p>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >资源类型</label
              >
              <p class="text-sm text-gray-900">{{ formData.resource_type }}</p>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >网盘类型</label
              >
              <span
                class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                :class="driveTypeClass"
              >
                {{ driveTypeLabel }}
              </span>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >浏览量</label
              >
              <p class="text-sm text-gray-900">
                {{ formData.view_count || 0 }}
              </p>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >排序</label
              >
              <p class="text-sm text-gray-900">{{ formData.sort || 0 }}</p>
            </div>
          </div>
        </div>

        <div class="rounded-lg bg-gray-50 p-4">
          <h4 class="text-md mb-4 font-semibold">链接信息</h4>
          <div class="space-y-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >资源链接</label
              >
              <div class="flex items-center space-x-2">
                <p
                  class="flex-1 break-all rounded border bg-white p-2 text-sm text-gray-900"
                >
                  {{ formData.url }}
                </p>
                <button
                  @click="onCopy && onCopy(formData.url)"
                  class="rounded bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600"
                >
                  复制
                </button>
              </div>
            </div>
            <div v-if="formData.extract_code">
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >提取码</label
              >
              <div class="flex items-center space-x-2">
                <p class="rounded border bg-white p-2 text-sm text-gray-900">
                  {{ formData.extract_code }}
                </p>
                <button
                  @click="onCopy && onCopy(formData.extract_code)"
                  class="rounded bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600"
                >
                  复制
                </button>
                <button
                  @click="onCopyShare && onCopyShare(formData)"
                  class="rounded bg-green-500 px-3 py-2 text-sm text-white hover:bg-green-600"
                >
                  复制完整分享
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-lg bg-gray-50 p-4">
          <h4 class="text-md mb-4 font-semibold">详细信息</h4>
          <div class="space-y-4">
            <div v-if="formData.description">
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >描述</label
              >
              <p
                class="whitespace-pre-wrap rounded border bg-white p-3 text-sm text-gray-900"
              >
                {{ formData.description }}
              </p>
            </div>
            <div v-if="formData.resource_intro">
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >资源介绍</label
              >
              <p
                class="whitespace-pre-wrap rounded border bg-white p-3 text-sm text-gray-900"
              >
                {{ formData.resource_intro }}
              </p>
            </div>
            <div v-if="formData.resource_image">
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >资源图片</label
              >
              <img
                :src="formData.resource_image"
                alt="资源图片"
                class="max-w-xs rounded-lg border"
                @error="onImageError"
              />
            </div>
            <div v-if="formData.remark">
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >备注</label
              >
              <p
                class="bg白 whitespace-pre-wrap rounded border p-3 text-sm text-gray-900"
              >
                {{ formData.remark }}
              </p>
            </div>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700"
                  >临时处理模式</label
                >
                <p class="text-sm text-gray-900">
                  {{
                    getTempModeLabel
                      ? getTempModeLabel(formData.is_temp_file)
                      : ''
                  }}
                </p>
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700"
                  >用户ID</label
                >
                <p class="text-sm text-gray-900">{{ formData.user_id }}</p>
              </div>
              <div v-if="formData.price">
                <label class="mb-1 block text-sm font-medium text-gray-700"
                  >价格</label
                >
                <p class="text-sm text-gray-900">¥{{ formData.price }}</p>
              </div>
              <div v-if="formData.suggested_price">
                <label class="mb-1 block text-sm font-medium text-gray-700"
                  >建议价格</label
                >
                <p class="text-sm text-gray-900">
                  ¥{{ formData.suggested_price }}
                </p>
              </div>
              <div v-if="formData.created_time">
                <label class="mb-1 block text-sm font-medium text-gray-700"
                  >创建时间</label
                >
                <p class="text-sm text-gray-900">
                  {{ new Date(formData.created_time).toLocaleString() }}
                </p>
              </div>
              <div v-if="formData.updated_time">
                <label class="mb-1 block text-sm font-medium text-gray-700"
                  >更新时间</label
                >
                <p class="text-sm text-gray-900">
                  {{ new Date(formData.updated_time).toLocaleString() }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped></style>
