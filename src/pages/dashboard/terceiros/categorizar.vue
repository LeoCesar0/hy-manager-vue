<script setup lang="ts">
import { CheckCircle2Icon, SaveIcon } from "lucide-vue-next";
import type { ICategory } from "~/@schemas/models/category";
import { getCategories } from "~/services/api/categories/get-categories";
import { updateCounterparty } from "~/services/api/counterparties/update-counterparty";
import { ROUTE } from "~/static/routes";
import DashboardSection from "~/components/Dashboard/DashboardSection.vue";
import UncategorizedRow from "~/components/Counterparties/UncategorizedRow.vue";

definePageMeta({
  layout: "dashboard",
});

const userStore = useUserStore();
const { currentUser } = storeToRefs(userStore);
const router = useRouter();
const { toast } = useToast();

const categories = ref<ICategory[]>([]);
const { items, count, isLoading, loadData, removeCounterparty } = useUncategorizedCounterparties();

const pendingChanges = ref<Map<string, string[]>>(new Map());
const isSaving = ref(false);
const currentPage = ref(1);
const pageSize = 10;

const totalPages = computed(() => Math.max(1, Math.ceil(items.value.length / pageSize)));

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return items.value.slice(start, start + pageSize);
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
      items.value.map((item) => [item.counterparty.id, item.counterparty])
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
      removeCounterparty(id);
      pendingChanges.value.delete(id);
    }

    if (successIds.length > 0) {
      toast.success(`${successIds.length} terceiro${successIds.length > 1 ? "s" : ""} categorizado${successIds.length > 1 ? "s" : ""}`);
    }

    // Adjust page if current page is now out of bounds
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value;
    }
  } finally {
    isSaving.value = false;
  }
};

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
        v-if="items.length > 0"
        :disabled="!hasPendingChanges || isSaving"
        @click="handleSaveAll"
      >
        <SaveIcon class="h-4 w-4 mr-2" />
        Salvar{{ pendingCount > 0 ? ` (${pendingCount})` : "" }}
      </UiButton>
    </template>

    <div v-if="items.length === 0 && !isLoading" class="flex flex-col items-center justify-center py-12 text-center">
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
        {{ count }} terceiro{{ count > 1 ? "s" : "" }} sem categoria, ordenados por valor total.
      </p>

      <UncategorizedRow
        v-for="item in paginatedItems"
        :key="item.counterparty.id"
        :counterparty="item.counterparty"
        :stats="item.stats"
        :transactions="item.transactions"
        :categories="categories"
        :selected-category-ids="getSelectedCategoryIds(item.counterparty.id)"
        :disabled="isSaving"
        :on-category-change="handleCategoryChange"
      />

      <!-- Pagination + Save footer -->
      <div class="flex items-center justify-between pt-4 border-t">
        <div class="flex items-center gap-2">
          <UiButton
            variant="outline"
            size="sm"
            :disabled="currentPage <= 1"
            @click="currentPage--"
          >
            Anterior
          </UiButton>
          <span class="text-sm text-muted-foreground">
            {{ currentPage }} / {{ totalPages }}
          </span>
          <UiButton
            variant="outline"
            size="sm"
            :disabled="currentPage >= totalPages"
            @click="currentPage++"
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
  </DashboardSection>
</template>
