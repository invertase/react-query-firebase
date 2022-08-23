/*
 * Copyright (c) 2016-present Invertase Limited & Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this library except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import * as React from "react";
import axios from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

let emulatorsStarted = false;

export function genId(): string {
  return Math.random().toString(32);
}

export function genInt(): number {
  return Math.floor(Math.random() * (5000 - 1 + 1) + 1);
}

export function init(): any {
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
    logger: {
      log: console.log,
      warn: console.warn,
      // ✅ no more errors on the console
      error: () => null,
    },
  });

  const wrapper = ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  return { client, wrapper, firebase, firestore };
}

export async function wipe(): Promise<void> {
  await axios(
    "http://localhost:8080/emulator/v1/projects/test-project/databases/(default)/documents",
    {
      method: "DELETE",
    }
  );
}
