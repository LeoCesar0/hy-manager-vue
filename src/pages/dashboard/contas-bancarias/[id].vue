<script setup lang="ts">
import { WalletIcon, ArrowLeftIcon } from "lucide-vue-next";
import type { IBankAccount } from "~/@schemas/models/bank-account";
import { getBankAccount } from "~/services/api/bank-accounts/get-bank-account";
import { deleteBankAccount } from "~/services/api/bank-accounts/delete-bank-account";
import { formatDate } from "~/helpers/formatDate";
import { ROUTE } from "~/static/routes";
import BankAccountForm from "~/components/BankAccounts/BankAccountForm.vue";
import DashboardSection from "~/components/Dashboard/DashboardSection.vue";
import DetailCard from "~/components/Dashboard/DetailCard.vue";
import DetailField from "~/components/Dashboard/DetailField.vue";
import ActionButtons from "~/components/Dashboard/ActionButtons.vue";

definePageMeta({
  layout: "dashboard",
});

const route = useRoute();
const router = useRouter();
const bankAccountId = route.params.id as string;

const userStore = useUserStore();
const { currentUser } = storeToRefs(userStore);

const isLoadingData = ref(false);
const bankAccount = ref<IBankAccount | null>(null);
const isSheetOpen = ref(false);

const loadBankAccount = async () => {
  if (!bankAccountId) return;

  isLoadingData.value = true;
  try {
    const response = await getBankAccount({
      id: bankAccountId,
      options: { toastOptions: undefined },
    });
    if (response.data) {
      bankAccount.value = response.data;
    } else {
      router.push(ROUTE.bankAccounts.path());
    }
  } finally {
    isLoadingData.value = false;
  }
};
const { openDialog } = useAlertDialog();

const handleDelete = async () => {
  if (!bankAccount.value) return;

  openDialog({
    title: "Deletar Conta Bancária",
    message: `Tem certeza que deseja deletar a conta "${bankAccount.value?.name}"?`,
    confirm: {
      label: "Deletar",
      action: async () => {
        if (!bankAccount.value?.id || !currentUser.value?.id) return;
        const response = await deleteBankAccount({
          id: bankAccount.value.id,
          userId: currentUser.value.id,
          options: {
            toastOptions: {
              loading: {
                message: "Deletando conta bancária...",
              },
              success: {
                message: "Conta bancária deletada com sucesso!",
              },
              error: true,
            },
          },
        });
        if (response.data) {
          router.push(ROUTE.bankAccounts.path());
        }
      },
    },
  });
};

const handleEdit = () => {
  isSheetOpen.value = true;
};

const handleGoBack = () => {
  router.push(ROUTE.bankAccounts.path());
};

onMounted(() => {
  loadBankAccount();
});
</script>

<template>
  <DashboardSection 
    title="Detalhes da Conta" 
    subtitle="Visualize e edite as informações da conta"
    :show-back-button="true"
    :on-back="handleGoBack"
    :loading="isLoadingData"
  >
    <template #detail-actions>
      <ActionButtons 
        :show-view="false"
        :on-edit="handleEdit"
        :on-delete="handleDelete"
      />
    </template>

    <DetailCard 
      :not-found="!bankAccount"
      not-found-title="Conta não encontrada"
      not-found-description="A conta bancária que você está procurando não existe."
    >
      <template #not-found-action>
        <UiButton @click="handleGoBack">
          <ArrowLeftIcon class="h-4 w-4 mr-2" />
          Voltar
        </UiButton>
      </template>

      <template #header>
        <div class="flex items-center gap-4">
          <div class="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <WalletIcon class="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 class="text-2xl font-bold">{{ bankAccount?.name }}</h2>
            <p class="text-sm text-muted-foreground">
              Criada em {{ formatDate(bankAccount?.createdAt) }}
            </p>
          </div>
        </div>
      </template>

      <template #content>
        <div class="grid gap-4 md:grid-cols-2">
          <DetailField label="Nome" :value="bankAccount?.name" />

          <DetailField label="Data de Criação" :value="formatDate(bankAccount?.createdAt)" />

          <DetailField label="Última Atualização" :value="formatDate(bankAccount?.updatedAt)" />
        </div>
      </template>
    </DetailCard>
  </DashboardSection>
</template>

<style lang="scss" scoped></style>
