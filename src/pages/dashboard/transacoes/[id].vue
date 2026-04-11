<script setup lang="ts">
import { ArrowLeftIcon, ArrowUpIcon, ArrowDownIcon } from "lucide-vue-next";
import type { ITransaction } from "~/@schemas/models/transaction";
import type { ICategory } from "~/@schemas/models/category";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import { getTransaction } from "~/services/api/transactions/get-transaction";
import { deleteTransaction } from "~/services/api/transactions/delete-transaction";
import { getCategories } from "~/services/api/categories/get-categories";
import { getCounterparties } from "~/services/api/counterparties/get-counterparties";
import { formatDate } from "~/helpers/formatDate";
import { formatCurrency } from "~/helpers/formatCurrency";
import { getTransactionColor } from "~/helpers/getTransactionColor";
import { ROUTE } from "~/static/routes";
import DashboardSection from "~/components/Dashboard/DashboardSection.vue";
import DetailCard from "~/components/Dashboard/DetailCard.vue";
import DetailField from "~/components/Dashboard/DetailField.vue";
import ActionButtons from "~/components/Dashboard/ActionButtons.vue";
import TransactionsEditSheet from "~/components/Transactions/EditSheet.vue";
import FancyLink from "~/components/FancyLink/index.vue";
import { getCategoryIcon } from "~/static/category-icons";

definePageMeta({
  layout: "dashboard",
});

const route = useRoute();
const router = useRouter();
const transactionId = route.params.id as string;

const userStore = useUserStore();
const { currentUser } = storeToRefs(userStore);
const dashboardStore = useDashboardStore();
const { bankAccounts: storeBankAccounts } = storeToRefs(dashboardStore);

const isLoadingData = ref(false);
const transaction = ref<ITransaction | null>(null);
const categories = ref<ICategory[]>([]);
const counterparties = ref<ICounterparty[]>([]);
const isSheetOpen = ref(false);

const bankAccounts = computed(() => storeBankAccounts.value);

const transactionCategories = computed(() => {
  return categories.value.filter(cat =>
    transaction.value?.categoryIds?.includes(cat.id)
  );
});

const bankAccount = computed(() => {
  return bankAccounts.value.find(acc =>
    acc.id === transaction.value?.bankAccountId
  );
});

const counterparty = computed(() => {
  return counterparties.value.find(cp =>
    cp.id === transaction.value?.counterpartyId
  );
});

const loadAuxiliaryData = async () => {
  if (!currentUser.value) return;

  const [categoriesRes, counterpartiesRes] = await Promise.all([
    getCategories({
      userId: currentUser.value.id,
      options: { toastOptions: undefined },
    }),
    getCounterparties({
      userId: currentUser.value.id,
      options: { toastOptions: undefined },
    }),
  ]);

  if (categoriesRes.data) {
    categories.value = categoriesRes.data;
  }
  if (counterpartiesRes.data) {
    counterparties.value = counterpartiesRes.data;
  }
};

const loadTransaction = async () => {
  if (!transactionId) return;

  isLoadingData.value = true;
  try {
    const response = await getTransaction({
      id: transactionId,
      options: { toastOptions: undefined },
    });
    if (response.data) {
      transaction.value = response.data;
    }
  } catch (error) {
    console.error("Error loading transaction:", error);
    router.push(ROUTE.transactions.path());
  } finally {
    isLoadingData.value = false;
  }
};

const { openDialog } = useAlertDialog();

const handleDelete = () => {
  if (!transaction.value) return;

  openDialog({
    title: "Deletar Transação",
    message: `Tem certeza que deseja deletar esta transação?`,
    confirm: {
      label: "Deletar",
      action: async () => {
        if (!transaction.value?.id) return;
        const response = await deleteTransaction({
          id: transaction.value.id,
          options: {
            toastOptions: {
              loading: { message: "Deletando transação..." },
              success: { message: "Transação deletada com sucesso!" },
              error: true,
            },
          },
        });
        if (response.data !== undefined) {
          router.push(ROUTE.transactions.path());
        }
      },
    },
  });
};

const handleEdit = () => {
  isSheetOpen.value = true;
};

const handleGoBack = () => {
  router.push(ROUTE.transactions.path());
};

const handleEditSuccess = () => {
  isSheetOpen.value = false;
  loadTransaction();
};

onMounted(() => {
  loadAuxiliaryData();
  loadTransaction();
});
</script>

<template>
  <DashboardSection title="Detalhes da Transação" subtitle="Visualize e edite as informações da transação"
    :show-back-button="true" :on-back="handleGoBack" :loading="isLoadingData">
    <template #detail-actions>
      <ActionButtons :show-view="false" :on-edit="handleEdit" :on-delete="handleDelete" />
    </template>

    <DetailCard :not-found="!transaction" not-found-title="Transação não encontrada"
      not-found-description="A transação que você está procurando não existe.">
      <template #not-found-action>
        <UiButton @click="handleGoBack">
          <ArrowLeftIcon class="h-4 w-4 mr-2" />
          Voltar
        </UiButton>
      </template>

      <template #header>
        <div class="flex items-center gap-4">
          <div class="h-16 w-16 rounded-full flex items-center justify-center shrink-0"
            :class="transaction?.type === 'deposit' ? 'bg-deposit/10' : 'bg-expense/10'">
            <ArrowUpIcon v-if="transaction?.type === 'deposit'" class="h-8 w-8 text-deposit" />
            <ArrowDownIcon v-else class="h-8 w-8 text-expense" />
          </div>
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="px-3 py-1 rounded-full text-xs font-medium"
                :class="transaction?.type === 'deposit' ? 'bg-deposit/10 text-deposit' : 'bg-expense/10 text-expense'">
                {{ transaction?.type === 'deposit' ? 'Receita' : 'Despesa' }}
              </span>
            </div>
            <h2 class="text-3xl font-bold"
              :class="transaction?.type ? getTransactionColor({ type: transaction.type }) : ''">
              {{ transaction?.type === 'deposit' ? '+' : '-' }}{{ formatCurrency({
                amount: Math.abs(transaction?.amount
              || 0) }) }}
            </h2>
            <p class="text-sm text-muted-foreground mt-1">
              Criada em {{ formatDate(transaction?.createdAt) }}
            </p>
          </div>
        </div>
      </template>

      <template #content>
        <div class="grid gap-4 md:grid-cols-2">
          <DetailField label="Descrição" :value="transaction?.description" />

          <DetailField label="Data">
            {{ formatDate(transaction?.date) }}
          </DetailField>

          <DetailField label="Conta Bancária">
            <FancyLink v-if="bankAccount" :to="ROUTE.bankAccountId.path(bankAccount.id)"
              class="text-primary hover:underline">
              {{ bankAccount.name }}
            </FancyLink>
            <span v-else class="text-muted-foreground">—</span>
          </DetailField>

          <DetailField label="Categorias">
            <div v-if="transactionCategories.length > 0" class="flex flex-wrap gap-1.5">
              <FancyLink v-for="category in transactionCategories" :key="category.id"
                :to="ROUTE.categoryId.path(category.id)">
                <span
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium hover:opacity-80 transition-opacity"
                  :style="{
                    backgroundColor: category.color || 'hsl(var(--muted))',
                    color: 'white'
                  }">
                  <span>{{ getCategoryIcon(category.icon) }}</span>
                  <span>{{ category.name }}</span>
                </span>
              </FancyLink>
            </div>
            <span v-else class="text-muted-foreground">—</span>
          </DetailField>

          <DetailField label="Identificador">
            <FancyLink v-if="counterparty" :to="ROUTE.counterpartyId.path(counterparty.id)"
              class="text-primary hover:underline">
              {{ counterparty.name }}
            </FancyLink>
            <span v-else class="text-muted-foreground">—</span>
          </DetailField>

          <DetailField label="Tipo">
            {{ transaction?.type === 'deposit' ? 'Receita' : 'Despesa' }}
          </DetailField>

          <DetailField label="Data de Criação" :value="formatDate(transaction?.createdAt)" />

          <DetailField label="Última Atualização" :value="formatDate(transaction?.updatedAt)" />
        </div>
      </template>
    </DetailCard>

    <TransactionsEditSheet v-if="transaction" v-model:is-open="isSheetOpen" :initial-values="transaction"
      :on-success="handleEditSuccess" :on-cancel="() => { isSheetOpen = false }" />
  </DashboardSection>
</template>
