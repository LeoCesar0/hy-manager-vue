<script setup lang="ts">
import type { ICategory, IUpdateCategory } from "~/@schemas/models/category";
import { updateCategory } from "~/services/api/categories/update-category";
import CategoryForm from "~/components/Categories/CategoryForm.vue";
import {
  UiCard,
  UiCardContent,
  UiCardDescription,
  UiCardHeader,
  UiCardTitle,
} from "~/components/ui/card";

definePageMeta({
  layout: "dashboard",
});

const route = useRoute();
const router = useRouter();
const firebaseStore = useFirebaseStore();

const categoryId = route.params.id as string;
const category = ref<ICategory | null>(null);
const loading = ref(false);
const loadingData = ref(false);

const loadCategory = async () => {
  loadingData.value = true;
  const result = await firebaseStore.modelGet<ICategory>({
    collection: "categories",
    id: categoryId,
  });
  loadingData.value = false;

  if (result.data) {
    category.value = result.data;
  }
};

const handleSubmit = async (data: IUpdateCategory) => {
  loading.value = true;
  const result = await updateCategory(categoryId, data);
  loading.value = false;

  if (result.error) {
    console.error("Error updating category:", result.error);
    return;
  }

  router.push("/dashboard/categories");
};

const handleCancel = () => {
  router.push("/dashboard/categories");
};

onMounted(() => {
  loadCategory();
});
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <div>
      <h1 class="text-3xl font-bold">Edit Category</h1>
      <p class="text-muted-foreground">Update your category details</p>
    </div>

    <div v-if="loadingData" class="text-center py-8">
      <p>Loading...</p>
    </div>

    <UiCard v-else-if="category">
      <UiCardHeader>
        <UiCardTitle>Category Details</UiCardTitle>
        <UiCardDescription>Update the name, icon, and color</UiCardDescription>
      </UiCardHeader>
      <UiCardContent>
        <CategoryForm
          :category="category"
          :loading="loading"
          @submit="handleSubmit"
          @cancel="handleCancel"
        />
      </UiCardContent>
    </UiCard>
  </div>
</template>
