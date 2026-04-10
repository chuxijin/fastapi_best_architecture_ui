export interface UploadRequestConfig {
  signal?: AbortSignal;
  onUploadProgress?: (progressEvent: { loaded: number; total?: number }) => void;
  [key: string]: any;
}

export interface Attachment {
  status?: { permalink?: string };
  spec?: { displayName?: string };
  [key: string]: any;
}
import { chunk } from "es-toolkit";
import { ExtensionAudio } from "@HaloEditor/extensions/audio";
import { ExtensionImage } from "@HaloEditor/extensions/image";
import { ExtensionVideo } from "@HaloEditor/extensions/video";
import { Editor, PMNode } from "@HaloEditor/tiptap";

export interface FileProps {
  file: File;
  editor: Editor;
}

/**
 * Creates an editor node from a file.
 *
 * @param editor - Editor instance
 * @param file - File to be uploaded
 * @returns - Editor node
 */
export const createEditorNodeFormFile = (editor: Editor, file: File) => {
  if (file.type.startsWith("image/")) {
    return uploadImage(editor, file);
  }

  if (file.type.startsWith("video/")) {
    return uploadVideo(editor, file);
  }

  if (file.type.startsWith("audio/")) {
    return uploadAudio(editor, file);
  }
};

/**
 * Handles file events, determining if the file is an image and triggering the appropriate upload process.
 *
 * @param {FileProps} { file, editor } - File and editor instances
 * @returns {boolean} - True if a file is handled, otherwise false
 */
export const handleFileEvent = (editor: Editor, files: File[]) => {
  if (!files.length) {
    return false;
  }



  const nodes = files
    .map((file) => createEditorNodeFormFile(editor, file))
    .filter((node) => node !== undefined);

  if (nodes.length) {
    const tr = editor.view.state.tr;
    tr.insert(editor.view.state.selection.from, nodes);
    editor.view.dispatch(tr);
  }
};

/**
 * Uploads an image file and inserts it into the editor.
 *
 * @param editor - Editor instance
 * @param file - File to be uploaded
 */
export const uploadImage = (editor: Editor, file: File) => {
  const { state } = editor;
  return state.schema.nodes[ExtensionImage.name].create({
    file: file,
  });
};

/**
 * Uploads a video file and inserts it into the editor.
 *
 * @param editor - Editor instance
 * @param file - File to be uploaded
 */
export const uploadVideo = (editor: Editor, file: File) => {
  const { state } = editor;
  return state.schema.nodes[ExtensionVideo.name].create({
    file: file,
  });
};

/**
 * Uploads an audio file and inserts it into the editor.
 *
 * @param editor - Editor instance
 * @param file - File to be uploaded
 */
export const uploadAudio = (editor: Editor, file: File) => {
  const { state } = editor;
  return state.schema.nodes[ExtensionAudio.name].create({
    file: file,
  });
};

export interface UploadFetchResponse {
  controller: AbortController;
  onUploadProgress: (progress: number) => void;
  onFinish: (attachment?: Attachment) => void;
  onError: (error: Error) => void;
}

/**
 * Uploads a file with progress monitoring, cancellation support, and callbacks for completion and errors.
 *
 * @param {File} file - File to be uploaded
 * @param {Function} upload - Function to handle the file upload, should return a Promise
 * @returns {Promise<UploadFetchResponse>} - Returns an object with control and callback methods
 */
export const uploadFile = async (
  file: File,
  upload: (file: File, options?: UploadRequestConfig) => Promise<Attachment>,
  uploadResponse: UploadFetchResponse
) => {
  const { signal } = uploadResponse.controller;

  upload(file, {
    signal,
    onUploadProgress(progressEvent) {
      const progress = Math.round(
        (progressEvent.loaded * 100) / (progressEvent.total || 0)
      );
      uploadResponse.onUploadProgress(progress);
    },
  })
    .then((attachment) => {
      uploadResponse.onFinish(attachment);
    })
    .catch((error) => {
      uploadResponse.onError(error);
    });
};

/**
 * Converts a file to a Base64 string.
 *
 * @param {File} file - File to be converted
 * @returns {Promise<string>} - A promise that resolves with the Base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function () {
      resolve(reader.result as string);
    };
    reader.onerror = function (error) {
      reject(error);
    };
    reader.readAsDataURL(file);
  });
}

export function containsFileClipboardIdentifier(types: readonly string[]) {
  const fileTypes = ["files", "application/x-moz-file", "public.file-url"];
  return types.some((type) => fileTypes.includes(type.toLowerCase()));
}

export async function batchUploadExternalLink(
  editor: Editor,
  nodes: { node: PMNode; pos: number; index: number; parent: PMNode | null }[]
) {
  const chunks = chunk(nodes, 5);

  for (const chunkNodes of chunks) {
    await Promise.all(
      chunkNodes.map((node) => uploadExternalLink(editor, node))
    );
  }
}

export async function uploadExternalLink(
  editor: Editor,
  nodeWithPos: {
    node: PMNode;
    pos: number;
    index: number;
    parent: PMNode | null;
  }
) {
  const { node, pos } = nodeWithPos;
  const { src } = node.attrs;

  if (!isExternalAsset(src)) {
    return;
  }

    // TODO: 外部链接上传功能需通过外部配置注入 API。现已脱离 Halo 后端，去除默认调用。
    console.warn("External asset upload is not implemented. Uploading external links is skipped.");
    const data: any = null;
    if (!data) return;

    const url = data?.status?.permalink;
    const name = data?.spec?.displayName;
    const tr = editor.view.state.tr;
    tr.setNodeMarkup(pos, node.type, {
      ...node.attrs,
      src: url,
      name,
    });
    editor.view.dispatch(tr);
}

export function isExternalAsset(src: string) {
  if (!src) {
    return false;
  }

  if (src.startsWith("/")) {
    return false;
  }

  const localProtocols = ["data:", "blob:", "file:"];
  if (localProtocols.some((protocol) => src.startsWith(protocol))) {
    return false;
  }

  const currentOrigin = window.location.origin;
  if (src.startsWith(currentOrigin)) {
    return false;
  }

  return src.startsWith("http://") || src.startsWith("https://");
}
