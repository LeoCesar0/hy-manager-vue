<script setup lang="ts">
import { SearchIcon } from "lucide-vue-next";

type IProps = {
  modelValue: string;
  placeholder?: string;
  maxWidth?: string;
};

const props = withDefaults(defineProps<IProps>(), {
  placeholder: "Buscar...",
  maxWidth: "max-w-sm",
});

type IEmits = {
  "update:modelValue": [value: string];
};

const emit = defineEmits<IEmits>();

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit("update:modelValue", target.value);
};
</script>

<template>
  <div class="relative flex items-center">
    <SearchIcon class="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
    <input
      :value="modelValue"
      @input="handleInput"
      class="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      :class="maxWidth"
      type="text"
      :placeholder="placeholder"
    />
  </div>
</template>
