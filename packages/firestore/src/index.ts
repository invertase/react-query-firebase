import { SnapshotListenOptions } from "firebase/firestore";
import { UseQueryOptions } from "react-query";

export type GetSnapshotOptions = {
  source?: "cache" | "server";
};

export type BaseUseFirestoreHookOptions = {};

export type UseFirestoreHookOptions =
  | ({
      subscribe: true;
    } & SnapshotListenOptions &
      GetSnapshotOptions)
  | ({
      subscribe: false;
    } & GetSnapshotOptions);

export * from "./useFirestoreDocument";
export * from "./useFirestoreQuery";
export * from "./useFirestoreMutation";
