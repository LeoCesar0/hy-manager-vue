import { Timestamp } from "firebase/firestore";
import { z } from "zod";

export const zTimestamp = z.custom<Timestamp>((value) => {
  return value instanceof Timestamp;
});
