<script setup lang="ts">
import { createCategory } from "~/services/api/categories/create-category";
import {
  UiCard,
  UiCardContent,
  UiCardDescription,
  UiCardHeader,
  UiCardTitle,
} from "~/components/ui/card";
import { UiButton } from "~/components/ui/button";
import { UiBadge } from "~/components/ui/badge";
import ProgressIndicator from "~/components/Onboarding/ProgressIndicator.vue";

const router = useRouter();
const userStore = useUserStore();
const { currentUser } = storeToRefs(userStore);

const loading = ref(false);

const defaultCategories = [
  { name: "Salary", icon: "💰", color: "#22c55e", type: "income" },
  { name: "Freelance", icon: "💼", color: "#3b82f6", type: "income" },
  { name: "Investments", icon: "📈", color: "#8b5cf6", type: "income" },
  { name: "Groceries", icon: "🛒", color: "#ef4444", type: "expense" },
  { name: "Transportation", icon: "🚗", color: "#f59e0b", type: "expense" },
  { name: "Housing", icon: "🏠", color: "#06b6d4", type: "expense" },
  { name: "Utilities", icon: "💡", color: "#eab308", type: "expense" },
  { name: "Entertainment", icon: "🎮", color: "#ec4899", type: "expense" },
  { name: "Healthcare", icon: "💊", color: "#14b8a6", type: "expense" },
  { name: "Dining", icon: "🍔", color: "#f97316", type: "expense" },
  { name: "Education", icon: "📚", color: "#6366f1", type: "expense" },
  { name: "Subscriptions", icon: "💳", color: "#a855f7", type: "expense" },
];

const selectedCategories = ref<Set<number>>(new Set());

const toggleCategory = (index: number) => {
  if (selectedCategories.value.has(index)) {
    selectedCategories.value.delete(index);
  } else {
    selectedCategories.value.add(index);
  }
};

const handleSubmit = async () => {
  if (!currentUser.value) return;

  const selectedCats = Array.from(selectedCategories.value).map(
    (index) => defaultCategories[index]
  );

  if (selectedCats.length === 0) {
    router.push("/dashboard");
    return;
  }

  loading.value = true;

  for (const category of selectedCats) {
    await createCategory({
      name: category.name,
      icon: category.icon,
      color: category.color,
      userId: currentUser.value.id,
    });
  }

  loading.value = false;
  router.push("/dashboard");
};

const handleSkip = () => {
  router.push("/dashboard");
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
    <UiCard class="w-full max-w-3xl">
      <UiCardHeader>
        <ProgressIndicator :current-step="3" :total-steps="3" />
        <UiCardTitle class="text-2xl text-center mt-4">
          Choose Your Categories
        </UiCardTitle>
        <UiCardDescription class="text-center">
          Select categories to help organize your transactions
        </UiCardDescription>
      </UiCardHeader>
      <UiCardContent class="space-y-6">
        <div>
          <h3 class="font-semibold mb-3 text-green-700">Income Categories</h3>
          <div class="flex gap-2 flex-wrap">
            <UiBadge
              v-for="(category, index) in defaultCategories.filter((c) => c.type === 'income')"
              :key="index"
              class="cursor-pointer text-base py-2 px-4 transition-all"
              :style="{
                backgroundColor: selectedCategories.has(defaultCategories.indexOf(category))
                  ? category.color + '40'
                  : '',
                borderColor: selectedCategories.has(defaultCategories.indexOf(category))
                  ? category.color
                  : '',
              }"
              variant="outline"
              @click="toggleCategory(defaultCategories.indexOf(category))"
            >
              <span class="mr-2">{{ category.icon }}</span>
              {{ category.name }}
            </UiBadge>
          </div>
        </div>

        <div>
          <h3 class="font-semibold mb-3 text-red-700">Expense Categories</h3>
          <div class="flex gap-2 flex-wrap">
            <UiBadge
              v-for="(category, index) in defaultCategories.filter((c) => c.type === 'expense')"
              :key="index"
              class="cursor-pointer text-base py-2 px-4 transition-all"
              :style="{
                backgroundColor: selectedCategories.has(defaultCategories.indexOf(category))
                  ? category.color + '40'
                  : '',
                borderColor: selectedCategories.has(defaultCategories.indexOf(category))
                  ? category.color
                  : '',
              }"
              variant="outline"
              @click="toggleCategory(defaultCategories.indexOf(category))"
            >
              <span class="mr-2">{{ category.icon }}</span>
              {{ category.name }}
            </UiBadge>
          </div>
        </div>

        <div class="flex gap-2 justify-end pt-4">
          <UiButton variant="outline" @click="handleSkip">
            Skip
          </UiButton>
          <UiButton @click="handleSubmit" :disabled="loading">
            {{ selectedCategories.size > 0 ? "Complete Setup" : "Finish" }}
          </UiButton>
        </div>
      </UiCardContent>
    </UiCard>
  </div>
</template>
