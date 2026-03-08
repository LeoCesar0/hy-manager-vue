<script setup lang="ts">
import { EditIcon, EyeIcon, TrashIcon } from "lucide-vue-next";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import type { ICategory } from "~/@schemas/models/category";
import { ROUTE } from "~/static/routes";
import { getCategoryIcon } from "~/static/category-icons";

type Props = {
  counterparty: ICounterparty;
  categories: ICategory[];
  handleView: (item: ICounterparty) => void;
  handleEdit: (item: ICounterparty) => void;
  handleDelete: (item: ICounterparty) => void;
};

const props = defineProps<Props>();

const resolvedCategories = computed(() => {
  return props.counterparty.categoryIds
    .map((id) => props.categories.find((c) => c.id === id))
    .filter(Boolean) as ICategory[];
});
</script>

<template>
  <UiCard class="p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
    <div class="flex flex-col gap-2 flex-1">
      <FancyLink :to="ROUTE.counterpartyId.path(counterparty.id)">
        <p class="font-medium text-base truncate">{{ counterparty.name }}</p>
      </FancyLink>
      <div v-if="resolvedCategories.length" class="flex flex-wrap gap-1">
        <UiBadge
          v-for="cat in resolvedCategories"
          :key="cat.id"
          variant="secondary"
          class="text-xs"
        >
          {{ cat.icon ? getCategoryIcon(cat.icon) : '' }} {{ cat.name }}
        </UiBadge>
      </div>
      <p v-else class="text-xs text-muted-foreground">Sem categorias</p>
    </div>
    <div class="flex items-center justify-end gap-1 border-t border-border pt-2">
      <UiButton variant="ghost" size="icon" title="Ver detalhes" @click="handleView(counterparty)">
        <EyeIcon class="h-4 w-4" />
      </UiButton>
      <UiButton variant="ghost" size="icon" title="Editar" @click="handleEdit(counterparty)">
        <EditIcon class="h-4 w-4" />
      </UiButton>
      <UiButton variant="ghost" size="icon" title="Deletar" @click="handleDelete(counterparty)">
        <TrashIcon class="h-4 w-4 text-destructive" />
      </UiButton>
    </div>
  </UiCard>
</template>
