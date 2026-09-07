<script setup lang="ts">
// Titled wrapper around a grid of InsightCards. Used to separate the Insights
// section into time-scope blocks ("Período selecionado", "Ano corrente", …) so
// users stop comparing numbers from different scopes side by side.
type IProps = {
  title: string;
  subtitle?: string;
};

defineProps<IProps>();
</script>

<template>
  <section class="space-y-3">
    <div>
      <h3 class="text-sm font-semibold">{{ title }}</h3>
      <p v-if="subtitle" class="text-xs text-muted-foreground">{{ subtitle }}</p>
    </div>
    <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      <slot />
    </div>
  </section>
</template>
