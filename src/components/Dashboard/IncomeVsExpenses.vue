<script setup lang="ts">
import { ref, watch, onMounted } from "vue";

type DateData = {
  date: string;
  income: number;
  expenses: number;
};

type IProps = {
  data: DateData[];
};

const props = defineProps<IProps>();

const chartOptions = ref({
  chart: {
    type: "bar",
    stacked: false,
  },
  xaxis: {
    categories: [] as string[],
  },
  colors: ["#22c55e", "#ef4444"],
  legend: {
    position: "top",
  },
  dataLabels: {
    enabled: false,
  },
});

const series = ref([
  {
    name: "Income",
    data: [] as number[],
  },
  {
    name: "Expenses",
    data: [] as number[],
  },
]);

const updateChart = () => {
  if (props.data.length === 0) {
    chartOptions.value.xaxis.categories = [];
    series.value[0] && (series.value[0].data = []);
    series.value[1] && (series.value[1].data = []);
    return;
  }

  chartOptions.value.xaxis.categories = props.data.map((d) => d.date);
  series.value[0] && (series.value[0].data = props.data.map((d) => d.income));
  series.value[1] && (series.value[1].data = props.data.map((d) => d.expenses));
};

watch(() => props.data, updateChart, { deep: true });

onMounted(() => {
  updateChart();
});
</script>

<template>
  <UiCard>
    <UiCardHeader>
      <UiCardTitle>Income vs Expenses</UiCardTitle>
    </UiCardHeader>
    <UiCardContent>
      <div v-if="data.length === 0" class="text-center py-8 text-muted-foreground">
        No data available
      </div>
      <ClientOnly v-else>
       
      </ClientOnly>
    </UiCardContent>
  </UiCard>
</template>
