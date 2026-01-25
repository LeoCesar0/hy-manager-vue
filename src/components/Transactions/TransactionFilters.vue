<script setup lang="ts">
import type { ICategory } from "~/@schemas/models/category";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import type { IBankAccount } from "~/@schemas/models/bank-account";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

type IProps = {
  categories: ICategory[];
  creditors: ICounterparty[];
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
        <Label for="startDate">Start Date</Label>
        <Input id="startDate" v-model="filters.startDate" type="date" />
      </div>

      <div class="space-y-2">
        <Label for="endDate">End Date</Label>
        <Input id="endDate" v-model="filters.endDate" type="date" />
      </div>

      <div class="space-y-2">
        <Label for="type">Type</Label>
        <Select v-model="filters.type">
          <SelectTrigger>
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="deposit">Deposit</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="space-y-2">
        <Label for="category">Category</Label>
        <Select v-model="filters.categoryId">
          <SelectTrigger>
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem
              v-for="category in categories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.name }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="space-y-2">
        <Label for="creditor">Creditor</Label>
        <Select v-model="filters.creditorId">
          <SelectTrigger>
            <SelectValue placeholder="All creditors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem
              v-for="creditor in creditors"
              :key="creditor.id"
              :value="creditor.id"
            >
              {{ creditor.name }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="space-y-2">
        <Label for="bankAccount">Bank Account</Label>
        <Select v-model="filters.bankAccountId">
          <SelectTrigger>
            <SelectValue placeholder="All accounts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem
              v-for="account in bankAccounts"
              :key="account.id"
              :value="account.id"
            >
              {{ account.name }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <div class="flex gap-2">
      <Button @click="applyFilters">Apply Filters</Button>
      <Button variant="outline" @click="clearFilters">Clear</Button>
    </div>
  </div>
</template>
