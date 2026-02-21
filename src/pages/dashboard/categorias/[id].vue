<script setup lang="ts">
import { ArrowLeftIcon, EditIcon, TrashIcon } from "lucide-vue-next";
import type { ICategory } from "~/@schemas/models/category";
import { firebaseGet } from "~/services/firebase/firebaseGet";
import { deleteCategory } from "~/services/api/categories/delete-category";
import { formatDate } from "~/helpers/formatDate";
import { ROUTE } from "~/static/routes";

definePageMeta({
  layout: "dashboard",
});

const route = useRoute();
const router = useRouter();
const categoryId = route.params.id as string;

const isLoadingData = ref(false);
const category = ref<ICategory | null>(null);
const isSheetOpen = ref(false);

const loadCategory = async () => {
  if (!categoryId) return;

  isLoadingData.value = true;
  try {
    const response = await firebaseGet<ICategory>({
      collection: "categories",
      id: categoryId,
    });
    if (response) {
      category.value = response;
    }
  } catch (error) {
    console.error("Error loading category:", error);
    router.push(ROUTE.categories.path());
  } finally {
    isLoadingData.value = false;
  }
};

const { openDialog } = useAlertDialog();

const handleDelete = () => {
  if (!category.value) return;

  openDialog({
    title: "Deletar Categoria",
    message: `Tem certeza que deseja deletar a categoria "${category.value.name}"?`,
    confirm: {
      label: "Deletar",
      action: async () => {
        if (!category.value?.id) return;
        const response = await deleteCategory({
          id: category.value.id,
          options: {
            toastOptions: {
              loading: { message: "Deletando categoria..." },
              success: { message: "Categoria deletada com sucesso!" },
              error: true,
            },
          },
        });
        if (response.data !== undefined) {
          router.push(ROUTE.categories.path());
        }
      },
    },
  });
};

const handleEdit = () => {
  isSheetOpen.value = true;
};

const handleGoBack = () => {
  router.push(ROUTE.categories.path());
};

const handleEditSuccess = () => {
  isSheetOpen.value = false;
  loadCategory();
};

onMounted(() => {
  loadCategory();
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <UiButton variant="ghost" size="icon" @click="handleGoBack">
        <ArrowLeftIcon class="h-4 w-4" />
      </UiButton>
      <div class="flex-1">
        <h1 class="text-3xl font-bold tracking-tight">Detalhes da Categoria</h1>
        <p class="text-muted-foreground">Visualize e edite as informações da categoria</p>
      </div>
      <div class="flex gap-2">
        <UiButton variant="outline" size="icon" title="Editar" @click="handleEdit">
          <EditIcon class="h-4 w-4" />
        </UiButton>
        <UiButton variant="destructive" size="icon" title="Deletar" @click="handleDelete">
          <TrashIcon class="h-4 w-4" />
        </UiButton>
      </div>
    </div>

    <div v-if="isLoadingData" class="flex items-center justify-center py-12">
      <Loading :is-loading="true" size="lg" />
    </div>

    <UiCard v-else-if="category" class="p-6">
      <div class="space-y-6">
        <div class="flex items-center gap-4">
          <div
            class="h-20 w-20 rounded-full border border-border shrink-0 flex items-center justify-center text-4xl"
            :style="{ backgroundColor: category.color || 'hsl(var(--muted))' }"
          >
            {{ category.icon || '📁' }}
          </div>
          <div>
            <h2 class="text-2xl font-bold">{{ category.name }}</h2>
            <p class="text-sm text-muted-foreground">
              Criada em {{ formatDate(category.createdAt) }}
            </p>
          </div>
        </div>

        <UiSeparator />

        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <p class="text-sm font-medium text-muted-foreground">Nome</p>
            <p class="text-base">{{ category.name }}</p>
          </div>

          <div class="space-y-2">
            <p class="text-sm font-medium text-muted-foreground">Ícone</p>
            <div class="flex items-center gap-2">
              <span class="text-2xl">{{ category.icon || '—' }}</span>
            </div>
          </div>

          <div class="space-y-2">
            <p class="text-sm font-medium text-muted-foreground">Cor</p>
            <div class="flex items-center gap-2">
              <div
                class="h-6 w-6 rounded-full border border-border"
                :style="{ backgroundColor: category.color || 'hsl(var(--muted))' }"
              />
              <p class="text-base">{{ category.color || '—' }}</p>
            </div>
          </div>

          <div class="space-y-2">
            <p class="text-sm font-medium text-muted-foreground">Data de Criação</p>
            <p class="text-base">{{ formatDate(category.createdAt) }}</p>
          </div>

          <div class="space-y-2">
            <p class="text-sm font-medium text-muted-foreground">Última Atualização</p>
            <p class="text-base">{{ formatDate(category.updatedAt) }}</p>
          </div>
        </div>
      </div>
    </UiCard>

    <div v-else class="flex items-center justify-center py-12">
      <UiEmpty
        title="Categoria não encontrada"
        description="A categoria que você está procurando não existe."
      >
        <UiButton @click="handleGoBack">
          <ArrowLeftIcon class="h-4 w-4 mr-2" />
          Voltar
        </UiButton>
      </UiEmpty>
    </div>

    <CategoriesEditSheet
      v-if="category"
      v-model:is-open="isSheetOpen"
      :initial-values="category"
      :on-success="handleEditSuccess"
      :on-cancel="() => { isSheetOpen = false }"
    />
  </div>
</template>

