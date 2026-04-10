import {
  computed,
  defineComponent,
  h,
  inject,
  mergeProps,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  watch,
  type PropType,
} from "vue";

/**
 * @halo-dev/components 的轻量级运行时 stub
 */

type DropdownContext = {
  hide: () => void;
};

const dropdownContextKey = Symbol("halo-dropdown");

export const Toast = {
  success: (message: string) => console.log("[Toast]", message),
  error: (message: string) => console.error("[Toast]", message),
  warning: (message: string) => console.warn("[Toast]", message),
  info: (message: string) => console.log("[Toast]", message),
};

import { Dropdown } from "floating-vue";
export const VDropdown = Dropdown;

export const VDropdownItem = defineComponent({
  name: "HaloDropdownItemStub",
  inheritAttrs: false,
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { attrs, slots }) {
    const dropdownContext = inject<DropdownContext | null>(
      dropdownContextKey,
      null
    );

    return () =>
      h(
        "button",
        mergeProps(attrs, {
          type: "button",
          disabled: props.disabled,
          class:
            "flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60",
          onClick: () => {
            if (props.disabled) {
              return;
            }
            dropdownContext?.hide();
          },
        }),
        slots.default?.()
      );
  },
});

export const VButton = defineComponent({
  name: "HaloButtonStub",
  inheritAttrs: false,
  props: {
    type: {
      type: String,
      default: "default",
    },
    size: {
      type: String,
      default: "md",
    },
    ghost: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { attrs, slots }) {
    const classes = computed(() => {
      const sizeClass =
        props.size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2 text-sm";
      const typeClass =
        props.type === "secondary"
          ? "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          : props.ghost
            ? "border border-transparent bg-white/80 text-gray-700 hover:bg-white"
            : "border border-transparent bg-primary text-white hover:opacity-90";

      return [
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors",
        sizeClass,
        typeClass,
        (props.disabled || props.loading) && "cursor-not-allowed opacity-60",
      ];
    });

    return () =>
      h(
        "button",
        mergeProps(attrs, {
          type: "button",
          disabled: props.disabled || props.loading,
          class: classes.value,
        }),
        [
          props.loading
            ? h("span", {
                class:
                  "inline-block size-3 animate-spin rounded-full border-2 border-current border-r-transparent",
              })
            : null,
          slots.default?.(),
        ]
      );
  },
});

export const VSpace = defineComponent({
  name: "HaloSpaceStub",
  inheritAttrs: false,
  props: {
    direction: {
      type: String,
      default: "horizontal",
    },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        "div",
        mergeProps(attrs, {
          class: [
            "halo-space flex flex-wrap gap-2",
            props.direction === "vertical" ? "flex-col" : "items-center",
          ],
        }),
        slots.default?.()
      );
  },
});

export const VTooltipComponent = defineComponent({
  name: "HaloTooltipStub",
  inheritAttrs: false,
  props: {
    triggers: {
      type: Array as PropType<string[]>,
      default: () => ["hover"],
    },
  },
  setup(_props, { attrs, slots }) {
    return () =>
      h(
        "span",
        mergeProps(attrs, {
          class: "inline-flex items-center",
        }),
        slots.default?.()
      );
  },
});

export const Dialog = {
  info: async (options?: { onConfirm?: () => Promise<void> | void }) => {
    await options?.onConfirm?.();
  },
};

const applyTooltipTitle = (
  element: HTMLElement,
  value: string | { content?: string } | undefined
) => {
  const title = typeof value === "string" ? value : value?.content;
  if (!title) {
    element.removeAttribute("title");
    return;
  }
  element.setAttribute("title", title);
};

export const vTooltip = {
  mounted: (
    element: HTMLElement,
    binding: { value?: string | { content?: string } }
  ) => {
    applyTooltipTitle(element, binding.value);
  },
  updated: (
    element: HTMLElement,
    binding: { value?: string | { content?: string } }
  ) => {
    applyTooltipTitle(element, binding.value);
  },
};

export const IconImageAddLine = defineComponent({
  name: "IconImageAddLineStub",
  inheritAttrs: false,
  setup(_props, { attrs }) {
    return () =>
      h(
        "span",
        mergeProps(attrs, {
          class: "inline-flex items-center justify-center",
        }),
        "+"
      );
  },
});

export default {
  Dialog,
  IconImageAddLine,
  Toast,
  VButton,
  VDropdown,
  VDropdownItem,
  VSpace,
  VTooltipComponent,
  vTooltip,
};
