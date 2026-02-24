<script setup lang="ts">
import { ArrowLeftIcon } from "lucide-vue-next";

type IProps = {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  loading?: boolean;
};

const props = withDefaults(defineProps<IProps>(), {
  showBackButton: false,
  loading: false,
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center" :class="showBackButton ? 'gap-4' : 'justify-between'">
      <UiButton 
        v-if="showBackButton" 
        variant="ghost" 
        size="icon" 
        @click="onBack"
      >
        <ArrowLeftIcon class="h-4 w-4" />
      </UiButton>
      
      <div :class="showBackButton ? 'flex-1' : ''">
        <h1 class="text-3xl font-bold tracking-tight">{{ title }}</h1>
        <p v-if="subtitle" class="text-muted-foreground">{{ subtitle }}</p>
      </div>
      
      <div v-if="!showBackButton" class="flex items-center gap-2">
        <slot name="actions" />
      </div>
      
      <div v-if="showBackButton" class="flex gap-2">
        <slot name="detail-actions" />
      </div>
    </div>

    <slot name="filters" />

    <div v-if="loading" class="flex items-center justify-center py-12">
      <Loading :is-loading="true" size="lg" />
    </div>

    <slot v-else />
  </div>
</template>
