import { SnapshotListenOptions } from "firebase/firestore";
import { UseQueryOptions } from "react-query";

export type GetSnapshotSource = "server" | "cache";

export type GetSnapshotOptions = {
  source?: GetSnapshotSource;
};

export type BaseUseFirestoreHookOptions = {};

export type UseFirestoreHookOptions =
  | ({
      subscribe: true;
    } & SnapshotListenOptions &
      GetSnapshotOptions)
  | ({
      subscribe?: false;
    } & GetSnapshotOptions);

export * from "./useFirestoreDocument";
export * from "./useFirestoreQuery";
export * from "./useFirestoreMutation";
