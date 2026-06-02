<script setup lang="ts" generic="T extends ICreateCounterparty | ICounterparty">
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import type { ICounterparty, ICreateCounterparty } from "~/@schemas/models/counterparty";
import { zCreateCounterparty, zUpdateCounterparty } from "~/@schemas/models/counterparty";
import { createCounterparty } from "~/services/api/counterparties/create-counterparty";
import { updateCounterparty } from "~/services/api/counterparties/update-counterparty";
import type { ISelectOption } from "~/@schemas/select";
import { getCategoryIcon } from "~/static/category-icons";

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
const referenceDataStore = useReferenceDataStore();
const { categories } = storeToRefs(referenceDataStore);

const validationSchema = toTypedSchema(
  props.isEditMode ? zUpdateCounterparty : zCreateCounterparty
);

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

onMounted(() => {
  if (!currentUser.value?.id) return;
  referenceDataStore.load({ userId: currentUser.value.id });
});

const categoryOptions = computed<ISelectOption[]>(() => {
  return categories.value.map((cat) => ({
    value: cat.id,
    label: `${cat.icon ? getCategoryIcon(cat.icon) : ""} ${cat.name}`,
  }));
});

const onSubmit = handleSubmit(async (values) => {
  if (!currentUser.value) return;

  isLoading.value = true;
  try {
    if (props.isEditMode) {
      const response = await updateCounterparty({
        id: (props.initialValues as ICounterparty).id || "",
        userId: currentUser.value.id,
        data: {
          name: values.name,
          categoryIds: values.categoryIds || [],
          userId: values.userId,
        },
        options: {
          toastOptions: {
            loading: { message: "Atualizando identificador..." },
            success: { message: "Identificador atualizado com sucesso!" },
            error: true,
          },
        },
      });
      if (response.data) {
        referenceDataStore.refreshCurrent();
        emit("success");
      }
    } else {
      const response = await createCounterparty({
        data: {
          name: values.name,
          categoryIds: values.categoryIds || [],
          userId: currentUser.value.id,
        },
        options: {
          toastOptions: {
            loading: { message: "Criando identificador..." },
            success: { message: "Identificador criado com sucesso!" },
            error: true,
          },
        },
      });
      if (response.data) {
        referenceDataStore.refreshCurrent();
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
    <FormField name="name" label="Nome" input-variant="input" placeholder="Ex: Supermercado X" />
    <FormField
      name="categoryIds"
      label="Categorias"
      input-variant="multiple-select"
      placeholder="Selecione as categorias"
      :select-options="categoryOptions"
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
