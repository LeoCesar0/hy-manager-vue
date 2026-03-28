<script setup lang="ts">
import { ArrowDownIcon, ArrowUpIcon, CalendarIcon, EditIcon } from "lucide-vue-next";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import type { ITransaction } from "~/@schemas/models/transaction";
import type { ICategory } from "~/@schemas/models/category";
import type { CounterpartyCategorizationItem } from "~/composables/useCounterpartiesCategorization";
import CategorySelect from "~/components/Categories/CategorySelect.vue";
import { formatCurrency } from "~/helpers/formatCurrency";
import { formatDate } from "~/helpers/formatDate";
import { getTransactionColor } from "~/helpers/getTransactionColor";
import { getCategoryIcon } from "~/static/category-icons";

type IProps = {
  counterparty: ICounterparty;
  stats: CounterpartyCategorizationItem["stats"];
  transactions: ITransaction[];
  categories: ICategory[];
  selectedCategoryIds: string[];
  disabled?: boolean;
  onCategoryChange: (counterpartyId: string, categoryIds: string[]) => void;
  /** 'assign' always shows CategorySelect; 'view' shows badges with optional inline edit */
  mode: "assign" | "view";
  isEditing?: boolean;
  onEdit?: (counterpartyId: string) => void;
};

const props = defineProps<IProps>();

const PREVIEW_LIMIT = 5;

const totalTransactions = computed(() => props.stats.depositCount + props.stats.expenseCount);
const previewTransactions = computed(() => props.transactions.slice(0, PREVIEW_LIMIT));
const remainingCount = computed(() => Math.max(0, props.transactions.length - PREVIEW_LIMIT));

const showCategorySelect = computed(() => props.mode === "assign" || props.isEditing);

const resolvedCategories = computed(() => {
  return props.counterparty.categoryIds
    .map((id) => props.categories.find((c) => c.id === id))
    .filter(Boolean) as ICategory[];
});

const handleChange = (categoryIds: string[]) => {
  props.onCategoryChange(props.counterparty.id, categoryIds);
};
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border rounded-lg">
    <div class="flex-1 min-w-0">
      <p class="font-medium truncate">{{ counterparty.name }}</p>

      <UiHoverCard :open-delay="300">
        <UiHoverCardTrigger as-child>
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mt-1 cursor-default">
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
        </UiHoverCardTrigger>

        <UiHoverCardContent class="w-80 p-0" side="bottom" align="start">
          <div class="px-3 py-2 border-b">
            <p class="text-sm font-medium">Últimas transações</p>
          </div>
          <div class="divide-y max-h-64 overflow-y-auto">
            <div
              v-for="tx in previewTransactions"
              :key="tx.id"
              class="flex items-center justify-between gap-2 px-3 py-2 text-sm"
            >
              <div class="flex-1 min-w-0">
                <p class="truncate text-foreground">{{ tx.description }}</p>
                <p class="text-xs text-muted-foreground">{{ formatDate(tx.date) }}</p>
              </div>
              <span :class="getTransactionColor({ type: tx.type })" class="font-medium whitespace-nowrap">
                {{ tx.type === 'deposit' ? '+' : '-' }}{{ formatCurrency({ amount: Math.abs(tx.amount) }) }}
              </span>
            </div>
          </div>
          <div v-if="remainingCount > 0" class="px-3 py-2 border-t text-xs text-muted-foreground text-center">
            e mais {{ remainingCount }} transaç{{ remainingCount === 1 ? "ão" : "ões" }}
          </div>
        </UiHoverCardContent>
      </UiHoverCard>

      <!-- Category badges in view mode (when not editing) -->
      <div v-if="mode === 'view' && !isEditing && resolvedCategories.length" class="flex flex-wrap gap-1 mt-2">
        <UiBadge
          v-for="cat in resolvedCategories"
          :key="cat.id"
          variant="secondary"
          class="text-xs"
        >
          {{ cat.icon ? getCategoryIcon(cat.icon) : '' }} {{ cat.name }}
        </UiBadge>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <div v-if="showCategorySelect" class="sm:w-72">
        <CategorySelect
          :categories="categories"
          :model-value="selectedCategoryIds"
          placeholder="Selecione categorias"
          :disabled="disabled"
          @update:model-value="handleChange"
        />
      </div>
      <UiButton
        v-if="mode === 'view' && !isEditing"
        variant="ghost"
        size="icon"
        title="Editar categorias"
        @click="onEdit?.(counterparty.id)"
      >
        <EditIcon class="h-4 w-4" />
      </UiButton>
    </div>
  </div>
</template>
