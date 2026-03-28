<script setup lang="ts">
import { ArrowDownIcon, ArrowUpIcon, CalendarIcon } from "lucide-vue-next";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import type { ICategory } from "~/@schemas/models/category";
import type { UncategorizedCounterpartyItem } from "~/composables/useUncategorizedCounterparties";
import CategorySelect from "~/components/Categories/CategorySelect.vue";
import { formatCurrency } from "~/helpers/formatCurrency";
import { formatDate } from "~/helpers/formatDate";

type IProps = {
  counterparty: ICounterparty;
  stats: UncategorizedCounterpartyItem["stats"];
  categories: ICategory[];
  selectedCategoryIds: string[];
  disabled?: boolean;
  onCategoryChange: (counterpartyId: string, categoryIds: string[]) => void;
};

const props = defineProps<IProps>();

const totalTransactions = computed(() => props.stats.depositCount + props.stats.expenseCount);

const handleChange = (categoryIds: string[]) => {
  props.onCategoryChange(props.counterparty.id, categoryIds);
};
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border rounded-lg">
    <div class="flex-1 min-w-0">
      <p class="font-medium truncate">{{ counterparty.name }}</p>

      <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mt-1">
        <span v-if="stats.expenseCount > 0" class="flex items-center gap-1">
          <ArrowDownIcon class="h-3.5 w-3.5 text-expense" />
          <span class="text-expense font-medium">{{ formatCurrency({ amount: stats.expenseTotal }) }}</span>
          <span>({{ stats.expenseCount }})</span>
        </span>

        <span v-if="stats.depositCount > 0" class="flex items-center gap-1">
          <ArrowUpIcon class="h-3.5 w-3.5 text-deposit" />
          <span class="text-deposit font-medium">{{ formatCurrency({ amount: stats.depositTotal }) }}</span>
          <span>({{ stats.depositCount }})</span>
        </span>

        <span class="text-xs">
          {{ totalTransactions }} transaç{{ totalTransactions === 1 ? "ão" : "ões" }}
        </span>

        <span v-if="stats.lastTransactionDate" class="flex items-center gap-1 text-xs">
          <CalendarIcon class="h-3 w-3" />
          {{ formatDate(stats.lastTransactionDate) }}
        </span>
      </div>
    </div>

    <div class="sm:w-72">
      <CategorySelect
        :categories="categories"
        :model-value="selectedCategoryIds"
        placeholder="Selecione categorias"
        :disabled="disabled"
        @update:model-value="handleChange"
      />
    </div>
  </div>
</template>
