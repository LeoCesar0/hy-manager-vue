<script setup lang="ts">
import { CalendarIcon } from "lucide-vue-next";

type IProps = {
  selectedMonths: string[];
  availableMonths: string[];
  onSelectPreset: (months: number) => void;
  onSelectYear: (year: number) => void;
  onUpdateMonths: (months: string[]) => void;
};

const props = defineProps<IProps>();

const presets = [
  { label: "3 meses", value: 3 },
  { label: "6 meses", value: 6 },
  { label: "12 meses", value: 12 },
];

const availableYears = computed(() => {
  const years = new Set<number>();
  for (const key of props.availableMonths) {
    const year = parseInt(key.split("-")[0]!);
    years.add(year);
  }
  return [...years].sort((a, b) => b - a);
});

const selectedPreset = computed(() => {
  const now = new Date();
  for (const preset of presets) {
    const months: string[] = [];
    for (let i = preset.value - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      months.push(`${year}-${month}`);
    }
    if (
      months.length === props.selectedMonths.length &&
      months.every((m) => props.selectedMonths.includes(m))
    ) {
      return preset.value;
    }
  }
  return null;
});

const toggleMonth = (monthKey: string) => {
  const current = [...props.selectedMonths];
  const index = current.indexOf(monthKey);
  if (index >= 0) {
    if (current.length > 1) {
      current.splice(index, 1);
      props.onUpdateMonths(current);
    }
  } else {
    if (current.length < 12) {
      current.push(monthKey);
      props.onUpdateMonths(current.sort());
    }
  }
};

const formatMonthLabel = (key: string) => {
  const [year, month] = key.split("-");
  const monthNames = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];
  return `${monthNames[parseInt(month!) - 1]} ${year}`;
};
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-2">
      <div class="flex items-center gap-1.5 text-sm text-muted-foreground mr-2">
        <CalendarIcon class="h-4 w-4" />
        <span>Período:</span>
      </div>

      <UiButton
        v-for="preset in presets"
        :key="preset.value"
        size="sm"
        :variant="selectedPreset === preset.value ? 'default' : 'outline'"
        @click="onSelectPreset(preset.value)"
      >
        {{ preset.label }}
      </UiButton>

      <div v-if="availableYears.length > 0" class="flex items-center gap-1 ml-2">
        <UiButton
          v-for="year in availableYears"
          :key="year"
          size="sm"
          variant="outline"
          @click="onSelectYear(year)"
        >
          {{ year }}
        </UiButton>
      </div>
    </div>

    <div v-if="availableMonths.length > 0" class="flex flex-wrap gap-1.5">
      <UiButton
        v-for="month in availableMonths"
        :key="month"
        size="sm"
        :variant="selectedMonths.includes(month) ? 'default' : 'ghost'"
        class="text-xs h-7 px-2"
        @click="toggleMonth(month)"
      >
        {{ formatMonthLabel(month) }}
      </UiButton>
    </div>
  </div>
</template>
