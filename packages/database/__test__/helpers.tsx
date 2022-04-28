import React from "react";
import { QueryClient, QueryClientProvider, setLogger } from "react-query";
import firebase from "@react-native-firebase/app";
import database from "@react-native-firebase/database";

setLogger({
  log: console.log,
  warn: console.warn,
  // ✅ no more errors on the console
  error: () => null,
});

let emulatorsStarted = false;

export function genId(): string {
  return Math.random().toString(32).replace(".", "");
}

export async function init(): Promise<any> {
  const app = await firebase.initializeApp({
    appId: "foo",
    projectId: "test-project",
    apiKey: "foo",
  });

  const db = database(app);

  if (!emulatorsStarted) {
    db.useEmulator("localhost", 9000);
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

  return { client, wrapper, firebase, database: db };
}
