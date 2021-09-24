import React from "react";
import { QueryClient, QueryClientProvider, setLogger } from "react-query";
import { initializeApp } from "firebase/app";
import { connectStorageEmulator, getStorage } from "firebase/storage";

setLogger({
  log: console.log,
  warn: console.warn,
  // ✅ no more errors on the console
  error: () => {},
});

let emulatorsStarted = false;

export function genId(): string {
  return Math.random().toString(32).replace(".", "");
}

export function init() {
  const firebase = initializeApp({
    projectId: "test-project",
    apiKey: "foo",
    storageBucket: "gs://default-bucket",
  });

  const storage = getStorage(firebase);

  if (!emulatorsStarted) {
    connectStorageEmulator(storage, "localhost", 9199);
    emulatorsStarted = true;
  }

  const client = new QueryClient({
    defaultOptions: {
      queries: {
        // ✅ turns retries off
        retry: false,
        cacheTime: 0,
      },
    },
  });

  const wrapper = ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  return { client, wrapper, firebase, storage };
}
