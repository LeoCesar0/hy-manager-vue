<script setup lang="ts">
import { APP_NAME, LANDING_FOOTER } from "~/static/landing";
</script>

<template>
  <footer class="border-t border-border/50 py-12">
    <div class="mx-auto max-w-6xl px-6">
      <div class="flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div class="text-center sm:text-left">
          <NuxtLink to="/" class="text-lg font-bold tracking-tight text-foreground">
            {{ APP_NAME }}
          </NuxtLink>
          <p class="mt-2 max-w-xs text-sm text-muted-foreground">
            {{ LANDING_FOOTER.description }}
          </p>
        </div>

        <div
          v-for="section in LANDING_FOOTER.sections"
          :key="section.title"
          class="text-center sm:text-left"
        >
          <h4 class="text-sm font-semibold text-foreground">
            {{ section.title }}
          </h4>
          <ul class="mt-3 space-y-2">
            <li v-for="link in section.links" :key="link.label">
              <a
                :href="link.href"
                class="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {{ link.label }}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div class="mt-10 border-t border-border/50 pt-6 text-center space-y-2">
        <p class="text-xs text-muted-foreground">
          {{ LANDING_FOOTER.copyright }}
        </p>
        <AppVersionLabel />
      </div>
    </div>
  </footer>
</template>
