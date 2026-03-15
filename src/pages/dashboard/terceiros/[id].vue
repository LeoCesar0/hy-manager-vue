<script setup lang="ts">
import { ArrowLeftIcon } from "lucide-vue-next";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import type { ICategory } from "~/@schemas/models/category";
import { getCounterparty } from "~/services/api/counterparties/get-counterparty";
import { getCategories } from "~/services/api/categories/get-categories";
import { deleteCounterparty } from "~/services/api/counterparties/delete-counterparty";
import { formatDate } from "~/helpers/formatDate";
import { ROUTE } from "~/static/routes";
import DashboardSection from "~/components/Dashboard/DashboardSection.vue";
import DetailCard from "~/components/Dashboard/DetailCard.vue";
import DetailField from "~/components/Dashboard/DetailField.vue";
import ActionButtons from "~/components/Dashboard/ActionButtons.vue";
import TransactionListSection from "~/components/Transactions/TransactionListSection.vue";
import { getCategoryIcon } from "~/static/category-icons";

definePageMeta({
  layout: "dashboard",
});

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const { currentUser } = storeToRefs(userStore);
const counterpartyId = route.params.id as string;

const isLoadingData = ref(false);
const counterparty = ref<ICounterparty | null>(null);
const categories = ref<ICategory[]>([]);
const isSheetOpen = ref(false);

const resolvedCategories = computed(() => {
  if (!counterparty.value) return [];
  return counterparty.value.categoryIds
    .map((id) => categories.value.find((c) => c.id === id))
    .filter(Boolean) as ICategory[];
});

const loadData = async () => {
  if (!counterpartyId) return;

  isLoadingData.value = true;
  try {
    const [counterpartyRes, categoriesRes] = await Promise.all([
      getCounterparty({
        id: counterpartyId,
        options: { toastOptions: undefined },
      }),
      currentUser.value
        ? getCategories({
            userId: currentUser.value.id,
            options: { toastOptions: undefined },
          })
        : Promise.resolve({ data: null }),
    ]);

    if (counterpartyRes.data) {
      counterparty.value = counterpartyRes.data;
    } else {
      router.push(ROUTE.counterparties.path());
    }
    if (categoriesRes?.data) {
      categories.value = categoriesRes.data;
    }
  } finally {
    isLoadingData.value = false;
  }
};

const { openDialog } = useAlertDialog();

const handleDelete = () => {
  if (!counterparty.value) return;

  openDialog({
    title: "Deletar Terceiro",
    message: `Tem certeza que deseja deletar o terceiro "${counterparty.value.name}"?`,
    confirm: {
      label: "Deletar",
      action: async () => {
        if (!counterparty.value?.id || !currentUser.value?.id) return;
        const response = await deleteCounterparty({
          id: counterparty.value.id,
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
          router.push(ROUTE.counterparties.path());
        }
      },
    },
  });
};

const handleEdit = () => {
  isSheetOpen.value = true;
};

const handleGoBack = () => {
  router.push(ROUTE.counterparties.path());
};

const handleEditSuccess = () => {
  isSheetOpen.value = false;
  loadData();
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <DashboardSection
    title="Detalhes do Terceiro"
    subtitle="Visualize e edite as informações do terceiro"
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
      :not-found="!counterparty"
      not-found-title="Terceiro não encontrado"
      not-found-description="O terceiro que você está procurando não existe."
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
            class="h-20 w-20 rounded-full border border-border shrink-0 flex items-center justify-center text-2xl font-bold bg-muted text-muted-foreground"
          >
            {{ counterparty?.name?.charAt(0)?.toUpperCase() || '?' }}
          </div>
          <div>
            <h2 class="text-2xl font-bold">{{ counterparty?.name }}</h2>
            <p class="text-sm text-muted-foreground">
              Criado em {{ formatDate(counterparty?.createdAt) }}
            </p>
          </div>
        </div>
      </template>

      <template #content>
        <div class="grid gap-4 md:grid-cols-2">
          <DetailField label="Nome" :value="counterparty?.name" />

          <DetailField label="Categorias">
            <div v-if="resolvedCategories.length" class="flex flex-wrap gap-1">
              <UiBadge
                v-for="cat in resolvedCategories"
                :key="cat.id"
                variant="secondary"
              >
                {{ cat.icon ? getCategoryIcon(cat.icon) : '' }} {{ cat.name }}
              </UiBadge>
            </div>
            <p v-else class="text-base text-muted-foreground">Sem categorias</p>
          </DetailField>

          <DetailField label="Data de Criação" :value="formatDate(counterparty?.createdAt)" />

          <DetailField label="Última Atualização" :value="formatDate(counterparty?.updatedAt)" />
        </div>
      </template>
    </DetailCard>

    <CounterpartiesEditSheet
      v-if="counterparty"
      v-model:is-open="isSheetOpen"
      :initial-values="counterparty"
      :on-success="handleEditSuccess"
      :on-cancel="() => { isSheetOpen = false }"
    />

    <div v-if="counterparty" class="mt-8">
      <h3 class="text-xl font-semibold mb-4">Transações</h3>
      <TransactionListSection
        :fixed-counterparty-id="counterpartyId"
        :show-actions="false"
        :show-fab="false"
        :show-summary-cards="true"
        pagination-query-key="txPage"
      />
    </div>
  </DashboardSection>
</template>
