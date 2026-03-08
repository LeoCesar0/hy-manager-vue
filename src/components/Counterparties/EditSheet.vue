<script setup lang="ts">
import type { ICounterparty } from "~/@schemas/models/counterparty";
import CounterpartyForm from "./CounterpartyForm.vue";
import { useVModel } from "@vueuse/core";

type Props = {
  isOpen: boolean;
  initialValues: ICounterparty | null;
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
        <UiSheetTitle>Editar Terceiro</UiSheetTitle>
        <UiSheetDescription>Edite as informações do terceiro</UiSheetDescription>
      </UiSheetHeader>
      <UiSheetBody>
        <CounterpartyForm
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
