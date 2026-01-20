<script setup lang="ts">
import type { ICategory } from "~/@schemas/models/category";
import type { ICreditor } from "~/@schemas/models/creditor";
import type { IBankAccount } from "~/@schemas/models/bank-account";
import { UiButton } from "~/components/ui/button";
import { UiInput } from "~/components/ui/input";
import { UiLabel } from "~/components/ui/label";
import {
  UiSelect,
  UiSelectContent,
  UiSelectItem,
  UiSelectTrigger,
  UiSelectValue,
} from "~/components/ui/select";

type IProps = {
  categories: ICategory[];
  creditors: ICreditor[];
  bankAccounts: IBankAccount[];
};

const props = defineProps<IProps>();

const emit = defineEmits<{
  filter: [filters: {
    startDate?: string;
    endDate?: string;
    categoryId?: string;
    creditorId?: string;
    bankAccountId?: string;
    type?: "deposit" | "expense" | "";
  }];
  clear: [];
}>();

const filters = ref({
  startDate: "",
  endDate: "",
  categoryId: "",
  creditorId: "",
  bankAccountId: "",
  type: "" as "deposit" | "expense" | "",
});

const applyFilters = () => {
  emit("filter", { ...filters.value });
};

const clearFilters = () => {
  filters.value = {
    startDate: "",
    endDate: "",
    categoryId: "",
    creditorId: "",
    bankAccountId: "",
    type: "",
  };
  emit("clear");
};
</script>

<template>
  <div class="space-y-4 p-4 border rounded-lg">
    <h3 class="font-medium">Filters</h3>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div class="space-y-2">
        <UiLabel for="startDate">Start Date</UiLabel>
        <UiInput id="startDate" v-model="filters.startDate" type="date" />
      </div>

      <div class="space-y-2">
        <UiLabel for="endDate">End Date</UiLabel>
        <UiInput id="endDate" v-model="filters.endDate" type="date" />
      </div>

      <div class="space-y-2">
        <UiLabel for="type">Type</UiLabel>
        <UiSelect v-model="filters.type">
          <UiSelectTrigger>
            <UiSelectValue placeholder="All types" />
          </UiSelectTrigger>
          <UiSelectContent>
            <UiSelectItem value="">All</UiSelectItem>
            <UiSelectItem value="deposit">Deposit</UiSelectItem>
            <UiSelectItem value="expense">Expense</UiSelectItem>
          </UiSelectContent>
        </UiSelect>
      </div>

      <div class="space-y-2">
        <UiLabel for="category">Category</UiLabel>
        <UiSelect v-model="filters.categoryId">
          <UiSelectTrigger>
            <UiSelectValue placeholder="All categories" />
          </UiSelectTrigger>
          <UiSelectContent>
            <UiSelectItem value="">All</UiSelectItem>
            <UiSelectItem
              v-for="category in categories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.name }}
            </UiSelectItem>
          </UiSelectContent>
        </UiSelect>
      </div>

      <div class="space-y-2">
        <UiLabel for="creditor">Creditor</UiLabel>
        <UiSelect v-model="filters.creditorId">
          <UiSelectTrigger>
            <UiSelectValue placeholder="All creditors" />
          </UiSelectTrigger>
          <UiSelectContent>
            <UiSelectItem value="">All</UiSelectItem>
            <UiSelectItem
              v-for="creditor in creditors"
              :key="creditor.id"
              :value="creditor.id"
            >
              {{ creditor.name }}
            </UiSelectItem>
          </UiSelectContent>
        </UiSelect>
      </div>

      <div class="space-y-2">
        <UiLabel for="bankAccount">Bank Account</UiLabel>
        <UiSelect v-model="filters.bankAccountId">
          <UiSelectTrigger>
            <UiSelectValue placeholder="All accounts" />
          </UiSelectTrigger>
          <UiSelectContent>
            <UiSelectItem value="">All</UiSelectItem>
            <UiSelectItem
              v-for="account in bankAccounts"
              :key="account.id"
              :value="account.id"
            >
              {{ account.name }}
            </UiSelectItem>
          </UiSelectContent>
        </UiSelect>
      </div>
    </div>

    <div class="flex gap-2">
      <UiButton @click="applyFilters">Apply Filters</UiButton>
      <UiButton variant="outline" @click="clearFilters">Clear</UiButton>
    </div>
  </div>
</template>
