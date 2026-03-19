import { h, ref } from 'vue';

import { Input, Modal } from 'ant-design-vue';

interface UrlInputOptions {
  initialValue?: string;
  onConfirm: (value: string) => void;
  onEmpty?: () => void;
  placeholder?: string;
  title: string;
}

export function openUrlInputModal(options: UrlInputOptions) {
  const inputValue = ref(options.initialValue ?? '');

  Modal.confirm({
    title: options.title,
    content: () =>
      h(Input, {
        value: inputValue.value,
        placeholder: options.placeholder,
        autofocus: true,
        'onUpdate:value': (value: string) => {
          inputValue.value = value;
        },
      }),
    onOk: () => {
      const value = inputValue.value.trim();
      if (value.length === 0) {
        options.onEmpty?.();
        return;
      }
      options.onConfirm(value);
    },
  });
}
