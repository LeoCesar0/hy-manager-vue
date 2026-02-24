<script setup lang="ts">
import { PlusIcon } from "lucide-vue-next";

type IProps = {
  title: string;
  description: string;
  showCreateButton?: boolean;
  createButtonLabel?: string;
  onCreate?: () => void;
};

const props = withDefaults(defineProps<IProps>(), {
  showCreateButton: true,
  createButtonLabel: "Criar",
});
</script>

<template>
  <div class="flex items-center justify-center py-12">
    <UiEmpty :title="title" :description="description">
      <slot>
        <UiButton v-if="showCreateButton" @click="onCreate">
          <PlusIcon class="h-4 w-4 mr-2" />
          {{ createButtonLabel }}
        </UiButton>
      </slot>
    </UiEmpty>
  </div>
</template>
