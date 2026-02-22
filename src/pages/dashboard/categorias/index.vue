<script setup lang="ts">
import { PlusIcon, EditIcon, TrashIcon, EyeIcon, SearchIcon, FolderIcon } from "lucide-vue-next";
import type { ICategory, ICreateCategory } from "~/@schemas/models/category";
import { getCategories } from "~/services/api/categories/get-categories";
import { deleteCategory } from "~/services/api/categories/delete-category";
import { ROUTE } from "~/static/routes";
import CategoryCard from "~/components/Categories/CategoryCard.vue";

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
      categories.value = response.data;
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
        if (!category.id) return;
        const response = await deleteCategory({
          id: category.id,
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
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Categorias</h1>
        <p class="text-muted-foreground">Gerencie suas categorias de transações</p>
      </div>
      <UiButton @click="handleCreate">
        <PlusIcon class="h-4 w-4 mr-2" />
        Nova Categoria
      </UiButton>
    </div>

    <div class="relative flex items-center">
      <SearchIcon class="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
      <input v-model="searchQuery"
        class="flex h-9 w-full max-w-sm rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        type="text" placeholder="Buscar categorias..." />
    </div>

    <div v-if="isLoadingData" class="flex items-center justify-center py-12">
      <Loading :is-loading="true" size="lg" />
    </div>

    <div v-else-if="filteredCategories.length === 0" class="flex items-center justify-center py-12">
      <UiEmpty title="Nenhuma categoria encontrada"
        :description="searchQuery ? 'Tente buscar por outro termo.' : 'Crie sua primeira categoria clicando no botão acima.'">
        <UiButton v-if="!searchQuery" @click="handleCreate">
          <PlusIcon class="h-4 w-4 mr-2" />
          Nova Categoria
        </UiButton>
      </UiEmpty>
    </div>

    <div v-else class="grid gap-4" style="grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))">
      <CategoryCard v-for="category in filteredCategories" :key="category.id" :category="category"
        :handle-view="handleView" :handle-edit="handleEdit" :handle-delete="handleDelete" />
    </div>

    <CategoriesCreateSheet v-model:is-open="isCreateSheetOpen" :initial-values="createCategoryInitialValues"
      :on-success="handleCreateSuccess" :on-cancel="() => { isCreateSheetOpen = false }" />
    <CategoriesEditSheet v-model:is-open="isUpdateSheetOpen" :initial-values="updatingCategory"
      :on-success="handleUpdateSuccess" :on-cancel="() => { updatingCategory = null; isUpdateSheetOpen = false }" />
  </div>
</template>
