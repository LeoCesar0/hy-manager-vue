<script setup lang="ts">
import StepProgress from "~/components/Onboarding/StepProgress.vue";
import StepWelcome from "~/components/Onboarding/StepWelcome.vue";
import StepBankAccount from "~/components/Onboarding/StepBankAccount.vue";
import StepCategories from "~/components/Onboarding/StepCategories.vue";

definePageMeta({
  layout: "default",
});

const router = useRouter();

const {
  currentStep,
  totalSteps,
  userName,
  isSubmitting,
  handleWelcomeNext,
  handleBankAccountNext,
  goToPreviousStep,
  completeOnboarding,
  autoHealExistingUser,
} = useOnboarding();

onMounted(async () => {
  // Auto-heal existing users who already have bank accounts but haven't completed onboarding
  const alreadySetUp = await autoHealExistingUser();
  if (alreadySetUp) {
    router.push("/dashboard");
  }
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-background p-4">
    <div class="w-full max-w-md space-y-8">
      <StepProgress :current-step="currentStep" :total-steps="totalSteps" />

      <UiCard class="p-6">
        <StepWelcome
          v-if="currentStep === 1"
          :name="userName"
          :on-next="handleWelcomeNext"
        />
        <StepBankAccount
          v-else-if="currentStep === 2"
          :on-next="handleBankAccountNext"
          :on-back="goToPreviousStep"
        />
        <StepCategories
          v-else-if="currentStep === 3"
          :on-next="completeOnboarding"
          :on-back="goToPreviousStep"
          :is-submitting="isSubmitting"
        />
      </UiCard>

      <p class="text-center text-xs text-muted-foreground">
        Passo {{ currentStep }} de {{ totalSteps }}
      </p>
    </div>
  </div>
</template>
