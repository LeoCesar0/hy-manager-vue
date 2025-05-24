import Vue3Toastify, { toast, type ToastContainerOptions } from "vue3-toastify";
import "vue3-toastify/dist/index.css";

const options: ToastContainerOptions = {
  autoClose: 5000,
  theme: "dark",
  clearOnUrlChange: false,
};

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(Vue3Toastify, { ...options });

  return {
    provide: { toast },
  };
});
