<script setup lang="ts">
type IProps = {
  loading?: boolean;
  notFound?: boolean;
  notFoundTitle?: string;
  notFoundDescription?: string;
};

const props = withDefaults(defineProps<IProps>(), {
  loading: false,
  notFound: false,
  notFoundTitle: "Item não encontrado",
  notFoundDescription: "O item que você está procurando não existe.",
});
</script>

<template>
  <div>
    <div v-if="loading" class="flex items-center justify-center py-12">
      <Loading :is-loading="true" size="lg" />
    </div>

    <UiCard v-else-if="!notFound" class="p-6">
      <div class="space-y-6">
        <slot name="header" />

        <UiSeparator />

        <slot name="content" />
      </div>
    </UiCard>

    <div v-else class="flex items-center justify-center py-12">
      <UiEmpty :title="notFoundTitle" :description="notFoundDescription">
        <slot name="not-found-action" />
      </UiEmpty>
    </div>
  </div>
</template>
