import {
  Firestore,
  Query,
  namedQuery as firestoreNamedQuery,
} from "firebase/firestore";
import { NamedQuery } from "./index";

const namedQueryCache: { [key: string]: Query } = {};

export function namedQuery<T>(
  firestore: Firestore,
  name: string
): NamedQuery<T> {
  const key = `${firestore.app.name}:${name}`;

  if (namedQueryCache[key]) {
    return namedQueryCache[key] as Query<T>;
  }

  return () =>
    firestoreNamedQuery(firestore, name).then((query) => {
      if (query) {
        namedQueryCache[key] = query;
        return query as Query<T>;
      }

      return null;
    });
}
