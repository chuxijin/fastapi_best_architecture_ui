import { defineComponent, h } from 'vue';

/**
 * @halo-dev/components 的轻量级 stub
 */

export const Toast = {
  success: (message: string) => console.log('[Toast]', message),
  error: (message: string) => console.error('[Toast]', message),
  warning: (message: string) => console.warn('[Toast]', message),
  info: (message: string) => console.log('[Toast]', message),
};

const DefaultStub = defineComponent({
  name: 'DefaultStub',
  setup(_props, { slots }) {
    return () => h('div', { class: 'halo-stub' }, slots.default?.());
  },
});

export const VDropdown = DefaultStub;
export const VDropdownItem = DefaultStub;
export const VButton = DefaultStub;
export const VSpace = DefaultStub;
export const VTooltipComponent = DefaultStub;
export const Dialog = {
  info: async (options?: { onConfirm?: () => Promise<void> | void }) => {
    await options?.onConfirm?.();
  },
};

// Directive 桩
export const vTooltip = {
  mounted: () => {},
  updated: () => {},
};

// 图标桩 (Iconify 风格)
export const IconImageAddLine = DefaultStub;

export default {};
