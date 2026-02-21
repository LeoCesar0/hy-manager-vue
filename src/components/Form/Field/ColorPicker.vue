<script setup lang="ts">
import { CheckIcon } from "lucide-vue-next";
import { cn } from "~/lib/utils";

type IProps = {
  modelValue?: string | null;
  disabled?: boolean;
};

const props = withDefaults(defineProps<IProps>(), {
  disabled: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899",
  "#dc2626", "#ea580c", "#ca8a04", "#16a34a",
  "#0d9488", "#2563eb", "#7c3aed", "#db2777",
  "#991b1b", "#9a3412", "#854d0e", "#166534",
  "#134e4a", "#1e40af", "#5b21b6", "#9d174d",
];

const hexInput = ref(props.modelValue || "");

watch(
  () => props.modelValue,
  (val) => {
    hexInput.value = val || "";
  }
);

const isValidHex = (value: string) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);

const handleHexInput = (e: Event) => {
  const raw = (e.target as HTMLInputElement).value;
  hexInput.value = raw;
  if (isValidHex(raw)) {
    emit("update:modelValue", raw);
  }
};

const selectPreset = (color: string) => {
  hexInput.value = color;
  emit("update:modelValue", color);
};

const previewColor = computed(() =>
  isValidHex(hexInput.value) ? hexInput.value : (props.modelValue || "transparent")
);
</script>

<template>
  <div class="flex flex-col gap-3 w-full">
    <div class="grid gap-2" style="grid-template-columns: repeat(8, 1fr)">
      <button
        v-for="color in PRESET_COLORS"
        :key="color"
        type="button"
        :class="cn(
          'h-7 w-full rounded-md flex items-center justify-center cursor-pointer transition-all',
          'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          {
            'ring-2 ring-ring ring-offset-2': modelValue === color,
            'opacity-50 cursor-not-allowed': disabled,
            'hover:scale-110 hover:shadow-md': !disabled,
          }
        )"
        :style="{ backgroundColor: color }"
        :disabled="disabled"
        @click="selectPreset(color)"
      >
        <CheckIcon v-if="modelValue === color" class="h-3 w-3 text-white drop-shadow" />
      </button>
    </div>

    <div class="flex items-center gap-2">
      <div class="h-8 w-8 rounded-md border border-border shrink-0" :style="{ backgroundColor: previewColor }" />
      <input
        class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        type="text"
        maxlength="7"
        placeholder="#000000"
        :value="hexInput"
        :disabled="disabled"
        @input="handleHexInput"
      />
    </div>
  </div>
</template>

