import { inject } from "vue";
import { editorConfigKey, type EditorConfig } from "./index";

const defaultConfig: EditorConfig = {
  permissionCheck: () => true,
};

export function useEditorConfig(): EditorConfig {
  return inject(editorConfigKey, defaultConfig);
}
