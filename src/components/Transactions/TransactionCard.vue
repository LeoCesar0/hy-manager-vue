<script setup lang="ts">
import { ArrowUpIcon, ArrowDownIcon } from "lucide-vue-next";
import type { ITransaction } from "~/@schemas/models/transaction";
import type { ICategory } from "~/@schemas/models/category";
import type { IBankAccount } from "~/@schemas/models/bank-account";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import { formatCurrency } from "~/helpers/formatCurrency";
import { getTransactionColor } from "~/helpers/getTransactionColor";
import { formatDate } from "~/helpers/formatDate";
import ActionButtons from "~/components/Dashboard/ActionButtons.vue";
import { getCategoryIcon } from "~/static/category-icons";

type IProps = {
  transaction: ITransaction;
  categories: ICategory[];
  bankAccounts: IBankAccount[];
  counterparties: ICounterparty[];
  onView?: (transaction: ITransaction) => void;
  onEdit?: (transaction: ITransaction) => void;
  onDelete?: (transaction: ITransaction) => void;
};

const props = defineProps<IProps>();

const transactionCategories = computed(() => {
  return props.categories.filter(cat => 
    props.transaction.categoryIds?.includes(cat.id)
  );
});

const bankAccount = computed(() => {
  return props.bankAccounts.find(acc => 
    acc.id === props.transaction.bankAccountId
  );
});

const counterparty = computed(() => {
  return props.counterparties.find(cp => 
    cp.id === props.transaction.counterpartyId
  );
});

</script>

<template>
  <UiCard class="p-4 hover:shadow-md transition-shadow">
    <div class="flex items-start justify-between gap-4">
      <div class="flex items-start gap-4 flex-1">
        <div 
          class="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
          :class="transaction.type === 'deposit' ? 'bg-deposit/10' : 'bg-expense/10'"
        >
          <ArrowUpIcon 
            v-if="transaction.type === 'deposit'" 
            class="h-5 w-5 text-deposit" 
          />
          <ArrowDownIcon 
            v-else 
            class="h-5 w-5 text-expense" 
          />
        </div>

        <div class="flex-1 min-w-0 w-full">
          <div class="flex items-start justify-between gap-2 mb-2">
            <div class="flex-1 min-w-0">
              <p class="font-medium text-base truncate max-w-[80%]">
                {{ transaction.description || 'Sem descrição' }}
              </p>
              <p class="text-sm text-muted-foreground">
                {{ formatDate(transaction.date) }}
              </p>
            </div>
            <p 
              class="text-lg font-semibold shrink-0"
              :class="getTransactionColor({ type: transaction.type })"
            >
              {{ transaction.type === 'deposit' ? '+' : '-' }}{{ formatCurrency({ amount: Math.abs(transaction.amount) }) }}
            </p>
          </div>

          <div class="space-y-2">
            <div v-if="bankAccount" class="flex items-center gap-2 text-sm text-muted-foreground">
              <span class="font-medium">Conta:</span>
              <span>{{ bankAccount.name }}</span>
            </div>

            <div v-if="transactionCategories.length > 0" class="flex flex-wrap gap-1.5">
              <span 
                v-for="category in transactionCategories" 
                :key="category.id"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                :style="{ 
                  backgroundColor: category.color || 'hsl(var(--muted))',
                  color: 'white'
                }"
              >
                <span>{{ getCategoryIcon(category.icon) }}</span>
                <span>{{ category.name }}</span>
              </span>
            </div>

            <div v-if="counterparty" class="flex items-center gap-2 text-sm text-muted-foreground">
              <span class="font-medium">Terceiro:</span>
              <span>{{ counterparty.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <ActionButtons 
        :show-view="true"
        edit-variant="ghost"
        delete-variant="ghost"
        :on-view="() => onView?.(transaction)"
        :on-edit="() => onEdit?.(transaction)"
        :on-delete="() => onDelete?.(transaction)"
      />
    </div>
  </UiCard>
</template>
