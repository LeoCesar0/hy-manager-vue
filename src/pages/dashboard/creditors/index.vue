<script setup lang="ts">
import type { ICreditor } from "~/@schemas/models/creditor";
import { getCreditors } from "~/services/api/creditors/get-creditors";
import { UiButton } from "~/components/ui/button";
import {
  UiCard,
  UiCardContent,
  UiCardHeader,
  UiCardTitle,
} from "~/components/ui/card";
import { UiInput } from "~/components/ui/input";

definePageMeta({
  layout: "dashboard",
});

const userStore = useUserStore();
const { currentUser } = storeToRefs(userStore);

const creditors = ref<ICreditor[]>([]);
const loading = ref(false);
const searchQuery = ref("");

const loadCreditors = async () => {
  if (!currentUser.value) return;

  loading.value = true;
  const result = await getCreditors({
    userId: currentUser.value.id,
  });
  loading.value = false;

  if (result.data) {
    creditors.value = result.data;
  }
};

const filteredCreditors = computed(() => {
  if (!searchQuery.value) return creditors.value;

  const query = searchQuery.value.toLowerCase();
  return creditors.value.filter((c) =>
    c.name.toLowerCase().includes(query)
  );
});

const handleView = (creditor: ICreditor) => {
  navigateTo(`/dashboard/creditors/${creditor.id}`);
};

onMounted(() => {
  loadCreditors();
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold">Creditors</h1>
        <p class="text-muted-foreground">Manage your transaction creditors</p>
      </div>
    </div>

    <div class="space-y-4">
      <UiInput
        v-model="searchQuery"
        placeholder="Search creditors..."
        class="max-w-md"
      />

      <div v-if="loading" class="text-center py-8">
        <p>Loading...</p>
      </div>

      <div v-else-if="filteredCreditors.length === 0" class="text-center py-8">
        <p class="text-muted-foreground">
          {{ searchQuery ? "No creditors found." : "No creditors yet. They will be created automatically when you add transactions." }}
        </p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <UiCard v-for="creditor in filteredCreditors" :key="creditor.id">
          <UiCardHeader>
            <UiCardTitle>{{ creditor.name }}</UiCardTitle>
          </UiCardHeader>
          <UiCardContent>
            <div class="space-y-2">
              <p class="text-sm text-muted-foreground">
                {{ creditor.categoryIds.length }} associated categories
              </p>
              <UiButton variant="outline" size="sm" @click="handleView(creditor)">
                View Details
              </UiButton>
            </div>
          </UiCardContent>
        </UiCard>
      </div>
    </div>
  </div>
</template>
