import type { Theme } from "@mui/material";
import type { SxProps } from "@mui/system";
export { timestampToMillis } from "@/lib/chat";

export const sxToArray = (sx?: SxProps<Theme>) => {
  if (Array.isArray(sx)) {
    return sx;
  } else if (sx != null) {
    return [sx];
  }
  return [];
};
