type ToastItemOption = { message: string };

export type ToastOptions = {
  loading?: boolean | ToastItemOption;
  success?: boolean | ToastItemOption;
  error?: boolean | ToastItemOption;
};
