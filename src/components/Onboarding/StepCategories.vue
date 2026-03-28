<script setup lang="ts">
import { FolderIcon, ArrowLeftIcon, CheckIcon } from "lucide-vue-next";
import { DEFAULT_CATEGORIES, DEFAULT_CATEGORY_COLORS_MAP, type DefaultCategory } from "~/static/default-categories";
import { getCategoryIcon } from "~/static/category-icons";

type IProps = {
  onNext: (selectedCategories: DefaultCategory[]) => void;
  onBack: () => void;
  isSubmitting: boolean;
};

const props = defineProps<IProps>();

const selectedCategories = ref<Set<DefaultCategory>>(
  new Set(DEFAULT_CATEGORIES.map((c) => c.name as DefaultCategory))
);

const error = ref("");

const toggleCategory = (name: DefaultCategory) => {
  const newSet = new Set(selectedCategories.value);
  if (newSet.has(name)) {
    newSet.delete(name);
  } else {
    newSet.add(name);
  }
  selectedCategories.value = newSet;
  error.value = "";
};

const handleNext = () => {
  if (selectedCategories.value.size === 0) {
    error.value = "Selecione pelo menos uma categoria";
    return;
  }
  error.value = "";
  props.onNext(Array.from(selectedCategories.value));
};
</script>

<template>
  <div class="space-y-6">
    <div class="text-center space-y-2">
      <div class="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
        <FolderIcon class="h-8 w-8 text-primary" />
      </div>
      <h2 class="text-2xl font-semibold">Categorias</h2>
      <p class="text-muted-foreground">
        Selecione as categorias que deseja usar. Você pode alterar depois.
      </p>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
      <button
        v-for="category in DEFAULT_CATEGORIES"
        :key="category.name"
        type="button"
        class="relative flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition-all cursor-pointer"
        :class="[
          selectedCategories.has(category.name as DefaultCategory)
            ? 'border-primary bg-primary/5 ring-1 ring-primary'
            : 'border-border hover:border-muted-foreground/30',
        ]"
        @click="toggleCategory(category.name as DefaultCategory)"
      >
        <span class="text-lg shrink-0">{{ getCategoryIcon(category.icon) }}</span>
        <span class="truncate">{{ category.name }}</span>
        <CheckIcon
          v-if="selectedCategories.has(category.name as DefaultCategory)"
          class="h-4 w-4 text-primary ml-auto shrink-0"
        />
      </button>
    </div>

    <p v-if="error" class="text-sm text-destructive text-center">{{ error }}</p>

    <div class="flex gap-3">
      <UiButton variant="outline" class="flex-1" :disabled="isSubmitting" @click="onBack">
        <ArrowLeftIcon class="h-4 w-4 mr-1" />
        Voltar
      </UiButton>
      <UiButton class="flex-1" :disabled="isSubmitting" @click="handleNext">
        {{ isSubmitting ? "Configurando..." : "Finalizar" }}
      </UiButton>
    </div>
  </div>
</template>
