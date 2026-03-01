<script lang="ts" setup>
import type { UploadChangeParam } from 'ant-design-vue';

import { ref, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';

import { message, UploadDragger } from 'ant-design-vue';

import { uploadGkResourceFileApi } from '#/api/gongkao';

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  categoryId: undefined,
  maxSize: 50,
  accept: '*',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

// 创建图标组件
const InboxIcon = createIconifyIcon('mdi:inbox-arrow-down');

interface Props {
  modelValue?: string;
  categoryId?: number;
  maxSize?: number; // MB
  accept?: string;
}

const fileList = ref<any[]>([]);

// 监听 modelValue 变化，回显已上传文件
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal && fileList.value.length === 0) {
      fileList.value = [
        {
          uid: '-1',
          name: newVal.split('/').pop() || '已上传文件',
          status: 'done',
          url: newVal,
        },
      ];
    } else if (!newVal) {
      fileList.value = [];
    }
  },
  { immediate: true },
);

// 上传前验证
function beforeUpload(file: File) {
  const isLtMaxSize = file.size / 1024 / 1024 < props.maxSize;
  if (!isLtMaxSize) {
    message.error(`文件大小不能超过 ${props.maxSize}MB！`);
    return false;
  }
  return true;
}

// 自定义上传处理
async function customRequest(options: any) {
  const { file, onSuccess, onError } = options;

  if (!props.categoryId) {
    message.error('请先选择分类！');
    onError(new Error('No category selected'));
    return;
  }

  try {
    const result = await uploadGkResourceFileApi(file, props.categoryId);
    emit('update:modelValue', result.url);
    onSuccess(result, file);
    message.success('上传成功');
  } catch (error: any) {
    onError(error);
    message.error('上传失败');
    console.error(error);
  }
}

// 处理文件变化
function handleChange(info: UploadChangeParam) {
  fileList.value = info.fileList;

  // 如果文件被删除
  if (info.fileList.length === 0) {
    emit('update:modelValue', '');
  }
}
</script>

<template>
  <UploadDragger
    v-model:file-list="fileList"
    name="file"
    :multiple="false"
    :max-count="1"
    :accept="accept"
    :before-upload="beforeUpload"
    :custom-request="customRequest"
    @change="handleChange"
  >
    <p class="ant-upload-drag-icon">
      <InboxIcon class="size-12 text-blue-500" />
    </p>
    <p class="ant-upload-text">点击或拖拽文件到此处上传</p>
    <p class="ant-upload-hint">支持上传预览文件（PDF、Word、Excel等）</p>
  </UploadDragger>
</template>

<style scoped>
:deep(.ant-upload-dragger) {
  padding: 16px;
}
</style>
