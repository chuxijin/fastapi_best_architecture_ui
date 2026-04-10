import { h } from "vue";
import { Dropdown as VDropdown, Tooltip as VTooltipComponent, vTooltip } from "floating-vue";

const VButton = {
  name: "VButton",
  setup(props: any, { slots }: any) {
    return () => h("button", { class: "halo-stub-btn", style: "padding:4px 8px;border:1px solid #ddd;border-radius:4px;background:#fff;cursor:pointer" }, slots.default?.());
  }
};

const VSpace = {
  name: "VSpace",
  setup(props: any, { slots }: any) {
    return () => h("div", { class: "halo-stub-space", style: "display:flex;gap:8px;align-items:center" }, slots.default?.());
  }
};

const VDropdownItem = {
  name: "VDropdownItem",
  setup(props: any, { slots }: any) {
    return () => h("div", { class: "halo-stub-dropdown-item", style: "padding:4px 8px;cursor:pointer" }, slots.default?.());
  }
};

const Toast = {
  success: (msg: string) => console.log("[Toast Success]", msg),
  error: (msg: string) => console.error("[Toast Error]", msg),
  info: (msg: string) => console.info("[Toast Info]", msg),
  warning: (msg: string) => console.warn("[Toast Warning]", msg)
};

const Dialog = {
  info: (options: any) => {
    if (window.confirm(options.description)) options.onConfirm?.();
  }
};

const IconImageAddLine = {
  name: "IconImageAddLine",
  setup() {
    return () => h("span", { style: "display:inline-block;padding:2px" }, "+");
  }
};

export {
  VDropdown,
  VTooltipComponent,
  vTooltip,
  VButton,
  VSpace,
  VDropdownItem,
  Toast,
  Dialog,
  IconImageAddLine
};
