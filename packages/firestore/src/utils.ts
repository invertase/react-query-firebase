import { QueryKey } from "react-query";

export function getClientKey(key: QueryKey): string {
  if (typeof key === "string") {
    return key;
  }

  return key.join("");
}
