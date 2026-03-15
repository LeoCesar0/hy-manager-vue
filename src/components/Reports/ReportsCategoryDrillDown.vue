<script setup lang="ts">
import { ChevronRightIcon } from "lucide-vue-next";
import LineChart from "~/components/Charts/LineChart.vue";
import { formatCurrency } from "~/helpers/formatCurrency";
import { CATEGORY_PRESET_COLORS } from "~/static/category-colors";

type CategoryItem = {
  id: string;
  name: string;
  total: number;
  color: string | null;
};

type DrillDownData = {
  category: { id: string; name: string; color?: string | null } | undefined;
  monthlyData: { label: string; expenses: number; deposits: number; total: number }[];
  totalExpense: number;
  totalDeposit: number;
  percentOfExpenses: number;
  percentOfDeposits: number;
} | null;

type IProps = {
  categoryList: CategoryItem[];
  drillDownData: DrillDownData;
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  loading?: boolean;
};

const props = withDefaults(defineProps<IProps>(), {
  loading: false,
});

const drillDownSeries = [
  { key: "expenses", label: "Saídas", color: "var(--expense)" },
  { key: "deposits", label: "Entradas", color: "var(--deposit)" },
];

const getCategoryColor = (item: CategoryItem, index: number) => {
  return item.color || CATEGORY_PRESET_COLORS[index % CATEGORY_PRESET_COLORS.length]!;
};
</script>

<template>
  <UiCard class="p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-medium text-muted-foreground">Categorias no Período</h3>
      <UiButton
        v-if="selectedCategoryId"
        size="sm"
        variant="ghost"
        @click="onSelectCategory(null)"
      >
        Voltar
      </UiButton>
    </div>

    <div v-if="categoryList.length === 0 && !loading" class="flex items-center justify-center py-8">
      <p class="text-sm text-muted-foreground">Nenhuma categoria encontrada no período</p>
    </div>

    <div v-else-if="!selectedCategoryId" class="space-y-1">
      <button
        v-for="(item, index) in categoryList"
        :key="item.id"
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left"
        @click="onSelectCategory(item.id)"
      >
        <div
          class="h-3 w-3 shrink-0 rounded-sm"
          :style="{ backgroundColor: getCategoryColor(item, index) }"
        />
        <span class="flex-1 text-sm font-medium truncate">{{ item.name }}</span>
        <span class="text-sm font-mono text-muted-foreground">
          {{ formatCurrency({ amount: item.total }) }}
        </span>
        <ChevronRightIcon class="h-4 w-4 text-muted-foreground shrink-0" />
      </button>
    </div>

    <div v-else-if="drillDownData" class="space-y-4">
      <div class="flex items-center gap-2">
        <div
          class="h-3 w-3 rounded-sm"
          :style="{ backgroundColor: drillDownData.category?.color ?? 'var(--primary)' }"
        />
        <span class="font-semibold">{{ drillDownData.category?.name ?? "Desconhecido" }}</span>
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
        </div>
      </div>

      <LineChart
        title="Tendência Mensal"
        :data="drillDownData.monthlyData"
        :series="drillDownSeries"
        :loading="loading"
      />
    </div>
  </UiCard>
</template>
