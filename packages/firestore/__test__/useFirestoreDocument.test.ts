import React from "react";
import { QueryClient, QueryClientProvider, setLogger } from "react-query";
import { renderHook } from "@testing-library/react-hooks";
import {
  doc,
  DocumentReference,
  DocumentSnapshot,
  Firestore,
} from "firebase/firestore";

import { useFirestoreDocument } from "../src/useFirestoreDocument";
import { init } from "./helpers";

describe("useFirestoreDocumentMutation", () => {
  let client: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;
  let ref: DocumentReference;

  beforeEach(() => {
    let { client, wrapper } = init();
    ref = doc({} as Firestore, "foo");
  });

  test("it returns a cached snapshot", async () => {
    const { result, waitFor } = renderHook(
      () => useFirestoreDocument("foo", ref),
      { wrapper }
    );

    await waitFor(() => result.current.isSuccess);

    expect(result.current.data).toBeDefined();
    expect(result.current.data).toBeInstanceOf(DocumentSnapshot);
    const snapshot = result.current.data;
    expect(snapshot.metadata.fromCache).toBe(true);
  });
});
