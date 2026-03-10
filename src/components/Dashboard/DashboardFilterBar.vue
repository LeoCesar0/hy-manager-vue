<script setup lang="ts">
import { XIcon } from "lucide-vue-next";
import { Timestamp } from "firebase/firestore";
import Datepicker from "~/components/Datepicker/index.vue";

type IProps = {
  startDate: Timestamp | null;
  endDate: Timestamp | null;
  onUpdateStartDate: (value: Timestamp | null) => void;
  onUpdateEndDate: (value: Timestamp | null) => void;
  onClear: () => void;
};

const props = defineProps<IProps>();
</script>

<template>
  <div class="flex flex-wrap items-end gap-3">
    <Datepicker
      label="Data inicial"
      :model-value="(startDate as any)"
      @update:model-value="(v: any) => onUpdateStartDate(v as Timestamp | null)"
      :clean-button="true"
      :on-clean-button="() => onUpdateStartDate(null)"
      :value-on-clean="null"
      class="max-w-[200px]"
    />
    <Datepicker
      label="Data final"
      :model-value="(endDate as any)"
      @update:model-value="(v: any) => onUpdateEndDate(v as Timestamp | null)"
      :clean-button="true"
      :on-clean-button="() => onUpdateEndDate(null)"
      :value-on-clean="null"
      class="max-w-[200px]"
    />
    <UiButton variant="ghost" size="sm" @click="onClear" class="mb-0.5">
      <XIcon class="h-4 w-4 mr-1" />
      Limpar
    </UiButton>
  </div>
</template>
