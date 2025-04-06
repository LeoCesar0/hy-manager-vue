import { z } from "zod";
import { zIsoDate } from "./isoDate";
import { parseToDate } from "@helpers/parseToDate";
import { zTimestamp } from "../firebase";
import { Timestamp } from "firebase/firestore";

export const zFlexDate = zIsoDate
  .or(z.coerce.date())
  .or(zTimestamp)
  .transform((value) => {
    if (value instanceof Timestamp) {
      return value.toDate();
    }
    return parseToDate(value);
  });

export type FlexDate = z.infer<typeof zFlexDate>;

export type FlexDateInput = z.input<typeof zFlexDate>;
