import { vi } from "vitest";
import { ref, nextTick } from "vue";

// ---------------------------------------------------
// Mock Nuxt auto-imports that services depend on
// ---------------------------------------------------

// `Ref` and `nextTick` are auto-imported from Vue in Nuxt
vi.stubGlobal("ref", ref);
vi.stubGlobal("nextTick", nextTick);

// `useNuxtApp` — used by useToast composable
vi.stubGlobal("useNuxtApp", () => ({
  $toast: {
    loading: vi.fn(() => "toast-id"),
    success: vi.fn(),
    error: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

// `useToast` — used by handleAppRequest
vi.stubGlobal("useToast", () => ({
  toast: {
    loading: vi.fn(() => "toast-id"),
    success: vi.fn(),
    error: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
  handleToastPromise: vi.fn(),
  handleToastAnyPromise: vi.fn(),
}));

// `useRuntimeConfig` — used by Firebase store
vi.stubGlobal("useRuntimeConfig", () => ({
  public: {
    firebaseApiKey: "test-api-key",
    firebaseAuthDomain: "test-project.firebaseapp.com",
    firebaseProjectId: "test-project",
    firebaseStorageBucket: "test-project.appspot.com",
    firebaseMessagingSenderId: "000000000000",
    firebaseAppId: "1:000000000000:web:0000000000000000",
    firebaseMeasurementId: "G-TEST000000",
  },
}));
