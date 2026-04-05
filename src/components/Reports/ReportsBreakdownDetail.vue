<script setup lang="ts">
import ReportsItemDrillDown from "./ReportsItemDrillDown.vue";
import type { IItemDrillDown } from "~/services/analytics/build-category-drill-down";
import type { IBreakdownListItem } from "~/services/analytics/build-breakdown-list";

type IProps = {
  categoryList: IBreakdownListItem[];
  counterpartyList: IBreakdownListItem[];
  categoryDrillDown: IItemDrillDown | null;
  counterpartyDrillDown: IItemDrillDown | null;
  selectedCategoryId: string | null;
  selectedCounterpartyId: string | null;
  onSelectCategory: (id: string | null) => void;
  onSelectCounterparty: (id: string | null) => void;
  loading?: boolean;
};

withDefaults(defineProps<IProps>(), {
  loading: false,
});

const activeTab = ref<"categories" | "counterparties">("categories");

const categoryLabel = {
  plural: "Categorias",
  emptyMessage: "Nenhuma categoria encontrada no período",
};

const counterpartyLabel = {
  plural: "Terceiros",
  emptyMessage: "Nenhum terceiro encontrado no período",
};
</script>

<template>
  <UiCard class="p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-medium text-muted-foreground">
        Detalhamento do Período
      </h3>
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
          Terceiros
        </UiButton>
      </div>
    </div>

    <ReportsItemDrillDown
      v-if="activeTab === 'categories'"
      :item-list="categoryList"
      :drill-down-data="categoryDrillDown"
      :selected-item-id="selectedCategoryId"
      :on-select-item="onSelectCategory"
      :item-label="categoryLabel"
      :loading="loading"
    />
    <ReportsItemDrillDown
      v-else
      :item-list="counterpartyList"
      :drill-down-data="counterpartyDrillDown"
      :selected-item-id="selectedCounterpartyId"
      :on-select-item="onSelectCounterparty"
      :item-label="counterpartyLabel"
      :loading="loading"
    />
  </UiCard>
</template>
