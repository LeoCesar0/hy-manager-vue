<script setup lang="ts">
import type { ICreditor, IUpdateCreditor } from "~/@schemas/models/creditor";
import type { ICategory } from "~/@schemas/models/category";
import { updateCreditor } from "~/services/api/creditors/update-creditor";
import { getCategories } from "~/services/api/categories/get-categories";
import CategoryBadge from "~/components/Categories/CategoryBadge.vue";

definePageMeta({
  layout: "dashboard",
});

const route = useRoute();
const router = useRouter();
const firebaseStore = useFirebaseStore();
const userStore = useUserStore();
const { currentUser } = storeToRefs(userStore);

const creditorId = route.params.id as string;
const creditor = ref<ICreditor | null>(null);
const categories = ref<ICategory[]>([]);
const loading = ref(false);
const loadingData = ref(false);

const form = ref({
  name: "",
  categoryIds: [] as string[],
});

const loadCreditor = async () => {
  loadingData.value = true;
  const result = await firebaseStore.modelGet<ICreditor>({
    collection: "creditors",
    id: creditorId,
  });
  loadingData.value = false;

  if (result.data) {
    creditor.value = result.data;
    form.value.name = result.data.name;
    form.value.categoryIds = result.data.categoryIds;
  }
};

const loadCategories = async () => {
  if (!currentUser.value) return;

  const result = await getCategories({
    userId: currentUser.value.id,
  });

  if (result.data) {
    categories.value = result.data;
  }
};

const selectedCategories = computed(() => {
  return categories.value.filter((c) =>
    form.value.categoryIds.includes(c.id)
  );
});

const availableCategories = computed(() => {
  return categories.value.filter(
    (c) => !form.value.categoryIds.includes(c.id)
  );
});

const toggleCategory = (categoryId: string) => {
  const index = form.value.categoryIds.indexOf(categoryId);
  if (index > -1) {
    form.value.categoryIds.splice(index, 1);
  } else {
    form.value.categoryIds.push(categoryId);
  }
};

const handleSubmit = async () => {
  if (!currentUser.value) return;

  loading.value = true;
  const result = await updateCreditor(creditorId, {
    name: form.value.name,
    userId: currentUser.value.id,
    categoryIds: form.value.categoryIds,
  });
  loading.value = false;

  if (result.error) {
    console.error("Error updating creditor:", result.error);
    return;
  }

  router.push("/dashboard/creditors");
};

onMounted(() => {
  loadCreditor();
  loadCategories();
});
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <div>
      <h1 class="text-3xl font-bold">Creditor Details</h1>
      <p class="text-muted-foreground">View and edit creditor information</p>
    </div>

    <div v-if="loadingData" class="text-center py-8">
      <p>Loading...</p>
    </div>

    <div v-else-if="creditor" class="space-y-6">
      <UiCard>
        <UiCardHeader>
          <UiCardTitle>Basic Information</UiCardTitle>
          <UiCardDescription>Update creditor name</UiCardDescription>
        </UiCardHeader>
        <UiCardContent>
          <div class="space-y-2">
            <UiLabel for="name">Creditor Name</UiLabel>
            <UiInput id="name" v-model="form.name" required />
          </div>
        </UiCardContent>
      </UiCard>

      <UiCard>
        <UiCardHeader>
          <UiCardTitle>Associated Categories</UiCardTitle>
          <UiCardDescription>
            Link categories commonly used with this creditor
          </UiCardDescription>
        </UiCardHeader>
        <UiCardContent class="space-y-4">
          <div v-if="selectedCategories.length > 0">
            <p class="text-sm font-medium mb-2">Selected:</p>
            <div class="flex gap-2 flex-wrap">
              <div
                v-for="category in selectedCategories"
                :key="category.id"
                @click="toggleCategory(category.id)"
                class="cursor-pointer"
              >
                <CategoryBadge :category="category" />
              </div>
            </div>
          </div>

          <div v-if="availableCategories.length > 0">
            <p class="text-sm font-medium mb-2">Available:</p>
            <div class="flex gap-2 flex-wrap">
              <div
                v-for="category in availableCategories"
                :key="category.id"
                @click="toggleCategory(category.id)"
                class="cursor-pointer opacity-50 hover:opacity-100"
              >
                <CategoryBadge :category="category" />
              </div>
            </div>
          </div>

          <p v-if="categories.length === 0" class="text-sm text-muted-foreground">
            No categories available. Create some categories first.
          </p>
        </UiCardContent>
      </UiCard>

      <div class="flex gap-2 justify-end">
        <UiButton variant="outline" @click="router.push('/dashboard/creditors')">
          Cancel
        </UiButton>
        <UiButton @click="handleSubmit" :disabled="loading || !form.name.trim()">
          Save Changes
        </UiButton>
      </div>
    </div>
  </div>
</template>
