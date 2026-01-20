<script setup lang="ts">
import type { IBankAccount } from "~/@schemas/models/bank-account";
import {
  UiCard,
  UiCardContent,
  UiCardDescription,
  UiCardHeader,
  UiCardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";

type IProps = {
  bankAccount: IBankAccount;
  balance?: number;
};

const props = withDefaults(defineProps<IProps>(), {
  balance: 0,
});

const emit = defineEmits<{
  edit: [bankAccount: IBankAccount];
  delete: [bankAccount: IBankAccount];
}>();

const formattedBalance = computed(() => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(props.balance);
});
</script>

<template>
  <UiCard>
    <UiCardHeader>
      <UiCardTitle>{{ bankAccount.name }}</UiCardTitle>
      <UiCardDescription>
        Balance: {{ formattedBalance }}
      </UiCardDescription>
    </UiCardHeader>
    <UiCardContent>
      <div class="flex gap-2">
        <Button variant="outline" size="sm" @click="emit('edit', bankAccount)">
          Edit
        </Button>
        <Button variant="destructive" size="sm" @click="emit('delete', bankAccount)">
          Delete
        </Button>
      </div>
    </UiCardContent>
  </UiCard>
</template>
