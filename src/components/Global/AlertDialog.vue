<script setup lang="ts">
import { cn } from "~/lib/utils";

const store = useAlertDialog();
const { dialogOptions, isOpen } = storeToRefs(store);

const descriptionHtml = ref("");

watch(
  () => dialogOptions.value?.message,
  async (message) => {
    if (message) {
      descriptionHtml.value = message;
    } else {
      descriptionHtml.value = "";
    }
  }
);
</script>

<template>
  <UiAlertDialog :open="isOpen">
    <UiAlertDialogContent>
      <UiAlertDialogHeader>
        <UiAlertDialogTitle>{{ dialogOptions?.title }}</UiAlertDialogTitle>
        <UiAlertDialogDescription v-if="dialogOptions?.message" v-html="descriptionHtml">
        </UiAlertDialogDescription>
      </UiAlertDialogHeader>
      <UiAlertDialogFooter>
        <UiAlertDialogCancel v-if="dialogOptions?.hasCancel" @click="store.closeDialog">Cancel</UiAlertDialogCancel>
        <UiAlertDialogAction :class="cn({
          'danger-color': dialogOptions?.confirm?.variant === 'danger',
        })
          " @click="
            () => {
              dialogOptions?.confirm?.action();
              store.closeDialog();
            }
          ">{{
            dialogOptions?.confirm?.label ?? "Continue"
          }}</UiAlertDialogAction>
        <UiButton v-for="option in dialogOptions?.otherOptions" :key="option.label" :class="cn({
          'danger-color': option.variant === 'danger',
        })
          " @click="() => {
            store.closeDialog();
            option.action();
          }" :variant="option.variant">
          {{ option.label }}
        </UiButton>
      </UiAlertDialogFooter>
    </UiAlertDialogContent>
  </UiAlertDialog>
</template>
