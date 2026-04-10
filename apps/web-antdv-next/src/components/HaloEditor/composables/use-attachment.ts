import { computed, ref, type Ref } from "vue";
import { i18n } from "@HaloEditor/locales";

export interface AttachmentSimple {
  url?: string;
  alt?: string;
}

export function useExternalAssetsTransfer(
  src: Ref<string | undefined>,
  callback: (attachment: AttachmentSimple) => void
) {
  const isExternalAsset = computed(() => {
    if (src.value?.startsWith("/")) {
      return false;
    }
    // Stub external asset check: roughly checking if it's an absolute URL not from current origin
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    if (currentOrigin && src.value?.startsWith(currentOrigin)) {
      return false;
    }
    return src.value?.startsWith('http');
  });

  const transferring = ref(false);

  async function handleTransfer() {
    if (!src.value) {
      return;
    }

    transferring.value = true;

    // TODO: 调用外部应用传入的上传接口
    console.warn("External asset transfer involves custom API implementation which is skipped.");
    const data: any = null; // Mock
    if (data) {
      callback({
        url: data.status?.permalink || "",
        alt: data.spec?.displayName,
      });
      console.log("[Toast]", i18n.global.t("editor.common.toast.save_success"));
    }

    transferring.value = false;
  }

  return {
    isExternalAsset,
    transferring,
    handleTransfer,
  };
}
