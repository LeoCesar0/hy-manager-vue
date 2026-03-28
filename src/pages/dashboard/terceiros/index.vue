<script setup lang="ts">
import { watchDebounced } from "@vueuse/core";
import { PlusIcon, ArrowDownIcon, ArrowUpIcon } from "lucide-vue-next";
import type { ICounterparty, ICreateCounterparty } from "~/@schemas/models/counterparty";
import type { ICategory } from "~/@schemas/models/category";
import type { IPaginationResult } from "~/@types/pagination";
import { paginateCounterparties } from "~/services/api/counterparties/paginate-counterparties";
import { getCategories } from "~/services/api/categories/get-categories";
import { deleteCounterparty } from "~/services/api/counterparties/delete-counterparty";
import { ROUTE } from "~/static/routes";
import CounterpartyCard from "~/components/Counterparties/CounterpartyCard.vue";
import UncategorizedBanner from "~/components/Counterparties/UncategorizedBanner.vue";
import DashboardSection from "~/components/Dashboard/DashboardSection.vue";
import SearchInput from "~/components/Dashboard/SearchInput.vue";
import EmptyState from "~/components/Dashboard/EmptyState.vue";
import CardGrid from "~/components/Dashboard/CardGrid.vue";
import TablePagination from "~/components/Table/Pagination.vue";
import CategorySelect from "~/components/Categories/CategorySelect.vue";

definePageMeta({
  layout: "dashboard",
});

const userStore = useUserStore();
const { currentUser } = storeToRefs(userStore);
const router = useRouter();

const { count: uncategorizedCount, loadData: loadUncategorized } = useUncategorizedCounterparties();

const isLoadingData = ref(false);
const counterparties = ref<IPaginationResult<ICounterparty> | null>(null);
const categories = ref<ICategory[]>([]);
const searchQuery = ref("");
const categoryFilter = ref<string[]>([]);

const { paginationBody } = usePagination({ limit: 50, orderBy: { field: 'name', direction: 'asc' } });

const pageSizeOptions = [20, 50, 100] as const;

const sortDirection = computed(() => paginationBody.value.orderBy?.direction ?? 'asc');

const toggleSortDirection = () => {
  const newDirection = sortDirection.value === 'asc' ? 'desc' : 'asc';
  paginationBody.value.orderBy = { field: 'name', direction: newDirection };
  paginationBody.value.page = 1;
  loadCounterparties();
};

const handlePageSizeChange = (value: unknown) => {
  paginationBody.value.limit = Number(String(value));
  paginationBody.value.page = 1;
  loadCounterparties();
};

const isCreateSheetOpen = ref(false);
const isUpdateSheetOpen = ref(false);
const updatingCounterparty = ref<ICounterparty | null>(null);

watch(isUpdateSheetOpen, (value) => {
  if (!value) updatingCounterparty.value = null;
}, { immediate: true });

const createCounterpartyInitialValues = computed<ICreateCounterparty>(() => ({
  name: "",
  categoryIds: [],
  userId: currentUser.value?.id || "",
}));

const counterpartiesList = computed(() => counterparties.value?.list ?? []);

const loadAuxiliaryData = async () => {
  if (!currentUser.value) return;

  const categoriesRes = await getCategories({
    userId: currentUser.value.id,
    options: { toastOptions: undefined },
  });

  if (categoriesRes.data) {
    categories.value = categoriesRes.data;
  }
};

const loadCounterparties = async () => {
  if (!currentUser.value) return;

  isLoadingData.value = true;
  try {
    const response = await paginateCounterparties({
      userId: currentUser.value.id,
      search: searchQuery.value || undefined,
      categoryIds: categoryFilter.value.length > 0 ? categoryFilter.value : undefined,
      pagination: paginationBody.value,
    });
    if (response.data) {
      counterparties.value = response.data;
    }
  } finally {
    isLoadingData.value = false;
  }
};

const { openDialog } = useAlertDialog();

const handleDelete = (counterparty: ICounterparty) => {
  openDialog({
    title: "Deletar Terceiro",
    message: `Tem certeza que deseja deletar o terceiro "${counterparty.name}"?`,
    confirm: {
      label: "Deletar",
      action: async () => {
        if (!counterparty.id || !currentUser.value?.id) return;
        const response = await deleteCounterparty({
          id: counterparty.id,
          userId: currentUser.value.id,
          options: {
            toastOptions: {
              loading: { message: "Deletando terceiro..." },
              success: { message: "Terceiro deletado com sucesso!" },
              error: true,
            },
          },
        });
        if (response.data !== undefined) {
          loadCounterparties();
        }
      },
    },
  });
};

const handleEdit = (counterparty: ICounterparty) => {
  updatingCounterparty.value = counterparty;
  isUpdateSheetOpen.value = true;
};

const handleView = (counterparty: ICounterparty) => {
  router.push(ROUTE.counterpartyId.path(counterparty.id));
};

const handleCreate = () => {
  isCreateSheetOpen.value = true;
};

const handleCreateSuccess = () => {
  isCreateSheetOpen.value = false;
  loadCounterparties();
};

const handleUpdateSuccess = () => {
  updatingCounterparty.value = null;
  isUpdateSheetOpen.value = false;
  loadCounterparties();
};

watch(
  () => paginationBody.value.page,
  () => {
    loadCounterparties();
  }
);

watch(
  () => categoryFilter.value,
  () => {
    paginationBody.value.page = 1;
    loadCounterparties();
  },
  { deep: true }
);

watchDebounced(
  () => searchQuery.value,
  () => {
    paginationBody.value.page = 1;
    loadCounterparties();
  },
  { debounce: 400 }
);

onMounted(() => {
  loadAuxiliaryData();
  loadCounterparties();
  loadUncategorized();
});
</script>

<template>
  <DashboardSection
    title="Terceiros"
    subtitle="Gerencie seus terceiros"
    :loading="isLoadingData && !counterparties"
  >
    <UncategorizedBanner :count="uncategorizedCount" />

    <template #actions>
      <UiButton @click="handleCreate">
        <PlusIcon class="h-4 w-4 mr-2" />
        Novo Terceiro
      </UiButton>
    </template>

    <template #filters>
      <SearchInput
        v-model="searchQuery"
        placeholder="Buscar terceiros..."
      />

      <div class="flex items-center gap-3 flex-wrap">
        <UiButton variant="outline" size="sm" @click="toggleSortDirection">
          <ArrowDownIcon v-if="sortDirection === 'desc'" class="h-4 w-4 mr-2" />
          <ArrowUpIcon v-else class="h-4 w-4 mr-2" />
          {{ sortDirection === 'asc' ? 'A-Z' : 'Z-A' }}
        </UiButton>

        <div class="flex items-center gap-2">
          <span class="text-sm text-muted-foreground">Categoria</span>
          <CategorySelect
            :categories="categories"
            v-model="categoryFilter"
            class="w-[220px]"
          />
        </div>

        <div class="flex items-center gap-2">
          <span class="text-sm text-muted-foreground">Exibir</span>
          <UiSelect
            :model-value="String(paginationBody.limit)"
            @update:model-value="handlePageSizeChange"
          >
            <UiSelectTrigger class="w-[70px] h-8">
              <UiSelectValue />
            </UiSelectTrigger>
            <UiSelectContent>
              <UiSelectItem v-for="size in pageSizeOptions" :key="size" :value="String(size)">
                {{ size }}
              </UiSelectItem>
            </UiSelectContent>
          </UiSelect>
          <span class="text-sm text-muted-foreground">por página</span>
        </div>
      </div>
    </template>

    <EmptyState
      v-if="counterpartiesList.length === 0 && !isLoadingData"
      title="Nenhum terceiro encontrado"
      :description="searchQuery || categoryFilter.length > 0 ? 'Tente ajustar os filtros ou buscar por outro termo.' : 'Crie seu primeiro terceiro clicando no botão acima.'"
      :show-create-button="!searchQuery && categoryFilter.length === 0"
      create-button-label="Novo Terceiro"
      :on-create="handleCreate"
    />

    <CardGrid v-else>
      <CounterpartyCard
        v-for="counterparty in counterpartiesList"
        :key="counterparty.id"
        :counterparty="counterparty"
        :categories="categories"
        :handle-view="handleView"
        :handle-edit="handleEdit"
        :handle-delete="handleDelete"
      />
    </CardGrid>

    <div v-if="counterparties" class="mt-6">
      <TablePagination :pagination-body="paginationBody" :pagination-result="counterparties" />
    </div>

    <CounterpartiesCreateSheet
      v-model:is-open="isCreateSheetOpen"
      :initial-values="createCounterpartyInitialValues"
      :on-success="handleCreateSuccess"
      :on-cancel="() => { isCreateSheetOpen = false }"
    />
    <CounterpartiesEditSheet
      v-model:is-open="isUpdateSheetOpen"
      :initial-values="updatingCounterparty"
      :on-success="handleUpdateSuccess"
      :on-cancel="() => { updatingCounterparty = null; isUpdateSheetOpen = false }"
    />
  </DashboardSection>
</template>
