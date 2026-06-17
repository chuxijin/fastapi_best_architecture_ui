import { i18n } from '@HaloEditor/locales';
import {
  Editor,
  Extension,
  Plugin,
  PluginKey,
  PMNode,
  Slice,
} from '@HaloEditor/tiptap';
import {
  batchUploadExternalLink,
  containsFileClipboardIdentifier,
  handleFileEvent,
  isExternalAsset,
} from '@HaloEditor/utils/upload';

import { ExtensionAudio } from '../audio';
import { ExtensionImage } from '../image';
import { ExtensionVideo } from '../video';

export const ExtensionUpload = Extension.create({
  name: 'upload',

  addProseMirrorPlugins() {
    const { editor }: { editor: Editor } = this;

    return [
      new Plugin({
        key: new PluginKey('upload'),
        props: {
          handlePaste: (view, event: ClipboardEvent, slice: Slice) => {
            if (view.props.editable && !view.props.editable(view.state)) {
              return false;
            }

            if (!event.clipboardData) {
              return false;
            }

            const externalNodes = getAllExternalNodes(slice);
            if (externalNodes.length > 0) {
              // Stubbed out Halo Dialog for native confirm for external asset transfers
              const performUpload = window.confirm(
                i18n.global.t(
                  'editor.extensions.upload.operations.transfer_in_batch.description',
                ),
              );

              if (performUpload) {
                batchUploadExternalLink(editor, externalNodes).then(() => {});
              }
            }

            const types = event.clipboardData.types;
            if (!containsFileClipboardIdentifier(types)) {
              return false;
            }

            // If the copied content is Excel, do not process it.
            if (isExcelPasted(event.clipboardData)) {
              return false;
            }

            const files = [...event.clipboardData.files];

            if (files.length > 0) {
              event.preventDefault();
              handleFileEvent(editor, files);
              return true;
            }

            return false;
          },
          handleDrop: (view, event) => {
            if (view.props.editable && !view.props.editable(view.state)) {
              return false;
            }

            if (!event.dataTransfer) {
              return false;
            }

            const hasFiles = event.dataTransfer.files.length > 0;
            if (!hasFiles) {
              return false;
            }

            event.preventDefault();

            const files = [...event.dataTransfer.files] as File[];
            if (files.length > 0) {
              event.preventDefault();
              // TODO: For drag-and-drop uploaded files,
              // perhaps it is necessary to determine the
              // current position of the drag-and-drop
              // instead of inserting them directly at the cursor.
              handleFileEvent(editor, files);
              return true;
            }

            return false;
          },
        },
      }),
    ];
  },
});

function isExcelPasted(clipboardData: ClipboardEvent['clipboardData']) {
  if (!clipboardData) {
    return false;
  }

  const types = clipboardData.types;
  if (
    types.includes('application/vnd.ms-excel') ||
    types.includes(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
  ) {
    return true;
  }

  if (types.includes('text/html')) {
    try {
      const html = clipboardData.getData('text/html');
      if (
        html.includes('ProgId="Excel.Sheet"') ||
        html.includes('xmlns:x="urn:schemas-microsoft-com:office:excel"') ||
        html.includes('urn:schemas-microsoft-com:office:spreadsheet') ||
        html.includes('<x:ExcelWorkbook>')
      ) {
        return true;
      }
    } catch (error) {
      console.warn('Failed to read clipboard HTML data:', error);
    }
  }

  return false;
}

export function getAllExternalNodes(
  slice: Slice,
): { index: number; node: PMNode; parent: null | PMNode; pos: number }[] {
  const externalNodes: {
    index: number;
    node: PMNode;
    parent: null | PMNode;
    pos: number;
  }[] = [];
  slice.content.descendants((node, pos, parent, index) => {
    if (
      [ExtensionAudio.name, ExtensionImage.name, ExtensionVideo.name].includes(
        node.type.name,
      ) &&
      isExternalAsset(node.attrs.src)
    ) {
      externalNodes.push({
        node,
        pos,
        parent,
        index,
      });
    }
  });
  return externalNodes;
}
