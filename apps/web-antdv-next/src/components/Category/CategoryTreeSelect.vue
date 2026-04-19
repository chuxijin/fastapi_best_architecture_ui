<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';
import { TreeSelect } from 'ant-design-vue';
import { getSysCategoryTreeApi } from '#/api/category';

defineOptions({ name: 'CategoryTreeSelect' });

const props = defineProps({
  value: { type: [Number, String], default: undefined },
  appCode: { type: String, required: true },
  placeholder: { type: String, default: '请选择分类' },
});

const emit = defineEmits(['update:value', 'change']);

const treeData = ref<any[]>([]);

function mapToTreeData(nodes: any[]): any[] {
  return nodes.map((node) => ({
    ...node,
    label: node.name,
    value: node.id,
    children: node.children && node.children.length > 0 ? mapToTreeData(node.children) : undefined,
  }));
}

async function fetchCategories() {
  try {
    // 自动拉取指定应用下的已启用的分类树
    const res = await getSysCategoryTreeApi({ app_code: props.appCode, status: true });
    treeData.value = res ? mapToTreeData(res) : [];
  } catch (error) {
    console.error('加载分类树失败:', error);
  }
}

onMounted(() => {
  fetchCategories();
});

const localValue = ref(props.value ? Number(props.value) : undefined);

watch(
  () => props.value,
  (val) => {
    localValue.value = val ? Number(val) : undefined;
  },
);

function handleChange(val: any) {
  emit('update:value', val);
  emit('change', val);
}
</script>

<template>
  <TreeSelect
    v-model:value="localValue"
    :tree-data="treeData"
    :placeholder="placeholder"
    show-search
    allow-clear
    tree-default-expand-all
    :dropdown-match-select-width="false"
    :tree-line="true"
    :dropdown-style="{ maxHeight: '400px', overflow: 'auto', minWidth: '250px' }"
    tree-node-filter-prop="label"
    @change="handleChange"
  />
</template>
