<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { message } from 'ant-design-vue';

interface Props {
  modelValue?: string;
  templateType?: string;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '{}',
  templateType: 'custom',
});

const emit = defineEmits<Emits>();

// 编辑模式：visual（可视化）或 json（JSON）
const editMode = ref<'visual' | 'json'>('visual');

// JSON 文本
const jsonText = ref(props.modelValue);

// 可视化配置数据
const visualConfig = ref<any>({});

// 排除规则配置
const exclusionConfig = ref({
  rules: [
    {
      pattern: '',
      target: 'name',
      item_type: 'any',
      mode: 'contains',
      case_sensitive: false,
    },
  ],
});

// 重命名规则配置
const renameConfig = ref({
  rules: [
    {
      match_regex: '',
      replace_string: '',
      target_scope: 'name',
      case_sensitive: false,
    },
  ],
});

// 自定义规则配置
const customConfig = ref({
  type: 'custom',
  script: '',
  parameters: {},
});

// 根据模板类型获取当前配置
const currentConfig = computed(() => {
  switch (props.templateType) {
    case 'exclusion':
      return exclusionConfig.value;
    case 'rename':
      return renameConfig.value;
    case 'custom':
      return customConfig.value;
    default:
      return {};
  }
});

// 监听模板类型变化
watch(() => props.templateType, (newType) => {
  if (newType) {
    // 模板类型变化时，重新解析当前的JSON数据
    parseJsonToVisual();
  }
}, { immediate: true });

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  if (newValue && newValue !== jsonText.value) {
    jsonText.value = newValue;
    parseJsonToVisual();
  }
}, { immediate: true });

// 解析 JSON 到可视化配置
function parseJsonToVisual() {
  try {
    const parsed = JSON.parse(jsonText.value || '{}');
    visualConfig.value = parsed;

    // 检查是否为空配置（新增模式）
    const isEmpty = Object.keys(parsed).length === 0;

    // 根据类型设置对应的配置
    switch (props.templateType) {
      case 'exclusion':
        // 兼容旧格式：优先使用rules，如果没有则使用patterns
        const exclusionRules = parsed.rules || parsed.patterns || [];
        if (exclusionRules.length > 0) {
          exclusionConfig.value.rules = exclusionRules;
        } else if (!isEmpty) {
          // 只有在非空配置时才保持默认的空规则
          exclusionConfig.value.rules = [{
            pattern: '',
            target: 'name',
            item_type: 'any',
            mode: 'contains',
            case_sensitive: false,
          }];
        } else {
          // 新增模式下，保持空数组
          exclusionConfig.value.rules = [];
        }
        break;
      case 'rename':
        if (parsed.rules && parsed.rules.length > 0) {
          renameConfig.value.rules = parsed.rules;
        } else if (!isEmpty) {
          // 只有在非空配置时才保持默认的空规则
          renameConfig.value.rules = [{
            match_regex: '',
            replace_string: '',
            target_scope: 'name',
            case_sensitive: false,
          }];
        } else {
          // 新增模式下，保持空数组
          renameConfig.value.rules = [];
        }
        break;
      case 'custom':
        if (!isEmpty) {
          customConfig.value = { ...customConfig.value, ...parsed };
        } else {
          // 新增模式下，保持空对象
          customConfig.value = {
            type: 'custom',
            script: '',
            parameters: {},
          };
        }
        break;
    }
  } catch (error) {
    console.error('解析 JSON 失败:', error);
  }
}

// 更新可视化配置
function updateVisualConfig() {
  const config = currentConfig.value;
  const jsonStr = JSON.stringify(config, null, 2);
  jsonText.value = jsonStr;
  emit('update:modelValue', jsonStr);
}

// 更新 JSON 文本
function updateJsonText() {
  try {
    // 验证 JSON 格式
    JSON.parse(jsonText.value);
    emit('update:modelValue', jsonText.value);
    parseJsonToVisual();
  } catch (error) {
    message.error('JSON 格式错误');
  }
}

// 添加排除模式
function addExclusionPattern() {
  exclusionConfig.value.rules.push({
    pattern: '',
    target: 'name',
    item_type: 'any',
    mode: 'contains',
    case_sensitive: false,
  });
  updateVisualConfig();
}

// 删除排除模式
function removeExclusionPattern(index: number) {
  exclusionConfig.value.rules.splice(index, 1);
  updateVisualConfig();
}

// 添加重命名规则
function addRenameRule() {
  renameConfig.value.rules.push({
    match_regex: '',
    replace_string: '',
    target_scope: 'name',
    case_sensitive: false,
  });
  updateVisualConfig();
}

// 删除重命名规则
function removeRenameRule(index: number) {
  renameConfig.value.rules.splice(index, 1);
  updateVisualConfig();
}

// 切换编辑模式
function switchEditMode(mode: 'visual' | 'json') {
  if (mode === 'json' && editMode.value === 'visual') {
    // 从可视化切换到 JSON，更新 JSON 文本
    updateVisualConfig();
  } else if (mode === 'visual' && editMode.value === 'json') {
    // 从 JSON 切换到可视化，解析 JSON
    parseJsonToVisual();
  }
  editMode.value = mode;
}

// 插入示例配置
function insertExample() {
  const examples = {
    exclusion: {
      rules: [
        {
          pattern: 'tmp',
          target: 'extension',
          item_type: 'any',
          mode: 'contains',
          case_sensitive: false,
        },
        {
          pattern: 'temp',
          target: 'extension',
          item_type: 'any',
          mode: 'contains',
          case_sensitive: false,
        },
      ],
    },
    rename: {
      rules: [
        {
          match_regex: '\\s+',
          replace_string: '_',
          target_scope: 'name',
          case_sensitive: false,
        },
      ],
    },
    custom: {
      type: 'custom',
      script: 'function process(item) {\n  // 自定义处理逻辑\n  return item;\n}',
      parameters: {
        enabled: true,
        timeout: 5000,
      },
    },
  };

  const example = examples[props.templateType as keyof typeof examples];
  if (example) {
    switch (props.templateType) {
      case 'exclusion':
        exclusionConfig.value = example as any;
        break;
      case 'rename':
        renameConfig.value = example as any;
        break;
      case 'custom':
        customConfig.value = example as any;
        break;
    }
    updateVisualConfig();
    message.success('已插入示例配置');
  }
}
</script>

<template>
  <div class="rule-config-editor">
    <!-- 编辑模式切换 -->
    <div class="mb-4 flex items-center justify-between">
      <a-radio-group v-model:value="editMode" @change="switchEditMode(editMode)">
        <a-radio-button value="visual">可视化配置</a-radio-button>
        <a-radio-button value="json">JSON 配置</a-radio-button>
      </a-radio-group>

      <a-button size="small" @click="insertExample">
        插入示例配置
      </a-button>
    </div>

    <!-- 可视化配置 -->
    <div v-if="editMode === 'visual'" class="visual-config">
      <!-- 排除规则配置 -->
      <div v-if="templateType === 'exclusion'" class="exclusion-config">
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-sm font-medium">排除模式</h4>
            <a-button size="small" type="primary" @click="addExclusionPattern">
              添加模式
            </a-button>
          </div>

          <div v-for="(pattern, index) in exclusionConfig.rules" :key="index" class="mb-3 p-3 border rounded">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <a-form-item label="匹配模式" class="mb-2">
                <a-input
                  v-model:value="pattern.pattern"
                  placeholder="如: *.tmp, temp_*"
                  @change="updateVisualConfig"
                />
              </a-form-item>

              <a-form-item label="匹配目标" class="mb-2">
                <a-select v-model:value="pattern.target" @change="updateVisualConfig">
                  <a-select-option value="name">文件名</a-select-option>
                  <a-select-option value="path">路径</a-select-option>
                  <a-select-option value="extension">扩展名</a-select-option>
                </a-select>
              </a-form-item>

              <a-form-item label="项目类型" class="mb-2">
                <a-select v-model:value="pattern.item_type" @change="updateVisualConfig">
                  <a-select-option value="file">文件</a-select-option>
                  <a-select-option value="folder">文件夹</a-select-option>
                  <a-select-option value="any">文件和文件夹</a-select-option>
                </a-select>
              </a-form-item>

              <a-form-item label="匹配模式" class="mb-2">
                <a-select v-model:value="pattern.mode" @change="updateVisualConfig">
                  <a-select-option value="contains">包含匹配</a-select-option>
                  <a-select-option value="exact">精确匹配</a-select-option>
                  <a-select-option value="wildcard">通配符</a-select-option>
                  <a-select-option value="regex">正则表达式</a-select-option>
                </a-select>
              </a-form-item>
            </div>

            <div class="flex items-center justify-between">
              <a-checkbox
                v-model:checked="pattern.case_sensitive"
                @change="updateVisualConfig"
              >
                区分大小写
              </a-checkbox>

              <a-button
                v-if="exclusionConfig.rules.length > 1"
                size="small"
                danger
                @click="removeExclusionPattern(index)"
              >
                删除
              </a-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 重命名规则配置 -->
      <div v-else-if="templateType === 'rename'" class="rename-config">
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-sm font-medium">重命名规则</h4>
            <a-button size="small" type="primary" @click="addRenameRule">
              添加规则
            </a-button>
          </div>

          <div v-for="(rule, index) in renameConfig.rules" :key="index" class="mb-3 p-3 border rounded">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <a-form-item label="匹配正则" class="mb-2">
                <a-input
                  v-model:value="rule.match_regex"
                  placeholder="如: \\s+, [0-9]+"
                  @change="updateVisualConfig"
                />
              </a-form-item>

              <a-form-item label="替换字符串" class="mb-2">
                <a-input
                  v-model:value="rule.replace_string"
                  placeholder="如: _, -"
                  @change="updateVisualConfig"
                />
              </a-form-item>

              <a-form-item label="作用范围" class="mb-2">
                <a-select v-model:value="rule.target_scope" @change="updateVisualConfig">
                  <a-select-option value="name">文件名</a-select-option>
                  <a-select-option value="path">路径</a-select-option>
                </a-select>
              </a-form-item>
            </div>

            <div class="flex items-center justify-between">
              <a-checkbox
                v-model:checked="rule.case_sensitive"
                @change="updateVisualConfig"
              >
                区分大小写
              </a-checkbox>

              <a-button
                v-if="renameConfig.rules.length > 1"
                size="small"
                danger
                @click="removeRenameRule(index)"
              >
                删除
              </a-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 自定义规则配置 -->
      <div v-else-if="templateType === 'custom'" class="custom-config">
        <div class="grid grid-cols-1 gap-4">
          <a-form-item label="规则类型">
            <a-select v-model:value="customConfig.type" @change="updateVisualConfig">
              <a-select-option value="custom">自定义脚本</a-select-option>
              <a-select-option value="filter">过滤器</a-select-option>
              <a-select-option value="transform">转换器</a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="处理脚本">
            <a-textarea
              v-model:value="customConfig.script"
              :rows="8"
              placeholder="function process(item) {&#10;  // 自定义处理逻辑&#10;  return item;&#10;}"
              @change="updateVisualConfig"
            />
          </a-form-item>

          <a-form-item label="参数配置">
            <a-textarea
              :value="JSON.stringify(customConfig.parameters, null, 2)"
              :rows="4"
              placeholder='{"enabled": true, "timeout": 5000}'
              @change="(e: any) => {
                try {
                  customConfig.parameters = JSON.parse(e.target.value);
                  updateVisualConfig();
                } catch (error) {
                  console.error('JSON解析失败:', error);
                }
              }"
            />
          </a-form-item>
        </div>
      </div>
    </div>

    <!-- JSON 配置 -->
    <div v-else class="json-config">
      <a-textarea
        v-model:value="jsonText"
        :rows="16"
        placeholder="请输入 JSON 格式的规则配置"
        @change="updateJsonText"
      />
    </div>
  </div>
</template>

<style scoped>
.rule-config-editor {
  min-height: 400px;
}

.visual-config {
  max-height: 500px;
  overflow-y: auto;
}

.json-config {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}
</style>
