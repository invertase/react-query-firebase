import React from 'react';
import { QueryClient, QueryClientProvider, setLogger } from "react-query";
import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

setLogger({
  log: console.log,
  warn: console.warn,
  // ✅ no more errors on the console
  error: () => {},
});

let emulatorsStarted = false;

export function init() {
  const firebase = initializeApp({
    projectId: "test-project",
  });

  const firestore = getFirestore(firebase);

  if (!emulatorsStarted) {
    connectFirestoreEmulator(firestore, "localhost", 8080);
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

  return { client, wrapper, firebase, firestore };
}
