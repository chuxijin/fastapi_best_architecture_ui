<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */
import { computed } from 'vue';

import { getDriveTypeColor, getDriveTypeLabel } from '#/api';

import ResourceFileUploader from './ResourceFileUploader.vue';

const props = defineProps<{
  accountOptions?: ReadonlyArray<{
    cookies?: string;
    label: string;
    type?: string;
    value: number;
  }>;
  categoryTree?: any[];
  driveTypeOptions?: ReadonlyArray<any>;
  formData: any; // 使用父组件的对象以保持双向绑定
  getTempModeLabel?: (mode: null | number | undefined) => string;
  mode: 'edit' | 'view';
  onCopy?: (text: string) => Promise<void>;
  onCopyShare?: (data: any) => Promise<void>;
  onImageError?: (e: Event) => void;
  onUrlTypeChange?: (urlType: string) => void;
  // resourceTypeOptions?: Array<{ label: string; value: string }>; // 用硬编码替代
  tempModes?: Array<{ label: string; value: number }>;
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

// 硬编码资源类型选项
const resourceTypeOptions = [
  { label: '课程', value: '课程' },
  { label: '电子书', value: '电子书' },
  { label: '笔记', value: '笔记' },
  { label: '软件', value: '软件' },
  { label: '真题', value: '真题' },
  { label: '其他', value: '其他' },
];

// 处理账号变更，自动设置网盘类型
function onAccountChange(userId: number) {
  const account = props.accountOptions?.find((opt) => opt.value === userId);
  if (account && account.type) {
    props.formData.url_type = account.type;
  }
}

// 处理文件上传成功
function onUploadSuccess(result: any) {
  // 必须确保 updated formData 属性是响应式的，虽然这里直接赋值 prop 对象属性违反单向数据流，
  // 但 formData 是对象引用，Vue 中常用于表单双向绑定模式。
  if (result.local_path) props.formData.local_file_path = result.local_path;
  if (result.file_type) props.formData.file_type = result.file_type;
}
</script>

<template>
  <div class="space-y-4">
    <!-- 编辑态 -->
    <template v-if="isEdit">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">
            备注
          </label>
          <a-input
            v-model:value="formData.remark"
            placeholder="请输入备注"
            allow-clear
            class="w-full"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">
            临时处理模式
          </label>
          <a-select
            v-model:value="formData.is_temp_file"
            :options="tempModes"
            placeholder="请选择"
            class="w-full"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">
            资源链接 *
          </label>
          <a-input
            v-model:value="formData.url"
            placeholder="请输入资源链接"
            allow-clear
            class="w-full"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">
            提取码
          </label>
          <a-input
            v-model:value="formData.extract_code"
            placeholder="请输入提取码"
            allow-clear
            class="w-full"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">
            分类 *
          </label>
          <a-tree-select
            v-model:value="formData.category_id"
            :tree-data="categoryTree"
            placeholder="请选择分类"
            class="w-full"
            allow-clear
            tree-default-expand-all
            :field-names="{
              label: 'label',
              value: 'id',
              children: 'children',
            }"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">
            资源类型
          </label>
          <a-select
            v-model:value="formData.resource_type"
            :options="resourceTypeOptions"
            placeholder="请选择资源类型"
            class="w-full"
            allow-clear
          />
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">
            主要名字 *
          </label>
          <a-input
            v-model:value="formData.main_name"
            placeholder="请输入主要名字"
            allow-clear
            class="w-full"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">
            关联账号 *
          </label>
          <a-select
            v-model:value="formData.user_id"
            :options="accountOptions"
            placeholder="请选择关联账号"
            class="w-full"
            show-search
            option-filter-prop="label"
            allow-clear
            @change="onAccountChange"
          >
            <template #notFoundContent> 无可用账号数据 </template>
          </a-select>
        </div>
      </div>

      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700">
          描述
        </label>
        <a-textarea
          v-model:value="formData.description"
          :rows="3"
          placeholder="请输入描述"
          allow-clear
          class="w-full"
        />
      </div>

      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700">
          资源介绍
        </label>
        <a-textarea
          v-model:value="formData.resource_intro"
          :rows="3"
          placeholder="请输入资源介绍"
          allow-clear
          class="w-full"
        />
      </div>

      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700">
          资源图片
        </label>
        <a-input
          v-model:value="formData.resource_image"
          placeholder="请输入图片链接"
          allow-clear
          class="w-full"
        />
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">
            价格
          </label>
          <a-input-number
            v-model:value="formData.price"
            :min="0"
            :step="0.01"
            :precision="2"
            placeholder="请输入价格"
            class="w-full"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">
            建议价格
          </label>
          <a-input-number
            v-model:value="formData.suggested_price"
            :min="0"
            :step="0.01"
            :precision="2"
            placeholder="请输入建议价格"
            class="w-full"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">
            排序
          </label>
          <a-input-number
            v-model:value="formData.sort"
            :min="0"
            placeholder="请输入排序值"
            class="w-full"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">
            上传文件 (可选)
          </label>
          <ResourceFileUploader
            v-model="formData.local_file_path"
            @success="onUploadSuccess"
          />
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
              <label class="mb-1 block text-sm font-medium text-gray-700">
                主要名字
              </label>
              <p class="text-sm text-gray-900">{{ formData.main_name }}</p>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">
                标题
              </label>
              <p class="text-sm text-gray-900">{{ formData.title || '无' }}</p>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">
                分类
              </label>
              <p class="text-sm text-gray-900">
                {{ formData.category_name || formData.category_id || '无' }}
              </p>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">
                资源类型
              </label>
              <p class="text-sm text-gray-900">{{ formData.resource_type }}</p>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">
                网盘类型
              </label>
              <span
                class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                :class="driveTypeClass"
              >
                {{ driveTypeLabel }}
              </span>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">
                文件类型
              </label>
              <p class="text-sm text-gray-900">
                {{ formData.file_type || '无' }}
              </p>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">
                浏览量
              </label>
              <p class="text-sm text-gray-900">
                {{ formData.view_count || 0 }}
              </p>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">
                排序
              </label>
              <p class="text-sm text-gray-900">{{ formData.sort || 0 }}</p>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">
                过期时间
              </label>
              <p class="text-sm text-gray-900">
                {{
                  formData.expired_type === 0
                    ? '永久'
                    : formData.expired_at
                      ? new Date(formData.expired_at).toLocaleString()
                      : '-'
                }}
              </p>
            </div>
          </div>
        </div>

        <div class="rounded-lg bg-gray-50 p-4">
          <h4 class="text-md mb-4 font-semibold">链接信息</h4>
          <div class="space-y-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">
                资源链接
              </label>
              <div class="flex items-center space-x-2">
                <p
                  class="flex-1 break-all rounded border bg-white p-2 text-sm text-gray-900"
                >
                  {{ formData.url }}
                </p>
                <a-button
                  type="primary"
                  size="small"
                  @click="onCopy && onCopy(formData.url)"
                >
                  复制
                </a-button>
              </div>
            </div>

            <div v-if="formData.local_file_path">
              <label class="mb-1 block text-sm font-medium text-gray-700">
                本地文件路径
              </label>
              <p
                class="break-all rounded border bg-white p-2 text-sm text-gray-900"
              >
                {{ formData.local_file_path }}
              </p>
            </div>

            <div v-if="formData.extract_code">
              <label class="mb-1 block text-sm font-medium text-gray-700">
                提取码
              </label>
              <div class="flex items-center space-x-2">
                <p class="rounded border bg-white p-2 text-sm text-gray-900">
                  {{ formData.extract_code }}
                </p>
                <a-button
                  type="primary"
                  size="small"
                  @click="onCopy && onCopy(formData.extract_code)"
                >
                  复制
                </a-button>
                <a-button
                  type="default"
                  size="small"
                  class="bg-green-500 text-white"
                  @click="onCopyShare && onCopyShare(formData)"
                >
                  复制完整分享
                </a-button>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-lg bg-gray-50 p-4">
          <h4 class="text-md mb-4 font-semibold">详细信息</h4>
          <div class="space-y-4">
            <div v-if="formData.description">
              <label class="mb-1 block text-sm font-medium text-gray-700">
                描述
              </label>
              <p
                class="whitespace-pre-wrap rounded border bg-white p-3 text-sm text-gray-900"
              >
                {{ formData.description }}
              </p>
            </div>
            <div v-if="formData.resource_intro">
              <label class="mb-1 block text-sm font-medium text-gray-700">
                资源介绍
              </label>
              <p
                class="whitespace-pre-wrap rounded border bg-white p-3 text-sm text-gray-900"
              >
                {{ formData.resource_intro }}
              </p>
            </div>
            <div v-if="formData.resource_image">
              <label class="mb-1 block text-sm font-medium text-gray-700">
                资源图片
              </label>
              <img
                :src="formData.resource_image"
                alt="资源图片"
                class="max-w-xs rounded-lg border"
                @error="onImageError"
              />
            </div>
            <div v-if="formData.remark">
              <label class="mb-1 block text-sm font-medium text-gray-700">
                备注
              </label>
              <p
                class="whitespace-pre-wrap rounded border bg-white p-3 text-sm text-gray-900"
              >
                {{ formData.remark }}
              </p>
            </div>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700">
                  临时处理模式
                </label>
                <p class="text-sm text-gray-900">
                  {{
                    getTempModeLabel
                      ? getTempModeLabel(formData.is_temp_file)
                      : ''
                  }}
                </p>
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700">
                  用户ID
                </label>
                <p class="text-sm text-gray-900">{{ formData.user_id }}</p>
              </div>
              <div v-if="formData.price">
                <label class="mb-1 block text-sm font-medium text-gray-700">
                  价格
                </label>
                <p class="text-sm text-gray-900">¥{{ formData.price }}</p>
              </div>
              <div v-if="formData.suggested_price">
                <label class="mb-1 block text-sm font-medium text-gray-700">
                  建议价格
                </label>
                <p class="text-sm text-gray-900">
                  ¥{{ formData.suggested_price }}
                </p>
              </div>
              <div v-if="formData.created_time">
                <label class="mb-1 block text-sm font-medium text-gray-700">
                  创建时间
                </label>
                <p class="text-sm text-gray-900">
                  {{ new Date(formData.created_time).toLocaleString() }}
                </p>
              </div>
              <div v-if="formData.updated_time">
                <label class="mb-1 block text-sm font-medium text-gray-700">
                  更新时间
                </label>
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

<style scoped>
/* 保持原有 Tailwind 类，不需要额外样式 */
</style>
