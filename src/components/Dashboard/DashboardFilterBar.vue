<script setup lang="ts">
import { CalendarIcon, XIcon } from "lucide-vue-next";
import { Timestamp } from "firebase/firestore";
import { PERIOD_OPTIONS, type PeriodKey } from "~/composables/useDashboardAnalytics";
import { formatDate } from "~/helpers/formatDate";
import DatePicker from "~/components/Form/Field/DatePicker.vue";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";

type IProps = {
  selectedPeriod: PeriodKey;
  startDate: Timestamp | null;
  endDate: Timestamp | null;
  onSelectPeriod: (key: PeriodKey) => void;
  onUpdateStartDate: (value: Timestamp | null) => void;
  onUpdateEndDate: (value: Timestamp | null) => void;
  onClear: () => void;
};

const props = defineProps<IProps>();

const isCustom = computed(() => props.selectedPeriod === "custom");

const dateRangeLabel = computed(() => {
  if (!props.startDate || !props.endDate) return "";
  return `${formatDate(props.startDate)} — ${formatDate(props.endDate)}`;
});
</script>

<template>
  <div class="flex flex-wrap items-end gap-3">
    <div class="space-y-1">
      <label class="text-sm font-medium">Período</label>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        :model-value="selectedPeriod"
        @update:model-value="(v) => { if (v) onSelectPeriod(v as PeriodKey) }"
      >
        <ToggleGroupItem
          v-for="option in PERIOD_OPTIONS"
          :key="option.key"
          :value="option.key"
        >
          {{ option.label }}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>

    <p v-if="!isCustom && dateRangeLabel" class="mb-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
      <CalendarIcon class="h-3.5 w-3.5" />
      {{ dateRangeLabel }}
    </p>

    <template v-if="isCustom">
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
    </template>

    <UiButton variant="ghost" size="sm" @click="onClear" class="mb-0.5">
      <XIcon class="h-4 w-4 mr-1" />
      Limpar
    </UiButton>
  </div>
</template>
