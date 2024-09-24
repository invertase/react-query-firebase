import { type FirebaseApp, FirebaseError, initializeApp } from "firebase/app";
import {
  getFirestore,
  connectFirestoreEmulator,
  type Firestore,
} from "firebase/firestore";
import { expect } from "vitest";

const firebaseTestingOptions = {
  projectId: "test-project",
};

let app: FirebaseApp | undefined;
let firestore: Firestore;

if (!app) {
  app = initializeApp(firebaseTestingOptions);
  firestore = getFirestore(app);

  connectFirestoreEmulator(firestore, "localhost", 8080);
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

export { firestore, wipeFirestore, expectFirestoreError };
