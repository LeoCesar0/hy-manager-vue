<script setup lang="ts">
import { ArrowLeftIcon } from "lucide-vue-next";
import type { ICategory } from "~/@schemas/models/category";
import { getCategory } from "~/services/api/categories/get-category";
import { deleteCategory } from "~/services/api/categories/delete-category";
import { formatDate } from "~/helpers/formatDate";
import { ROUTE } from "~/static/routes";
import DashboardSection from "~/components/Dashboard/DashboardSection.vue";
import DetailCard from "~/components/Dashboard/DetailCard.vue";
import DetailField from "~/components/Dashboard/DetailField.vue";
import ActionButtons from "~/components/Dashboard/ActionButtons.vue";
import { getCategoryIcon } from "~/static/category-icons";
import PositiveExpenseIcon from "~/components/Categories/PositiveExpenseIcon.vue";

definePageMeta({
  layout: "dashboard",
});

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const { currentUser } = storeToRefs(userStore);
const categoryId = route.params.id as string;

const isLoadingData = ref(false);
const category = ref<ICategory | null>(null);
const isSheetOpen = ref(false);

const loadCategory = async () => {
  if (!categoryId) return;

  isLoadingData.value = true;
  try {
    const response = await getCategory({
      id: categoryId,
      options: { toastOptions: undefined },
    });
    if (response.data) {
      category.value = response.data;
    } else {
      router.push(ROUTE.categories.path());
    }
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
        if (!category.value?.id || !currentUser.value?.id) return;
        const response = await deleteCategory({
          id: category.value.id,
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
  <DashboardSection 
    title="Detalhes da Categoria" 
    subtitle="Visualize e edite as informações da categoria"
    :show-back-button="true"
    :on-back="handleGoBack"
    :loading="isLoadingData"
  >
    <template #detail-actions>
      <ActionButtons 
        :show-view="false"
        :on-edit="handleEdit"
        :on-delete="handleDelete"
      />
    </template>

    <DetailCard 
      :not-found="!category"
      not-found-title="Categoria não encontrada"
      not-found-description="A categoria que você está procurando não existe."
    >
      <template #not-found-action>
        <UiButton @click="handleGoBack">
          <ArrowLeftIcon class="h-4 w-4 mr-2" />
          Voltar
        </UiButton>
      </template>

      <template #header>
        <div class="flex items-center gap-4">
          <div
            class="h-20 w-20 rounded-full border border-border shrink-0 flex items-center justify-center text-4xl"
            :style="{ backgroundColor: category?.color || 'hsl(var(--muted))' }"
          >
            {{ category?.icon ? getCategoryIcon(category.icon) : '—' }}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-2xl font-bold">{{ category?.name }}</h2>
              <PositiveExpenseIcon v-if="category?.isPositiveExpense" size="md" />
            </div>
            <p class="text-sm text-muted-foreground">
              Criada em {{ formatDate(category?.createdAt) }}
            </p>
          </div>
        </div>
      </template>

      <template #content>
        <div class="grid gap-4 md:grid-cols-2">
          <DetailField label="Nome" :value="category?.name" />

          <DetailField label="Ícone">
            <div class="flex items-center gap-2">
              <span class="text-2xl">{{ category?.icon ? getCategoryIcon(category.icon) : '—' }}</span>
            </div>
          </DetailField>

          <DetailField label="Cor">
            <div class="flex items-center gap-2">
              <div
                class="h-6 w-6 rounded-full border border-border"
                :style="{ backgroundColor: category?.color || 'hsl(var(--muted))' }"
              />
              <p class="text-base">{{ category?.color || '—' }}</p>
            </div>
          </DetailField>

          <DetailField label="Gasto Positivo" :value="category?.isPositiveExpense ? 'Sim' : 'Não'" />

          <DetailField label="Data de Criação" :value="formatDate(category?.createdAt)" />

          <DetailField label="Última Atualização" :value="formatDate(category?.updatedAt)" />
        </div>
      </template>
    </DetailCard>

    <CategoriesEditSheet
      v-if="category"
      v-model:is-open="isSheetOpen"
      :initial-values="category"
      :on-success="handleEditSuccess"
      :on-cancel="() => { isSheetOpen = false }"
    />
  </DashboardSection>
</template>

