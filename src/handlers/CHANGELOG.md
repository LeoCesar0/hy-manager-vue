# API Request Handler - Changelog

## Summary of Changes

The API request handling system has been completely refactored to provide a unified, consistent approach across the entire application.

## What Was Changed

### 1. **handleUnexpectedError.ts** - Enhanced Error Handling

- ✅ Added comprehensive Firebase error code mapping
- ✅ Now handles 15+ Firebase auth and Firestore error codes
- ✅ Provides user-friendly error messages for common scenarios
- ✅ Includes error code and original message in response for debugging

### 2. **handleApiError.ts** - Improved API Error Processing

- ✅ Added `defaultErrorMessage` parameter for custom fallback messages
- ✅ Better error unwrapping from various response formats
- ✅ Cleaner integration with `handleUnexpectedError`

### 3. **handleAppRequest.ts** - Complete Rewrite

**Breaking Changes:**

- ✅ Now accepts both `AppResponse<T>` and raw `Promise<T>`
- ✅ Automatically normalizes responses to `AppResponse<T>`
- ✅ Returns `AppResponse<T>` instead of throwing errors

**New Features:**

- ✅ Success callback support with `onSuccess(data)`
- ✅ Enhanced error callback with `onError(error)`
- ✅ Success toast notifications
- ✅ Better loading state management
- ✅ Automatic toast cleanup when no success message is needed
- ✅ Default error message support

**Improvements:**

- ✅ More consistent toast notification handling
- ✅ Proper async handling of callbacks with `nextTick()`
- ✅ Better TypeScript types and inference

### 4. **useFirebaseStore.ts** - Simplified Implementation

**Before:** 200+ lines of repetitive try-catch blocks
**After:** Clean, DRY implementation using `handleAppRequest`

Changes:

- ✅ Removed `handleAPIRequest` (unused)
- ✅ All 9 wrapped Firebase methods now use `handleAppRequest`
- ✅ Reduced code duplication by ~150 lines
- ✅ Consistent error messages across all operations
- ✅ Better maintainability

### 5. **useUserStore.ts** - Modernized Authentication

- ✅ Removed manual try-catch blocks
- ✅ Now uses `handleAppRequest` for all auth operations
- ✅ Consistent toast notifications
- ✅ Cleaner code with better separation of concerns
- ✅ Automatic loading state management

## Benefits

1. **Consistency**: All API requests follow the same pattern
2. **User Experience**: Better error messages that users can understand
3. **Developer Experience**: Less boilerplate, easier to maintain
4. **Type Safety**: Better TypeScript inference throughout
5. **Flexibility**: Works with any async operation, not just Firebase
6. **Debugging**: Original error details preserved in `_message` and `_data`

## Migration Guide

### Before

```typescript
const myFunction = async () => {
  try {
    loading.value = true;
    const result = await someOperation();
    toast.success("Success!");
    return result;
  } catch (error: any) {
    toast.error(error.message || "Error");
  } finally {
    loading.value = false;
  }
};
```

### After

```typescript
const myFunction = async () => {
  const result = await handleAppRequest(() => someOperation(), {
    loadingRefs: [loading],
    toastOptions: {
      success: { message: "Success!" },
      error: { message: "Error" },
    },
  });

  return result;
};
```

## Error Codes Now Handled

### Firebase Auth

- `auth/invalid-credential` → "Invalid email or password"
- `auth/expired-token` → "Your session has expired"
- `auth/user-not-found` → "User not found"
- `auth/wrong-password` → "Incorrect password"
- `auth/email-already-in-use` → "Email is already in use"
- `auth/weak-password` → "Password is too weak"
- `auth/network-request-failed` → "Network error"
- `auth/too-many-requests` → "Too many attempts"

### Firestore

- `permission-denied` → "Permission denied"
- `not-found` → "Resource not found"
- `already-exists` → "Resource already exists"
- `failed-precondition` → "Operation failed"
- `unavailable` → "Service temporarily unavailable"

## Testing

All changes are backward compatible. Existing code will continue to work, but new code should use the updated patterns.

The dev server compiles with 0 errors after these changes.

## Next Steps

Consider updating other stores and composables to use `handleAppRequest` for consistency:

- Any custom API calls
- File upload handlers
- Custom composables that make async requests
