# Unified API Request Handler Documentation

## Overview

The unified API request handler provides a consistent, type-safe way to handle all asynchronous operations in the application. It integrates error handling, loading states, and user feedback (toasts) into a single, reusable pattern.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      handleAppRequest                        │
│  Main entry point for all API requests                      │
│  - Manages loading states                                   │
│  - Handles toast notifications                              │
│  - Normalizes responses to AppResponse<T>                   │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ├─── Success Path ──────────────────────┐
                    │                                        │
                    │    Returns: { data: T, error: null } ──┤
                    │                                        │
                    └─── Error Path ────────────────────────┤
                         │                                   │
                         ├─→ handleApiError ───────────────┐│
                         │   - Unwraps nested errors       ││
                         │   - Checks if it's an AppError  ││
                         │                                  ││
                         └─→ handleUnexpectedError ────────┤│
                             - Maps Firebase errors        ││
                             - Creates user-friendly msgs  ││
                                                            ││
                    Returns: { data: null, error: AppError }│
                                                            │
                                                            └─→
```

## Core Components

### 1. handleAppRequest (Main Handler)
Location: `/src/handlers/handleAppRequest.ts`

The primary function that wraps all async operations.

**Type Signature:**
```typescript
async function handleAppRequest<T>(
  request: () => Promise<AppResponse<T>> | Promise<T>,
  options?: IHandleAppRequestProps<T>
): Promise<AppResponse<T>>
```

**Features:**
- Accepts both `AppResponse<T>` and raw `T` promises
- Automatically normalizes to `AppResponse<T>`
- Manages multiple loading refs simultaneously
- Provides lifecycle callbacks (onSuccess, onError)
- Configurable toast notifications
- Proper cleanup on success/error

### 2. handleApiError (API Error Processor)
Location: `/src/handlers/handleApiError.ts`

Processes API errors and unwraps nested error structures.

**Features:**
- Unwraps nested response structures (`response._data`, `_data`, `data`)
- Detects if error is already in `AppError` format
- Delegates to `handleUnexpectedError` for raw errors

### 3. handleUnexpectedError (Error Formatter)
Location: `/src/handlers/handleUnexpectedError.ts`

Converts raw errors into user-friendly `AppError` format.

**Features:**
- Special handling for Firebase errors
- Maps 15+ Firebase error codes to user-friendly messages
- Preserves original error details for debugging
- Provides fallback messages

## Response Types

### AppResponse<T>
```typescript
type AppResponse<T> = 
  | { data: T; error: null }
  | { data: null; error: AppError }
```

### AppError
```typescript
type AppError = {
  _isAppError: true;        // Type guard
  message: string;          // User-friendly message
  code?: string;            // Error code (e.g., Firebase code)
  _message?: string;        // Original error message (debugging)
  _data?: any;             // Original error object (debugging)
}
```

## Usage Patterns

### Pattern 1: Simple Request with Toast
```typescript
const loading = ref(false);

const fetchData = async () => {
  const result = await handleAppRequest(
    () => api.fetchSomething(),
    {
      loadingRefs: [loading],
      toastOptions: {
        loading: { message: "Fetching data..." },
        success: { message: "Data loaded!" },
        error: { message: "Failed to load data" }
      }
    }
  );
  
  if (result.data) {
    // Use result.data
  }
};
```

### Pattern 2: With Success Callback
```typescript
const saveData = async (data: any) => {
  await handleAppRequest(
    () => api.save(data),
    {
      loadingRefs: [isSaving],
      toastOptions: {
        success: { message: "Saved!" },
        error: { message: "Save failed" }
      },
      onSuccess: () => {
        router.push('/success-page');
      }
    }
  );
};
```

### Pattern 3: Silent Operation (No Toast)
```typescript
const backgroundSync = async () => {
  const result = await handleAppRequest(
    () => api.syncInBackground(),
    { loadingRefs: [isSyncing] }
    // No toastOptions = no notifications
  );
  return result;
};
```

### Pattern 4: Custom Error Handling
```typescript
const criticalOperation = async () => {
  await handleAppRequest(
    () => api.performCritical(),
    {
      toastOptions: {
        error: { message: "Critical operation failed" }
      },
      onError: (error) => {
        // Log to error tracking service
        errorTracker.log(error);
        // Show additional UI
        showErrorModal(error.error.message);
      },
      defaultErrorMessage: "An unexpected error occurred"
    }
  );
};
```

### Pattern 5: Firebase Store Integration
```typescript
const firebaseStore = useFirebaseStore();

// All these methods use handleAppRequest internally
const users = await firebaseStore.modelList('users');
const user = await firebaseStore.modelGet('users', userId);
await firebaseStore.modelCreate('users', userData);
await firebaseStore.modelUpdate('users', userId, updates);
await firebaseStore.modelDelete('users', userId);

// Check results
if (users.data) {
  console.log('Users:', users.data);
} else {
  console.error('Error:', users.error.message);
}
```

## Firebase Error Mapping

The following Firebase errors are automatically converted to user-friendly messages:

| Firebase Code | User Message |
|---------------|--------------|
| `auth/invalid-credential` | "Invalid email or password" |
| `auth/expired-token` | "Your session has expired. Please sign in again" |
| `auth/user-not-found` | "User not found" |
| `auth/wrong-password` | "Incorrect password" |
| `auth/email-already-in-use` | "Email is already in use" |
| `auth/weak-password` | "Password is too weak" |
| `auth/network-request-failed` | "Network error. Please check your connection" |
| `auth/too-many-requests` | "Too many attempts. Please try again later" |
| `permission-denied` | "Permission denied. You don't have access to this resource" |
| `not-found` | "Resource not found" |
| `already-exists` | "Resource already exists" |
| `failed-precondition` | "Operation failed. Please try again" |
| `unavailable` | "Service temporarily unavailable. Please try again" |

## Best Practices

### ✅ DO
1. Always use `handleAppRequest` for consistency
2. Provide meaningful error messages for users
3. Use loading refs to manage UI state
4. Check `result.data` before using response data
5. Use `onSuccess` for navigation or side effects
6. Provide `defaultErrorMessage` for operations where errors might be unclear

### ❌ DON'T
1. Don't create new error handling patterns
2. Don't handle loading states manually in components
3. Don't show raw error messages to users
4. Don't assume the request succeeded without checking `result.data`
5. Don't ignore errors silently

## Testing

A test page is available at `/test-api-handler` to demonstrate all features:
- Success scenarios
- Error scenarios
- Firebase error mapping
- Silent operations
- Firebase store integration

## Migration Checklist

When migrating existing code:

- [ ] Replace try-catch blocks with `handleAppRequest`
- [ ] Move loading state management to `loadingRefs`
- [ ] Replace manual toast calls with `toastOptions`
- [ ] Use `onSuccess` for post-success logic
- [ ] Use `onError` for custom error handling
- [ ] Check `result.data` instead of catching errors
- [ ] Remove manual error formatting code

## Examples in Codebase

**Authentication:** `/src/composables/stores/useUserStore.ts`
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
      onSuccess: () => router.push("/")
    }
  );
};
```

**Firebase Operations:** `/src/composables/stores/useFirebaseStore.ts`
```typescript
const wrappedFirebaseCreate = async <T, R>(
  ...args: Parameters<typeof firebaseCreate<T, R>>
): Promise<AppResponse<R>> => {
  return handleAppRequest(
    () => firebaseCreate<T, R>(...args),
    { defaultErrorMessage: "Failed to create item" }
  );
};
```

## Troubleshooting

### Issue: Toast notifications not showing
**Solution:** Ensure `useToast` composable is properly initialized and vue3-toastify is configured.

### Issue: Loading state not updating
**Solution:** Pass refs to `loadingRefs` array, not raw values.

### Issue: Success callback not firing
**Solution:** Ensure request returns `AppResponse` with `data` field, not `error`.

### Issue: Custom error message not showing
**Solution:** Use `toastOptions.error` for user-facing messages, `defaultErrorMessage` for fallback.

## Performance Considerations

- The handler adds minimal overhead (< 1ms typically)
- Toast operations are async and don't block the main thread
- Multiple loading refs are updated in a single pass
- Error mapping uses switch statements for O(1) lookup

## Future Enhancements

Potential improvements to consider:
- Retry logic for failed requests
- Request debouncing/throttling
- Request cancellation support
- Request caching layer
- Analytics integration
- Request queue management for offline support

## Support

For questions or issues:
1. Check this documentation
2. Review examples in `/src/pages/test-api-handler.vue`
3. Check usage in stores: `useUserStore`, `useFirebaseStore`
4. Refer to type definitions in `/src/@schemas/app.ts`
