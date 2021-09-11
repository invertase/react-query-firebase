import React from "react";
import { QueryClient, QueryClientProvider, setLogger } from "react-query";
import { renderHook } from "@testing-library/react-hooks";
import { doc, DocumentReference, Firestore } from "firebase/firestore";

import { useFirestoreDocumentMutation } from "../src/useFirestoreDocumentMutation";
import { init } from "./helpers";

describe("useFirestoreDocumentMutation", () => {
  let client: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;
  let ref: DocumentReference;

  beforeEach(() => {
    let { client, wrapper } = init();
    ref = doc({} as Firestore, 'foo');
  });

});
