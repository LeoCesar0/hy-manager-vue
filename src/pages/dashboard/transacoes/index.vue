<script setup lang="ts">
import DashboardSection from "~/components/Dashboard/DashboardSection.vue";
import TransactionListSection from "~/components/Transactions/TransactionListSection.vue";

definePageMeta({
  layout: "dashboard",
});
</script>

<template>
  <DashboardSection title="Transações" subtitle="Gerencie suas receitas e despesas">
    <TransactionListSection />
  </DashboardSection>
</template>
