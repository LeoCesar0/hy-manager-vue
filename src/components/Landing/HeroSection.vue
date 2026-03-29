<script setup lang="ts">
import { LANDING_HERO } from "~/static/landing";
</script>

<template>
  <section class="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
    <div class="hero-bg">
      <div class="hero-orb hero-orb--1" />
      <div class="hero-orb hero-orb--2" />
    </div>

    <div class="relative z-10 mx-auto max-w-6xl px-6 text-center">
      <h1
        class="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl"
      >
        {{ LANDING_HERO.title }}
        <span class="text-primary">{{ LANDING_HERO.titleHighlight }}</span>
      </h1>

      <p
        class="mx-auto mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl"
      >
        {{ LANDING_HERO.subtitle }}
      </p>

      <div class="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <NuxtLink to="/sign-up">
          <UiButton size="lg" class="min-w-[180px] text-base">
            {{ LANDING_HERO.ctaPrimary }}
          </UiButton>
        </NuxtLink>
        <NuxtLink to="/sign-in">
          <UiButton variant="outline" size="lg" class="min-w-[180px] text-base">
            {{ LANDING_HERO.ctaSecondary }}
          </UiButton>
        </NuxtLink>
      </div>

      <div class="mx-auto mt-16 max-w-2xl">
        <div class="glass-card rounded-2xl p-6 sm:p-8">
          <div class="grid grid-cols-3 gap-4">
            <div
              v-for="i in 3"
              :key="i"
              class="glass-bar rounded-lg"
              :style="{ height: `${40 + Math.random() * 60}px` }"
            />
          </div>
          <div class="mt-4 space-y-3">
            <div class="glass-line h-3 w-3/4 rounded-full" />
            <div class="glass-line h-3 w-1/2 rounded-full" />
            <div class="glass-line h-3 w-2/3 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 0;
}

.hero-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.25;
}

.hero-orb--1 {
  width: 500px;
  height: 500px;
  background: var(--primary);
  top: -100px;
  left: -100px;
  animation: hero-float-1 22s ease-in-out infinite;
}

.hero-orb--2 {
  width: 400px;
  height: 400px;
  background: var(--accent);
  bottom: -50px;
  right: -50px;
  animation: hero-float-2 18s ease-in-out infinite;
}

@keyframes hero-float-1 {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(40px, 30px) scale(1.1);
  }
}

@keyframes hero-float-2 {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(-30px, -20px) scale(1.05);
  }
}

.glass-card {
  background: color-mix(in oklch, var(--card) 60%, transparent);
  backdrop-filter: blur(20px);
  border: 1px solid color-mix(in oklch, var(--border) 50%, transparent);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 color-mix(in oklch, var(--background) 30%, transparent);
}

.glass-bar {
  background: linear-gradient(
    to top,
    color-mix(in oklch, var(--primary) 30%, transparent),
    color-mix(in oklch, var(--primary) 15%, transparent)
  );
  border: 1px solid color-mix(in oklch, var(--primary) 20%, transparent);
}

.glass-line {
  background: color-mix(in oklch, var(--muted) 80%, transparent);
}
</style>
