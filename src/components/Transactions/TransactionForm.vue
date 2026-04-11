<script setup lang="ts" generic="T extends ICreateTransaction | ITransaction">
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import type { ITransaction, ICreateTransaction } from "~/@schemas/models/transaction";
import { zCreateTransaction } from "~/@schemas/models/transaction";
import { createTransaction } from "~/services/api/transactions/create-transaction";
import { updateTransaction } from "~/services/api/transactions/update-transaction";
import type { ICategory } from "~/@schemas/models/category";
import type { IBankAccount } from "~/@schemas/models/bank-account";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import type { ISelectOption } from "~/@schemas/select";
import { Timestamp } from "firebase/firestore";
import { getCategoryIcon } from "~/static/category-icons";
import { getCategories } from "~/services/api/categories/get-categories";
import { getBankAccounts } from "~/services/api/bank-accounts/get-bank-accounts";
import { getCounterparties } from "~/services/api/counterparties/get-counterparties";
import { ChevronsUpDownIcon, CheckIcon, XIcon } from "lucide-vue-next";

type IProps = {
  initialValues: T;
  isEditMode: boolean;
};

const props = defineProps<IProps>();

const emit = defineEmits<{
  success: [];
  cancel: [];
}>();

const userStore = useUserStore();
const { currentUser } = storeToRefs(userStore);

const isLoading = ref(false);

const validationSchema = toTypedSchema(zCreateTransaction);

const { handleSubmit, resetForm, setValues, values } = useForm({
  validationSchema,
  initialValues: props.initialValues,
});

watch(
  () => props.initialValues,
  (initialValues) => {
    if (initialValues) {
      setValues({ ...initialValues });
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

const categories = ref<ICategory[]>([]);
const bankAccounts = ref<IBankAccount[]>([]);
const counterparties = ref<ICounterparty[]>([]);

const counterpartySearchQuery = ref("");
const selectedCounterpartyId = ref<string | undefined>(
  (props.initialValues as ITransaction)?.counterpartyId || undefined
);

const comboboxOpen = ref(false);

onMounted(async () => {
  if (!currentUser.value?.id) return;

  const [categoriesRes, bankAccountsRes, counterpartiesRes] = await Promise.all([
    getCategories({
      userId: currentUser.value.id,
    }),
    getBankAccounts({
      userId: currentUser.value.id,
      pagination: { page: 1, limit: 100 },
    }),
    getCounterparties({
      userId: currentUser.value.id,
    }),
  ]);

  if (categoriesRes.data) {
    categories.value = categoriesRes.data;
  }
  if (bankAccountsRes.data?.list) {
    bankAccounts.value = bankAccountsRes.data.list;
  }
  if (counterpartiesRes.data) {
    counterparties.value = counterpartiesRes.data;
  }

  if (selectedCounterpartyId.value) {
    const match = counterparties.value.find((cp) => cp.id === selectedCounterpartyId.value);
    if (match) {
      counterpartySearchQuery.value = match.name;
    }
  }
});

const categoryOptions = computed<ISelectOption[]>(() => {
  return categories.value.map(cat => ({
    value: cat.id,
    label: `${cat.icon ? getCategoryIcon(cat.icon) : ''} ${cat.name}`,
  }));
});

const bankAccountOptions = computed<ISelectOption[]>(() => {
  return bankAccounts.value.map(acc => ({
    value: acc.id,
    label: acc.name,
  }));
});

const filteredCounterparties = computed(() => {
  const q = counterpartySearchQuery.value.toLowerCase().trim();
  if (!q) return counterparties.value;
  return counterparties.value.filter((cp) => cp.name.toLowerCase().includes(q));
});

const typeOptions: ISelectOption[] = [
  { value: 'deposit', label: 'Receita' },
  { value: 'expense', label: 'Despesa' },
];

const handleSelectCounterparty = (value: string) => {
  const match = counterparties.value.find((cp) => cp.id === value);
  if (match) {
    selectedCounterpartyId.value = match.id;
    counterpartySearchQuery.value = match.name;
  }
  comboboxOpen.value = false;
};

const handleClearCounterparty = () => {
  selectedCounterpartyId.value = undefined;
  counterpartySearchQuery.value = "";
};

const onSubmit = handleSubmit(async (values) => {
  if (!currentUser.value) return;

  isLoading.value = true;
  try {
    const isNewCounterparty = counterpartySearchQuery.value.trim() && !selectedCounterpartyId.value;

    const data = {
      type: values.type,
      amount: values.amount,
      description: values.description,
      date: values.date || Timestamp.now(),
      categoryIds: values.categoryIds || [],
      counterpartyId: selectedCounterpartyId.value || null,
      userId: values.userId || currentUser.value.id,
      bankAccountId: values.bankAccountId,
    };

    if (props.isEditMode) {
      const response = await updateTransaction({
        id: (props.initialValues as ITransaction).id || "",
        data,
        counterpartyName: isNewCounterparty ? counterpartySearchQuery.value.trim() : undefined,
        options: {
          toastOptions: {
            loading: { message: "Atualizando transação..." },
            success: { message: "Transação atualizada com sucesso!" },
            error: true,
          },
        },
      });
      if (response.data) emit("success");
    } else {
      const response = await createTransaction({
        data,
        counterpartyName: isNewCounterparty ? counterpartySearchQuery.value.trim() : undefined,
        options: {
          toastOptions: {
            loading: { message: "Criando transação..." },
            success: { message: "Transação criada com sucesso!" },
            error: true,
          },
        },
      });
      if (response.data) emit("success");
    }
  } catch (err) {
    console.log(`❌ transaction form error -->`, err);
  } finally {
    isLoading.value = false;
  }
});

const handleCancel = () => {
  resetForm();
  handleClearCounterparty();
  emit("cancel");
};
</script>

<template>
  <Form @submit="onSubmit" class="space-y-6 mt-6">
    <FormField name="type" label="Tipo" input-variant="select" placeholder="Selecione o tipo"
      :select-options="typeOptions" />
    <FormField name="amount" label="Valor" input-variant="number" type="number" placeholder="0.00" :input-props="{}" />

    <FormField name="description" label="Descrição" input-variant="textarea" placeholder="Descreva a transação..." />

    <FormField name="date" label="Data" input-variant="datepicker" :date-picker-props="{
      options: {
        granularity: 'minute'
      }
    }" />
    <FormField name="bankAccountId" label="Conta Bancária" input-variant="select" placeholder="Selecione a conta"
      :select-options="bankAccountOptions" />

    <FormField name="categoryIds" label="Categorias" input-variant="multiple-select"
      placeholder="Selecione as categorias" :select-options="categoryOptions" />

    <div class="space-y-2">
      <label class="text-sm font-medium leading-none">Identificador (opcional)</label>
      <UiCombobox :open="comboboxOpen" @update:open="comboboxOpen = $event">
        <UiComboboxAnchor class="w-full">
          <div class="relative flex items-center">
            <UiComboboxInput
              v-model="counterpartySearchQuery"
              placeholder="Digite ou selecione o identificador..."
              class="w-full"
              @focus="comboboxOpen = true"
            />
            <button
              v-if="counterpartySearchQuery"
              type="button"
              class="absolute right-8 p-1 text-muted-foreground hover:text-foreground"
              @click="handleClearCounterparty"
            >
              <XIcon class="h-3 w-3" />
            </button>
            <UiComboboxTrigger class="absolute right-1 p-1">
              <ChevronsUpDownIcon class="h-4 w-4 text-muted-foreground" />
            </UiComboboxTrigger>
          </div>
        </UiComboboxAnchor>
        <UiComboboxList class="w-[var(--reka-combobox-trigger-width)]">
          <UiComboboxViewport>
            <UiComboboxEmpty>
              <span v-if="counterpartySearchQuery.trim()">
                "{{ counterpartySearchQuery.trim() }}" será criado automaticamente
              </span>
              <span v-else>Nenhum identificador encontrado</span>
            </UiComboboxEmpty>
            <UiComboboxItem
              v-for="cp in filteredCounterparties"
              :key="cp.id"
              :value="cp.id"
              @select="handleSelectCounterparty(cp.id)"
            >
              <CheckIcon v-if="selectedCounterpartyId === cp.id" class="h-4 w-4 mr-2" />
              <span :class="{ 'ml-6': selectedCounterpartyId !== cp.id }">{{ cp.name }}</span>
            </UiComboboxItem>
          </UiComboboxViewport>
        </UiComboboxList>
      </UiCombobox>
      <p v-if="counterpartySearchQuery.trim() && !selectedCounterpartyId" class="text-xs text-muted-foreground">
        Novo identificador será criado automaticamente ao salvar
      </p>
    </div>

    <FormActions>
      <UiButton type="button" variant="outline" @click="handleCancel" :disabled="isLoading">
        Cancelar
      </UiButton>
      <UiButton type="submit" :disabled="isLoading">
        <Loading v-if="isLoading" class="mr-2" size="sm" />
        Salvar
      </UiButton>
    </FormActions>
  </Form>
</template>
