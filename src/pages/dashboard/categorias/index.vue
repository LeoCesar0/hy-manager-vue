<script setup lang="ts">
import { PlusIcon } from "lucide-vue-next";
import type { ICategory, ICreateCategory } from "~/@schemas/models/category";
import { getCategories } from "~/services/api/categories/get-categories";
import { deleteCategory } from "~/services/api/categories/delete-category";
import { ROUTE } from "~/static/routes";
import CategoryCard from "~/components/Categories/CategoryCard.vue";
import { setupDefaultCategories } from "~/services/api/categories/setup-default-categories";
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
const categories = ref<ICategory[]>([]);
const searchQuery = ref("");

const isCreateSheetOpen = ref(false);
const isUpdateSheetOpen = ref(false);
const updatingCategory = ref<ICategory | null>(null);

watch(isUpdateSheetOpen, (value) => {
  if (!value) updatingCategory.value = null;
}, { immediate: true });

const createCategoryInitialValues = computed<ICreateCategory>(() => ({
  name: "",
  color: null,
  icon: null,
  userId: currentUser.value?.id || "",
}));

const filteredCategories = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return categories.value;
  return categories.value.filter((c) => c.name.toLowerCase().includes(q));
});

const loadCategories = async () => {
  if (!currentUser.value) return;

  isLoadingData.value = true;
  try {
    const response = await getCategories({
      userId: currentUser.value.id,
      options: { toastOptions: undefined },
    });
    if (response.data) {
      categories.value = response.data.sort((a, b) => a.name.localeCompare(b.name));
    }
  } finally {
    isLoadingData.value = false;
  }
};

const { openDialog } = useAlertDialog();

const handleDelete = (category: ICategory) => {
  openDialog({
    title: "Deletar Categoria",
    message: `Tem certeza que deseja deletar a categoria "${category.name}"?`,
    confirm: {
      label: "Deletar",
      action: async () => {
        if (!category.id || !currentUser.value?.id) return;
        const response = await deleteCategory({
          id: category.id,
          userId: currentUser.value.id,
          options: {
            toastOptions: {
              loading: { message: "Deletando categoria..." },
              success: { message: "Categoria deletada com sucesso!" },
              error: true,
            },
          },
        });
        if (response.data !== undefined) {
          loadCategories();
        }
      },
    },
  });
};

const handleEdit = (category: ICategory) => {
  updatingCategory.value = category;
  isUpdateSheetOpen.value = true;
};

const handleView = (category: ICategory) => {
  router.push(ROUTE.categoryId.path(category.id));
};

const handleCreate = () => {
  isCreateSheetOpen.value = true;
};

const handleCreateSuccess = () => {
  isCreateSheetOpen.value = false;
  loadCategories();
};

const handleUpdateSuccess = () => {
  updatingCategory.value = null;
  isUpdateSheetOpen.value = false;
  loadCategories();
};

onMounted(() => {
  loadCategories();
});

const handleCreateDefaultCategories = async () => {
  const confirm = async ({ deleteExisting }: { deleteExisting?: boolean }) => {
    const response = await setupDefaultCategories({
      userId: currentUser.value?.id || "",
      deleteExisting,
      options: {
        toastOptions: {
          loading: { message: "Criando categorias padrão..." },
          success: { message: "Categorias padrão criadas com sucesso!" },
          error: true,
        },
        loadingRefs: [isLoadingData]
      }
    });
    if (response.data) {
      loadCategories();
    }
  }

  openDialog({
    title: "Criar Categorias Padrão",
    message: "Deseja resetar as categorias e carregar as padrões, ou apenas carregar as padrões?",
    confirm: {
      label: "Criar",
      action: async () => {
        await confirm({ deleteExisting: false });
      },
    },
    otherOptions: [
      {
        label: "Resetar e carregar as padrões",
        action: () => {
          confirm({ deleteExisting: true });
        },
        variant: "danger",
      },
    ],
  });
};

</script>

<template>
  <DashboardSection 
    title="Categorias" 
    subtitle="Gerencie suas categorias de transações"
    :loading="isLoadingData"
  >
    <template #actions>
      <UiButton @click="handleCreateDefaultCategories" :disabled="isLoadingData" variant="outline">
        Carregar Categorias Padrão
      </UiButton>
      <UiButton @click="handleCreate">
        <PlusIcon class="h-4 w-4 mr-2" />
        Nova Categoria
      </UiButton>
    </template>

    <template #filters>
      <SearchInput 
        v-model="searchQuery" 
        placeholder="Buscar categorias..." 
      />
    </template>

    <EmptyState 
      v-if="filteredCategories.length === 0"
      title="Nenhuma categoria encontrada"
      :description="searchQuery ? 'Tente buscar por outro termo.' : 'Crie sua primeira categoria clicando no botão acima.'"
      :show-create-button="!searchQuery"
      create-button-label="Nova Categoria"
      :on-create="handleCreate"
    />

    <CardGrid v-else>
      <CategoryCard v-for="category in filteredCategories" :key="category.id" :category="category"
        :handle-view="handleView" :handle-edit="handleEdit" :handle-delete="handleDelete" />
    </CardGrid>

    <CategoriesCreateSheet v-model:is-open="isCreateSheetOpen" :initial-values="createCategoryInitialValues"
      :on-success="handleCreateSuccess" :on-cancel="() => { isCreateSheetOpen = false }" />
    <CategoriesEditSheet v-model:is-open="isUpdateSheetOpen" :initial-values="updatingCategory"
      :on-success="handleUpdateSuccess" :on-cancel="() => { updatingCategory = null; isUpdateSheetOpen = false }" />
  </DashboardSection>
</template>
