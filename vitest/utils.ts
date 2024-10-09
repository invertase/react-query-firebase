import { type FirebaseApp, FirebaseError, initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  type Firestore,
} from "firebase/firestore";
import { expect } from "vitest";

const firebaseTestingOptions = {
  projectId: "test-project",
  apiKey: "test-api-key",
  authDomain: "test-auth-domain",
};

let app: FirebaseApp | undefined;
let firestore: Firestore;
let auth: Auth;

if (!app) {
  app = initializeApp(firebaseTestingOptions);
  firestore = getFirestore(app);
  auth = getAuth(app);

  connectFirestoreEmulator(firestore, "localhost", 8080);
  connectAuthEmulator(auth, "http://localhost:9099");
}

async function wipeFirestore() {
  const response = await fetch(
    "http://localhost:8080/emulator/v1/projects/test-project/databases/(default)/documents",
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to wipe firestore");
  }
}

async function wipeAuth() {
  const response = await fetch(
    "http://localhost:9099/emulator/v1/projects/test-project/accounts",
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to wipe auth");
  }
}

function expectFirestoreError(error: unknown, expectedCode: string) {
  if (error instanceof FirebaseError) {
    expect(error).toBeDefined();
    expect(error.code).toBeDefined();
    expect(error.code).toBe(expectedCode);
  } else {
    throw new Error(
      "Expected a Firestore error, but received a different type."
    );
  }
}

export {
  firestore,
  wipeFirestore,
  expectFirestoreError,
  firebaseTestingOptions,
  auth,
  wipeAuth,
};
