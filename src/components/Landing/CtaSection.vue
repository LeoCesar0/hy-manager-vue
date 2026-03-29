<script setup lang="ts">
import { LANDING_CTA } from "~/static/landing";
</script>

<template>
  <section class="py-20 sm:py-28">
    <div class="mx-auto max-w-6xl px-6">
      <div class="cta-card relative overflow-hidden rounded-3xl px-8 py-16 text-center sm:px-16">
        <div class="cta-orb cta-orb--1" />
        <div class="cta-orb cta-orb--2" />

        <div class="relative z-10">
          <h2 class="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {{ LANDING_CTA.title }}
          </h2>
          <p class="mx-auto mt-4 max-w-lg text-lg text-muted-foreground">
            {{ LANDING_CTA.subtitle }}
          </p>
          <div class="mt-8">
            <NuxtLink to="/sign-up">
              <UiButton size="lg" class="min-w-[200px] text-base">
                {{ LANDING_CTA.button }}
              </UiButton>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cta-card {
  background: color-mix(in oklch, var(--card) 70%, transparent);
  backdrop-filter: blur(24px);
  border: 1px solid color-mix(in oklch, var(--border) 50%, transparent);
}

.cta-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.2;
}

.cta-orb--1 {
  width: 300px;
  height: 300px;
  background: var(--primary);
  top: -100px;
  right: -50px;
}

.cta-orb--2 {
  width: 250px;
  height: 250px;
  background: var(--accent);
  bottom: -80px;
  left: -30px;
}
</style>
