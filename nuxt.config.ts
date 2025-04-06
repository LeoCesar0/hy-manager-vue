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
    // prefix: "Shad",
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
      frontendApiUrl: process.env.NUXT_PUBLIC_FRONTEND_API_URL,
      backendApiUrl: process.env.NUXT_PUBLIC_BACKEND_API_URL,
      firebaseApiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY,
      firebaseAppId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID,
      dockerComposeUsed: process.env.NUXT_PUBLIC_DOCKER_COMPOSE_USED,
      env: process.env.NUXT_PUBLIC_ENVIRONMENT,
      nodeEnv: process.env.NODE_ENV,
      builtAt: new Date().toISOString(),
      appVersion: "2.4.1-beta",
    },
  },
  app: {
    pageTransition: { name: "page", mode: "out-in" },
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
