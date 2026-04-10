<script setup lang="ts">
import type { Attachment, UploadRequestConfig } from "@HaloEditor/utils/upload";
import { VButton, VDropdown, VSpace } from "#/stubs/halo-components";
import {
  utils,
  type AttachmentLike,
  type AttachmentSimple,
} from "@halo-dev/ui-shared";
import { useFileDialog } from "@vueuse/core";
import { onUnmounted, ref, watch } from "vue";
import { useEditorConfig } from "@HaloEditor/config/use-editor-config";
import { i18n } from "@HaloEditor/locales";
import type { Editor } from "@HaloEditor/tiptap";
import { uploadFile } from "@HaloEditor/utils/upload";
import Input from "../base/Input.vue";

const editorConfig = useEditorConfig();

const props = withDefaults(
  defineProps<{
    editor: Editor;
    accept?: string;
    uploadedFile?: File;
    uploadToAttachmentFile?: (
      file: File,
      options?: UploadRequestConfig
    ) => Promise<Attachment>;
  }>(),
  {
    accept: "*",
    uploadedFile: undefined,
    uploadToAttachmentFile: undefined,
  }
);

const emit = defineEmits<{
  (event: "setExternalLink", attachment?: AttachmentSimple): void;
  (event: "onUploadReady", file: File): void;
  (event: "onUploadProgress", progress: number): void;
  (event: "onUploadFinish"): void;
  (event: "onUploadError", error: Error): void;
  (event: "onUploadAbort"): void;
}>();

const externalLink = ref("");

const handleEnterSetExternalLink = () => {
  if (!externalLink.value) {
    return;
  }
  emit("setExternalLink", {
    url: externalLink.value,
  });
};

const { open, reset, onChange } = useFileDialog({
  accept: props.accept,
  multiple: false,
});

const controller = ref<AbortController>();
const originalFile = ref<File>();
const uploadState = ref<"init" | "uploading" | "error">("init");
const uploadProgress = ref<number | undefined>(undefined);

// 优先使用 prop 传入的上传函数，其次使用全局 config
const resolvedUpload = () => props.uploadToAttachmentFile || editorConfig.upload;

/**
 *
 * Upload files to the attachment library.
 *
 * @param file attachments that need to be uploaded to the attachment library
 */
const handleUploadFile = (file: File) => {
  const upload = resolvedUpload();
  if (!upload) {
    console.warn("[Editor] No upload function provided. File upload skipped.");
    return;
  }
  controller.value = new AbortController();
  originalFile.value = file;
  uploadState.value = "uploading";
  uploadProgress.value = undefined;
  emit("onUploadReady", file);
  uploadFile(file, upload, {
    controller: controller.value,
    onUploadProgress: (progress) => {
      uploadProgress.value = progress;
      emit("onUploadProgress", progress);
    },

    onFinish: (attachment?: Attachment) => {
      if (attachment) {
        emit("setExternalLink", {
          url: attachment.status?.permalink,
        } as AttachmentSimple);
      }
      handleResetUpload();
      emit("onUploadFinish");
    },

    onError: (error: Error) => {
      if (error.name !== "CanceledError") {
        uploadState.value = "error";
      }
      emit("onUploadError", error);
    },
  });
};

const handleUploadAbort = () => {
  emit("onUploadAbort");
  handleResetUpload();
};

const handleUploadRetry = () => {
  if (!controller.value) {
    return;
  }
  controller.value.abort();
  if (!originalFile.value) {
    return;
  }
  handleUploadFile(originalFile.value);
};

const handleResetUpload = () => {
  uploadState.value = "init";
  controller.value?.abort();
  controller.value = undefined;
  originalFile.value = undefined;
  uploadProgress.value = undefined;
  reset();
};

onChange((files) => {
  if (!files) {
    return;
  }
  if (files.length > 0) {
    handleUploadFile(files[0]);
  }
});

watch(
  () => props.uploadedFile,
  async (file) => {
    if (!file) {
      return;
    }
    handleUploadFile(file);
  },
  {
    immediate: true,
  }
);

onUnmounted(() => {
  handleUploadAbort();
});

defineExpose({
  abort: handleUploadAbort,
  retry: handleUploadRetry,
  reset: handleResetUpload,
});

// Attachment Selector Modal
const attachmentSelectorModalVisible = ref(false);

function onAttachmentSelect(attachments: AttachmentLike[]) {
  if (!attachments.length) {
    return;
  }
  const attachment = attachments[0];
  const attachmentSimple = utils.attachment.convertToSimple(attachment);
  emit("setExternalLink", attachmentSimple);
  attachmentSelectorModalVisible.value = false;
}
</script>
<template>
  <component
    :is="editorConfig.attachmentSelector"
    v-if="attachmentSelectorModalVisible && editorConfig.attachmentSelector"
    :accepts="[props.accept]"
    :min="1"
    :max="1"
    @select="onAttachmentSelect"
    @close="attachmentSelectorModalVisible = false"
  />
  <div class="flex h-64 w-full items-center justify-center">
    <slot
      v-if="$slots.uploading && uploadState === 'uploading'"
      name="uploading"
      :progress="uploadProgress"
    ></slot>
    <slot
      v-else-if="$slots.error && uploadState === 'error'"
      name="error"
    ></slot>
    <div
      v-else
      class="flex size-full cursor-pointer flex-col items-center justify-center border-2 border-dashed border-gray-300 bg-gray-50"
    >
      <div
        class="flex flex-col items-center justify-center space-y-7 pb-6 pt-5"
      >
        <div
          v-if="$slots.icon"
          class="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20"
        >
          <slot name="icon"></slot>
        </div>
        <VSpace>
          <VButton
            v-if="resolvedUpload()"
            @click="open()"
          >
            {{ i18n.global.t("editor.common.button.upload") }}
          </VButton>

          <VButton
            v-if="editorConfig.attachmentSelector"
            @click="attachmentSelectorModalVisible = true"
          >
            {{ i18n.global.t("editor.extensions.upload.attachment.title") }}
          </VButton>

          <VDropdown>
            <VButton>
              {{ i18n.global.t("editor.extensions.upload.permalink.title") }}
            </VButton>
            <template #popper>
              <div class="w-80">
                <Input
                  v-model="externalLink"
                  auto-focus
                  :placeholder="
                    i18n.global.t(
                      'editor.extensions.upload.permalink.placeholder'
                    )
                  "
                  @keydown.enter="handleEnterSetExternalLink"
                />
              </div>
            </template>
          </VDropdown>
        </VSpace>
      </div>
    </div>
  </div>
</template>
