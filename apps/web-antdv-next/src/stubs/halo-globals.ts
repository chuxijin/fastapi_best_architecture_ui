import { defineComponent, h, type App, type PropType } from "vue";

const AttachmentSelectorModal = defineComponent({
  name: "AttachmentSelectorModal",
  props: {
    accepts: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
    min: {
      type: Number,
      default: 0,
    },
    max: {
      type: Number,
      default: 0,
    },
  },
  emits: ["close", "select"],
  setup(props, { emit }) {
    const handleClose = () => {
      emit("close");
    };

    return () =>
      h(
        "div",
        {
          class: "fixed inset-0 z-[1200] flex items-center justify-center bg-black/30 p-4",
          onClick: handleClose,
        },
        [
          h(
            "div",
            {
              class: "w-full max-w-md rounded-xl bg-white p-6 shadow-xl",
              onClick: (event: MouseEvent) => {
                event.stopPropagation();
              },
            },
            [
              h(
                "div",
                {
                  class: "text-base font-semibold text-gray-900",
                },
                "Attachment selector unavailable"
              ),
              h(
                "p",
                {
                  class: "mt-2 text-sm text-gray-600",
                },
                "The current frontend project has not connected the Halo attachment library yet."
              ),
              props.accepts.length
                ? h(
                    "p",
                    {
                      class: "mt-2 text-xs text-gray-500",
                    },
                    `accepts: ${props.accepts.join(", ")}`
                  )
                : null,
              h(
                "div",
                {
                  class: "mt-6 flex justify-end",
                },
                [
                  h(
                    "button",
                    {
                      type: "button",
                      class:
                        "rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50",
                      onClick: handleClose,
                    },
                    "Close"
                  ),
                ]
              ),
            ]
          ),
        ]
      );
  },
});

export function registerHaloGlobalStubs(app: App) {
  app.component("AttachmentSelectorModal", AttachmentSelectorModal);
}
