export enum FirebaseCollection {
  users = "users",
  bankAccounts = "bankAccounts",
  transactions = "transactions",
  transactionReports = "transactionReports",
  bankCreditors = "bankCreditors",
}

export const firebaseCollections = Object.values(FirebaseCollection);
