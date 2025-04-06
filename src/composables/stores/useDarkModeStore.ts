import { ref, onMounted, onUnmounted } from "vue";
import { makeStoreKey } from "~/helpers/makeStoreKey";

export const useDarkModeStore = defineStore(
  makeStoreKey("dark-mode-store"),
  () => {
    const isDark = ref(false);
    const storeKey = makeStoreKey("dark-mode");

    const toggleDarkMode = () => {
      isDark.value = !isDark.value;
      localStorage.setItem(storeKey, isDark.value.toString());

      if (isDark.value) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    onMounted(() => {
      const savedMode = localStorage.getItem(storeKey);
      if (savedMode === "true") {
        isDark.value = true;
        document.documentElement.classList.add("dark");
      }
    });

    return {
      isDark,
      toggleDarkMode,
    };
  }
);
