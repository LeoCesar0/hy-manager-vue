<script setup lang="ts">
import type { IBudget } from "~/@schemas/models/budget";
import type { ICategory } from "~/@schemas/models/category";
import BudgetSettingsForm, {
  type IBudgetFormPayload,
} from "~/components/Reports/BudgetSettingsForm.vue";

type IProps = {
  open: boolean;
  budget: IBudget | null;
  categories: ICategory[];
  onClose: () => void;
  onSave: (data: IBudgetFormPayload) => void;
};

const props = defineProps<IProps>();

const formRef = ref<InstanceType<typeof BudgetSettingsForm> | null>(null);
const isSaving = ref(false);

const handleSave = () => {
  if (!formRef.value) return;
  isSaving.value = true;
  try {
    props.onSave(formRef.value.getPayload());
    props.onClose();
  } finally {
    isSaving.value = false;
  }
};
</script>

<template>
  <UiDialog :open="open" @update:open="(v) => !v && onClose()">
    <UiDialogContent class="max-w-lg max-h-[80vh] overflow-y-auto overflow-x-hidden">
      <UiDialogHeader>
        <UiDialogTitle>Configurar Objetivo</UiDialogTitle>
        <UiDialogDescription>
          Defina limites de gastos e metas de receita para o mês atual.
        </UiDialogDescription>
      </UiDialogHeader>

      <!-- v-if remounts the form on each open, re-hydrating from `budget` so a
           cancelled edit never carries over to the next open. -->
      <BudgetSettingsForm
        v-if="open"
        ref="formRef"
        :budget="budget"
        :categories="categories"
        class="py-4"
      />

      <UiDialogFooter>
        <UiButton variant="outline" @click="onClose">Cancelar</UiButton>
        <UiButton :disabled="isSaving" @click="handleSave">Salvar</UiButton>
      </UiDialogFooter>
    </UiDialogContent>
  </UiDialog>
</template>
