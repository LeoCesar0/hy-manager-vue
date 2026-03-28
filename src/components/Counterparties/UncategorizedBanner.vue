<script setup lang="ts">
import { AlertCircleIcon } from "lucide-vue-next";
import { ROUTE } from "~/static/routes";

type IProps = {
  count: number;
};

defineProps<IProps>();
</script>

<template>
  <UiAlert v-if="count > 0" variant="destructive">
    <AlertCircleIcon class="h-4 w-4" />
    <UiAlertTitle>Terceiros sem categoria</UiAlertTitle>
    <UiAlertDescription>
      Você tem {{ count }} terceiro{{ count > 1 ? "s" : "" }} sem categoria.
      <NuxtLink
        :to="ROUTE.categorizarCounterparties.path()"
        class="underline font-medium hover:text-foreground"
      >
        Categorizar agora
      </NuxtLink>
    </UiAlertDescription>
  </UiAlert>
</template>
