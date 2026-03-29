<script setup lang="ts">
import { LANDING_HOW_IT_WORKS } from "~/static/landing";
</script>

<template>
  <section id="how-it-works" class="relative py-20 sm:py-28">
    <div class="mx-auto max-w-6xl px-6">
      <div class="text-center">
        <h2 class="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {{ LANDING_HOW_IT_WORKS.sectionTitle }}
        </h2>
        <p class="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          {{ LANDING_HOW_IT_WORKS.sectionSubtitle }}
        </p>
      </div>

      <div class="mt-14 grid gap-8 sm:grid-cols-3">
        <div
          v-for="step in LANDING_HOW_IT_WORKS.steps"
          :key="step.number"
          class="relative text-center"
        >
          <div
            class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"
          >
            <component :is="step.icon" :size="28" />
          </div>

          <span
            class="mt-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
          >
            Passo {{ step.number }}
          </span>

          <h3 class="mt-3 text-lg font-semibold text-foreground">
            {{ step.title }}
          </h3>

          <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
            {{ step.description }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
