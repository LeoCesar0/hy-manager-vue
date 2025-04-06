<script setup lang="ts">
type Props = {
  fieldPrefix?: string;
};

const props = withDefaults(defineProps<Props>(), {
  fieldPrefix: "",
});
</script>

<template>
  <div class="flex flex-wrap gap-4">
    <FormField
      :name="`${fieldPrefix}address.city`"
      label="City"
      class="flex-grow w-full sm:flex-1"
    />
    <FormField
      :name="`${fieldPrefix}address.state`"
      label="State"
      class="flex-grow w-full sm:flex-1"
    />
    <FormField
      :name="`${fieldPrefix}address.country`"
      label="Country"
      class="flex-grow w-full sm:flex-1"
    />
    <FormField
      :name="`${fieldPrefix}address.address`"
      label="Address"
      class="flex-grow w-full"
    />
  </div>
</template>
