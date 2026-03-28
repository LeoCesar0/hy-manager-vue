<script setup lang="ts">
import { CheckCircle2Icon, SaveIcon } from "lucide-vue-next";
import type { ICategory } from "~/@schemas/models/category";
import { getCategories } from "~/services/api/categories/get-categories";
import { updateCounterparty } from "~/services/api/counterparties/update-counterparty";
import { ROUTE } from "~/static/routes";
import DashboardSection from "~/components/Dashboard/DashboardSection.vue";
import CounterpartyCategorizationRow from "~/components/Counterparties/CounterpartyCategorizationRow.vue";

definePageMeta({
  layout: "dashboard",
});

const userStore = useUserStore();
const { currentUser } = storeToRefs(userStore);
const router = useRouter();
const { toast } = useToast();

const activeTab = ref<"uncategorized" | "categorized">("uncategorized");
const categories = ref<ICategory[]>([]);

const {
  uncategorizedItems,
  categorizedItems,
  uncategorizedCount,
  categorizedCount,
  isLoading,
  loadData,
  updateLocalCounterparty,
} = useCounterpartiesCategorization();

// --- Uncategorized tab ---
const pendingChanges = ref<Map<string, string[]>>(new Map());
const isSaving = ref(false);
const uncategorizedPage = ref(1);
const pageSize = 10;

const uncategorizedTotalPages = computed(() => Math.max(1, Math.ceil(uncategorizedItems.value.length / pageSize)));

const paginatedUncategorized = computed(() => {
  const start = (uncategorizedPage.value - 1) * pageSize;
  return uncategorizedItems.value.slice(start, start + pageSize);
});

const pendingCount = computed(() => {
  let changed = 0;
  for (const categoryIds of pendingChanges.value.values()) {
    if (categoryIds.length > 0) changed++;
  }
  return changed;
});

const hasPendingChanges = computed(() => pendingCount.value > 0);

const handleCategoryChange = (counterpartyId: string, categoryIds: string[]) => {
  const updated = new Map(pendingChanges.value);
  if (categoryIds.length > 0) {
    updated.set(counterpartyId, categoryIds);
  } else {
    updated.delete(counterpartyId);
  }
  pendingChanges.value = updated;
};

const getSelectedCategoryIds = (counterpartyId: string): string[] => {
  return pendingChanges.value.get(counterpartyId) ?? [];
};

const handleSaveAll = async () => {
  if (!hasPendingChanges.value) return;

  isSaving.value = true;
  try {
    const validEntries = Array.from(pendingChanges.value.entries())
      .filter(([, categoryIds]) => categoryIds.length > 0);

    const counterpartyMap = new Map(
      uncategorizedItems.value.map((item) => [item.counterparty.id, item.counterparty])
    );

    const results = await Promise.allSettled(
      validEntries.map(([counterpartyId, categoryIds]) => {
        const counterparty = counterpartyMap.get(counterpartyId);
        if (!counterparty) return Promise.resolve(null);

        return updateCounterparty({
          id: counterpartyId,
          userId: counterparty.userId,
          data: {
            name: counterparty.name,
            categoryIds,
            userId: counterparty.userId,
          },
          options: { toastOptions: undefined },
        });
      })
    );

    const successIds: string[] = [];
    results.forEach((result, index) => {
      const entry = validEntries[index];
      if (entry && result.status === "fulfilled" && result.value && "data" in result.value && result.value.data) {
        successIds.push(entry[0]);
      }
    });

    for (const id of successIds) {
      const categoryIds = pendingChanges.value.get(id);
      if (categoryIds) {
        updateLocalCounterparty(id, categoryIds);
      }
      pendingChanges.value.delete(id);
    }

    if (successIds.length > 0) {
      toast.success(`${successIds.length} terceiro${successIds.length > 1 ? "s" : ""} categorizado${successIds.length > 1 ? "s" : ""}`);
    }

    if (uncategorizedPage.value > uncategorizedTotalPages.value) {
      uncategorizedPage.value = uncategorizedTotalPages.value;
    }
  } finally {
    isSaving.value = false;
  }
};

// --- Categorized tab ---
const categorizedPage = ref(1);
const editingId = ref<string | null>(null);
const categorizedPendingChanges = ref<Map<string, string[]>>(new Map());
const isSavingCategorized = ref(false);

const categorizedTotalPages = computed(() => Math.max(1, Math.ceil(categorizedItems.value.length / pageSize)));

const paginatedCategorized = computed(() => {
  const start = (categorizedPage.value - 1) * pageSize;
  return categorizedItems.value.slice(start, start + pageSize);
});

const hasCategorizedPendingChanges = computed(() => categorizedPendingChanges.value.size > 0);

const handleEditCategorized = (counterpartyId: string) => {
  const item = categorizedItems.value.find((i) => i.counterparty.id === counterpartyId);
  if (!item) return;

  editingId.value = counterpartyId;
  categorizedPendingChanges.value.set(counterpartyId, [...item.counterparty.categoryIds]);
};

const handleCategorizedCategoryChange = (counterpartyId: string, categoryIds: string[]) => {
  const updated = new Map(categorizedPendingChanges.value);
  updated.set(counterpartyId, categoryIds);
  categorizedPendingChanges.value = updated;
};

const getCategorizedSelectedIds = (counterpartyId: string): string[] => {
  return categorizedPendingChanges.value.get(counterpartyId) ?? [];
};

const handleSaveCategorized = async () => {
  if (!hasCategorizedPendingChanges.value) return;

  isSavingCategorized.value = true;
  try {
    const validEntries = Array.from(categorizedPendingChanges.value.entries());

    const counterpartyMap = new Map(
      categorizedItems.value.map((i) => [i.counterparty.id, i.counterparty])
    );

    const results = await Promise.allSettled(
      validEntries.map(([counterpartyId, categoryIds]) => {
        const counterparty = counterpartyMap.get(counterpartyId);
        if (!counterparty) return Promise.resolve(null);

        return updateCounterparty({
          id: counterpartyId,
          userId: counterparty.userId,
          data: {
            name: counterparty.name,
            categoryIds,
            userId: counterparty.userId,
          },
          options: { toastOptions: undefined },
        });
      })
    );

    const successIds: string[] = [];
    results.forEach((result, index) => {
      const entry = validEntries[index];
      if (entry && result.status === "fulfilled" && result.value && "data" in result.value && result.value.data) {
        successIds.push(entry[0]);
      }
    });

    for (const id of successIds) {
      const categoryIds = categorizedPendingChanges.value.get(id);
      if (categoryIds) {
        updateLocalCounterparty(id, categoryIds);
      }
    }

    if (successIds.length > 0) {
      toast.success(`${successIds.length} terceiro${successIds.length > 1 ? "s" : ""} atualizado${successIds.length > 1 ? "s" : ""}`);
    }

    editingId.value = null;
    categorizedPendingChanges.value.clear();
  } finally {
    isSavingCategorized.value = false;
  }
};

const handleCancelEdit = () => {
  editingId.value = null;
  categorizedPendingChanges.value.clear();
};

// --- Common ---
const handleBack = () => {
  router.push(ROUTE.counterparties.path());
};

const loadCategories = async () => {
  if (!currentUser.value) return;
  const res = await getCategories({
    userId: currentUser.value.id,
    options: { toastOptions: undefined },
  });
  if (res.data) {
    categories.value = res.data;
  }
};

onMounted(() => {
  loadData();
  loadCategories();
});
</script>

<template>
  <DashboardSection
    title="Categorizar Terceiros"
    subtitle="Atribua categorias aos terceiros pendentes"
    show-back-button
    :on-back="handleBack"
    :loading="isLoading"
  >
    <template #detail-actions>
      <UiButton
        v-if="activeTab === 'uncategorized' && uncategorizedItems.length > 0"
        :disabled="!hasPendingChanges || isSaving"
        @click="handleSaveAll"
      >
        <SaveIcon class="h-4 w-4 mr-2" />
        Salvar{{ pendingCount > 0 ? ` (${pendingCount})` : "" }}
      </UiButton>
      <template v-if="activeTab === 'categorized' && editingId">
        <UiButton variant="outline" @click="handleCancelEdit" :disabled="isSavingCategorized">
          Cancelar
        </UiButton>
        <UiButton
          :disabled="!hasCategorizedPendingChanges || isSavingCategorized"
          @click="handleSaveCategorized"
        >
          <SaveIcon class="h-4 w-4 mr-2" />
          Salvar
        </UiButton>
      </template>
    </template>

    <UiTabs v-model="activeTab" class="w-full">
      <UiTabsList>
        <UiTabsTrigger value="uncategorized">
          Sem categoria ({{ uncategorizedCount }})
        </UiTabsTrigger>
        <UiTabsTrigger value="categorized">
          Categorizados ({{ categorizedCount }})
        </UiTabsTrigger>
      </UiTabsList>

      <UiTabsContent value="uncategorized">
        <div v-if="uncategorizedItems.length === 0 && !isLoading" class="flex flex-col items-center justify-center py-12 text-center">
          <CheckCircle2Icon class="h-12 w-12 text-primary mb-4" />
          <h3 class="text-lg font-semibold">Tudo categorizado!</h3>
          <p class="text-muted-foreground mt-1">
            Todos os terceiros possuem categorias atribuídas.
          </p>
          <UiButton variant="outline" class="mt-4" @click="handleBack">
            Voltar para Terceiros
          </UiButton>
        </div>

        <div v-else class="space-y-3">
          <p class="text-sm text-muted-foreground">
            {{ uncategorizedCount }} terceiro{{ uncategorizedCount > 1 ? "s" : "" }} sem categoria, ordenados por valor total.
          </p>

          <CounterpartyCategorizationRow
            v-for="item in paginatedUncategorized"
            :key="item.counterparty.id"
            :counterparty="item.counterparty"
            :stats="item.stats"
            :transactions="item.transactions"
            :categories="categories"
            :selected-category-ids="getSelectedCategoryIds(item.counterparty.id)"
            :disabled="isSaving"
            :on-category-change="handleCategoryChange"
            mode="assign"
          />

          <div class="flex items-center justify-between pt-4 border-t">
            <div class="flex items-center gap-2">
              <UiButton
                variant="outline"
                size="sm"
                :disabled="uncategorizedPage <= 1"
                @click="uncategorizedPage--"
              >
                Anterior
              </UiButton>
              <span class="text-sm text-muted-foreground">
                {{ uncategorizedPage }} / {{ uncategorizedTotalPages }}
              </span>
              <UiButton
                variant="outline"
                size="sm"
                :disabled="uncategorizedPage >= uncategorizedTotalPages"
                @click="uncategorizedPage++"
              >
                Próximo
              </UiButton>
            </div>

            <UiButton
              :disabled="!hasPendingChanges || isSaving"
              @click="handleSaveAll"
            >
              <SaveIcon class="h-4 w-4 mr-2" />
              Salvar{{ pendingCount > 0 ? ` (${pendingCount})` : "" }}
            </UiButton>
          </div>
        </div>
      </UiTabsContent>

      <UiTabsContent value="categorized">
        <div v-if="categorizedItems.length === 0 && !isLoading" class="flex flex-col items-center justify-center py-12 text-center">
          <h3 class="text-lg font-semibold">Nenhum terceiro categorizado</h3>
          <p class="text-muted-foreground mt-1">
            Categorize terceiros na aba "Sem categoria".
          </p>
        </div>

        <div v-else class="space-y-3">
          <p class="text-sm text-muted-foreground">
            {{ categorizedCount }} terceiro{{ categorizedCount > 1 ? "s" : "" }} com categorias atribuídas.
          </p>

          <CounterpartyCategorizationRow
            v-for="item in paginatedCategorized"
            :key="item.counterparty.id"
            :counterparty="item.counterparty"
            :stats="item.stats"
            :transactions="item.transactions"
            :categories="categories"
            :is-editing="editingId === item.counterparty.id"
            :selected-category-ids="getCategorizedSelectedIds(item.counterparty.id)"
            :disabled="isSavingCategorized"
            :on-edit="handleEditCategorized"
            :on-category-change="handleCategorizedCategoryChange"
            mode="view"
          />

          <div class="flex items-center justify-between pt-4 border-t">
            <div class="flex items-center gap-2">
              <UiButton
                variant="outline"
                size="sm"
                :disabled="categorizedPage <= 1"
                @click="categorizedPage--"
              >
                Anterior
              </UiButton>
              <span class="text-sm text-muted-foreground">
                {{ categorizedPage }} / {{ categorizedTotalPages }}
              </span>
              <UiButton
                variant="outline"
                size="sm"
                :disabled="categorizedPage >= categorizedTotalPages"
                @click="categorizedPage++"
              >
                Próximo
              </UiButton>
            </div>
          </div>
        </div>
      </UiTabsContent>
    </UiTabs>
  </DashboardSection>
</template>
