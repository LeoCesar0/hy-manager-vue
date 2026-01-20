<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import {
  UiCard,
  UiCardContent,
  UiCardHeader,
  UiCardTitle,
} from "~/components/ui/card";

type CategoryData = {
  id: string;
  name: string;
  amount: number;
  color?: string;
};

type IProps = {
  data: CategoryData[];
};

const props = defineProps<IProps>();

const chartOptions = ref({
  chart: {
    type: "donut",
  },
  labels: [] as string[],
  colors: [] as string[],
  legend: {
    position: "bottom",
  },
  dataLabels: {
    enabled: true,
  },
});

const series = ref<number[]>([]);

const updateChart = () => {
  if (props.data.length === 0) {
    series.value = [];
    chartOptions.value.labels = [];
    return;
  }

  series.value = props.data.map((d) => d.amount);
  chartOptions.value.labels = props.data.map((d) => d.name);
  chartOptions.value.colors = props.data.map(
    (d) => d.color || "#3b82f6"
  );
};

watch(() => props.data, updateChart, { deep: true });

onMounted(() => {
  updateChart();
});
</script>

<template>
  <UiCard>
    <UiCardHeader>
      <UiCardTitle>Expenses by Category</UiCardTitle>
    </UiCardHeader>
    <UiCardContent>
      <div v-if="data.length === 0" class="text-center py-8 text-muted-foreground">
        No category data available
      </div>
      <ClientOnly v-else>
        <apexchart
          type="donut"
          :options="chartOptions"
          :series="series"
          height="300"
        />
      </ClientOnly>
    </UiCardContent>
  </UiCard>
</template>
