import React from "react";
import { QueryClient, QueryClientProvider, setLogger } from "react-query";
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";

setLogger({
  log: console.log,
  warn: console.warn,
  // ✅ no more errors on the console
  error: () => {},
});

let emulatorsStarted = false;

export function genId(): string {
  return Math.random().toString(32);
}

export function init() {
  const firebase = initializeApp({
    projectId: "test-project",
  });

  const auth = getAuth(firebase);

  if (!emulatorsStarted) {
    connectAuthEmulator(auth, "localhost:9099");
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

  return { client, wrapper, firebase, auth };
}
