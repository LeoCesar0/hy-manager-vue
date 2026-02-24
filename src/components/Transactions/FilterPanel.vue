<script setup lang="ts">
import { FilterIcon, XIcon } from "lucide-vue-next";
import type { ICategory } from "~/@schemas/models/category";
import type { IBankAccount } from "~/@schemas/models/bank-account";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import type { Timestamp } from "firebase/firestore";
import SearchInput from "~/components/Dashboard/SearchInput.vue";
import Datepicker from "~/components/Datepicker/index.vue";

type IFilters = {
  startDate: Timestamp | null;
  endDate: Timestamp | null;
  type: 'deposit' | 'expense' | null;
  categoryId: string | null;
  bankAccountId: string | null;
  counterpartyId: string | null;
  search: string;
};

type IProps = {
  modelValue: IFilters;
  categories: ICategory[];
  bankAccounts: IBankAccount[];
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
    props.modelValue.bankAccountId ||
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
    bankAccountId: null,
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
          <Datepicker 
            :model-value="localFilters.startDate"
            @update:model-value="(value) => updateFilter('startDate', value)"
            :clean-button="true"
            :value-on-clean="null"
            class="max-w-full"
          />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Data Fim</label>
          <Datepicker 
            :model-value="localFilters.endDate"
            @update:model-value="(value) => updateFilter('endDate', value)"
            :clean-button="true"
            :value-on-clean="null"
            class="max-w-full"
          />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Tipo</label>
          <select 
            :value="localFilters.type || ''"
            @change="(e) => updateFilter('type', (e.target as HTMLSelectElement).value || null)"
            class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Todos</option>
            <option value="deposit">Receitas</option>
            <option value="expense">Despesas</option>
          </select>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Categoria</label>
          <select 
            :value="localFilters.categoryId || ''"
            @change="(e) => updateFilter('categoryId', (e.target as HTMLSelectElement).value || null)"
            class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Todas</option>
            <option 
              v-for="category in categories" 
              :key="category.id" 
              :value="category.id"
            >
              {{ category.icon }} {{ category.name }}
            </option>
          </select>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Conta Bancária</label>
          <select 
            :value="localFilters.bankAccountId || ''"
            @change="(e) => updateFilter('bankAccountId', (e.target as HTMLSelectElement).value || null)"
            class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Todas</option>
            <option 
              v-for="account in bankAccounts" 
              :key="account.id" 
              :value="account.id"
            >
              {{ account.name }}
            </option>
          </select>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Terceiro</label>
          <select 
            :value="localFilters.counterpartyId || ''"
            @change="(e) => updateFilter('counterpartyId', (e.target as HTMLSelectElement).value || null)"
            class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Todos</option>
            <option 
              v-for="counterparty in counterparties" 
              :key="counterparty.id" 
              :value="counterparty.id"
            >
              {{ counterparty.name }}
            </option>
          </select>
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
