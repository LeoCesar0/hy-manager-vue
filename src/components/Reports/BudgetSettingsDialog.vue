<script setup lang="ts">
import { PlusIcon, TrashIcon } from "lucide-vue-next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";
import type { IBudget, ICategoryBudget } from "~/@schemas/models/budget";
import type { ICategory } from "~/@schemas/models/category";

type IProps = {
  open: boolean;
  budget: IBudget | null;
  categories: ICategory[];
  onClose: () => void;
  onSave: (data: {
    monthlyExpenseLimit: number | null;
    monthlyIncomeGoal: number | null;
    categoryBudgets: ICategoryBudget[];
  }) => void;
};

const props = defineProps<IProps>();

const expenseLimit = ref<string>("");
const incomeGoal = ref<string>("");
const categoryBudgets = ref<{ categoryId: string; type: "expense" | "deposit"; amount: string }[]>([]);
const isSaving = ref(false);

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.budget) {
      expenseLimit.value = props.budget.monthlyExpenseLimit?.toString() ?? "";
      incomeGoal.value = props.budget.monthlyIncomeGoal?.toString() ?? "";
      categoryBudgets.value = props.budget.categoryBudgets.map((cb) => ({
        categoryId: cb.categoryId,
        type: cb.type,
        amount: cb.amount.toString(),
      }));
    }
  }
);

const availableCategories = computed(() => {
  const usedIds = new Set(categoryBudgets.value.map((cb) => cb.categoryId));
  return props.categories.filter((c) => !usedIds.has(c.id));
});

const addCategoryBudget = () => {
  if (availableCategories.value.length === 0) return;
  categoryBudgets.value.push({
    categoryId: availableCategories.value[0]!.id,
    type: "expense",
    amount: "",
  });
};

const removeCategoryBudget = (index: number) => {
  categoryBudgets.value.splice(index, 1);
};

const getCategoryName = (id: string) => {
  return props.categories.find((c) => c.id === id)?.name ?? "—";
};

const handleSave = async () => {
  isSaving.value = true;
  try {
    const parsedLimit = expenseLimit.value ? parseFloat(expenseLimit.value) : null;
    const parsedGoal = incomeGoal.value ? parseFloat(incomeGoal.value) : null;

    const parsedCategoryBudgets: ICategoryBudget[] = categoryBudgets.value
      .filter((cb) => cb.amount && parseFloat(cb.amount) > 0)
      .map((cb) => ({
        categoryId: cb.categoryId,
        type: cb.type,
        amount: parseFloat(cb.amount),
      }));

    props.onSave({
      monthlyExpenseLimit: parsedLimit && parsedLimit > 0 ? parsedLimit : null,
      monthlyIncomeGoal: parsedGoal && parsedGoal > 0 ? parsedGoal : null,
      categoryBudgets: parsedCategoryBudgets,
    });
    props.onClose();
  } finally {
    isSaving.value = false;
  }
};
</script>

<template>
  <Dialog :open="open" @update:open="(v) => !v && onClose()">
    <DialogContent class="max-w-lg max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Configurar Orçamento</DialogTitle>
        <DialogDescription>
          Defina limites de gastos e metas de receita para o mês atual.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6 py-4">
        <div class="space-y-2">
          <label class="text-sm font-medium">Limite de gastos mensal (R$)</label>
          <UiInput
            v-model="expenseLimit"
            type="number"
            placeholder="Ex: 5000"
            step="0.01"
            min="0"
          />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Meta de receita mensal (R$)</label>
          <UiInput
            v-model="incomeGoal"
            type="number"
            placeholder="Ex: 8000"
            step="0.01"
            min="0"
          />
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium">Orçamento por Categoria</label>
            <UiButton
              size="sm"
              variant="outline"
              :disabled="availableCategories.length === 0"
              @click="addCategoryBudget"
            >
              <PlusIcon class="h-4 w-4 mr-1" />
              Adicionar
            </UiButton>
          </div>

          <div
            v-for="(cb, index) in categoryBudgets"
            :key="index"
            class="flex items-end gap-2 p-3 rounded-lg border"
          >
            <div class="flex-1 space-y-1">
              <label class="text-xs text-muted-foreground">Categoria</label>
              <select
                v-model="cb.categoryId"
                class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option
                  v-for="cat in [...categories.filter((c) => c.id === cb.categoryId), ...availableCategories]"
                  :key="cat.id"
                  :value="cat.id"
                >
                  {{ cat.name }}
                </option>
              </select>
            </div>

            <div class="w-28 space-y-1">
              <label class="text-xs text-muted-foreground">Tipo</label>
              <select
                v-model="cb.type"
                class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="expense">Saída</option>
                <option value="deposit">Entrada</option>
              </select>
            </div>

            <div class="w-32 space-y-1">
              <label class="text-xs text-muted-foreground">Valor (R$)</label>
              <UiInput
                v-model="cb.amount"
                type="number"
                placeholder="0,00"
                step="0.01"
                min="0"
              />
            </div>

            <UiButton
              size="icon"
              variant="ghost"
              class="shrink-0 text-destructive hover:text-destructive"
              @click="removeCategoryBudget(index)"
            >
              <TrashIcon class="h-4 w-4" />
            </UiButton>
          </div>

          <p
            v-if="categoryBudgets.length === 0"
            class="text-xs text-muted-foreground text-center py-2"
          >
            Nenhum orçamento por categoria configurado
          </p>
        </div>
      </div>

      <DialogFooter>
        <UiButton variant="outline" @click="onClose">Cancelar</UiButton>
        <UiButton :disabled="isSaving" @click="handleSave">
          Salvar
        </UiButton>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
