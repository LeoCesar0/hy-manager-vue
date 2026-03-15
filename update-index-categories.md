# Missing Firestore Composite Indexes (Categories)

Generated at: 2026-03-15T17:43:56.942Z

The following filter combinations require composite indexes that are not yet created.
Click the links in the error messages to create them in the Firebase console.

## 1. userId only (ordered by name asc)

```
9 FAILED_PRECONDITION: The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/hyfinances-1532e/firestore/indexes?create_composite=ClNwcm9qZWN0cy9oeWZpbmFuY2VzLTE1MzJlL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9jYXRlZ29yaWVzL2luZGV4ZXMvXxABGgoKBnVzZXJJZBABGggKBG5hbWUQARoMCghfX25hbWVfXxAB
```

## 2. userId only (ordered by name desc)

```
The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/hyfinances-1532e/firestore/indexes?create_composite=ClNwcm9qZWN0cy9oeWZpbmFuY2VzLTE1MzJlL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9jYXRlZ29yaWVzL2luZGV4ZXMvXxABGgoKBnVzZXJJZBABGggKBG5hbWUQAhoMCghfX25hbWVfXxAC
```

## 3. userId only (ordered by createdAt desc)

```
9 FAILED_PRECONDITION: The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/hyfinances-1532e/firestore/indexes?create_composite=ClNwcm9qZWN0cy9oeWZpbmFuY2VzLTE1MzJlL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9jYXRlZ29yaWVzL2luZGV4ZXMvXxABGgoKBnVzZXJJZBABGg0KCWNyZWF0ZWRBdBACGgwKCF9fbmFtZV9fEAI
```
