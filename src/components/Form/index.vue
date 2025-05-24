<script setup lang="ts">
import { cn } from "~/lib/utils";

type Props = {
  onSubmit: (e: any) => Promise<any>;
  fullWidth?: boolean;
  class?: string;
};

const props = defineProps<Props>();

const formIsLoading = ref(false);

provide("formIsLoading", formIsLoading);

const handleSubmit = async (event: Event) => {
  formIsLoading.value = true;
  await props.onSubmit(event);
  formIsLoading.value = false;
};
</script>

<template>
  <form class="w-full" @submit="handleSubmit">
    <slot name="form-header" />
    <div class="flex flex-col md:flex-row-reverse gap-4 justify-end">
      <div v-if="$slots['form-aside']" class="md:w-[500px]">
        <!-- content explanation -->
        <slot name="form-aside" />
      </div>
      <div
        :class="
          cn(
            'w-full space-y-6',
            {
              'w-full': !!fullWidth,
              'max-w-[600px]': !fullWidth,
            },
            props.class
          )
        "
      >
        <slot />
        <FormActions>
          <slot name="actions" />
        </FormActions>
      </div>
    </div>
  </form>
</template>
