<script setup lang="ts">
import type { ICategory } from "~/@schemas/models/category";
import { getCategories } from "~/services/api/categories/get-categories";
import { deleteCategory } from "~/services/api/categories/delete-category";
import CategoryBadge from "~/components/Categories/CategoryBadge.vue";
import { UiButton } from "~/components/ui/button";
import {
  UiCard,
  UiCardContent,
  UiCardHeader,
  UiCardTitle,
} from "~/components/ui/card";
import { useAlertDialog } from "~/composables/ui/useAlertDialog";

definePageMeta({
  layout: "dashboard",
});

const userStore = useUserStore();
const { currentUser } = storeToRefs(userStore);

const categories = ref<ICategory[]>([]);
const loading = ref(false);

const loadCategories = async () => {
  if (!currentUser.value) return;

  loading.value = true;
  const result = await getCategories({
    userId: currentUser.value.id,
  });
  loading.value = false;

  if (result.data) {
    categories.value = result.data;
  }
};

const handleEdit = (category: ICategory) => {
  navigateTo(`/dashboard/categories/${category.id}`);
};

const handleDelete = async (category: ICategory) => {
  const confirmed = await useAlertDialog().confirm({
    title: "Delete Category",
    description: `Are you sure you want to delete "${category.name}"? This action cannot be undone.`,
  });

  if (!confirmed) return;

  const result = await deleteCategory(category.id);

  if (result.error) {
    console.error("Error deleting category:", result.error);
    return;
  }

  await loadCategories();
};

onMounted(() => {
  loadCategories();
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold">Categories</h1>
        <p class="text-muted-foreground">Organize your transactions with categories</p>
      </div>
      <UiButton @click="navigateTo('/dashboard/categories/new')">
        Add Category
      </UiButton>
    </div>

    <div v-if="loading" class="text-center py-8">
      <p>Loading...</p>
    </div>

    <div v-else-if="categories.length === 0" class="text-center py-8">
      <p class="text-muted-foreground">No categories yet.</p>
      <UiButton class="mt-4" @click="navigateTo('/dashboard/categories/new')">
        Add Your First Category
      </UiButton>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <UiCard v-for="category in categories" :key="category.id">
        <UiCardHeader>
          <UiCardTitle class="flex items-center gap-2">
            <span v-if="category.icon" class="text-2xl">{{ category.icon }}</span>
            <span>{{ category.name }}</span>
          </UiCardTitle>
        </UiCardHeader>
        <UiCardContent>
          <div class="flex gap-2 items-center">
            <div
              v-if="category.color"
              class="w-8 h-8 rounded border"
              :style="{ backgroundColor: category.color }"
            ></div>
            <div class="flex gap-2 ml-auto">
              <UiButton variant="outline" size="sm" @click="handleEdit(category)">
                Edit
              </UiButton>
              <UiButton variant="destructive" size="sm" @click="handleDelete(category)">
                Delete
              </UiButton>
            </div>
          </div>
        </UiCardContent>
      </UiCard>
    </div>
  </div>
</template>
