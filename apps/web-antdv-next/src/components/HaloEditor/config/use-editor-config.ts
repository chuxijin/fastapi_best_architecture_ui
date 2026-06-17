import type { EditorConfig } from './index';

import { inject } from 'vue';

import { editorConfigKey } from './index';

const defaultConfig: EditorConfig = {
  permissionCheck: () => true,
};

export function useEditorConfig(): EditorConfig {
  return inject(editorConfigKey, defaultConfig);
}
