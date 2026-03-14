<script setup lang="ts" generic="T extends ICreateCounterparty | ICounterparty">
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import type { ICounterparty, ICreateCounterparty } from "~/@schemas/models/counterparty";
import { zCreateCounterparty, zUpdateCounterparty } from "~/@schemas/models/counterparty";
import { createCounterparty } from "~/services/api/counterparties/create-counterparty";
import { updateCounterparty } from "~/services/api/counterparties/update-counterparty";
import type { ICategory } from "~/@schemas/models/category";
import type { ISelectOption } from "~/@schemas/select";
import { getCategories } from "~/services/api/categories/get-categories";
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
const categories = ref<ICategory[]>([]);

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

onMounted(async () => {
  if (!currentUser.value?.id) return;

  const categoriesRes = await getCategories({
    userId: currentUser.value.id,
  });

  if (categoriesRes.data) {
    categories.value = categoriesRes.data;
  }
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
            loading: { message: "Atualizando terceiro..." },
            success: { message: "Terceiro atualizado com sucesso!" },
            error: true,
          },
        },
      });
      if (response.data) emit("success");
    } else {
      const response = await createCounterparty({
        data: {
          name: values.name,
          categoryIds: values.categoryIds || [],
          userId: currentUser.value.id,
        },
        options: {
          toastOptions: {
            loading: { message: "Criando terceiro..." },
            success: { message: "Terceiro criado com sucesso!" },
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
