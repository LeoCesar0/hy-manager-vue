/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { useForm, Field } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";

/**
 * Minimal switch stub that mirrors how reka-ui SwitchRoot works:
 * - Receives `modelValue` (boolean)
 * - Emits `update:modelValue` with boolean payload on click
 *
 * This is how UiSwitch/UiCheckbox work under the hood via reka-ui.
 */
const SwitchStub = defineComponent({
  name: "SwitchStub",
  props: {
    modelValue: { type: [Boolean, String, Object], default: undefined },
    disabled: { type: Boolean, default: false },
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const toggle = () => {
      const next = !props.modelValue;
      emit("update:modelValue", next);
    };
    return { toggle };
  },
  render() {
    return h("button", {
      role: "switch",
      "data-value": JSON.stringify(this.modelValue),
      "data-type": typeof this.modelValue,
      onClick: this.toggle,
    });
  },
});

const schema = z.object({
  name: z.string(),
  isActive: z.boolean().optional(),
});

/**
 * Creates a test form that mirrors the real FormField pattern:
 * - vee-validate `Field` with scoped slot exposing `componentField`
 * - Strips onInput/onChange (designed for native inputs, coerce to string)
 * - Only passes modelValue + onUpdate:modelValue to the switch
 */
const createFormWrapper = (initialValues: Record<string, any>) => {
  return defineComponent({
    setup() {
      const validationSchema = toTypedSchema(schema);

      const { errors, values } = useForm({
        validationSchema,
        initialValues,
      });

      return { errors, values };
    },
    render() {
      return h("div", [
        h(
          Field,
          { name: "isActive" },
          {
            default: ({ componentField }: any) => {
              // The fix: strip onInput/onChange and coerce modelValue to boolean
              const { modelValue, "onUpdate:modelValue": onUpdate, onInput, onChange, ...rest } = componentField;
              return h(SwitchStub, {
                ...rest,
                modelValue: !!modelValue,
                "onUpdate:modelValue": (val: boolean) => onUpdate(val),
              });
            },
          }
        ),
        h("pre", { class: "form-values" }, JSON.stringify({
          values: this.values,
          types: Object.fromEntries(
            Object.entries(this.values).map(([k, v]) => [k, typeof v])
          ),
          errors: this.errors,
        })),
      ]);
    },
  });
};

describe("FormField switch/boolean handling", () => {
  describe("value type is always boolean (never string)", () => {
    it("holds boolean when initialized with false", async () => {
      const Wrapper = createFormWrapper({ name: "test", isActive: false });
      const wrapper = mount(Wrapper);
      await flushPromises();

      const state = JSON.parse(wrapper.find(".form-values").text());
      expect(state.types.isActive).toBe("boolean");
      expect(state.values.isActive).toBe(false);
    });

    it("holds boolean true after toggling from false", async () => {
      const Wrapper = createFormWrapper({ name: "test", isActive: false });
      const wrapper = mount(Wrapper);
      await flushPromises();

      await wrapper.find("[role=switch]").trigger("click");
      await flushPromises();

      const state = JSON.parse(wrapper.find(".form-values").text());
      expect(state.types.isActive).toBe("boolean");
      expect(state.values.isActive).toBe(true);
      expect(state.errors).toEqual({});
    });

    it("holds boolean false after toggling on then off", async () => {
      const Wrapper = createFormWrapper({ name: "test", isActive: false });
      const wrapper = mount(Wrapper);
      await flushPromises();

      await wrapper.find("[role=switch]").trigger("click");
      await flushPromises();
      await wrapper.find("[role=switch]").trigger("click");
      await flushPromises();

      const state = JSON.parse(wrapper.find(".form-values").text());
      expect(state.types.isActive).toBe("boolean");
      expect(state.values.isActive).toBe(false);
      expect(state.errors).toEqual({});
    });

    it("coerces undefined initial to false for the switch display", async () => {
      const Wrapper = createFormWrapper({ name: "test" });
      const wrapper = mount(Wrapper);
      await flushPromises();

      const switchEl = wrapper.find("[role=switch]");
      expect(switchEl.attributes("data-type")).toBe("boolean");
      expect(switchEl.attributes("data-value")).toBe("false");
    });

    it("holds boolean true after toggling from undefined initial", async () => {
      const Wrapper = createFormWrapper({ name: "test" });
      const wrapper = mount(Wrapper);
      await flushPromises();

      await wrapper.find("[role=switch]").trigger("click");
      await flushPromises();

      const state = JSON.parse(wrapper.find(".form-values").text());
      expect(state.types.isActive).toBe("boolean");
      expect(state.values.isActive).toBe(true);
      expect(state.errors).toEqual({});
    });

    it("never has validation errors after multiple toggles", async () => {
      const Wrapper = createFormWrapper({ name: "test", isActive: false });
      const wrapper = mount(Wrapper);
      await flushPromises();

      for (let i = 0; i < 5; i++) {
        await wrapper.find("[role=switch]").trigger("click");
        await flushPromises();

        const state = JSON.parse(wrapper.find(".form-values").text());
        expect(state.errors).toEqual({});
        expect(state.types.isActive).toBe("boolean");
      }
    });
  });

  describe("Zod schema validation", () => {
    it("rejects string values for boolean field", () => {
      const result = schema.safeParse({ name: "test", isActive: "true" });
      expect(result.success).toBe(false);
    });

    it("accepts boolean values", () => {
      expect(schema.safeParse({ name: "test", isActive: true }).success).toBe(true);
      expect(schema.safeParse({ name: "test", isActive: false }).success).toBe(true);
    });

    it("accepts undefined (optional)", () => {
      expect(schema.safeParse({ name: "test" }).success).toBe(true);
      expect(schema.safeParse({ name: "test", isActive: undefined }).success).toBe(true);
    });
  });
});
