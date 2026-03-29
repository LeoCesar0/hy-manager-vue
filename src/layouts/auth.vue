<script setup lang="ts">
import { APP_NAME } from "~/static/landing";
</script>

<template>
  <div class="auth-layout">
    <div class="auth-bg">
      <div class="auth-orb auth-orb--1" />
      <div class="auth-orb auth-orb--2" />
      <div class="auth-orb auth-orb--3" />
    </div>

    <div class="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <NuxtLink
        to="/"
        class="mb-8 text-2xl font-bold tracking-tight text-foreground transition-opacity hover:opacity-80"
      >
        {{ APP_NAME }}
      </NuxtLink>

      <div class="w-full max-w-md">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-layout {
  position: relative;
  min-height: 100svh;
  overflow: hidden;
  background: var(--background);
}

.auth-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

.auth-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.4;
}

.auth-orb--1 {
  width: 600px;
  height: 600px;
  background: var(--primary);
  top: -200px;
  right: -100px;
  animation: float-1 20s ease-in-out infinite;
}

.auth-orb--2 {
  width: 500px;
  height: 500px;
  background: var(--accent);
  bottom: -150px;
  left: -100px;
  animation: float-2 25s ease-in-out infinite;
}

.auth-orb--3 {
  width: 350px;
  height: 350px;
  background: var(--secondary);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: float-3 18s ease-in-out infinite;
}

@keyframes float-1 {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(-40px, 60px) scale(1.1);
  }
  66% {
    transform: translate(30px, -30px) scale(0.95);
  }
}

@keyframes float-2 {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(50px, -40px) scale(1.05);
  }
  66% {
    transform: translate(-30px, 20px) scale(0.9);
  }
}

@keyframes float-3 {
  0%,
  100% {
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    transform: translate(-50%, -50%) scale(1.15);
  }
}
</style>
