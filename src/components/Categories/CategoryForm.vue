<script setup lang="ts" generic="T extends ICreateCategory | ICategory">
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import type { ICategory, ICreateCategory } from "~/@schemas/models/category";
import { zCreateCategory, zUpdateCategory } from "~/@schemas/models/category";
import { createCategory } from "~/services/api/categories/create-category";
import { updateCategory } from "~/services/api/categories/update-category";
import { CATEGORY_PRESET_COLORS } from "~/static/category-colors";
import { CATEGORY_ICONS_OPTIONS } from "~/static/category-icons";

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
  props.isEditMode ? zUpdateCategory : zCreateCategory
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

const onSubmit = handleSubmit(async (values) => {
  if (!currentUser.value) return;

  isLoading.value = true;
  try {
    if (props.isEditMode) {
      const response = await updateCategory({
        id: (props.initialValues as ICategory).id || "",
        data: {
          name: values.name,
          color: values.color,
          icon: values.icon,
          userId: values.userId,
        },
        options: {
          toastOptions: {
            loading: { message: "Atualizando categoria..." },
            success: { message: "Categoria atualizada com sucesso!" },
            error: true,
          },
        },
      });
      if (response.data) emit("success");
    } else {
      const response = await createCategory({
        data: {
          name: values.name,
          color: values.color,
          icon: values.icon,
          userId: currentUser.value.id,
        },
        options: {
          toastOptions: {
            loading: { message: "Criando categoria..." },
            success: { message: "Categoria criada com sucesso!" },
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
    <FormField name="name" label="Nome" input-variant="input" placeholder="Ex: Alimentação" />
    <FormField name="color" label="Cor" input-variant="color-picker" :color-picker-props="{
      colors: CATEGORY_PRESET_COLORS,
    }" />
    <FormField name="icon" label="Ícone" input-variant="select" placeholder="Selecione um ícone"
      :select-options="CATEGORY_ICONS_OPTIONS" />
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
