<script setup lang="ts">
import { ChevronRightIcon } from "lucide-vue-next";
import LineChart from "~/components/Charts/LineChart.vue";
import { formatCurrency } from "~/helpers/formatCurrency";
import { CATEGORY_PRESET_COLORS } from "~/static/category-colors";
import type { IItemDrillDown } from "~/services/analytics/build-category-drill-down";
import type { IBreakdownListItem } from "~/services/analytics/build-breakdown-list";

type IProps = {
  // List of items to show in the "browse" state. Already capped to top N
  // upstream in the composable.
  itemList: IBreakdownListItem[];
  drillDownData: IItemDrillDown | null;
  selectedItemId: string | null;
  onSelectItem: (id: string | null) => void;
  // Drives all user-facing labels so this component can render either a
  // category or counterparty drill-down without branching.
  itemLabel: {
    // e.g. "Categorias" (plural, used in empty-state message)
    plural: string;
    // e.g. "entradas" / "saídas" labels are fixed; only the noun varies
    emptyMessage: string;
  };
  loading?: boolean;
};

const props = withDefaults(defineProps<IProps>(), {
  loading: false,
});

const drillDownSeries = [
  { key: "expenses", label: "Saídas", color: "var(--expense)" },
  { key: "deposits", label: "Entradas", color: "var(--deposit)" },
];

const getItemColor = (item: IBreakdownListItem, index: number) => {
  return item.color || CATEGORY_PRESET_COLORS[index % CATEGORY_PRESET_COLORS.length]!;
};

// Net amount is colored by sign: green when the item earned money, red when
// it cost money, muted-neutral when it zeroed out. Intl.NumberFormat handles
// the minus sign on negatives — we prepend a "+" for positives so the sign
// is always explicit and reads consistently in the list.
const netColorClass = (net: number) => {
  if (net > 0) return "text-deposit";
  if (net < 0) return "text-expense";
  return "text-muted-foreground";
};

const formatNet = (amount: number) => {
  const formatted = formatCurrency({ amount });
  return amount > 0 ? `+${formatted}` : formatted;
};

// Only show the expense/deposit sub-line when the item actually has *both*
// sides. For pure items it would just repeat the net and add visual noise.
const isMixed = (item: IBreakdownListItem) =>
  item.expenseTotal > 0 && item.depositTotal > 0;
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <UiButton
          v-if="selectedItemId"
          size="sm"
          variant="ghost"
          @click="onSelectItem(null)"
        >
          Voltar
        </UiButton>
      </div>
    </div>

    <div
      v-if="itemList.length === 0 && !loading"
      class="flex items-center justify-center py-8"
    >
      <p class="text-sm text-muted-foreground">{{ itemLabel.emptyMessage }}</p>
    </div>

    <div v-else-if="!selectedItemId" class="space-y-1">
      <button
        v-for="(item, index) in itemList"
        :key="item.id"
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left"
        @click="onSelectItem(item.id)"
      >
        <div
          class="h-3 w-3 shrink-0 rounded-sm"
          :style="{ backgroundColor: getItemColor(item, index) }"
        />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate">{{ item.name }}</p>
          <p
            v-if="isMixed(item)"
            class="text-[0.65rem] font-mono mt-0.5 flex items-center gap-1.5"
          >
            <span class="text-deposit">
              +{{ formatCurrency({ amount: item.depositTotal }) }}
            </span>
            <span class="text-muted-foreground/50">·</span>
            <span class="text-expense">
              -{{ formatCurrency({ amount: item.expenseTotal }) }}
            </span>
          </p>
        </div>
        <span
          class="text-sm font-mono font-medium shrink-0"
          :class="netColorClass(item.netTotal)"
        >
          {{ formatNet(item.netTotal) }}
        </span>
        <ChevronRightIcon class="h-4 w-4 text-muted-foreground shrink-0" />
      </button>
    </div>

    <div v-else-if="drillDownData" class="space-y-4">
      <div class="flex items-center gap-2">
        <div
          class="h-3 w-3 rounded-sm"
          :style="{ backgroundColor: drillDownData.item?.color ?? 'var(--primary)' }"
        />
        <span class="font-semibold">
          {{ drillDownData.item?.name ?? "Desconhecido" }}
        </span>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1">
          <p class="text-xs text-muted-foreground">Saídas (histórico)</p>
          <p class="text-lg font-semibold text-expense">
            {{ formatCurrency({ amount: drillDownData.totalExpense }) }}
          </p>
          <p class="text-xs text-muted-foreground">
            {{ drillDownData.percentOfExpenses.toFixed(1) }}% do total de saídas
          </p>
        </div>
        <div class="space-y-1">
          <p class="text-xs text-muted-foreground">Entradas (histórico)</p>
          <p class="text-lg font-semibold text-deposit">
            {{ formatCurrency({ amount: drillDownData.totalDeposit }) }}
          </p>
          <p class="text-xs text-muted-foreground">
            {{ drillDownData.percentOfDeposits.toFixed(1) }}% do total de entradas
          </p>
        </div>
      </div>

      <LineChart
        title="Tendência Mensal"
        :data="drillDownData.monthlyData"
        :series="drillDownSeries"
        :loading="loading"
      />
    </div>
  </div>
</template>
