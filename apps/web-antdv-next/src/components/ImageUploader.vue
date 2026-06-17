<script setup lang="ts">
import { ref, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';
import { message } from 'ant-design-vue';

import { uploadImageApi } from '#/api';

interface Props {
  modelValue?: string;
  maxSize?: number; // MB
  accept?: string;
  folder?: string; // OSS 业务子目录, 如 cms/slot
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  maxSize: 5,
  accept: 'image/png,image/jpeg,image/jpg,image/gif,image/webp',
  folder: '',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const loading = ref(false);
const imageUrl = ref(props.modelValue);
const inputRef = ref<HTMLInputElement>();
const LoadingOutlined = createIconifyIcon('ant-design:loading-outlined');
const PlusOutlined = createIconifyIcon('ant-design:plus-outlined');

// 同步外部值(表单回填 / 编辑态)
watch(
  () => props.modelValue,
  (val) => {
    if (val !== imageUrl.value) {
      imageUrl.value = val || '';
    }
  },
);

function openPicker(event: MouseEvent) {
  // 阻止冒泡，避免被 Drawer/Modal 的 focus-trap 拦截默认行为
  event.stopPropagation();
  const input = inputRef.value;
  if (!input) return;
  // 优先用 showPicker(现代浏览器专为程序化打开文件框设计，不受合成事件可信度影响)
  if (typeof input.showPicker === 'function') {
    try {
      input.showPicker();
      return;
    } catch {
      // 某些环境 showPicker 受限，回退到 click
    }
  }
  input.click();
}

async function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    message.error('只能上传图片文件！');
    target.value = '';
    return;
  }
  if (file.size / 1024 / 1024 >= props.maxSize) {
    message.error(`图片大小不能超过 ${props.maxSize}MB！`);
    target.value = '';
    return;
  }

  loading.value = true;
  try {
    const url = await uploadImageApi(file, props.folder || undefined);
    imageUrl.value = url;
    emit('update:modelValue', url);
    message.success('上传成功');
  } catch (error) {
    message.error('上传失败');
    console.error('[ImageUploader] 上传失败', error);
  } finally {
    loading.value = false;
    target.value = '';
  }
}
</script>

<template>
  <div class="image-uploader" @click="openPicker">
    <img v-if="imageUrl" :src="imageUrl" alt="preview" class="upload-image" />
    <div v-else class="upload-placeholder">
      <LoadingOutlined v-if="loading" />
      <PlusOutlined v-else />
      <div class="ant-upload-text">上传图片</div>
    </div>
    <input
      ref="inputRef"
      type="file"
      :accept="accept"
      class="file-input"
      @change="onFileChange"
    />
  </div>
</template>

<style scoped>
.image-uploader {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 128px;
  height: 128px;
  cursor: pointer;
  overflow: hidden;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  background-color: #fafafa;
  transition: border-color 0.3s;
}

.image-uploader:hover {
  border-color: #1677ff;
}

.file-input {
  display: none;
}

.upload-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}

.upload-placeholder .anticon {
  margin-bottom: 8px;
  font-size: 32px;
}

.ant-upload-text {
  margin-top: 8px;
  font-size: 14px;
}
</style>
