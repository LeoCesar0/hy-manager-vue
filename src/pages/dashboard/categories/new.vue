<script setup lang="ts">
import type { ICreateCategory } from "~/@schemas/models/category";
import { createCategory } from "~/services/api/categories/create-category";
import CategoryForm from "~/components/Categories/CategoryForm.vue";

definePageMeta({
  layout: "dashboard",
});

const router = useRouter();
const loading = ref(false);

const handleSubmit = async (data: ICreateCategory) => {
  loading.value = true;
  const result = await createCategory(data);
  loading.value = false;

  if (result.error) {
    console.error("Error creating category:", result.error);
    return;
  }

  router.push("/dashboard/categories");
};

const handleCancel = () => {
  router.push("/dashboard/categories");
};
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <div>
      <h1 class="text-3xl font-bold">New Category</h1>
      <p class="text-muted-foreground">Create a new category to organize your transactions</p>
    </div>

    <UiCard>
      <UiCardHeader>
        <UiCardTitle>Category Details</UiCardTitle>
        <UiCardDescription>Choose a name, icon, and color for your category</UiCardDescription>
      </UiCardHeader>
      <UiCardContent>
        <CategoryForm :loading="loading" @submit="handleSubmit" @cancel="handleCancel" />
      </UiCardContent>
    </UiCard>
  </div>
</template>
