<script setup lang="ts">
type IProps = {
  label: string;
  value?: string | number | null;
  emptyText?: string;
};

const props = withDefaults(defineProps<IProps>(), {
  emptyText: "—",
});
</script>

<template>
  <div class="space-y-2">
    <p class="text-sm font-medium text-muted-foreground">{{ label }}</p>
    <div class="text-base">
      <slot>
        {{ value ?? emptyText }}
      </slot>
    </div>
  </div>
</template>
