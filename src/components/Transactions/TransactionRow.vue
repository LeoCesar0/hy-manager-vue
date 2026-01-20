<script setup lang="ts">
import type { ITransaction } from "~/@schemas/models/transaction";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";

type IProps = {
  transaction: ITransaction;
  bankAccountName?: string;
  categoryName?: string;
  creditorName?: string;
};

const props = withDefaults(defineProps<IProps>(), {
  bankAccountName: "Unknown",
  categoryName: "Uncategorized",
  creditorName: "Unknown",
});

const emit = defineEmits<{
  edit: [transaction: ITransaction];
  delete: [transaction: ITransaction];
}>();

const formattedDate = computed(() => {
  const date = props.transaction.date.toDate();
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
});

const formattedAmount = computed(() => {
  const amount = props.transaction.amount;
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.abs(amount));

  return props.transaction.type === "deposit" ? `+${formatted}` : `-${formatted}`;
});

const amountClass = computed(() => {
  return props.transaction.type === "deposit"
    ? "text-green-600"
    : "text-red-600";
});
</script>

<template>
  <tr class="border-b hover:bg-muted/50">
    <td class="p-4">{{ formattedDate }}</td>
    <td class="p-4">
      <div class="font-medium">{{ transaction.description }}</div>
      <div class="text-sm text-muted-foreground">{{ creditorName }}</div>
    </td>
    <td class="p-4">
      <Badge variant="outline">
        {{ categoryName }}
      </Badge>
    </td>
    <td class="p-4 text-sm text-muted-foreground">{{ bankAccountName }}</td>
    <td class="p-4 font-medium" :class="amountClass">{{ formattedAmount }}</td>
    <td class="p-4">
      <div class="flex gap-2">
        <Button variant="ghost" size="sm" @click="emit('edit', transaction)">
          Edit
        </Button>
        <Button variant="ghost" size="sm" @click="emit('delete', transaction)">
          Delete
        </Button>
      </div>
    </td>
  </tr>
</template>
