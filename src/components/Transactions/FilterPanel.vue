<script setup lang="ts">
import { FilterIcon, XIcon } from "lucide-vue-next";
import type { ICategory } from "~/@schemas/models/category";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import type { Timestamp } from "firebase/firestore";
import SearchInput from "~/components/Dashboard/SearchInput.vue";
import DatePicker from "~/components/Form/Field/DatePicker.vue";
import CategorySelect from "~/components/Categories/CategorySelect.vue";
import {
  DATE_RANGE_PRESETS,
  type IDateRangePresetKey,
} from "~/helpers/dateRangePresets";

type IFilters = {
  startDate: Timestamp | null;
  endDate: Timestamp | null;
  type: 'deposit' | 'expense' | null;
  categoryIds: string[];
  counterpartyId: string | null;
  search: string;
};

type IProps = {
  modelValue: IFilters;
  categories: ICategory[];
  counterparties: ICounterparty[];
  hiddenFilters?: string[];
};

const props = defineProps<IProps>();

type IEmits = {
  'update:modelValue': [value: IFilters];
  apply: [];
  clear: [];
};

const emit = defineEmits<IEmits>();

const isExpanded = ref(false);
// Tracks which preset button is currently active so we can highlight it and
// show/hide the manual date pickers. null = "Personalizado" (manual pickers
// visible). Starts at null so existing filter state isn't clobbered on mount.
const activePresetKey = ref<IDateRangePresetKey | null>(null);

const localFilters = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const updateFilter = (key: keyof IFilters, value: any) => {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
};

const handleSelectPreset = (key: IDateRangePresetKey) => {
  activePresetKey.value = key;
  const preset = DATE_RANGE_PRESETS.find((p) => p.key === key);
  if (!preset) return;

  const range = preset.getRange();
  if (range === null) {
    // "Personalizado" — leave current start/end untouched and let the manual
    // pickers drive the range from here.
    return;
  }

  // Emit both dates in a single update so the parent sees one coherent state
  // change instead of two partial ones.
  emit('update:modelValue', {
    ...props.modelValue,
    startDate: range.start,
    endDate: range.end,
  });
};

// Changing a manual picker deselects any active preset — the user is now in
// custom-range mode. Keeps the UI state honest about which mode is active.
// Value type mirrors DatePicker's emit signature (Timestamp | Date | string |
// number | undefined) — downstream consumers normalize it.
const handleManualDateChange = (
  key: 'startDate' | 'endDate',
  value: Timestamp | Date | string | number | undefined,
) => {
  activePresetKey.value = 'custom';
  updateFilter(key, value);
};

const isFilterHidden = (key: string) => props.hiddenFilters?.includes(key);

const hasActiveFilters = computed(() => {
  return !!(
    props.modelValue.startDate ||
    props.modelValue.endDate ||
    props.modelValue.type ||
    props.modelValue.categoryIds.length > 0 ||
    (!isFilterHidden('counterparty') && props.modelValue.counterpartyId) ||
    props.modelValue.search
  );
});

const handleClear = () => {
  activePresetKey.value = null;
  emit('update:modelValue', {
    startDate: null,
    endDate: null,
    type: null,
    categoryIds: [],
    counterpartyId: isFilterHidden('counterparty') ? props.modelValue.counterpartyId : null,
    search: '',
  });
  emit('clear');
};

const handleApply = () => {
  emit('apply');
  isExpanded.value = false;
};

</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-2">
      <SearchInput
        :model-value="localFilters.search"
        @update:model-value="(value) => updateFilter('search', value)"
        placeholder="Buscar por descrição..."
        max-width="max-w-md"
      />

      <UiButton
        variant="outline"
        @click="isExpanded = !isExpanded"
        :class="hasActiveFilters ? 'border-primary' : ''"
      >
        <FilterIcon class="h-4 w-4 mr-2" />
        Filtros
        <span v-if="hasActiveFilters" class="ml-2 h-2 w-2 rounded-full bg-primary" />
      </UiButton>

      <UiButton
        v-if="hasActiveFilters"
        variant="ghost"
        size="icon"
        @click="handleClear"
        title="Limpar filtros"
      >
        <XIcon class="h-4 w-4" />
      </UiButton>
    </div>

    <UiCard v-if="isExpanded" class="p-4 space-y-4">
      <!-- Preset row — one click sets both startDate and endDate together,
           removing the need to navigate two calendars for common periods
           like "this month" or "last 30 days". "Personalizado" keeps the
           manual pickers as the escape hatch for arbitrary ranges. -->
      <div class="space-y-2">
        <label class="text-sm font-medium">Período</label>
        <div class="flex flex-wrap gap-2">
          <UiButton
            v-for="preset in DATE_RANGE_PRESETS"
            :key="preset.key"
            type="button"
            size="sm"
            :variant="activePresetKey === preset.key ? 'default' : 'outline'"
            @click="handleSelectPreset(preset.key)"
          >
            {{ preset.label }}
          </UiButton>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div class="space-y-2">
          <label class="text-sm font-medium">Data Início</label>
          <DatePicker
            :model-value="localFilters.startDate ?? undefined"
            @update:model-value="(value) => handleManualDateChange('startDate', value)"
            class="max-w-full"
          />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Data Fim</label>
          <DatePicker
            :model-value="localFilters.endDate ?? undefined"
            @update:model-value="(value) => handleManualDateChange('endDate', value)"
            class="max-w-full"
          />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Tipo</label>
          <UiSelect
            :model-value="localFilters.type || 'all'"
            @update:model-value="(v) => updateFilter('type', v === 'all' ? null : v)"
          >
            <UiSelectTrigger class="w-full">
              <UiSelectValue placeholder="Todos" />
            </UiSelectTrigger>
            <UiSelectContent>
              <UiSelectItem value="all">Todos</UiSelectItem>
              <UiSelectItem value="deposit">Entradas</UiSelectItem>
              <UiSelectItem value="expense">Saídas</UiSelectItem>
            </UiSelectContent>
          </UiSelect>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Categoria</label>
          <CategorySelect
            :categories="categories"
            :model-value="localFilters.categoryIds"
            @update:model-value="(value) => updateFilter('categoryIds', value)"
          />
        </div>

        <div v-if="!isFilterHidden('counterparty')" class="space-y-2">
          <label class="text-sm font-medium">Identificador</label>
          <UiSelect
            :model-value="localFilters.counterpartyId || 'all'"
            @update:model-value="(v) => updateFilter('counterpartyId', v === 'all' ? null : v)"
          >
            <UiSelectTrigger class="w-full">
              <UiSelectValue placeholder="Todos" />
            </UiSelectTrigger>
            <UiSelectContent>
              <UiSelectItem value="all">Todos</UiSelectItem>
              <UiSelectItem
                v-for="counterparty in counterparties"
                :key="counterparty.id"
                :value="counterparty.id"
              >
                {{ counterparty.name }}
              </UiSelectItem>
            </UiSelectContent>
          </UiSelect>
        </div>
      </div>

      <div class="flex justify-end gap-2 mt-4">
        <UiButton variant="outline" @click="handleClear">
          Limpar
        </UiButton>
        <UiButton @click="handleApply">
          Aplicar Filtros
        </UiButton>
      </div>
    </UiCard>
  </div>
</template>
