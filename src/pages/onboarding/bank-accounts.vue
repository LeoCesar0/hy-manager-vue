<script setup lang="ts">
import type { ICreateBankAccount } from "~/@schemas/models/bank-account";
import { createBankAccount } from "~/services/api/bank-accounts/create-bank-account";
import {
  UiCard,
  UiCardContent,
  UiCardDescription,
  UiCardHeader,
  UiCardTitle,
} from "~/components/ui/card";
import { UiButton } from "~/components/ui/button";
import { UiInput } from "~/components/ui/input";
import { UiLabel } from "~/components/ui/label";
import ProgressIndicator from "~/components/Onboarding/ProgressIndicator.vue";

const router = useRouter();
const userStore = useUserStore();
const { currentUser } = storeToRefs(userStore);

const accounts = ref<string[]>([""]);
const loading = ref(false);

const addAccount = () => {
  accounts.value.push("");
};

const removeAccount = (index: number) => {
  accounts.value.splice(index, 1);
};

const handleSubmit = async () => {
  if (!currentUser.value) return;

  const validAccounts = accounts.value.filter((name) => name.trim());
  if (validAccounts.length === 0) return;

  loading.value = true;

  for (const name of validAccounts) {
    await createBankAccount({
      name: name.trim(),
      userId: currentUser.value.id,
    });
  }

  loading.value = false;
  router.push("/onboarding/categories");
};

const handleSkip = () => {
  router.push("/onboarding/categories");
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
    <UiCard class="w-full max-w-2xl">
      <UiCardHeader>
        <ProgressIndicator :current-step="2" :total-steps="3" />
        <UiCardTitle class="text-2xl text-center mt-4">
          Add Your Bank Accounts
        </UiCardTitle>
        <UiCardDescription class="text-center">
          Add one or more bank accounts to track your money
        </UiCardDescription>
      </UiCardHeader>
      <UiCardContent class="space-y-6">
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div
            v-for="(account, index) in accounts"
            :key="index"
            class="flex gap-2 items-end"
          >
            <div class="flex-1 space-y-2">
              <UiLabel :for="`account-${index}`">
                Account {{ index + 1 }}
              </UiLabel>
              <UiInput
                :id="`account-${index}`"
                v-model="accounts[index]"
                placeholder="e.g., Main Checking, Savings"
              />
            </div>
            <UiButton
              v-if="accounts.length > 1"
              type="button"
              variant="ghost"
              size="icon"
              @click="removeAccount(index)"
            >
              ✕
            </UiButton>
          </div>

          <UiButton
            type="button"
            variant="outline"
            @click="addAccount"
            class="w-full"
          >
            + Add Another Account
          </UiButton>

          <div class="flex gap-2 justify-end pt-4">
            <UiButton type="button" variant="outline" @click="handleSkip">
              Skip
            </UiButton>
            <UiButton
              type="submit"
              :disabled="loading || !accounts.some((a) => a.trim())"
            >
              Continue
            </UiButton>
          </div>
        </form>
      </UiCardContent>
    </UiCard>
  </div>
</template>
