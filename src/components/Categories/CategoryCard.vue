<script setup lang='ts'>
import { EditIcon, EyeIcon, TrashIcon } from 'lucide-vue-next';
import type { ICategory } from '~/@schemas/models/category';
import { getCategoryIcon } from '~/static/category-icons';
import { ROUTE } from '~/static/routes';
import PositiveExpenseIndicator from '~/components/Categories/PositiveExpenseIndicator.vue';

type Props = {
    category: ICategory;
    handleView: (item: ICategory) => void;
    handleEdit: (item: ICategory) => void;
    handleDelete: (item: ICategory) => void;
};

const props = defineProps<Props>();
</script>

<template>
    <UiCard class="p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
        <div class="flex items-center gap-3 flex-1">
            <div class="h-12 w-12 rounded-full shrink-0 border border-border flex items-center justify-center text-2xl"
                :style="{ backgroundColor: category.color || 'hsl(var(--muted))' }">
                {{ category.icon ? getCategoryIcon(category.icon) : '' }}
            </div>
            <div class="flex flex-col min-w-0">
                <FancyLink :to="ROUTE.categoryId.path(category.id)">
                    <div class="flex items-center gap-1.5">
                        <p class="font-medium truncate">{{ category.name }}</p>
                        <PositiveExpenseIndicator v-if="category.isPositiveExpense" />
                    </div>
                </FancyLink>
            </div>
        </div>
        <div class="flex items-center justify-end gap-1 border-t border-border pt-2">
            <UiButton variant="ghost" size="icon" title="Ver detalhes" @click="handleView(category)">
                <EyeIcon class="h-4 w-4" />
            </UiButton>
            <UiButton variant="ghost" size="icon" title="Editar" @click="handleEdit(category)">
                <EditIcon class="h-4 w-4" />
            </UiButton>
            <UiButton variant="ghost" size="icon" title="Deletar" @click="handleDelete(category)">
                <TrashIcon class="h-4 w-4 text-destructive" />
            </UiButton>
        </div>
    </UiCard>
</template>
