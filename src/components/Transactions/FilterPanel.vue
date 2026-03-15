<script setup lang="ts">
import { FilterIcon, XIcon } from "lucide-vue-next";
import type { ICategory } from "~/@schemas/models/category";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import type { Timestamp } from "firebase/firestore";
import SearchInput from "~/components/Dashboard/SearchInput.vue";
import DatePicker from "~/components/Form/Field/DatePicker.vue";
import { getCategoryIcon } from "~/static/category-icons";

type IFilters = {
  startDate: Timestamp | null;
  endDate: Timestamp | null;
  type: 'deposit' | 'expense' | null;
  categoryId: string | null;
  counterpartyId: string | null;
  search: string;
};

type IProps = {
  modelValue: IFilters;
  categories: ICategory[];
  counterparties: ICounterparty[];
};

const props = defineProps<IProps>();

type IEmits = {
  'update:modelValue': [value: IFilters];
  apply: [];
  clear: [];
};

const emit = defineEmits<IEmits>();

const isExpanded = ref(false);

const localFilters = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const updateFilter = (key: keyof IFilters, value: any) => {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
};

const hasActiveFilters = computed(() => {
  return !!(
    props.modelValue.startDate ||
    props.modelValue.endDate ||
    props.modelValue.type ||
    props.modelValue.categoryId ||
    props.modelValue.counterpartyId ||
    props.modelValue.search
  );
});

const handleClear = () => {
  emit('update:modelValue', {
    startDate: null,
    endDate: null,
    type: null,
    categoryId: null,
    counterpartyId: null,
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

    <UiCard v-if="isExpanded" class="p-4">
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div class="space-y-2">
          <label class="text-sm font-medium">Data Início</label>
          <DatePicker
            :model-value="localFilters.startDate ?? undefined"
            @update:model-value="(value) => updateFilter('startDate', value)"
            class="max-w-full"
          />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Data Fim</label>
          <DatePicker
            :model-value="localFilters.endDate ?? undefined"
            @update:model-value="(value) => updateFilter('endDate', value)"
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
          <UiSelect
            :model-value="localFilters.categoryId || 'all'"
            @update:model-value="(v) => updateFilter('categoryId', v === 'all' ? null : v)"
          >
            <UiSelectTrigger class="w-full">
              <UiSelectValue placeholder="Todas" />
            </UiSelectTrigger>
            <UiSelectContent>
              <UiSelectItem value="all">Todas</UiSelectItem>
              <UiSelectItem
                v-for="category in categories"
                :key="category.id"
                :value="category.id"
              >
                {{ getCategoryIcon(category.icon) }} {{ category.name }}
              </UiSelectItem>
            </UiSelectContent>
          </UiSelect>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Terceiro</label>
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
