import { type FirebaseApp, initializeApp } from "firebase/app";
import {
  getFirestore,
  connectFirestoreEmulator,
  type Firestore,
} from "firebase/firestore";

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

export { firestore, wipeFirestore };
