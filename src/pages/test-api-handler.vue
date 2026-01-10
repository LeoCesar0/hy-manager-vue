<script setup lang="ts">
import { ref } from "vue";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { handleAppRequest } from "~/handlers/handleAppRequest";

const loading = ref(false);
const result = ref<string>("");

const simulateSuccess = async () => {
  const response = await handleAppRequest(
    () => new Promise((resolve) => setTimeout(() => resolve({ name: "Test User" }), 1000)),
    {
      loadingRefs: [loading],
      toastOptions: {
        loading: { message: "Processing..." },
        success: { message: "Operation completed successfully!" },
        error: { message: "Operation failed" }
      },
      onSuccess: (data) => {
        result.value = `Success: ${JSON.stringify(data)}`;
      }
    }
  );
};

const simulateError = async () => {
  const response = await handleAppRequest(
    () => new Promise((_, reject) => setTimeout(() => reject(new Error("Test error")), 1000)),
    {
      loadingRefs: [loading],
      toastOptions: {
        loading: { message: "Processing..." },
        success: { message: "Success!" },
        error: { message: "This operation failed as expected" }
      },
      onError: (error) => {
        result.value = `Error: ${error.error.message}`;
      }
    }
  );
};

const simulateFirebaseError = async () => {
  const FirebaseError = class extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.name = "FirebaseError";
      this.code = code;
    }
  };

  const response = await handleAppRequest(
    () => new Promise((_, reject) => 
      setTimeout(() => reject(new FirebaseError("auth/invalid-credential", "Invalid credential")), 1000)
    ),
    {
      loadingRefs: [loading],
      toastOptions: {
        loading: { message: "Authenticating..." },
        error: { message: "Authentication failed" }
      },
      onError: (error) => {
        result.value = `Firebase Error: ${error.error.message}`;
      }
    }
  );
};

const testFirebaseStore = async () => {
  const firebaseStore = useFirebaseStore();
  
  const response = await firebaseStore.modelList("users");
  
  if (response.data) {
    result.value = `Firebase Success: Found ${response.data.length} items`;
  } else {
    result.value = `Firebase Error: ${response.error.message}`;
  }
};

const testWithoutToast = async () => {
  const response = await handleAppRequest(
    () => new Promise((resolve) => setTimeout(() => resolve({ silent: true }), 500)),
    {
      loadingRefs: [loading],
      onSuccess: (data) => {
        result.value = `Silent success: ${JSON.stringify(data)}`;
      }
    }
  );
};
</script>

<template>
  <div class="min-h-screen p-8 bg-gray-50">
    <div class="max-w-4xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>API Handler Testing</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <Button @click="simulateSuccess" :disabled="loading">
              Test Success
            </Button>
            <Button @click="simulateError" :disabled="loading" variant="destructive">
              Test Error
            </Button>
            <Button @click="simulateFirebaseError" :disabled="loading" variant="outline">
              Test Firebase Error
            </Button>
            <Button @click="testFirebaseStore" :disabled="loading" variant="secondary">
              Test Firebase Store
            </Button>
            <Button @click="testWithoutToast" :disabled="loading" variant="ghost">
              Test Without Toast
            </Button>
          </div>

          <div v-if="loading" class="text-center py-4">
            <span class="text-gray-600">Loading...</span>
          </div>

          <div v-if="result" class="p-4 bg-gray-100 rounded-md">
            <p class="text-sm font-mono">{{ result }}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Features Demonstrated</CardTitle>
        </CardHeader>
        <CardContent>
          <ul class="list-disc list-inside space-y-2 text-sm">
            <li>✅ Automatic loading state management</li>
            <li>✅ Toast notifications for loading, success, and error</li>
            <li>✅ Success and error callbacks</li>
            <li>✅ Firebase error code translation</li>
            <li>✅ Unified error handling across the app</li>
            <li>✅ Support for silent operations (no toast)</li>
            <li>✅ Integration with Firebase store operations</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
