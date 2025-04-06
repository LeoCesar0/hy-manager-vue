import { ref } from "vue";
import { makeStoreKey } from "~/helpers/makeStoreKey";

type ActionProps = {
  label: string;
  action: () => void;
  variant?: "primary" | "danger";
};

interface AlertDialogOptions {
  title: string;
  message?: string;
  hasCancel?: boolean;
  confirm?: ActionProps;
}

export const useAlertDialog = defineStore(makeStoreKey("alert-dialog"), () => {
  const isOpen = ref(false);
  const dialogOptions = ref<AlertDialogOptions | null>(null);

  const openDialog = (options: AlertDialogOptions) => {
    dialogOptions.value = {
      hasCancel: true,
      ...options,
    };
    isOpen.value = true;
  };

  const closeDialog = () => {
    isOpen.value = false;
    dialogOptions.value = null;
  };

  watch(isOpen, (value) => {
    if (!value && dialogOptions.value) {
      dialogOptions.value = null;
    }
  });

  watch(dialogOptions, (value) => {
    if (value && !isOpen.value) {
      isOpen.value = true;
    }
  });

  return {
    isOpen,
    dialogOptions,
    openDialog,
    closeDialog,
  };
});
