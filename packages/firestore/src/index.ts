/*
 * Copyright (c) 2016-present Invertase Limited & Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this library except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import {
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  getDoc,
  getDocFromCache,
  getDocFromServer,
  getDocs,
  getDocsFromCache,
  getDocsFromServer,
  Query,
  QuerySnapshot,
  SnapshotListenOptions,
} from "firebase/firestore";

export type GetSnapshotSource = "server" | "cache";

export type GetSnapshotOptions = {
  source?: GetSnapshotSource;
};

export type UseFirestoreHookOptions =
  | ({
      subscribe: true;
    } & SnapshotListenOptions)
  | ({
      subscribe?: false;
    } & GetSnapshotOptions);

export type WithIdField<D, F = void> = F extends string
  ? D & { [key in F]: string }
  : D;

export async function getSnapshot<T>(
  ref: DocumentReference<T>,
  source?: GetSnapshotSource
): Promise<DocumentSnapshot<T>> {
  let snapshot: DocumentSnapshot<T>;

  if (source === "cache") {
    snapshot = await getDocFromCache(ref);
  } else if (source === "server") {
    snapshot = await getDocFromServer(ref);
  } else {
    snapshot = await getDoc(ref);
  }

  return snapshot;
}

export type NamedQueryPromise<T> = () => Promise<Query<T> | null>;

export type NamedQuery<T = DocumentData> = Query<T> | NamedQueryPromise<T>;

export type QueryType<T> = Query<T> | NamedQuery<T>;

export async function getQuerySnapshot<T>(
  query: Query<T>,
  source?: GetSnapshotSource
): Promise<QuerySnapshot<T>> {
  let snapshot: QuerySnapshot<T>;

  if (source === "cache") {
    snapshot = await getDocsFromCache(query);
  } else if (source === "server") {
    snapshot = await getDocsFromServer(query);
  } else {
    snapshot = await getDocs(query);
  }

  return snapshot;
}

function isNamedQuery<T>(query: QueryType<T>): query is NamedQuery<T> {
  return typeof query === "function";
}

export async function resolveQuery<T>(query: QueryType<T>): Promise<Query<T>> {
  if (isNamedQuery(query)) {
    if (typeof query === "function") {
      // Firebase throws an error if the query doesn't exist.
      const resolved = await query();
      return resolved!;
    }

    return query;
  }

  return query;
}

export * from "./useFirestoreDocument";
export * from "./useFirestoreDocumentData";
export * from "./useFirestoreInfiniteQuery";
export * from "./useFirestoreInfiniteQueryData";
export * from "./useFirestoreQuery";
export * from "./useFirestoreQueryData";
export * from "./mutations";
export * from "./namedQuery";
