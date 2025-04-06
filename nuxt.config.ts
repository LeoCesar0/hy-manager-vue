import { resolve } from "path";
import { defineNuxtConfig } from "nuxt/config";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  srcDir: "src/",
  ssr: true,
  css: [
    "@/styles/globals.scss",
    "@/styles/utils.scss",
    "@/styles/components.scss",
  ],
  modules: ["@nuxtjs/tailwindcss", "shadcn-nuxt", "@pinia/nuxt"],
  imports: {
    dirs: ["composables/*.ts", "composables/**/*.ts"],
  },
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern-compiler", // or "modern"
        },
      },
    },
  },
  typescript: {
    typeCheck: true,
  },
  alias: {
    "@lib": resolve(__dirname, "./src/lib"),
    "@helpers": resolve(__dirname, "./src/helpers"),
    "@components": resolve(__dirname, "./src/components"),
    "@static": resolve(__dirname, "./src/static"),
  },
  shadcn: {
    prefix: "",
    componentDir: "@/components/ui",
  },
  components: [
    {
      extensions: [".vue"],
      path: "@/components",
    },
  ],
  runtimeConfig: {
    public: {
      builtAt: new Date().toISOString(),
      appVersion: "1.0.0-beta",
      firebaseApiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId:
        process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID,
      firebaseMeasurementId: process.env.NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    },
  },
  app: {
    baseURL: "/",
    head: {
      link: [
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/apple-touch-icon.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "32x32",
          href: "/favicon-32x32.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "16x16",
          href: "/favicon-16x16.png",
        },
        {
          rel: "manifest",
          href: "/site.webmanifest",
        },
      ],
    },
  },
});
