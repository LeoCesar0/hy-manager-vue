<script setup lang="ts">
import type { ICategory } from "~/@schemas/models/category";
import CategoryForm from "./CategoryForm.vue";
import { useVModel } from "@vueuse/core";

type Props = {
  isOpen: boolean;
  initialValues: ICategory | null;
  onSuccess: () => void;
  onCancel: () => void;
};

const props = defineProps<Props>();
const open = useVModel(props, "isOpen");
</script>

<template>
  <UiSheet v-model:open="open">
    <UiSheetContent class="overflow-y-auto">
      <UiSheetHeader>
        <UiSheetTitle>Editar Categoria</UiSheetTitle>
        <UiSheetDescription>Edite as informações da categoria</UiSheetDescription>
      </UiSheetHeader>
      <UiSheetBody>
        <CategoryForm
          v-if="initialValues"
          :initial-values="initialValues"
          :is-edit-mode="true"
          @success="onSuccess"
          @cancel="onCancel"
        />
      </UiSheetBody>
    </UiSheetContent>
  </UiSheet>
</template>
