<script setup lang="ts">
import type { ITransaction } from "~/@schemas/models/transaction";
import TransactionForm from "./TransactionForm.vue";

type IProps = {
  isOpen: boolean;
  initialValues: ITransaction | null;
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
        <UiSheetTitle>Editar Transação</UiSheetTitle>
        <UiSheetDescription>
          Atualize as informações da transação
        </UiSheetDescription>
      </UiSheetHeader>
      <UiSheetBody>
        <TransactionForm v-if="initialValues" :initial-values="initialValues" :is-edit-mode="true"
          @success="handleSuccess" @cancel="handleCancel" />
      </UiSheetBody>
    </UiSheetContent>
  </UiSheet>
</template>
