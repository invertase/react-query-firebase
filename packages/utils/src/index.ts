import { QueryKey } from "react-query";

export * from "./completer";
export * from "./usePrevious";

export function getClientKey(key: QueryKey): string {
  if (typeof key === 'string') {
    return key;
  }

  return key.join('');
}