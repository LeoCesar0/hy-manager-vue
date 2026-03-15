# Missing Firestore Composite Indexes

Generated at: 2026-03-15T14:34:13.686Z

The following filter combinations require composite indexes that are not yet created.
Click the links in the error messages to create them in the Firebase console.

## 5. categoryIds array-contains

```
9 FAILED_PRECONDITION: The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/hyfinances-1532e/firestore/indexes?create_composite=ClVwcm9qZWN0cy9oeWZpbmFuY2VzLTE1MzJlL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy90cmFuc2FjdGlvbnMvaW5kZXhlcy9fEAEaDwoLY2F0ZWdvcnlJZHMYARoKCgZ1c2VySWQQARoPCgtjYXRlZ29yeUlkcxACGggKBGRhdGUQAhoMCghfX25hbWVfXxAC
```

## 9. category + date range

```
9 FAILED_PRECONDITION: The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/hyfinances-1532e/firestore/indexes?create_composite=ClVwcm9qZWN0cy9oeWZpbmFuY2VzLTE1MzJlL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy90cmFuc2FjdGlvbnMvaW5kZXhlcy9fEAEaDwoLY2F0ZWdvcnlJZHMYARoKCgZ1c2VySWQQARoPCgtjYXRlZ29yeUlkcxACGggKBGRhdGUQAhoMCghfX25hbWVfXxAC .
The query contains range and inequality filters on multiple fields, please refer to the documentation for index selection best practices: https://cloud.google.com/firestore/docs/query-data/multiple-range-fields.
```

## 12. type + category

```
9 FAILED_PRECONDITION: The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/hyfinances-1532e/firestore/indexes?create_composite=ClVwcm9qZWN0cy9oeWZpbmFuY2VzLTE1MzJlL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy90cmFuc2FjdGlvbnMvaW5kZXhlcy9fEAEaDwoLY2F0ZWdvcnlJZHMYARoICgR0eXBlEAEaCgoGdXNlcklkEAEaDwoLY2F0ZWdvcnlJZHMQAhoICgRkYXRlEAIaDAoIX19uYW1lX18QAg
```

## 15. type + category + date range

```
The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/hyfinances-1532e/firestore/indexes?create_composite=ClVwcm9qZWN0cy9oeWZpbmFuY2VzLTE1MzJlL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy90cmFuc2FjdGlvbnMvaW5kZXhlcy9fEAEaDwoLY2F0ZWdvcnlJZHMYARoICgR0eXBlEAEaCgoGdXNlcklkEAEaDwoLY2F0ZWdvcnlJZHMQAhoICgRkYXRlEAIaDAoIX19uYW1lX18QAg .
The query contains range and inequality filters on multiple fields, please refer to the documentation for index selection best practices: https://cloud.google.com/firestore/docs/query-data/multiple-range-fields.
```

## 18. category + counterparty

```
9 FAILED_PRECONDITION: The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/hyfinances-1532e/firestore/indexes?create_composite=ClVwcm9qZWN0cy9oeWZpbmFuY2VzLTE1MzJlL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy90cmFuc2FjdGlvbnMvaW5kZXhlcy9fEAEaDwoLY2F0ZWdvcnlJZHMYARoSCg5jb3VudGVycGFydHlJZBABGgoKBnVzZXJJZBABGg8KC2NhdGVnb3J5SWRzEAIaCAoEZGF0ZRACGgwKCF9fbmFtZV9fEAI
```

## 19. category + bankAccount

```
9 FAILED_PRECONDITION: The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/hyfinances-1532e/firestore/indexes?create_composite=ClVwcm9qZWN0cy9oeWZpbmFuY2VzLTE1MzJlL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy90cmFuc2FjdGlvbnMvaW5kZXhlcy9fEAEaDwoLY2F0ZWdvcnlJZHMYARoRCg1iYW5rQWNjb3VudElkEAEaCgoGdXNlcklkEAEaDwoLY2F0ZWdvcnlJZHMQAhoICgRkYXRlEAIaDAoIX19uYW1lX18QAg
```

## 20. all filters combined

```
9 FAILED_PRECONDITION: The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/hyfinances-1532e/firestore/indexes?create_composite=ClVwcm9qZWN0cy9oeWZpbmFuY2VzLTE1MzJlL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy90cmFuc2FjdGlvbnMvaW5kZXhlcy9fEAEaDwoLY2F0ZWdvcnlJZHMYARoRCg1iYW5rQWNjb3VudElkEAEaEgoOY291bnRlcnBhcnR5SWQQARoICgR0eXBlEAEaCgoGdXNlcklkEAEaDwoLY2F0ZWdvcnlJZHMQAhoICgRkYXRlEAIaDAoIX19uYW1lX18QAg .
The query contains range and inequality filters on multiple fields, please refer to the documentation for index selection best practices: https://cloud.google.com/firestore/docs/query-data/multiple-range-fields.
```
