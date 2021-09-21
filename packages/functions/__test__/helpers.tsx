import React from "react";
import { QueryClient, QueryClientProvider, setLogger } from "react-query";
import { initializeApp } from "firebase/app";
import { getFunctions } from "@firebase/functions";
import { connectFunctionsEmulator } from "firebase/functions";

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
    apiKey: "foo",
  });

  const functions = getFunctions(firebase);

  if (!emulatorsStarted) {
    connectFunctionsEmulator(functions, "localhost", 5001);
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

  return { client, wrapper, firebase, functions };
}
