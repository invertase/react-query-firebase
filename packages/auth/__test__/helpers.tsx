import React from "react";
import { QueryClient, QueryClientProvider, setLogger } from "react-query";
import firebase from "@react-native-firebase/app";
import { FirebaseAuthTypes } from "@react-native-firebase/auth";

type Auth = FirebaseAuthTypes.Module;
type UserCredential = FirebaseAuthTypes.UserCredential;

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

export async function signIn(auth: Auth): Promise<UserCredential> {
  return auth.createUserWithEmailAndPassword(`${genId()}@foo.com`, "123456");
}

export async function init(): Promise<any> {
  const app = await firebase.initializeApp({
    appId: "foo",
    projectId: "test-project",
    apiKey: "foo",
  });

  const auth = app.auth();

  if (!emulatorsStarted) {
    auth.useEmulator("localhost");
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
