<script setup lang="ts">
import { LANDING_FEATURES } from "~/static/landing";
</script>

<template>
  <section id="features" class="py-20 sm:py-28">
    <div class="mx-auto max-w-6xl px-6">
      <div class="text-center">
        <h2 class="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {{ LANDING_FEATURES.sectionTitle }}
        </h2>
        <p class="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          {{ LANDING_FEATURES.sectionSubtitle }}
        </p>
      </div>

      <div class="mt-14 grid gap-6 sm:grid-cols-2">
        <div
          v-for="feature in LANDING_FEATURES.items"
          :key="feature.title"
          class="feature-card group rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02]"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20"
          >
            <component :is="feature.icon" :size="24" />
          </div>

          <h3 class="mt-4 text-lg font-semibold text-foreground">
            {{ feature.title }}
          </h3>

          <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
            {{ feature.description }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.feature-card {
  background: color-mix(in oklch, var(--card) 60%, transparent);
  backdrop-filter: blur(16px);
  border: 1px solid color-mix(in oklch, var(--border) 50%, transparent);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
}

.feature-card:hover {
  border-color: color-mix(in oklch, var(--primary) 30%, transparent);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 0 0 1px color-mix(in oklch, var(--primary) 10%, transparent);
}
</style>
