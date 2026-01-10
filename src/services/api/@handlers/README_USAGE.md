# API Request Handler Usage Guide

This guide explains how to use the unified `handleAppRequest` handler for all API operations in the application.

## Overview

The `handleAppRequest` function provides a consistent way to handle all API requests with built-in error handling, loading states, and toast notifications.

## Features

- ✅ Automatic error handling with Firebase-specific error messages
- ✅ Loading state management
- ✅ Toast notifications (loading, success, error)
- ✅ Success and error callbacks
- ✅ Support for both `AppResponse<T>` and raw responses
- ✅ Consistent error formatting across the application

## Basic Usage

```typescript
import { handleAppRequest } from '~/handlers/handleAppRequest';

const loading = ref(false);

const result = await handleAppRequest(
  () => someAsyncOperation(),
  {
    loadingRefs: [loading],
    toastOptions: {
      loading: { message: 'Processing...' },
      success: { message: 'Operation completed!' },
      error: { message: 'Operation failed' }
    }
  }
);

if (result.data) {
  // Handle success
} else {
  // Handle error - already shown to user via toast
}
```

## Options

### `loadingRefs`
Array of refs to automatically set to `true` during request and `false` after.

```typescript
const loading = ref(false);
const secondaryLoading = ref(false);

await handleAppRequest(
  () => myRequest(),
  {
    loadingRefs: [loading, secondaryLoading]
  }
);
```

### `toastOptions`
Configure toast notifications for different states.

```typescript
toastOptions: {
  loading: boolean | { message: string },
  success: boolean | { message: string },
  error: boolean | { message: string }
}
```

Examples:
```typescript
// Simple boolean flags
toastOptions: {
  loading: true,  // Shows "Loading..."
  success: true,  // Shows "Success"
  error: true     // Shows error message from response
}

// Custom messages
toastOptions: {
  loading: { message: "Saving user..." },
  success: { message: "User saved successfully!" },
  error: { message: "Failed to save user" }
}
```

### `onSuccess`
Callback executed when request succeeds (before toast).

```typescript
await handleAppRequest(
  () => createUser(userData),
  {
    onSuccess: (data) => {
      console.log('User created:', data);
      router.push('/users');
    }
  }
);
```

### `onError`
Callback executed when request fails (before toast).

```typescript
await handleAppRequest(
  () => deleteUser(id),
  {
    onError: (error) => {
      console.error('Delete failed:', error);
      // Could track error in analytics, etc.
    }
  }
);
```

### `defaultErrorMessage`
Fallback error message when none is provided by the error.

```typescript
await handleAppRequest(
  () => complexOperation(),
  {
    defaultErrorMessage: "An unexpected error occurred during the operation"
  }
);
```

## Firebase Store Integration

All Firebase operations in `useFirebaseStore` now use `handleAppRequest` internally:

```typescript
const firebaseStore = useFirebaseStore();

// These automatically handle errors with appropriate messages
const result = await firebaseStore.modelCreate(collection, data);
const items = await firebaseStore.modelList(collection);
const item = await firebaseStore.modelGet(collection, id);
await firebaseStore.modelUpdate(collection, id, updates);
await firebaseStore.modelDelete(collection, id);
```

## Authentication Example

The `useUserStore` demonstrates proper integration:

```typescript
const handleEmailSignIn = async (email: string, password: string) => {
  await handleAppRequest(
    () => signInWithEmailAndPassword(firebaseAuth, email, password),
    {
      loadingRefs: [loading],
      toastOptions: {
        loading: { message: "Signing in..." },
        success: { message: "Successfully signed in!" },
        error: { message: "Failed to sign in" }
      },
      onSuccess: () => {
        router.push("/dashboard");
      }
    }
  );
};
```

## Error Types

The handler recognizes and formats these Firebase errors automatically:

- `auth/invalid-credential` → "Invalid email or password"
- `auth/expired-token` → "Your session has expired. Please sign in again"
- `auth/user-not-found` → "User not found"
- `auth/wrong-password` → "Incorrect password"
- `auth/email-already-in-use` → "Email is already in use"
- `auth/weak-password` → "Password is too weak"
- `auth/network-request-failed` → "Network error. Please check your connection"
- `auth/too-many-requests` → "Too many attempts. Please try again later"
- `permission-denied` → "Permission denied. You don't have access to this resource"
- `not-found` → "Resource not found"
- And many more...

## Response Type

All requests return `AppResponse<T>`:

```typescript
type AppResponse<T> = 
  | { data: T; error: null }
  | { data: null; error: AppError }

type AppError = {
  _isAppError: true;
  message: string;
  code?: string;
  _message?: string;
  _data?: any;
}
```

## Best Practices

1. **Always use `handleAppRequest`** for consistency
2. **Provide meaningful error messages** via `toastOptions.error`
3. **Use `loadingRefs`** to manage UI loading states
4. **Check `result.data`** before using the response
5. **Use `onSuccess`** for navigation or side effects
6. **Provide `defaultErrorMessage`** for operations where the error might be unclear

## Examples

### Simple API Call
```typescript
const data = ref(null);
const loading = ref(false);

const fetchData = async () => {
  const result = await handleAppRequest(
    () => firebaseStore.modelList('users'),
    { loadingRefs: [loading] }
  );
  
  if (result.data) {
    data.value = result.data;
  }
};
```

### With Full Options
```typescript
const saveUser = async (userData: IUser) => {
  const result = await handleAppRequest(
    () => firebaseStore.modelCreate('users', userData),
    {
      loadingRefs: [isSaving],
      toastOptions: {
        loading: { message: "Creating user..." },
        success: { message: "User created successfully!" },
        error: { message: "Failed to create user" }
      },
      onSuccess: (user) => {
        console.log('Created user:', user);
        router.push(`/users/${user.id}`);
      },
      onError: (error) => {
        console.error('Creation failed:', error);
      },
      defaultErrorMessage: "Unable to create user. Please try again."
    }
  );
};
```

### Without Toast Notifications
```typescript
const result = await handleAppRequest(
  () => firebaseStore.modelGet('users', userId),
  { loadingRefs: [loading] }
  // No toastOptions = no notifications
);
```

### Only Error Toast
```typescript
const result = await handleAppRequest(
  () => fetchSilently(),
  {
    toastOptions: {
      error: { message: "Failed to fetch data" }
      // No loading or success toast
    }
  }
);
```
