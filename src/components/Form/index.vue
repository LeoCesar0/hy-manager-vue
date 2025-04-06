<script setup lang="ts">
import { cn } from "~/lib/utils";

type Props = {
  onSubmit: () => Promise<any>;
  fullWidth?: boolean;
  class?: string;
};

const props = defineProps<Props>();
</script>

<template>
  <div class="flex flex-col md:flex-row-reverse gap-4 justify-end">
    <div v-if="$slots['form-description']" class="md:w-[500px]">
      <!-- content explanation -->
      <slot name="form-description" />
    </div>
    <form
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
      @submit="onSubmit"
    >
      <slot />
      <FormActions>
        <slot name="actions" />
      </FormActions>
    </form>
  </div>
</template>
