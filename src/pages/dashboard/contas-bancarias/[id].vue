<script setup lang="ts">
import { WalletIcon, ArrowLeftIcon, EditIcon, TrashIcon } from "lucide-vue-next";
import type { IBankAccount } from "~/@schemas/models/bank-account";
import { firebaseGet } from "~/services/firebase/firebaseGet";
import { deleteBankAccount } from "~/services/api/bank-accounts/delete-bank-account";
import { formatDate } from "~/helpers/formatDate";
import { ROUTE } from "~/static/routes";
import BankAccountForm from "~/components/BankAccounts/BankAccountForm.vue";

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
    const response = await firebaseGet<IBankAccount>({
      collection: "bankAccounts",
      id: bankAccountId,
    });

    if (response) {
      bankAccount.value = response;
    }
  } catch (error) {
    console.error("Error loading bank account:", error);
    router.push(ROUTE.bankAccounts.path());
  } finally {
    isLoadingData.value = false;
  }
};

const handleDelete = async () => {
  if (!bankAccount.value) return;

  const confirmed = confirm(
    `Tem certeza que deseja deletar a conta "${bankAccount.value.name}"?`
  );
  if (!confirmed) return;

  const response = await deleteBankAccount({
    id: bankAccount.value.id,
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

  if (response.data !== null) {
    router.push(ROUTE.bankAccounts.path());
  }
};

const handleEdit = () => {
  isSheetOpen.value = true;
};

const handleFormSuccess = () => {
  isSheetOpen.value = false;
  loadBankAccount();
};

const handleGoBack = () => {
  router.push(ROUTE.bankAccounts.path());
};

onMounted(() => {
  loadBankAccount();
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <UiButton variant="ghost" size="icon" @click="handleGoBack">
        <ArrowLeftIcon class="h-4 w-4" />
      </UiButton>
      <div class="flex-1">
        <h1 class="text-3xl font-bold tracking-tight">Detalhes da Conta</h1>
        <p class="text-muted-foreground">Visualize e edite as informações da conta</p>
      </div>
      <div class="flex gap-2">
        <UiButton variant="outline" size="icon" @click="handleEdit">
          <EditIcon class="h-4 w-4" />
        </UiButton>
        <UiButton variant="destructive" size="icon" @click="handleDelete">
          <TrashIcon class="h-4 w-4" />
        </UiButton>
      </div>
    </div>

    <div v-if="isLoadingData" class="flex items-center justify-center py-12">
      <Loading :is-loading="true" size="lg" />
    </div>

    <UiCard v-else-if="bankAccount" class="p-6">
      <div class="space-y-6">
        <div class="flex items-center gap-4">
          <div class="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <WalletIcon class="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 class="text-2xl font-bold">{{ bankAccount.name }}</h2>
            <p class="text-sm text-muted-foreground">
              Criada em {{ formatDate(bankAccount.createdAt) }}
            </p>
          </div>
        </div>

        <UiSeparator />

        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <p class="text-sm font-medium text-muted-foreground">Nome</p>
            <p class="text-base">{{ bankAccount.name }}</p>
          </div>

          <div class="space-y-2">
            <p class="text-sm font-medium text-muted-foreground">Data de Criação</p>
            <p class="text-base">{{ formatDate(bankAccount.createdAt) }}</p>
          </div>

          <div class="space-y-2">
            <p class="text-sm font-medium text-muted-foreground">Última Atualização</p>
            <p class="text-base">{{ formatDate(bankAccount.updatedAt) }}</p>
          </div>

          <div class="space-y-2">
            <p class="text-sm font-medium text-muted-foreground">ID</p>
            <p class="text-base font-mono text-xs">{{ bankAccount.id }}</p>
          </div>
        </div>
      </div>
    </UiCard>

    <div v-else class="flex items-center justify-center py-12">
      <UiEmpty title="Conta não encontrada" description="A conta bancária que você está procurando não existe.">
        <UiButton @click="handleGoBack">
          <ArrowLeftIcon class="h-4 w-4 mr-2" />
          Voltar
        </UiButton>
      </UiEmpty>
    </div>

    <!-- <UiSheet v-model:open="isSheetOpen">
      <UiSheetContent class="sm:max-w-xl overflow-y-auto">
        <UiSheetHeader>
          <UiSheetTitle>Editar Conta</UiSheetTitle>
          <UiSheetDescription>
            Edite as informações da conta bancária
          </UiSheetDescription>
        </UiSheetHeader>
        
        <BankAccountForm
          :bank-account="bankAccount"
          @success="handleFormSuccess"
          @cancel="isSheetOpen = false"
        />
      </UiSheetContent>
    </UiSheet> -->
  </div>
</template>

<style lang="scss" scoped></style>
