import type { WhereFilterOp } from "firebase/firestore";

export type FirebaseFilterFor<T> = {
  field: keyof T;
  operator: WhereFilterOp;
  value: any;
};
