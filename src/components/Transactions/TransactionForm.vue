<script setup lang="ts">
import type { ITransaction, ICreateTransaction } from "~/@schemas/models/transaction";
import type { IBankAccount } from "~/@schemas/models/bank-account";
import type { ICategory } from "~/@schemas/models/category";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import { Timestamp } from "firebase/firestore";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

type IProps = {
  transaction?: ITransaction;
  bankAccounts: IBankAccount[];
  categories: ICategory[];
  creditors: ICounterparty[];
  loading?: boolean;
};

const props = withDefaults(defineProps<IProps>(), {
  loading: false,
});

const emit = defineEmits<{
  submit: [data: ICreateTransaction, creditorName?: string];
  cancel: [];
}>();

const userStore = useUserStore();
const { currentUser } = storeToRefs(userStore);

const form = ref({
  type: props.transaction?.type || "expense",
  amount: props.transaction?.amount || 0,
  description: props.transaction?.description || "",
  date: props.transaction?.date || Timestamp.now(),
  bankAccountId: props.transaction?.bankAccountId || "",
  creditorName: "",
  counterpartyId: props.transaction?.counterpartyId || null,
  categoryIds: props.transaction?.categoryIds || [],
});

watch(
  () => props.transaction,
  (newVal) => {
    if (newVal) {
      form.value.type = newVal.type;
      form.value.amount = newVal.amount;
      form.value.description = newVal.description;
      form.value.date = newVal.date;
      form.value.bankAccountId = newVal.bankAccountId;
      form.value.counterpartyId = newVal.counterpartyId || null;
      form.value.categoryIds = newVal.categoryIds || [];

      if (newVal.counterpartyId) {
        const creditor = props.creditors.find((c) => c.id === newVal.counterpartyId);
        if (creditor) {
          form.value.creditorName = creditor.name;
        }
      }
    }
  }
);

const dateString = computed({
  get: () => {
    const date = form.value.date.toDate();
    return date.toISOString().split("T")[0];
  },
  set: (value: string) => {
    form.value.date = Timestamp.fromDate(new Date(value));
  },
});

const handleSubmit = () => {
  if (!currentUser.value) return;

  const data: ICreateTransaction = {
    type: form.value.type as "deposit" | "expense",
    amount: Number(form.value.amount),
    description: form.value.description,
    date: form.value.date,
    bankAccountId: form.value.bankAccountId,
    counterpartyId: form.value.counterpartyId,
    categoryIds: form.value.categoryIds,
    userId: currentUser.value.id,
  };

  emit("submit", data, form.value.creditorName || undefined);
};

const getBankAccountName = (id: string) => {
  return props.bankAccounts.find((b) => b.id === id)?.name || "Unknown";
};
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div class="space-y-2">
      <Label for="type">Type</Label>
      <Select v-model="form.type">
        <SelectTrigger>
          <SelectValue :placeholder="form.type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="deposit">Deposit</SelectItem>
          <SelectItem value="expense">Expense</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="space-y-2">
      <Label for="amount">Amount</Label>
      <Input
        id="amount"
        v-model.number="form.amount"
        type="number"
        step="0.01"
        required
      />
    </div>

    <div class="space-y-2">
      <Label for="description">Description</Label>
      <Textarea
        id="description"
        v-model="form.description"
        placeholder="Enter transaction description"
      />
    </div>

    <div class="space-y-2">
      <Label for="date">Date</Label>
      <Input
        id="date"
        v-model="dateString"
        type="date"
        required
      />
    </div>

    <div class="space-y-2">
      <Label for="bankAccount">Bank Account</Label>
      <Select v-model="form.bankAccountId">
        <SelectTrigger>
          <SelectValue :placeholder="form.bankAccountId ? getBankAccountName(form.bankAccountId) : 'Select account'" />
        </SelectTrigger>
        <SelectContent>
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

    <div class="space-y-2">
      <Label for="creditor">Creditor</Label>
      <Input
        id="creditor"
        v-model="form.creditorName"
        placeholder="Enter creditor name"
        list="creditors-list"
      />
      <datalist id="creditors-list">
        <option v-for="creditor in creditors" :key="creditor.id" :value="creditor.name" />
      </datalist>
    </div>

    <div class="space-y-2">
      <Label for="category">Categories</Label>
      <Select v-model="form.categoryIds[0]">
        <SelectTrigger>
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
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

    <div class="flex gap-2 justify-end">
      <Button type="button" variant="outline" @click="emit('cancel')">
        Cancel
      </Button>
      <Button type="submit" :disabled="loading">
        {{ transaction ? "Update" : "Create" }} Transaction
      </Button>
    </div>
  </form>
</template>
