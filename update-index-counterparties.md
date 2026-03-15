# Missing Firestore Composite Indexes (Counterparties)

Generated at: 2026-03-15T17:43:54.961Z

The following filter combinations require composite indexes that are not yet created.
Click the links in the error messages to create them in the Firebase console.

## 1. userId only (ordered by name asc)

```
9 FAILED_PRECONDITION: The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/hyfinances-1532e/firestore/indexes?create_composite=ClJwcm9qZWN0cy9oeWZpbmFuY2VzLTE1MzJlL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9jcmVkaXRvcnMvaW5kZXhlcy9fEAEaCgoGdXNlcklkEAEaCAoEbmFtZRABGgwKCF9fbmFtZV9fEAE
```

## 2. userId only (ordered by name desc)

```
9 FAILED_PRECONDITION: The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/hyfinances-1532e/firestore/indexes?create_composite=ClJwcm9qZWN0cy9oeWZpbmFuY2VzLTE1MzJlL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9jcmVkaXRvcnMvaW5kZXhlcy9fEAEaCgoGdXNlcklkEAEaCAoEbmFtZRACGgwKCF9fbmFtZV9fEAI
```

## 3. userId only (ordered by createdAt desc)

```
9 FAILED_PRECONDITION: The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/hyfinances-1532e/firestore/indexes?create_composite=ClJwcm9qZWN0cy9oeWZpbmFuY2VzLTE1MzJlL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9jcmVkaXRvcnMvaW5kZXhlcy9fEAEaCgoGdXNlcklkEAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg
```

## 4. userId + categoryIds array-contains (ordered by name asc)

```
9 FAILED_PRECONDITION: The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/hyfinances-1532e/firestore/indexes?create_composite=ClJwcm9qZWN0cy9oeWZpbmFuY2VzLTE1MzJlL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9jcmVkaXRvcnMvaW5kZXhlcy9fEAEaDwoLY2F0ZWdvcnlJZHMYARoKCgZ1c2VySWQQARoPCgtjYXRlZ29yeUlkcxABGggKBG5hbWUQARoMCghfX25hbWVfXxAB
```

## 5. userId + categoryIds array-contains (ordered by name desc)

```
9 FAILED_PRECONDITION: The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/hyfinances-1532e/firestore/indexes?create_composite=ClJwcm9qZWN0cy9oeWZpbmFuY2VzLTE1MzJlL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9jcmVkaXRvcnMvaW5kZXhlcy9fEAEaDwoLY2F0ZWdvcnlJZHMYARoKCgZ1c2VySWQQARoPCgtjYXRlZ29yeUlkcxACGggKBG5hbWUQAhoMCghfX25hbWVfXxAC
```

## 6. userId + categoryIds array-contains (ordered by createdAt desc)

```
9 FAILED_PRECONDITION: The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/hyfinances-1532e/firestore/indexes?create_composite=ClJwcm9qZWN0cy9oeWZpbmFuY2VzLTE1MzJlL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9jcmVkaXRvcnMvaW5kZXhlcy9fEAEaDwoLY2F0ZWdvcnlJZHMYARoKCgZ1c2VySWQQARoPCgtjYXRlZ29yeUlkcxACGg0KCWNyZWF0ZWRBdBACGgwKCF9fbmFtZV9fEAI
```
