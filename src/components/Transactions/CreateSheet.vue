<script setup lang="ts">
import type { ICreateTransaction } from "~/@schemas/models/transaction";
import TransactionForm from "./TransactionForm.vue";

type IProps = {
  isOpen: boolean;
  initialValues: ICreateTransaction;
  onSuccess?: () => void;
  onCancel?: () => void;
};

const props = defineProps<IProps>();

const emit = defineEmits<{
  "update:isOpen": [value: boolean];
}>();

const handleSuccess = () => {
  emit("update:isOpen", false);
  props.onSuccess?.();
};

const handleCancel = () => {
  emit("update:isOpen", false);
  props.onCancel?.();
};
</script>

<template>
  <UiSheet :open="isOpen" @update:open="(value) => emit('update:isOpen', value)">
    <UiSheetContent class="overflow-y-auto">
      <UiSheetHeader>
        <UiSheetTitle>Nova Transação</UiSheetTitle>
        <UiSheetDescription>
          Crie uma nova transação de receita ou despesa
        </UiSheetDescription>
      </UiSheetHeader>
      <UiSheetBody>
        <TransactionForm :initial-values="initialValues" :is-edit-mode="false" @success="handleSuccess"
          @cancel="handleCancel" />
      </UiSheetBody>
    </UiSheetContent>
  </UiSheet>
</template>
