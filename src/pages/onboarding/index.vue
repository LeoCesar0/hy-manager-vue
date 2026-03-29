<script setup lang="ts">
import StepProgress from "~/components/Onboarding/StepProgress.vue";
import StepWelcome from "~/components/Onboarding/StepWelcome.vue";
import StepBankAccount from "~/components/Onboarding/StepBankAccount.vue";
import StepCategories from "~/components/Onboarding/StepCategories.vue";

definePageMeta({
  layout: "auth",
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
  const alreadySetUp = await autoHealExistingUser();
  if (alreadySetUp) {
    router.push("/dashboard");
  }
});
</script>

<template>
  <div class="space-y-6">
    <StepProgress :current-step="currentStep" :total-steps="totalSteps" />

    <div
      class="onboarding-card rounded-2xl border border-border/50 p-6"
    >
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
    </div>

    <p class="text-center text-xs text-muted-foreground">
      Passo {{ currentStep }} de {{ totalSteps }}
    </p>
  </div>
</template>

<style scoped>
.onboarding-card {
  background: color-mix(in oklch, var(--card) 50%, transparent);
  backdrop-filter: blur(12px);
}
</style>
