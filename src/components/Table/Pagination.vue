<script setup lang="ts">
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type { IPaginationBody, IPaginationResult } from "~/@types/pagination";

type Props = {
  paginationBody: IPaginationBody;
  paginationResult: IPaginationResult<any>;
  isLoading?: boolean;
};

const props = defineProps<Props>();
</script>

<template>
  <Pagination
    v-model:page="paginationBody.page"
    :items-per-page="paginationBody.limit || 10"
    :total="paginationResult.count"
    :sibling-count="1"
    show-edges
    :default-page="1"
  >
    <PaginationContent v-slot="{ items }" class="flex items-center gap-1">
      <PaginationFirst />
      <PaginationPrevious />
      <template v-for="(item, index) in items">
        <PaginationItem
          v-if="item.type === 'page'"
          :key="index"
          :value="item.value"
          :is-active="item.value === paginationBody.page"
        >
          {{ item.value }}
        </PaginationItem>
        <PaginationEllipsis v-else :key="item.type" :index="index" />
      </template>
      <PaginationNext />
      <PaginationLast />
    </PaginationContent>
  </Pagination>
</template>
