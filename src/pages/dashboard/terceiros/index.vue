<script setup lang="ts">
import { PlusIcon } from "lucide-vue-next";
import type { ICounterparty, ICreateCounterparty } from "~/@schemas/models/counterparty";
import type { ICategory } from "~/@schemas/models/category";
import { getCounterparties } from "~/services/api/counterparties/get-counterparties";
import { getCategories } from "~/services/api/categories/get-categories";
import { deleteCounterparty } from "~/services/api/counterparties/delete-counterparty";
import { ROUTE } from "~/static/routes";
import CounterpartyCard from "~/components/Counterparties/CounterpartyCard.vue";
import DashboardSection from "~/components/Dashboard/DashboardSection.vue";
import SearchInput from "~/components/Dashboard/SearchInput.vue";
import EmptyState from "~/components/Dashboard/EmptyState.vue";
import CardGrid from "~/components/Dashboard/CardGrid.vue";

definePageMeta({
  layout: "dashboard",
});

const userStore = useUserStore();
const { currentUser } = storeToRefs(userStore);
const router = useRouter();

const isLoadingData = ref(false);
const counterparties = ref<ICounterparty[]>([]);
const categories = ref<ICategory[]>([]);
const searchQuery = ref("");

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

const filteredCounterparties = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return counterparties.value;
  return counterparties.value.filter((c) => c.name.toLowerCase().includes(q));
});

const loadData = async () => {
  if (!currentUser.value) return;

  isLoadingData.value = true;
  try {
    const [counterpartiesRes, categoriesRes] = await Promise.all([
      getCounterparties({
        userId: currentUser.value.id,
        options: { toastOptions: undefined },
      }),
      getCategories({
        userId: currentUser.value.id,
        options: { toastOptions: undefined },
      }),
    ]);

    if (counterpartiesRes.data) {
      counterparties.value = counterpartiesRes.data.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (categoriesRes.data) {
      categories.value = categoriesRes.data;
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
          loadData();
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
  loadData();
};

const handleUpdateSuccess = () => {
  updatingCounterparty.value = null;
  isUpdateSheetOpen.value = false;
  loadData();
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <DashboardSection
    title="Terceiros"
    subtitle="Gerencie seus terceiros"
    :loading="isLoadingData"
  >
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
    </template>

    <EmptyState
      v-if="filteredCounterparties.length === 0"
      title="Nenhum terceiro encontrado"
      :description="searchQuery ? 'Tente buscar por outro termo.' : 'Crie seu primeiro terceiro clicando no botão acima.'"
      :show-create-button="!searchQuery"
      create-button-label="Novo Terceiro"
      :on-create="handleCreate"
    />

    <CardGrid v-else>
      <CounterpartyCard
        v-for="counterparty in filteredCounterparties"
        :key="counterparty.id"
        :counterparty="counterparty"
        :categories="categories"
        :handle-view="handleView"
        :handle-edit="handleEdit"
        :handle-delete="handleDelete"
      />
    </CardGrid>

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
