import { defineComponent, h, mergeProps } from "vue";

const IconComponentStub = defineComponent({
  name: "IconComponentStub",
  inheritAttrs: false,
  setup(_props, { attrs }) {
    return () =>
      h(
        "span",
        mergeProps(attrs, {
          "aria-hidden": "true",
          class: "inline-flex items-center justify-center align-middle",
          style: {
            width: "1em",
            height: "1em",
            minWidth: "1em",
            minHeight: "1em",
            border: "1px solid currentColor",
            borderRadius: "0.125rem",
            opacity: "0.65",
          },
        })
      );
  },
});

export default IconComponentStub;
