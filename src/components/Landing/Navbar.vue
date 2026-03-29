<script setup lang="ts">
import { APP_NAME, LANDING_HERO } from "~/static/landing";
import { MenuIcon, XIcon } from "lucide-vue-next";

const scrolled = ref(false);
const mobileMenuOpen = ref(false);

function handleScroll() {
  scrolled.value = window.scrollY > 20;
}

onMounted(() => {
  window.addEventListener("scroll", handleScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<template>
  <nav
    class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
    :class="[
      scrolled
        ? 'bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm'
        : 'bg-transparent',
    ]"
  >
    <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
      <NuxtLink to="/" class="text-xl font-bold tracking-tight text-foreground">
        {{ APP_NAME }}
      </NuxtLink>

      <div class="hidden items-center gap-3 sm:flex">
        <NuxtLink to="/sign-in">
          <UiButton variant="ghost" size="sm">
            {{ LANDING_HERO.ctaSecondary }}
          </UiButton>
        </NuxtLink>
        <NuxtLink to="/sign-up">
          <UiButton size="sm">
            {{ LANDING_HERO.ctaPrimary }}
          </UiButton>
        </NuxtLink>
      </div>

      <button
        class="sm:hidden text-foreground"
        @click="mobileMenuOpen = !mobileMenuOpen"
      >
        <MenuIcon v-if="!mobileMenuOpen" :size="24" />
        <XIcon v-else :size="24" />
      </button>
    </div>

    <Transition name="mobile-menu">
      <div
        v-if="mobileMenuOpen"
        class="sm:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl px-6 py-4 space-y-2"
      >
        <NuxtLink to="/sign-in" class="block" @click="mobileMenuOpen = false">
          <UiButton variant="ghost" class="w-full justify-start">
            {{ LANDING_HERO.ctaSecondary }}
          </UiButton>
        </NuxtLink>
        <NuxtLink to="/sign-up" class="block" @click="mobileMenuOpen = false">
          <UiButton class="w-full">
            {{ LANDING_HERO.ctaPrimary }}
          </UiButton>
        </NuxtLink>
      </div>
    </Transition>
  </nav>
</template>

<style scoped>
.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: all 0.2s ease;
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
