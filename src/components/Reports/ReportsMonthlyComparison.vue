<script setup lang="ts">
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from "lucide-vue-next";
import type { IMonthlyComparison } from "~/services/analytics/compare-months";
import { formatCurrency } from "~/helpers/formatCurrency";

type IProps = {
  comparison: IMonthlyComparison;
  selectedMonths: string[];
  loading?: boolean;
};

const props = withDefaults(defineProps<IProps>(), {
  loading: false,
});

const sortedMonths = computed(() => [...props.selectedMonths].sort());

const formatMonthLabel = (key: string) => {
  const [year, month] = key.split("-");
  const monthNames = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];
  return `${monthNames[parseInt(month!) - 1]} ${year}`;
};

const activeTab = ref<"categories" | "counterparties">("categories");

const displayData = computed(() =>
  activeTab.value === "categories"
    ? props.comparison.categoryDeltas
    : props.comparison.counterpartyDeltas
);

const getChangeColor = (item: typeof displayData.value[number]) => {
  if (item.change === 0 || item.change === null) return "text-muted-foreground";
  const isGood = item.isPositiveExpense ? item.change > 0 : item.change < 0;
  return isGood ? "text-deposit" : "text-expense";
};
</script>

<template>
  <UiCard class="p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-medium text-muted-foreground">Comparação Mensal</h3>
      <div class="flex gap-1">
        <UiButton
          size="sm"
          :variant="activeTab === 'categories' ? 'default' : 'ghost'"
          @click="activeTab = 'categories'"
        >
          Categorias
        </UiButton>
        <UiButton
          size="sm"
          :variant="activeTab === 'counterparties' ? 'default' : 'ghost'"
          @click="activeTab = 'counterparties'"
        >
          Identificadores
        </UiButton>
      </div>
    </div>

    <div v-if="displayData.length === 0" class="flex items-center justify-center py-8">
      <p class="text-sm text-muted-foreground">Sem dados para comparar</p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b">
            <th class="text-left py-2 pr-4 font-medium text-muted-foreground">Nome</th>
            <th
              v-for="month in sortedMonths"
              :key="month"
              class="text-right py-2 px-2 font-medium text-muted-foreground whitespace-nowrap"
            >
              {{ formatMonthLabel(month) }}
            </th>
            <th class="text-right py-2 pl-4 font-medium text-muted-foreground">Variação</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in displayData"
            :key="item.id"
            class="border-b last:border-0 hover:bg-muted/50"
          >
            <td class="py-2 pr-4 font-medium truncate max-w-[200px]">{{ item.name }}</td>
            <td
              v-for="month in sortedMonths"
              :key="month"
              class="text-right py-2 px-2 font-mono text-xs whitespace-nowrap"
            >
              {{ formatCurrency({ amount: item.amounts[month] ?? 0 }) }}
            </td>
            <td class="text-right py-2 pl-4 whitespace-nowrap">
              <div v-if="item.changePercent !== null" class="flex items-center justify-end gap-1">
                <component
                  :is="item.change! > 0 ? ArrowUpIcon : item.change! < 0 ? ArrowDownIcon : MinusIcon"
                  class="h-3 w-3"
                  :class="getChangeColor(item)"
                />
                <span
                  class="text-xs font-mono"
                  :class="getChangeColor(item)"
                >
                  {{ item.changePercent > 0 ? "+" : "" }}{{ item.changePercent.toFixed(1) }}%
                </span>
              </div>
              <span v-else class="text-xs text-muted-foreground">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 pt-4 border-t">
      <div class="grid grid-cols-3 gap-4 text-center">
        <div v-for="month in sortedMonths.slice(-3)" :key="month">
          <p class="text-xs text-muted-foreground">{{ formatMonthLabel(month) }}</p>
          <p class="text-sm font-semibold text-deposit">
            {{ formatCurrency({ amount: comparison.totals.income[month] ?? 0 }) }}
          </p>
          <p class="text-sm font-semibold text-expense">
            {{ formatCurrency({ amount: comparison.totals.expenses[month] ?? 0 }) }}
          </p>
          <!-- Only render the investment line when the user has positive-expense
               activity this month — otherwise the summary grid stays uncluttered
               for accounts without investment categories. -->
          <p
            v-if="(comparison.totals.positiveExpenses[month] ?? 0) > 0"
            class="text-xs text-muted-foreground mt-0.5"
          >
            + {{ formatCurrency({ amount: comparison.totals.positiveExpenses[month] ?? 0 }) }} inv
          </p>
        </div>
      </div>
    </div>
  </UiCard>
</template>
