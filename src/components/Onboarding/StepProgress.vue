<script setup lang="ts">
type IProps = {
  currentStep: number;
  totalSteps: number;
};

const props = defineProps<IProps>();
</script>

<template>
  <div class="flex items-center justify-center gap-2">
    <template v-for="step in totalSteps" :key="step">
      <div
        class="h-2.5 rounded-full transition-all duration-300"
        :class="[
          step <= currentStep ? 'bg-primary w-8' : 'bg-muted w-2.5',
        ]"
      />
    </template>
  </div>
</template>
