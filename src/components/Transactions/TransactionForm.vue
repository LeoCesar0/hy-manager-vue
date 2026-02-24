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

type IProps = {
  initialValues: T;
  isEditMode: boolean;
  categories: ICategory[];
  bankAccounts: IBankAccount[];
  counterparties: ICounterparty[];
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

const { handleSubmit, resetForm, setValues } = useForm({
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

const categoryOptions = computed<ISelectOption[]>(() => {
  return props.categories.map(cat => ({
    value: cat.id,
    label: `${cat.icon} ${cat.name}`,
  }));
});

const bankAccountOptions = computed<ISelectOption[]>(() => {
  return props.bankAccounts.map(acc => ({
    value: acc.id,
    label: acc.name,
  }));
});

const counterpartyOptions = computed<ISelectOption[]>(() => {
  return props.counterparties.map(cp => ({
    value: cp.id,
    label: cp.name,
  }));
});

const typeOptions: ISelectOption[] = [
  { value: 'deposit', label: 'Receita' },
  { value: 'expense', label: 'Despesa' },
];

const onSubmit = handleSubmit(async (values) => {
  if (!currentUser.value) return;

  isLoading.value = true;
  try {
    const data = {
      type: values.type,
      amount: values.amount,
      description: values.description,
      date: values.date || Timestamp.now(),
      categoryIds: values.categoryIds || [],
      counterpartyId: values.counterpartyId || null,
      userId: values.userId || currentUser.value.id,
      bankAccountId: values.bankAccountId,
    };

    if (props.isEditMode) {
      const response = await updateTransaction({
        id: (props.initialValues as ITransaction).id || "",
        data,
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
  } finally {
    isLoading.value = false;
  }
});

const handleCancel = () => {
  resetForm();
  emit("cancel");
};
</script>

<template>
  <Form @submit="onSubmit" class="space-y-6 mt-6">
    <FormField 
      name="type" 
      label="Tipo" 
      input-variant="select" 
      placeholder="Selecione o tipo"
      :select-options="typeOptions" 
    />

    <FormField 
      name="amount" 
      label="Valor" 
      input-variant="input" 
      type="number" 
      placeholder="0.00"
      :input-props="{ step: '0.01', min: '0' }"
    />

    <FormField 
      name="description" 
      label="Descrição" 
      input-variant="textarea" 
      placeholder="Descreva a transação..."
    />

    <FormField 
      name="date" 
      label="Data" 
      input-variant="datepicker"
    />

    <FormField 
      name="bankAccountId" 
      label="Conta Bancária" 
      input-variant="select" 
      placeholder="Selecione a conta"
      :select-options="bankAccountOptions" 
    />

    <FormField 
      name="categoryIds" 
      label="Categorias" 
      input-variant="multiple-select" 
      placeholder="Selecione as categorias"
      :multiple-select-options="categoryOptions" 
    />

    <FormField 
      name="counterpartyId" 
      label="Terceiro (opcional)" 
      input-variant="select" 
      placeholder="Selecione o terceiro"
      :select-options="counterpartyOptions" 
    />

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
