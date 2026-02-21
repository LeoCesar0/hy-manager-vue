<script setup lang="ts">
import type { ICreateCategory } from "~/@schemas/models/category";
import CategoryForm from "./CategoryForm.vue";
import { useVModel } from "@vueuse/core";

type Props = {
  isOpen: boolean;
  initialValues: ICreateCategory;
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
        <UiSheetTitle>Nova Categoria</UiSheetTitle>
        <UiSheetDescription>Adicione uma nova categoria</UiSheetDescription>
      </UiSheetHeader>
      <UiSheetBody>
        <CategoryForm
          v-if="initialValues"
          :initial-values="initialValues"
          :is-edit-mode="false"
          @success="onSuccess"
          @cancel="onCancel"
        />
      </UiSheetBody>
    </UiSheetContent>
  </UiSheet>
</template>
