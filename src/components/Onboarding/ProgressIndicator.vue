<script setup lang="ts">
type IProps = {
  currentStep: number;
  totalSteps: number;
};

const props = defineProps<IProps>();
</script>

<template>
  <div class="flex items-center justify-center gap-2">
    <div
      v-for="step in totalSteps"
      :key="step"
      class="h-2 rounded-full transition-all"
      :class="step <= currentStep ? 'w-8 bg-primary' : 'w-2 bg-muted'"
    />
  </div>
</template>
