<script setup lang="ts">
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-vue-next";

type IProps = {
  hasPrev: boolean;
  hasNext: boolean;
  count: number;
  pageIndex: number;
  limit: number;
  isLoading?: boolean;
  onPrev: () => void;
  onNext: () => void;
};

const props = defineProps<IProps>();

const rangeStart = computed(() =>
  props.count === 0 ? 0 : (props.pageIndex - 1) * props.limit + 1
);
const rangeEnd = computed(() => Math.min(props.pageIndex * props.limit, props.count));
</script>

<template>
  <div class="flex items-center justify-between gap-4">
    <span class="text-sm text-muted-foreground">
      <template v-if="count === 0">Nenhum resultado</template>
      <template v-else>Mostrando {{ rangeStart }}–{{ rangeEnd }} de {{ count }}</template>
    </span>

    <div class="flex items-center gap-2">
      <UiButton
        variant="outline"
        size="sm"
        :disabled="!hasPrev || isLoading"
        @click="onPrev"
      >
        <ChevronLeftIcon class="h-4 w-4 mr-1" />
        Anterior
      </UiButton>
      <UiButton
        variant="outline"
        size="sm"
        :disabled="!hasNext || isLoading"
        @click="onNext"
      >
        Próximo
        <ChevronRightIcon class="h-4 w-4 ml-1" />
      </UiButton>
    </div>
  </div>
</template>
