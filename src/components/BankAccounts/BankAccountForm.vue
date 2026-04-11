<script setup lang="ts" generic="T extends ICreateBankAccount | IBankAccount">
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import type { IBankAccount, ICreateBankAccount } from "~/@schemas/models/bank-account";
import {
  bankAccountCompanies,
  BANK_ACCOUNT_COMPANY_LABELS,
  zCreateBankAccount,
  zUpdateBankAccount,
  type IBankAccountCompany,
} from "~/@schemas/models/bank-account";
import { createBankAccount } from "~/services/api/bank-accounts/create-bank-account";
import { updateBankAccount } from "~/services/api/bank-accounts/update-bank-account";

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

const validationSchema = toTypedSchema(
  props.isEditMode ? zUpdateBankAccount : zCreateBankAccount
);

const { handleSubmit, resetForm, setValues, values, setFieldValue } = useForm({
  validationSchema,
  initialValues: props.initialValues,
});

watch(
  () => props.initialValues,
  (initialValues) => {
    if (initialValues) {
      setValues({
        ...initialValues
      });
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

// Pre-fill the name when the user picks a known bank, mirroring the
// onboarding step. Only overwrites empty or matching-label names so manual
// edits aren't clobbered.
const handleSelectCompany = (company: IBankAccountCompany) => {
  const previousLabel = BANK_ACCOUNT_COMPANY_LABELS[(values.company ?? "other") as IBankAccountCompany];
  const currentName = (values.name ?? "") as string;
  const nameIsAutoFilled = currentName === "" || currentName === previousLabel;

  setFieldValue("company", company);

  if (nameIsAutoFilled && company !== "other") {
    setFieldValue("name", BANK_ACCOUNT_COMPANY_LABELS[company]);
  }
};

const onSubmit = handleSubmit(async (formValues) => {
  if (!currentUser.value) return;

  isLoading.value = true;
  try {
    if (props.isEditMode) {
      const response = await updateBankAccount({
        id: props.initialValues.id || '',
        data: {
          name: formValues.name,
          userId: formValues.userId,
          company: formValues.company,
        },
        options: {
          toastOptions: {
            loading: {
              message: "Atualizando conta...",
            },
            success: {
              message: "Conta atualizada com sucesso!",
            },
            error: true,
          },
        },
      });

      if (response.data) {
        emit("success");
      }
    } else {
      const response = await createBankAccount({
        data: {
          name: formValues.name,
          userId: currentUser.value.id,
          company: formValues.company,
        },
        options: {
          toastOptions: {
            loading: {
              message: "Criando conta...",
            },
            success: {
              message: "Conta criada com sucesso!",
            },
            error: true,
          },
        },
      });

      if (response.data) {
        emit("success");
      }
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
    <div class="space-y-2">
      <label class="text-sm font-medium">Banco</label>
      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="company in bankAccountCompanies"
          :key="company"
          type="button"
          class="rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors"
          :class="
            (values.company ?? 'other') === company
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border hover:border-muted-foreground/50'
          "
          @click="handleSelectCompany(company)"
        >
          {{ BANK_ACCOUNT_COMPANY_LABELS[company] }}
        </button>
      </div>
      <p class="text-xs text-muted-foreground">
        Contas de bancos não listados funcionam normalmente, mas não suportam
        importação de extrato CSV.
      </p>
    </div>

    <FormField name="name" label="Nome da Conta" input-variant="input" />
    <FormActions>
      <UiButton type="button" variant="outline" @click="handleCancel" :disabled="isLoading">
        Cancelar
      </UiButton>
      <UiButton type="submit" :disabled="isLoading">
        <Loading v-if="isLoading" class="mr-2" size="sm" />
        {{ 'Salvar' }}
      </UiButton>
    </FormActions>
  </Form>
</template>
