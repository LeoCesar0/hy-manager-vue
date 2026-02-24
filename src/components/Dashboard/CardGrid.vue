<script setup lang="ts">
type IProps = {
  minWidth?: string;
  gap?: string;
};

const props = withDefaults(defineProps<IProps>(), {
  minWidth: "220px",
  gap: "1rem",
});
</script>

<template>
  <div 
    class="grid" 
    :style="{ 
      gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}, 1fr))`,
      gap: gap 
    }"
  >
    <slot />
  </div>
</template>
