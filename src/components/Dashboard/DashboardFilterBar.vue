<script setup lang="ts">
import { XIcon } from "lucide-vue-next";
import { Timestamp } from "firebase/firestore";
import DatePicker from "~/components/Form/Field/DatePicker.vue";

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
    <div class="space-y-1 max-w-[200px]">
      <label class="text-sm font-medium">Data inicial</label>
      <DatePicker
        :model-value="startDate ?? undefined"
        @update:model-value="(v) => onUpdateStartDate(v as Timestamp | null)"
      />
    </div>
    <div class="space-y-1 max-w-[200px]">
      <label class="text-sm font-medium">Data final</label>
      <DatePicker
        :model-value="endDate ?? undefined"
        @update:model-value="(v) => onUpdateEndDate(v as Timestamp | null)"
      />
    </div>
    <UiButton variant="ghost" size="sm" @click="onClear" class="mb-0.5">
      <XIcon class="h-4 w-4 mr-1" />
      Limpar
    </UiButton>
  </div>
</template>
