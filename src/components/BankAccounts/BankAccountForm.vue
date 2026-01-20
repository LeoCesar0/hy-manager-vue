<script setup lang="ts">
import type { IBankAccount, ICreateBankAccount } from "~/@schemas/models/bank-account";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

type IProps = {
  bankAccount?: IBankAccount;
  loading?: boolean;
};

const props = withDefaults(defineProps<IProps>(), {
  loading: false,
});

const emit = defineEmits<{
  submit: [data: ICreateBankAccount];
  cancel: [];
}>();

const form = ref({
  name: props.bankAccount?.name || "",
});

watch(
  () => props.bankAccount,
  (newVal) => {
    if (newVal) {
      form.value.name = newVal.name;
    }
  }
);

const userStore = useUserStore();
const { currentUser } = storeToRefs(userStore);

const handleSubmit = () => {
  if (!currentUser.value) return;

  emit("submit", {
    name: form.value.name,
    userId: currentUser.value.id,
  });
};
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div class="space-y-2">
      <Label for="name">Account Name</Label>
      <Input
        id="name"
        v-model="form.name"
        placeholder="e.g., Main Checking, Savings"
        required
      />
    </div>

    <div class="flex gap-2 justify-end">
      <Button type="button" variant="outline" @click="emit('cancel')">
        Cancel
      </Button>
      <Button type="submit" :disabled="loading || !form.name.trim()">
        {{ bankAccount ? "Update" : "Create" }} Account
      </Button>
    </div>
  </form>
</template>
