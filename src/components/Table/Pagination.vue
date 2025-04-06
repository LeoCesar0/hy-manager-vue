<script setup lang="ts">
import {
  Pagination,
  PaginationEllipsis,
  PaginationFirst,
  PaginationLast,
  PaginationList,
  PaginationListItem,
  PaginationNext,
  PaginationPrev,
} from "@/components/ui/pagination";
import type { IPaginationBody } from "@common/schemas/pagination";
import type { IPaginationResult } from "@common/schemas/pagination";

type Props = {
  paginationBody: IPaginationBody<any>;
  paginationResult: IPaginationResult<any>;
  isLoading?: boolean;
};

const props = defineProps<Props>();
</script>

<template>
  <Pagination
    v-model:page="paginationBody.page"
    :items-per-page="paginationBody.limit || 10"
    :total="paginationResult.totalItems"
    :sibling-count="1"
    show-edges
    :default-page="1"
    :is-loading="isLoading"
  >
    <PaginationList v-slot="{ items }" class="flex items-center gap-1">
      <PaginationFirst />
      <PaginationPrev />
      <template v-for="(item, index) in items">
        <PaginationListItem
          v-if="item.type === 'page'"
          :key="index"
          :value="item.value"
          as-child
        >
          <UiButton
            class="w-10 h-10 p-0"
            :variant="
              item.value === paginationBody.page ? 'default' : 'outline'
            "
            :disabled="isLoading"
          >
            {{ item.value }}
          </UiButton>
        </PaginationListItem>
        <PaginationEllipsis v-else :key="item.type" :index="index" />
      </template>
      <PaginationNext />
      <PaginationLast />
    </PaginationList>
  </Pagination>
</template>
