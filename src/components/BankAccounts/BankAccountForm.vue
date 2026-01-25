<script setup lang="ts" generic="T extends ICreateBankAccount | IBankAccount">
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import type { IBankAccount, ICreateBankAccount, IUpdateBankAccount } from "~/@schemas/models/bank-account";
import { zCreateBankAccount, zUpdateBankAccount } from "~/@schemas/models/bank-account";
import type { Nullish } from "~/@types/helpers";
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

const { handleSubmit, resetForm, setValues } = useForm({
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

const onSubmit = handleSubmit(async (values) => {
  if (!currentUser.value) return;

  isLoading.value = true;
  try {
    if (props.isEditMode) {
      const response = await updateBankAccount({
        id: props.initialValues.id || '',
        data: {
          name: values.name,
          userId: values.userId,
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
          name: values.name,
          userId: currentUser.value.id,
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
