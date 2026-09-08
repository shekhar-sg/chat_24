import type { Theme } from "@mui/material";
import type { SxProps } from "@mui/system";
import { Timestamp } from "firebase/firestore";

export const sxToArray = (sx?: SxProps<Theme>) => {
  if (Array.isArray(sx)) {
    return sx;
  } else if (typeof sx === "object" && sx !== null) {
    return [sx];
  }
  return [];
};

export function timestampToMillis(
  timestamp: Timestamp | null | undefined
): number {
  return timestamp ? timestamp.toMillis() : Date.now();
}
